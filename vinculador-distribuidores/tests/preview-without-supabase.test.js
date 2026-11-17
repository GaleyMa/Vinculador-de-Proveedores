import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'

test('Un preview sin variables de Supabase renderiza portada y aviso', async () => {
  const server = await createServer({
    envFile: false,
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(''),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(''),
    },
    server: { middlewareMode: true, hmr: false, watch: null },
    ssr: { noExternal: ['vuetify'] },
  })
  try {
    const { createPinia, setActivePinia } = await server.ssrLoadModule('pinia')
    const { createVuetify } = await server.ssrLoadModule('vuetify')
    const { supabase, supabaseConfigured } = await server.ssrLoadModule('/src/lib/supabase.js')
    const { useAuthStore } = await server.ssrLoadModule('/src/stores/auth.js')
    const Home = (await server.ssrLoadModule('/src/pages/Home.vue')).default
    const App = (await server.ssrLoadModule('/src/App.vue')).default
    const pinia = createPinia()
    setActivePinia(pinia)
    const auth = useAuthStore()
    assert.equal(supabaseConfigured, false)
    await auth.init()
    assert.equal(auth.user, null)
    assert.equal(auth.loading, false)
    assert.throws(() => supabase.from('posts'), /conexión con SunFinder/)
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: Home }, { path: '/:pathMatch(.*)*', component: { render: () => null } }] })
    await router.push('/')
    await router.isReady()
    const html = await renderToString(createSSRApp({ render: () => h(App) }).use(pinia).use(router).use(createVuetify()))
    assert.match(html, /Encuentra proveedores/)
    assert.match(html, /Puedes explorar sin crear una cuenta/)
    assert.match(html, /no podemos conectar con la plataforma/)
    assert.match(html, /Empaque/)
  } finally { await server.close() }
})
