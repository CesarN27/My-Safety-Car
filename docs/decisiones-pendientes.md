# Decisiones pendientes

Preguntas abiertas del proyecto. Cuando se resuelva una, se borra de aquí y se refleja en el código o en `CLAUDE.md`. Todo cambio que quede esperando una decisión se anota en este archivo.

## Negocio y producto

1. **Pagos a ayudantes.** Hoy `helpers.paid` es un booleano y no guarda monto, fecha ni coche. *Decisión actual: dejarlo así.* Pendiente: ¿pago por coche (tabla `helper_payments` ligada al coche), por periodo (semana o quincena), o ambos? Afecta la pantalla "Mis pagos" del ayudante.
2. **Canal del login por teléfono.** ¿Código por WhatsApp (Twilio, requiere WhatsApp Business y plantillas aprobadas), por SMS, u otro? Mientras tanto el login se simula detrás de una interfaz.
3. **Formato del folio.** Es único por taller (`shopId, folio`). Falta definir cómo se genera: consecutivo por taller, con prefijo o año, y si puede reiniciarse.
4. **Qué pasa al escanear el QR sin cuenta.** Hoy el frontend entra como cliente automáticamente. En el backend, ¿se exige verificar el teléfono antes de ligar el coche, o se permite una sesión de invitado? También: ¿el token del QR expira, es de un solo uso, o solo se puede revocar?

## Datos y esquema

5. **Fotos en dos lugares.** `car_logs.photos` (arreglo) y la tabla `car_photos`. Propuesta: una sola tabla `files` (coche, bitácora, ayudante, firma). Decidir antes de implementar la subida de archivos.
6. **Taller del ayudante duplicado.** Vive en `users.shopId` y en `helpers.shopId`, y nada impide que difieran. Una restricción `CHECK` ya exige que taller y ayudante tengan taller y que admin y cliente no. Propuesta: derivar el taller del ayudante solo desde `helpers`.
7. **Dinero en el servidor.** `numeric(12,2)` en la base. ¿Calcular con centavos enteros o con una librería decimal? Evita errores de redondeo en IVA y porcentajes.
8. **Almacenamiento de archivos.** Disco local detrás de una interfaz `Storage`. Pendiente: cuándo migrar a S3 o R2 y quién respalda los archivos.
9. *Menor:* los UUID usan `uuid_generate_v4()` (extensión); Postgres 17 trae `gen_random_uuid()` sin extensión. `updatedAt` quedó sin zona horaria, a diferencia de `deliveredAt`.

## Seguridad (revisar con la skill `claude-security`)

10. **Escaneo de seguridad del repositorio.** Se canceló al lanzarlo (el usuario rechazó la ejecución del flujo). Pendiente repetirlo sobre el commit actual.
11. **Autenticación y sesiones.** Duración de los JWT y del token de refresco, revocación, límite de intentos en el login (`@nestjs/throttler`) y orígenes permitidos por CORS (aún no configurado).
12. **Pruebas de privacidad por rol.** Escribirlas antes de los endpoints: cliente y ayudante nunca reciben `cost`, `profit` ni gastos; un taller no ve datos de otro.

## Infraestructura

13. **Hosting.** Local por ahora (Docker). Pendiente: dónde se despliega, cómo se respaldan los datos y cómo se manejan los secretos fuera de `.env`.
14. **Escaneos con Workflows.** Cada ejecución de un workflow (por ejemplo el escaneo de `claude-security`) pide aprobación. Decidir si se permite de forma fija para este proyecto.
