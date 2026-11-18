import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'
import { createSSRApp, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderToString } from 'vue/server-renderer'

test('Pantallas Vue y sesiones: clasificación, fuentes y recuperación de acceso', async t => {
  const server = await createServer({ server: { middlewareMode:true, hmr:false, watch:null }, ssr:{noExternal:['vuetify']} })
  try {
    const { createPinia, setActivePinia } = await server.ssrLoadModule('pinia')
    const { VApp } = await server.ssrLoadModule('vuetify/components')
    const { createVuetify } = await server.ssrLoadModule('vuetify')
    const { useAuthStore } = await server.ssrLoadModule('/src/stores/auth.js')
    const { supabase } = await server.ssrLoadModule('/src/lib/supabase.js')
    const load = async path => (await server.ssrLoadModule(path)).default
    const CreatePost = await load('/src/pages/CreatePost.vue')
    const Card = await load('/src/components/PostCard.vue')
    const Assistant = await load('/src/pages/Assistant.vue')
    const WebCard = await load('/src/components/WebResultCard.vue')
    const NavBar = await load('/src/components/NavBar.vue')
    const prompt = await server.ssrLoadModule('/src/lib/registrationPrompt.js')
    const router = createRouter({history:createMemoryHistory(),routes:[{path:'/:pathMatch(.*)*',component:{render:()=>null}}]})
    await router.push('/')
    const setup = role => {
      const pinia = createPinia(); setActivePinia(pinia)
      const auth = useAuthStore()
      auth.user = {id:'user'}; auth.profile = {role}; auth.loading = false
      return {pinia,auth}
    }
    const render = (component,props,pinia) => renderToString(createSSRApp({render:()=>h(VApp,{}, {default:()=>h(component,props)})}).use(pinia).use(router).use(createVuetify()))
    await t.test('Proveedor y socio deben clasificar; cliente mantiene publicación general', async () => {
      for (const role of ['proveedor','socio']) {
        const {pinia} = setup(role)
        const html = await render(CreatePost,{},pinia)
        assert.match(html,/Publicar oferta/)
        assert.match(html,/Naturaleza de la oferta/)
        assert.match(html,/Rubro de la oferta/)
      }
      const {pinia} = setup('cliente')
      assert.doesNotMatch(await render(CreatePost,{},pinia),/Naturaleza de la oferta/)
    })
    await t.test('La tarjeta muestra clasificación propia y enlaces de filtro; fuentes no ejecutan HTML', async () => {
      const {pinia} = setup('cliente')
      const html = await render(Card,{post:{id:'post',author_id:'provider',title:'Cajas',nature:'bien',sector_id:'empaque',sectors:{name:'Empaque'}}},pinia)
      assert.match(html,/Bienes/)
      assert.match(html,/Empaque/)
      assert.match(html,/nature=bien/)
      const web = await render(WebCard,{result:{id:'W1',title:'<script>alert(1)</script>',source:'example.test',url:'https://example.test',content:'Proveedor externo'}},pinia)
      assert.doesNotMatch(web,/<script>/)
      assert.match(web,/noopener noreferrer/)
      assert.match(web,/example.test/)
      assert.match(web,/Encontrado en la web/)
      assert.match(html,/Publicado en SunFinder/)
    })
    await t.test('El asistente ofrece búsqueda interna y opciones externas explícitas', async () => {
      const {pinia} = setup('cliente')
      const html = await render(Assistant,{},pinia)
      assert.match(html,/Cuéntanos qué necesita tu empresa/)
      assert.match(html,/<textarea/)
      assert.match(html,/Usar mi perfil para orientar la respuesta/)
      assert.match(html,/Solo si lo activas/)
      assert.match(html,/Ayudarme a comparar los resultados/)
      assert.match(html,/Incluir opciones de la web/)
      const webInput = html.match(/<input[^>]*aria-label="Incluir opciones de la web"[^>]*>/)?.[0]
      assert.ok(webInput)
      assert.doesNotMatch(webInput,/checked/)
    })
    await t.test('Invitado solo ve búsqueda y registro en navegación', async () => {
      const {pinia,auth} = setup('cliente')
      auth.user = {id:'guest',is_anonymous:true}
      const html = await render(NavBar,{},pinia)
      assert.doesNotMatch(html,/href="\/publicar"/)
      assert.doesNotMatch(html,/href="\/asistente"/)
      assert.doesNotMatch(html,/href="\/(perfiles|necesidades|feed)"/)
      const web = await render(WebCard,{result:{title:'Cajas',source:'example.test',url:'https://example.test',content:'Oferta externa'}},pinia)
      assert.doesNotMatch(web,/href="https:\/\/example.test"/)
      assert.match(web,/example.test/)
    })
    await t.test('Búsqueda pública usa Tavily sin opciones de IA ni perfil', async () => {
      const {pinia,auth} = setup('cliente')
      auth.user = {id:'guest',is_anonymous:true}
      const html = await render(Assistant,{publicSearch:true},pinia)
      assert.match(html,/Encuentra opciones para tu empresa/)
      assert.match(html,/Tavily/)
      assert.match(html,/Ejemplos de búsqueda/)
      assert.doesNotMatch(html,/<textarea/)
      assert.doesNotMatch(html,/Ayudarme a comparar|Usar mi rol|Incluir opciones de la web/)
    })
    await t.test('Registro explica la acción elegida y no navega al abrir o cerrar', async () => {
      const previousPath = router.currentRoute.value.fullPath
      for (const [path, reason, title] of [
        ['/asistente','assistant','Dale forma a tu idea con IA'],
        ['/usuario/provider','company','Conoce a esta empresa'],
        ['/necesidades','needs','Descubre lo que necesitan otras empresas'],
      ]) {
        prompt.requestRegistration(prompt.registrationReasonForRoute(path))
        assert.equal(prompt.registrationReason.value,reason)
        assert.equal(prompt.registrationMessage.value.title,title)
        assert.equal(prompt.registrationPromptOpen.value,true)
        prompt.registrationPromptOpen.value=false
        assert.equal(router.currentRoute.value.fullPath,previousPath)
      }
      prompt.requestRegistration('source')
      assert.match(prompt.registrationMessage.value.description,/página original/)
      prompt.requestRegistration('interest')
      assert.match(prompt.registrationMessage.value.description,/marcar ofertas/)
      prompt.requestRegistration({type:'click'})
      assert.equal(prompt.registrationReason.value,'general')
      prompt.registrationPromptOpen.value=false
    })
    await t.test('Inicialización simultánea comparte petición y suscripción; callback Auth no devuelve promesa', async () => {
      const {auth} = setup('cliente')
      auth.loading = true
      let getSessions = 0, listeners = 0, callback, release
      supabase.auth.getSession = () => {getSessions++;return new Promise(resolve=>{release=resolve})}
      supabase.auth.onAuthStateChange = fn => {listeners++;callback=fn;return {data:{subscription:{unsubscribe(){}}}}}
      const first = auth.init(), second = auth.init()
      release({data:{session:null}})
      await Promise.all([first,second])
      assert.equal(getSessions,1)
      assert.equal(listeners,1)
      assert.equal(callback('SIGNED_OUT',null),undefined)
      assert.equal(auth.user,null)
      await auth.init()
      assert.equal(getSessions,1)
    })
  } finally { await server.close() }
})
