# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Tecnocar-Pro: app para talleres mecánicos con cuatro roles (admin master, taller, ayudante, cliente). El repo está dividido en dos carpetas:

- `frontend/` — app Expo (SDK 57, Expo Router, TypeScript, React Compiler). Funciona hoy.
- `backend/` — API NestJS 12 (ESM, `"type": "module"`, imports con `.js`) + TypeORM + PostgreSQL 17 en Docker. Hecho: esqueleto, esquema (`shops`, `users`, `helpers`, `clients`, `vehicles`, `cars`, `cost_items`, `car_logs`, `car_photos`) con restricciones `CHECK` e índices (4 migraciones), arranque endurecido (`helmet`, `ValidationPipe` con whitelist, `.env` obligatorio y validado, Postgres solo en `127.0.0.1`). Auth hecha: login por teléfono con código simulado (`OtpProvider`), JWT de acceso + refresco rotado, guards globales (throttler → sesión → rol) y alta de talleres por el admin (`/admin/shops`). Falta, en orden: endpoints de expedientes/costos/bitácora (respuesta distinta por rol) → fotos y firma (disco local detrás de una interfaz `Storage`) → conectar el frontend → login real por teléfono (canal sin definir; hoy `DevOtpProvider`).

La arquitectura planeada del backend (módulos, superficies de API por rol, fases) está en `docs/arquitectura-backend.md`; el PDF de requerimientos es `docs/especificacion-app-taller.pdf` (César, 7 oct 2026). Las preguntas abiertas viven en `docs/decisiones-pendientes.md`: si una decisión queda sin resolver, usa un valor por defecto razonable y anótala ahí. Los temas de seguridad se atienden con la skill `claude-security:claude-security`.

La documentación y los textos de UI están en español; mantenlo así.

## Comandos (correr desde `frontend/`)

```bash
npm install
npx expo start          # dev server (a/w/i desde una terminal interactiva; en CI=1 no recarga)
npx expo lint
npx tsc --noEmit        # typecheck
npx expo install <pkg>  # SIEMPRE en lugar de npm install <pkg>: resuelve la versión del SDK
npx expo install --fix  # corrige versiones incompatibles
```

No hay tests. Corre lint y typecheck antes de dar algo por terminado. `frontend/AGENTS.md` pide consultar los docs versionados de Expo (`https://docs.expo.dev/versions/v57.0.0/`) antes de tocar APIs de Expo/RN, porque cambian entre SDKs.

Si `npm install` falla con ERESOLVE entre paquetes `expo-*`, casi seguro `package.json` quedó con versiones mezcladas de SDKs distintos (pasó una vez); restaura al commit y usa `expo install`.

## Comandos del backend (correr desde `backend/`)

```bash
cp .env.example .env     # una vez
npm run db:up            # Postgres (docker compose); db:down lo apaga
npm run migration:run    # aplica migraciones (compila antes con nest build)
npm run migration:generate -- src/database/migrations/<Nombre>   # tras cambiar entidades
npm run start:dev        # API en :3000 (también corre migraciones al arrancar)
npm run lint && npm test # oxlint y vitest (unitarias); un solo test: npx vitest run <archivo>
npm run db:test:create   # una vez: crea la base tecnocar_test
npm run test:e2e         # compila con tsc y corre las e2e contra tecnocar_test (se recrea sola)
```

Detalles no obvios del backend:
- La CLI de TypeORM corre sobre `dist/` (compilado), no sobre `src/`: `tsx` no emite metadatos de decoradores. Por eso los scripts `migration:*` hacen `nest build` primero y el glob de migraciones es `*.js`.
- En las entidades, toda propiedad de relación tipada como entidad va envuelta en `Relation<...>` (`import { type Relation }`); si no, los imports circulares en ESM fallan con "Cannot access 'X' before initialization".
- `synchronize` está siempre apagado: el esquema cambia solo con migraciones. Los `numeric` de Postgres se convierten a `number` con `common/numeric.transformer.ts`.
- Toda ruta exige sesión salvo las marcadas `@Public()`; los permisos por rol van con `@Roles(...)`. El guard lee rol y taller de la base en cada petición (no del JWT), por eso pausar un taller o desactivar una cuenta corta el acceso al instante. Cualquier ruta nueva con datos de un taller debe filtrar por `user.shopId`.
- Las e2e se compilan con `tsc` (`tsconfig.e2e.json`), no con esbuild/swc: hacen falta los metadatos de decoradores, y SWC no carga en esta máquina por permisos de `/home/miguel`. Solo corren contra una base cuyo nombre termina en `_test` (`dbConfig` lo exige y recrea el esquema).
- `clients` y `vehicles` son por taller (no globales) y `cars`/`vehicles` los referencian con claves foráneas compuestas `(id, shopId)`: la base rechaza mezclar talleres. El historial del cliente entre talleres se arma por `clients.userId`.
- La configuración de base de datos vive en `src/database/db-config.ts` y la comparten Nest y la CLI.

## Arquitectura del frontend

- **Rutas** en `frontend/src/app/` (Expo Router, `typedRoutes` activo). Un grupo por rol: `admin/`, `taller/`, `ayudante/`, `cliente/` (cada uno con su `_layout.tsx` de tabs), más pantallas de detalle compartidas en la raíz de `app/` (`expediente/[id]`, `costos/[id]`, `actualizar/[id]`, `listo/[id]`, `qr/[id]`, `q/[token]`, …). Alias `@/` → `frontend/src/`.
- **Estado**: todo en un único `useReducer` en `src/store/app.tsx` (`AppProvider`/`useStore`), en memoria y sembrado desde `src/data/seed.ts`. Ahí vive `role` (el "login" actual es solo `signIn(role)`), y las acciones (`addCar`, `saveCosts`, `setProgress`, `linkCarByToken`, …). Este archivo es lo que el backend va a reemplazar con llamadas a la API.
- **Modelo de dominio** en `src/types.ts`: `Car` (expediente) agrupa inspección de 15 puntos, golpes, costos, bitácora (`LogEntry`) y estado `CarState` 0–5.
- **Dinero** en `src/lib/money.ts`: IVA 16 %, total, ganancia y pago de ayudante (fijo o porcentaje de la mano de obra) se derivan de los `CostItem`; nunca se guardan. Al hacer el backend este cálculo debe vivir en el servidor.
- **Mapas**: OpenStreetMap vía WebView (`osm-map.tsx`, `osm-html.ts`) con variantes por plataforma (`map-surface.tsx` / `map-surface.web.tsx`).
- **QR**: el link `tallerapp://q/<token>` abre `q/[token].tsx`, que entra como cliente y liga el coche con `linkCarByToken`.

## Reglas de negocio que el backend debe imponer (hoy solo se ocultan en la UI)

1. El **cliente** solo ve el total; el **ayudante** nunca ve costos ni ganancia. Plan: rutas y formas de respuesta distintas por rol (no el mismo endpoint ocultando campos) y pruebas que verifiquen que esos roles jamás reciben `cost`, `profit` ni gastos.
2. Un taller no puede ver datos de otro (filtro de taller obligatorio en cada consulta).
3. El token del QR debe ser aleatorio y revocable.
4. El admin da de alta talleres y los activa/pausa (`ShopStatus`).
