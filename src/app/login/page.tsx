'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function login() {
    setError(''); setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background: T.offwhite,
    }}>
      <div style={{width:380,background:'white',border:`1px solid ${T.beige}`,borderRadius:8,padding:'48px 40px'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:32,fontWeight:300,color:T.black}}>ADORÉA</div>
          <div style={{fontSize:10,letterSpacing:'0.2em',color:T.muted,marginTop:4,textTransform:'uppercase'}}>Espace Admin</div>
        </div>

        <div style={{marginBottom:16}}>
          <label style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',color:T.muted,textTransform:'uppercase',display:'block',marginBottom:8}}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key==='Enter' && login()}
            style={{width:'100%',padding:'12px 16px',border:`1px solid ${T.beige}`,borderRadius:4,fontFamily:'Manrope,sans-serif',fontSize:14,outline:'none',color:T.black}} />
        </div>
        <div style={{marginBottom:24}}>
          <label style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',color:T.muted,textTransform:'uppercase',display:'block',marginBottom:8}}>Mot de passe</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key==='Enter' && login()}
            style={{width:'100%',padding:'12px 16px',border:`1px solid ${T.beige}`,borderRadius:4,fontFamily:'Manrope,sans-serif',fontSize:14,outline:'none',color:T.black}} />
        </div>

        {error && <div style={{fontSize:12,color:'#F44336',marginBottom:16,textAlign:'center'}}>{error}</div>}

        <button onClick={login} disabled={loading} style={{
          width:'100%',padding:'14px',borderRadius:4,border:'none',cursor:'pointer',
          background:T.black,color:T.offwhite,fontSize:13,fontWeight:600,fontFamily:'Manrope,sans-serif',
        }}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </div>
    </div>
  )
}
