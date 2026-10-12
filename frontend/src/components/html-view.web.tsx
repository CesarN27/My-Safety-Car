/** Web: la hoja dentro de un iframe. */
export function HtmlView({ html }: { html: string }) {
  return <iframe srcDoc={html} title="Vista previa de la hoja" style={{ border: 0, width: '100%', height: '100%', flex: 1, display: 'block', background: '#fff' }} />;
}
