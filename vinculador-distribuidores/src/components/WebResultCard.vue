<template>
  <v-card class="web-result mb-4 pa-5" variant="outlined">
    <p class="text-caption text-muted mb-2"><v-icon icon="mdi-web" size="16" /> {{ result.source }} · Fuente externa</p>
    <h3 class="text-h6 text-break mb-2">{{ result.title }}</h3>
    <p class="web-description mb-3">{{ result.content }}</p>

    <v-btn
      append-icon="mdi-open-in-new"
      :href="canOpen ? result.url : undefined"
      @click="gateSource"
      rel="noopener noreferrer"
      target="_blank"
      variant="tonal"
    >Consultar fuente</v-btn>
  </v-card>
</template>
<script setup>
  import { computed } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { requestRegistration } from '@/lib/registrationPrompt'
  const auth = useAuthStore()
  const canOpen = computed(() => auth.user && !auth.isGuest)
  function gateSource(event) {
    if (!canOpen.value) { event.preventDefault(); requestRegistration() }
  }
  defineProps({result:{type:Object,required:true}})
</script>
<style scoped>
.web-description{line-height:1.65;overflow-wrap:anywhere}
</style>
