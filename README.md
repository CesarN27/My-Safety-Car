# Tecnocar-Pro (app Taller–Cliente)

App móvil con Expo (SDK 57, Expo Router, TypeScript) que implementa las pantallas del diseño: admin master, taller, ayudante y cliente.

## Correrla

```bash
npm install
npx expo start
```

Abre el QR con la app **Expo Go** (Android o iOS) o presiona `w` para verla en el navegador.
La cámara (escanear QR, fotos) funciona en el teléfono; en el navegador usa la galería.

## Qué hay

| Rol | Pantallas |
| --- | --- |
| Inicio | Entrada y elegir rol (el acceso con código por WhatsApp llega con el servidor) |
| Admin master | Talleres con mapa y filtros, detalle (activar/pausar), alta de taller, panel de conteos |
| Taller | Tablero por estado, nuevo expediente en 4 pasos (datos, inspección de 15 puntos y gasolina, fotos y golpes, servicio y firma), expediente, costos con ganancia, QR real, ayudantes con foto y pagos, reportes |
| Ayudante | Mis coches, actualizar avance con nota y fotos, mis pagos (nunca ve costos ni ganancia) |
| Cliente | Escanear QR con la cámara, estado del coche con historial, pantalla de "listo" con solo el total, mapa de talleres (fase 3) |

Los cambios de estado, costos y asignaciones se reflejan entre roles dentro de la sesión: crea un coche como taller, mándalo a "Listo" y míralo como cliente.

## Estructura

```
src/app/            rutas (Expo Router): (admin), (taller), (ayudante), (cliente) y pantallas de detalle
src/components/     UI de la marca, mapa de ejemplo, fotos, firma, línea de tiempo
src/store/app.tsx   estado de la app (en memoria)
src/data/seed.ts    datos de ejemplo
src/lib/money.ts    subtotal, IVA, total y ganancia libre
```

## Lo que todavía es de mentira

- **Sin servidor:** los datos viven en memoria y se pierden al cerrar la app. El siguiente paso es Supabase (login por teléfono, base de datos y reglas de acceso por fila para que el cliente nunca pueda leer el desglose ni la ganancia).
- **Mapa:** es un dibujo de ejemplo. En la fase 3 se cambia por un mapa real con búsqueda por distancia.
- **QR:** ya es un QR real, pero abre la app por su esquema (`tallerapp://q/<token>`). Con el servidor será un link web que muestra el estado aunque el cliente no tenga la app.
- **Avisos** por WhatsApp o push, impresión de la orden y modo sin internet: fases siguientes.
- El nombre "Tecnocar-Pro", los iconos y el splash son provisionales.

## Notas

- Instala librerías con `npx expo install <paquete>` para que queden en la versión del SDK.
- Antes de entregar cambios: `npx tsc --noEmit` y `npx expo lint`.
