<template>
  <v-card class="web-result pa-5" variant="outlined">
    <div class="result-source-row"><span class="source-badge"><v-icon icon="mdi-web" size="15" /> Encontrado en la web</span><span v-if="number" class="text-caption text-muted">{{ result.id || `W${number}` }}</span></div>
    <div class="web-business-heading"><v-avatar color="primary" rounded="lg" size="42" variant="tonal"><v-icon icon="mdi-domain" size="24" /></v-avatar><div><h3 class="web-result-title" :title="result.title">{{ result.title }}</h3><p class="web-domain">{{ result.source }}</p></div></div>
    <p class="web-description">{{ preview || 'Consulta la fuente para conocer más sobre este negocio.' }}</p>

    <details v-if="hasMore" class="web-result-details">
      <summary>Ver más</summary>
      <div aria-label="Fragmento completo de la fuente" class="web-result-full" tabindex="0">
        <p class="font-weight-bold mb-2">{{ result.title }}</p>
        <p>{{ result.content }}</p>
      </div>
    </details>

    <div class="web-result-footer"><p class="text-caption text-muted">Fuente externa · Información por confirmar</p>

      <v-btn
        :append-icon="canOpen ? 'mdi-open-in-new' : 'mdi-arrow-right'"
        color="primary"
        :href="canOpen ? result.url : undefined"
        rel="noopener noreferrer"
        :target="canOpen ? '_blank' : undefined"
        variant="tonal"
        @click="gateSource"
      >Consultar fuente</v-btn></div>
  </v-card>
</template>
<script setup>
  import { computed } from 'vue'
  import { requestRegistration } from '@/lib/registrationPrompt'
  import { useAuthStore } from '@/stores/auth'
  const auth = useAuthStore()
  const canOpen = computed(() => auth.user && !auth.isGuest)
  function gateSource(event) {
    if (!canOpen.value) { event.preventDefault(); requestRegistration('source') }
  }
  const props = defineProps({result:{type:Object,required:true},number:Number})
  // Compactar el fragmento de la web sin inventar un resumen ni cambiar la fuente.
  const text = computed(() => String(props.result.content || '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/\s+/g, ' ').trim())
  const preview = computed(() => {
    if (text.value.length <= 220) return text.value
    const excerpt = text.value.slice(0, 220)
    const lastSpace = excerpt.lastIndexOf(' ')
    return excerpt.slice(0, lastSpace > 160 ? lastSpace : 220) + '…'
  })
  const hasMore = computed(() => text.value.length > 140 || String(props.result.title || '').length > 85)
</script>
<style scoped>
.web-result{display:flex;flex-direction:column;height:100%;align-self:start;background:rgb(var(--v-theme-surface));min-width:0}.result-source-row{display:flex;justify-content:space-between;gap:8px;margin-bottom:12px}.web-business-heading{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}.web-business-heading>div:last-child{min-width:0}.web-business-heading .v-avatar{flex-shrink:0}.web-result-title{font-size:1rem;line-height:1.45;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}.web-domain{font-size:.8rem;color:rgb(var(--v-theme-muted));overflow-wrap:anywhere;margin-top:4px}.web-description{line-height:1.6;overflow-wrap:anywhere;white-space:normal;font-size:.9rem;margin-bottom:12px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:5;overflow:hidden}.web-result-footer{border-top:1px solid rgb(var(--v-border-color));margin-top:auto;padding-top:12px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}.web-result-footer .v-btn{flex-shrink:0}
.web-result-details{margin-bottom:16px;font-size:.875rem}.web-result-details summary{cursor:pointer;color:rgb(var(--v-theme-primary));font-weight:600;padding-block:8px;min-height:36px}.web-result-details summary:focus-visible{outline:3px solid rgba(var(--v-theme-secondary),.5);outline-offset:2px}.web-result-full{max-height:240px;overflow-y:auto;overscroll-behavior:contain;white-space:pre-line;overflow-wrap:anywhere;line-height:1.6;padding:12px;background:rgba(var(--v-theme-primary),.035);border-radius:10px}
</style>

