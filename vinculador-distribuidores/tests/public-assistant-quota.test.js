import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('Migración: visitante con sesión técnica puede consultar IA con cuota, sin acceso al contador', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema public,auth to authenticated;
      create table public.assistant_usage(user_id uuid references auth.users(id),window_start timestamptz,requests integer,primary key(user_id,window_start));
      alter table public.assistant_usage enable row level security;
      insert into auth.users values ('00000000-0000-4000-8000-000000000001');
    `)
    await db.exec(await readFile(new URL('../supabase/migrations/202611170001_public_assistant.sql', import.meta.url), 'utf8'))
    await db.exec("set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false)")
    for (let n=0;n<10;n++) assert.equal((await db.query('select public.consume_assistant_quota() ok')).rows[0].ok, true)
    assert.equal((await db.query('select public.consume_assistant_quota() ok')).rows[0].ok, false)
    await assert.rejects(db.query('select * from public.assistant_usage'), error => error.code === '42501')
    await db.exec("select set_config('request.jwt.claim.sub','',false)")
    await assert.rejects(db.query('select public.consume_assistant_quota()'), error => error.code === '42501')
    await db.exec('reset role; set role anon')
    await assert.rejects(db.query('select public.consume_assistant_quota()'), error => error.code === '42501')
  } finally { await db.close() }
})
