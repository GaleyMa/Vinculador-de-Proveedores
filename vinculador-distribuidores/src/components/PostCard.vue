<template>
  <v-card v-if="!removed" class="opportunity-card mb-5">
    <div class="opportunity-company">
      <v-avatar color="primary" size="42" variant="tonal"><v-img v-if="post.profiles?.avatar_url" alt="" :src="post.profiles.avatar_url" /><span v-else>{{ companyInitials }}</span></v-avatar>
      <div class="company-copy"><RouterLink :to="`/usuario/${post.author_id}`">{{ post.profiles?.full_name || 'Empresa' }}</RouterLink><p>{{ roleLabel || 'Perfil empresarial' }}</p></div>
      <v-chip :color="offerNature || post.profiles?.role === 'proveedor' ? 'secondary' : 'primary'" size="small" variant="tonal">{{ offerNature || post.profiles?.role === 'proveedor' ? 'Ofrece' : 'Publicación' }}</v-chip>

      <v-btn
        v-if="isOwner"
        aria-label="Eliminar publicación"
        icon="mdi-delete-outline"
        :loading="deleting"
        size="small"
        variant="text"
        @click="deletePost"
      />
    </div>

    <div class="opportunity-body">
      <h2 class="opportunity-title">{{ post.title }}</h2>
      <p class="opportunity-description" :class="{'is-collapsed':!expanded}">{{ post.description }}</p>

      <v-btn
        v-if="(post.description || '').length > 180"
        :aria-expanded="expanded"
        class="expand-description"
        size="small"
        variant="text"
        @click="expanded = !expanded"
      >{{ expanded ? 'Ver menos' : 'Ver más' }}</v-btn>

      <v-img
        v-if="post.image_url"
        :alt="`Imagen de ${post.title}`"
        :aspect-ratio="16/9"
        class="opportunity-image"
        cover
        max-height="260"
        :src="post.image_url"
      />

      <div v-if="offerNature" aria-label="Clasificación de la oferta" class="d-flex flex-wrap ga-2 mt-4">
        <v-chip color="primary" size="small" :to="{path:'/',query:{nature:offerNature}}" variant="tonal">{{ natureLabel(offerNature) }}</v-chip>

        <v-chip
          v-if="offerSector"
          color="secondary"
          size="small"
          :to="{path:'/',query:{sector:offerSector}}"
          variant="tonal"
        >{{ offerSectorName || offerSector }}</v-chip>
      </div>

      <div v-if="visibleTags.length > 0" class="d-flex flex-wrap ga-2 mt-3">
        <v-chip
          v-for="t in (showAllTags ? visibleTags : visibleTags.slice(0,4))"
          :key="t.tags.id"
          size="small"
          :to="tagLink(t.tags.name)"
          variant="outlined"
        >{{ t.tags.name }}</v-chip>

        <v-btn v-if="visibleTags.length > 4" size="small" variant="text" @click="showAllTags = !showAllTags">{{ showAllTags ? 'Menos etiquetas' : '+' + (visibleTags.length-4) }}</v-btn>
      </div>

      <RecommendationExplanation :post="post" />
      <details v-if="affinity !== null" class="affinity-detail"><summary>Ver detalle de afinidad</summary><p>Puntaje de afinidad: {{ affinityLabel }} · No es un porcentaje.</p><p v-if="tagScores.length === 0">Esta oferta no tiene etiquetas.</p><p v-for="t in tagScores" :key="t.id">{{ t.name }}: {{ scoreLabel(t.score) }}</p></details>
    </div>

    <v-alert v-if="actionError" class="mx-4 mb-3" role="alert" type="error">{{ actionError }}</v-alert>

    <div class="opportunity-actions">
      <v-btn :to="`/usuario/${post.author_id}`" variant="outlined">Ver empresa</v-btn>

      <template v-if="!readonly && authStore.user && !authStore.isGuest">
        <v-btn
          :aria-pressed="myReaction === true"
          color="secondary"
          :disabled="reacting || deleting"
          :variant="myReaction === true ? 'flat' : 'tonal'"
          @click="react(true)"
        >Me interesa</v-btn>

        <v-btn :aria-pressed="myReaction === false" :disabled="reacting || deleting" variant="text" @click="react(false)">{{ myReaction === false ? 'Pasaste esta oferta' : 'Pasar' }}</v-btn>
      </template>
    </div>
  </v-card>
