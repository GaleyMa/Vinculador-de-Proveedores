import { literalPattern, quotedFilter, searchParam } from './searchUtils.js'

export const PROFILES_PAGE_SIZE = 20

const SECTOR = 'provider_classifications(sectors(name))'
// Tabla o relación inexistente en ese entorno: se reintenta sin el rubro en vez de romper la búsqueda
const MISSING_FEATURE = new Set(['42P01', 'PGRST200', 'PGRST205'])

export async function searchProfiles(client, { text = '', tag = '', page = 1, pageSize = PROFILES_PAGE_SIZE, signal } = {}) {
  text = searchParam(text)
  tag = searchParam(tag)
  if (text) {
    let request = client.rpc('search_profiles_flexible', {
      p_query: text, p_tag: tag || null, p_limit: pageSize, p_offset: (page - 1) * pageSize,
    })
    if (signal) {request = request.abortSignal(signal)}
    const result = await request
    if (!result.error) {
      return { profiles: result.data ?? [], total: Number(result.data?.[0]?.total_count ?? 0) }
    }
    // Compatibilidad mientras se aplica la nueva migración; otros errores no se ocultan.
    if (!['PGRST202', '42883'].includes(result.error.code)) {throw result.error}
  }
  const baseColumns = ['id', 'full_name', 'role', 'avatar_url', 'bio', 'profile_tags(tags(id, name))']
  if (text) {
    baseColumns.push('matching_tags:profile_tags(tags!inner(name))')
  }
  if (tag) {
    baseColumns.push('selected_tags:profile_tags!inner(tags!inner(name))')
  }

  function buildQuery(includeSector) {
    const columns = includeSector ? [...baseColumns, SECTOR] : baseColumns
    let query = client.from('profiles').select(columns.join(','), { count: 'exact' })
    if (text) {
      const pattern = literalPattern(text)
      const quoted = quotedFilter(pattern)
      // A profile can match its name even when it has no tags or publications.
      query = query
        .filter('matching_tags.tags.name', 'imatch', pattern)
        .or(`full_name.imatch.${quoted},matching_tags.not.is.null`)
    }
    if (tag) {
      query = query.eq('selected_tags.tags.name', tag)
    }

    const start = (page - 1) * pageSize
    query = query
      .order('full_name', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })
      .range(start, start + pageSize - 1)
    if (signal) {
      query = query.abortSignal(signal)
    }
    return query
  }

  let { data, count, error } = await buildQuery(true)
  if (error && MISSING_FEATURE.has(error.code)) {
    ({ data, count, error } = await buildQuery(false))
  }
  if (error) {
    throw error
  }
  return { profiles: data ?? [], total: count ?? 0 }
}