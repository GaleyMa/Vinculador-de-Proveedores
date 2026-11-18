import { createHash } from 'node:crypto'
export const DEMO_MARKER = 'sunfinder-demo-v1'
export const DEMO_DOMAIN = 'sunfinder.example'
const catalog = [
 ['cajas','Cartón Horizonte','proveedor','bien','empaque','Tijuana',['cajas','cartón','embalaje'],'Cajas de cartón corrugado','Cajas reciclables de varias medidas. Pedidos desde 100 piezas, impresión de logotipo y entrega regional en 3 días hábiles. Precio de referencia: 18 MXN por pieza.'],
 ['bolsas','Empaques Brisa','proveedor','bien','empaque','Mexicali',['bolsas','empaques','reciclaje'],'Bolsas y envases para alimentos','Bolsas de papel y envases para panadería. Paquetes de 500 unidades desde 950 MXN, con opción de impresión y entrega en 5 días hábiles.'],
 ['etiquetas','Etiqueta Prisma','proveedor','bien','empaque','Ensenada',['etiquetas','adhesivos','impresión'],'Etiquetas adhesivas personalizadas','Etiquetas resistentes a humedad para botellas y cajas. Tirajes desde 1000 etiquetas por 1400 MXN. Diseño básico y entrega nacional en 7 días hábiles.'],
 ['mantenimiento','Taller Vector','proveedor','servicio','mantenimiento','Tijuana',['mantenimiento','maquinaria','preventivo'],'Mantenimiento preventivo de maquinaria','Inspección de maquinaria industrial, lubricación y diagnóstico eléctrico. Visita desde 1800 MXN, atención en Tijuana y reporte técnico en 48 horas.'],
 ['mecanizado','Precisión Cobalto','proveedor','servicio','industria','Mexicali',['maquinado','CNC','piezas'],'Fabricación de piezas por maquinado CNC','Fabricación bajo plano de piezas de aluminio y acero. Lotes desde 10 piezas; cotización en 2 días hábiles y entrega estimada de 10 días.'],
 ['transporte','Ruta Ámbar','proveedor','servicio','transporte','Tijuana',['transporte','logística','entregas'],'Transporte regional para empresas','Rutas entre Tijuana, Tecate y Mexicali. Unidades para cargas de hasta 3 toneladas; servicio desde 2500 MXN por viaje y comprobante de entrega.'],
 ['software','Código Litoral','proveedor','servicio','tecnologia','Ensenada',['software','inventarios','automatización'],'Desarrollo de software para inventarios','Aplicación web para inventario y ventas. Implementación desde 25000 MXN en 6 semanas, capacitación remota y soporte inicial de 30 días.'],
 ['contabilidad','Balance Nítido','proveedor','servicio','profesionales','Tijuana',['contabilidad','nómina','administración'],'Servicio contable para pequeñas empresas','Registro contable, conciliación y nómina de hasta 15 colaboradores. Plan desde 3500 MXN mensuales, con atención remota y reporte mensual.'],
 ['alimentos','Horno Aurora','proveedor','bien','alimentos','Mexicali',['panadería','alimentos','mayoreo'],'Panadería y repostería para cafeterías','Pan y galletas por mayoreo. Pedido mínimo de 100 unidades desde 12 MXN por pieza; reparto local tres veces por semana.'],
 ['higiene','Higiene Oliva','proveedor','bien','salud','Tijuana',['higiene','limpieza','insumos'],'Insumos de higiene para oficinas','Jabón, toallas de papel y soluciones de limpieza. Kits desde 1200 MXN, suministro mensual y entrega local en 2 días hábiles.'],
 ['construccion','Materiales Faro','proveedor','bien','construccion','Tecate',['construcción','cemento','materiales'],'Materiales de construcción por mayoreo','Cemento, mortero y adhesivos para obras pequeñas. Venta desde 20 sacos, precio según volumen y entrega en Tecate en 48 horas.'],
 ['electricidad','Energía Marea','proveedor','servicio','mantenimiento','Ensenada',['electricidad','tableros','mantenimiento'],'Revisión de instalaciones eléctricas','Diagnóstico de tableros y circuitos comerciales. Visita desde 2200 MXN, reporte de hallazgos y programación de servicio en 3 días hábiles.'],
 ['cafe','Café Nube','cliente',null,'empaque','Tijuana',['café','empaques','alimentos']],
 ['restaurante','Cocina Sendero','cliente',null,'alimentos','Mexicali',['restaurante','alimentos','higiene']],
 ['fabrica','Manufactura Alba','cliente',null,'mantenimiento','Tecate',['maquinaria','mantenimiento','industria']],
 ['tienda','Comercio Lucero','cliente',null,'tecnologia','Ensenada',['inventarios','software','comercio']],
 ['obra','Obra Duna','cliente',null,'construccion','Tijuana',['construcción','materiales','transporte']],
 ['circular','Circular Delta','socio','ambos','empaque','Tijuana',['cartón','empaques','reciclaje'],'Empaques de cartón reciclado','Cajas recicladas desde 150 piezas por 16 MXN cada una y asesoría para reducir material de embalaje. Entrega regional en 5 días hábiles.'],
 ['logistica','Nodo Pacífico','socio','ambos','transporte','Mexicali',['logística','transporte','almacenaje'],'Contenedores retornables para distribución','Contenedores plásticos retornables desde 20 piezas por 350 MXN cada uno, con servicio de planificación de rutas. Entrega en 7 días hábiles.'],
 ['automatizacion','Impulso Coral','socio','ambos','industria','Ensenada',['automatización','sensores','maquinaria'],'Sensores para automatización industrial','Kits de sensores y cableado desde 4500 MXN, con opción de integración en maquinaria y capacitación. Entrega en 10 días hábiles.'],
]
const needs = {
 cafe:['Cajas de cartón para pedidos de cafetería','bien','empaque','Buscamos cajas de cartón reciclable para enviar pan y café. Requerimos impresión de logotipo y entrega en Tijuana.',3000,8000],
 restaurante:['Abastecimiento de panadería para restaurante','bien','alimentos','Buscamos pan fresco por mayoreo con reparto regular y cotización para 400 piezas semanales.',4000,9000],
 fabrica:['Mantenimiento de maquinaria de producción','servicio','mantenimiento','Necesitamos revisión preventiva de tres máquinas, diagnóstico eléctrico y reporte de recomendaciones.',5000,15_000],
 tienda:['Software para control de inventarios','servicio','tecnologia','Requerimos sistema web para inventario, ventas y reportes con capacitación al personal.',20_000,40_000],
 obra:['Cemento y materiales para remodelación','bien','construccion','Solicitamos cotización de cemento y materiales con entrega programada para una obra comercial.',10_000,30_000],
}
export function demoId(value) {
 const hex=createHash('sha256').update(`${DEMO_MARKER}:${value}`).digest('hex')
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`
}
export function demoImage(label, color = '#164e63') {
 const initials=label.split(' ').slice(0,2).map(word=>word[0]).join('').toUpperCase()
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" rx="24" fill="${color}"/><circle cx="320" cy="145" r="75" fill="#ffffff" opacity=".12"/><text x="320" y="169" text-anchor="middle" font-family="sans-serif" font-size="64" fill="#ffffff">${initials}</text><text x="320" y="280" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#ffffff">SUNFINDER · DEMO</text></svg>`
 return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
export function demoAccounts() {
 return catalog.map(([slug,name,role,nature,sector,city,tags,title,description],index)=>({
  slug, name:`[DEMO] ${name}`, role, nature, sector, city, tags,
  email:`demo-${slug}@${DEMO_DOMAIN}`,
  bio:`Empresa ficticia para demostración de SunFinder, ubicada en ${city}, Baja California, México. ${role==='cliente' ? 'Buscamos proveedores confiables para nuestras operaciones y compras recurrentes.' : description} Especialidades: ${tags.join(', ')}. No representa un negocio real; precios y condiciones son datos de prueba.`,
  avatar:demoImage(name,index%2 ? '#0f766e':'#164e63'),
  contacts:[
   {kind:'correo',label:'Contacto comercial (demo)',value:`contacto-${slug}@${DEMO_DOMAIN}`,is_public:true},
   {kind:'telefono',label:'Teléfono ficticio (demo)',value:`+1 202 555 01${String(index).padStart(2,'0')}`,is_public:true},
   {kind:'otro',label:'Responsable de demostración',value:`Equipo ${name} · Contacto de prueba`,is_public:false},
  ],
  links:[{label:'Sitio de demostración (ficticio)',url:`https://${slug}.${DEMO_DOMAIN}`}],
  posts:role==='cliente'?[]:[
   {title:`[DEMO] ${title}`,description:`${description} Información ficticia para demostración.`,nature:nature==='ambos'?'bien':nature,sector_id:sector},
   {title:`[DEMO] ${role==='socio'?'Asesoría e integración':(nature==='bien'?'Suministro recurrente':'Plan de atención')}: ${tags[0]}`,description:`${role==='socio'?'Servicio de asesoría e integración relacionado con '+tags.join(', ')+'.':description} ${role==='socio'?'Sesión inicial desde 1500 MXN y propuesta en 3 días hábiles.':'Plan mensual con cotización según volumen y seguimiento de pedidos.'} Información ficticia para demostración.`,nature:role==='socio'?'servicio':nature,sector_id:sector},
  ],
  need:needs[slug] ? {
   title:`[DEMO] ${needs[slug][0]}`,nature:needs[slug][1],sector_id:needs[slug][2],description:needs[slug][3]+' Solicitud ficticia para demostración.',
   country:'México',region:'Baja California',city,budget_min:needs[slug][4],budget_max:needs[slug][5],currency:'MXN',
   ...(needs[slug][1]==='bien'?{quantity:400,unit:'piezas'}:{service_mode:'hibrido',service_scope:needs[slug][3]}),
  }:null,
 }))
}
