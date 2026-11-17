<template>
  <v-container class="assistant-page" max-width="1040">
    <p class="eyebrow">BÚSQUEDA CON AYUDA</p><h1 class="page-title mb-2">Asistente de proveedores</h1>
    <p class="mb-4">Busca con IA sin usar preferencias ni historial del perfil. Si lo eliges, también consultaremos opciones de la web.</p>

    <v-form class="assistant-form" :disabled="loading" @submit.prevent="search">
      <v-text-field
        v-model="query"
        counter="300"
        label="¿Qué necesitas encontrar?"
        maxlength="300"
        placeholder="Ej. cajas de cartón para mi empresa"
      />

      <OfferFilters v-model:nature="nature" v-model:sector-id="sectorId" />
      <v-checkbox v-model="useAI" hide-details label="Ayudarme a comparar los resultados" />
      <v-checkbox v-model="useWeb" hide-details label="Incluir opciones de la web" />
      <p v-if="useAI || useWeb" class="text-caption mb-3">Al activar la ayuda se enviará tu consulta a Gemini; al incluir la web, también a Tavily. El resumen usa descripciones de resultados. Evita compartir datos confidenciales.</p>
      <v-btn class="my-3" color="primary" :loading="loading" type="submit">Buscar proveedores</v-btn>
    </v-form>

    <v-alert v-if="error" class="mb-4" role="alert" type="error">{{ error }}</v-alert>
    <v-alert v-for="warning in warnings" :key="warning" class="mb-3" type="warning">{{ warning }}</v-alert>

    <section v-if="summary" aria-label="Resumen del asistente" class="assistant-summary mb-5">
      <h2 class="text-h6">Resumen del asistente</h2>
      <p class="summary">{{ summary }}</p>
      <p class="text-caption mt-2">Resumen generado por IA. Confirma los detalles en las fuentes.</p>
    </section>

    <div v-if="loading" class="assistant-loading" role="status"><v-progress-circular indeterminate size="22" /><span>Estamos buscando opciones para tu empresa…</span></div>

    <template v-if="searched">
      <h2 class="text-h6 mb-3">Ofertas en SunFinder</h2>
      <v-alert v-if="offers.length === 0" class="mb-4" type="info">No encontramos ofertas clasificadas con esas palabras y filtros. Prueba menos palabras o un rubro diferente.</v-alert>

      <div v-for="(offer, index) in offers" :key="offer.id">
        <p class="text-caption">Opción {{ index + 1 }} · En SunFinder</p>
        <PostCard :post="offer" @deleted="offers = offers.filter(item => item.id !== $event)" />
      </div>

      <template v-if="webRequested">
        <h2 class="text-h6 my-3">Resultados de la web</h2>
        <p class="text-caption mb-3">Fuentes externas; no son perfiles registrados ni proveedores verificados por SunFinder.</p>
        <v-alert v-if="web.length === 0" class="mb-3" type="info">No hay resultados web disponibles para esta consulta.</v-alert>
        <WebResultCard v-for="result in web" :key="result.url" :result="result" />
      </template>
    </template>
  </v-container>
</template>
<script setup>
  import { onBeforeUnmount, onMounted, ref } from 'vue'
  import OfferFilters from '@/components/OfferFilters.vue'
  import PostCard from '@/components/PostCard.vue'
  import WebResultCard from '@/components/WebResultCard.vue'
  import { candidateOffers } from '@/lib/offers'
  import { supabase } from '@/lib/supabase'
  const props = defineProps({ initialQuery: { type: String, default: '' }, autoSearch: Boolean })
  const query = ref(props.initialQuery), nature = ref(null), sectorId = ref(null)
  const useAI = ref(true), useWeb = ref(false), loading = ref(false), searched = ref(false), webRequested = ref(false)
  const offers = ref([]), web = ref([]), warnings = ref([]), summary = ref(''), error = ref('')
  let version = 0
  onBeforeUnmount(() => { version++ })
  onMounted(() => { if (props.autoSearch && query.value.trim().length >= 3) search() })
  async function search() {
    if (loading.value) return
    error.value = ''
    if (query.value.trim().length < 3) { error.value = 'Escribe al menos 3 caracteres.'; return }
    const current = ++version
    const input = { query: query.value.trim(), nature: nature.value || null, sectorId: sectorId.value || null, ai: useAI.value, web: useWeb.value }
    loading.value = true
    searched.value = false
    offers.value = []; web.value = []; summary.value = ''; warnings.value = []
    webRequested.value = input.web
    try {
      const local = await candidateOffers(supabase, input)
      if (current !== version) return
      offers.value = local
      searched.value = true
      if (input.ai || input.web) {
        const { data, error: invokeError } = await supabase.functions.invoke('supplier-assistant', { body: input })
        if (current !== version) return
        if (invokeError) {
          let message = 'El asistente externo no está disponible. Las ofertas internas siguen disponibles.'
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
    finally { if (current === version) loading.value = false }
  }
</script>
<style scoped>
  .summary { white-space: pre-wrap; }
</style>
