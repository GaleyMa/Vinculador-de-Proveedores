// Una consulta fallida o parcial no confirma la ausencia de coincidencias.
export function searchResultCaption({ loading, searched, error, warnings = [], count = 0 }) {
  if (loading || !searched) return ''
  if (error || warnings.length > 0) {
    return count > 0 ? `${count} resultados disponibles · Consulta incompleta` : 'No se pudo completar la consulta'
  }
  return `${count} ${count === 1 ? 'resultado disponible' : 'resultados disponibles'} en esta consulta`
}

export async function describeAssistantError(error, { publicSearch = false } = {}) {
  const status = error?.context?.status
  let serverMessage = ''
  try {
    const body = await error.context.clone().json()
    if (typeof body.error === 'string') serverMessage = body.error.slice(0, 500)
  } catch { /* Los fallos de red y algunas respuestas no contienen JSON. */ }
  if (status === 401) return 'No pudimos validar tu sesión. Intenta de nuevo; si ya tienes cuenta, vuelve a iniciar sesión.'
  if (status === 403 && serverMessage === 'Origen no permitido.') return 'La búsqueda no está habilitada para esta dirección. El equipo debe revisar la configuración del servicio.'
  if (status === 404) return 'El servicio de búsqueda todavía no está disponible. Intenta más tarde.'
  if (status === 429) return serverMessage || 'Alcanzaste el límite de consultas. Intenta en 10 minutos.'
  if (serverMessage) return serverMessage
  return publicSearch ? 'No pudimos conectar con el servicio de búsqueda web. Reintenta en unos momentos.' : 'No pudimos completar la ayuda externa. Las ofertas internas que se hayan encontrado siguen disponibles.'
}
