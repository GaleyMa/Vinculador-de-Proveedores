// Compartido por el router y las pruebas de acceso directo.
export function routeAccess(auth, to) {
  const publicPage = ['/login', '/register'].includes(to.path)
  if (to.path === '/' && (!auth.user || auth.isGuest)) {return true}
  if (!auth.user) {return publicPage || isPublicSearch(to) ? true : '/login'}
  if (auth.isGuest) {return publicPage || isPublicSearch(to) ? true : '/'}
  if (auth.needsProfile) {return to.path === '/completar-perfil' ? true : '/completar-perfil'}
  if (publicPage || to.path === '/completar-perfil') {return '/'}
  return true
}


// Only public web search may create an anonymous browsing session.
// The homepage remains available without creating a session.
export async function prepareGuestAccess(auth, to) {
  if (!auth.user && to.path !== '/' && isPublicSearch(to)) {
    await auth.enterAsGuest()
  }
}

// Keep the guest destination internal and limited to public web search.
export function guestBrowseTarget(resolve, next) {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) {return '/'}
  const target = resolve(next)
  return isPublicSearch(target) ? target.fullPath : '/'
}

// Do not trust route metadata to expose directories or business profiles.
export function isPublicSearch(to) {
  return ['/', '/buscar'].includes(to.path)
}
export function requiresRegistration(auth, to) {
  return (!auth.user || auth.isGuest) && !isPublicSearch(to) && !['/login', '/register'].includes(to.path)
}
