import { dayKey, dayLabel, formatTime } from '@/lib/adminFormat'
import type { MessageRow } from '@/lib/db'

// Convención de inbox: el visitante a la izquierda, el asistente a la derecha.
// Marcelo lee el panel como si fuera un WhatsApp, no como si fuera él el que
// escribió los mensajes del bot.
export default function Thread({ messages }: { messages: MessageRow[] }) {
  if (messages.length === 0) {
    return <p className="text-sm text-brand-muted">No hay mensajes guardados.</p>
  }

  return (
    <div className="space-y-1">
      {messages.map((message, index) => {
        const previous = index > 0 ? messages[index - 1] : null
        const day = dayKey(message.created_at)
        const isNewDay = !previous || dayKey(previous.created_at) !== day
        // La colita va en el primer mensaje de cada tanda del mismo remitente.
        const showTail = isNewDay || previous?.role !== message.role
        const isUser = message.role === 'user'

        return (
          <div key={index}>
            {isNewDay ? (
              <div className="flex justify-center py-3 select-none">
                <span className="text-[11px] font-medium text-brand-muted bg-white/80 px-3 py-1 rounded-full">
                  {dayLabel(message.created_at)}
                </span>
              </div>
            ) : null}

            <div className={`flex ${isUser ? 'justify-start' : 'justify-end'} ${showTail ? 'mt-2' : ''}`}>
              <div
                className={`relative max-w-[85%] sm:max-w-[70%] px-3 py-2 rounded-xl shadow-sm ${
                  isUser ? 'bg-white text-brand-dark' : 'bg-brand-dark text-white'
                } ${showTail ? (isUser ? 'rounded-tl-none' : 'rounded-tr-none') : ''}`}
              >
                {showTail ? <Tail isUser={isUser} /> : null}

                {!isUser && showTail ? (
                  <span className="block text-[10px] font-semibold tracking-wide text-brand-gold mb-0.5">
                    IA
                  </span>
                ) : null}

                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <span
                  className={`float-right ml-3 mt-1 translate-y-[2px] text-[10px] leading-none tabular-nums ${
                    isUser ? 'text-brand-muted' : 'text-white/50'
                  }`}
                >
                  {formatTime(message.created_at)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Tail({ isUser }: { isUser: boolean }) {
  if (isUser) {
    return (
      <svg viewBox="0 0 8 13" width="8" height="13" className="absolute -left-[7px] top-0" aria-hidden>
        <path d="M7 0 L7 6 C7 10 3 13 0 13 L8 13 L8 0 Z" fill="#FFFFFF" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 8 13" width="8" height="13" className="absolute -right-[7px] top-0" aria-hidden>
      <path d="M1 0 L1 6 C1 10 5 13 8 13 L0 13 L0 0 Z" fill="#1A1714" />
    </svg>
  )
}
