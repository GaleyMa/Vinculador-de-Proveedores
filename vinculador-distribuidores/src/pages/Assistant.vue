<template>
  <v-container class="assistant-page" max-width="1040">
    <header class="search-page-heading">
      <p class="eyebrow">{{ publicSearch ? 'BÚSQUEDA PÚBLICA' : 'TU ASISTENTE EN SUNFINDER' }}</p>
      <h1 class="page-title mb-2">{{ publicSearch ? 'Encuentra opciones para tu empresa' : 'Cuéntanos qué necesita tu empresa' }}</h1>
      <p class="text-muted">{{ publicSearch ? 'Explora resultados de la web sin cuenta ni personalización.' : 'Dinos qué tienes en mente. Te ayudamos a comparar opciones y dar el siguiente paso.' }}</p>
    </header>

    <section v-if="submittedQuery" aria-label="Tu búsqueda" class="search-results-heading">
      <div><p class="text-caption text-muted">TU BÚSQUEDA</p><h2>Opciones para “{{ submittedQuery }}”</h2><p v-if="searched && !loading" class="text-caption text-muted">{{ offers.length + web.length }} resultados disponibles en esta consulta</p></div>
      <v-btn :disabled="loading" prepend-icon="mdi-pencil-outline" variant="outlined" @click="editSearch">Cambiar búsqueda</v-btn>
    </section>

    <v-form v-show="formVisible" class="assistant-form" :disabled="loading" @submit.prevent="search">
      <v-text-field
        v-if="publicSearch"
        ref="queryField"
        v-model="query"
        clearable
        counter="300"
        label="¿Qué estás buscando?"
        maxlength="300"
        placeholder="Ej. cajas de cartón o mantenimiento"
      />

      <v-textarea
        v-else
        ref="queryField"
        v-model="query"
        auto-grow
        counter="300"
        label="¿Qué tienes en mente?"
        maxlength="300"
        placeholder="Busco empaques para enviar productos frágiles…"
        rows="3"
      />

      <div aria-label="Ejemplos de búsqueda" class="search-examples mb-5"><span>Por ejemplo:</span>

        <button
          v-for="example in examples"
          :key="example"
          :disabled="loading"
          type="button"
          @click="searchExample(example)"
        >{{ example }}</button></div>

      <OfferFilters v-model:nature="nature" v-model:sector-id="sectorId" />

      <template v-if="!publicSearch">
        <div class="assistant-options">
          <v-checkbox v-model="useAI" hide-details label="Ayudarme a comparar los resultados" />
          <v-checkbox v-model="useWeb" hide-details label="Incluir opciones de la web" />

          <div v-if="useAI" class="personalization-option">
            <v-checkbox v-model="personalize" hide-details label="Usar mi perfil para orientar la respuesta" />
            <p class="text-caption text-muted">Solo si lo activas: usaremos tu rol, descripción y especialidades. Puedes buscar sin compartir esos datos con la IA.</p>
          </div>
        </div>
      </template>

      <p class="text-caption text-muted mt-4">{{ publicSearch ? 'La búsqueda consulta fuentes externas mediante Tavily. No usa tu perfil.' : 'La comparación utiliza Gemini y la búsqueda web opcional utiliza Tavily. Evita compartir información confidencial.' }}</p>

      <v-btn
        class="mt-4"
        color="primary"
        :loading="loading"
        prepend-icon="mdi-magnify"
        size="large"
        type="submit"
      >{{ publicSearch ? 'Buscar proveedores' : 'Encontrar opciones' }}</v-btn>
    </v-form>

    <v-alert
      v-if="error"
      class="mb-4"
      role="alert"
      type="error"
      variant="tonal"
    >
      {{ error }}
      <div class="mt-2"><v-btn :disabled="loading" variant="text" @click="search">Reintentar</v-btn><v-btn variant="text" @click="editSearch">Cambiar búsqueda</v-btn></div>
    </v-alert>

    <v-alert
      v-for="warning in warnings"
      :key="warning"
      class="mb-3"
      type="warning"
      variant="tonal"
    >{{ warning }}</v-alert>

    <div v-if="warnings.length > 0 && !loading" class="recovery-actions mb-4"><v-btn prepend-icon="mdi-refresh" variant="outlined" @click="search">Reintentar consulta</v-btn><v-btn variant="text" @click="editSearch">Cambiar búsqueda</v-btn></div>

    <section v-if="loading" aria-busy="true" aria-label="Buscando opciones">
      <p class="assistant-loading" role="status"><v-progress-circular indeterminate size="22" /><span>Estamos buscando opciones para tu empresa…</span></p>
      <div aria-hidden="true" class="search-result-grid"><div v-for="n in 3" :key="n" class="result-skeleton"><span class="skeleton-line skeleton-short" /><span class="skeleton-line skeleton-title" /><span class="skeleton-line" /><span class="skeleton-line" /><span class="skeleton-button" /></div></div>
    </section>

    <section v-if="summary && !loading" aria-label="Resumen del asistente" class="assistant-summary mb-5">
      <div class="d-flex align-center ga-2 mb-3"><v-icon color="secondary" icon="mdi-creation-outline" /><h2 class="text-h6">Una guía para comparar</h2></div>
      <p class="summary">{{ summary }}</p>
      <p class="text-caption text-muted mt-3">Resumen generado por IA. Confirma los detalles en las fuentes.</p>
    </section>

    <template v-if="searched && !loading">
      <template v-if="!publicSearch">
        <h2 class="text-h6 mb-3">Ofertas en SunFinder</h2>
        <div v-if="offers.length === 0" class="search-empty mb-5"><v-icon color="secondary" icon="mdi-magnify" size="32" /><h3>No encontramos ofertas con esos términos</h3><p>Prueba con menos palabras o cambia el rubro. Por ejemplo, “empaques” en lugar de una descripción larga.</p><v-btn variant="outlined" @click="editSearch">Ajustar búsqueda</v-btn></div>
        <div v-for="(offer, index) in offers" :key="offer.id"><p class="text-caption text-muted mb-2">Opción {{ index + 1 }} · En SunFinder</p><PostCard :post="offer" @deleted="offers = offers.filter(item => item.id !== $event)" /></div>
      </template>

      <section v-if="webRequested" aria-labelledby="web-results-title">
        <div class="section-intro mt-5"><div><h2 id="web-results-title" class="text-h6">Resultados de la web</h2><p class="text-caption text-muted mt-1">Información de fuentes externas. Estos negocios no están verificados por SunFinder.</p></div></div>
        <div v-if="web.length === 0 && warnings.length === 0" class="search-empty"><v-icon color="secondary" icon="mdi-web" size="32" /><h3>No encontramos opciones web para esta consulta</h3><p>Prueba con un producto o servicio más general. También puedes ajustar los filtros.</p><v-btn variant="outlined" @click="editSearch">Probar otra búsqueda</v-btn></div>
        <div class="search-result-grid"><WebResultCard v-for="(result, index) in web" :key="result.url" :number="index + 1" :result="result" /></div>
      </section>
    </template>
  </v-container>
