/** Web: abre la hoja sola en una pestaña e imprime; desde ahí también se puede "Guardar como PDF". */
export async function printSheet(html: string) {
  const w = window.open('', '_blank');
  if (!w) throw new Error('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes.');
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

export const sharePdf = printSheet;
