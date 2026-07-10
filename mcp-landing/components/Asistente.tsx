'use client'

import { useEffect, useRef, useState } from 'react'
import { baseConocimiento } from '@/lib/asistente/knowledge-base'
import { buildWhatsAppUrl } from '@/lib/constants'
import { trackWhatsAppClick } from '@/lib/useWhatsAppCTA'

interface Mensaje {
  role: 'user' | 'assistant'
  content: string
}

const { saludoInicial, preguntasRapidas, contacto } = baseConocimiento

// Fallback sin IA: busca la pregunta rápida más parecida a lo que escribió el
// cliente. Así el asistente sigue siendo útil y SIEMPRE responde con datos
// reales aunque no haya API key configurada.
function respuestaGuiada(texto: string): string {
  const t = texto.toLowerCase()
  const palabras = t.split(/\s+/).filter((p) => p.length > 3)

  let mejor: { respuesta: string; puntos: number } | null = null
  for (const pregunta of preguntasRapidas) {
    const objetivo = (pregunta.etiqueta + ' ' + pregunta.respuesta).toLowerCase()
    const puntos = palabras.reduce(
      (acc, palabra) => acc + (objetivo.includes(palabra) ? 1 : 0),
      0
    )
    if (puntos > 0 && (!mejor || puntos > mejor.puntos)) {
      mejor = { respuesta: pregunta.respuesta, puntos }
    }
  }

  if (mejor) return mejor.respuesta
  return `No tengo ese dato exacto por acá, pero Marcelo te lo responde enseguida. ${contacto.invitacionWhatsApp}`
}

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function Asistente() {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { role: 'assistant', content: saludoInicial },
  ])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [sinIA, setSinIA] = useState(false)
  const finRef = useRef<HTMLDivElement | null>(null)

  const whatsappUrl = buildWhatsAppUrl({ baseMessage: contacto.mensajePorDefecto })

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, abierto])

  function handleWhatsAppClick() {
    trackWhatsAppClick({ ctaLabel: 'Asistente → WhatsApp', placement: 'asistente' })
  }

  // Respuesta instantánea de las preguntas frecuentes (siempre con datos reales).
  function preguntaRapida(pregunta: (typeof preguntasRapidas)[number]) {
    if (cargando) return
    setMensajes((prev) => [
      ...prev,
      { role: 'user', content: pregunta.etiqueta },
      { role: 'assistant', content: pregunta.respuesta },
    ])
  }

  async function enviar(texto: string) {
    const contenido = texto.trim()
    if (!contenido || cargando) return

    const nuevos: Mensaje[] = [...mensajes, { role: 'user', content: contenido }]
    setMensajes(nuevos)
    setInput('')

    // Si ya sabemos que no hay IA, respondemos en modo guiado sin llamar al servidor.
    if (sinIA) {
      setMensajes((prev) => [
        ...prev,
        { role: 'assistant', content: respuestaGuiada(contenido) },
      ])
      return
    }

    setCargando(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nuevos }),
      })

      // El asistente con IA no está configurado o falló: pasamos a modo guiado.
      if (!res.ok || !res.body) {
        setSinIA(true)
        setMensajes((prev) => [
          ...prev,
          { role: 'assistant', content: respuestaGuiada(contenido) },
        ])
        return
      }

      // Vamos mostrando la respuesta a medida que llega (streaming).
      setMensajes((prev) => [...prev, { role: 'assistant', content: '' }])
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acumulado = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acumulado += decoder.decode(value, { stream: true })
        setMensajes((prev) => {
          const copia = [...prev]
          copia[copia.length - 1] = { role: 'assistant', content: acumulado }
          return copia
        })
      }
      if (!acumulado.trim()) {
        setMensajes((prev) => {
          const copia = [...prev]
          copia[copia.length - 1] = {
            role: 'assistant',
            content: respuestaGuiada(contenido),
          }
          return copia
        })
      }
    } catch {
      setSinIA(true)
      setMensajes((prev) => [
        ...prev,
        { role: 'assistant', content: respuestaGuiada(contenido) },
      ])
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      {/* Botón flotante para abrir el chat */}
      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir asistente de MCP"
          className="fixed right-4 bottom-24 md:bottom-6 z-40 flex items-center gap-2 rounded-full bg-brand-dark text-white pl-4 pr-5 py-3 shadow-elevated border border-brand-gold/30 transition-transform duration-200 hover:scale-105"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold text-brand-dark">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-gold/40" />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span className="text-sm font-semibold">Consultanos</span>
        </button>
      )}

      {/* Panel del chat */}
      {abierto && (
        <div className="fixed inset-x-3 bottom-3 md:inset-x-auto md:right-6 md:bottom-6 z-50 flex flex-col w-auto md:w-[380px] max-h-[80vh] md:max-h-[600px] rounded-2xl bg-brand-cream shadow-elevated border border-brand-border overflow-hidden">
          {/* Encabezado */}
          <div className="flex items-center justify-between gap-3 bg-brand-dark px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold text-brand-dark font-serif text-lg">
                M
              </span>
              <div className="leading-tight">
                <p className="text-white text-sm font-semibold">Asistente MCP</p>
                <p className="text-brand-muted-dark text-xs">
                  Cocinas a medida · Santa Fe
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar asistente"
              className="text-brand-muted-dark hover:text-white transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-brand-dark text-white rounded-br-sm'
                      : 'bg-white text-brand-dark border border-brand-border rounded-bl-sm'
                  }`}
                >
                  {m.content || (
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted" />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Preguntas frecuentes (chips) */}
            <div className="flex flex-wrap gap-2 pt-1">
              {preguntasRapidas.map((p) => (
                <button
                  key={p.etiqueta}
                  type="button"
                  onClick={() => preguntaRapida(p)}
                  disabled={cargando}
                  className="rounded-full border border-brand-gold/40 bg-white px-3 py-1.5 text-xs font-medium text-brand-dark transition-colors hover:bg-brand-card disabled:opacity-50"
                >
                  {p.etiqueta}
                </button>
              ))}
            </div>
            <div ref={finRef} />
          </div>

          {/* CTA WhatsApp */}
          <a
            href={whatsappUrl}
            onClick={handleWhatsAppClick}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-4 mb-2 flex items-center justify-center gap-2 rounded-full bg-brand-green px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-green-hover"
          >
            <WhatsAppIcon size={18} />
            Seguir por WhatsApp
          </a>

          {/* Campo de texto */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              enviar(input)
            }}
            className="flex items-center gap-2 border-t border-brand-border bg-white px-3 py-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu consulta..."
              className="flex-1 rounded-full border border-brand-border bg-brand-cream px-4 py-2 text-sm text-brand-dark outline-none focus:border-brand-gold/60"
              aria-label="Escribí tu consulta"
            />
            <button
              type="submit"
              disabled={cargando || !input.trim()}
              aria-label="Enviar mensaje"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gold text-brand-dark transition-opacity disabled:opacity-40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
