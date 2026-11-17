-- Consulta pública con sesión técnica de invitado; conserva cuota y permisos de escritura.
begin;
create or replace function public.consume_assistant_quota() returns boolean
language plpgsql security definer set search_path = '' as $$
declare used integer; bucket timestamptz := date_bin('10 minutes', now(), timestamptz '2020-01-01');
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión' using errcode = '42501';
  end if;
  delete from public.assistant_usage where user_id = auth.uid() and window_start < bucket;
  insert into public.assistant_usage(user_id, window_start, requests) values(auth.uid(), bucket, 1)
  on conflict (user_id, window_start) do update set requests = public.assistant_usage.requests + 1
    where public.assistant_usage.requests < 10
  returning requests into used;
  return used is not null;
end;
$$;
revoke all on function public.consume_assistant_quota() from public, anon;
grant execute on function public.consume_assistant_quota() to authenticated;

notify pgrst, 'reload schema';
commit;
