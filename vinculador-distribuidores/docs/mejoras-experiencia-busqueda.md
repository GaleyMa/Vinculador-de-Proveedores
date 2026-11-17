# Mejoras de presentación de búsqueda

La portada incorpora ejemplos que inician una búsqueda con un clic. Los resultados conservan la consulta visible con una acción Cambiar búsqueda; el formulario se puede volver a abrir sin borrar los resultados. Se mantiene la separación de la versión anterior: consulta pública con Tavily y asistente con IA para cuentas registradas.

Las tarjetas web comparten estructura de fuente, título, descripción y acción principal. La etiqueta Encontrado en la web y el dominio distinguen información externa de Publicado en SunFinder; no se presentan como negocios verificados. Los identificadores W1, W2 permiten relacionar las fuentes con el resumen del asistente. La distribución pasa de dos columnas a una en móvil.

Durante las consultas se muestran tarjetas de carga con texto de estado. Los resultados vacíos ofrecen ajustar palabras o filtros. Los fallos externos conservan el mensaje del servidor y ofrecen reintentar o cambiar la búsqueda; no se presentan como búsquedas sin coincidencias. Las animaciones respetan la preferencia de movimiento reducido.

El asistente presenta un campo amplio, ejemplos y una explicación de la personalización opcional. La invitación al registro explica la acción solicitada (empresa, fuente externa, interés, asistente o necesidades), permite cerrar, iniciar sesión o continuar buscando sin navegar ni borrar resultados.

No modifica tablas, migraciones, Edge Functions ni secretos. Se mantienen los requisitos de activación de Supabase documentados en activar-ia-publica.md.

Validación: pruebas locales de portada, componentes, navegación y mensajes de registro; build de producción; ESLint de los componentes nuevos y actualizados. El navegador local no pudo iniciarse por restricciones del entorno, por lo que la revisión visual de escritorio/móvil y la prueba con APIs reales quedan pendientes en el preview.
