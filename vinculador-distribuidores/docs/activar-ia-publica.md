# Consultas públicas con IA

La búsqueda de texto de la portada abre el asistente con esa consulta y la opción de comparación con IA activada. Buscar con ayuda abre el mismo asistente sin exigir una cuenta registrada. Las tarjetas por rubro conservan la búsqueda filtrada. La sesión anónima de Supabase se utiliza como identificador técnico para permisos y cuota: no requiere perfil empresarial.

El asistente recibe la consulta, los filtros y descripciones de las ofertas candidatas. No consulta preferencias, reacciones ni puntajes de afinidad. /feed conserva el recorrido de recomendaciones del proyecto; publicar, reaccionar y editar datos requieren una cuenta registrada.

La integración conserva el comportamiento del asistente actual: las candidatas internas se buscan mediante texto y clasificación y Gemini compara las coincidencias encontradas. Esto no incorpora por sí mismo un motor semántico de embeddings ni garantiza coincidencias ante cualquier sinónimo. La búsqueda web sigue siendo opcional y requiere Tavily.

## Activación necesaria en Supabase

1. Confirmar que están aplicadas las migraciones de ofertas del 16 de noviembre. No repetir el volcado completo de tablas.
2. Aplicar 202611170001_public_assistant.sql. Esta migración permite consumir la cuota desde una sesión de invitado; no habilita escrituras de invitados sobre publicaciones ni perfiles. Conserva 10 consultas externas por sesión en ventanas de 10 minutos y bloquea acceso directo a los contadores.
3. Redesplegar supplier-assistant con el handler de esta rama. El JWT se valida con auth.getUser y la configuración verify_jwt=false del proyecto se mantiene. No deshabilitar esa validación del handler.
4. Confirmar GEMINI_API_KEY y GEMINI_MODEL; para búsqueda web, TAVILY_API_KEY. Revisar que APP_ORIGINS incluya el origen exacto del despliegue que se va a probar.
5. Confirmar que el acceso anónimo esté habilitado en Auth. Si falla crear la sesión, la consulta todavía no puede llegar a las APIs externas.
6. En incógnito, buscar cajas desde la portada. Verificar ofertas, resumen de IA, fuentes opcionales y límites. Si falta configuración, la app informa el fallo; no simula resultados.

Las variables de Supabase en Vercel son la URL y la clave pública. Las claves de Gemini/Tavily se mantienen exclusivamente como secretos de la función. No se han ejecutado migraciones ni despliegues remotos de Supabase desde esta entrega.

## Verificación local

23 pruebas de ofertas/asistente, una prueba de migración de cuota para visitantes y cinco de navegación invitada aprobadas; compilación correcta. Los servicios externos y las sesiones remotas se simularon. La comprobación en el proyecto real requiere los pasos anteriores.
