<template>
  <div
    ref="scroller"
    aria-label="Publicaciones recomendadas"
    class="reco-scroller"
    tabindex="0"
    @scroll.passive="onScroll"
  >
    <div v-if="store.loading" class="reco-slide">
      <div class="text-center ma-auto" role="status">
        <v-progress-circular aria-label="Cargando recomendaciones" indeterminate />
        <p class="mt-2">Buscando recomendaciones…</p>
      </div>
    </div>

    <div v-else-if="store.error" class="reco-slide">
      <v-alert class="reco-card" type="error">
        {{ store.error }}
        <v-btn variant="text" @click="retry">Reintentar</v-btn>
        <v-btn v-if="store.hasFilters" variant="text" @click="store.setFilters()">Limpiar filtros</v-btn>
      </v-alert>
    </div>

    <template v-else>
      <div v-for="post in store.items" :key="post.id" class="reco-slide">
        <PostCard class="reco-card" :post="post" @deleted="store.reset()" />
      </div>

      <div v-if="store.noMore" class="reco-slide">
        <v-alert class="reco-card" role="status" type="info" variant="tonal">
          <template v-if="store.items.length > 0">No hay más recomendaciones por ahora.</template>
          <template v-else-if="store.hasFilters">No hay publicaciones recomendadas que coincidan con los filtros seleccionados. Prueba otra naturaleza o rubro.</template>
          <template v-else>Todavía no hay recomendaciones disponibles para ti.</template>
          <v-btn v-if="store.hasFilters" class="mt-2" variant="text" @click="store.setFilters()">Limpiar filtros</v-btn>
        </v-alert>
      </div>
    </template>
  </div>
</template>

<script setup>
  import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import PostCard from '@/components/PostCard.vue'
  import { useRecommendationsStore } from '@/stores/recommendations'

  const store = useRecommendationsStore()
  const scroller = ref(null)
  let settleTimer
  let scrolling = false
  let idleWaiters = []

  // Measure real slide positions: expanded descriptions and mobile images change heights.
  function slideTop(index) {
    const el = scroller.value, slide = el?.querySelectorAll('.reco-slide')[index]
    if (!el || !slide) return 0
    return slide.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop
  }

  function pinToActive() {
    scroller.value?.scrollTo({ top: slideTop(store.activeIndex), behavior: 'instant' })
  }

  async function start() {
    await store.init()
    await nextTick()
    pinToActive()
  }

  function retry() {
    store.reset()
  }

  function onScroll() {
    scrolling = true
    clearTimeout(settleTimer)
    settleTimer = setTimeout(() => {
      scrolling = false
      onSettled()
      flushIdle()
    }, 120)
  }

  // El store espera esta promesa antes de modificar la lista
  function waitIdle() {
    return scrolling ? new Promise(resolve => idleWaiters.push(resolve)) : Promise.resolve()
  }

  function flushIdle() {
    for (const resolve of idleWaiters) resolve()
    idleWaiters = []
  }

  function onSettled() {
    const el = scroller.value
    if (!el || store.loading || store.items.length === 0) return
    let idx = 0
    for (let i = 1; i < store.items.length; i++) {
      if (slideTop(i) <= el.scrollTop + el.clientHeight * 0.35) idx = i
    } // el slide final no es un post
    const diff = idx - store.activeIndex
    if (diff === 0) return
  
    store.activeIndex = idx
    for (let i = 0; i < Math.abs(diff); i++) {
      store.advance(Math.sign(diff), waitIdle).then(async changed => {
        if (!changed) return
        await nextTick()
        pinToActive()
      })
    }
  }

  onMounted(start)
  watch(() => store.resets, start)
  onBeforeUnmount(() => {
    clearTimeout(settleTimer)
    flushIdle() // que ninguna tarea del store se quede esperando
  })
</script>

<style scoped>
  .reco-scroller {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
    overflow-anchor: none;
    overscroll-behavior-y: contain;
    scroll-snap-type: y proximity;
  }

  .reco-slide {
    min-height: 100%;
    height: auto;
    display: flex;
    overflow: visible;
    padding: 16px;
    scroll-snap-align: start;
    scroll-snap-stop: normal;       /* no deja saltarse posts de un golpe */
  }

  .reco-card {
    margin: auto;
    width: 100%;
    max-width: 720px;
  }
</style>
