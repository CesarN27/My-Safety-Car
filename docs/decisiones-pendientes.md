# Decisiones pendientes

Preguntas abiertas del proyecto. Cuando se resuelva una, se borra de aquí y se refleja en el código o en `CLAUDE.md`. Todo cambio que quede esperando una decisión se anota en este archivo. Los puntos marcados *Valor por defecto* ya están implementados así; solo falta confirmarlos.

## Negocio y producto

1. **Canal del login por teléfono.** ¿Código por WhatsApp (Twilio, requiere WhatsApp Business y plantillas aprobadas), por SMS, u otro? Mientras tanto el login se simula detrás de una interfaz (`DevOtpProvider`).
2. **Taller pausado, invitado y acceso.** Hoy un taller `pausado` bloquea a su dueño y a sus ayudantes (login y sesiones abiertas); `invitado` y `activo` pueden entrar y operar. Falta confirmar si "invitado" debería poder operar antes de que el admin lo active, o si pausar solo debe quitarlo del mapa sin bloquear el acceso.
3. **Cuenta del dueño del taller.** Al dar de alta un taller se crea su cuenta con el teléfono del taller. Falta definir si el dueño tiene un teléfono propio distinto, y cómo se agregan más cuentas de taller (encargados) o más admins (hoy solo el inicial desde `ADMIN_PHONE`).
4. **Folio.** *Valor por defecto:* consecutivo por taller de 4 dígitos (`0001`, como el frontend), sin prefijo ni año y sin reiniciarse; `shops.nextFolio` se toma e incrementa en una sola sentencia. Confirmar si se quiere prefijo o reinicio anual.
5. **Regresos en el flujo de estados.** *Valor por defecto:* además del diagrama del PDF se permiten 3 → 2 (en reparación falta una pieza) y 4 → 3 (corregir algo antes de entregar). Nada sale de Entregado. Confirmar si hace falta otro (por ejemplo, cancelar un expediente).
6. **Qué estados cambia el ayudante.** *Valor por defecto:* solo Diagnóstico, Esperando refacción y En reparación, en sus coches. Listo (libera el total al cliente) y Entregado son del dueño. El PDF solo dice que el ayudante "cambia el estado".
7. **Pago al ayudante.** *Valor por defecto:* el monto se congela en `helper_payments` al entregar el coche; mientras está abierto se calcula al vuelo con la tarifa actual. El dueño lo marca pagado una vez. Confirmar si hacen falta anticipos o ajustes a mano. La "semana" de "Mis pagos" empieza el lunes a las 00:00 en la zona horaria del servidor.
8. **Costos en Listo y expedientes entregados.** *Valor por defecto:* en Listo para entrega no se cambian costos (el cliente ya ve el total; hay que regresar a En reparación) y un expediente entregado ya no se modifica. Confirmar.
9. **Qué ve la página pública del QR.** *Valor por defecto:* etapa actual, línea de tiempo de cambios de etapa (sin notas), nombre y teléfono del taller, marca y modelo. Sin placas, nombre del cliente ni dinero. Deja de funcionar al entregar o al regenerar el QR.
10. **Escaneos OBD del frontend.** El frontend registra escaneos de diagnóstico (`Scan`: códigos de falla, nota, foto); el backend todavía no los tiene. Decidir si entran en la fase 1 (tabla `car_scans`) o después.

## Datos y esquema

12. **Taller del ayudante duplicado.** Vive en `users.shopId` y en `helpers.shopId`, y nada impide que difieran. Propuesta: derivar el taller del ayudante solo desde `helpers`.
13. **Almacenamiento de archivos.** Disco local detrás de una interfaz `Storage`. Pendiente: cuándo migrar a S3 o R2 y quién respalda los archivos.
14. *Menor:* los UUID usan `uuid_generate_v4()` (extensión); Postgres 17 trae `gen_random_uuid()` sin extensión. `cars.enteredAt` y `updatedAt` quedaron sin zona horaria, a diferencia de `deliveredAt`. Los reportes interpretan las fechas `from`/`to` en la zona horaria del servidor.

## Seguridad (revisar con la skill `claude-security`)

15. **Revisión de seguridad pendiente.** No se ha pasado por `claude-security` ni `auth/` (código OTP, rotación de refresh tokens, guards) ni la API nueva (`src/api/`). El escaneo del repositorio se canceló la primera vez; pendiente repetirlo sobre el commit actual.
16. **Autenticación y sesiones.** Hecho con valores por defecto: acceso 15 min, refresco 30 días (rotado), 5 intentos por minuto y por IP en las rutas de acceso, 30 por minuto en `/public/q`. Pendiente: confirmar esos tiempos, contar intentos fallidos por teléfono (el código real necesitará expirar y bloquearse tras varios fallos), y orígenes permitidos por CORS (aún no configurado). El límite de peticiones se desactiva en pruebas (`NODE_ENV=test`), así que no hay prueba automática del throttling.

## Infraestructura

17. **Hosting.** Local por ahora (Docker). Pendiente: dónde se despliega, cómo se respaldan los datos y cómo se manejan los secretos fuera de `.env`.
18. **Escaneos con Workflows.** Cada ejecución de un workflow (por ejemplo el escaneo de `claude-security`) pide aprobación. Decidir si se permite de forma fija para este proyecto.

## Frontend

19. **Pestaña "Salir" en la barra nativa.** Las tabs ahora son `NativeTabs` (Liquid Glass en iOS 26+, Material en Android) y `salir` sigue como pestaña para no cambiar el comportamiento. En una barra nativa es raro que una pestaña sea una acción: pendiente moverla a un botón de encabezado o a un perfil. También pendiente verificar en dispositivo con iOS 26 y Android que el `Redirect` por rol y el aspecto en web se vean bien; `unstable-native-tabs` puede cambiar entre versiones menores del SDK.
20. **Redondeo.** El frontend redondea el dinero a pesos y el servidor a centavos. Al conectar el frontend, mostrar lo que manda el servidor.
