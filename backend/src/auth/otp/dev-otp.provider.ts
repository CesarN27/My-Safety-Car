import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { OtpProvider } from './otp-provider.js';

/** Solo desarrollo: no envía nada y acepta un código fijo definido en DEV_OTP_CODE. */
@Injectable()
export class DevOtpProvider extends OtpProvider {
  private readonly logger = new Logger(DevOtpProvider.name);
  private readonly code: string;

  constructor(config: ConfigService) {
    super();
    if (config.get('NODE_ENV') === 'production') {
      throw new Error(
        'DevOtpProvider no puede usarse en producción: configura un canal real',
      );
    }
    this.code = config.getOrThrow<string>('DEV_OTP_CODE');
    this.logger.warn(
      'Login simulado: cualquier teléfono entra con el código fijo de DEV_OTP_CODE',
    );
  }

  async send(): Promise<void> {}

  async verify(_phone: string, code: string): Promise<boolean> {
    const a = Buffer.from(code);
    const b = Buffer.from(this.code);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
