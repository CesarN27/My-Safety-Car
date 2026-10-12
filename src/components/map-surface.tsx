import { useEffect, useRef, useState } from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { MAP_BASE_URL, MAP_HTML, jsLiteral, type MapEvent, type MapState } from '@/components/osm-html';

/** iOS/Android: Leaflet + OpenStreetMap dentro de un WebView. La versión web está en map-surface.web.tsx. */
export function MapSurface({ state, onEvent }: { state: MapState; onEvent: (e: MapEvent) => void }) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const payload = jsLiteral(state);

  useEffect(() => {
    if (ready) ref.current?.injectJavaScript(`window.__setState(${payload}); true;`);
  }, [ready, payload]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data) as MapEvent;
      if (m.type === 'ready') setReady(true);
      else onEvent(m);
    } catch {
      // mensajes que no son nuestros
    }
  };

  return (
    <WebView
      ref={ref}
      source={{ html: MAP_HTML, baseUrl: MAP_BASE_URL }}
      originWhitelist={['*']}
      onMessage={onMessage}
      javaScriptEnabled
      domStorageEnabled
      nestedScrollEnabled
      scrollEnabled={false}
      bounces={false}
      setSupportMultipleWindows={false}
      style={{ flex: 1, backgroundColor: '#E9E6E1' }}
      accessibilityLabel="Mapa de OpenStreetMap"
    />
  );
}
