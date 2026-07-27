'use client'

import { useEffect } from 'react'
import { captureAttribution } from '@/lib/attribution'

export default function AttributionTracker() {
  useEffect(() => {
    captureAttribution()
  }, [])

  return null
}
