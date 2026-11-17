import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('Búsqueda de publicaciones anteriores, filtros explícitos y permisos', async t => {
 const db = new PGlite()
 const uid = '00000000-0000-4000-8000-000000000001'
 const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`
 try {
  await db.exec(`
   create role anon; create role authenticated;
   create schema auth;
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant usage on schema public,auth to authenticated;
   create table profiles(id uuid primary key,full_name text,role text);
   create table sectors(id text primary key,name text,active boolean);
   create table posts(id uuid primary key,author_id uuid,title text,description text,image_url text,created_at timestamptz default now(),nature text,sector_id text);
   create table tags(id uuid primary key,name text);
   create table post_tags(post_id uuid,tag_id uuid);
   insert into profiles values('${uid}','Proveedor','proveedor'),('${id(2)}','Cliente','cliente');
   insert into sectors values('empaque','Empaque',true),('cerrado','Cerrado',false);
   grant select on profiles,sectors,posts,tags,post_tags to authenticated;
   alter table posts enable row level security;
   create policy visible on posts for select to authenticated using (description <> 'privada');
  `)
  for(const [n,title,nature,sector,description,author] of [
   [10,'Cajas de cartón corrugado',null,null,'Venta al mayoreo',uid],
   [11,'Cajas de cartón nuevas','bien','empaque','Oferta actual',uid],
   [12,'Cajas de cartón inactivas','bien','cerrado','Oferta inactiva',uid],
   [13,'Cajas de cartón privadas',null,null,'privada',uid],
   [14,'Cajas de cartón cliente',null,null,'Necesito cajas',id(2)],
   [15,'',null,null,'Cajas de cartón',uid],
   [16,'Software',null,null,'Sistemas administrativos',uid],
  ]) await db.query('insert into posts(id,author_id,title,nature,sector_id,description) values($1,$2,$3,$4,$5,$6)',[id(n),author,title,nature,sector,description])
  await db.exec(await readFile(new URL('../supabase/migrations/202611170002_legacy_offer_search.sql', import.meta.url),'utf8'))
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false)`)
  const search=async(query,nature=null,sector=null)=>(await db.query('select * from candidate_offers($1,$2,$3,12)',[query,nature,sector])).rows
  await t.test('carton sin acento encuentra publicaciones anteriores y actuales, sin cambiar clasificación',async()=>{
   const rows=await search('cajas de carton')
   assert.equal(rows.length,2)
   const legacy=rows.find(r=>r.id===id(10))
   assert.equal(legacy.nature,null);assert.equal(legacy.sector_id,null);assert.equal(legacy.sectors,null)
   assert.equal((await search('CAJAS DE CARTÓN')).length,2)
  })
  await t.test('Filtros explícitos no asignan rubros a publicaciones anteriores',async()=>{
   assert.deepEqual((await search('cajas de carton','bien')).map(r=>r.id),[id(11)])
   assert.deepEqual((await search('cajas de carton',null,'empaque')).map(r=>r.id),[id(11)])
   assert.equal((await search('cajas de carton','servicio')).length,0)
  })
  await t.test('No inventa coincidencias, no interpreta comodines ni solo palabras de enlace',async()=>{
   for(const q of ['de la para','cajas inexistentes','%','_']) assert.equal((await search(q)).length,0)
   assert.equal((await search('software')).length,1)
  })
  await t.test('RLS, autor y rubro activo permanecen vigentes; sin sesión no hay resultados',async()=>{
   assert.deepEqual((await search('cajas')).map(r=>r.id).sort(),[id(10),id(11)])
   await db.exec("select set_config('request.jwt.claim.sub','',false)")
   assert.equal((await search('cajas')).length,0)
   await db.exec('reset role; set role anon')
   await assert.rejects(search('cajas'),e=>e.code==='42501')
  })
 } finally { await db.close() }
})
