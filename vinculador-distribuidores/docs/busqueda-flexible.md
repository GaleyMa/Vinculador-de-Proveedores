# Búsqueda flexible de empresas y ofertas

El asistente ahora busca también en el nombre de la empresa autora, además de título, descripción, etiquetas y nombre del rubro de la publicación. Empresas usa una nueva RPC para buscar nombre, descripción, especialidades y rubro. No se consultan contactos privados ni se atribuye automáticamente una clasificación del perfil a una publicación.

La búsqueda normaliza vocales acentuadas, ignora mayúsculas y palabras de enlace, acepta cambios de orden, raíces de palabras en español y una errata pequeña en palabras de cuatro o más letras. Para consultas de tres o más términos significativos se admite una coincidencia parcial de al menos el 60%. Las coincidencias exactas reciben mayor puntuación; se prioriza el nombre empresarial y después el título. Naturaleza, rubro y etiqueta seleccionados siguen siendo filtros explícitos.

Ejemplos de comprobación con los datos demo:

- carton horizonte / Horizonte cartón: encuentra Cartón Horizonte y sus publicaciones.
- carton horzonte: tolera la omisión de una letra.
- cartones: encuentra variantes de cartón por la raíz en español.
- necesito cajas carton extragrandes: admite términos faltantes cuando hay suficientes coincidencias.
- software contable: no devuelve ofertas de cartón que no coincidan.

No es un motor semántico de embeddings ni un sistema general de sinónimos. La búsqueda pública de Tavily y la búsqueda manual del feed conservan su implementación previa. No se alteran las publicaciones, los perfiles, sus clasificaciones ni las políticas RLS. Las funciones son security invoker y respetan las filas visibles para quien realiza la consulta.

## Activación

1. Ejecutar el contenido completo de `supabase/migrations/202611180001_flexible_search.sql` en Supabase SQL Editor sobre el proyecto con las migraciones anteriores ya aplicadas. No ejecutar otra vez los volcados completos del esquema.
2. Integrar el PR y dejar que Vercel publique el cambio del cliente para Empresas. La RPC del asistente conserva su contrato, por lo que aprovecha la mejora al aplicar el SQL.
3. Iniciar sesión y probar los ejemplos anteriores en Asistente y Empresas, inicialmente sin filtros. Comparar que la empresa correcta aparezca entre las primeras coincidencias.
4. Activar filtros de naturaleza/rubro y comprobar que no se incluyan publicaciones sin esos valores. Probar la etiqueta exacta en Empresas.

La migración no requiere extensiones, claves nuevas ni despliegues de Edge Functions. El merge no ejecuta el SQL. Empresas mantiene una búsqueda anterior como compatibilidad si todavía falta la RPC; la mejora completa requiere la migración. Ningún error de permisos activa esa alternativa.

El ranking evalúa texto de las filas visibles. Para un catálogo mucho mayor se deberá medir el coste y considerar índices o un motor dedicado; esta implementación está validada sobre conjuntos de pruebas pequeños.

## Validación local

Pruebas PostgreSQL (PGlite) de nombre empresarial, acentos, orden, erratas, raíces, relevancia, filtros y RLS. Pruebas con el SDK de paginación, etiqueta exacta, errores de permisos y compatibilidad de despliegue. La prueba opcional contra Supabase real se ajustó para permitir resultados similares además de exactos; no se ejecutó porque requiere credenciales del responsable.
