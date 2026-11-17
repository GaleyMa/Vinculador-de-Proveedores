import assert from 'node:assert/strict'
import test from 'node:test'
import { demoAccounts, demoId, DEMO_MARKER } from '../scripts/demo-data.mjs'
import { main, seedDemo } from '../scripts/seed-demo.mjs'

function fakeClient() {
 const users=[]
 const tables=Object.fromEntries(['profiles','profile_tags','profile_contacts','profile_links','provider_classifications','posts','post_tags','tags','needs'].map(name=>[name,[]]))
 tables.sectors=[...new Set(demoAccounts().map(a=>a.sector))].map(id=>({id,active:true}))
 let writes=0,failTable=null
 const pk={profiles:['id'],profile_tags:['profile_id','tag_id'],post_tags:['post_id','tag_id'],provider_classifications:['profile_id']}
 const client={
  auth:{admin:{
   listUsers:async()=>({data:{users}}),
   createUser:async input=>{writes++;const user={id:demoId(input.email),email:input.email,app_metadata:input.app_metadata};assert.equal(input.email_confirm,true);users.push(user);return {data:{user}}},
  }},
  from(table){
   let op='select',value,limit,filters=[],single=false
   const chain={
    select(){return chain},eq(key,v){filters.push([key,v]);return chain},limit(n){limit=n;return chain},
    maybeSingle(){single=true;return chain},single(){single=true;return chain},
    upsert(v){op='upsert';value=v;return chain},insert(v){op='insert';value=v;return chain},
    then(resolve,reject){
     try {
      if(op!=='select') {
       if(failTable===table){failTable=null;return Promise.resolve({error:{message:'Fallo simulado'}}).then(resolve,reject)}
       writes++
       const rows=Array.isArray(value)?value:[value]
       for(const data of rows){
        const row={...(table==='tags'?{id:demoId('tag:'+data.name)}:{}),...data}
        const keys=pk[table]||['id']
        const existing=tables[table].find(r=>keys.every(k=>r[k]===row[k]))
        if(existing && op==='upsert')Object.assign(existing,row)
        else tables[table].push(row)
       }
      }
      let data=tables[table].filter(r=>filters.every(([k,v])=>r[k]===v))
      if(value)data=data.filter(r=>r.id===value.id||table==='tags'&&r.name===value.name)
      if(limit!==undefined)data=data.slice(0,limit)
      return Promise.resolve({data:single?(data[0]||null):data}).then(resolve,reject)
     }catch(error){return Promise.reject(error).then(resolve,reject)}
    },
   };return chain
  },
 }
 return {client,users,tables,get writes(){return writes},failNext(table){failTable=table}}
}
const password='Demo-password-local-123!'

test('20 empresas sintéticas completas con contactos, clasificación y publicaciones coherentes',()=>{
 const rows=demoAccounts()
 assert.equal(rows.length,20)
 assert.deepEqual(rows.reduce((counts,row)=>(counts[row.role]=(counts[row.role]||0)+1,counts),{}),{proveedor:12,cliente:5,socio:3})
 assert.equal(new Set(rows.map(r=>r.email)).size,20)
 assert.equal(rows.flatMap(r=>r.posts).length,30)
 assert.equal(rows.filter(r=>r.need).length,5)
 for(const row of rows){
  assert.match(row.name,/^\[DEMO\]/)
  assert.match(row.email,/@sunfinder\.example$/)
  assert.ok(row.bio.length>80)
  assert.match(row.avatar,/^data:image\/svg\+xml;base64,/)
  assert.ok(row.tags.length>=3)
  assert.ok(row.contacts.some(c=>c.kind==='correo'&&c.is_public))
  assert.ok(row.contacts.some(c=>!c.is_public))
  for(const post of row.posts){assert.ok(['bien','servicio'].includes(post.nature));assert.equal(post.sector_id,row.sector);assert.ok(post.description.length>=10&&post.description.length<=5000);assert.ok(post.title.length<=160)}
  if(row.need){assert.ok(row.need.title.length<=120);assert.ok(row.need.budget_min<=row.need.budget_max);assert.ok(row.need.nature==='bien'?row.need.quantity>0:Boolean(row.need.service_mode&&row.need.service_scope))}
 }
})

test('Carga repetible: crea identidades reales de Auth y no duplica datos demo',async()=>{
 const f=fakeClient();const logs=[]
 const expected={accounts:20,posts:30,needs:5}
 assert.deepEqual(await seedDemo(f.client,{password,log:line=>logs.push(line)}),expected)
 const counts=()=>Object.fromEntries(Object.entries(f.tables).map(([name,rows])=>[name,rows.length]))
 const initial=counts()
 assert.equal(f.users.length,20);assert.equal(initial.profiles,20);assert.equal(initial.profile_contacts,60);assert.equal(initial.posts,30);assert.equal(initial.needs,5);assert.equal(initial.provider_classifications,15)
 assert.deepEqual(await seedDemo(f.client,{password,log:()=>{}}),expected)
 assert.equal(f.users.length,20)
 assert.deepEqual(counts(),initial)
 assert.doesNotMatch(logs.join('\n'),new RegExp(password))
})

test('Colisiones con cuentas ajenas y rubros faltantes detienen la carga antes de escribir',async()=>{
 const f=fakeClient()
 f.users.push({id:'real',email:demoAccounts()[0].email,app_metadata:{}})
 await assert.rejects(seedDemo(f.client,{password}),/sin marca de demo/)
 assert.equal(f.writes,0)
 const missing=fakeClient();missing.tables.sectors=[]
 await assert.rejects(seedDemo(missing.client,{password}),/Falta el rubro/)
 assert.equal(missing.writes,0)
})

test('Un fallo parcial se puede reanudar sin borrar usuarios ni modificar cuentas ajenas',async()=>{
 const f=fakeClient();f.failNext('profile_contacts')
 await assert.rejects(seedDemo(f.client,{password,log:()=>{}}),/Fallo simulado/)
 assert.equal(f.users.length,1)
 assert.equal(f.users[0].app_metadata.sunfinder_demo,DEMO_MARKER)
 await seedDemo(f.client,{password,log:()=>{}})
 assert.equal(f.users.length,20);assert.equal(f.tables.profile_contacts.length,60)
})

test('Vista previa no necesita claves ni realiza llamadas externas; apply exige configuración',async()=>{
 const original=console.table,log=console.log
 console.table=()=>{};console.log=()=>{}
 try{await main([],{});await assert.rejects(main(['--apply'],{}),/Configura SUPABASE_URL/)}finally{console.table=original;console.log=log}
})
