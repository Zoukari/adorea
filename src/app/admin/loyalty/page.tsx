'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { LoyaltyRule, RewardType, PromoCode, Service } from '@/types'

const T = { gold:'#C9A96A', black:'#1A1A1A', muted:'#8A7A74' }
const FDJ = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'

const CONDITION_TYPES = [
  { key:'nb_prestations',  label:'Nombre de prestations' },
  { key:'montant_depense', label:'Montant dépensé' },
  { key:'anniversaire',    label:'Anniversaire' },
  { key:'premiere_visite', label:'Première visite' },
]
const REWARD_TYPES: { key: RewardType; label: string }[] = [
  { key:'reduction_pct',      label:'Réduction %' },
  { key:'reduction_fixe',     label:'Réduction fixe (FDJ)' },
  { key:'bon',                label:'Bon de réduction' },
  { key:'prestation_offerte', label:'Prestation offerte' },
]
const EMPTY_RULE: Partial<LoyaltyRule> = {
  nom:'', condition_type:'nb_prestations', condition_valeur:5,
  operateur:'ET', reward_type:'reduction_pct', reward_valeur:20,
  validite_jours:90, actif:true,
}

interface PromoForm {
  code: string; remise_pct: string; remise_fixe: string; montant_min: string
  service_id: string; date_debut: string; date_fin: string
  nb_utilisations_max: string; nb_par_cliente_max: string
}
const EMPTY_PROMO: PromoForm = {
  code:'', remise_pct:'', remise_fixe:'', montant_min:'',
  service_id:'', date_debut:'', date_fin:'', nb_utilisations_max:'', nb_par_cliente_max:'',
}

type Touchup = {
  client_nom: string; client_prenom: string; client_tel: string
  service_nom: string; retouche_avant: string; jours_restants: number
}

