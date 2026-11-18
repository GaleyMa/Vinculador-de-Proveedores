# Validación de la demostración

Se validó la versión de main c126a9c0d2be61744c446383d35b1fca356a5064 en una copia local independiente, sin credenciales del proyecto remoto.

## Resultado local

- 89 pruebas aprobadas, cero fallos, en aproximadamente 37 segundos.
- Compilación de producción con pnpm build correcta.
- Se probaron cuentas demo (catálogo, repetición sin duplicados, colisiones y reanudación), clasificación, búsquedas internas, filtros, rutas públicas/privadas, cuotas, permisos de PostgreSQL y contratos simulados de Tavily/Gemini.
- El control ESLint de scripts/demo-data.mjs y scripts/seed-demo.mjs detectó 28 incumplimientos de formato. Se corrigieron automáticamente; ambos scripts pasan ESLint. Las cinco pruebas de carga demo se repitieron después y aprobaron.
- La prueba tests/search.integration.test.js contra Supabase real no se ejecutó: requiere credenciales de una cuenta y variables del entorno del responsable. El resto de servicios externos se simuló y las pruebas SQL usaron PGlite local.

No se ha leído el archivo .env.demo.local de la computadora de la usuaria, creado cuentas en su Supabase ni validado su contraseña. La prueba de compilación no confirma la configuración remota, la apariencia en navegador ni cuotas/disponibilidad de las APIs.

## Confirmar la carga real

Guardar .env.demo.local no crea las cuentas. Si todavía no se ejecutó la carga, hacerlo desde vinculador-distribuidores:

```bash
pnpm exec node --env-file=.env.demo.local scripts/seed-demo.mjs --apply
```

No hace falta volver a ejecutar la carga si ya terminó correctamente. Para verificar el resultado sin escribir ni revelar contactos, ejecutar en Supabase SQL Editor:

```sql
with demo as (
  select id from auth.users
  where raw_app_meta_data ->> 'sunfinder_demo' = 'sunfinder-demo-v1'
)
select
  (select count(*) from demo) as cuentas,
  (select count(*) from public.profiles where id in (select id from demo)) as perfiles,
  (select count(*) from public.provider_classifications where profile_id in (select id from demo)) as clasificaciones,
  (select count(*) from public.profile_contacts where profile_id in (select id from demo)) as contactos,
  (select count(*) from public.profile_links where profile_id in (select id from demo)) as enlaces,
  (select count(*) from public.posts where author_id in (select id from demo)) as publicaciones,
  (select count(*) from public.needs where owner_id in (select id from demo)) as necesidades,
  (select count(*) from public.profiles where id in (select id from demo)
    and (nullif(btrim(full_name),'') is null or nullif(btrim(bio),'') is null
      or nullif(btrim(avatar_url),'') is null)) as perfiles_incompletos;
```

Valores esperados tras una carga inicial completa:

| Cuentas | Perfiles | Clasificaciones | Contactos | Enlaces | Publicaciones | Necesidades | Perfiles incompletos |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 20 | 20 | 15 | 60 | 20 | 30 | 5 | 0 |

Estos conteos son una comprobación inicial, no sustituyen el recorrido funcional. Si se editaron o borraron datos durante una demostración pueden cambiar.

## Recorrido en la aplicación

1. Iniciar sesión con demo-cafe@sunfinder.example y la contraseña elegida en DEMO_PASSWORD.
2. Abrir Empresas, localizar [DEMO] Cartón Horizonte y comprobar biografía, imagen, especialidades, enlaces ficticios y contactos públicos.
3. Buscar cajas de carton en el asistente, sin filtros, con comparación IA activada. Comprobar ofertas internas y resumen. Esta prueba usa la configuración y cuota reales de Gemini.
4. Abrir Necesidades y comprobar solicitudes de clientes demo.
5. Entrar como demo-cajas@sunfinder.example y comprobar que puede gestionar su propio perfil, no las publicaciones ajenas.
6. En incógnito, consultar Tavily desde la portada. Al abrir funciones privadas debe aparecer la invitación a registrarse. Las empresas demo de la base no tienen por qué existir en resultados de Tavily.

No compartir archivos de entorno ni contraseñas. Para diagnosticar, basta compartir los conteos, mensajes o capturas sin secretos.
