'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { LoyaltyRule, RewardType } from '@/types'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }
const FDJ = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'

const CONDITION_TYPES = [
  { key:'nb_prestations', label:'Nombre de prestations' },
  { key:'montant_depense', label:'Montant dépensé' },
  { key:'anniversaire',   label:'Anniversaire' },
  { key:'premiere_visite', label:'Première visite' },
]
const REWARD_TYPES: { key: RewardType; label: string }[] = [
  { key:'reduction_pct',    label:'Réduction %' },
  { key:'reduction_fixe',   label:'Réduction fixe (FDJ)' },
  { key:'bon',              label:'Bon de réduction' },
  { key:'prestation_offerte', label:'Prestation offerte' },
]

const EMPTY_RULE: Partial<LoyaltyRule> = {
  nom:'', condition_type:'nb_prestations', condition_valeur:5,
  operateur:'ET', reward_type:'reduction_pct', reward_valeur:20,
  validite_jours:90, actif:true,
}

export default function LoyaltyPage() {
  const supabase = createClient()
  const [rules, setRules] = useState<LoyaltyRule[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<Partial<LoyaltyRule>>(EMPTY_RULE)
  const [saving, setSaving] = useState(false)
  const [touchups, setTouchups] = useState<{
    client_nom: string; client_prenom: string; client_tel: string;
    service_nom: string; retouche_avant: string; jours_restants: number
  }[]>([])

  async function load() {
    setLoading(true)
    const [rulesRes, touchupRes] = await Promise.all([
      supabase.from('loyalty_rules').select('*').order('created_at'),
      supabase.rpc('get_upcoming_touchups', { p_jours_ahead: 30 }),
    ])
    setRules((rulesRes.data as LoyaltyRule[]) || [])
    setTouchups((touchupRes.data as typeof touchups) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveRule() {
    if (!form.nom || !form.condition_type || !form.reward_type) return
    setSaving(true)
    await supabase.from('loyalty_rules').insert({
      nom:                form.nom,
      condition_type:     form.condition_type,
      condition_valeur:   form.condition_valeur,
      operateur:          form.operateur || 'ET',
      reward_type:        form.reward_type,
      reward_valeur:      form.reward_valeur,
      validite_jours:     form.validite_jours || null,
      actif:              true,
    })
    setAdding(false); setForm(EMPTY_RULE); load()
    setSaving(false)
  }

  async function toggleRule(id: string, actif: boolean) {
    await supabase.from('loyalty_rules').update({ actif }).eq('id', id)
    load()
  }

  async function deleteRule(id: string) {
    if (!confirm('Supprimer cette règle ?')) return
    await supabase.from('loyalty_rules').delete().eq('id', id)
    load()
  }

  function sendWATouchup(tel: string, prenom: string, service: string, date: string) {
    const msg = `Bonjour ${prenom},\n\nvotre retouche ADORÉA approche.\n\nPrestation : ${service}\nRetouche recommandée avant : ${new Date(date).toLocaleDateString('fr-FR')}\n\nVous pouvez réserver votre créneau dès maintenant.\n\n+253 77 59 61 59`
    window.open(`https://wa.me/${tel.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const condLabel = (k: string) => CONDITION_TYPES.find(c => c.key === k)?.label || k
  const rewardLabel = (k: string) => REWARD_TYPES.find(r => r.key === k)?.label || k

  return (
    <div style={{ padding:32, maxWidth:900 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300 }}>Fidélité & Retouches</h1>
        <button onClick={() => setAdding(true)} style={{
          padding:'10px 20px', borderRadius:4, border:'none', cursor:'pointer',
          background:T.black, color:T.offwhite, fontSize:12, fontWeight:600, fontFamily:'Manrope,sans-serif',
        }}>+ Nouvelle règle</button>
      </div>

      {loading ? (
        <div style={{ color:T.muted, fontSize:13 }}>Chargement...</div>
      ) : (
        <>
          {/* Règles fidélité */}
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.15em', color:T.muted, textTransform:'uppercase', marginBottom:16 }}>Règles de fidélité</div>
            {rules.length === 0 && <div style={{ padding:24, textAlign:'center', color:T.muted, fontSize:13, border:`1px dashed ${T.beige}`, borderRadius:6 }}>Aucune règle</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {rules.map(r => (
                <div key={r.id} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'16px 20px', background:'white', border:`1px solid ${r.actif ? T.beige : '#eee'}`, borderRadius:6,
                  opacity: r.actif ? 1 : 0.55,
                }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500, color:T.black, marginBottom:4 }}>{r.nom}</div>
                    <div style={{ fontSize:11, color:T.muted }}>
                      Si {condLabel(r.condition_type)} {r.condition_valeur ? `≥ ${r.condition_type === 'montant_depense' ? FDJ(r.condition_valeur) : r.condition_valeur}` : ''} → {rewardLabel(r.reward_type)} {r.reward_valeur ? (r.reward_type === 'reduction_pct' ? `${r.reward_valeur}%` : FDJ(r.reward_valeur)) : ''}
                      {r.validite_jours ? ` · ${r.validite_jours}j` : ''}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <div style={{
                      width:36, height:20, borderRadius:10, cursor:'pointer', position:'relative',
                      background: r.actif ? T.gold : T.beige, transition:'background 0.2s',
                    }} onClick={() => toggleRule(r.id, !r.actif)}>
                      <div style={{ width:14, height:14, borderRadius:7, background:'white', position:'absolute', top:3, left: r.actif ? 19 : 3, transition:'left 0.2s' }}/>
                    </div>
                    <button onClick={() => deleteRule(r.id)} style={{ padding:'5px 10px', borderRadius:4, border:`1px solid #F4433620`, background:'transparent', cursor:'pointer', fontSize:11, color:'#F44336', fontFamily:'Manrope,sans-serif' }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Retouches à relancer */}
          {touchups.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.15em', color:T.muted, textTransform:'uppercase', marginBottom:16 }}>
                Retouches PMU à relancer ({touchups.length})
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {touchups.map((tu, i) => (
                  <div key={i} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'14px 18px', background:'white', border:`1px solid ${tu.jours_restants <= 7 ? T.nude : T.beige}`, borderRadius:6,
                  }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500, color:T.black }}>{tu.client_prenom} {tu.client_nom}</div>
                      <div style={{ fontSize:11, color:T.muted }}>{tu.service_nom} · Retouche avant {new Date(tu.retouche_avant).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{
                        padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                        background: tu.jours_restants <= 7 ? '#FFF3E0' : T.offwhite,
                        color: tu.jours_restants <= 7 ? '#E6A817' : T.muted,
                      }}>J-{tu.jours_restants}</span>
                      <button onClick={() => sendWATouchup(tu.client_tel, tu.client_prenom, tu.service_nom, tu.retouche_avant)} style={{
                        padding:'7px 14px', borderRadius:4, border:'none', cursor:'pointer',
                        background:'#25D366', color:'white', fontSize:11, fontWeight:600, fontFamily:'Manrope,sans-serif',
                      }}>💬 Rappel</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal nouvelle règle */}
      {adding && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,26,26,0.65)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setAdding(false)}>
          <div style={{ background:T.offwhite, borderRadius:8, padding:36, width:460 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h3 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:24, fontWeight:300 }}>Nouvelle règle</h3>
              <button onClick={() => setAdding(false)} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:20, color:T.muted }}>×</button>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Nom de la règle *</label>
              <input value={form.nom || ''} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                placeholder="ex: 5 prestations = -20%"
                style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Condition</label>
                <select value={form.condition_type} onChange={e => setForm(p => ({ ...p, condition_type: e.target.value as LoyaltyRule['condition_type'] }))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:12, outline:'none', background:'white', color:T.black }}>
                  {CONDITION_TYPES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Valeur</label>
                <input type="number" value={form.condition_valeur || ''} onChange={e => setForm(p => ({ ...p, condition_valeur: Number(e.target.value) }))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Récompense</label>
                <select value={form.reward_type} onChange={e => setForm(p => ({ ...p, reward_type: e.target.value as RewardType }))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:12, outline:'none', background:'white', color:T.black }}>
                  {REWARD_TYPES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Valeur récompense</label>
                <input type="number" value={form.reward_valeur || ''} onChange={e => setForm(p => ({ ...p, reward_valeur: Number(e.target.value) }))}
                  style={{ width:'100%', padding:'10px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Validité (jours, vide = illimité)</label>
              <input type="number" value={form.validite_jours || ''} onChange={e => setForm(p => ({ ...p, validite_jours: Number(e.target.value) || undefined }))}
                style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
            </div>

            <button onClick={saveRule} disabled={saving || !form.nom} style={{
              width:'100%', padding:'13px', borderRadius:4, border:'none', cursor:saving ? 'default' : 'pointer',
              background: form.nom ? T.black : T.beige, color: form.nom ? T.offwhite : T.muted,
              fontSize:13, fontWeight:600, fontFamily:'Manrope,sans-serif',
            }}>{saving ? 'Enregistrement...' : 'Créer la règle'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
