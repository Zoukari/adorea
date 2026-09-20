'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Profile = { id: string; prenom: string; nom: string; role: string; email: string; initials: string; has_pin: boolean }

const T = { gold:'#C9A96A', black:'#1A1A1A', muted:'#8A7A74', beige:'#EADCC8' }

/* ── Pavé numérique 3×4 ─────────────────────────────────── */
function NumPad({ onDigit, onDelete }: { onDigit:(d:string)=>void; onDelete:()=>void }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:220, margin:'0 auto' }}>
      {['1','2','3','4','5','6','7','8','9','⌫','0',''].map((k,i) => (
        k === '' ? <div key={i}/> :
        <button key={i}
          onClick={()=> k==='⌫' ? onDelete() : onDigit(k)}
          style={{ height:56, borderRadius:14, border:`1.5px solid ${T.beige}`, background:'#fff',
            fontSize:20, fontWeight: k==='⌫' ? 400 : 600, color:T.black, cursor:'pointer',
            fontFamily:'Manrope,sans-serif', boxShadow:'0 2px 8px rgba(26,26,26,.06)',
            transition:'transform .1s, box-shadow .1s' }}>
          {k}
        </button>
      ))}
    </div>
  )
}

/* ── Saisie PIN ─────────────────────────────────────────── */
function PinScreen({ profile, onBack, onFallback }:
  { profile: Profile; onBack:()=>void; onFallback:()=>void }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  // createClient utilisé au moment de la vérification OTP
  const router = useRouter()
  const params = useSearchParams()

  async function tryLogin(code: string) {
    setLoading(true)
    const res = await fetch('/api/pin-login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ profile_id: profile.id, pin: code }),
    })
    const d = await res.json()
    if (!res.ok) {
      const m: Record<string,string> = {
        WRONG_PIN:'PIN incorrect', NO_PIN_SET:'Aucun PIN configuré.', PROFILE_NOT_FOUND:'Compte introuvable.',
      }
      setErr(m[d.error] || 'Erreur. Réessayez.')
      setPin(''); setLoading(false); return
    }
    // Vérification du code OTP à 6 chiffres généré côté serveur
    const supa = createClient()
    const { error } = await supa.auth.verifyOtp({
      email: d.email, token: d.otp, type: 'email',
    })
    if (error) {
      setErr(`Session échouée : ${error.message}`)
      setLoading(false); return
    }
    router.push(params.get('from') || '/admin')
    router.refresh()
  }

  const addDigit = (d: string) => {
    if (loading || pin.length >= 6) return
    const next = pin + d; setPin(next); setErr('')
    if (next.length >= 4) tryLogin(next)
  }

  return (
    <div style={{ textAlign:'center' }}>
      {/* Avatar */}
      <div style={{ width:72, height:72, borderRadius:'50%', background:T.gold, color:'#fff',
        display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px',
        fontFamily:'Cormorant Garamond,serif', fontSize:28, fontWeight:300 }}>
        {profile.initials}
      </div>
      <div style={{ fontSize:18, fontWeight:600, color:T.black, marginBottom:2 }}>{profile.prenom} {profile.nom}</div>
      <div style={{ fontSize:11, color:T.muted, marginBottom:6 }}>{profile.email}</div>
      <div style={{ fontSize:11, color:T.muted, marginBottom:28, letterSpacing:'.08em', textTransform:'uppercase' }}>
        {profile.has_pin ? 'Entrez votre PIN' : 'PIN non configuré — utilisez votre email'}
      </div>

      {/* Indicateur points */}
      <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:28 }}>
        {Array.from({length:6}).map((_,i) => (
          <div key={i} style={{ width:12, height:12, borderRadius:'50%',
            background: i < pin.length ? T.black : T.beige, transition:'background .15s' }}/>
        ))}
      </div>

      {err && (
        <div style={{ background:'#FFEBEE', color:'#C62828', border:'1px solid #FFCDD2', borderRadius:12,
          padding:'9px 14px', fontSize:12, marginBottom:16, fontFamily:'Manrope,sans-serif' }}>{err}</div>
      )}

      {loading ? (
        <div style={{ fontSize:13, color:T.muted, padding:'16px 0' }}>Connexion...</div>
      ) : profile.has_pin ? (
        <NumPad onDigit={addDigit} onDelete={()=>{ setPin(p=>p.slice(0,-1)); setErr('') }}/>
      ) : null}

      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:22, alignItems:'center' }}>
        {!profile.has_pin && (
          <button onClick={onFallback} style={{ background:T.black, color:'#fff', border:'none',
            borderRadius:100, padding:'12px 32px', fontFamily:'Manrope,sans-serif', fontSize:12,
            fontWeight:700, letterSpacing:'.08em', cursor:'pointer' }}>
            Se connecter par email / mot de passe
          </button>
        )}
        <button onClick={onFallback} style={{ background:'transparent', border:'none', cursor:'pointer',
          fontSize:11, color:T.muted, textDecoration:'underline', fontFamily:'Manrope,sans-serif' }}>
          Utiliser email / mot de passe
        </button>
        <button onClick={onBack} style={{ background:'transparent', border:'none', cursor:'pointer',
          fontSize:11, color:T.muted, fontFamily:'Manrope,sans-serif' }}>
          ← Autre compte
        </button>
      </div>
    </div>
  )
}

