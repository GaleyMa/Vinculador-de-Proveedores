import { pathToFileURL } from 'node:url'
import { demoAccounts, demoId, DEMO_MARKER } from './demo-data.mjs'

function checked(result, action) {
 if(result.error) throw new Error(`${action}: ${result.error.message || result.error.code || 'error del servicio'}`)
 return result.data
}
export async function seedDemo(client, { password, log = console.log } = {}) {
 if(typeof password!=='string' || password.length<12) throw new Error('DEMO_PASSWORD debe tener al menos 12 caracteres.')
 const accounts=demoAccounts()
 // Comprobar esquema, catálogo y colisiones antes de crear la primera cuenta.
 for(const [table,columns] of Object.entries({profiles:'id,full_name,role,bio,avatar_url',profile_tags:'profile_id,tag_id',profile_links:'id,profile_id,label,url',profile_contacts:'id,profile_id,kind,label,value,is_public',provider_classifications:'profile_id,nature,sector_id',posts:'id,author_id,title,description,nature,sector_id,image_url',post_tags:'post_id,tag_id',tags:'id,name',needs:'id,owner_id,title,nature,sector_id,country,region,city,budget_min,budget_max,currency'})) {
  checked(await client.from(table).select(columns).limit(0),`Verificar tabla ${table}`)
 }
 const sectors=checked(await client.from('sectors').select('id,active'),'Leer rubros')
 for(const sector of new Set(accounts.map(a=>a.sector))) if(!sectors.some(s=>s.id===sector && s.active)) throw new Error(`Falta el rubro activo ${sector}. No se ha creado ninguna cuenta.`)
 const users=new Map()
 for(let page=1;;page++) {
  const data=checked(await client.auth.admin.listUsers({page,perPage:1000}),'Consultar cuentas')
  for(const user of data.users) users.set(user.email?.toLowerCase(),user)
  if(data.users.length<1000)break
 }
 for(const account of accounts) {
  const existing=users.get(account.email)
  if(existing && existing.app_metadata?.sunfinder_demo!==DEMO_MARKER) throw new Error(`La dirección ${account.email} ya existe sin marca de demo. No se modificará.`)
 }
 const tags=new Map()
 async function tagId(name) {
  if(tags.has(name))return tags.get(name)
  // No cambiar ni eliminar etiquetas compartidas con cuentas reales.
  let row=checked(await client.from('tags').select('id').eq('name',name).maybeSingle(),'Consultar etiqueta')
  if(!row) {
   const created=await client.from('tags').insert({name}).select('id').single()
   if(created.error?.code==='23505') row=checked(await client.from('tags').select('id').eq('name',name).single(),'Recuperar etiqueta')
   else row=checked(created,'Crear etiqueta')
  }
  tags.set(name,row.id);return row.id
 }
 for(const account of accounts) {
  let user=users.get(account.email)
  if(!user) {
   const data=checked(await client.auth.admin.createUser({email:account.email,password,email_confirm:true,
    app_metadata:{sunfinder_demo:DEMO_MARKER},user_metadata:{full_name:account.name,role:account.role}}),'Crear cuenta demo')
   user=data.user
   if(!user?.id)throw new Error('El servicio no devolvió la cuenta creada.')
  }
  const id=user.id
  checked(await client.from('profiles').upsert({id,full_name:account.name,role:account.role,bio:account.bio,avatar_url:account.avatar}),`Completar ${account.email}`)
  for(const name of account.tags) {
   const tag=await tagId(name)
   checked(await client.from('profile_tags').upsert({profile_id:id,tag_id:tag},{onConflict:'profile_id,tag_id'}),'Guardar especialidad')
  }
  for(const [i,contact] of account.contacts.entries()) checked(await client.from('profile_contacts').upsert({id:demoId(`${id}:contact:${i}`),profile_id:id,...contact}),'Guardar contacto demo')
  for(const [i,link] of account.links.entries()) checked(await client.from('profile_links').upsert({id:demoId(`${id}:link:${i}`),profile_id:id,...link}),'Guardar enlace demo')
  if(account.role!=='cliente') checked(await client.from('provider_classifications').upsert({profile_id:id,nature:account.nature,sector_id:account.sector}),'Guardar clasificación')
  for(const [i,post] of account.posts.entries()) {
   const postId=demoId(`${id}:post:${i}`)
   checked(await client.from('posts').upsert({id:postId,author_id:id,...post,image_url:account.avatar}),'Guardar publicación demo')
   for(const name of account.tags) checked(await client.from('post_tags').upsert({post_id:postId,tag_id:await tagId(name)},{onConflict:'post_id,tag_id'}),'Guardar etiqueta de publicación')
  }
  if(account.need) {
   const needId=demoId(`${id}:need`)
   const existing=checked(await client.from('needs').select('id').eq('id',needId).maybeSingle(),'Consultar necesidad demo')
   // No reabrir ni modificar una necesidad que se haya cerrado durante una demo.
   if(!existing)checked(await client.from('needs').insert({id:needId,owner_id:id,...account.need}),'Crear necesidad demo')
  }
  log(`Lista: ${account.email} · ${account.role} · ${account.name}`)
 }
 return {accounts:accounts.length,posts:accounts.reduce((n,a)=>n+a.posts.length,0),needs:accounts.filter(a=>a.need).length}
}

export async function main(args=process.argv.slice(2), env=process.env) {
 if(args.some(arg=>arg!=='--apply'))throw new Error('Opción no reconocida. Usa --apply para crear los datos o ejecuta sin opciones para ver el listado.')
 if(!args.includes('--apply')) {
  console.table(demoAccounts().map(({name,role,email,city})=>({name,role,email,city})))
  console.log('Vista previa: no se realizaron conexiones ni cambios. Carga prevista: 20 cuentas, 30 publicaciones y 5 necesidades.')
  return
 }
 const url=env.SUPABASE_URL
 const key=env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!key||!env.DEMO_PASSWORD)throw new Error('Configura SUPABASE_URL, SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY) y DEMO_PASSWORD en tu entorno local.')
 if(new URL(url).protocol!=='https:'&&!url.startsWith('http://127.0.0.1:'))throw new Error('Utiliza la URL HTTPS de tu proyecto Supabase.')
 const {createClient}=await import('@supabase/supabase-js')
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
 const result=await seedDemo(client,{password:env.DEMO_PASSWORD})
 console.log(`Completado: ${result.accounts} cuentas, ${result.posts} publicaciones y ${result.needs} necesidades de demo. No se enviaron invitaciones.`)
 console.log('Para iniciar sesión usa un correo demo del listado y DEMO_PASSWORD. La contraseña no se imprime ni se sube a GitHub.')
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(error=>{console.error(error.message);process.exitCode=1})
