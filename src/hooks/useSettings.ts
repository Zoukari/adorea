import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { WhatsAppConfig } from '@/types'

export function useSiteSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('site_settings').select('key,value').then(({ data }) => {
      const map: Record<string, string> = {}
      ;(data || []).forEach(({ key, value }: { key: string; value: string }) => { map[key] = value })
      setSettings(map)
      setLoading(false)
    })
  }, [])

  const wa: WhatsAppConfig = {
    enabled:          settings.wa_enabled          === 'true',
    numero_principal: settings.wa_numero_principal  || '+25377596159',
    paiements:        settings.wa_paiements         === 'true',
    validation_sante: settings.wa_validation_sante  === 'true',
    rappels:          settings.wa_rappels           === 'true',
    bouton_flottant:  settings.wa_bouton_flottant   === 'true',
    reservation:      settings.wa_reservation       === 'true',
    retouches:        settings.wa_retouches         === 'true',
    fidelite:         settings.wa_fidelite          === 'true',
  }

  return { settings, wa, loading }
}
