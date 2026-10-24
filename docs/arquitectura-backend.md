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

Dos capas: **dominio** (`src/modules/`, la lógica y las entidades) y **superficies** (`src/api/`, una carpeta por audiencia con sus controladores, DTOs y vistas). Las superficies no tienen lógica propia: arman el filtro de acceso a partir de la sesión, llaman al dominio y dan forma a la respuesta.

```
src/auth/            (hecho)  OTP simulado, JWT de acceso + refresco rotado, guards
src/modules/
  users/             (hecho)
  shops/             (hecho)  alta por admin, ajustes del taller; falta invitación al dueño, estado baja, perfil público
  clients/           (hecho)  clientes y vehículos por taller, vínculo con la cuenta, búsqueda de vehículos
  cars/              (hecho)  CarsService: alta, edición, costos, etapas, notas, QR, reportes; car-state.ts
  helpers/           (hecho)  alta con cuenta, tarifa, desactivar, pagos congelados y resumen semanal
  pricing/           (hecho)  funciones puras de dinero
  files/             (tabla)  falta la interfaz Storage y la subida
  notifications/     después  interfaz Notifier (push / WhatsApp)
  map/               fase 3   búsqueda por radio
src/api/
  shop/  helper/  client/  public/  admin/    (hecho) una superficie por audiencia
  common/                                     DTOs y vistas compartidas, shopOf(user)
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

- Hecho en `modules/cars/car-state.ts` (`checkTransition`, función pura con pruebas). No se aceptan saltos. Además del diagrama se permiten dos regresos: 3 → 2 (falta una pieza en plena reparación) y 4 → 3 (corregir antes de entregar). De Entregado no se sale.
- Pasar a **4 Listo** exige costos capturados (hay total).
- Cada cambio escribe una fila en `car_logs` con quién, cuándo, nota y fotos.
- Pueden cambiar el estado el dueño y el ayudante asignado (solo en sus coches). El ayudante solo lleva a Diagnóstico, Esperando refacción y En reparación; Listo y Entregado son del dueño.
- Al pasar a **5 Entregado** se llena `deliveredAt` y el QR deja de dar acceso.

### QR

- El token es del **servicio** (expediente), aleatorio y revocable. No sirve en la siguiente visita.
- Da acceso solo mientras el expediente está abierto. Después queda en el historial del cliente que lo escaneó.
- **Vinculación automática:** al verificar su teléfono con el código, la cuenta del cliente queda ligada a todos los `clients` (de cualquier taller) capturados con ese número (`ClientsService.linkAccount`, ya hecho). Si quien escanea no es el cliente registrado, no coincide el teléfono y no se liga nada.
- Cuando un taller capture un cliente nuevo cuyo teléfono ya tiene cuenta, el servicio de `clients` debe ligarlo en el momento (hoy solo se liga al iniciar sesión). **Todos los teléfonos se guardan normalizados** (`normalizePhone`, prefijo `52`); si no, el vínculo no coincide.
- `GET /public/q/:token` no exige sesión y devuelve solo el estado actual, con límite de peticiones.

### Dinero

Funciones puras en `modules/pricing/pricing.ts` (hecho, con pruebas), calculadas en centavos enteros y guardadas como `numeric(12,2)`. Los porcentajes se redondean al centavo (el frontend de hoy redondea a pesos; al conectarlo, el servidor manda):

- `subtotal` = suma de los precios al cliente.
- `iva` = subtotal × tasa (16 % por defecto, editable por taller; algunos no facturan).
- `total` = subtotal + iva.
- `ganancia` = subtotal − costo de refacciones − pago al ayudante − otros gastos.
- Pago al ayudante: fijo por coche, o porcentaje de la mano de obra.

### Pagos a ayudantes

Por coche, en `helper_payments` (taller, expediente, ayudante, monto, `paidAt`; hecho). Una fila por ayudante y coche. El monto se congela al entregar el coche (estado 5): mientras está abierto se calcula al vuelo con `pricing/`, y cambiar después la tarifa del ayudante no mueve lo ya entregado. `paidAt` null significa pendiente. "Mis pagos" de la semana se deriva de ahí. No se puede borrar un ayudante con historial de pagos.

### Archivos

Una sola tabla `files` (hecha) reemplaza `car_photos`, `car_logs.photos`, `cars.signaturePath` y `helpers.photo`. El tipo (`kind`) decide a qué pertenece y un `CHECK` lo obliga: entrada, pieza dañada, pieza nueva y firma → coche; avance → entrada de la bitácora; ayudante → ayudante; taller → perfil del taller. Hay una sola firma por expediente. Las referencias son compuestas (`(carId, shopId)`, `(carLogId, carId)`, `(helperId, shopId)`), así que la base rechaza archivos que mezclen talleres o coches. `visibleToClient` es falso por defecto. La clave en el almacenamiento la genera el servidor. El contenido vive detrás de una interfaz `Storage` (pendiente). Disco local al inicio. Las descargas pasan por autorización o URL firmada de vida corta; nunca se sirven como estáticos públicos.

## 4. Superficies de API por audiencia

| Prefijo | Quién | Qué ve |
|---|---|---|
| `/admin/...` | admin master | Talleres y conteos. Nunca expedientes, descripciones, fotos ni dinero. |
| `/shop/...` | dueño del taller | Todo lo de su taller. |
| `/helper/...` | ayudante | Solo sus coches, sin costos, y su propio pago. |
| `/client/...` | cliente | Su coche; el total solo desde el estado 4; fotos marcadas como visibles; sus propios datos. |
| `/public/q/:token` | sin sesión | Estado actual del coche. |

Cada superficie tiene su archivo `views.ts` con funciones que arman la respuesta campo por campo (`shopCarDetail`, `helperCarDetail`, `clientCarDetail`…). Nunca se serializa la entidad directamente: una columna nueva no puede aparecer sola en una respuesta de cliente.

### Endpoints (hechos)

| Superficie | Rutas |
|---|---|
| `/shop` (rol taller) | `GET/POST /shop/cars` (tablero: sin filtro, los que siguen en el taller; `?state=` una etapa), `GET/PATCH /shop/cars/:id`, `PUT /shop/cars/:id/costs`, `POST /shop/cars/:id/state`, `POST /shop/cars/:id/notes`, `POST /shop/cars/:id/qr` (regenera el QR), `GET /shop/vehicles?q=` (placas, VIN o teléfono), `GET /shop/vehicles/:id` (historial de visitas), `GET /shop/reports?from=&to=`, `GET/POST /shop/helpers`, `PATCH /shop/helpers/:id` (tarifa, nombre, `active`), `GET /shop/payments?helperId=&pending=`, `POST /shop/payments/:id/pay`, `GET/PATCH /shop/settings` (IVA, horario, especialidades) |
| `/helper` (rol ayudante) | `GET /helper/cars`, `GET /helper/cars/:id`, `POST /helper/cars/:id/state`, `POST /helper/cars/:id/notes`, `GET /helper/payments` (semana, pendiente, estimado en curso) |
| `/client` (rol cliente) | `GET /client/cars` (en curso y entregados, de cualquier taller), `GET /client/cars/:id`, `POST /client/cars/link` (escaneo del QR: solo si el teléfono de la cuenta es el del cliente) |
| `/public` (sin sesión) | `GET /public/q/:token` (etapa y línea de tiempo; 30 por minuto por IP) |
| `/admin` (rol admin) | `/admin/shops` (alta, lista, estado) y `GET /admin/stats` (solo conteos) |

Al crear un expediente, el cliente se busca por teléfono dentro del taller (o se crea) y, si ese teléfono ya tiene cuenta de cliente, queda ligado en el momento. El vehículo es nuevo (`vehicle`) o uno ya registrado (`vehicleId`, visita de regreso); si cambió de dueño, pasa al cliente capturado.

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

- **Privacidad por rol:** `test/support/privacy.ts` recorre el JSON de cada respuesta de `/helper`, `/client` y `/public/q` y falla si aparece una clave prohibida o un **valor sentinela** (importes y textos únicos sembrados por `test/support/fixture.ts`). Mirar valores atrapa filtraciones con otro nombre de campo. Ya hecho: el detector (con pruebas unitarias) y el fixture con dos talleres, dos ayudantes, clientes y coches en distintos estados. `test/privacy.e2e-spec.ts` recorre todas las superficies con una cuenta de cada rol. Se comprobó que detecta una filtración real metiendo a propósito la ganancia en la vista del ayudante (bajo otro nombre) y el total en la del cliente antes de Listo.
- **Flujo:** `test/shop-flow.e2e-spec.ts` cubre alta, visitas de regreso, validación, costos con cantidad e IVA del taller, etapas, entrega con pago congelado, reportes, pagos, ayudantes (alta, permisos, desactivación), QR (regenerar, vincular), escrituras entre talleres y el panel del admin. Incluye altas simultáneas (folios únicos, un solo cliente).
- **Aislamiento:** dos talleres sembrados; cada superficie debe devolver 404 para datos del otro.
- **Esquema:** referencias entre talleres rechazadas por la base (ya hecho).
- **Dinero y estados:** pruebas unitarias de `pricing/` y de la máquina de estados.

## 7. Orden de construcción

1. **Fase 0 (cerrar):** revisión de seguridad de `auth/`, invitación al dueño, estado `baja`, borrado de cuenta.
2. **Fase 1, esquema:** ~~clientes y vehículos, tabla `files`, `helper_payments`~~ (hecho).
3. ~~**Fase 1, lógica:** `pricing/` y máquina de estados, con pruebas~~ (hecho).
4. **Fase 1, API:** ~~pruebas de privacidad, `/shop`, `/helper`~~ (hecho) → fotos y firma (interfaz `Storage`, subida, descarga con autorización).
5. **Conectar el frontend** (reemplazar `store/app.tsx`).
6. **Fase 2:** ~~`/public/q`, vinculación del QR, `/client`~~ (hecho) → avisos (push / WhatsApp).
7. **Fase 3:** mapa por radio, perfil público, insignia de verificado, aprobación de presupuesto.
8. **Fase 4:** suscripción, recordatorios, inventario, calificaciones, modo sin internet (por eso los IDs deben poder generarse en el cliente y las escrituras ser idempotentes).
