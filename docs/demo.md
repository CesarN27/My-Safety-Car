# Cómo correr la demo

App (Expo) conectada a la API (NestJS + Postgres) con datos de ejemplo. El login es simulado: cualquier teléfono registrado entra con el código de `DEV_OTP_CODE` (`123456` en `.env.example`).

## 1. Backend

```bash
cd backend
cp .env.example .env          # una vez (incluye STORAGE_DIR para las fotos)
npm install
npm run db:up                 # Postgres en Docker
npm run migration:run
npm run db:seed:demo          # talleres, ayudantes, clientes y expedientes de ejemplo
npm run start:dev             # API en http://localhost:3000
```

`db:seed:demo` no hace nada si los datos ya existen. Para empezar de cero hay que borrar la base de desarrollo (`npm run db:down`, borrar el volumen de Docker y repetir).

## 2. Frontend

```bash
cd frontend
cp .env.example .env.local    # EXPO_PUBLIC_API_URL
npm install
npx expo start                # w = web, i = iOS, a = Android
```

En un **teléfono físico** (Expo Go o development build), `localhost` es el propio teléfono: pon en `.env.local` la IP de tu computadora en la red local (`EXPO_PUBLIC_API_URL=http://192.168.x.x:3000`) y recarga la app.

## 3. Cuentas de la demo

| Rol | Teléfono | Qué ver |
|---|---|---|
| Admin master | `5500000000` (`ADMIN_PHONE`) | 5 talleres (3 activos, 1 pausado, 1 invitado), activar/pausar, alta de taller, conteos |
| Taller (César, Tecnocar-Pro) | `55 1000 0001` | Tablero con 3 coches en el taller y 1 entregado, nuevo expediente con fotos y firma, costos, etapas, QR, ayudantes y pagos pendientes, reportes |
| Ayudante José Luis | `55 6610 2231` | Su CR-V en reparación, notas y fotos de avance, sus pagos (sin dinero del taller) |
| Ayudante Miguel Ángel | `55 9042 1187` | Jetta en diagnóstico, cobra por porcentaje |
| Cliente Laura | `55 3021 7788` | CR-V en reparación (sin total aún) y Figo entregado (historial) |
| Cliente Jorge | `55 7788 1122` | Versa listo para entrega: ve solo el total |

Un cliente nuevo entra con cualquier teléfono: si el taller lo capturó con ese número, sus coches aparecen solos.

## Recorrido sugerido

1. **Taller:** nuevo expediente (datos, inspección, 4 fotos y tablero, firma) → se genera el folio y el QR.
2. **Taller:** asignar ayudante, capturar costos (subtotal, IVA, ganancia calculados por el servidor).
3. **Ayudante:** pasar a En reparación con nota y foto; intentar marcar Listo (no puede).
4. **Taller:** marcar Listo → **cliente** ve el total; marcar Entregado → el pago del ayudante queda pendiente en Ayudantes.
5. **Cliente:** entrar con el teléfono que se capturó en el expediente: el coche ya aparece ligado, con su línea de tiempo y las fotos visibles.

## Límites conocidos de la demo

- La sesión vive en memoria: al cerrar o recargar la app hay que volver a entrar.
- Se permiten 5 inicios de sesión por minuto por IP; si cambias de cuenta muy rápido, espera un minuto.
- Los escaneos OBD se ven en el expediente pero no se guardan en el servidor (pendiente 10).
- El código de acceso no se envía por WhatsApp/SMS todavía (pendiente 1).