</template>
<script setup>
  import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
  import OfferFilters from '@/components/OfferFilters.vue'
  import PostCard from '@/components/PostCard.vue'
  import WebResultCard from '@/components/WebResultCard.vue'
  import { candidateOffers } from '@/lib/offers'
  import { supabase } from '@/lib/supabase'
  const props = defineProps({ initialQuery: { type: String, default: '' }, initialNature: { type: String, default: '' }, initialSector: { type: String, default: '' }, publicSearch: Boolean, autoSearch: Boolean })
  const query = ref(props.initialQuery), nature = ref(props.initialNature || null), sectorId = ref(props.initialSector || null)
  const personalize = ref(false)
  const useAI = ref(!props.publicSearch), useWeb = ref(props.publicSearch), loading = ref(false), searched = ref(false), webRequested = ref(false)
  const offers = ref([]), web = ref([]), warnings = ref([]), summary = ref(''), error = ref('')
  const queryField = ref(null), formVisible = ref(true), submittedQuery = ref('')
  const examples = props.publicSearch ? ['Empaques', 'Mantenimiento', 'Transporte'] : ['Empaques para productos frágiles', 'Mantenimiento de maquinaria', 'Transporte para entregas locales']
  async function editSearch() {
    formVisible.value = true
    await nextTick()
    queryField.value?.focus()
    queryField.value?.$el?.scrollIntoView?.({ block: 'center', behavior: 'auto' })
  }
  function searchExample(example) { query.value = example; search() }
  let version = 0
  onBeforeUnmount(() => { version++ })
  onMounted(() => { if (props.autoSearch && String(query.value || '').trim().length >= 3) search() })
  async function search() {
    if (loading.value) return
    error.value = ''
    if (String(query.value || '').trim().length < 3) { error.value = 'Escribe al menos 3 caracteres.'; return }
    const current = ++version
    submittedQuery.value = String(query.value || '').trim()
    formVisible.value = false
    const input = { query: String(query.value || '').trim(), nature: nature.value || null, sectorId: sectorId.value || null, ai: !props.publicSearch && useAI.value, web: props.publicSearch || useWeb.value, publicSearch: props.publicSearch, personalize: !props.publicSearch && useAI.value && personalize.value }
    loading.value = true
    searched.value = false
    offers.value = []; web.value = []; summary.value = ''; warnings.value = []
    webRequested.value = input.web
    try {
      const local = props.publicSearch ? [] : await candidateOffers(supabase, input)
      if (current !== version) return
      offers.value = local
      if (input.ai || input.web) {
        const { data, error: invokeError } = await supabase.functions.invoke('supplier-assistant', { body: input })
        if (current !== version) return
        if (invokeError) {
          let message = props.publicSearch ? 'No pudimos consultar la web en este momento. Intenta de nuevo.' : 'El asistente no está disponible. Puedes consultar las ofertas internas.'
          try { message = (await invokeError.context.json()).error || message } catch { /* Error de conexión o función todavía no desplegada. */ }
          warnings.value = [message]
        } else {
          offers.value = data.offers || local
          web.value = data.web || []
          summary.value = data.summary || ''
          warnings.value = data.warnings || []
        }
      }
    } catch (error_) { if (current === version) error.value = error_.message }
    finally { if (current === version) { loading.value = false; searched.value = !error.value } }
  }
</script>
<style scoped>
  .summary { white-space: pre-wrap; }
</style>
