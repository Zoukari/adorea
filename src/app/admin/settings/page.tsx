'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }

const SECTIONS = [
  {
    title: 'Informations du studio',
    keys: [
      { key:'adresse',   label:'Adresse',   type:'text' },
      { key:'telephone', label:'Téléphone', type:'text' },
      { key:'email',     label:'Email',     type:'email' },
      { key:'horaires',  label:'Horaires',  type:'text' },
    ],
  },
  {
    title: 'Google Maps',
    keys: [
      { key:'maps_lat', label:'Latitude',  type:'text' },
      { key:'maps_lng', label:'Longitude', type:'text' },
      { key:'maps_url', label:'URL Google Maps', type:'text' },
    ],
  },
  {
    title: 'WhatsApp',
    keys: [
      { key:'wa_numero_principal', label:'Numéro principal', type:'text' },
    ],
  },
  {
    title: 'Réseaux sociaux',
    keys: [
      { key:'instagram_url', label:'Instagram URL', type:'text' },
      { key:'tiktok_url',    label:'TikTok URL',    type:'text' },
      { key:'facebook_url',  label:'Facebook URL',  type:'text' },
    ],
  },
  {
    title: 'Réservation',
    keys: [
      { key:'delai_min_resa_heures', label:'Délai min réservation (heures)', type:'number' },
      { key:'delai_max_resa_jours',  label:'Délai max réservation (jours)', type:'number' },
      { key:'buffer_defaut_minutes', label:'Buffer défaut (minutes)', type:'number' },
    ],
  },
]

