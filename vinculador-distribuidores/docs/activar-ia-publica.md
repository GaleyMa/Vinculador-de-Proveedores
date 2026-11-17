# Búsqueda pública y asistente con cuenta

## Recorridos

- La búsqueda de la portada y /buscar consultan Tavily automáticamente, sin Gemini, perfiles, historial ni ofertas internas. El visitante solo ve resultados web identificados por fuente. Los rubros seleccionan filtros del formulario. La sesión anónima de Supabase es un identificador técnico para validar peticiones y aplicar cuota; no exige registro al visitante.
- /asistente requiere cuenta registrada. «Dime qué tienes en mente y te ayudamos» permite comparar ofertas internas con Gemini y, opcionalmente, incluir fuentes web de Tavily.
- La personalización del asistente es opcional y se activa con una casilla. El servidor lee únicamente el perfil del usuario autenticado: rol, descripción y especialidades. Se envían esos campos a Gemini para orientar la comparación; no se envían nombre, correo, teléfono, ID ni historial de reacciones. La descripción es texto del usuario y debe evitar información confidencial. Sin consentimiento no se lee el perfil para el asistente. Si no hay datos, la comparación sigue sin personalización.
- La personalización orienta el resumen sobre las candidatas recuperadas por texto y clasificación. No modifica el motor de candidatas ni añade embeddings o aprendizaje del historial.
- Directorios, perfiles de empresas, necesidades, feed y asistente con IA requieren registro. Al intentar acceder aparece la invitación con Crear cuenta, Ya tengo cuenta y Seguir buscando. Las fuentes web siguen identificadas; abrir su enlace también requiere registro en este diseño.

## Activación necesaria en Supabase

1. Confirmar las migraciones existentes de ofertas del 16 de noviembre.
2. Aplicar `202611170001_public_assistant.sql` si todavía no está aplicada. Permite a sesiones técnicas de invitado consumir cuota para Tavily: 10 consultas externas en ventanas de 10 minutos. El nombre histórico de la migración se conserva; no concede al visitante permiso para llamar a Gemini.
3. Redesplegar `supplier-assistant` con el handler de esta rama. Valida el JWT con auth.getUser y rechaza ai o personalize para usuarios is_anonymous antes de acceder a ofertas, perfiles o APIs externas. El verify_jwt=false del proyecto no sustituye la validación del handler.
4. Confirmar `TAVILY_API_KEY` para búsqueda pública. Confirmar `GEMINI_API_KEY` y `GEMINI_MODEL` para el asistente con cuenta. Revisar que `APP_ORIGINS` incluya exactamente Preview y Producción. Esas claves son secretos de la función; nunca variables VITE.
5. Habilitar acceso anónimo en Auth. En Vercel configurar URL y clave pública de Supabase tanto en Preview como en Producción.
6. Confirmar que las políticas existentes permiten a un usuario registrado leer su propio perfil y profile_tags. No se requieren columnas ni tablas nuevas para la personalización. Revisar por separado SELECT/RPC de perfiles, necesidades y feed para impedir consultas directas de is_anonymous: las restricciones del router no sustituyen RLS.
7. Probar en incógnito: buscar cajas devuelve fuentes web, no resumen IA ni ofertas internas; abrir asistente muestra registro. Probar con cuenta: consulta interna, comparación IA, fuentes opcionales y personalización activada/desactivada. Probar error de claves, cuota y acceso directo a API con ai=true desde invitado (403).

El merge en Vercel no ejecuta migraciones ni despliega Edge Functions. No se han realizado cambios remotos en Supabase desde esta entrega. Las pruebas locales usan servicios simulados y PostgreSQL local; falta validación con el proyecto y APIs reales.