</template>
<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import RecommendationExplanation from '@/components/RecommendationExplanation.vue'
  import { natureLabel } from '@/lib/classification'
  import { removePost, saveReaction } from '@/lib/offers'
  import { searchParam } from '@/lib/postSearch'
  import { supabase } from '@/lib/supabase'
  import { useAuthStore } from '@/stores/auth'

  const props = defineProps({
    post: Object,
    readonly: { type: Boolean, default: false }, // oculta me interesa/no me interesa
  })
  const emit = defineEmits(['deleted'])
  const expanded = ref(false), showAllTags = ref(false)
  const companyInitials = computed(() => (props.post.profiles?.full_name || 'Empresa').split(/\s+/).slice(0,2).map(word => word[0]).join('').toUpperCase())

  // Desglose por etiqueta (viene de user_tag_scores en la misma consulta); sin fila = 0
  const tagScores = computed(() => visibleTags.value.map(t => ({
    id: t.tags.id,
    name: t.tags.name,
    score: t.tags.user_tag_scores?.[0]?.score ?? 0,
  })))
  

  const authStore = useAuthStore()
  const route = useRoute()
  const visibleTags = computed(() => (props.post.post_tags ?? []).filter(t => t.tags))
  const roleLabel = computed(() => {
    const role = props.post.profiles?.role
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : '' })
  const affinity = computed(() => {
    if (authStore.isGuest) return null
    const value = props.post.affinity
    return value == null ? null : Math.round(Number(value) * 10) / 10})
  const affinityLabel = computed(() => (affinity.value > 0 ? '+' : '') + affinity.value)
  const affinityColor = computed(() => (affinity.value > 0 ? 'success' : (affinity.value < 0 ? 'error' : 'muted')))

  function scoreClass(score) {
    if (score > 0) return 'text-success'
    if (score < 0) return 'text-error'
    return 'text-muted'
  }

  function scoreLabel(score) {
    return (score > 0 ? '+' : '') + score
  }
     
  function tagLink(tag) {
    const q = ['/', '/feed'].includes(route.path) ? searchParam(route.query.q) : ''
    return { path: '/', query: { ...(q ? { q } : {}), tag } }
  }
  const myReaction = ref(props.post.myReaction ?? null)
  const isOwner = computed(() => !authStore.isGuest && authStore.user?.id === props.post.author_id)
  const deleting = ref(false)

  const reacting = ref(false), actionError = ref(''), removed = ref(false)
  const offerNature = computed(() => props.post.nature ?? props.post.recommendation?.offer_nature)
  const offerSector = computed(() => props.post.sector_id ?? props.post.recommendation?.offer_sector_id)
  const offerSectorName = computed(() => props.post.sectors?.name ?? props.post.recommendation?.offer_sector_name)

  let reactionTouched = false
  onMounted(async () => {
    if (!authStore.user || authStore.isGuest || props.readonly) return
    const { data, error } = await supabase.from('reactions').select('interested').eq('post_id', props.post.id).eq('user_id', authStore.user.id).maybeSingle()
    if (!error && data && !reactionTouched) myReaction.value = data.interested
  })

  async function react(interested) {
    if (reacting.value || !authStore.user || authStore.isGuest) return
    reactionTouched = true
    reacting.value = true
    actionError.value = ''
    try { myReaction.value = await saveReaction(supabase, props.post.id, authStore.user.id, interested) }
    catch (error) { actionError.value = error.message }
    finally { reacting.value = false }
  }

  async function deletePost() {
    if (deleting.value || !isOwner.value || !confirm('¿Eliminar esta publicación?')) return
    deleting.value = true
    actionError.value = ''
    try {
      await removePost(supabase, props.post.id, authStore.user.id)
      removed.value = true
      emit('deleted', props.post.id)
    } catch (error) { actionError.value = error.message }
    finally { deleting.value = false }
  }
</script>


<style scoped>
.opportunity-company{display:flex;align-items:center;gap:12px;padding:20px 24px 0}.company-copy{min-width:0;flex:1}.company-copy a{font-weight:650;text-decoration:none;overflow-wrap:anywhere}.company-copy p{font-size:.85rem;color:rgb(var(--v-theme-muted));margin:0}.opportunity-body{padding:18px 24px}.opportunity-title{font-size:1.35rem;line-height:1.35;margin-bottom:10px;overflow-wrap:anywhere}.opportunity-description{white-space:pre-line;overflow-wrap:anywhere;line-height:1.6}.is-collapsed{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;overflow:hidden}.expand-description{margin-left:-10px}.opportunity-image{margin-top:16px;border-radius:12px;width:100%}.affinity-detail{font-size:.85rem;color:rgb(var(--v-theme-muted));margin-top:16px}.affinity-detail summary{cursor:pointer}.opportunity-actions{display:flex;flex-wrap:wrap;gap:8px;padding:0 24px 20px}@media(max-width:600px){.opportunity-company{padding:16px 16px 0}.opportunity-body{padding:16px}.opportunity-actions{padding:0 16px 16px}.opportunity-title{font-size:1.2rem}}
</style>
