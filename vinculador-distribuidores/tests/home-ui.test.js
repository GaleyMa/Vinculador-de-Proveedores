import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routeAccess } from '../src/lib/routeAccess.js'

test('La portada es pública; las rutas de datos conservan sus permisos', () => {
  assert.equal(routeAccess({ user: null }, { path: '/' }), true)
  for (const path of ['/perfil', '/publicar', '/asistente', '/feed']) {
    assert.equal(routeAccess({ user: null }, { path }), '/login')
    assert.equal(routeAccess({ user: { id: 'guest' }, isGuest: true }, { path }), '/')
  }
  assert.equal(routeAccess({ user: { id: 'registered' }, needsProfile: true }, { path: '/' }), '/completar-perfil')
})

test('Portada real Vue: búsqueda visible y enlaces a rubros sin crear sesión al visitar', async () => {
  const server = await createServer({
    envFile: false,
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('http://127.0.0.1:54321'),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('test-key'),
    },
    server: { middlewareMode: true, hmr: false, watch: null },
    ssr: { noExternal: ['vuetify'] },
  })
  try {
    const { createPinia, setActivePinia } = await server.ssrLoadModule('pinia')
    const { createVuetify } = await server.ssrLoadModule('vuetify')
    const { VApp } = await server.ssrLoadModule('vuetify/components')
    const { useAuthStore } = await server.ssrLoadModule('/src/stores/auth.js')
    const Home = (await server.ssrLoadModule('/src/pages/Home.vue')).default
    const pinia = createPinia(); setActivePinia(pinia)
    const auth = useAuthStore()
    auth.loading = false
    let guestCalls = 0
    auth.enterAsGuest = async () => { guestCalls++ }
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: Home }] })
    await router.push('/'); await router.isReady()
    const html = await renderToString(createSSRApp({ render: () => h(VApp, {}, { default: () => h(Home) }) }).use(pinia).use(router).use(createVuetify()))
    assert.match(html, /Encuentra proveedores/)
    assert.match(html, /Puedes explorar sin crear una cuenta/)
    assert.match(html, /Ejemplos de búsqueda/)
    for (const example of ['Empaques', 'Mantenimiento', 'Transporte']) assert.match(html, new RegExp('>' + example + '</button>'))
    for (const sector of ['empaque', 'mantenimiento', 'transporte']) assert.match(html, new RegExp('sector=' + sector))
    assert.equal(guestCalls, 0)
    assert.ok(html.indexOf('id="home-search"') < html.indexOf('class="home-visual"'))
  } finally { await server.close() }
})
