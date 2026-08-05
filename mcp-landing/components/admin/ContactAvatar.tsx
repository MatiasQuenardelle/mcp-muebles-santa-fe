import { initials, nameToHue } from '@/lib/adminFormat'

// Iniciales sobre un color derivado del nombre. Sin servicio externo de avatares:
// es un panel interno y no hace falta un request más por cada fila de la lista.
export default function ContactAvatar({ name, size = 36 }: { name: string | null; size?: number }) {
  const init = initials(name)

  return (
    <div
      aria-hidden
      className="flex items-center justify-center rounded-full font-semibold text-white flex-shrink-0 select-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        backgroundColor: init ? `hsl(${nameToHue(name ?? '')} 55% 38%)` : '#B4AFA6',
      }}
    >
      {init ?? (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size * 0.5, height: size * 0.5 }}>
          <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.7-8 6v1h16v-1c0-3.3-3.6-6-8-6Z" />
        </svg>
      )}
    </div>
  )
}
