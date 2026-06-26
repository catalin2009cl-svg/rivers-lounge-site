'use client'
import { Analytics } from '@vercel/analytics/next'
import { useEffect, useState } from 'react'

export function ConditionalAnalytics() {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const checkConsent = () => {
      try {
        const consent = localStorage.getItem('rl_cookie_consent')
        if (consent) {
          const parsed = JSON.parse(consent)
          setAllowed(parsed.analytics === true)
        }
      } catch {
        setAllowed(false)
      }
    }

    checkConsent()

    window.addEventListener('consentUpdated', checkConsent)
    return () => window.removeEventListener('consentUpdated', checkConsent)
  }, [])

  if (!allowed) return null
  return <Analytics />
}
