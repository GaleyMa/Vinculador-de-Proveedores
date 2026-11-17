import { ref } from 'vue'

export const registrationPromptOpen = ref(false)
export function requestRegistration() { registrationPromptOpen.value = true }
