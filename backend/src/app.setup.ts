import { type INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

/** Configuración común de la app; la usan main.ts y las pruebas e2e. */
export function setupApp(app: INestApplication) {
  // cross-origin: la app web (otro origen) muestra las fotos que sirve la API.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  // La sesión viaja en el encabezado Authorization (no en cookies), así que CORS no expone
  // sesiones ajenas. Con CORS_ORIGINS se limita a esos orígenes; sin ella, en desarrollo, a todos.
  const origins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim());
  app.enableCors({
    origin: origins?.length ? origins : process.env.NODE_ENV !== 'production',
    allowedHeaders: ['Authorization', 'Content-Type'],
  });
  // Descarta campos no declarados en los DTO y rechaza los desconocidos.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
