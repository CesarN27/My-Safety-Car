import type { LatLng } from '@/lib/geo';
import type { ShopStatus } from '@/types';

export interface MapShop extends LatLng {
  id: string;
  name: string;
  status: ShopStatus;
}

/** Todo lo que el mapa necesita pintar; se manda completo cada vez que cambia. */
export interface MapState {
  shops: MapShop[];
  selectedId?: string;
  user?: LatLng | null;
  /** Punto elegido (alta de taller). */
  pin?: LatLng | null;
  /** Si es true, tocar el mapa manda las coordenadas tocadas. */
  pickable?: boolean;
}

export type MapEvent = { type: 'ready' } | { type: 'select'; id: string } | { type: 'pick'; lat: number; lng: number };

/** Origen identificable para las teselas de OpenStreetMap (su política exige un Referer propio). */
export const MAP_BASE_URL = 'https://github.com/CesarN27/My-Safety-Car';

/** Texto seguro para meter dentro de un script (evita cerrar la etiqueta o romper con U+2028/9). */
export const jsLiteral = (v: unknown) => {
  const bad = new Set([60, 8232, 8233]); // '<', U+2028, U+2029
  return [...JSON.stringify(v)]
    .map((ch) => (bad.has(ch.charCodeAt(0)) ? String.fromCharCode(92) + 'u' + ch.charCodeAt(0).toString(16).padStart(4, '0') : ch))
    .join('');
};

/**
 * Página con Leaflet + teselas de OpenStreetMap. La misma página corre en un WebView (iOS/Android)
 * y en un iframe (web); recibe el estado con `window.__setState` o por postMessage y avisa
 * con `{type:'ready' | 'select' | 'pick'}`.
 */
export const MAP_HTML = `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
  html, body, #m { height: 100%; margin: 0; background: #E9E6E1; }
  body { font-family: -apple-system, system-ui, sans-serif; }
  .pin-wrap { background: none; border: 0; }
  .pin { width: 26px; height: 26px; box-sizing: border-box; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
         border: 2.5px solid #0F0F0F; box-shadow: 0 2px 4px rgba(0,0,0,.35); }
  .pin.sel { border-color: #FF6B00; border-width: 3px; background: #0F0F0F !important; }
  .me { width: 16px; height: 16px; border-radius: 50%; background: #2563EB; border: 3px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,.25); }
  .err { padding: 24px; color: #5B5650; text-align: center; }
</style>
</head><body>
<div id="m"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  var send = function (m) {
    var s = JSON.stringify(m);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if (window.parent !== window) window.parent.postMessage(s, '*');
  };
  if (!window.L) {
    document.getElementById('m').innerHTML = '<div class="err">No se pudo cargar el mapa. Revisa tu conexión a internet.</div>';
    return;
  }
  var COLORS = { activo: '#FF6B00', pausado: '#9CA3AF', invitado: '#FFFFFF' };
  var map = L.map('m', { zoomControl: true }).setView([19.4326, -99.1332], 11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
  var layer = L.layerGroup().addTo(map);
  var shopsKey = '', selKey = '', pinKey = '', lastPick = null, current = { shops: [] };
  var touched = false, fitPts = [];
  var markTouched = function () { touched = true; };
  map.on('mousedown touchstart dragstart', markTouched);
  map.getContainer().addEventListener('wheel', markTouched, { passive: true });

  function fit() {
    if (fitPts.length === 1) map.setView(fitPts[0], 14);
    else if (fitPts.length > 1) map.fitBounds(fitPts, { padding: [40, 40], maxZoom: 15 });
  }

  function icon(html) { return L.divIcon({ className: 'pin-wrap', html: html, iconSize: [30, 30], iconAnchor: [15, 30] }); }

  window.__setState = function (st) {
    current = st;
    layer.clearLayers();
    var pts = [];
    (st.shops || []).forEach(function (s) {
      var sel = s.id === st.selectedId;
      var mk = L.marker([s.lat, s.lng], {
        icon: icon('<div class="pin' + (sel ? ' sel' : '') + '" style="background:' + (COLORS[s.status] || '#fff') + '"></div>'),
        zIndexOffset: sel ? 1000 : 0,
        title: s.name
      }).addTo(layer);
      var tip = document.createElement('span'); tip.textContent = s.name;
      mk.bindTooltip(tip, { direction: 'top', offset: [0, -28] });
      mk.on('click', function () { send({ type: 'select', id: s.id }); });
      pts.push([s.lat, s.lng]);
    });
    if (st.user) {
      L.marker([st.user.lat, st.user.lng], { icon: L.divIcon({ className: 'pin-wrap', html: '<div class="me"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }), interactive: false }).addTo(layer);
    }
    if (st.pin) {
      L.marker([st.pin.lat, st.pin.lng], { icon: icon('<div class="pin sel"></div>'), zIndexOffset: 2000, interactive: false }).addTo(layer);
    }
    var key = (st.shops || []).map(function (s) { return s.id; }).join(',') + '|' + (st.user ? 1 : 0);
    if (key !== shopsKey) {
      shopsKey = key;
      fitPts = pts.slice();
      if (st.user) fitPts.push([st.user.lat, st.user.lng]);
      touched = false;
      fit();
    }
    var sk = st.selectedId || '';
    if (sk !== selKey) {
      selKey = sk;
      var cur = (st.shops || []).filter(function (s) { return s.id === sk; })[0];
      if (cur) map.panTo([cur.lat, cur.lng]);
    }
    var pk = st.pin ? st.pin.lat + ',' + st.pin.lng : '';
    if (pk !== pinKey) {
      pinKey = pk;
      // Si el pin vino de tocar el mapa no hace falta mover la vista.
      if (st.pin && pk !== lastPick) map.setView([st.pin.lat, st.pin.lng], Math.max(map.getZoom(), 15));
    }
  };

  map.on('click', function (e) {
    if (!current.pickable) return;
    var lat = Math.round(e.latlng.lat * 1e6) / 1e6, lng = Math.round(e.latlng.lng * 1e6) / 1e6;
    lastPick = lat + ',' + lng;
    send({ type: 'pick', lat: lat, lng: lng });
  });

  window.addEventListener('message', function (e) {
    try { var m = JSON.parse(e.data); if (m && m.type === 'state') window.__setState(m.state); } catch (_) {}
  });
  // El contenedor puede medir distinto al cargar que ya acomodado: recalcula y re-encuadra mientras nadie mueva el mapa.
  var relayout = function () { map.invalidateSize(); if (!touched && !current.pin) fit(); };
  if (window.ResizeObserver) new ResizeObserver(relayout).observe(document.getElementById('m'));
  window.addEventListener('resize', relayout);
  send({ type: 'ready' });
})();
</script>
</body></html>`;
