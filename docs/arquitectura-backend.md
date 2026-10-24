# Arquitectura del backend

Base: `docs/especificacion-app-taller.pdf` (César, 7 oct 2026) más lo ya construido en `backend/`. Las preguntas abiertas viven en `decisiones-pendientes.md`.

## 1. Principios

1. **Privacidad en el servidor.** El cliente ve el total, nunca el desglose ni la ganancia. El ayudante nunca ve costos. El admin master solo ve conteos. Una app se puede inspeccionar, así que ocultar campos en la pantalla no cuenta.
2. **Una superficie de API por audiencia**, no un endpoint con campos ocultos (sección 4).
3. **Aislamiento entre talleres** en tres capas: el `shopId` sale de la sesión (nunca del body), los repositorios lo exigen y la base rechaza referencias que crucen talleres (claves foráneas compuestas).
4. **El dinero se calcula en el servidor** con funciones puras y probadas; nunca se guarda lo derivado.
5. **Monolito modular NestJS** sobre PostgreSQL. Lo que cambia por entorno (OTP, almacenamiento, avisos) va detrás de una interfaz.

## 2. Desviación respecto al PDF

El PDF recomienda Flutter + Supabase, y su argumento principal es el RLS de PostgreSQL. Ya construimos Expo + NestJS + Postgres, así que esa garantía la damos con DTOs por rol, filtros por taller obligatorios, claves foráneas compuestas y pruebas con cuentas de cada rol (sección 6). No usamos RLS de Postgres por ahora; si más adelante se quiere una segunda capa, es compatible con este diseño.

## 3. Módulos

```
modules/
  auth/          (hecho)    OTP simulado, JWT de acceso + refresco rotado, guards
  users/         (hecho)
  shops/         (hecho, ampliar)  alta por admin; falta invitación al dueño, estado baja, perfil público
  clients/       (hecho)    clientes y vehículos por taller
  cars/          (entidades hechas) expedientes, costos, bitácora; faltan servicios y controladores
  helpers/       (entidad hecha, ampliar)  asignación y pagos por coche
  pricing/       pendiente  funciones puras de dinero
  files/         pendiente  interfaz Storage (disco local → S3/R2) y tabla `files`
  public/        pendiente  GET /public/q/:token, sin sesión
  notifications/ después    interfaz Notifier (push / WhatsApp)
  reports/       después    ingresos, gastos y ganancia por semana o mes
  map/           fase 3     búsqueda por radio
```

### Modelo de datos

```
shops ──< users (taller, ayudante)         clients ──< vehicles
  │                                          │            │
  ├──< helpers                               └────────┐   │
  ├──< clients (por taller)                           ▼   ▼
  ├──< vehicles (por taller)                        cars (expediente)
  └──< cars ──< cost_items                            ├──< car_logs (cambio de estado)
                ├──< car_logs                         ├──< files (fotos y firma)  [pendiente]
                └──< helper_payments [pendiente]      └── qrToken
```

**Clientes y vehículos son por taller, a propósito.** Nombre, teléfono y domicilio del cliente los ve solo el taller que los capturó y la propia cuenta del cliente. Un `clients` compartido entre talleres habría filtrado esos datos de un taller a otro.

- `clients(shopId, phone)` es único: el mismo teléfono es un cliente distinto en cada taller.
- `clients.userId` liga al cliente con su cuenta de la app. Se llena cuando verifica su teléfono; ese vínculo es lo que arma su historial entre talleres.
- `vehicles` pertenece a un cliente de un taller. Sus expedientes son el historial de visitas de ese coche en ese taller.
- `cars` (expediente) guarda `vehicleId` y `clientId`. El `clientId` es el dueño *al momento del servicio*, aunque el vehículo cambie de dueño después. Conserva `km` porque es el kilometraje de esa visita.
- **Historial del cliente entre talleres:** se consulta por `clients.userId = <cuenta>` y se agrupa en la respuesta por VIN o placas. No hay una fila global de vehículo.

**Claves foráneas compuestas.** `vehicles(clientId, shopId)` → `clients(id, shopId)`, y `cars(vehicleId, shopId)` y `cars(clientId, shopId)` apuntan igual. La base rechaza un expediente que mezcle talleres aunque el código tenga un error. Está cubierto en `test/clients-vehicles.e2e-spec.ts`.

### Máquina de estados

```
0 Recibido → 1 Diagnóstico → 3 En reparación → 4 Listo → 5 Entregado
                  └→ 2 Esperando refacción ─┘ (llega la pieza → 3)
```

- Las transiciones se validan en el servidor; no se aceptan saltos.
- Pasar a **4 Listo** exige costos capturados (hay total).
- Cada cambio escribe una fila en `car_logs` con quién, cuándo, nota y fotos.
- Pueden cambiar el estado el dueño y el ayudante asignado (solo en sus coches).
- Al pasar a **5 Entregado** se llena `deliveredAt` y el QR deja de dar acceso.

### QR

