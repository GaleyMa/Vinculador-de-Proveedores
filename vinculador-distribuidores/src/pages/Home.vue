<template>
  <template v-if="hasSearch">
    <v-container v-if="!auth.user" class="py-8" max-width="1100">
      <v-alert v-if="error" type="error">{{ error }} <v-btn variant="text" @click="prepareSearch">Reintentar</v-btn></v-alert>
      <p v-else role="status">Preparando tu búsqueda…</p>
    </v-container>

    <Feed v-else />
  </template>

  <v-container v-else class="home-page" max-width="1180">
    <section class="home-hero">
      <div class="home-copy">
        <p class="eyebrow">CONEXIONES ENTRE EMPRESAS</p>
        <h1>Encuentra proveedores<br class="desktop-break"> para tu empresa</h1>
        <p class="hero-description">Busca productos o servicios y descubre nuevas oportunidades, a tu ritmo.</p>

        <form role="search" @submit.prevent="search">
          <label for="home-search">¿Qué estás buscando?</label>

          <div class="home-search"><input
                                     id="home-search"
                                     v-model="query"
                                     maxlength="200"
                                     placeholder="Ej. cajas de cartón o mantenimiento"
                                     required
                                     type="search"
                                   >

            <v-btn size="large" type="submit">Buscar <v-icon end icon="mdi-arrow-right" /></v-btn></div>
        </form>

        <p v-if="!auth.user || auth.isGuest" class="home-note"><v-icon icon="mdi-check-circle-outline" size="16" /> Puedes explorar sin crear una cuenta.</p>
        <RouterLink v-else class="home-note d-inline-block" to="/feed">Ver recomendaciones para tu empresa →</RouterLink>
      </div>

      <div class="home-visual">
        <img alt="Dos personas revisan una muestra de cartón en una bodega" fetchpriority="high" :src="hero">
        <div class="home-photo-caption"><span class="photo-dot" /><div><strong>Conoce lo que otras empresas ofrecen</strong><p>Encuentra tu próxima oportunidad</p></div></div>
      </div>
    </section>

    <section aria-labelledby="category-title" class="home-categories">
      <div class="section-intro"><div><p class="eyebrow">EMPIEZA POR AQUÍ</p><h2 id="category-title">Explora por rubro</h2></div><p>Un buen punto de partida para tu búsqueda.</p></div>

      <div class="category-grid">
        <RouterLink v-for="item in categories" :key="item.id" class="category-card" :to="{path:'/',query:{sector:item.id}}">
          <img alt="" loading="lazy" :src="item.image"><div><span>{{ item.name }}</span><v-icon icon="mdi-arrow-up-right" size="20" /></div>
        </RouterLink>
      </div>
    </section>

    <section class="home-help"><v-icon icon="mdi-creation-outline" size="28" /><div><h2>¿No sabes por dónde empezar?</h2><p>Cuéntale al asistente qué necesitas y explora opciones dentro y fuera de SunFinder.</p></div><v-btn :to="!auth.user || auth.isGuest ? '/login' : '/asistente'" variant="outlined">Buscar con ayuda</v-btn></section>
    <p class="home-footer">SunFinder · Nuevas conexiones, más oportunidades.</p>
  </v-container>
</template>
<script setup>
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import empaque from '@/assets/home/empaque.webp'
  import hero from '@/assets/home/hero.webp'
  import mantenimiento from '@/assets/home/mantenimiento.webp'
  import transporte from '@/assets/home/transporte.webp'
  import Feed from '@/pages/Feed.vue'
  import { useAuthStore } from '@/stores/auth'
  const auth = useAuthStore(), route = useRoute(), router = useRouter()
  const query = ref(''), error = ref('')
  const hasSearch = computed(() => ['q','tag','nature','sector'].some(key => Boolean(route.query[key])))
  const categories = [{id:'empaque',name:'Empaque',image:empaque},{id:'mantenimiento',name:'Mantenimiento',image:mantenimiento},{id:'transporte',name:'Transporte',image:transporte}]
  let preparing = false
  async function prepareSearch() {
    if (auth.user || preparing || !hasSearch.value) return
    preparing = true; error.value = ''
    try { await auth.enterAsGuest() }
    catch { error.value = 'No pudimos abrir la búsqueda como invitado. Intenta de nuevo o inicia sesión.' }
    finally { preparing = false }
  }
  function search() { const q = query.value.trim(); if(q) router.push({path:'/',query:{q}}) }
  watch(hasSearch, prepareSearch, {immediate:true})
</script>
