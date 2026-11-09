'use client'

import { useEffect, useRef, useState } from 'react'
import { CLASE_ERROR, CLASE_INPUT } from '@/components/admin/gestion/ui'
import type { FuenteAsistente, RespuestaAsistente } from '@/lib/gestion/asistente'

const EJEMPLOS = [
  '¿Cuánto vendimos este mes?',
  '¿Cuánto tenemos pendiente de cobrar?',
  '¿Qué presupuestos necesitan seguimiento?',
  '¿Qué trabajos están atrasados?',
  '¿Cuánto debemos a proveedores?',
  '¿Qué ganancias estamos teniendo?',
]

const MAX_TURNOS = 8
const MAX_CARACTERES = 500
const ERROR_GENERICO = 'El asistente no pudo responder. Probá de nuevo en un momento.'

interface Turno {
  rol: 'usuario' | 'asistente'
  texto: string
  fuentes: FuenteAsistente[]
}

async function pedirRespuesta(turnos: Turno[]): Promise<RespuestaAsistente | { error: string }> {
  try {
    const response = await fetch('/api/admin/asistente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensajes: turnos.slice(-MAX_TURNOS).map(({ rol, texto }) => ({ rol, texto })),
      }),
    })
    // Un 504 de la plataforma llega como HTML, y una sesión vencida como la página de login.
    const datos = (await response.json().catch(() => null)) as
      | (Partial<RespuestaAsistente> & { error?: string })
      | null
    if (response.ok && typeof datos?.respuesta === 'string') {
      return { respuesta: datos.respuesta, fuentes: Array.isArray(datos.fuentes) ? datos.fuentes : [] }
    }
    if (response.status === 504) {
      return { error: 'Tardó demasiado en responder. Probá de nuevo.' }
    }
    return { error: datos?.error ?? ERROR_GENERICO }
  } catch {
    return { error: 'No se pudo conectar. Probá de nuevo.' }
  }
}

// En el iPhone el teclado tapa la página sin achicarla: solo se lo ve en visualViewport.
function useAltoTeclado(): number {
  const [alto, setAlto] = useState(0)

  useEffect(() => {
    const vista = window.visualViewport
    if (!vista) {
      return
    }
    const medir = () => setAlto(Math.max(Math.round(window.innerHeight - vista.height - vista.offsetTop), 0))
    medir()
    vista.addEventListener('resize', medir)
    vista.addEventListener('scroll', medir)
    return () => {
      vista.removeEventListener('resize', medir)
      vista.removeEventListener('scroll', medir)
    }
  }, [])

  return alto
}

function VerLosNumeros({ fuentes }: { fuentes: FuenteAsistente[] }) {
  return (
    <details className="group mt-1 min-w-0">
      <summary className="inline-flex items-center gap-1.5 py-2 pr-3 text-xs font-semibold text-brand-muted cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="transition-transform group-open:rotate-90">
          ›
        </span>
        Ver los números
      </summary>
      <div className="space-y-3 rounded-xl border border-brand-border bg-brand-cream p-3">
        {fuentes.map((fuente, indice) => (
          <section key={indice} className="min-w-0">
            <h3 className="text-[11px] uppercase tracking-wide text-brand-muted mb-1">{fuente.etiqueta}</h3>
            <p className="text-sm text-brand-dark whitespace-pre-line [overflow-wrap:anywhere]">{fuente.detalle}</p>
          </section>
        ))}
      </div>
    </details>
  )
}

function Mensaje({ turno }: { turno: Turno }) {
  if (turno.rol === 'usuario') {
    return (
      <div className="flex justify-end min-w-0">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-dark text-white px-3.5 py-2 text-sm whitespace-pre-line [overflow-wrap:anywhere]">
          {turno.texto}
        </p>
      </div>
    )
  }
  return (
    <div className="min-w-0">
      <p className="rounded-2xl rounded-bl-md border border-brand-border bg-white px-3.5 py-2.5 text-sm leading-relaxed text-brand-dark whitespace-pre-line [overflow-wrap:anywhere]">
        {turno.texto}
      </p>
      {turno.fuentes.length > 0 ? <VerLosNumeros fuentes={turno.fuentes} /> : null}
    </div>
  )
}

export default function ChatAsistente() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [borrador, setBorrador] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const altoTeclado = useAltoTeclado()
  const finRef = useRef<HTMLDivElement>(null)
  // El booleano y no el alto: el alto cambia mientras se arrastra la página con el teclado abierto.
  const tecladoAbierto = altoTeclado > 0

  useEffect(() => {
    if (turnos.length > 0 || cargando) {
      finRef.current?.scrollIntoView({ block: 'end' })
    }
  }, [turnos, cargando, tecladoAbierto])

  async function preguntar(pregunta: string) {
    const texto = pregunta.trim().slice(0, MAX_CARACTERES)
    if (!texto || cargando) {
      return
    }
    const conPregunta: Turno[] = [...turnos, { rol: 'usuario', texto, fuentes: [] }]
    setTurnos(conPregunta)
    setBorrador('')
    setError(null)
    setCargando(true)

    const resultado = await pedirRespuesta(conPregunta)

    setCargando(false)
    if ('error' in resultado) {
      // Vuelve al borrador: la charla no queda con una pregunta sin contestar.
      setTurnos(turnos)
      setBorrador(texto)
      setError(resultado.error)
      return
    }
    setTurnos([...conPregunta, { rol: 'asistente', texto: resultado.respuesta, fuentes: resultado.fuentes }])
  }

  return (
    // El relleno queda bajo el teclado: sin él la página no llega a subir el último mensaje.
    <div className="min-w-0" style={{ paddingBottom: altoTeclado }}>
      {turnos.length === 0 && !cargando ? (
        <div className="mb-3">
          <p className="text-sm text-brand-muted mb-2">Probá con alguna de estas, o escribí la tuya:</p>
          <div className="flex flex-wrap gap-2">
            {EJEMPLOS.map((ejemplo) => (
              <button
                key={ejemplo}
                type="button"
                onClick={() => preguntar(ejemplo)}
                className="rounded-2xl border border-brand-border bg-white px-3.5 py-2.5 text-left text-sm text-brand-dark"
              >
                {ejemplo}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3 mb-3" aria-live="polite">
        {turnos.map((turno, indice) => (
          <Mensaje key={indice} turno={turno} />
        ))}
        {cargando ? (
          <p role="status" className="text-sm text-brand-muted animate-pulse">
            Mirando los números…
          </p>
        ) : null}
        <div ref={finRef} style={{ scrollMarginBottom: altoTeclado + 112 }} />
      </div>

      <form
        className="sticky z-10 bg-brand-card pt-2 pb-3"
        style={{ bottom: altoTeclado }}
        onSubmit={(evento) => {
          evento.preventDefault()
          preguntar(borrador)
        }}
      >
        {error ? (
          <p role="alert" className={`${CLASE_ERROR} mb-2`}>
            {error}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={borrador}
            onChange={(evento) => setBorrador(evento.target.value)}
            maxLength={MAX_CARACTERES}
            enterKeyHint="send"
            autoComplete="off"
            aria-label="Tu pregunta"
            placeholder="Escribí tu pregunta"
            className={`${CLASE_INPUT} min-w-0 flex-1`}
          />
          <button
            type="submit"
            disabled={cargando || !borrador.trim()}
            className="flex-shrink-0 rounded-xl bg-brand-dark text-brand-gold font-semibold px-4 py-3 text-sm disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-brand-muted">Responde con lo que está cargado en el panel.</p>
      </form>
    </div>
  )
}