const WA_TOGGLES = [
  { key:'wa_enabled',          label:'WhatsApp activé',
    desc:'Interrupteur principal. Désactivé, aucun message WhatsApp n\'est proposé nulle part.' },
  { key:'wa_bouton_flottant',  label:'Bouton flottant sur le site',
    desc:'Affiche la bulle verte WhatsApp en bas de la page publique.' },
  { key:'wa_reservation',      label:'Réservation',
    desc:'À la fin du formulaire de réservation, ouvre WhatsApp avec le récapitulatif du rendez-vous pré-rempli.' },
  { key:'wa_paiements',        label:'Paiements',
    desc:'Demande à la cliente d\'envoyer sa capture de paiement (CAC PAY, WAAFI, D-Money) par WhatsApp.' },
  { key:'wa_validation_sante', label:'Validation santé',
    desc:'Quand une cliente coche une contre-indication, son rendez-vous vous est envoyé pour validation avant confirmation.' },
  { key:'wa_rappels',          label:'Rappels de rendez-vous',
    desc:'Affiche un bouton WhatsApp sur chaque rendez-vous pour envoyer un rappel à la cliente en un clic.' },
  { key:'wa_retouches',        label:'Retouches PMU',
    desc:'Bouton WhatsApp dans Fidélité pour prévenir les clientes dont la retouche approche.' },
  { key:'wa_fidelite',         label:'Récompenses fidélité',
    desc:'Permet d\'envoyer une récompense fidélité à la cliente par WhatsApp.' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<'wa'|'general'|'social'|'pin'|'reset'>('general')
  const supabase = createClient()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('site_settings').select('key,value').then(({ data }) => {
      const map: Record<string, string> = {}
      ;(data || []).forEach(({ key, value }: { key: string; value: string }) => { map[key] = value || '' })
      setSettings(map)
      setLoading(false)
    })
  }, [])

  async function save() {
    const upserts = Object.entries(settings).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }))
    await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  function set(key: string, value: string) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  if (loading) return <div style={{ padding:32, color:T.muted, fontSize:13 }}>Chargement...</div>

  return (
    <div style={{ padding:32, maxWidth:700 }}>
      <div className="tabs" style={{marginBottom:20}}>
        <button className={tab==='general'?'on':''} onClick={()=>setTab('general')}>Général</button>
        <button className={tab==='wa'?'on':''} onClick={()=>setTab('wa')}>WhatsApp</button>
        <button className={tab==='social'?'on':''} onClick={()=>setTab('social')}>Réseaux sociaux</button>
        <button className={tab==='pin'?'on':''} onClick={()=>setTab('pin')}>Mon profil</button>
        <button className={tab==='reset'?'on':''} onClick={()=>setTab('reset')}>Données</button>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
        <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300 }}>Paramètres</h1>
        <button onClick={save} style={{
          padding:'10px 24px', borderRadius:4, border:'none', cursor:'pointer',
          background: saved ? '#4CAF50' : T.black, color:T.offwhite,
          fontSize:12, fontWeight:600, fontFamily:'Manrope,sans-serif', transition:'background 0.2s',
        }}>{saved ? '✓ Sauvegardé' : 'Sauvegarder'}</button>
      </div>

      {(tab==='wa'||tab==='general') && (<div style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:8, padding:24, marginBottom:24 }}>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.15em', color:T.muted, textTransform:'uppercase', marginBottom:16 }}>WhatsApp — Activations</div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {WA_TOGGLES.map((t, i) => {
            const on = settings[t.key] === 'true'
            const master = t.key === 'wa_enabled'
            const disabled = !master && settings['wa_enabled'] !== 'true'
            return (
              <div key={t.key} style={{
                display:'flex', alignItems:'flex-start', gap:14, padding:'13px 0',
                borderTop: i===0 ? 'none' : '1px solid #F2EDE8',
                opacity: disabled ? 0.45 : 1,
              }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight: master ? 600 : 500, color:T.black }}>
                    {t.label}
                    {master && <span className="badge" style={{ background:'#FBF5EC', color:T.gold, marginLeft:8 }}>Principal</span>}
                  </div>
                  <div style={{ fontSize:11.5, color:T.muted, marginTop:3, lineHeight:1.55 }}>{t.desc}</div>
                </div>
                <button className={`sw${on?' on':''}`} style={{ marginTop:2 }}
                  disabled={disabled}
                  onClick={() => set(t.key, on ? 'false' : 'true')} />
              </div>
            )
          })}
        </div>
      </div>)}

      {/* Sections paramètres */}
      {(tab==='general') && SECTIONS.map(section => (
        <div key={section.title} style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:8, padding:24, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.15em', color:T.muted, textTransform:'uppercase', marginBottom:16 }}>
            {section.title}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {section.keys.map(f => (
              <div key={f.key}>
                <label style={{ fontSize:11, fontWeight:600, letterSpacing:'0.1em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>{f.label}</label>
                <input type={f.type} value={settings[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                  style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', color:T.black, background:'white' }} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {tab==='pin' && <ProfileSection/>}
      {tab==='reset' && <ResetSection/>}


    </div>
  )
}
// ── Paramétrage du PIN ──────────────────────────────────────
function ProfileSection() {
  const supabase = createClient()
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email || '')
      const { data: p } = await supabase.from('profiles').select('prenom, nom').eq('id', user.id).maybeSingle()
      if (p) { setPrenom(p.prenom || ''); setNom(p.nom || '') }
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveName() {
    setMsg(''); setErr('')
    if (!prenom.trim()) { setErr('Le prénom est requis.'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ prenom: prenom.trim(), nom: nom.trim() }).eq('id', user.id)
    setMsg('Nom mis à jour !')
    setTimeout(() => setMsg(''), 3000)
  }

  async function savePin() {
    setMsg(''); setErr('')
    if (!/^\d{4,6}$/.test(pin)) { setErr('Le PIN doit contenir 4 à 6 chiffres.'); return }
    if (pin !== confirm) { setErr('Les deux PIN ne correspondent pas.'); return }
    const res = await fetch('/api/pin-login', {
      method: 'PUT', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ pin }),
    })
    if (res.ok) { setMsg('PIN enregistré !'); setPin(''); setConfirm('') }
    else { setErr('Erreur. Réessayez.') }
  }

  if (loading) return <div style={{padding:20,color:'#8A7A74',fontSize:13}}>Chargement...</div>

  return (
    <div style={{ maxWidth:420 }}>
      {/* Identité */}
      <div style={{ background:'#fff', border:'1.5px solid #EFE6DC', borderRadius:18, padding:'18px 20px', marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:'#8A7A74', marginBottom:14 }}>
          Identité
        </div>
        <div style={{ fontSize:12, color:'#8A7A74', marginBottom:14, fontFamily:'Manrope,sans-serif' }}>
          {email}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
          <div>
            <label className="lbl">Prénom *</label>
            <input className="f" value={prenom} onChange={e=>setPrenom(e.target.value)} style={{marginBottom:0}} placeholder="Adlina" />
          </div>
          <div>
            <label className="lbl">Nom</label>
            <input className="f" value={nom} onChange={e=>setNom(e.target.value)} style={{marginBottom:0}} placeholder="Beauty" />
          </div>
        </div>
        <button className="b-primary" style={{width:'100%'}} onClick={saveName}>
          Mettre à jour le nom
        </button>
      </div>

      {/* PIN */}
      <div style={{ background:'#fff', border:'1.5px solid #EFE6DC', borderRadius:18, padding:'18px 20px' }}>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:'#8A7A74', marginBottom:8 }}>
          Mon profil de connexion
        </div>
        <div style={{ fontSize:12, color:'#8A7A74', lineHeight:1.7, marginBottom:14, fontFamily:'Manrope,sans-serif' }}>
          Le PIN vous permet de vous connecter rapidement sans mot de passe. 4 à 6 chiffres. Vous ne pouvez configurer que le vôtre.
        </div>
        <label className="lbl">Nouveau PIN</label>
        <input className="f" type="password" inputMode="numeric" maxLength={6}
          value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} placeholder="••••" />
        <label className="lbl" style={{marginTop:10}}>Confirmer</label>
        <input className="f" type="password" inputMode="numeric" maxLength={6}
          value={confirm} onChange={e=>setConfirm(e.target.value.replace(/\D/g,''))} placeholder="••••" />
        <button className="b-primary" style={{marginTop:14,width:'100%'}} onClick={savePin}>
          Enregistrer mon PIN
        </button>
      </div>

      {err && <div style={{color:'#C62828',fontSize:12,marginTop:10,fontFamily:'Manrope,sans-serif'}}>⚠ {err}</div>}
      {msg && <div style={{color:'#2E7D32',fontSize:12,marginTop:10,fontFamily:'Manrope,sans-serif'}}>✓ {msg}</div>}
    </div>
  )
}

// ── Remise à zéro des données ───────────────────────────────
const RESET_SCOPES = [
  { key:'ventes',   label:'Rendez-vous, ventes et paiements',
    desc:'Tout l\'historique de caisse : rendez-vous, encaissements, fiches santé et consentements.' },
  { key:'clients',  label:'Fiches clientes',
    desc:'Toutes les clientes et leurs récompenses fidélité.' },
  { key:'depenses', label:'Dépenses',
    desc:'Les achats et charges saisis en comptabilité.' },
  { key:'clotures', label:'Clôtures de caisse',
    desc:'L\'historique des fermetures et des écarts.' },
  { key:'journaux', label:'Journaux techniques',
    desc:'Traces de notifications et d\'activité. Sans effet sur vos chiffres.' },
]

function ResetSection() {
  const [scopes, setScopes] = useState<string[]>(['ventes'])
  const [confirm, setConfirm] = useState('')
  const [running, setRunning] = useState(false)
  const [rapport, setRapport] = useState<Record<string, number|string>|null>(null)
  const [err, setErr] = useState('')

  const toggle = (k: string) =>
    setScopes(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k])

  async function run() {
    setErr(''); setRapport(null)
    if (confirm !== 'REMISE A ZERO') { setErr('Recopiez exactement : REMISE A ZERO'); return }
    if (!scopes.length) { setErr('Choisissez au moins une catégorie.'); return }
    setRunning(true)
    const res = await fetch('/api/admin/reset', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ confirm, scopes }),
    })
    const d = await res.json()
    setRunning(false)
    if (!res.ok) { setErr(d.error === 'NOT_AUTHENTICATED' ? 'Session expirée, reconnectez-vous.' : 'Erreur : ' + (d.error || 'inconnue')); return }
    setRapport(d.supprime); setConfirm('')
  }

  const total = rapport
    ? Object.values(rapport).filter(v => typeof v === 'number').reduce((a, b) => a + (b as number), 0)
    : 0

  return (
    <div style={{ maxWidth:520 }}>
      {/* Ce qui est conservé */}
      <div style={{ background:'#F1F8F2', border:'1.5px solid #A5D6A7', borderRadius:16,
        padding:'15px 17px', marginBottom:18 }}>
        <div style={{ fontSize:12.5, fontWeight:600, color:'#2E7D32', marginBottom:6 }}>
          Toujours conservé
        </div>
        <div style={{ fontSize:11.5, color:'#4A7C4E', lineHeight:1.7 }}>
          Prestations et catégories · Équipe · Horaires d&apos;ouverture · Promotions ·
          Règles de fidélité · Images du site · Paramètres · Comptes et PIN
        </div>
      </div>

      <div style={{ fontSize:13, color:'#8A7A74', lineHeight:1.7, marginBottom:16 }}>
        Effacez vos données de test avant le lancement. Cette action est définitive —
        les données supprimées ne sont pas récupérables.
      </div>

      {/* Catégories */}
      <div style={{ border:'1.5px solid #E5DACE', borderRadius:16, overflow:'hidden', marginBottom:18 }}>
        {RESET_SCOPES.map((sc, i) => {
          const on = scopes.includes(sc.key)
          return (
            <button key={sc.key} type="button" onClick={()=>toggle(sc.key)}
              style={{ display:'flex', alignItems:'flex-start', gap:11, width:'100%',
                padding:'13px 15px', border:'none',
                borderTop: i===0 ? 'none' : '1px solid #F2EDE8',
                background: on ? '#FDF3F3' : '#fff', cursor:'pointer',
                fontFamily:'Manrope,sans-serif', textAlign:'left' }}>
              <span style={{ width:17, height:17, borderRadius:5, flexShrink:0, marginTop:2,
                display:'flex', alignItems:'center', justifyContent:'center',
                background: on ? '#D14343' : '#fff',
                border: on ? '2px solid #D14343' : '2px solid #C5B8A5',
                color:'#fff', fontSize:11, fontWeight:700 }}>{on ? '✓' : ''}</span>
              <span style={{ flex:1 }}>
                <span style={{ display:'block', fontSize:13, fontWeight:500, color:'#1A1A1A' }}>
                  {sc.label}
                </span>
                <span style={{ display:'block', fontSize:11, color:'#8A7A74', marginTop:3, lineHeight:1.5 }}>
                  {sc.desc}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Confirmation */}
      <label className="lbl">Recopiez <strong>REMISE A ZERO</strong> pour confirmer</label>
      <input className="f" value={confirm} onChange={e=>setConfirm(e.target.value.toUpperCase())}
        placeholder="REMISE A ZERO" style={{ letterSpacing:'.1em' }} />

      {err && (
        <div style={{ background:'#FFEBEE', border:'1px solid #FFCDD2', borderRadius:11,
          padding:'10px 13px', fontSize:12, color:'#C62828', marginTop:10,
          fontFamily:'Manrope,sans-serif' }}>{err}</div>
      )}

      <button className="b-danger" style={{ width:'100%', marginTop:16, padding:'14px' }}
        onClick={run} disabled={running || confirm !== 'REMISE A ZERO'}>
        {running ? 'Suppression en cours...' : 'Effacer les données sélectionnées'}
      </button>

      {/* Rapport */}
      {rapport && (
        <div style={{ background:'#fff', border:'1.5px solid #EFE6DC', borderRadius:16,
          padding:'16px 18px', marginTop:18 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#2E7D32', marginBottom:11 }}>
            ✓ {total} enregistrement{total>1?'s':''} supprimé{total>1?'s':''}
          </div>
          {Object.entries(rapport).filter(([,v]) => v !== 0).map(([t,v]) => (
            <div key={t} style={{ display:'flex', justifyContent:'space-between',
              fontSize:11.5, padding:'4px 0', color:'#8A7A74' }}>
              <span>{t}</span>
              <strong style={{ color: typeof v === 'number' ? '#1A1A1A' : '#C62828' }}>{v}</strong>
            </div>
          ))}
          <div style={{ fontSize:11.5, color:'#8A7A74', marginTop:12, paddingTop:11,
            borderTop:'1px solid #F2EDE8', lineHeight:1.6 }}>
            Rechargez les pages Caisse et Comptabilité pour voir les compteurs à zéro.
          </div>
        </div>
      )}
    </div>
  )
}
