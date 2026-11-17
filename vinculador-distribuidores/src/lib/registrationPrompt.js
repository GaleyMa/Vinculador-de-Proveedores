import { computed, ref } from 'vue'

export const registrationPromptOpen = ref(false)
export const registrationReason = ref('general')
const messages = {
  general: { title: 'Da el siguiente paso con tu empresa', description: 'Crea tu cuenta para conocer empresas, publicar y guardar tus intereses.' },
  company: { title: 'Conoce a esta empresa', description: 'Crea tu cuenta para consultar su perfil y los datos de contacto que haya compartido.' },
  source: { title: 'Consulta esta fuente', description: 'Crea tu cuenta para abrir la página original y revisar la información del negocio.' },
  interest: { title: 'Guarda lo que te interesa', description: 'Crea tu cuenta para marcar ofertas de interés y recibir recomendaciones para tu empresa.' },
  assistant: { title: 'Dale forma a tu idea con IA', description: 'Crea tu cuenta para comparar opciones con el asistente y orientar la respuesta con tu perfil, si lo eliges.' },
  needs: { title: 'Descubre lo que necesitan otras empresas', description: 'Crea tu cuenta para explorar necesidades y encontrar oportunidades de colaboración.' },
}
export const registrationMessage = computed(() => messages[registrationReason.value] || messages.general)
export function requestRegistration(reason = 'general') {
  registrationReason.value = typeof reason === 'string' && messages[reason] ? reason : 'general'
  registrationPromptOpen.value = true
}
export function registrationReasonForRoute(path) {
  if (path === '/asistente') {return 'assistant'}
  if (path === '/perfiles' || path.startsWith('/usuario/')) {return 'company'}
  if (path.startsWith('/necesidades')) {return 'needs'}
  return 'general'
}
