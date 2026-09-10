'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Service, Category, Promotion } from '@/types'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }
const FDJ = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'

export default function ServicesPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<(Service & { category?: Category; promotion?: Promotion | null })[]>([])
  const [promotions, setPromos] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'services' | 'promos'>('services')
  const [editing, setEditing] = useState<Service | null>(null)
  const [addingPromo, setAddingPromo] = useState(false)
  const [promoForm, setPromoForm] = useState({
    service_id: '', nom: '', remise_pct: '', remise_fixe: '',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '', actif: true,
  })

  async function load() {
    setLoading(true)
    const [catRes, srvRes, promoRes] = await Promise.all([
      supabase.from('categories').select('*').order('ordre'),
      supabase.from('services').select('*, category:categories(*), promotion:promotions(*)').order('ordre'),
      supabase.from('promotions').select('*, service:services(nom_fr)').order('created_at', { ascending: false }),
    ])
    setCategories((catRes.data as Category[]) || [])
    setServices((srvRes.data as (Service & { category?: Category; promotion?: Promotion | null })[]) || [])
    setPromos((promoRes.data as Promotion[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateService(id: string, updates: Partial<Service>) {
    await supabase.from('services').update(updates).eq('id', id)
    load(); setEditing(null)
  }

  async function savePromo() {
    await supabase.from('promotions').insert({
      service_id:    promoForm.service_id || null,
      nom:           promoForm.nom,
      remise_pct:    promoForm.remise_pct ? Number(promoForm.remise_pct) : null,
      remise_fixe:   promoForm.remise_fixe ? Number(promoForm.remise_fixe) : null,
      date_debut:    promoForm.date_debut,
      date_fin:      promoForm.date_fin,
      actif:         true,
    })
    setAddingPromo(false)
    setPromoForm({ service_id:'', nom:'', remise_pct:'', remise_fixe:'', date_debut: new Date().toISOString().split('T')[0], date_fin:'', actif:true })
    load()
  }

  async function togglePromo(id: string, actif: boolean) {
    await supabase.from('promotions').update({ actif }).eq('id', id)
    load()
  }

  const grouped = categories.map(cat => ({
    cat,
    items: services.filter(s => s.category_id === cat.id),
  }))

  return (
    <div style={{ padding:32, maxWidth:900 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300 }}>
          {tab === 'services' ? 'Prestations' : 'Promotions'}
        </h1>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ display:'flex', gap:4, background:T.beige, borderRadius:6, padding:4 }}>
            {(['services','promos'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding:'7px 14px', borderRadius:4, border:'none', cursor:'pointer', fontSize:12, fontWeight:500,
                background: tab === t ? T.black : 'transparent', color: tab === t ? T.offwhite : T.muted, fontFamily:'Manrope,sans-serif',
              }}>{t === 'services' ? 'Prestations' : 'Promos'}</button>
            ))}
          </div>
          {tab === 'promos' && (
            <button onClick={() => setAddingPromo(true)} style={{ padding:'9px 18px', borderRadius:4, border:'none', cursor:'pointer', background:T.black, color:T.offwhite, fontSize:12, fontWeight:600, fontFamily:'Manrope,sans-serif' }}>+ Promo</button>
          )}
        </div>
      </div>

      {loading ? <div style={{ color:T.muted, fontSize:13 }}>Chargement...</div> : (
        <>
          {/* SERVICES */}
          {tab === 'services' && grouped.map(({ cat, items }) => (
            <div key={cat.id} style={{ marginBottom:28 }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.15em', color:T.gold, textTransform:'uppercase', marginBottom:12 }}>{cat.nom_fr}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {items.map(sv => (
                  <div key={sv.id} style={{
                    display:'grid', gridTemplateColumns:'1fr 120px 80px 80px 80px',
                    gap:12, padding:'13px 16px', background:'white', border:`1px solid ${T.beige}`, borderRadius:6, alignItems:'center',
                  }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500, color:T.black }}>{sv.nom_fr}</div>
                      <div style={{ fontSize:11, color:T.muted }}>{sv.duree_minutes} min</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:T.gold }}>{sv.prix_sur_devis ? 'Sur devis' : FDJ(sv.prix)}</div>
                    <div style={{ fontSize:11, color: sv.is_pmu ? T.nude : T.muted }}>{sv.is_pmu ? 'PMU' : ''}</div>
                    <div style={{
                      width:32, height:18, borderRadius:9, cursor:'pointer', position:'relative',
                      background: sv.actif ? T.gold : T.beige, transition:'background 0.2s',
                    }} onClick={() => updateService(sv.id, { actif: !sv.actif })}>
                      <div style={{ width:12, height:12, borderRadius:6, background:'white', position:'absolute', top:3, left: sv.actif ? 17 : 3, transition:'left 0.2s' }}/>
                    </div>
                    <button onClick={() => setEditing(sv)} style={{ padding:'5px 10px', borderRadius:4, border:`1px solid ${T.beige}`, background:'white', cursor:'pointer', fontSize:11, color:T.muted, fontFamily:'Manrope,sans-serif' }}>Éditer</button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* PROMOS */}
          {tab === 'promos' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {promotions.length === 0 && <div style={{ padding:32, textAlign:'center', color:T.muted, fontSize:13 }}>Aucune promotion</div>}
              {promotions.map(p => (
                <div key={p.id} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'14px 18px', background:'white', border:`1px solid ${p.actif ? T.nude : T.beige}`, borderRadius:6, opacity: p.actif ? 1 : 0.55,
                }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:T.black }}>{p.nom}</div>
                    <div style={{ fontSize:11, color:T.muted }}>
                      {p.remise_pct ? `-${p.remise_pct}%` : ''}{p.remise_fixe ? `-${FDJ(p.remise_fixe)}` : ''} · {p.date_debut} → {p.date_fin}
                    </div>
                  </div>
                  <div style={{
                    width:36, height:20, borderRadius:10, cursor:'pointer', position:'relative',
                    background: p.actif ? T.gold : T.beige,
                  }} onClick={() => togglePromo(p.id, !p.actif)}>
                    <div style={{ width:14, height:14, borderRadius:7, background:'white', position:'absolute', top:3, left: p.actif ? 19 : 3, transition:'left 0.2s' }}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Edit service modal */}
      {editing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,26,26,0.65)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setEditing(null)}>
          <div style={{ background:T.offwhite, borderRadius:8, padding:32, width:420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, fontWeight:300 }}>{editing.nom_fr}</h3>
              <button onClick={() => setEditing(null)} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:20, color:T.muted }}>×</button>
            </div>
            {[
              { key:'prix', label:'Prix (FDJ)', type:'number' },
              { key:'duree_minutes', label:'Durée (min)', type:'number' },
              { key:'buffer_minutes', label:'Buffer (min)', type:'number' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>{f.label}</label>
                <input type={f.type}
                  defaultValue={(editing as unknown as Record<string, number>)[f.key]}
                  id={`edit-${f.key}`}
                  style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
            ))}
            <button onClick={() => {
              const updates: Partial<Service> = {}
              const prix = (document.getElementById('edit-prix') as HTMLInputElement)?.value
              const duree = (document.getElementById('edit-duree_minutes') as HTMLInputElement)?.value
              const buffer = (document.getElementById('edit-buffer_minutes') as HTMLInputElement)?.value
              if (prix) updates.prix = Number(prix)
              if (duree) updates.duree_minutes = Number(duree)
              if (buffer) updates.buffer_minutes = Number(buffer)
              updateService(editing.id, updates)
            }} style={{ width:'100%', padding:'12px', borderRadius:4, border:'none', cursor:'pointer', background:T.black, color:T.offwhite, fontSize:13, fontWeight:600, fontFamily:'Manrope,sans-serif' }}>
              Sauvegarder
            </button>
          </div>
        </div>
      )}

      {/* Add promo modal */}
      {addingPromo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,26,26,0.65)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setAddingPromo(false)}>
          <div style={{ background:T.offwhite, borderRadius:8, padding:32, width:420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, fontWeight:300 }}>Nouvelle promotion</h3>
              <button onClick={() => setAddingPromo(false)} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:20, color:T.muted }}>×</button>
            </div>
            {[
              { key:'nom', label:'Nom *', type:'text' },
              { key:'remise_pct', label:'Remise % (ou laisser vide)', type:'number' },
              { key:'remise_fixe', label:'Remise fixe FDJ (ou laisser vide)', type:'number' },
              { key:'date_debut', label:'Date début *', type:'date' },
              { key:'date_fin', label:'Date fin *', type:'date' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:12 }}>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:5 }}>{f.label}</label>
                <input type={f.type} value={(promoForm as Record<string, string>)[f.key] || ''} onChange={e => setPromoForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width:'100%', padding:'9px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
            ))}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:5 }}>Prestation (optionnel)</label>
              <select value={promoForm.service_id} onChange={e => setPromoForm(p => ({ ...p, service_id: e.target.value }))}
                style={{ width:'100%', padding:'9px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white', color:T.black }}>
                <option value="">Toutes les prestations</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.nom_fr}</option>)}
              </select>
            </div>
            <button onClick={savePromo} style={{ width:'100%', padding:'12px', borderRadius:4, border:'none', cursor:'pointer', background:T.black, color:T.offwhite, fontSize:13, fontWeight:600, fontFamily:'Manrope,sans-serif' }}>
              Créer la promotion
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
