import { type INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

/** Configuración común de la app; la usan main.ts y las pruebas e2e. */
export function setupApp(app: INestApplication) {
  app.use(helmet());
  // Descarta campos no declarados en los DTO y rechaza los desconocidos.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
