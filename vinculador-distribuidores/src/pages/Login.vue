<template>
  <v-container class="fill-height" max-width="480">
    <v-card class="pa-6" width="100%">
      <div class="text-center mb-5"><img alt="" :src="logo" width="64"><h1 class="page-title mt-2 mb-2">Bienvenido a SunFinder</h1><p class="text-muted">Entra para guardar tus intereses y publicar.</p></div>

      <v-form @submit.prevent="handleRegister">
        <v-text-field v-model="email" label="Correo" required type="email" />
        <v-text-field v-model="password" label="Contraseña" required type="password" />
        <v-alert v-if="error" class="mb-4" density="compact" type="error">{{ error }}</v-alert>
        <v-btn block color="primary" :loading="loading" type="submit">Iniciar sesión</v-btn>
      </v-form>

      <v-divider class="my-4" />

      <v-btn
        block
        :loading="googleLoading"
        prepend-icon="mdi-google"
        variant="outlined"
        @click="google"
      >
        Continuar con Google
      </v-btn>

      <v-card-actions class="flex-column ga-2">
        <RouterLink to="/register">¿No tienes cuenta? Regístrate</RouterLink>
        <v-btn :disabled="loading || googleLoading" :loading="guestLoading" variant="text" @click="enterAsGuest">Explorar sin cuenta</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import logo from '@/assets/logo.png'
  import { guestBrowseTarget } from '@/lib/routeAccess'
  import { useAuthStore } from '@/stores/auth'

  const email = ref('')
  const password = ref('')
  const route = useRoute()
  const error = ref(route.query.guest === 'unavailable' ? 'No pudimos abrir la exploración sin cuenta. Puedes reintentar o iniciar sesión.' : '')
  const loading = ref(false)
  const router = useRouter()
  const authStore = useAuthStore()
  const googleLoading = ref(false)
  const guestLoading = ref(false)

  async function handleRegister() {
    loading.value = true
    error.value = ''

    try {
      await authStore.signIn(email.value, password.value)
      router.push('/')
    } catch (error_) {
      error.value = error_.message
    } finally {
      loading.value = false
    }
  }

  async function enterAsGuest() {
    if (guestLoading.value) return
    error.value = ''
    guestLoading.value = true
    try {
      if (!authStore.isGuest) await authStore.enterAsGuest()
      await router.push(guestBrowseTarget(router.resolve, route.query.next))
    } catch (error_) {
      error.value = error_.message || 'No pudimos abrir la exploración sin cuenta. Intenta de nuevo.'
    } finally {
      guestLoading.value = false
    }
  }    

  async function google() {
    error.value = ''
    googleLoading.value = true
    try {
      await authStore.signInWithGoogle()   // redirige a Google; la página se recarga al volver
    } catch (error_) {
      error.value = error_.message
      googleLoading.value = false
    }
  }



</script>