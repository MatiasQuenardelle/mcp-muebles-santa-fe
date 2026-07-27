'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildWhatsAppUrl, GOOGLE_ADS_SEND_TO } from '@/lib/constants'
import { getAttribution, getOriginLabel } from '@/lib/attribution'
import { postLead } from '@/lib/lead'

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

  const attribution = getAttribution()
  const leadPayload = {
    lead_type: 'whatsapp',
    placement,
    cta_label: ctaLabel,
    lead_source: attribution?.source ?? '(direct)',
    lead_medium: attribution?.medium ?? '(none)',
    lead_campaign: attribution?.campaign ?? '',
    gclid: attribution?.gclid ?? '',
  }

  window.dataLayer?.push({
    event: 'generate_lead',
    ...leadPayload,
  })

  window.gtag?.('event', 'generate_lead', leadPayload)

  postLead({
    source: `whatsapp:${placement}`,
    page: window.location.pathname || '/',
    message: ctaLabel,
    attribution,
  })

  if (GOOGLE_ADS_SEND_TO) {
    window.gtag?.('event', 'conversion', {
      send_to: GOOGLE_ADS_SEND_TO,
    })
  }
}

export function trackChatbotOpen({
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
    event: 'chatbot_open',
    ...eventPayload,
  })

  window.gtag?.('event', 'chatbot_open', eventPayload)
}

export function useWhatsAppCTA({
  baseMessage,
  ctaLabel,
  placement,
}: UseWhatsAppCTAOptions) {
  const [locationData, setLocationData] = useState({
    pagePath: '/',
    queryString: '',
    origin: '',
  })

  useEffect(() => {
    setLocationData({
      pagePath: window.location.pathname || '/',
      queryString: window.location.search.replace(/^\?/, ''),
      origin: getOriginLabel(getAttribution()),
    })
  }, [])

  const href = useMemo(
    () =>
      buildWhatsAppUrl({
        baseMessage,
        pagePath: locationData.pagePath,
        queryString: locationData.queryString,
        origin: locationData.origin,
      }),
    [baseMessage, locationData.pagePath, locationData.queryString, locationData.origin]
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
