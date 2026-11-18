-- Búsqueda por empresa, palabras similares y relevancia, sin extensiones adicionales.
begin;
create or replace function public.sf_search_normalize(value text) returns text
language sql immutable parallel safe set search_path = '' as $$
 select btrim(translate(lower(coalesce(value,'')), 'áéíóúü', 'aeiouu'));
$$;
create or replace function public.sf_search_words(value text) returns text[]
language sql immutable parallel safe set search_path = '' as $$
 select coalesce(array_agg(distinct word), '{}'::text[])
 from regexp_split_to_table(public.sf_search_normalize(value), '\s+') word
 where word <> '' and word not in (
  'de','del','la','el','los','las','y','para','en','un','una','con','por','que',
  'busco','buscar','necesito','necesitamos','quiero','proveedor','proveedores'
 );
$$;
-- Un error de inserción, borrado, sustitución o transposición, solo en palabras >=4.
create or replace function public.sf_search_close(a text, b text) returns boolean
language plpgsql immutable parallel safe set search_path = '' as $$
declare i integer; differences integer[] := '{}'; longer text; shorter text;
begin
 if a=b then return true; end if;
 if least(length(a),length(b))<4 or abs(length(a)-length(b))>1 then return false; end if;
 if length(a)=length(b) then
  for i in 1..length(a) loop
   if substr(a,i,1)<>substr(b,i,1) then differences:=array_append(differences,i); end if;
  end loop;
  if cardinality(differences)=1 then return true; end if;
  return cardinality(differences)=2 and differences[2]=differences[1]+1
    and substr(a,differences[1],1)=substr(b,differences[2],1)
    and substr(a,differences[2],1)=substr(b,differences[1],1);
 end if;
 longer:=case when length(a)>length(b) then a else b end;
 shorter:=case when length(a)>length(b) then b else a end;
 for i in 1..length(longer) loop
  if substr(longer,1,i-1)||substr(longer,i+1)=shorter then return true; end if;
 end loop;
 return false;
end;
$$;
create or replace function public.sf_search_score(query_text text, document text) returns real
language plpgsql immutable parallel safe set search_path = '' as $$
declare words text[]:=public.sf_search_words(query_text); word text; normalized text:=public.sf_search_normalize(document);
 tokens text[]; vector tsvector; matched integer:=0; points integer:=0;
begin
 if btrim(coalesce(query_text,''))='' then return 1; end if;
 if cardinality(words)=0 then return 0; end if;
 select array_agg(distinct token) into tokens from regexp_split_to_table(normalized,'[^[:alnum:]_]+') token where token<>'';
 vector:=to_tsvector('pg_catalog.spanish'::regconfig,normalized);
 foreach word in array words loop
  if position(word in normalized)>0 then
   matched:=matched+1; points:=points+4;
  elsif vector @@ plainto_tsquery('pg_catalog.spanish'::regconfig,word) then
   matched:=matched+1; points:=points+3;
  elsif exists(select 1 from unnest(tokens) token where public.sf_search_close(word,token)) then
   matched:=matched+1; points:=points+1;
  end if;
 end loop;
 -- Hasta dos términos deben coincidir; las consultas largas permiten términos faltantes.
 if matched < ceil(cardinality(words)*0.6) then return 0; end if;
 return points::real/(cardinality(words)*4);
