<template>
  <v-app>
    <NavBar v-if="!authStore.needsProfile" />

    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>

<!-- src/App.vue -->
<script setup>
  import { onMounted } from 'vue'
  import NavBar from '@/components/NavBar.vue'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  onMounted(() => authStore.init())
</script>
