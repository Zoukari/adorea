'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { PromoCode, Service } from '@/types'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }
const FDJ = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'

const EMPTY: Partial<PromoCode> = {
  code:'', remise_pct:undefined, remise_fixe:undefined,
  montant_min:undefined, date_debut:'', date_fin:'',
  nb_utilisations_max:undefined, nb_par_cliente_max:undefined, actif:true,
}

export default function PromotionsPage() {
  const supabase = createClient()
  const [codes, setCodes]     = useState<PromoCode[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding]   = useState(false)
  const [form, setForm]       = useState<Partial<PromoCode & { service_id: string }>>(EMPTY)
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
      code:              form.code.toUpperCase(),
      remise_pct:        form.remise_pct || null,
      remise_fixe:       form.remise_fixe || null,
      montant_min:       form.montant_min || null,
      service_id:        (form as { service_id?: string }).service_id || null,
      date_debut:        form.date_debut || null,
      date_fin:          form.date_fin   || null,
      nb_utilisations_max: form.nb_utilisations_max || null,
      nb_par_cliente_max:  form.nb_par_cliente_max  || null,
      actif:             true,
    })
    setAdding(false); setForm(EMPTY); load()
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

  return (
    <div style={{ padding:32, maxWidth:900 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300 }}>Codes Promo</h1>
        <button onClick={() => setAdding(true)} style={{
          padding:'10px 20px', borderRadius:4, border:'none', cursor:'pointer',
          background:T.black, color:T.offwhite, fontSize:12, fontWeight:600, fontFamily:'Manrope,sans-serif',
        }}>+ Nouveau code</button>
      </div>

      {loading ? (
        <div style={{ color:T.muted, fontSize:13 }}>Chargement...</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {codes.length === 0 && <div style={{ padding:32, textAlign:'center', color:T.muted, fontSize:13 }}>Aucun code promo</div>}
          {codes.map(c => {
            const active = isActive(c)
            return (
              <div key={c.id} style={{
                display:'grid', gridTemplateColumns:'160px 1fr 1fr 80px 100px 100px',
                gap:12, padding:'14px 18px', background:'white',
                border:`1px solid ${active ? T.beige : '#eee'}`, borderRadius:6,
                alignItems:'center', opacity: active ? 1 : 0.5,
              }}>
                <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, fontWeight:300, letterSpacing:'0.05em', color:T.black }}>{c.code}</div>
                <div>
                  {c.remise_pct && <div style={{ fontSize:13, fontWeight:600, color:T.gold }}>-{c.remise_pct}%</div>}
                  {c.remise_fixe && <div style={{ fontSize:13, fontWeight:600, color:T.gold }}>-{FDJ(c.remise_fixe)}</div>}
                  {c.montant_min && <div style={{ fontSize:11, color:T.muted }}>Min : {FDJ(c.montant_min)}</div>}
                </div>
                <div style={{ fontSize:11, color:T.muted }}>
                  {c.date_debut && <div>Du {new Date(c.date_debut).toLocaleDateString('fr-FR')}</div>}
                  {c.date_fin   && <div>au {new Date(c.date_fin).toLocaleDateString('fr-FR')}</div>}
                </div>
                <div style={{ fontSize:12, color:T.muted, textAlign:'center' }}>
                  <div style={{ fontWeight:600, color:T.black }}>{c.nb_utilisations_actuel}</div>
                  <div style={{ fontSize:10 }}>{c.nb_utilisations_max ? `/ ${c.nb_utilisations_max}` : '∞'}</div>
                </div>
                <div style={{
                  padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600, textAlign:'center',
                  background: active ? '#E8F5E9' : '#F5F5F5',
                  color: active ? '#4CAF50' : T.muted,
                }}>{active ? 'Actif' : 'Inactif'}</div>
                <div style={{ display:'flex', gap:6 }}>
                  <div style={{
                    width:32, height:18, borderRadius:9, cursor:'pointer', position:'relative',
                    background: c.actif ? T.gold : T.beige, transition:'background 0.2s', flexShrink:0,
                  }} onClick={() => toggle(c.id, !c.actif)}>
                    <div style={{ width:12, height:12, borderRadius:6, background:'white', position:'absolute', top:3, left: c.actif ? 17 : 3, transition:'left 0.2s' }}/>
                  </div>
                  <button onClick={() => remove(c.id)} style={{ padding:'4px 8px', borderRadius:4, border:'none', cursor:'pointer', background:'transparent', fontSize:13, color:'#F44336' }}>×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {adding && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,26,26,0.65)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setAdding(false)}>
          <div style={{ background:T.offwhite, borderRadius:8, padding:36, width:460, maxHeight:'90vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:24, fontWeight:300 }}>Nouveau code promo</h3>
              <button onClick={() => setAdding(false)} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:20, color:T.muted }}>×</button>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Code *</label>
              <input value={form.code || ''} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="ADOREA10"
                style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Cormorant Garamond,serif', fontSize:18, fontWeight:300, letterSpacing:'0.08em', outline:'none', background:'white', color:T.black }} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Remise %</label>
                <input type="number" min={0} max={100} value={form.remise_pct || ''} onChange={e => setForm(p => ({ ...p, remise_pct: Number(e.target.value) || undefined }))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Remise FDJ</label>
                <input type="number" min={0} value={form.remise_fixe || ''} onChange={e => setForm(p => ({ ...p, remise_fixe: Number(e.target.value) || undefined }))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Date début</label>
                <input type="date" value={form.date_debut || ''} onChange={e => setForm(p => ({ ...p, date_debut: e.target.value }))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Date fin</label>
                <input type="date" value={form.date_fin || ''} onChange={e => setForm(p => ({ ...p, date_fin: e.target.value }))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Utilisations max</label>
                <input type="number" min={1} value={form.nb_utilisations_max || ''} onChange={e => setForm(p => ({ ...p, nb_utilisations_max: Number(e.target.value) || undefined }))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Par cliente max</label>
                <input type="number" min={1} value={form.nb_par_cliente_max || ''} onChange={e => setForm(p => ({ ...p, nb_par_cliente_max: Number(e.target.value) || undefined }))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Prestation spécifique (optionnel)</label>
              <select value={(form as { service_id?: string }).service_id || ''} onChange={e => setForm(p => ({ ...p, service_id: e.target.value }))}
                style={{ width:'100%', padding:'10px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white', color:T.black }}>
                <option value="">Toutes les prestations</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.nom_fr}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Montant minimum (FDJ)</label>
              <input type="number" min={0} value={form.montant_min || ''} onChange={e => setForm(p => ({ ...p, montant_min: Number(e.target.value) || undefined }))}
                style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
            </div>

            <button onClick={save} disabled={saving || !form.code} style={{
              width:'100%', padding:'13px', borderRadius:4, border:'none', cursor:saving ? 'default' : 'pointer',
              background: form.code ? T.black : T.beige, color: form.code ? T.offwhite : T.muted,
              fontSize:13, fontWeight:600, fontFamily:'Manrope,sans-serif',
            }}>{saving ? 'Création...' : 'Créer le code'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
