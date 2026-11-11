// Conecta el WhatsApp de MCP a Kapso. Se puede correr las veces que haga falta.
//
//   npm run whatsapp:setup -- link
//     Imprime el link para conectar el número en coexistencia (la app sigue
//     andando). Pide KAPSO_CUSTOMER_ID.
//
//   npm run whatsapp:setup -- <phone_number_id>
//     Crea o actualiza la función de modo, el workflow, el disparador y el
//     webhook, y guarda los ids en whatsapp_config. También sube el prompt.
//
// Lee .env.local: KAPSO_API_KEY, KAPSO_WEBHOOK_SECRET y DATABASE_URL.

import { neon } from '@neondatabase/serverless'
import { WHATSAPP_PROMPT_CON_HERRAMIENTAS } from '../lib/whatsapp/prompt.mjs'

const SITE_ID = 'mcp'
const APP_URL = (process.env.WHATSAPP_APP_URL ?? 'https://mcpmuebles.com').replace(/\/$/, '')
const API = (process.env.KAPSO_API_BASE_URL ?? '').trim() || 'https://api.kapso.ai'
const API_KEY = (process.env.KAPSO_API_KEY ?? '').trim()
const SECRET = (process.env.KAPSO_WEBHOOK_SECRET ?? '').trim()

const FUNCTION_SLUG = 'mcp-whatsapp-modo-v1'
const FUNCTION_SECRET_NAME = 'MCP_WORKFLOW_SECRET'
const WEBHOOK_EVENTS = [
  'whatsapp.message.received',
  'whatsapp.message.sent',
  'whatsapp.message.delivered',
  'whatsapp.message.read',
  'whatsapp.message.failed',
]

