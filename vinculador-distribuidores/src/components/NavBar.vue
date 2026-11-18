<template>
  <v-app-bar>
    <RouterLink aria-label="SunFinder, ir al inicio" class="brand" to="/">
      <v-avatar color="primary" rounded="lg" size="36" variant="tonal">
        <v-img alt="Icono" :src="logo" />
      </v-avatar>

      <span>SunFinder</span>
    </RouterLink>

    <!-- Escritorio: opciones con texto -->
    <nav v-if="mdAndUp" aria-label="Navegación principal" class="main-nav">
      <v-btn
        v-for="item in visibleItems"
        :key="item.to"
        :aria-current="item === activeItem ? 'page' : undefined"
        :color="item === activeItem ? 'primary' : 'on-surface'"
        :to="item.to"
        :variant="item === activeItem ? 'tonal' : 'text'"
      >
        {{ item.label }}
      </v-btn>
    </nav>

    <v-spacer />
    <v-btn v-if="authStore.user && !authStore.isGuest && mdAndUp" class="mr-2" prepend-icon="mdi-plus" to="/publicar">Publicar oferta</v-btn>

    <v-btn v-if="!authStore.user || authStore.isGuest" class="mr-2" to="/register">Crear cuenta</v-btn>

    <!-- Menú de cuenta: aquí vive "Cerrar sesión" -->
    <v-btn v-if="!authStore.user || authStore.isGuest" to="/login" variant="tonal">Iniciar sesión</v-btn>

    <v-menu v-else>
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          aria-label="Menú de cuenta"
          class="account"
          icon
          variant="text"
        >
          <v-avatar color="primary" size="36" variant="tonal">
            <v-img
              v-if="authStore.profile?.avatar_url"
              alt=""
              cover
              :src="authStore.profile.avatar_url"
            />

            <span v-else class="text-body-2 font-weight-bold">{{ userInitials }}</span>
          </v-avatar>
        </v-btn>
      </template>

      <v-list min-width="220">
        <v-list-item :subtitle="roleLabel" :title="authStore.profile?.full_name || 'Mi cuenta'" />
        <v-divider />
        <v-list-item prepend-icon="mdi-compass-outline" title="Para tu empresa" to="/feed" />
        <v-list-item prepend-icon="mdi-plus-circle-outline" title="Publicar oferta" to="/publicar" />
        <v-list-item prepend-icon="mdi-office-building-outline" title="Mi empresa" to="/perfil" />
        <v-list-item prepend-icon="mdi-logout" title="Cerrar sesión" @click="logout" />
      </v-list>
    </v-menu>
  </v-app-bar>

  <!-- Celular: navegación inferior. Vuetify reserva el espacio en v-main automáticamente. -->
  <v-bottom-navigation
    v-if="!mdAndUp"
    v-model="bottomValue"
    aria-label="Navegación principal"
    class="bottom-nav"
    color="primary"
    grow
    :mandatory="false"
    tag="nav"
  >
    <v-btn
      v-for="item in mobileItems"
      :key="item.to"
      :aria-label="item.label"
      :to="item.to"
      :value="item.to"
    >
      <v-icon :icon="item.icon" />
      <span>{{ item.to === '/' ? 'Inicio' : item.to === '/perfiles' ? 'Empresas' : item.label }}</span>
    </v-btn>
  </v-bottom-navigation>

  <v-snackbar v-model="logoutError" color="error">No se pudo cerrar sesión. Intenta de nuevo.</v-snackbar>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { initials } from '@/lib/initials'
  import { ROLE_LABELS } from '@/lib/roles'
  import { useAuthStore } from '@/stores/auth'
  import logo from '../assets/logo.png'

  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const { mdAndUp } = useDisplay()

  const items = [
    { label: 'Explorar', icon: 'mdi-magnify', to: '/', match: p => p === '/', guest: true },
    { label: 'Para tu empresa', icon: 'mdi-compass-outline', to: '/feed', match: p => p === '/feed' },
    { label: 'Empresas', icon: 'mdi-domain', to: '/perfiles', match: p => p === '/perfiles' || p.startsWith('/usuario/') },
    { label: 'Necesidades', icon: 'mdi-clipboard-text-outline', to: '/necesidades', match: p => p.startsWith('/necesidades') },
    { label: 'Asistente', icon: 'mdi-creation', to: '/asistente', match: p => p === '/asistente' },
    { label: 'Publicar oferta', icon: 'mdi-plus-circle-outline', to: '/publicar', match: p => p === '/publicar' },
    { label: 'Mi empresa', icon: 'mdi-office-building-outline', to: '/perfil', match: p => p === '/perfil' },
  ]

  const activeItem = computed(() => items.find(item => item.match(route.path)))
  const visibleItems = computed(() => items.filter(item => item.to !== '/perfil' && item.to !== '/publicar' && item.to !== '/feed' && (authStore.user && !authStore.isGuest || item.guest)))
  const mobileItems = computed(() => visibleItems.value.filter(item => !['/publicar', '/perfil', '/feed'].includes(item.to)))
  const bottomValue = computed({
    get: () => activeItem.value?.to ?? null,
    set: () => {},   // la ruta manda; el router cambia la sección
  })

  const userInitials = computed(() => initials(authStore.profile?.full_name))
  const roleLabel = computed(() => ROLE_LABELS[authStore.profile?.role] ?? '')

  const logoutError = ref(false)
  async function logout() {
    try { await authStore.signOut(); await router.push('/login') }
    catch { logoutError.value = true }
  }
</script>

<style scoped>
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-inline: 16px 24px;
    color: rgb(var(--v-theme-primary));
    font-size: 1.25rem;
    font-weight: 700;
    text-decoration: none;
  }

  .main-nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .account {
    margin-inline-end: 8px;
  }

  .bottom-nav :deep(.v-btn) {
    min-width: 0;
    padding-inline: 4px;
    border-radius: 0;   /* anula el radio de 10px de los botones normales */
  }
</style>
