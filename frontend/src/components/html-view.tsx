import { WebView } from 'react-native-webview';

/** Vista previa de la hoja (HTML local) en iOS/Android. La versión web usa un iframe. */
export function HtmlView({ html }: { html: string }) {
  return (
    <WebView
      source={{ html }}
      originWhitelist={['*']}
      style={{ flex: 1, backgroundColor: '#fff' }}
      accessibilityLabel="Vista previa de la hoja"
    />
  );
}
