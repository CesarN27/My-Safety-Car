import { useCallback, useEffect, useRef, useState } from 'react';

import { MAP_HTML, type MapEvent, type MapState } from '@/components/osm-html';

/** Web: la misma página de Leaflet dentro de un iframe, hablando por postMessage. */
export function MapSurface({ state, onEvent }: { state: MapState; onEvent: (e: MapEvent) => void }) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const setRef = useCallback((el: HTMLIFrameElement | null) => {
    ref.current = el;
  }, []);
  const [ready, setReady] = useState(false);
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  });

  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow || typeof e.data !== 'string') return;
      try {
        const m = JSON.parse(e.data) as MapEvent;
        if (m.type === 'ready') setReady(true);
        else handler.current(m);
      } catch {
        // mensajes que no son nuestros
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  useEffect(() => {
    if (ready) ref.current?.contentWindow?.postMessage(JSON.stringify({ type: 'state', state }), '*');
  }, [ready, state]);

  return (
    <iframe
      ref={setRef}
      srcDoc={MAP_HTML}
      title="Mapa de OpenStreetMap"
      style={{ border: 0, width: '100%', height: '100%', flex: 1, display: 'block' }}
    />
  );
}
