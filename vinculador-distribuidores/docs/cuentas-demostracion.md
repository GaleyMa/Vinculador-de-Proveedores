# Cuentas para demostración de SunFinder

El generador crea 20 cuentas de Auth con correo confirmado: 12 proveedores, 5 clientes y 3 socios. Completa nombre de empresa, biografía, imagen gráfica de demo, especialidades, enlaces y tres contactos (dos públicos y uno privado). Clasifica proveedores y socios, crea 30 publicaciones clasificadas y 5 necesidades de clientes. No crea cuentas administradoras, reacciones, mensajes ni correos de invitación.

Los negocios, precios y condiciones son ficticios y aparecen identificados con [DEMO]. Los correos y sitios utilizan el dominio reservado sunfinder.example. Los teléfonos usan la serie ficticia +1 202 555 0100–0119. No son contactos para llamar ni sitios operativos. Las imágenes son gráficos SVG incrustados; no requieren descargas, servicios externos ni subir archivos a Storage.

## Preparación

1. Integrar el PR y actualizar la copia local del repositorio desde main.
2. Abrir una terminal en `vinculador-distribuidores` y ejecutar `pnpm install --frozen-lockfile` si faltan dependencias.
3. Revisar el listado sin escribir en Supabase:

```bash
pnpm exec node scripts/seed-demo.mjs
```

4. En esa carpeta crear `.env.demo.local` con estos nombres y valores propios:

```dotenv
SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=TU_CLAVE_ADMINISTRATIVA_LOCAL
DEMO_PASSWORD=ELIGE_UNA_CONTRASENA_DE_AL_MENOS_12_CARACTERES
```

Usar una clave secreta administrativa de Supabase (`sb_secret_...`) o, como alternativa, `SUPABASE_SERVICE_ROLE_KEY` con la clave legacy service_role. La clave pública/anon utilizada por Vercel no sirve para crear usuarios administrativamente. La clave administrativa nunca se pone en una variable VITE, en el frontend, en capturas ni en GitHub. El archivo .env.demo.local ya está ignorado por las reglas del repositorio. Una contraseña con espacios o # debe entrecomillarse según el formato dotenv.

No hay conexión administrativa de Supabase desde ChatGPT: este paso se ejecuta en la computadora del responsable. Confirmar que SUPABASE_URL corresponde al proyecto donde se quiere mostrar la demo; las cuentas serán visibles allí, incluso en producción si se apunta a ese proyecto.

## Crear las cuentas

```bash
pnpm exec node --env-file=.env.demo.local scripts/seed-demo.mjs --apply
```

El generador comprueba tablas y rubros antes de crear usuarios. Se necesitan las migraciones existentes de clasificación, contactos y publicaciones. No agrega ni altera tablas, ni activa o desactiva confirmación de correo en la configuración general. Usa Auth Admin createUser con email_confirm=true únicamente para las cuentas demo.

Si falta una tabla/rubro o la clave no tiene permisos, se detiene mostrando el error. La carga no es una transacción global: si se interrumpe pueden quedar cuentas parcialmente completas. Repetir el mismo comando retoma las cuentas marcadas con `app_metadata.sunfinder_demo = sunfinder-demo-v1`, sin duplicar sus publicaciones, contactos o enlaces. No adopta ni modifica una cuenta con el mismo correo que no tenga esa marca.

Las cuentas de demo existentes conservan su contraseña al repetir: DEMO_PASSWORD se usa solo al crear una cuenta nueva. Se restauran los campos de perfil y las publicaciones de demo de la plantilla; se conservan las necesidades ya existentes (también si se cerraron). Las etiquetas compartidas se reutilizan, nunca se borran. No restablece contraseñas de usuarios existentes ni elimina datos automáticamente.

## Entrar y demostrar

Usar cualquiera de los correos del listado con la contraseña DEMO_PASSWORD elegida al crearlos:

- Cliente: `demo-cafe@sunfinder.example`.
- Proveedor: `demo-cajas@sunfinder.example`.
- Socio: `demo-circular@sunfinder.example`.

Recorridos sugeridos:

1. Entrar como cliente, abrir Empresas y consultar un perfil con contactos públicos.
2. Abrir el asistente con IA y buscar cajas de carton sin filtros. Deben existir varias ofertas clasificadas con precio, mínimos, cobertura y entrega para comparar.
3. Buscar mantenimiento de maquinaria; explorar necesidades de Manufactura Alba.
4. Entrar como proveedor para mostrar su perfil, contactos privados y publicaciones propias.
5. En incógnito probar la búsqueda pública Tavily. Estos datos NO aparecen en Tavily: solo se insertan en SunFinder y no crean negocios reales en la web.

El generador no activa Gemini, Tavily ni OAuth; utiliza la configuración existente. La contraseña no se imprime, se guarda en un archivo de credenciales ni se añade al repositorio. Para retirar las cuentas tras la demo, identificarlas por correos y metadatos en Supabase Auth y revisar qué se eliminará antes de borrarlas. No ejecutar un borrado general de usuarios.

## Validación

Cinco pruebas locales del catálogo completo, carga repetible, protección de cuentas sin marca, recuperación tras un fallo parcial y vista previa sin credenciales. Auth y el cliente de datos se simularon. No se han creado ni probado las cuentas contra el Supabase remoto desde esta entrega.
