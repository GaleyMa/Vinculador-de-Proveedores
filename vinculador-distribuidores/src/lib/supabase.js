import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

let client = null
try {
  if (supabaseUrl && supabaseKey) {client = createClient(supabaseUrl, supabaseKey)}
} catch {
  // A misconfigured preview must still be able to render the public homepage.
}
export const supabaseConfigured = Boolean(client)

// Fail explicitly when a data action is requested; never use fake credentials.
export const supabase = client ?? new Proxy({}, {
  get() {
    throw new Error('La conexión con SunFinder no está disponible. Intenta más tarde o contacta al equipo.')
  },
})