/* ── Email fallback ─────────────────────────────────────── */
function EmailScreen({ defaultEmail, onBack }:{ defaultEmail?:string; onBack:()=>void }) {
  const [email, setEmail] = useState(defaultEmail||'')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const params = useSearchParams()

  async function login() {
    setErr(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email:email.trim(), password })
    if (error) { setErr('Email ou mot de passe incorrect.'); setLoading(false) }
    else router.push(params.get('from') || '/admin')
  }

  return (
    <>
      <div style={{ marginBottom:18 }}>
        <label style={{ display:'block', fontSize:10, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:T.muted, marginBottom:6 }}>Email</label>
        <input style={{ width:'100%', padding:'12px 14px', border:`1.5px solid ${T.beige}`, borderRadius:13, fontSize:14, fontFamily:'Manrope,sans-serif', outline:'none', boxSizing:'border-box' as const }}
          type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} autoFocus={!defaultEmail}/>
      </div>
      <div style={{ marginBottom:20, position:'relative' as const }}>
        <label style={{ display:'block', fontSize:10, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:T.muted, marginBottom:6 }}>Mot de passe</label>
        <input style={{ width:'100%', padding:'12px 40px 12px 14px', border:`1.5px solid ${T.beige}`, borderRadius:13, fontSize:14, fontFamily:'Manrope,sans-serif', outline:'none', boxSizing:'border-box' as const }}
          type={showPwd?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&login()} autoFocus={!!defaultEmail}/>
        <button type="button" onClick={()=>setShowPwd(s=>!s)}
          style={{ position:'absolute' as const, right:12, top:36, background:'transparent', border:'none', cursor:'pointer', color:T.muted, fontSize:16 }}>
          {showPwd?'🙈':'👁'}
        </button>
      </div>
      {err && <div style={{ background:'#FFEBEE', color:'#C62828', borderRadius:10, padding:'9px 12px', fontSize:11.5, marginBottom:14 }}>{err}</div>}
      <button onClick={login} disabled={loading}
        style={{ width:'100%', padding:14, borderRadius:100, border:'none', background:T.black, color:'#fff',
          fontSize:12, fontWeight:700, letterSpacing:'.1em', cursor:'pointer', fontFamily:'Manrope,sans-serif',
          opacity:loading?.7:1 }}>
        {loading?'Connexion...':'Se connecter'}
      </button>
      <button onClick={onBack} style={{ display:'block', margin:'14px auto 0', background:'transparent',
        border:'none', cursor:'pointer', fontSize:11, color:T.muted, textDecoration:'underline', fontFamily:'Manrope,sans-serif' }}>
        ← Retour
      </button>
    </>
  )
}

/* ── Page principale ────────────────────────────────────── */
function LoginContent() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Profile|null>(null)
  const [emailMode, setEmailMode] = useState(false)

  useEffect(() => {
    fetch('/api/pin-login').then(r=>r.json())
      .then(d=>{ setProfiles(d.profiles||[]); setLoading(false) })
      .catch(()=>{ setLoading(false); setEmailMode(true) })
  }, [])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#1A1A1A', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:24, color:'rgba(255,255,255,.3)' }}>ADORÉA</div>
    </div>
  )

  const reset = () => { setSelected(null); setEmailMode(false) }

  return (
    <div style={{ minHeight:'100vh', background:'#F2EDE8', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:380, background:'#fff', borderRadius:28, padding:'40px 32px',
        boxShadow:'0 16px 60px rgba(26,26,26,.1)' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:28, fontWeight:300, letterSpacing:'.22em', color:T.black }}>ADORÉA</div>
          <div style={{ fontSize:9, fontWeight:600, letterSpacing:'.35em', color:T.gold, textTransform:'uppercase', marginTop:4 }}>Espace équipe</div>
        </div>

        {/* Écran PIN */}
        {selected && !emailMode && (
          <PinScreen profile={selected} onBack={reset}
            onFallback={()=>setEmailMode(true)}/>
        )}

        {/* Écran Email */}
        {emailMode && (
          <EmailScreen defaultEmail={selected?.email} onBack={reset}/>
        )}

        {/* Sélection compte */}
        {!selected && !emailMode && (
          <>
            {profiles.length > 0 ? (
              <>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase',
                  color:T.muted, textAlign:'center', marginBottom:20 }}>Qui êtes-vous ?</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {profiles.map(p => (
                    <button key={p.id} onClick={()=>setSelected(p)} style={{
                      display:'flex', alignItems:'center', gap:14, padding:'14px 16px',
                      border:`1.5px solid ${T.beige}`, borderRadius:18, background:'#fff',
                      cursor:'pointer', fontFamily:'Manrope,sans-serif', textAlign:'left' as const, width:'100%',
                      transition:'border-color .2s' }}>
                      <div style={{ width:44, height:44, borderRadius:'50%', background:T.gold, color:'#fff',
                        flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'Cormorant Garamond,serif', fontSize:18, fontWeight:300 }}>
                        {p.initials}
                      </div>
                      <div style={{ flex:1, textAlign:'left' as const, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:T.black }}>{p.prenom} {p.nom}</div>
                        <div style={{ fontSize:11, color:T.muted, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {p.email}
                        </div>
                        <div style={{ fontSize:10, color: p.has_pin ? T.gold : T.beige, marginTop:2 }}>
                          {p.has_pin ? '🔒 PIN actif' : 'Sans PIN'}
                        </div>
                      </div>
                      <span style={{ color:T.beige, fontSize:20 }}>›</span>
                    </button>
                  ))}
                </div>
                <button onClick={()=>setEmailMode(true)} style={{ display:'block', margin:'16px auto 0',
                  background:'transparent', border:'none', cursor:'pointer', fontSize:11, color:T.muted,
                  textDecoration:'underline', fontFamily:'Manrope,sans-serif' }}>
                  Se connecter par email
                </button>
              </>
            ) : (
              <EmailScreen onBack={()=>{}} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#1A1A1A' }}/>}>
      <LoginContent />
    </Suspense>
  )
}
