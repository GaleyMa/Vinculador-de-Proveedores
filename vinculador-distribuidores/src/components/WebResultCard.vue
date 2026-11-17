<template>
  <v-card class="web-result pa-5" variant="outlined">
    <div class="result-source-row"><span class="source-badge"><v-icon icon="mdi-web" size="15" /> Encontrado en la web</span><span v-if="number" class="text-caption text-muted">{{ result.id || `W${number}` }}</span></div>
    <div class="web-business-heading"><v-avatar color="primary" rounded="lg" size="42" variant="tonal"><v-icon icon="mdi-domain" size="24" /></v-avatar><div><h3 class="web-result-title">{{ result.title }}</h3><p class="web-domain">{{ result.source }}</p></div></div>
    <p class="web-description">{{ result.content || 'Consulta la fuente para conocer más sobre este negocio.' }}</p>

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
  defineProps({result:{type:Object,required:true},number:Number})
</script>
<style scoped>
.web-result{display:flex;flex-direction:column;height:100%;background:rgb(var(--v-theme-surface));min-width:0}.result-source-row{display:flex;justify-content:space-between;gap:8px;margin-bottom:18px}.web-business-heading{display:flex;gap:12px;align-items:flex-start;margin-bottom:16px}.web-business-heading>div:last-child{min-width:0}.web-business-heading .v-avatar{flex-shrink:0}.web-result-title{font-size:1.05rem;line-height:1.45;overflow-wrap:anywhere}.web-domain{font-size:.8rem;color:rgb(var(--v-theme-muted));overflow-wrap:anywhere;margin-top:4px}.web-description{line-height:1.7;overflow-wrap:anywhere;white-space:pre-line;font-size:.95rem;flex:1;margin-bottom:20px}.web-result-footer{border-top:1px solid rgb(var(--v-border-color));padding-top:16px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}.web-result-footer .v-btn{flex-shrink:0}
</style>
