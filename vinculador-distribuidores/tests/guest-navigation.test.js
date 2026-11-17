import assert from 'node:assert/strict'
import test from 'node:test'
import { guestBrowseTarget, prepareGuestAccess, routeAccess } from '../src/lib/routeAccess.js'

test('Las rutas de exploración crean sesión invitada y permiten continuar', async () => {
  for (const path of ['/feed', '/perfiles', '/necesidades', '/usuario/provider']) {
    let calls = 0
    const auth = {
      user: null,
      get isGuest() { return this.user?.is_anonymous === true },
      async enterAsGuest() { calls++; this.user = { id: 'guest', is_anonymous: true } },
    }
    const to = { path, meta: { guestOk: true } }
    await prepareGuestAccess(auth, to)
    assert.equal(calls, 1)
    assert.equal(routeAccess(auth, to), true)
    await prepareGuestAccess(auth, to)
    assert.equal(calls, 1)
  }
})

test('La portada y las rutas privadas no crean sesiones de invitado', async () => {
  let calls = 0
  const auth = { user: null, async enterAsGuest() { calls++ } }
  await prepareGuestAccess(auth, { path: '/', meta: { guestOk: true } })
  for (const path of ['/publicar', '/perfil', '/asistente']) {
    await prepareGuestAccess(auth, { path })
    assert.equal(routeAccess(auth, { path }), '/login')
  }
  assert.equal(calls, 0)
})

test('Una sesión real conserva su identidad al navegar por rutas públicas', async () => {
  const auth = { user: { id: 'member' }, async enterAsGuest() { assert.fail('No reemplazar una sesión real') } }
  await prepareGuestAccess(auth, { path: '/perfiles', meta: { guestOk: true } })
  assert.equal(auth.user.id, 'member')
})

test('El fallo del acceso anónimo se propaga para informar al usuario', async () => {
  const auth = { user: null, async enterAsGuest() { throw new Error('Anonymous sign-ins disabled') } }
  await assert.rejects(prepareGuestAccess(auth, { path: '/perfiles', meta: { guestOk: true } }), /disabled/)
  assert.equal(auth.user, null)
})

test('El botón invitado abre ofertas o retoma una ruta de exploración segura', () => {
  const resolve = path => ({ path: path.split('?')[0], fullPath: path, meta: { guestOk: ['/perfiles', '/feed'].includes(path.split('?')[0]) } })
  assert.equal(guestBrowseTarget(resolve), '/feed')
  assert.equal(guestBrowseTarget(resolve, '/'), '/feed')
  assert.equal(guestBrowseTarget(resolve, '/perfiles?q=cajas'), '/perfiles?q=cajas')
  for (const path of ['https://example.com', '//example.com', '/publicar', '/asistente']) assert.equal(guestBrowseTarget(resolve, path), '/feed')
})
