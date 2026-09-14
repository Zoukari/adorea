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

    </div>
  )
}
