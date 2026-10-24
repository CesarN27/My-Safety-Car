# Decisiones pendientes

Preguntas abiertas del proyecto. Cuando se resuelva una, se borra de aquí y se refleja en el código o en `CLAUDE.md`. Todo cambio que quede esperando una decisión se anota en este archivo.

## Negocio y producto

2. **Canal del login por teléfono.** ¿Código por WhatsApp (Twilio, requiere WhatsApp Business y plantillas aprobadas), por SMS, u otro? Mientras tanto el login se simula detrás de una interfaz.
3. **Formato del folio.** Es único por taller (`shopId, folio`). Falta definir cómo se genera: consecutivo por taller, con prefijo o año, y si puede reiniciarse.
4. **QR sin cuenta.** *Adoptado del PDF:* el QR abre una página web con el estado (`/public/q/:token`), ligar el coche exige verificar el teléfono, y el token caduca al entregar y se puede revocar. *Decidido:* el cliente se liga automáticamente al verificar un teléfono que coincide con `clients.phone` (hecho en `AuthService`). Pendiente: ligar también al capturar un cliente cuyo teléfono ya tiene cuenta, y la página web pública.
5. **Taller pausado, invitado y acceso.** Hoy un taller `pausado` bloquea a su dueño y a sus ayudantes (login y sesiones abiertas); `invitado` y `activo` pueden entrar. Falta confirmar si "invitado" debería poder operar antes de que el admin lo active, o si pausar solo debe quitarlo del mapa sin bloquear el acceso.
6. **Cuenta del dueño del taller.** Al dar de alta un taller se crea su cuenta con el teléfono del taller. Falta definir si el dueño tiene un teléfono propio distinto, y cómo se agregan más cuentas de taller (encargados) o más admins (hoy solo el inicial desde `ADMIN_PHONE`).

## Datos y esquema

0b. **Monto del pago al ayudante.** *Valor por defecto:* el monto se congela en `helper_payments` al entregar el coche (estado 5); mientras está abierto se calcula al vuelo. Confirmar si el dueño debe poder pagar antes de entregar (anticipos) o ajustar el monto a mano.

0. **Clientes y vehículos por taller.** Hechos así para que el domicilio y teléfono de un taller no lleguen a otro; el historial entre talleres se arma por `clients.userId` y se agrupa por VIN o placas. Los vehículos sin VIN ni placas quedan como filas separadas (sin restricción de unicidad); decidido.

8. **Taller del ayudante duplicado.** Vive en `users.shopId` y en `helpers.shopId`, y nada impide que difieran. Una restricción `CHECK` ya exige que taller y ayudante tengan taller y que admin y cliente no. Propuesta: derivar el taller del ayudante solo desde `helpers`.
9. **Dinero en el servidor.** `numeric(12,2)` en la base. ¿Calcular con centavos enteros o con una librería decimal? Evita errores de redondeo en IVA y porcentajes.
10. **Almacenamiento de archivos.** Disco local detrás de una interfaz `Storage`. Pendiente: cuándo migrar a S3 o R2 y quién respalda los archivos.
9. *Menor:* los UUID usan `uuid_generate_v4()` (extensión); Postgres 17 trae `gen_random_uuid()` sin extensión. `updatedAt` quedó sin zona horaria, a diferencia de `deliveredAt`.

## Seguridad (revisar con la skill `claude-security`)

11. **Revisión de la auth recién escrita.** Pendiente pasar el módulo `auth/` por `claude-security` (código OTP, rotación de refresh tokens, guards).

12. **Escaneo de seguridad del repositorio.** Se canceló al lanzarlo (el usuario rechazó la ejecución del flujo). Pendiente repetirlo sobre el commit actual.
13. **Autenticación y sesiones.** Hecho con valores por defecto: acceso 15 min, refresco 30 días (rotado), 5 intentos por minuto y por IP en las rutas de acceso. Pendiente: confirmar esos tiempos, contar intentos fallidos por teléfono (el código real necesitará expirar y bloquearse tras varios fallos), y orígenes permitidos por CORS (aún no configurado). El límite de peticiones se desactiva en pruebas (`NODE_ENV=test`), así que no hay prueba automática del throttling.
14. **Pruebas de privacidad por rol.** Las de acceso por rol a `/admin/shops` ya existen; faltan las de datos de expedientes, que se escriben antes de esos endpoints: cliente y ayudante nunca reciben `cost`, `profit` ni gastos; un taller no ve datos de otro.

## Infraestructura

15. **Hosting.** Local por ahora (Docker). Pendiente: dónde se despliega, cómo se respaldan los datos y cómo se manejan los secretos fuera de `.env`.
16. **Escaneos con Workflows.** Cada ejecución de un workflow (por ejemplo el escaneo de `claude-security`) pide aprobación. Decidir si se permite de forma fija para este proyecto.

## Frontend

17. **Pestaña "Salir" en la barra nativa.** Las tabs ahora son `NativeTabs` (Liquid Glass en iOS 26+, Material en Android) y `salir` sigue como pestaña para no cambiar el comportamiento. En una barra nativa es raro que una pestaña sea una acción: pendiente moverla a un botón de encabezado o a un perfil. También pendiente verificar en dispositivo con iOS 26 y Android que el `Redirect` por rol y el aspecto en web se vean bien; `unstable-native-tabs` puede cambiar entre versiones menores del SDK.
