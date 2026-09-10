'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { PromoCode, Service } from '@/types'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }
const FDJ = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'

interface PromoForm {
  code: string
  remise_pct: string
  remise_fixe: string
  montant_min: string
  service_id: string
  date_debut: string
  date_fin: string
  nb_utilisations_max: string
  nb_par_cliente_max: string
}

const EMPTY_FORM: PromoForm = {
  code: '', remise_pct: '', remise_fixe: '', montant_min: '',
  service_id: '', date_debut: '', date_fin: '',
  nb_utilisations_max: '', nb_par_cliente_max: '',
}

export default function PromotionsPage() {
  const supabase = createClient()
  const [codes, setCodes]     = useState<PromoCode[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding]   = useState(false)
  const [form, setForm]       = useState<PromoForm>(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)

  async function load() {
    setLoading(true)
    const [codesRes, srvRes] = await Promise.all([
      supabase.from('promo_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('services').select('id,nom_fr').eq('actif', true).order('nom_fr'),
    ])
    setCodes((codesRes.data as PromoCode[]) || [])
    setServices((srvRes.data as Service[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    if (!form.code) return
    setSaving(true)
    await supabase.from('promo_codes').insert({
      code:               form.code.toUpperCase(),
      remise_pct:         form.remise_pct    ? Number(form.remise_pct)    : null,
      remise_fixe:        form.remise_fixe   ? Number(form.remise_fixe)   : null,
      montant_min:        form.montant_min   ? Number(form.montant_min)   : null,
      service_id:         form.service_id    || null,
      date_debut:         form.date_debut    || null,
      date_fin:           form.date_fin      || null,
      nb_utilisations_max: form.nb_utilisations_max ? Number(form.nb_utilisations_max) : null,
      nb_par_cliente_max:  form.nb_par_cliente_max  ? Number(form.nb_par_cliente_max)  : null,
      actif: true,
    })
    setAdding(false); setForm(EMPTY_FORM); load()
    setSaving(false)
  }

  async function toggle(id: string, actif: boolean) {
    await supabase.from('promo_codes').update({ actif }).eq('id', id); load()
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce code ?')) return
    await supabase.from('promo_codes').delete().eq('id', id); load()
  }

  const isActive = (c: PromoCode) => {
    if (!c.actif) return false
    const now = new Date().toISOString().split('T')[0]
    if (c.date_fin && c.date_fin < now) return false
    if (c.nb_utilisations_max && c.nb_utilisations_actuel >= c.nb_utilisations_max) return false
    return true
  }

  function setF(key: keyof PromoForm, val: string) {
    setForm(p => ({ ...p, [key]: val }))
  }

  return (
    <div style={{ padding:32, maxWidth:900 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300 }}>Codes Promo</h1>
        <button onClick={() => setAdding(true)} style={{ padding:'10px 20px', borderRadius:100, border:'none', cursor:'pointer', background:T.black, color:T.offwhite, fontSize:12, fontWeight:600, fontFamily:'Manrope,sans-serif', letterSpacing:'0.08em' }}>
          + Nouveau code
        </button>
      </div>

      {loading ? (
        <div style={{ color:T.muted, fontSize:13 }}>Chargement...</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {codes.length === 0 && <div style={{ padding:32, textAlign:'center', color:T.muted, fontSize:13 }}>Aucun code promo</div>}
          {codes.map(c => {
            const active = isActive(c)
            return (
              <div key={c.id} style={{ display:'grid', gridTemplateColumns:'160px 1fr 1fr 80px 100px 100px', gap:12, padding:'14px 18px', background:'white', border:`1px solid ${active ? T.beige : '#eee'}`, borderRadius:16, alignItems:'center', opacity: active ? 1 : 0.5 }}>
                <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, fontWeight:300, letterSpacing:'0.05em', color:T.black }}>{c.code}</div>
                <div>
                  {c.remise_pct   && <div style={{ fontSize:13, fontWeight:600, color:T.gold }}>-{c.remise_pct}%</div>}
                  {c.remise_fixe  && <div style={{ fontSize:13, fontWeight:600, color:T.gold }}>-{FDJ(c.remise_fixe)}</div>}
                  {c.montant_min  && <div style={{ fontSize:11, color:T.muted }}>Min : {FDJ(c.montant_min)}</div>}
                </div>
                <div style={{ fontSize:11, color:T.muted }}>
                  {c.date_debut && <div>Du {new Date(c.date_debut).toLocaleDateString('fr-FR')}</div>}
                  {c.date_fin   && <div>au {new Date(c.date_fin).toLocaleDateString('fr-FR')}</div>}
                </div>
                <div style={{ fontSize:12, color:T.muted, textAlign:'center' }}>
                  <div style={{ fontWeight:600, color:T.black }}>{c.nb_utilisations_actuel}</div>
                  <div style={{ fontSize:10 }}>{c.nb_utilisations_max ? `/ ${c.nb_utilisations_max}` : '∞'}</div>
                </div>
                <div style={{ padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600, textAlign:'center', background: active ? '#E8F5E9' : '#F5F5F5', color: active ? '#4CAF50' : T.muted }}>
                  {active ? 'Actif' : 'Inactif'}
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <div style={{ width:32, height:18, borderRadius:9, cursor:'pointer', position:'relative', background: c.actif ? T.gold : T.beige, transition:'background 0.2s', flexShrink:0 }}
                    onClick={() => toggle(c.id, !c.actif)}>
                    <div style={{ width:12, height:12, borderRadius:6, background:'white', position:'absolute', top:3, left: c.actif ? 17 : 3, transition:'left 0.2s' }}/>
                  </div>
                  <button onClick={() => remove(c.id)} style={{ padding:'4px 8px', borderRadius:8, border:'none', cursor:'pointer', background:'transparent', fontSize:13, color:'#F44336' }}>×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {adding && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,26,26,0.65)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setAdding(false)}>
          <div style={{ background:T.offwhite, borderRadius:24, padding:36, width:460, maxHeight:'90vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:24, fontWeight:300 }}>Nouveau code promo</h3>
              <button onClick={() => setAdding(false)} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:20, color:T.muted }}>×</button>
            </div>

            {([
              { key:'code' as const,          label:'Code *',              type:'text' },
              { key:'remise_pct' as const,     label:'Remise %',            type:'number' },
              { key:'remise_fixe' as const,    label:'Remise FDJ',          type:'number' },
              { key:'montant_min' as const,    label:'Montant minimum FDJ', type:'number' },
              { key:'date_debut' as const,     label:'Date début',          type:'date' },
              { key:'date_fin' as const,       label:'Date fin',            type:'date' },
              { key:'nb_utilisations_max' as const, label:'Utilisations max', type:'number' },
              { key:'nb_par_cliente_max' as const,  label:'Par cliente max',  type:'number' },
            ] as const).map(f => (
              <div key={f.key} style={{ marginBottom:12 }}>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:5 }}>{f.label}</label>
                <input type={f.type} value={form[f.key]}
                  onChange={e => setF(f.key, f.key === 'code' ? e.target.value.toUpperCase() : e.target.value)}
                  style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${T.beige}`, borderRadius:12, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white', color:T.black }} />
              </div>
            ))}

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:5 }}>Prestation (optionnel)</label>
              <select value={form.service_id} onChange={e => setF('service_id', e.target.value)}
                style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${T.beige}`, borderRadius:12, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white', color:T.black }}>
                <option value="">Toutes les prestations</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.nom_fr}</option>)}
              </select>
            </div>

            <button onClick={save} disabled={saving || !form.code} style={{ width:'100%', padding:'13px', borderRadius:100, border:'none', cursor: form.code ? 'pointer' : 'not-allowed', background: form.code ? T.black : T.beige, color: form.code ? T.offwhite : T.muted, fontSize:12, fontWeight:600, fontFamily:'Manrope,sans-serif', letterSpacing:'0.1em' }}>
              {saving ? 'Création...' : 'Créer le code'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
