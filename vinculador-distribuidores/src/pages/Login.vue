<template>
  <v-container class="fill-height" max-width="480">
    <v-card class="pa-6" width="100%">
      <div class="text-center mb-5"><img :src="logo" alt="" width="64"><h1 class="page-title mt-2 mb-2">Bienvenido a SunFinder</h1><p class="text-muted">Entra para guardar tus intereses y publicar.</p></div>
      <v-form @submit.prevent="handleRegister">
        <v-text-field v-model="email" label="Correo" type="email" required />
        <v-text-field v-model="password" label="Contraseña" type="password" required />
        <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>
        <v-btn type="submit" color="primary" block :loading="loading">Iniciar sesión</v-btn>
      </v-form>
      <v-divider class="my-4" />
      <v-btn block :loading="googleLoading" prepend-icon="mdi-google" variant="outlined" @click="google">
        Continuar con Google
      </v-btn>
      <v-card-actions class="flex-column ga-2">
        <RouterLink to="/register">¿No tienes cuenta? Regístrate</RouterLink>
        <v-btn variant="text" @click="enterAsGuest">Explorar sin cuenta</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
    import { ref } from 'vue'
    import logo from '@/assets/logo.png'
    import { useRouter } from 'vue-router'
    import { useAuthStore } from '@/stores/auth'

    const email = ref('')
    const password = ref('')
    const error = ref('')
    const loading = ref(false)
    const router = useRouter()
    const authStore = useAuthStore()
    const googleLoading = ref(false)

    async function handleRegister() {
    loading.value = true
    error.value = ''

    try {
        await authStore.signIn(email.value, password.value)
        router.push('/')
    } catch (e) {
        error.value = e.message
    } finally {
        loading.value = false
    }
    }

    async function enterAsGuest() {
      error.value = ''
      try {
        await authStore.enterAsGuest()
        router.push('/')
      } catch (e) {
        error.value = e.message
      }
    }    

    async function google() {
      error.value = ''
      googleLoading.value = true
      try {
        await authStore.signInWithGoogle()   // redirige a Google; la página se recarga al volver
      } catch (e) {
        error.value = e.message
        googleLoading.value = false
      }
    }



</script>