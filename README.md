# Tribu Fit

## Administrador inicial

La primera cuenta administradora se crea al iniciar el backend con una base de datos sin administradores. Configura `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE` (formato `+569` seguido de ocho dígitos) y `ADMIN_PASSWORD` en las variables de entorno del servidor. La contraseña debe tener al menos 12 caracteres y no superar 72 bytes. Nunca uses las antiguas credenciales de ejemplo.

Para desarrollo local, puedes copiar `backend/src/config/.env.example` a `backend/src/config/.env` y completar los valores sin subir el archivo a Git. En producción, configura las variables directamente en el servicio de hosting.

Si existe la cuenta administradora original y aún conserva la contraseña de ejemplo, el siguiente inicio reemplaza sus datos con estas variables e invalida sus sesiones anteriores. Las cuentas administradoras que ya tengan otra contraseña se conservan sin cambios. Si faltan las variables necesarias para crear o reemplazar la cuenta inicial, el backend no empieza a aceptar peticiones.

## Orígenes permitidos

`CORS_ALLOWED_ORIGINS` recibe las direcciones del frontend separadas por coma, por ejemplo `http://localhost:5173`. En producción debe configurarse con la URL que entregue el hosting, aunque sea un subdominio temporal. Escribe solo el origen (protocolo, dominio y puerto si corresponde), sin ruta ni barra final. Si no se configura en desarrollo, se permite `http://localhost:5173`; en producción el backend exige un valor explícito.
