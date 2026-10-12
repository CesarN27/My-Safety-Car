/**
 * Canal que envía y comprueba el código de acceso. El canal real (WhatsApp, SMS…) está
 * pendiente de decidir (docs/decisiones-pendientes.md); el resto de la app solo conoce esto.
 */
export abstract class OtpProvider {
  abstract send(phone: string): Promise<void>;
  abstract verify(phone: string, code: string): Promise<boolean>;
}
