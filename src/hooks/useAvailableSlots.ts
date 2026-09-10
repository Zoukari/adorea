import { useEffect, useState, useCallback } from 'react'
import type { AvailableSlot } from '@/types'

export function useAvailableSlots(serviceId: string | null, date: string | null) {
  const [slots, setSlots]   = useState<AvailableSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!serviceId || !date) { setSlots([]); return }
    setLoading(true); setError(null)
    try {
      const res = await window.fetch(`/api/slots?service_id=${serviceId}&date=${date}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSlots(data.slots || [])
    } catch (e) {
      setError((e as Error).message)
      setSlots([])
    } finally {
      setLoading(false)
    }
  }, [serviceId, date])

  useEffect(() => { fetch() }, [fetch])
  return { slots, loading, error, refetch: fetch }
}

export function useAvailableDays(serviceId: string | null, year: number, month: number) {
  const [days, setDays]     = useState<{ jour: string; a_des_creneaux: boolean }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!serviceId) return
    setLoading(true)
    window.fetch(`/api/slots?mode=days&service_id=${serviceId}&year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => { setDays(d.days || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [serviceId, year, month])

  return { days, loading }
}
