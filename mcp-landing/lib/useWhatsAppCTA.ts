'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildWhatsAppUrl, GOOGLE_ADS_SEND_TO } from '@/lib/constants'

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
    gtag?: (...args: unknown[]) => void
  }
}

interface UseWhatsAppCTAOptions {
  baseMessage?: string
  ctaLabel: string
  placement: string
}

export function trackWhatsAppClick({
  ctaLabel,
  placement,
}: {
  ctaLabel: string
  placement: string
}) {
  if (typeof window === 'undefined') {
    return
  }

  const eventPayload = {
    event_category: 'lead',
    event_label: `${placement}:${ctaLabel}`,
    cta_label: ctaLabel,
    placement,
  }

  window.dataLayer?.push({
    event: 'whatsapp_click',
    ...eventPayload,
  })

  window.gtag?.('event', 'whatsapp_click', eventPayload)

  if (GOOGLE_ADS_SEND_TO) {
    window.gtag?.('event', 'conversion', {
      send_to: GOOGLE_ADS_SEND_TO,
    })
  }
}

export function useWhatsAppCTA({
  baseMessage,
  ctaLabel,
  placement,
}: UseWhatsAppCTAOptions) {
  const [locationData, setLocationData] = useState({
    pagePath: '/',
    queryString: '',
  })

  useEffect(() => {
    setLocationData({
      pagePath: window.location.pathname || '/',
      queryString: window.location.search.replace(/^\?/, ''),
    })
  }, [])

  const href = useMemo(
    () =>
      buildWhatsAppUrl({
        baseMessage,
        pagePath: locationData.pagePath,
        queryString: locationData.queryString,
      }),
    [baseMessage, locationData.pagePath, locationData.queryString]
  )

  const handleClick = () => {
    trackWhatsAppClick({
      ctaLabel,
      placement,
    })
  }

  return {
    href,
    handleClick,
  }
}
