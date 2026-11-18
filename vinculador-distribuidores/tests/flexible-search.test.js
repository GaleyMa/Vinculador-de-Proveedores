import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { createClient } from '@supabase/supabase-js'
import { searchProfiles } from '../src/lib/profileSearch.js'

test('Búsqueda flexible: empresas, acentos, raíces, errores y RLS en PostgreSQL',async t=>{
 const db=new PGlite()
 const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`
 try{
  await db.exec(`
   create role anon; create role authenticated; create role service_role;
   create schema auth;
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema public,auth to authenticated;
   create table profiles(id uuid primary key,full_name text,role text,avatar_url text,bio text);
   create table sectors(id text primary key,name text,active boolean);
   create table provider_classifications(profile_id uuid,nature text,sector_id text);
   create table profile_tags(profile_id uuid,tag_id uuid);
   create table tags(id uuid primary key,name text);
   create table post_tags(post_id uuid,tag_id uuid);
   create table posts(id uuid primary key,author_id uuid,title text,description text,image_url text,created_at timestamptz default now(),nature text,sector_id text);
   insert into profiles values('${id(1)}','[DEMO] Cartón Horizonte','proveedor',null,'Cajas para envíos'),('${id(2)}','Cartón Pacífico','proveedor',null,'Embalaje industrial'),('${id(3)}','Cliente Horizonte','cliente',null,'Comercio');
   insert into sectors values('empaque','Empaque',true),('inactivo','Inactivo',false);
   insert into provider_classifications values('${id(1)}','bien','empaque');
   insert into posts(id,author_id,title,description,nature,sector_id) values
    ('${id(10)}','${id(1)}','Cajas corrugadas','Venta de cajas para alimentos',null,null),
    ('${id(11)}','${id(1)}','Embalaje industrial','Empaques reciclables','bien','empaque'),
    ('${id(12)}','${id(2)}','Cajas de cartón','Envíos y embalaje','bien','empaque'),
    ('${id(13)}','${id(1)}','Cajas privadas','privada',null,null),
    ('${id(14)}','${id(3)}','Cartón Horizonte','Necesito cajas',null,null),
    ('${id(15)}','${id(1)}','Cajas inactivas','No disponible','bien','inactivo');
   grant select on all tables in schema public to authenticated;
   alter table posts enable row level security;
   create policy visible on posts for select to authenticated using(description<>'privada');
  `)
  await db.exec(await readFile(new URL('../supabase/migrations/202611180001_flexible_search.sql',import.meta.url),'utf8'))
  await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${id(3)}',false)`)
  const offers=async(q,nature=null,sector=null)=>(await db.query('select * from candidate_offers($1,$2,$3,12)',[q,nature,sector])).rows
  await t.test('Carton Horizonte encuentra sus ofertas por nombre, en cualquier orden y con una errata',async()=>{
   for(const q of ['carton horizonte','Horizonte cartón','carton horzonte']){
    assert.deepEqual((await offers(q)).map(r=>r.author_id),[id(1),id(1)])
   }
   const rows=(await db.query("select * from search_profiles_flexible('carton horzonte',null,20,0)")).rows
   assert.equal(rows[0].id,id(1));assert.equal(Number(rows[0].total_count),1)
  })
  await t.test('Raíces de palabras y consultas no exactas se ordenan por relevancia',async()=>{
   assert.ok((await offers('cajass carton')).length>0)
   assert.ok((await offers('cartones')).length>0)
   assert.ok((await offers('necesito cajas carton extragrandes')).length>0)
   assert.equal((await offers('software contable')).length,0)
   const scores=await db.query("select sf_search_score('horizonte','Horizonte') exact,sf_search_score('horizonte','Horzonte') fuzzy")
   assert.ok(scores.rows[0].exact>scores.rows[0].fuzzy)
  })
  await t.test('Filtros, privacidad, comodines y permisos no se relajan',async()=>{
   assert.deepEqual((await offers('carton horizonte','bien','empaque')).map(r=>r.id),[id(11)])
   for(const q of ['%','_','de la para'])assert.equal((await offers(q)).length,0)
   const rows=await offers('cajas')
   assert.ok(!rows.some(r=>[id(13),id(14),id(15)].includes(r.id)))
   await db.exec("select set_config('request.jwt.claim.sub','',false)")
   assert.equal((await offers('carton horizonte')).length,0)
   await db.exec('reset role;set role anon')
   await assert.rejects(offers('carton'),e=>e.code==='42501')
  })
 }finally{await db.close()}
})

test('SDK: Empresas usa búsqueda flexible, paginación y etiqueta exacta',async()=>{
 let call
 const client=createClient('https://example.supabase.co','test-key',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(url,options)=>{
  call={url:new URL(url),body:JSON.parse(options.body)}
  return Response.json([{id:'company',full_name:'Cartón Horizonte',total_count:21}])
 }}})
 const result=await searchProfiles(client,{text:'carton horizonte',tag:'cartón',page:2})
 assert.match(call.url.pathname,/rpc\/search_profiles_flexible$/)
 assert.deepEqual(call.body,{p_query:'carton horizonte',p_tag:'cartón',p_limit:20,p_offset:20})
 assert.equal(result.total,21)
})
test('SDK: permisos denegados no activan una búsqueda alternativa',async()=>{
 const client={rpc:()=>Promise.resolve({error:{code:'42501',message:'Sin permisos'}}),from:()=>assert.fail('No reintentar errores de permisos')}
 await assert.rejects(searchProfiles(client,{text:'carton'}),e=>e.code==='42501')
})

test('SDK: antes de aplicar la migración mantiene la búsqueda anterior',async()=>{
 const paths=[]
 const client=createClient('https://example.supabase.co','test-key',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(url)=>{
  const path=new URL(url).pathname;paths.push(path)
  if(path.includes('/rpc/'))return Response.json({code:'PGRST202',message:'Función pendiente'},{status:404})
  return Response.json([{id:'company',full_name:'Cartón Horizonte'}],{headers:{'content-range':'0-0/1'}})
 }}})
 const result=await searchProfiles(client,{text:'Horizonte'})
 assert.equal(result.profiles[0].id,'company')
 assert.equal(result.total,1)
 assert.ok(paths[0].includes('/rpc/search_profiles_flexible'))
 assert.ok(paths[1].endsWith('/profiles'))
})
