import assert from 'node:assert/strict'
import test from 'node:test'
import { guestBrowseTarget, prepareGuestAccess, requiresRegistration, routeAccess } from '../src/lib/routeAccess.js'

test('Solo portada y búsqueda IA quedan disponibles al público, incluso con metadata antigua', async () => {
  for (const user of [null, {id:'guest',is_anonymous:true}]) {
    const auth = {user,isGuest:Boolean(user)}
    for (const path of ['/','/asistente','/login','/register']) {
      assert.equal(requiresRegistration(auth,{path}),false)
      assert.equal(routeAccess(auth,{path}),true)
    }
    for (const path of ['/feed','/perfiles','/usuario/provider','/necesidades','/necesidades/id','/publicar','/perfil']) {
      const to = {path,meta:{guestOk:true}}
      assert.equal(requiresRegistration(auth,to),true)
      assert.notEqual(routeAccess(auth,to),true)
    }
  }
})
test('Solo el asistente crea sesión técnica y conserva las sesiones existentes', async () => {
  let calls=0
  const auth={user:null,async enterAsGuest(){calls++;this.user={id:'guest'}}}
  for (const path of ['/','/perfiles','/feed']) await prepareGuestAccess(auth,{path,meta:{guestOk:true}})
  assert.equal(calls,0)
  await prepareGuestAccess(auth,{path:'/asistente'})
  await prepareGuestAccess(auth,{path:'/asistente'})
  assert.equal(calls,1)
})
test('Cuentas registradas conservan acceso a empresas y publicaciones', () => {
  const auth={user:{id:'member'},isGuest:false,needsProfile:false}
  for (const path of ['/feed','/perfiles','/usuario/provider','/necesidades','/publicar']) {
    assert.equal(requiresRegistration(auth,{path}),false)
    assert.equal(routeAccess(auth,{path}),true)
  }
})
test('El fallo de sesión técnica se propaga', async () => {
  await assert.rejects(prepareGuestAccess({user:null,async enterAsGuest(){throw new Error('disabled')}},{path:'/asistente'}),/disabled/)
})
test('Explorar sin cuenta vuelve a búsqueda pública, nunca al directorio o feed', () => {
  const resolve=path=>({path:path.split('?')[0],fullPath:path,meta:{guestOk:true}})
  for(const path of [undefined,'/feed','/perfiles','/usuario/id','//example.com','https://example.com']) assert.equal(guestBrowseTarget(resolve,path),'/')
  assert.equal(guestBrowseTarget(resolve,'/?q=cajas'),'/?q=cajas')
  assert.equal(guestBrowseTarget(resolve,'/asistente'),'/asistente')
})
