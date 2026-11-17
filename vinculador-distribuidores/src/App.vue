<template>
  <v-app>
    <NavBar v-if="!authStore.needsProfile" />

    <v-main>
      <v-container v-if="!supabaseConfigured || connectionError" class="pb-0" max-width="1180">
        <v-alert type="warning" variant="tonal">
          Por ahora no podemos conectar con la plataforma. Puedes ver la portada e intentar más tarde.
          <v-btn v-if="supabaseConfigured" variant="text" @click="initialize">Reintentar</v-btn>
        </v-alert>
      </v-container>

      <RouterView />
    </v-main>
  </v-app>
</template>

<!-- src/App.vue -->
<script setup>
  import { onMounted, ref } from 'vue'
  import NavBar from '@/components/NavBar.vue'
  import { supabaseConfigured } from '@/lib/supabase'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const connectionError = ref(false)
  async function initialize() {
    connectionError.value = false
    try { await authStore.init() }
    catch { connectionError.value = true }
  }
  onMounted(initialize)
</script>
