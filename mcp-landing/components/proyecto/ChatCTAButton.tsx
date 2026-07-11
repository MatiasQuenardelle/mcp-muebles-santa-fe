'use client'

import { trackChatbotOpen } from '@/lib/useWhatsAppCTA'

export type ChatSource = 'hero' | 'precios' | 'final'

interface Props {
  text: string
  source: ChatSource
  placement: string
  className?: string
  pulse?: boolean
  size?: 'default' | 'small'
  fullWidth?: boolean
}

export default function ChatCTAButton({
  text,
  source,
  placement,
  className = '',
  pulse = false,
  size = 'default',
  fullWidth = true,
}: Props) {
  const sizeClasses = size === 'small'
    ? 'text-sm py-3 px-6 gap-2'
    : 'text-base py-4 px-8 gap-3'
  const iconSize = size === 'small' ? 18 : 22

  const handleClick = () => {
    trackChatbotOpen({ ctaLabel: text, placement })
    window.dispatchEvent(new CustomEvent('mcp:open-chat', { detail: { source } }))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center bg-brand-gold text-brand-dark font-bold rounded-full transition-all duration-200 hover:brightness-110 hover:shadow-glow-gold ${fullWidth ? 'w-full' : ''} ${sizeClasses} ${pulse ? 'animate-pulse-glow-gold' : ''} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width={iconSize}
        height={iconSize}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10.5h8M8 14h5m-9.5 5.5V6.8c0-1 .8-1.8 1.8-1.8h13.4c1 0 1.8.8 1.8 1.8v9.4c0 1-.8 1.8-1.8 1.8H7l-3.5 3.5z"
        />
      </svg>
      {text}
    </button>
  )
}