export default function LoyaltyPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'regles'|'codes'|'retouches'>('regles')
  const [loading, setLoading] = useState(true)

  const [rules, setRules] = useState<LoyaltyRule[]>([])
  const [touchups, setTouchups] = useState<Touchup[]>([])
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [services, setServices] = useState<Service[]>([])

  const [ruleOpen, setRuleOpen] = useState(false)
  const [ruleForm, setRuleForm] = useState<Partial<LoyaltyRule>>(EMPTY_RULE)
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoForm, setPromoForm] = useState<PromoForm>(EMPTY_PROMO)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [r, t, c, s] = await Promise.all([
      supabase.from('loyalty_rules').select('*').order('created_at'),
      supabase.rpc('get_upcoming_touchups', { p_jours_ahead: 30 }),
      supabase.from('promo_codes').select('*').order('created_at', { ascending:false }),
      supabase.from('services').select('id,nom_fr').eq('actif', true).order('nom_fr'),
    ])
    setRules((r.data as LoyaltyRule[]) || [])
    setTouchups((t.data as Touchup[]) || [])
    setCodes((c.data as PromoCode[]) || [])
    setServices((s.data as Service[]) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  // ── Règles ──
  async function saveRule() {
    if (!ruleForm.nom) return
    setSaving(true)
    const payload = {
      nom: ruleForm.nom,
      condition_type: ruleForm.condition_type,
      condition_valeur: Number(ruleForm.condition_valeur || 0),
      operateur: ruleForm.operateur || 'ET',
      reward_type: ruleForm.reward_type,
      reward_valeur: Number(ruleForm.reward_valeur || 0),
      validite_jours: Number(ruleForm.validite_jours || 90),
      actif: ruleForm.actif ?? true,
    }
    if (ruleForm.id) await supabase.from('loyalty_rules').update(payload).eq('id', ruleForm.id)
    else await supabase.from('loyalty_rules').insert(payload)
    setSaving(false); setRuleOpen(false); setRuleForm(EMPTY_RULE); load()
  }
  async function delRule(id: string) {
    if (!confirm('Supprimer cette règle ?')) return
    await supabase.from('loyalty_rules').delete().eq('id', id); load()
  }

  // ── Codes promo ──
  async function savePromo() {
    if (!promoForm.code) return
    setSaving(true)
    await supabase.from('promo_codes').insert({
      code: promoForm.code.toUpperCase(),
      remise_pct:  promoForm.remise_pct  ? Number(promoForm.remise_pct)  : null,
      remise_fixe: promoForm.remise_fixe ? Number(promoForm.remise_fixe) : null,
      montant_min: promoForm.montant_min ? Number(promoForm.montant_min) : null,
      service_id:  promoForm.service_id  || null,
      date_debut:  promoForm.date_debut  || null,
      date_fin:    promoForm.date_fin    || null,
      nb_utilisations_max: promoForm.nb_utilisations_max ? Number(promoForm.nb_utilisations_max) : null,
      nb_par_cliente_max:  promoForm.nb_par_cliente_max  ? Number(promoForm.nb_par_cliente_max)  : null,
      actif: true,
    })
    setSaving(false); setPromoOpen(false); setPromoForm(EMPTY_PROMO); load()
  }
  async function delPromo(id: string) {
    if (!confirm('Supprimer ce code ?')) return
    await supabase.from('promo_codes').delete().eq('id', id); load()
  }

  const promoActive = (c: PromoCode) => {
    if (!c.actif) return false
    const now = new Date().toISOString().split('T')[0]
    if (c.date_fin && c.date_fin < now) return false
    if (c.nb_utilisations_max && c.nb_utilisations_actuel >= c.nb_utilisations_max) return false
    return true
  }

  return (
    <div className="pg" style={{ padding:'26px 26px 60px' }}>
      <div className="ph">
        <div>
          <h1>Fidélité &amp; Promos</h1>
          <div className="sub">
            {rules.length} règle{rules.length>1?'s':''} · {codes.length} code{codes.length>1?'s':''} · {touchups.length} retouche{touchups.length>1?'s':''} à venir
          </div>
        </div>
        {tab==='regles' && (
          <button className="b-gold" onClick={()=>{ setRuleForm(EMPTY_RULE); setRuleOpen(true) }}>+ Règle</button>
        )}
        {tab==='codes' && (
          <button className="b-gold" onClick={()=>{ setPromoForm(EMPTY_PROMO); setPromoOpen(true) }}>+ Code promo</button>
        )}
      </div>

      <div className="tabs">
        <button className={tab==='regles'?'on':''} onClick={()=>setTab('regles')}>Règles fidélité</button>
        <button className={tab==='codes'?'on':''} onClick={()=>setTab('codes')}>Codes promo</button>
        <button className={tab==='retouches'?'on':''} onClick={()=>setTab('retouches')}>
          Retouches PMU{touchups.length>0 && ` (${touchups.length})`}
        </button>
      </div>

      {loading ? (
        <div className="rows">{Array.from({length:4}).map((_,i)=><div key={i} className="skel" style={{height:60}}/>)}</div>
      ) : (
        <>
          {/* ══ RÈGLES ══ */}
          {tab==='regles' && (
            rules.length===0 ? <div className="empty">Aucune règle de fidélité.</div> : (
              <div className="rows">
                {rules.map(r=>(
                  <div key={r.id} className="row" style={{ gridTemplateColumns:'1fr auto auto', opacity:r.actif?1:.5 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:500, color:T.black }}>{r.nom}</div>
                      <div style={{ fontSize:11, color:T.muted, marginTop:3 }}>
                        {CONDITION_TYPES.find(c=>c.key===r.condition_type)?.label} ≥ {r.condition_valeur}
                        {' → '}
                        {REWARD_TYPES.find(t=>t.key===r.reward_type)?.label} : {r.reward_valeur}
                        {r.reward_type==='reduction_pct' ? '%' : r.reward_type==='reduction_fixe' ? ' FDJ' : ''}
                        {' · valide '}{r.validite_jours}j
                      </div>
                    </div>
                    <button className={`sw${r.actif?' on':''}`}
                      onClick={async()=>{ await supabase.from('loyalty_rules').update({actif:!r.actif}).eq('id',r.id); load() }} />
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="b-icon" onClick={()=>{ setRuleForm(r); setRuleOpen(true) }}>✎</button>
                      <button className="b-icon" style={{ color:'#D14343' }} onClick={()=>delRule(r.id)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ══ CODES ══ */}
          {tab==='codes' && (
            codes.length===0 ? <div className="empty">Aucun code promo.</div> : (
              <div className="rows">
                {codes.map(c=>{
                  const ok = promoActive(c)
                  return (
                    <div key={c.id} className="row"
                      style={{ gridTemplateColumns:'auto 1fr auto auto auto', opacity: ok?1:.5 }}>
                      <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, letterSpacing:'.05em', color:T.black, minWidth:90 }}>
                        {c.code}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:T.gold }}>
                          {c.remise_pct ? `−${c.remise_pct}%` : c.remise_fixe ? `−${FDJ(c.remise_fixe)}` : '—'}
                        </div>
                        <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
                          {c.montant_min && `Min ${FDJ(c.montant_min)} · `}
                          {c.date_fin && `Jusqu'au ${new Date(c.date_fin).toLocaleDateString('fr-FR')}`}
                        </div>
                      </div>
                      <div style={{ fontSize:12, color:T.muted, textAlign:'center' }}>
                        <div style={{ fontWeight:600, color:T.black }}>{c.nb_utilisations_actuel}</div>
                        <div style={{ fontSize:10 }}>{c.nb_utilisations_max ? `/ ${c.nb_utilisations_max}` : '∞'}</div>
                      </div>
                      <span className="badge" style={{
                        background: ok?'#E8F5E9':'#F5F5F5', color: ok?'#2E7D32':T.muted }}>
                        {ok?'Actif':'Inactif'}
                      </span>
                      <div style={{ display:'flex', gap:5 }}>
                        <button className={`sw${c.actif?' on':''}`}
                          onClick={async()=>{ await supabase.from('promo_codes').update({actif:!c.actif}).eq('id',c.id); load() }} />
                        <button className="b-icon" style={{ color:'#D14343' }} onClick={()=>delPromo(c.id)}>×</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {/* ══ RETOUCHES ══ */}
          {tab==='retouches' && (
            touchups.length===0 ? <div className="empty">Aucune retouche prévue dans les 30 jours.</div> : (
              <div className="rows">
                {touchups.map((t,i)=>(
                  <div key={i} className="row" style={{ gridTemplateColumns:'1fr auto auto' }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:500, color:T.black }}>
                        {t.client_prenom} {t.client_nom}
                      </div>
                      <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
                        {t.service_nom} · avant le {new Date(t.retouche_avant).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <span className="badge" style={{
                      background: t.jours_restants<=7 ? '#FDECEC' : '#FFF8E1',
                      color: t.jours_restants<=7 ? '#C62828' : '#B8860B' }}>
                      {t.jours_restants} j
                    </span>
                    <a className="b-ghost" href={`https://wa.me/${t.client_tel.replace(/\D/g,'')}`}
                      target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                      WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* ══ MODAL RÈGLE ══ */}
      {ruleOpen && (
        <div className="ovl" onClick={e=>e.target===e.currentTarget&&setRuleOpen(false)}>
          <div className="mdl">
            <div className="mdl-h">
              <h3>{ruleForm.id?'Modifier la règle':'Nouvelle règle'}</h3>
              <button className="b-icon" onClick={()=>setRuleOpen(false)}>×</button>
            </div>

            <label className="lbl">Nom *</label>
            <input className="f" value={ruleForm.nom||''}
              onChange={e=>setRuleForm(f=>({...f,nom:e.target.value}))}
              placeholder="5 prestations = 20% offert" />

            <div style={{ height:12 }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10 }}>
              <div>
                <label className="lbl">Condition</label>
                <select className="f" value={ruleForm.condition_type}
                  onChange={e=>setRuleForm(f=>({...f,condition_type:e.target.value as LoyaltyRule['condition_type']}))}>
                  {CONDITION_TYPES.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div style={{ width:100 }}>
                <label className="lbl">Seuil</label>
                <input className="f" type="number" value={ruleForm.condition_valeur||0}
                  onChange={e=>setRuleForm(f=>({...f,condition_valeur:Number(e.target.value)}))} />
              </div>
            </div>

            <div style={{ height:12 }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10 }}>
              <div>
                <label className="lbl">Récompense</label>
                <select className="f" value={ruleForm.reward_type}
                  onChange={e=>setRuleForm(f=>({...f,reward_type:e.target.value as RewardType}))}>
                  {REWARD_TYPES.map(r=><option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
              <div style={{ width:100 }}>
                <label className="lbl">Valeur</label>
                <input className="f" type="number" value={ruleForm.reward_valeur||0}
                  onChange={e=>setRuleForm(f=>({...f,reward_valeur:Number(e.target.value)}))} />
              </div>
            </div>

            <div style={{ height:12 }}/>
            <label className="lbl">Validité (jours)</label>
            <input className="f" type="number" value={ruleForm.validite_jours||90}
              onChange={e=>setRuleForm(f=>({...f,validite_jours:Number(e.target.value)}))} />

            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginTop:16 }}>
              <button className={`sw${ruleForm.actif?' on':''}`} type="button"
                onClick={()=>setRuleForm(f=>({...f,actif:!f.actif}))} />
              <span style={{ fontSize:13 }}>Règle active</span>
            </label>

            <div style={{ display:'flex', gap:9, marginTop:20 }}>
              <button className="b-ghost" onClick={()=>setRuleOpen(false)}>Annuler</button>
              <button className="b-primary" style={{flex:1}} onClick={saveRule} disabled={saving||!ruleForm.nom}>
                {saving?'Enregistrement...':ruleForm.id?'Enregistrer':'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL CODE PROMO ══ */}
      {promoOpen && (
        <div className="ovl" onClick={e=>e.target===e.currentTarget&&setPromoOpen(false)}>
          <div className="mdl">
            <div className="mdl-h">
              <h3>Nouveau code promo</h3>
              <button className="b-icon" onClick={()=>setPromoOpen(false)}>×</button>
            </div>

            <label className="lbl">Code *</label>
            <input className="f" value={promoForm.code}
              onChange={e=>setPromoForm(f=>({...f,code:e.target.value.toUpperCase()}))}
              placeholder="BIENVENUE20" />

            <div style={{ height:12 }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label className="lbl">Remise %</label>
                <input className="f" type="number" value={promoForm.remise_pct}
                  onChange={e=>setPromoForm(f=>({...f,remise_pct:e.target.value}))} />
              </div>
              <div>
                <label className="lbl">Remise FDJ</label>
                <input className="f" type="number" value={promoForm.remise_fixe}
                  onChange={e=>setPromoForm(f=>({...f,remise_fixe:e.target.value}))} />
              </div>
            </div>

            <div style={{ height:12 }}/>
            <label className="lbl">Montant minimum (FDJ)</label>
            <input className="f" type="number" value={promoForm.montant_min}
              onChange={e=>setPromoForm(f=>({...f,montant_min:e.target.value}))} />

            <div style={{ height:12 }}/>
            <label className="lbl">Prestation ciblée</label>
            <select className="f" value={promoForm.service_id}
              onChange={e=>setPromoForm(f=>({...f,service_id:e.target.value}))}>
              <option value="">Toutes les prestations</option>
              {services.map(s=><option key={s.id} value={s.id}>{s.nom_fr}</option>)}
            </select>

            <div style={{ height:12 }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label className="lbl">Début</label>
                <input className="f" type="date" value={promoForm.date_debut}
                  onChange={e=>setPromoForm(f=>({...f,date_debut:e.target.value}))} />
              </div>
              <div>
                <label className="lbl">Fin</label>
                <input className="f" type="date" value={promoForm.date_fin}
                  onChange={e=>setPromoForm(f=>({...f,date_fin:e.target.value}))} />
              </div>
            </div>

            <div style={{ height:12 }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label className="lbl">Utilisations max</label>
                <input className="f" type="number" value={promoForm.nb_utilisations_max}
                  onChange={e=>setPromoForm(f=>({...f,nb_utilisations_max:e.target.value}))} />
              </div>
              <div>
                <label className="lbl">Par cliente max</label>
                <input className="f" type="number" value={promoForm.nb_par_cliente_max}
                  onChange={e=>setPromoForm(f=>({...f,nb_par_cliente_max:e.target.value}))} />
              </div>
            </div>

            <div style={{ display:'flex', gap:9, marginTop:20 }}>
              <button className="b-ghost" onClick={()=>setPromoOpen(false)}>Annuler</button>
              <button className="b-primary" style={{flex:1}} onClick={savePromo} disabled={saving||!promoForm.code}>
                {saving?'Création...':'Créer le code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