- El token es del **servicio** (expediente), aleatorio y revocable. No sirve en la siguiente visita.
- Da acceso solo mientras el expediente está abierto. Después queda en el historial del cliente que lo escaneó.
- Si quien escanea no es el cliente registrado, se pide confirmar con un código al teléfono que el cliente dio en el taller.
- `GET /public/q/:token` no exige sesión y devuelve solo el estado actual, con límite de peticiones.

### Dinero

Funciones puras en `pricing/`, calculadas en centavos enteros y guardadas como `numeric(12,2)`:

- `subtotal` = suma de los precios al cliente.
- `iva` = subtotal × tasa (16 % por defecto, editable por taller; algunos no facturan).
- `total` = subtotal + iva.
- `ganancia` = subtotal − costo de refacciones − pago al ayudante − otros gastos.
- Pago al ayudante: fijo por coche, o porcentaje de la mano de obra.

### Pagos a ayudantes

Por coche, en una tabla `helper_payments` (expediente, ayudante, monto, pagado, fecha). "Mis pagos" de la semana se deriva de ahí. Reemplaza el booleano `helpers.paid`.

### Archivos

Una sola tabla `files` (dueño, tipo: entrada / pieza dañada / pieza nueva / firma / avance, `visibleToClient`) detrás de una interfaz `Storage`. Disco local al inicio. Las descargas pasan por autorización o URL firmada de vida corta; nunca se sirven como estáticos públicos.

## 4. Superficies de API por audiencia

| Prefijo | Quién | Qué ve |
|---|---|---|
| `/admin/...` | admin master | Talleres y conteos. Nunca expedientes, descripciones, fotos ni dinero. |
| `/shop/...` | dueño del taller | Todo lo de su taller. |
| `/helper/...` | ayudante | Solo sus coches, sin costos, y su propio pago. |
| `/client/...` | cliente | Su coche; el total solo desde el estado 4; fotos marcadas como visibles; sus propios datos. |
| `/public/q/:token` | sin sesión | Estado actual del coche. |

Cada superficie tiene sus clases de respuesta (`CarForShop`, `CarForHelper`, `CarForClient`) y un mapper explícito. Nunca se serializa la entidad directamente: un campo nuevo en la entidad no puede aparecer solo en una respuesta de cliente.

Matriz de privacidad (del PDF):

| Dato | Admin | Dueño | Ayudante | Cliente |
|---|---|---|---|---|
| Estado e historial | solo conteos | sí | sus coches | su coche |
| Descripción del servicio | no | sí | sí | versión para cliente |
| Total a pagar | no | sí | no | sí |
| Desglose de refacciones y mano de obra | no | sí | no | no |
| Costo de refacciones para el taller | no | sí | no | no |
| Pago al ayudante | no | sí | solo el suyo | no |
| Ganancia libre | no | sí | no | no |
| Domicilio del cliente | no | sí | no | los suyos |
| Fotos del coche | no | sí | sí | las marcadas como visibles |

El INE no se guarda en la app (decisión del PDF: mejor no pedirlo).

## 5. Seguridad y cumplimiento

- Guards globales en este orden: throttler → sesión → rol. El rol y el taller se leen de la base en cada petición (pausar un taller o desactivar una cuenta corta el acceso al instante).
- Aviso de privacidad (LFPDPPP) y borrado de cuenta (`DELETE /me`, con anonimización) desde el MVP: las tiendas de apps los exigen.
- Todo tema de seguridad se revisa con la skill `claude-security:claude-security`.

## 6. Pruebas

- **Privacidad por rol:** un helper de e2e recorre el JSON de cada respuesta de `/helper` y `/client` y falla si aparece cualquier clave de costo, ganancia, proveedor o gasto. Se escribe **antes** de los endpoints.
- **Aislamiento:** dos talleres sembrados; cada superficie debe devolver 404 para datos del otro.
- **Esquema:** referencias entre talleres rechazadas por la base (ya hecho).
- **Dinero y estados:** pruebas unitarias de `pricing/` y de la máquina de estados.

## 7. Orden de construcción

1. **Fase 0 (cerrar):** revisión de seguridad de `auth/`, invitación al dueño, estado `baja`, borrado de cuenta.
2. **Fase 1, esquema:** ~~clientes y vehículos~~ (hecho), tabla `files`, `helper_payments`.
3. **Fase 1, lógica:** `pricing/` y máquina de estados, con pruebas.
4. **Fase 1, API:** pruebas de privacidad → `/shop` (expedientes, costos, bitácora, tablero, ayudantes, reportes) → `/helper` → fotos y firma.
5. **Conectar el frontend** (reemplazar `store/app.tsx`).
6. **Fase 2:** `/public/q`, vinculación del QR con verificación por teléfono, `/client`, avisos.
7. **Fase 3:** mapa por radio, perfil público, insignia de verificado, aprobación de presupuesto.
8. **Fase 4:** suscripción, recordatorios, inventario, calificaciones, modo sin internet (por eso los IDs deben poder generarse en el cliente y las escrituras ser idempotentes).
