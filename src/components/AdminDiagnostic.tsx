'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Status = {
  ok: boolean
  user: string | null
  profile: boolean
  role: string | null
  services: number
  error: string | null
}

export default function AdminDiagnostic() {
  const [status, setStatus] = useState<Status | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setStatus({ ok: false, user: null, profile: false, role: null, services: 0,
          error: 'Aucune session. Reconnectez-vous.' })
        return
      }

      const { data: profile, error: pErr } = await supabase
        .from('profiles').select('role, actif').eq('id', user.id).maybeSingle()

      const { data: services, error: sErr } = await supabase
        .from('services').select('id').limit(5)

      const errMsg = pErr?.message || sErr?.message || null

      setStatus({
        ok: !!profile && !errMsg && (services?.length ?? 0) > 0,
        user: user.email ?? null,
        profile: !!profile,
        role: profile?.role ?? null,
        services: services?.length ?? 0,
        error: errMsg,
      })
    }
    check()
  }, [])

  if (!status || status.ok || dismissed) return null

  return (
    <div style={{
      background: '#FFF4E5', border: '1.5px solid #E6A817', borderRadius: 16,
      padding: '16px 18px', margin: '0 0 20px', fontFamily: 'Manrope, sans-serif',
      position: 'relative',
    }}>
      <button onClick={() => setDismissed(true)} style={{
        position: 'absolute', top: 12, right: 14, background: 'transparent',
        border: 'none', cursor: 'pointer', fontSize: 16, color: '#B8830A',
      }}>×</button>

      <div style={{ fontSize: 13, fontWeight: 600, color: '#B8830A', marginBottom: 10 }}>
        ⚠ Configuration Supabase incomplète
      </div>

      <div style={{ fontSize: 12, color: '#7A5C2A', lineHeight: 1.8 }}>
        <div>Utilisateur : <strong>{status.user || '—'}</strong></div>
        <div>Profil en base : <strong style={{ color: status.profile ? '#2E7D32' : '#C62828' }}>
          {status.profile ? `oui (${status.role})` : 'MANQUANT'}
        </strong></div>
        <div>Prestations lisibles : <strong style={{ color: status.services > 0 ? '#2E7D32' : '#C62828' }}>
          {status.services}
        </strong></div>
        {status.error && (
          <div style={{ marginTop: 8, padding: '8px 10px', background: '#FFE9E9',
            borderRadius: 8, color: '#C62828', fontSize: 11, fontFamily: 'monospace' }}>
            {status.error}
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F0D9A8',
        fontSize: 12, color: '#7A5C2A', lineHeight: 1.7 }}>
        <strong>Solution :</strong> ouvrez Supabase → SQL Editor et lancez le fichier{' '}
        <code style={{ background: '#F5E6C8', padding: '2px 6px', borderRadius: 4 }}>
          migrations/05_fix_admin.sql
        </code>{' '}
        du repo, puis rechargez cette page.
      </div>
    </div>
  )
}