end;
$$;
create or replace function public.candidate_offers(
 p_query text default '', p_nature text default null, p_sector_id text default null, p_limit integer default 12
) returns table (
 id uuid, author_id uuid, title text, description text, image_url text,
 created_at timestamptz, nature text, sector_id text, sectors jsonb, profiles jsonb, post_tags jsonb
) language plpgsql security invoker set search_path = '' as $$
begin
 if length(coalesce(p_query,''))>300 or (p_nature is not null and p_nature not in ('bien','servicio')) then
  raise exception 'Filtros no válidos' using errcode='22023';
 end if;
 return query
 select p.id,p.author_id,p.title,p.description,p.image_url,p.created_at,p.nature,p.sector_id,
  case when s.id is null then null else jsonb_build_object('name',s.name) end,
  jsonb_build_object('full_name',pr.full_name,'role',pr.role),coalesce(tags.items,'[]'::jsonb)
 from public.posts p
 join public.profiles pr on pr.id=p.author_id
 left join public.sectors s on s.id=p.sector_id
 left join lateral (
  select jsonb_agg(jsonb_build_object('tags',jsonb_build_object('id',t.id,'name',t.name)) order by t.name) items,
   string_agg(t.name,' ') names
  from public.post_tags pt join public.tags t on t.id=pt.tag_id where pt.post_id=p.id
 ) tags on true
 cross join lateral (select public.sf_search_score(p_query,
  coalesce(pr.full_name,'')||' '||coalesce(p.title,'')||' '||coalesce(p.description,'')||' '||coalesce(tags.names,'')||' '||coalesce(s.name,'')) score) relevance
 where auth.uid() is not null and pr.role in ('proveedor','socio')
  and nullif(btrim(p.title),'') is not null and (p.sector_id is null or s.active)
  and (p_nature is null or p.nature=p_nature) and (p_sector_id is null or p.sector_id=p_sector_id)
  and relevance.score>0
 order by relevance.score desc,
  public.sf_search_score(p_query,pr.full_name) desc,
  public.sf_search_score(p_query,p.title) desc,p.created_at desc,p.id
 limit least(greatest(coalesce(p_limit,12),0),30);
end;
$$;
create or replace function public.search_profiles_flexible(
 p_query text default '', p_tag text default null, p_limit integer default 20, p_offset integer default 0
) returns table (
 id uuid,full_name text,role text,avatar_url text,bio text,profile_tags jsonb,provider_classifications jsonb,total_count bigint
) language plpgsql security invoker set search_path = '' as $$
begin
 if length(coalesce(p_query,''))>300 or length(coalesce(p_tag,''))>100 then
  raise exception 'Filtros no válidos' using errcode='22023';
 end if;
 return query
 select pr.id,pr.full_name,pr.role,pr.avatar_url,pr.bio,coalesce(tags.items,'[]'::jsonb),
  case when pc.profile_id is null then null else jsonb_build_object('sectors',jsonb_build_object('name',s.name)) end,
  count(*) over()
 from public.profiles pr
 left join public.provider_classifications pc on pc.profile_id=pr.id
 left join public.sectors s on s.id=pc.sector_id
 left join lateral (
  select jsonb_agg(jsonb_build_object('tags',jsonb_build_object('id',t.id,'name',t.name)) order by t.name) items,string_agg(t.name,' ') names
  from public.profile_tags pt join public.tags t on t.id=pt.tag_id where pt.profile_id=pr.id
 ) tags on true
 cross join lateral (select public.sf_search_score(p_query,
  coalesce(pr.full_name,'')||' '||coalesce(pr.bio,'')||' '||coalesce(tags.names,'')||' '||coalesce(s.name,'')) score) relevance
 where auth.uid() is not null and relevance.score>0
  and (p_tag is null or exists(select 1 from public.profile_tags pt join public.tags t on t.id=pt.tag_id where pt.profile_id=pr.id and t.name=p_tag))
 order by public.sf_search_score(p_query,pr.full_name) desc,relevance.score desc,pr.full_name,pr.id
 limit least(greatest(coalesce(p_limit,20),1),100) offset greatest(coalesce(p_offset,0),0);
end;
$$;
revoke all on function public.sf_search_normalize(text),public.sf_search_words(text),public.sf_search_close(text,text),public.sf_search_score(text,text) from public,anon;
grant execute on function public.sf_search_normalize(text),public.sf_search_words(text),public.sf_search_close(text,text),public.sf_search_score(text,text) to authenticated,service_role;
revoke all on function public.candidate_offers(text,text,text,integer),public.search_profiles_flexible(text,text,integer,integer) from public,anon;
grant execute on function public.candidate_offers(text,text,text,integer),public.search_profiles_flexible(text,text,integer,integer) to authenticated,service_role;
notify pgrst,'reload schema';
commit;
