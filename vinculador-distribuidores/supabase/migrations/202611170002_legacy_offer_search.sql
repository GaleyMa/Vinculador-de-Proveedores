-- Buscar publicaciones anteriores sin inventar su clasificación.
-- Los filtros de naturaleza/rubro siguen exigiendo datos explícitos.
begin;
create or replace function public.candidate_offers(
  p_query text default '', p_nature text default null, p_sector_id text default null, p_limit integer default 12
) returns table (
  id uuid, author_id uuid, title text, description text, image_url text,
  created_at timestamptz, nature text, sector_id text, sectors jsonb,
  profiles jsonb, post_tags jsonb
) language plpgsql security invoker set search_path = '' as $$
declare query_words text[];
begin
  if length(coalesce(p_query,'')) > 300 or (p_nature is not null and p_nature not in ('bien','servicio')) then
    raise exception 'Filtros no válidos' using errcode = '22023';
  end if;
  select coalesce(array_agg(distinct word), '{}'::text[]) into query_words
  from regexp_split_to_table(
    translate(lower(btrim(coalesce(p_query,''))), 'áéíóúü', 'aeiouu'), '\s+'
  ) word
  where word <> '' and word not in ('de','del','la','el','los','las','y','para','en','un','una');
  -- Una consulta solo con palabras de enlace no equivale a buscar todo.
  if btrim(coalesce(p_query,'')) <> '' and cardinality(query_words) = 0 then return; end if;
  return query
  select p.id, p.author_id, p.title, p.description, p.image_url, p.created_at, p.nature, p.sector_id,
    case when s.id is null then null else jsonb_build_object('name', s.name) end, jsonb_build_object('full_name', pr.full_name, 'role', pr.role),
    coalesce(tags.items, '[]'::jsonb)
  from public.posts p
  join public.profiles pr on pr.id = p.author_id
  left join public.sectors s on s.id = p.sector_id
  left join lateral (
    select jsonb_agg(jsonb_build_object('tags',jsonb_build_object('id',t.id,'name',t.name)) order by t.name) items,
      string_agg(t.name, ' ') names
    from public.post_tags pt join public.tags t on t.id = pt.tag_id where pt.post_id = p.id
  ) tags on true
  where auth.uid() is not null and pr.role in ('proveedor','socio')
    and nullif(btrim(p.title), '') is not null
    and (p.sector_id is null or s.active)
    and (p_nature is null or p.nature = p_nature)
    and (p_sector_id is null or p.sector_id = p_sector_id)
    and not exists (
      select 1 from unnest(query_words) word
      where position(word in translate(lower(coalesce(p.title,'') || ' ' || coalesce(p.description,'') || ' ' || coalesce(tags.names,'')), 'áéíóúü', 'aeiouu')) = 0
    )
  order by p.created_at desc, p.id
  limit least(greatest(coalesce(p_limit,12),0),30);
end;
$$;
revoke all on function public.candidate_offers(text,text,text,integer) from public, anon;
grant execute on function public.candidate_offers(text,text,text,integer) to authenticated;


notify pgrst, 'reload schema';
commit;