async function kapso(path, options = {}) {
  const response = await fetch(`${API}/platform/v1${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
  })
  if (!response.ok) {
    throw new Error(`Kapso ${response.status} en ${path}: ${await response.text()}`)
  }
  return response.json()
}

const post = (path, body) => kapso(path, { method: 'POST', body: JSON.stringify(body) })
const patch = (path, body) => kapso(path, { method: 'PATCH', body: JSON.stringify(body) })

// Ante cualquier duda, el bot no contesta: la ruta "suggest" termina en un humano.
function codigoDeLaFuncion() {
  const endpoint = JSON.stringify(`${APP_URL}/api/whatsapp/modo`)
  return `async function handler(request, env) {
  const body = await request.json().catch(() => ({}));
  const edges = Array.isArray(body?.available_edges) ? body.available_edges : [];
  const seguro = edges.includes("suggest") ? "suggest" : edges[0] || "suggest";
  const responder = (edge, mode) => new Response(
    JSON.stringify({ next_edge: edges.includes(edge) ? edge : seguro, vars: { effective_ai_mode: mode } }),
    { headers: { "Content-Type": "application/json" } }
  );
  const phone = body?.whatsapp_context?.conversation?.phone_number
    || body?.execution_context?.context?.phone_number;
  if (!phone) return responder(seguro, "SUGGEST");
  try {
    const response = await fetch(${endpoint}, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kapso-Workflow-Secret": env.${FUNCTION_SECRET_NAME} || "" },
      body: JSON.stringify({ phone })
    });
    if (!response.ok) throw new Error("status " + response.status);
    const { mode } = await response.json();
    return responder(mode === "AUTO" ? "auto" : mode === "OFF" ? "off" : "suggest", mode);
  } catch {
    return responder(seguro, "SUGGEST");
  }
}`
}

async function asegurarFuncion() {
  const code = codigoDeLaFuncion()
  const spec = {
    name: 'MCP - modo del bot',
    slug: FUNCTION_SLUG,
    description: 'Pregunta al CRM de MCP si el bot puede contestar a este contacto.',
    code,
    invoke_response_mode: 'passthrough',
    public_endpoint: false,
    runtime_config: {},
  }

  const { data: funciones } = await kapso('/functions')
  const existente = funciones.find((item) => item.slug === FUNCTION_SLUG)
  let id = existente?.id
  let desplegar = existente?.status !== 'deployed'

  if (!existente) {
    const { data } = await post('/functions', {
      function: { ...spec, function_type: 'cloudflare_worker' },
    })
    id = data.id
  } else if (existente.code !== code) {
    await patch(`/functions/${id}`, { function: spec })
    desplegar = true
  }

  if (desplegar) {
    await post(`/functions/${id}/deploy`)
    await esperarDespliegue(id)
  }

  // Kapso devuelve { data: { secrets: [...] } }.
  const { data } = await kapso(`/functions/${id}/secrets`)
  const secretos = Array.isArray(data) ? data : data?.secrets ?? []
  if (!secretos.some((item) => item.name === FUNCTION_SECRET_NAME)) {
    await post(`/functions/${id}/secrets`, { secret: { name: FUNCTION_SECRET_NAME, value: SECRET } })
  }
  return id
}

async function esperarDespliegue(id) {
  for (let intento = 0; intento < 30; intento++) {
    const { data } = await kapso(`/functions/${id}`)
    if (data.status === 'deployed') {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  throw new Error(`La función ${id} no terminó de desplegarse`)
}

function nodo(id, y, x, display_name, node_type, config) {
  return { id, type: 'flow-node', position: { x, y }, data: { node_type, config, display_name } }
}

function arista(id, source, target, label) {
  return { id, source, target, label, type: 'default' }
}

function definicion(functionId) {
  return {
    nodes: [
      nodo('start', 120, 120, 'Start', 'start', {}),
      nodo('route_ai_mode', 320, 120, 'Resolver modo', 'decide', {
        decision_type: 'function',
        function_id: functionId,
        conditions: [
          { label: 'auto', description: 'El agente contesta.' },
          { label: 'suggest', description: 'No contesta: queda para una persona.' },
          { label: 'off', description: 'No contesta: queda para una persona.' },
        ],
      }),
      nodo('agent_customer_service', 540, 120, 'Asistente IA', 'agent', {
        system_prompt: WHATSAPP_PROMPT_CON_HERRAMIENTAS,
        provider_model_id: 'ad6fec22-9be8-4378-ae1f-22f40ebf9fe5',
        provider_model_name: 'z-ai/glm-5.3',
        temperature: '0.4',
        max_iterations: 1,
        max_tokens: 1000,
        reasoning_effort: 'low',
        observer_prompt_mode: null,
        enabled_default_tools: ['complete_task', 'handoff_to_human', 'enter_waiting'],
        flow_agent_function_tools: [],
        flow_agent_app_integration_tools: [],
        flow_agent_webhooks: [],
        flow_agent_knowledge_bases: [],
        flow_agent_mcp_servers: [],
      }),
      nodo('handoff_human', 540, 420, 'Control humano', 'handoff', {}),
    ],
    edges: [
      arista('edge_start_to_router', 'start', 'route_ai_mode', 'next'),
      arista('edge_router_to_auto', 'route_ai_mode', 'agent_customer_service', 'auto'),
      arista('edge_router_to_suggest', 'route_ai_mode', 'handoff_human', 'suggest'),
      arista('edge_router_to_off', 'route_ai_mode', 'handoff_human', 'off'),
    ],
  }
}

async function asegurarWorkflow(workflowId, phoneNumberId, functionId, activo) {
  const workflow = {
    name: 'MCP - WhatsApp directo',
    status: activo ? 'active' : 'draft',
    definition: definicion(functionId),
  }

  let id = workflowId
  if (id) {
    await patch(`/workflows/${id}`, { workflow })
  } else {
    const { data } = await post('/workflows', { workflow })
    id = data.id
  }

  const { data: disparadores } = await kapso(`/workflows/${id}/triggers`)
  const propio = disparadores.find(
    (item) =>
      item.trigger_type === 'inbound_message' && item.triggerable?.phone_number_id === phoneNumberId
  )
  if (!propio) {
    await post(`/workflows/${id}/triggers`, {
      trigger: { trigger_type: 'inbound_message', phone_number_id: phoneNumberId, active: activo },
    })
  } else if (propio.active !== activo) {
    await patch(`/triggers/${propio.id}`, { trigger: { active: activo } })
  }
  return id
}

async function asegurarWebhook(phoneNumberId) {
  const url = `${APP_URL}/api/whatsapp/webhook`
  const deseado = { url, secret_key: SECRET, events: WEBHOOK_EVENTS, active: true }
  const ruta = `/whatsapp/phone_numbers/${phoneNumberId}/webhooks`
  const { data } = await kapso(ruta)
  const propio = data.find((item) => item.url === url)
  if (propio) {
    await patch(`${ruta}/${propio.id}`, { whatsapp_webhook: deseado })
  } else {
    await post(ruta, { whatsapp_webhook: { kind: 'kapso', ...deseado } })
  }
}

async function generarLink() {
  const customerId = (process.env.KAPSO_CUSTOMER_ID ?? '').trim()
  if (!customerId) {
    throw new Error('Falta KAPSO_CUSTOMER_ID')
  }
  const { data } = await post(`/customers/${customerId}/setup_links`, {
    setup_link: { allowed_connection_types: ['coexistence'], language: 'es' },
  })
  console.log(data.url)
}

async function conectar(phoneNumberId) {
  if (!SECRET || !process.env.DATABASE_URL) {
    throw new Error('Faltan KAPSO_WEBHOOK_SECRET o DATABASE_URL')
  }
  const sql = neon(process.env.DATABASE_URL)
  const [config] = await sql`select mode, workflow_id from whatsapp_config where site_id = ${SITE_ID}`
  if (!config) {
    throw new Error('No está whatsapp_config: correr primero npm run db:push')
  }

  const functionId = await asegurarFuncion()
  const workflowId = await asegurarWorkflow(
    config.workflow_id,
    phoneNumberId,
    functionId,
    config.mode !== 'OFF'
  )
  // Primero los ids: con el webhook prendido ya pueden entrar mensajes.
  await sql`
    update whatsapp_config
    set phone_number_id = ${phoneNumberId}, workflow_id = ${workflowId}, updated_at = now()
    where site_id = ${SITE_ID}
  `
  await asegurarWebhook(phoneNumberId)
  console.log(`Listo. Workflow ${workflowId}, modo ${config.mode}.`)
}

const argumento = process.argv[2]
if (!API_KEY || !argumento) {
  console.error('Uso: npm run whatsapp:setup -- link | <phone_number_id> (con KAPSO_API_KEY en .env.local)')
  process.exit(1)
}

try {
  await (argumento === 'link' ? generarLink() : conectar(argumento))
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
