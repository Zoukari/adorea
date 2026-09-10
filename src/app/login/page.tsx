'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const T = {
  nude: '#D7B6B1', beige: '#EADCC8', gold: '#C9A96A',
  black: '#1A1A1A', offwhite: '#F9F6F2', muted: '#8A7A74',
}

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function login() {
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1A1A1A',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300&family=Montserrat:wght@300;400;500&display=swap');`}</style>
      <div style={{
        width: 380,
        background: T.offwhite,
        borderRadius: 24,
        padding: '48px 40px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 300, color: T.black, letterSpacing: '0.05em' }}>
            ADORÉA
          </div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: '0.25em', color: T.muted, marginTop: 6, textTransform: 'uppercase' }}>
            Espace Admin
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', color: T.muted, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${T.beige}`, borderRadius: 14, fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 300, outline: 'none', color: T.black, background: 'white', transition: 'border-color 0.2s' }}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', color: T.muted, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${T.beige}`, borderRadius: 14, fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 300, outline: 'none', color: T.black, background: 'white' }}
          />
        </div>

        {error && (
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#F44336', marginBottom: 16, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button
          onClick={login}
          disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: 100, border: 'none', cursor: 'pointer', background: T.black, color: T.offwhite, fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', transition: 'opacity 0.2s', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </div>
    </div>
  )
}
