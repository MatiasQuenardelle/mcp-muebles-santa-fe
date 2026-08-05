import { redirect } from 'next/navigation'

// El detalle vive ahora en el panel derecho de /admin?c=<id>. Esta ruta queda
// como redirect para que sigan andando los links viejos (avisos de Telegram,
// pantalla de inicio del iPhone, historial del navegador).
export default function ConversationRedirect({ params }: { params: { id: string } }) {
  redirect(`/admin?c=${encodeURIComponent(params.id)}`)
}
