import { useState, useCallback } from 'react'
import type { Client } from '@/types'

export function useClientLookup() {
  const [client, setClient]   = useState<Partial<Client> | null>(null)
  const [loading, setLoading] = useState(false)
  const [found, setFound]     = useState(false)

  const lookup = useCallback(async (tel: string) => {
    if (!tel || tel.length < 8) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/client?tel=${encodeURIComponent(tel)}`)
      const data = await res.json()
      if (data.client) {
        setClient(data.client)
        setFound(true)
      } else {
        setClient({ telephone: tel })
        setFound(false)
      }
    } catch {
      setClient({ telephone: tel })
      setFound(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setClient(null); setFound(false)
  }, [])

  return { client, loading, found, lookup, reset, setClient }
}
