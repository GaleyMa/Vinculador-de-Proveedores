import assert from 'node:assert/strict'
import test from 'node:test'
import { describeAssistantError, searchResultCaption } from '../src/lib/searchFeedback.js'

test('Solo una consulta completada sin fallos puede mostrar cero resultados', () => {
  const state = { searched: true, loading: false, count: 0 }
  assert.match(searchResultCaption(state), /^0 resultados/)
  assert.equal(searchResultCaption({ ...state, warnings: ['La web falló'] }), 'No se pudo completar la consulta')
  assert.doesNotMatch(searchResultCaption({ ...state, error: 'Falló la consulta' }), /0 resultados/)
  assert.equal(searchResultCaption({ ...state, loading: true }), '')
  assert.equal(searchResultCaption({ ...state, searched: false }), '')
})
test('Resultados parciales conservan el conteo conocido e indican consulta incompleta', () => {
  assert.equal(searchResultCaption({ searched: true, count: 2, warnings: ['Gemini no disponible'] }), '2 resultados disponibles · Consulta incompleta')
  assert.equal(searchResultCaption({ searched: true, count: 1 }), '1 resultado disponible en esta consulta')
})
test('Errores HTTP, respuesta de servidor y fallos de red ofrecen mensajes específicos', async () => {
  const error = (status, body = {}) => ({ context: Response.json(body, { status }) })
  assert.match(await describeAssistantError(error(401)), /sesión/)
  assert.match(await describeAssistantError(error(403, {error:'Origen no permitido.'})), /esta dirección/)
  assert.match(await describeAssistantError(error(404)), /todavía no está disponible/)
  assert.match(await describeAssistantError(error(429)), /10 minutos/)
  assert.equal(await describeAssistantError(error(503, {error:'No se pudo comprobar el límite de consultas.'})), 'No se pudo comprobar el límite de consultas.')
  assert.match(await describeAssistantError(new Error('Failed to fetch'), {publicSearch:true}), /conectar.*búsqueda web/)
  assert.match(await describeAssistantError(error(503)), /ofertas internas/)
})
