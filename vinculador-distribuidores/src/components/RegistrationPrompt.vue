<template>
  <v-dialog v-model="registrationPromptOpen" aria-describedby="registration-description" aria-labelledby="registration-title" max-width="480">
    <v-card class="registration-card pa-6 pa-sm-8" rounded="xl">
      <v-btn
        aria-label="Cerrar invitación"
        class="registration-close"
        icon="mdi-close"
        size="small"
        variant="text"
        @click="registrationPromptOpen = false"
      />

      <v-avatar class="mb-5" color="secondary" size="56" variant="tonal"><v-icon icon="mdi-account-plus-outline" size="28" /></v-avatar>
      <p class="eyebrow">MÁS CONEXIONES, MÁS OPORTUNIDADES</p>
      <h2 id="registration-title" class="text-h5 mb-3">{{ registrationMessage.title }}</h2>
      <p id="registration-description" class="text-muted mb-5">{{ registrationMessage.description }}</p>

      <ul class="registration-benefits mb-6">
        <li><v-icon icon="mdi-check-circle-outline" size="18" /> Perfiles de empresas y oportunidades</li>
        <li><v-icon icon="mdi-check-circle-outline" size="18" /> Asistente con IA para comparar opciones</li>
      </ul>

      <v-btn
        block
        color="primary"
        size="large"
        to="/register"
        @click="registrationPromptOpen = false"
      >Crear mi cuenta</v-btn>

      <v-btn
        block
        class="mt-2"
        to="/login"
        variant="outlined"
        @click="registrationPromptOpen = false"
      >Ya tengo cuenta</v-btn>

      <v-btn block class="mt-2" variant="text" @click="registrationPromptOpen = false">Seguir buscando</v-btn>
      <p class="text-caption text-muted text-center mt-3">Puedes seguir consultando resultados web sin registrarte.</p>
    </v-card>
  </v-dialog>
</template>
<script setup>
  import { registrationMessage, registrationPromptOpen } from '@/lib/registrationPrompt'
</script>
<style scoped>
.registration-card{position:relative}.registration-close{position:absolute;top:12px;right:12px}.registration-benefits{list-style:none;padding:0;display:grid;gap:10px;font-size:.9rem}.registration-benefits li{display:flex;align-items:center;gap:10px}.registration-benefits .v-icon{color:rgb(var(--v-theme-secondary));flex-shrink:0}
</style>
