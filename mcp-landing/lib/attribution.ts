// Client-only: captura y clasifica el origen del visitante (first-touch) para
// atribuir cada lead a su canal (orgánico, Google Ads, Meta, directo, referido).

export interface Attribution {
  source: string
  medium: string
  campaign?: string
  term?: string
  content?: string
  gclid?: string
  landing: string
  referrer: string
  ts: string
}

const COOKIE_NAME = 'mcp_attr'
const COOKIE_DAYS = 90

const SEARCH_ENGINES = ['google', 'bing', 'yahoo', 'duckduckgo', 'ecosia', 'yandex']
const SOCIAL_HOSTS = ['instagram', 'facebook', 'fb.com', 'l.facebook', 'lm.facebook', 't.co', 'twitter', 'tiktok']

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86_400_000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function classifyCurrentVisit(): Attribution {
  const params = new URLSearchParams(window.location.search)
  const gclid = params.get('gclid') || undefined
  const utmSource = params.get('utm_source')

  let source = '(direct)'
  let medium = '(none)'

  if (utmSource) {
    source = utmSource
    medium = params.get('utm_medium') || '(none)'
  } else if (gclid) {
    source = 'google'
    medium = 'cpc'
  } else if (document.referrer) {
    try {
      const refHost = new URL(document.referrer).hostname.replace(/^www\./, '')
      const currentHost = window.location.hostname.replace(/^www\./, '')

      if (refHost !== currentHost) {
        if (SEARCH_ENGINES.some((engine) => refHost.includes(engine))) {
          source = refHost
          medium = 'organic'
        } else if (SOCIAL_HOSTS.some((host) => refHost.includes(host))) {
          source = refHost
          medium = 'social'
        } else {
          source = refHost
          medium = 'referral'
        }
      }
    } catch {
      // referrer no parseable: se queda como directo
    }
  }

  return {
    source,
    medium,
    campaign: params.get('utm_campaign') || undefined,
    term: params.get('utm_term') || undefined,
    content: params.get('utm_content') || undefined,
    gclid,
    landing: window.location.pathname + window.location.search,
    referrer: document.referrer || '(direct)',
    ts: new Date().toISOString(),
  }
}

// Guarda el first-touch la primera vez y lo devuelve. En visitas siguientes,
// devuelve el first-touch persistido (no se sobrescribe).
export function captureAttribution(): Attribution | null {
  if (typeof window === 'undefined') {
    return null
  }

  const existing = getAttribution()
  if (existing) {
    return existing
  }

  const attribution = classifyCurrentVisit()
  setCookie(COOKIE_NAME, JSON.stringify(attribution), COOKIE_DAYS)
  return attribution
}

export function getAttribution(): Attribution | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = getCookie(COOKIE_NAME)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as Attribution
  } catch {
    return null
  }
}

// Etiqueta legible en castellano para el mensaje de WhatsApp que ve Marcelo.
export function getOriginLabel(attribution: Attribution | null): string {
  if (!attribution) {
    return 'Directo'
  }

  const { source, medium, campaign, gclid } = attribution

  if (gclid || medium === 'cpc' || medium === 'ppc') {
    return campaign ? `Google Ads (${campaign})` : 'Google Ads'
  }
  if (medium === 'organic') {
    return `Búsqueda orgánica (${source})`
  }
  if (medium === 'social') {
    const isMeta = source.includes('facebook') || source.includes('instagram') || source.includes('fb')
    return isMeta ? 'Meta (Instagram/Facebook)' : `Redes (${source})`
  }
  if (medium === 'referral') {
    return `Referido: ${source}`
  }
  if (source !== '(direct)') {
    return campaign ? `${source} (${campaign})` : source
  }
  return 'Directo'
}
