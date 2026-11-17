# Inicio y experiencia visual de SunFinder

La ruta / muestra la portada con búsqueda, fotografía y accesos a Empaque, Mantenimiento y Transporte. Se reutilizan los identificadores del catálogo y los parámetros q, nature, sector y tag del feed.

Visitar la portada no crea una cuenta. Al buscar sin sesión se abre el acceso anónimo existente de Supabase; si no está habilitado, se informa el fallo con una opción para reintentar. Las rutas de datos mantienen sus permisos actuales. La personalización continúa disponible en /feed desde la portada y el menú de cuenta.

Las tarjetas conservan las operaciones originales de clasificación, reacción y eliminación. El diseño añade descripción expandible, imágenes adaptables, cuatro etiquetas iniciales, Ver empresa y Pasar. El puntaje de afinidad pasa a un detalle desplegable y no se presenta como porcentaje.

El asistente conserva las opciones independientes de resumen y búsqueda web, desactivadas inicialmente. La explicación del envío de datos conserva los proveedores utilizados. Los resultados externos siguen separados de las ofertas registradas y mantienen su fuente.

El cambio de desplazamiento de recomendaciones mide posiciones reales de las tarjetas para admitir alturas variables y elimina el desplazamiento dentro de cada tarjeta. La navegación principal queda en Explorar, Empresas, Necesidades y Asistente. Publicar es una acción aparte en escritorio; Mi empresa y Para tu empresa quedan en el menú de cuenta.

Las fotografías decorativas se extrajeron de la propuesta visual generada y aprobada. No identifican proveedores reales ni contienen ofertas de ejemplo conectadas a la base. El logotipo sigue siendo el del proyecto.

## Validación

Compilación: pnpm build.

Pruebas locales: test:offers (22), test:recommendations (18), test:classification (20) y node --test tests/home-ui.test.js (2). Las suites existentes se ejecutaron con VITE_SUPABASE_URL=http://127.0.0.1:54321 y VITE_SUPABASE_PUBLISHABLE_KEY=test-key; no se consultó una base remota. La prueba nueva configura sus propios valores ficticios.

Pendiente en Vercel Preview: revisar escritorio, tableta y móvil, búsqueda como invitado, reacciones, descripción expandida, scroll de recomendaciones, contacto, y consultas al asistente con el proyecto real. No se completó la prueba visual en navegador local porque Chromium no pudo iniciarse por las restricciones del entorno.

El archivo vercel.json añade la resolución de rutas Vue al recargar enlaces directos. Las variables de Supabase ya utilizadas por el proyecto deben mantenerse en el despliegue.
