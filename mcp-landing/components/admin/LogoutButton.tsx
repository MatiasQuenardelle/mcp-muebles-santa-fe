'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleClick() {
    await fetch('/api/admin/login', { method: 'DELETE' }).catch(() => {})
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      className="text-xs text-brand-muted underline underline-offset-2 whitespace-nowrap flex-shrink-0 mt-1"
    >
      Salir
    </button>
  )
}
