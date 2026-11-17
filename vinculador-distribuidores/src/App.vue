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
      <v-dialog v-model="registrationPromptOpen" max-width="460" aria-labelledby="registration-title">
        <v-card class="pa-6" rounded="xl">
          <v-icon color="primary" icon="mdi-account-plus-outline" size="36" class="mb-3" />
          <h2 id="registration-title" class="text-h5 mb-3">Regístrate para tener acceso a más funciones</h2>
          <p class="mb-5">Crea tu cuenta para ver perfiles de empresas, explorar necesidades, publicar y guardar tus intereses. También tendrás acceso al asistente con IA. Puedes seguir consultando resultados web sin registrarte.</p>
          <v-btn block color="primary" to="/register" @click="registrationPromptOpen = false">Crear cuenta</v-btn>
          <v-btn block class="mt-2" variant="outlined" to="/login" @click="registrationPromptOpen = false">Ya tengo cuenta</v-btn>
          <v-btn block class="mt-2" variant="text" @click="registrationPromptOpen = false">Seguir buscando</v-btn>
        </v-card>
      </v-dialog>
    </v-main>
  </v-app>
</template>

<!-- src/App.vue -->
<script setup>
  import { onMounted, ref } from 'vue'
  import { registrationPromptOpen } from '@/lib/registrationPrompt'
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
