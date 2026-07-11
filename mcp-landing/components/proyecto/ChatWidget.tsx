'use client'

import { useEffect, useRef, useState } from 'react'
import { useWhatsAppCTA } from '@/lib/useWhatsAppCTA'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const GREETING: Message = {
  role: 'assistant',
  content:
    '¡Hola! Soy el asistente de MCP Muebles. Te puedo dar una estimación orientativa del precio de tu cocina a medida. Contame, ¿qué estás buscando?',
}

const CONTEXTUAL_GREETINGS: Record<string, string> = {
  hero: '¡Hola! Soy el asistente de MCP Muebles. Contame qué cocina tenés en mente (medidas aproximadas, si es en L o recta) y te doy una estimación al instante.',
  precios:
    '¡Hola! Para darte un precio más exacto, pasame las medidas de tu cocina (aunque sean aproximadas) y qué línea te interesa: Económica, Estándar o Premium.',
  final:
    '¡Hola! Contame qué necesitás para tu cocina y te armo una estimación al instante. Después, si querés avanzar, seguís directo con Marcelo.',
}

const MAX_USER_MESSAGES = 20

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { href: whatsAppHref, handleClick: trackWhatsApp } = useWhatsAppCTA({
    baseMessage:
      'Hola Marcelo, estuve cotizando mi cocina con el asistente de la web y quiero avanzar.',
    ctaLabel: 'Seguir por WhatsApp',
    placement: 'proyecto_chatbot',
  })

  const userMessageCount = messages.filter((m) => m.role === 'user').length
  const limitReached = userMessageCount >= MAX_USER_MESSAGES

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading, isOpen])

  useEffect(() => {
    function handleOpenChat(event: Event) {
      const source = (event as CustomEvent<{ source?: string }>).detail?.source
      setIsOpen(true)
      // Solo cambia el saludo si la conversación todavía no arrancó
      const greeting = source ? CONTEXTUAL_GREETINGS[source] : undefined
      if (greeting) {
        setMessages((prev) =>
          prev.some((m) => m.role === 'user')
            ? prev
            : [{ role: 'assistant', content: greeting }]
        )
      }
    }

    window.addEventListener('mcp:open-chat', handleOpenChat)
    return () => window.removeEventListener('mcp:open-chat', handleOpenChat)
  }, [])

  async function sendMessage() {
    const text = input.trim()
    if (!text || isLoading || limitReached) {
      return
    }

    const nextMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)
    setHasError(false)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // El saludo inicial es fijo, no hace falta mandarlo
        body: JSON.stringify({ messages: nextMessages.slice(1) }),
      })

      const data = (await response.json().catch(() => ({}))) as { reply?: string }

      if (!response.ok || !data.reply) {
        setHasError(true)
        return
      }

      setMessages([...nextMessages, { role: 'assistant', content: data.reply }])
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat para cotizar tu cocina'}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-brand-dark text-brand-gold ring-2 ring-brand-gold/50 shadow-elevated flex items-center justify-center hover:scale-105 transition-transform"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10.5h8M8 14h5m-9.5 5.5V6.8c0-1 .8-1.8 1.8-1.8h13.4c1 0 1.8.8 1.8 1.8v9.4c0 1-.8 1.8-1.8 1.8H7l-3.5 3.5z"
            />
          </svg>
        )}
      </button>

      {/* Panel */}
      {isOpen ? (
        <div className="fixed z-50 inset-x-3 bottom-24 sm:inset-x-auto sm:right-5 sm:w-[380px] max-h-[70vh] sm:max-h-[560px] bg-white rounded-2xl border border-brand-border shadow-elevated flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-brand-dark text-white px-5 py-4 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">Asistente MCP Muebles</div>
              <div className="text-xs text-brand-muted-dark">
                Cotiz&aacute; tu cocina &middot; Respuesta al instante
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-brand-green" />
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[240px]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'ml-auto bg-brand-dark text-white rounded-br-sm'
                    : 'mr-auto bg-brand-card text-brand-dark rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            ))}

            {isLoading ? (
              <div className="mr-auto bg-brand-card rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand-muted animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-brand-muted animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-brand-muted animate-bounce [animation-delay:300ms]" />
              </div>
            ) : null}

            {hasError ? (
              <div className="mr-auto bg-red-50 border border-red-200 text-red-800 rounded-2xl px-4 py-2.5 text-sm leading-relaxed">
                No pude responder en este momento.{' '}
                <a
                  href={whatsAppHref}
                  onClick={trackWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline"
                >
                  Escribinos por WhatsApp
                </a>{' '}
                y te contestamos enseguida.
              </div>
            ) : null}

            {limitReached ? (
              <div className="mr-auto bg-brand-card rounded-2xl px-4 py-2.5 text-sm leading-relaxed">
                Para seguir avanzando, lo mejor es continuar directo con Marcelo por WhatsApp.
              </div>
            ) : null}
          </div>

          {/* Input */}
          <div className="border-t border-brand-border p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendMessage()
                  }
                }}
                placeholder={limitReached ? 'Seguí por WhatsApp' : 'Escribí tu consulta...'}
                disabled={isLoading || limitReached}
                maxLength={1000}
                className="flex-1 rounded-full border border-brand-border px-4 py-2.5 text-sm focus:outline-none focus:border-brand-gold disabled:bg-brand-card/50"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || limitReached || !input.trim()}
                aria-label="Enviar mensaje"
                className="w-10 h-10 rounded-full bg-brand-dark text-brand-gold flex items-center justify-center disabled:opacity-40 transition-opacity flex-shrink-0"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
            <a
              href={whatsAppHref}
              onClick={trackWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 text-xs text-brand-muted hover:text-brand-green transition-colors"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="text-brand-green">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Seguir por WhatsApp con Marcelo
            </a>
          </div>
        </div>
      ) : null}
    </>
  )
}
