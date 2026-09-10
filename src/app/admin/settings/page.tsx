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
  { key:'wa_enabled',          label:'WhatsApp activé' },
  { key:'wa_paiements',        label:'WA paiements' },
  { key:'wa_validation_sante', label:'WA validation santé' },
  { key:'wa_rappels',          label:'WA rappels RDV' },
  { key:'wa_bouton_flottant',  label:'Bouton flottant WA' },
  { key:'wa_reservation',      label:'WA réservation' },
  { key:'wa_retouches',        label:'WA retouches' },
  { key:'wa_fidelite',         label:'WA fidélité' },
]

export default function SettingsPage() {
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
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
        <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300 }}>Paramètres</h1>
        <button onClick={save} style={{
          padding:'10px 24px', borderRadius:4, border:'none', cursor:'pointer',
          background: saved ? '#4CAF50' : T.black, color:T.offwhite,
          fontSize:12, fontWeight:600, fontFamily:'Manrope,sans-serif', transition:'background 0.2s',
        }}>{saved ? '✓ Sauvegardé' : 'Sauvegarder'}</button>
      </div>

      {/* Toggles WhatsApp */}
      <div style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:8, padding:24, marginBottom:24 }}>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.15em', color:T.muted, textTransform:'uppercase', marginBottom:16 }}>WhatsApp — Activations</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {WA_TOGGLES.map(t => (
            <div key={t.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:T.black }}>{t.label}</span>
              <div style={{
                width:44, height:24, borderRadius:12, cursor:'pointer', position:'relative',
                background: settings[t.key] === 'true' ? T.gold : T.beige, transition:'background 0.2s',
              }} onClick={() => set(t.key, settings[t.key] === 'true' ? 'false' : 'true')}>
                <div style={{
                  width:18, height:18, borderRadius:9, background:'white', position:'absolute',
                  top:3, transition:'left 0.2s',
                  left: settings[t.key] === 'true' ? 23 : 3,
                  boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sections paramètres */}
      {SECTIONS.map(section => (
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

      {/* Clôture de caisse */}
      <CashClosingSection />
    </div>
  )
}

function CashClosingSection() {
  const supabase = createClient()
  const T2 = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }
  const FDJ2 = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'
  const [cashReel, setCashReel] = useState('')
  const [cashTheo, setCashTheo] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    // Calculer le cash théorique du jour
    supabase.from('appointments').select('prix_final').eq('date_rdv', today).eq('statut','terminee').eq('payment_method','cash')
      .then(({ data }) => setCashTheo((data || []).reduce((s: number, e: { prix_final: number }) => s + e.prix_final, 0)))
  }, [])

  async function cloturer() {
    if (!cashReel) return
    setSaving(true)
    await supabase.from('cash_closings').upsert({
      date_cloture:   today,
      cash_theorique: cashTheo || 0,
      cash_reel:      Number(cashReel),
      commentaire:    comment || null,
    }, { onConflict: 'date_cloture' })
    setDone(true); setSaving(false)
  }

  return (
    <div style={{ background:'white', border:`1px solid ${T2.beige}`, borderRadius:8, padding:24 }}>
      <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.15em', color:T2.muted, textTransform:'uppercase', marginBottom:16 }}>
        Clôture de caisse — Aujourd&apos;hui
      </div>
      {done ? (
        <div style={{ padding:20, textAlign:'center', color:'#4CAF50', fontWeight:600, fontSize:14 }}>✓ Clôture enregistrée</div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div style={{ padding:'14px 16px', background:T2.offwhite, borderRadius:4 }}>
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T2.muted, textTransform:'uppercase', marginBottom:4 }}>Cash théorique</div>
              <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, fontWeight:300, color:T2.black }}>{cashTheo !== null ? FDJ2(cashTheo) : '...'}</div>
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T2.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Cash réel (FDJ)</label>
              <input type="number" value={cashReel} onChange={e => setCashReel(e.target.value)} placeholder="Montant compté..."
                style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T2.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none' }} />
            </div>
          </div>
          {cashReel && cashTheo !== null && (
            <div style={{
              padding:'10px 14px', borderRadius:4, marginBottom:14,
              background: Number(cashReel) === cashTheo ? '#F1FFF1' : '#FFF5F5',
              color: Number(cashReel) === cashTheo ? '#4CAF50' : '#F44336',
              fontSize:13, fontWeight:600,
            }}>
              Écart : {FDJ2(Number(cashReel) - cashTheo)}
            </div>
          )}
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Commentaire optionnel..."
            style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T2.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, resize:'vertical', minHeight:60, outline:'none', marginBottom:14 }} />
          <button onClick={cloturer} disabled={saving || !cashReel} style={{
            width:'100%', padding:'12px', borderRadius:4, border:'none', cursor:'pointer',
            background: cashReel ? T2.black : T2.beige, color: cashReel ? T2.offwhite : T2.muted,
            fontSize:13, fontWeight:600, fontFamily:'Manrope,sans-serif',
          }}>{saving ? 'Enregistrement...' : 'Clôturer la caisse'}</button>
        </>
      )}
    </div>
  )
}
