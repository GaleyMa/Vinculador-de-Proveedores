import assert from 'node:assert/strict'
import test from 'node:test'
import { createHandler } from '../supabase/functions/supplier-assistant/handler.js'

const offers = [{ id:'offer', title:'Cajas', description:'Cartón corrugado' }]
function fixture(fetchImpl) {
  const secrets = { SUPABASE_URL:'https://example.test', SUPABASE_ANON_KEY:'public', GEMINI_API_KEY:'private-test-key', GEMINI_MODEL:'gemini-4-hydrogen' }
  const handler = createHandler({
    env:name=>secrets[name],
    createClient:()=>({
      auth:{getUser:async()=>({data:{user:{id:'member'}}})},
      rpc:async name=>({data:name==='candidate_offers'?offers:true}),
    }),
    fetchImpl,
  })
  return ()=>handler(new Request('https://example.test', {
    method:'POST', headers:{authorization:'Bearer session'},
    body:JSON.stringify({query:'cajas de carton',ai:true}),
  }))
}

test('Gemini conserva el presupuesto y tiempo de espera que generaron el resumen', async () => {
  const timeout = AbortSignal.timeout
  const deadlines = []
  AbortSignal.timeout = ms=>{deadlines.push(ms);return timeout(ms)}
  try {
    const request = fixture(async (_url,options)=>{
      const body=JSON.parse(options.body)
      assert.equal(body.generationConfig.maxOutputTokens,4096)
      assert.equal(body.generationConfig.thinkingConfig.thinkingLevel,'low')
      assert.equal(body.generationConfig.temperature,0.2)
      return Response.json({candidates:[{content:{parts:[
        {thought:true,text:'No mostrar razonamiento'},
        {text:'O1 ofrece cajas de cartón.'},
      ]}}]})
    })
    const response=await request()
    const body=await response.json()
    assert.equal(response.status,200)
    assert.equal(body.summary,'O1 ofrece cajas de cartón.')
    assert.deepEqual(body.warnings,[])
    assert.deepEqual(deadlines,[60000])
  } finally { AbortSignal.timeout=timeout }
})

test('MAX_TOKENS se diagnostica sin registrar consulta, publicaciones ni clave', async () => {
  const logs=[]
  const log=console.error
  console.error=(...args)=>logs.push(args)
  try {
    const request=fixture(async()=>Response.json({
      candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{thought:true,text:'No registrar este razonamiento'}]}}],
      usageMetadata:{thoughtsTokenCount:4096},
    }))
    const data=await (await request()).json()
    assert.equal(data.summary,'')
    assert.equal(data.offers.length,1)
    assert.equal(data.warnings.length,1)
    assert.equal(logs[0][0],'Gemini sin texto:')
    const diagnostic=JSON.parse(logs[0][1])
    assert.equal(diagnostic.finishReason,'MAX_TOKENS')
    assert.equal(diagnostic.usage.thoughtsTokenCount,4096)
    assert.deepEqual(diagnostic.parts,[{thought:true,hasText:true}])
    assert.doesNotMatch(JSON.stringify(logs),/private-test-key|cajas de carton|No registrar este razonamiento|Cartón corrugado/)
  } finally { console.error=log }
})

test('HTTP 503 conserva coincidencias y registra el estado sin volcar la respuesta', async () => {
  const logs=[]
  const log=console.error
  console.error=(...args)=>logs.push(args)
  try {
    const request=fixture(async()=>new Response('No registrar cuerpo externo',{status:503}))
    const response=await request()
    const data=await response.json()
    assert.equal(response.status,200)
    assert.equal(data.offers.length,1)
    assert.equal(data.warnings.length,1)
    assert.deepEqual(logs[0],['Gemini HTTP:',503])
    assert.doesNotMatch(JSON.stringify(logs),/No registrar cuerpo externo|private-test-key/)
  } finally { console.error=log }
})
