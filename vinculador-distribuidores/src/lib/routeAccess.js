// Compartido por el router y las pruebas de acceso directo.
export function routeAccess(auth, to) {
  const publicPage = ['/login', '/register'].includes(to.path)
  if (to.path === '/' && (!auth.user || auth.isGuest)) {return true}
  if (!auth.user) {return publicPage ? true : '/login'}
  if (auth.isGuest) {return publicPage || to.meta?.guestOk ? true : '/'}
  if (auth.needsProfile) {return to.path === '/completar-perfil' ? true : '/completar-perfil'}
  if (publicPage || to.path === '/completar-perfil') {return '/'}
  return true
}


// Only routes already marked guestOk may create an anonymous browsing session.
// The homepage remains available without creating a session.
export async function prepareGuestAccess(auth, to) {
  if (!auth.user && to.path !== '/' && to.meta?.guestOk) {
    await auth.enterAsGuest()
  }
}

// Keep the post-login destination internal and limited to guest-enabled routes.
export function guestBrowseTarget(resolve, next) {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) {return '/feed'}
  const target = resolve(next)
  return target.meta?.guestOk && target.path !== '/' ? target.fullPath : '/feed'
}
