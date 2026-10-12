import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/** Abre el diálogo de impresión del sistema (AirPrint en iPhone) con la hoja. */
export async function printSheet(html: string) {
  await Print.printAsync({ html });
}

/** Genera el PDF y abre el menú de compartir (WhatsApp, correo, Archivos…). */
export async function sharePdf(html: string) {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Hoja de recepción' });
  }
}
