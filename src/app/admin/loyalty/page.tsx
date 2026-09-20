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
  id?: string
  code: string
  auto_apply: boolean
  mode: 'pct' | 'fixe' | 'prix'   // prix = nouveau prix direct
  remise_pct: string
  remise_fixe: string
  nouveau_prix: string              // prix final voulu
  montant_min: string
  service_ids: string[]
  date_debut: string
  date_fin: string
  date_fin_heure: string            // HH:MM
  auto_repeat: boolean
  duree_heures: string
  afficher_site: boolean
  nb_utilisations_max: string
  nb_par_cliente_max: string
}
const EMPTY_PROMO: PromoForm = {
  code:'', auto_apply:true, mode:'pct', remise_pct:'', remise_fixe:'', nouveau_prix:'', montant_min:'',
  service_ids:[], date_debut:'', date_fin:'', date_fin_heure:'23:59',
  auto_repeat:false, duree_heures:'24', afficher_site:true,
  nb_utilisations_max:'', nb_par_cliente_max:'',
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
    if (!promoForm.auto_apply && !promoForm.code) return
    setSaving(true)

    // Une promo automatique reçoit un code interne unique, jamais montré aux clientes
    const codeFinal = promoForm.auto_apply
      ? 'AUTO-' + Date.now().toString(36).toUpperCase()
      : promoForm.code.toUpperCase()

    // Calcul des remises selon le mode
    let remise_pct: number|null = null
    let remise_fixe: number|null = null

    if (promoForm.mode === 'pct' && promoForm.remise_pct) {
      remise_pct = Number(promoForm.remise_pct)
    } else if (promoForm.mode === 'fixe' && promoForm.remise_fixe) {
      remise_fixe = Number(promoForm.remise_fixe)
    } else if (promoForm.mode === 'prix' && promoForm.nouveau_prix && promoForm.service_ids.length) {
      const svc = services.find(sv => sv.id === promoForm.service_ids[0])
      if (svc && !svc.prix_sur_devis) {
        remise_fixe = Math.max(0, Number(svc.prix||0) - Number(promoForm.nouveau_prix))
      }
    }

    // Date de fin avec heure
    let date_fin_heure: string|null = null
    if (promoForm.date_fin) {
      const h = promoForm.date_fin_heure || '23:59'
      date_fin_heure = new Date(`${promoForm.date_fin}T${h}:00`).toISOString()
    }

    // Colonnes de base, toujours présentes
    const base: Record<string, unknown> = {
      code: codeFinal,
      remise_pct, remise_fixe,
      montant_min: promoForm.montant_min ? Number(promoForm.montant_min) : null,
      service_id:  promoForm.service_ids.length === 1 ? promoForm.service_ids[0] : null,
      date_debut:  promoForm.date_debut  || null,
      date_fin:    promoForm.date_fin    || null,
      nb_utilisations_max: promoForm.nb_utilisations_max ? Number(promoForm.nb_utilisations_max) : null,
      nb_par_cliente_max:  promoForm.nb_par_cliente_max  ? Number(promoForm.nb_par_cliente_max)  : null,
      actif: true,
    }
    // Colonnes ajoutées par la migration 08
    const extra: Record<string, unknown> = {
      auto_apply: promoForm.auto_apply,
      service_ids: promoForm.service_ids.length ? promoForm.service_ids : null,
      date_fin_heure,
      auto_repeat:  promoForm.auto_repeat,
      duree_heures: promoForm.auto_repeat && promoForm.duree_heures ? Number(promoForm.duree_heures) : null,
      afficher_site: promoForm.afficher_site,
    }

    const write = (payload: Record<string, unknown>) =>
      promoForm.id
        ? supabase.from('promo_codes').update(payload).eq('id', promoForm.id)
        : supabase.from('promo_codes').insert(payload)

    let { error } = await write({ ...base, ...extra })

    if (error && /column .* does not exist/i.test(error.message)) {
      const retry = await write(base)
      error = retry.error
      if (!error) {
        alert("Promo créée.\n\nLe compte à rebours et l'affichage sur le site nécessitent la migration 08 (SQL Editor Supabase).")
      }
    }

    if (error) { alert('Erreur : ' + error.message); setSaving(false); return }

    setSaving(false); setPromoOpen(false); setPromoForm(EMPTY_PROMO); load()
  }
  function editPromo(c: PromoCode) {
    const rec = c as unknown as Record<string, unknown>
    const fin = rec.date_fin_heure ? new Date(String(rec.date_fin_heure)) : null
    const ids = Array.isArray(rec.service_ids) && (rec.service_ids as string[]).length
      ? rec.service_ids as string[]
      : (c.service_id ? [c.service_id] : [])
    const auto = rec.auto_apply !== false
    setPromoForm({
      id: c.id,
      code: auto ? '' : c.code,
      auto_apply: auto,
      mode: c.remise_pct ? 'pct' : 'fixe',
      remise_pct:  c.remise_pct  ? String(c.remise_pct)  : '',
      remise_fixe: c.remise_fixe ? String(c.remise_fixe) : '',
      nouveau_prix: '',
      montant_min: c.montant_min ? String(c.montant_min) : '',
      service_ids: ids,
      date_debut: c.date_debut || '',
      date_fin:   c.date_fin   || '',
      date_fin_heure: fin
        ? `${String(fin.getHours()).padStart(2,'0')}:${String(fin.getMinutes()).padStart(2,'0')}`
        : '23:59',
      auto_repeat:   !!rec.auto_repeat,
      duree_heures:  rec.duree_heures ? String(rec.duree_heures) : '24',
      afficher_site: rec.afficher_site !== false,
      nb_utilisations_max: c.nb_utilisations_max ? String(c.nb_utilisations_max) : '',
      nb_par_cliente_max:  c.nb_par_cliente_max  ? String(c.nb_par_cliente_max)  : '',
    })
    setPromoOpen(true)
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
                      <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                        <button className={`sw${c.actif?' on':''}`}
                          onClick={async()=>{ await supabase.from('promo_codes').update({actif:!c.actif}).eq('id',c.id); load() }} />
                        <button className="b-icon" onClick={()=>editPromo(c)}>✎</button>
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
          <div className="mdl" style={{ maxHeight:'90svh', overflowY:'auto' }}>
            <div className="mdl-h">
              <h3>{promoForm.id ? 'Modifier la promo' : 'Nouvelle promotion'}</h3>
              <button className="b-icon" onClick={()=>setPromoOpen(false)}>×</button>
            </div>

            {/* Code */}
            <div style={{ background:'#FBF5EC', border:'1.5px solid #E8D5B0', borderRadius:13,
              padding:'12px 14px', marginBottom:16 }}>
              <label style={{ display:'flex', alignItems:'flex-start', gap:11, cursor:'pointer' }}>
                <button className={`sw${promoForm.auto_apply?' on':''}`} type="button" style={{marginTop:2}}
                  onClick={()=>setPromoForm(f=>({...f,auto_apply:!f.auto_apply, code: !f.auto_apply ? '' : f.code, afficher_site: !f.auto_apply ? true : f.afficher_site}))} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#1A1A1A' }}>
                    Promotion automatique
                  </div>
                  <div style={{ fontSize:11, color:'#8A7A74', marginTop:3, lineHeight:1.55 }}>
                    Appliquée toute seule pendant la période, sans code à saisir par la cliente.
                    Le prix barré apparaît sur le site.
                  </div>
                  {promoForm.auto_apply && (() => {
                    const rivales = codes.filter(c => {
                      if (promoForm.id && c.id === promoForm.id) return false
                      const r = c as unknown as Record<string, unknown>
                      if (r.auto_apply === false || !c.actif) return false
                      const ids = Array.isArray(r.service_ids) && (r.service_ids as string[]).length
                        ? r.service_ids as string[]
                        : (c.service_id ? [c.service_id] : [])
                      // conflit si l'une des deux est globale, ou si elles se recoupent
                      if (ids.length === 0 || promoForm.service_ids.length === 0) return true
                      return ids.some(x => promoForm.service_ids.includes(x))
                    })
                    if (!rivales.length) return null
                    return (
                      <div style={{ marginTop:9, padding:'9px 11px', background:'#FFF8E1',
                        border:'1px solid #E6C97A', borderRadius:10, fontSize:11,
                        color:'#8A6030', lineHeight:1.55 }}>
                        ⚠ {rivales.length} promotion{rivales.length>1?'s':''} automatique{rivales.length>1?'s':''} déjà
                        active{rivales.length>1?'s':''} sur ces prestations. Sur le site, seule la remise la plus
                        avantageuse sera appliquée.
                      </div>
                    )
                  })()}
                </div>
              </label>
            </div>

            {!promoForm.auto_apply && (
              <>
                <label className="lbl">Code promo *</label>
                <input className="f" value={promoForm.code} autoFocus
                  onChange={e=>setPromoForm(f=>({...f,code:e.target.value.toUpperCase()}))}
                  placeholder="ADOREA20" />
              </>
            )}

            {/* Prestation ciblée */}
            <div style={{ height:14 }}/>
            <label className="lbl">Prestations concernées</label>
            <div style={{ border:'1.5px solid #E5DACE', borderRadius:13, overflow:'hidden', marginBottom:4 }}>
              <button type="button"
                onClick={()=>setPromoForm(f=>({...f,service_ids:[],nouveau_prix:''}))}
                style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 13px',
                  border:'none', borderBottom:'1px solid #F2EDE8', cursor:'pointer',
                  background: promoForm.service_ids.length===0 ? '#FBF5EC' : '#fff',
                  fontFamily:'Manrope,sans-serif', textAlign:'left' }}>
                <span style={{ width:17, height:17, borderRadius:5, flexShrink:0,
                  border: promoForm.service_ids.length===0 ? '5px solid #C9A96A' : '2px solid #C5B8A5' }}/>
                <span style={{ fontSize:13, fontWeight:600, color:'#1A1A1A' }}>Toutes les prestations</span>
              </button>

              <div style={{ maxHeight:190, overflowY:'auto' }}>
                {services.map(sv=>{
                  const on = promoForm.service_ids.includes(sv.id)
                  return (
                    <button key={sv.id} type="button"
                      onClick={()=>setPromoForm(f=>({
                        ...f,
                        service_ids: on ? f.service_ids.filter(x=>x!==sv.id) : [...f.service_ids, sv.id],
                        nouveau_prix:'',
                      }))}
                      style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 13px',
                        border:'none', borderBottom:'1px solid #F7F2EC', cursor:'pointer',
                        background: on ? '#FBF5EC' : '#fff', fontFamily:'Manrope,sans-serif', textAlign:'left' }}>
                      <span style={{ width:17, height:17, borderRadius:5, flexShrink:0,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        background: on ? '#C9A96A' : '#fff',
                        border: on ? '2px solid #C9A96A' : '2px solid #C5B8A5',
                        color:'#fff', fontSize:11, fontWeight:700 }}>{on ? '✓' : ''}</span>
                      <span style={{ flex:1, fontSize:12.5, color:'#1A1A1A' }}>{sv.nom_fr}</span>
                      <span style={{ fontSize:11, color:'#8A7A74' }}>
                        {sv.prix_sur_devis ? 'devis' : new Intl.NumberFormat('fr-FR').format(Number(sv.prix||0))+' FDJ'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={{ fontSize:11, color:'#8A7A74', marginBottom:4 }}>
              {promoForm.service_ids.length===0
                ? 'La promo s\'applique à toutes les prestations.'
                : `${promoForm.service_ids.length} prestation(s) sélectionnée(s).`}
            </div>

            {/* Mode de remise */}
            <div style={{ height:14 }}/>
            <label className="lbl">Type de remise</label>
            <div style={{ display:'flex', gap:6, marginBottom:12 }}>
              {[
                { key:'pct',  label:'% de réduction' },
                { key:'fixe', label:'Montant fixe (FDJ)' },
                { key:'prix', label:'Nouveau prix direct' },
              ].map(m=>(
                <button key={m.key} className={`chip${promoForm.mode===m.key?' on':''}`}
                  style={{ flex:1, padding:'8px 6px', fontSize:11, textAlign:'center' }}
                  onClick={()=>setPromoForm(f=>({...f,mode:m.key as PromoForm['mode']}))}>
                  {m.label}
                </button>
              ))}
            </div>

            {promoForm.mode==='pct' && (
              <div>
                <label className="lbl">Réduction (%)</label>
                <input className="f" type="number" min="1" max="100"
                  value={promoForm.remise_pct} placeholder="20"
                  onChange={e=>setPromoForm(f=>({...f,remise_pct:e.target.value}))} />
                {promoForm.remise_pct && promoForm.service_ids.length===1 && (() => {
                  const sv = services.find(x=>x.id===promoForm.service_ids[0])
                  if (!sv || sv.prix_sur_devis) return null
                  const n = Number(sv.prix||0) * (1 - Number(promoForm.remise_pct)/100)
                  return <div style={{ fontSize:11, color:'#2E7D32', marginTop:-8, marginBottom:8 }}>
                    → Prix affiché : {new Intl.NumberFormat('fr-FR').format(Math.round(Number(n)))} FDJ
                  </div>
                })()}
              </div>
            )}
            {promoForm.mode==='fixe' && (
              <div>
                <label className="lbl">Montant de la remise (FDJ)</label>
                <input className="f" type="number" min="0"
                  value={promoForm.remise_fixe} placeholder="5000"
                  onChange={e=>setPromoForm(f=>({...f,remise_fixe:e.target.value}))} />
              </div>
            )}
            {promoForm.mode==='prix' && (
              <div>
                <label className="lbl">Nouveau prix (FDJ)</label>
                {promoForm.service_ids.length===1 ? (() => {
                  const sv = services.find(x=>x.id===promoForm.service_ids[0])
                  return sv && !sv.prix_sur_devis ? (
                    <>
                      <div style={{ fontSize:11, color:'#8A7A74', marginBottom:6 }}>
                        Prix actuel : <strong>{new Intl.NumberFormat('fr-FR').format(sv.prix)} FDJ</strong>
                      </div>
                      <input className="f" type="number" min="0"
                        value={promoForm.nouveau_prix} placeholder={String(Math.round(sv.prix*0.8))}
                        onChange={e=>setPromoForm(f=>({...f,nouveau_prix:e.target.value}))} />
                      {promoForm.nouveau_prix && (
                        <div style={{ fontSize:11, color:'#2E7D32', marginTop:-8, marginBottom:8 }}>
                          → Remise : {new Intl.NumberFormat('fr-FR').format(Math.max(0,Number(sv.prix||0)-Number(promoForm.nouveau_prix)))} FDJ
                        </div>
                      )}
                    </>
                  ) : <div style={{ fontSize:12, color:'#D14343' }}>Choisissez d'abord une prestation avec un prix fixe.</div>
                })() : <div style={{ fontSize:12, color:'#8A7A74' }}>Sélectionnez une prestation ci-dessus.</div>}
              </div>
            )}

            {/* Compte à rebours */}
            <div style={{ height:14 }}/>
            <div style={{ background:'#FBF7F1', borderRadius:14, padding:'14px 16px' }}>
              <label className="lbl" style={{ marginBottom:10 }}>Compte à rebours</label>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  <label className="lbl" style={{ fontSize:9 }}>Date de fin</label>
                  <input className="f" type="date" value={promoForm.date_fin} style={{ marginBottom:0 }}
                    onChange={e=>setPromoForm(f=>({...f,date_fin:e.target.value}))} />
                </div>
                <div>
                  <label className="lbl" style={{ fontSize:9 }}>Heure exacte</label>
                  <input className="f" type="time" value={promoForm.date_fin_heure} style={{ marginBottom:0 }}
                    onChange={e=>setPromoForm(f=>({...f,date_fin_heure:e.target.value}))} />
                </div>
              </div>

              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <button className={`sw${promoForm.auto_repeat?' on':''}`} type="button"
                  onClick={()=>setPromoForm(f=>({...f,auto_repeat:!f.auto_repeat}))} />
                <span style={{ fontSize:13, color:'#1A1A1A' }}>
                  Relancer automatiquement (flash promo en boucle)
                </span>
              </label>

              {promoForm.auto_repeat && (
                <div style={{ marginTop:12 }}>
                  <label className="lbl" style={{ fontSize:9 }}>Durée de chaque cycle (heures)</label>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {['6','12','24','48','72'].map(h=>(
                      <button key={h} className={`chip${promoForm.duree_heures===h?' on':''}`}
                        style={{ padding:'7px 14px', fontSize:12 }}
                        onClick={()=>setPromoForm(f=>({...f,duree_heures:h}))}>
                        {h}h
                      </button>
                    ))}
                    <input className="f" type="number" min="1" max="720"
                      value={promoForm.duree_heures} style={{ width:80, marginBottom:0, padding:'7px 10px', fontSize:12 }}
                      onChange={e=>setPromoForm(f=>({...f,duree_heures:e.target.value}))} />
                  </div>
                </div>
              )}
            </div>

            {/* Afficher sur le site */}
            <div style={{ height:14 }}/>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer',
              padding:'12px 14px', background:'#FBF7F1', borderRadius:12 }}>
              <button className={`sw${promoForm.afficher_site?' on':''}`} type="button"
                onClick={()=>setPromoForm(f=>({...f,afficher_site:!f.afficher_site}))} />
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'#1A1A1A' }}>Afficher sur le site</div>
                <div style={{ fontSize:11, color:'#8A7A74', marginTop:2 }}>
                  Prix barré + compte à rebours visible par les clientes
                </div>
              </div>
            </label>

            {/* Options avancées */}
            <details style={{ marginTop:14 }}>
              <summary style={{ fontSize:12, color:'#8A7A74', cursor:'pointer', userSelect:'none', padding:'8px 0' }}>
                Options avancées ▸
              </summary>
              <div style={{ paddingTop:12, display:'flex', flexDirection:'column', gap:10 }}>
                <div>
                  <label className="lbl">Montant minimum (FDJ)</label>
                  <input className="f" type="number" value={promoForm.montant_min}
                    onChange={e=>setPromoForm(f=>({...f,montant_min:e.target.value}))} />
                </div>
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
                <div>
                  <label className="lbl">Date de début</label>
                  <input className="f" type="date" value={promoForm.date_debut}
                    onChange={e=>setPromoForm(f=>({...f,date_debut:e.target.value}))} />
                </div>
              </div>
            </details>

            <div style={{ display:'flex', gap:9, marginTop:20 }}>
              <button className="b-ghost" onClick={()=>setPromoOpen(false)}>Annuler</button>
              <button className="b-primary" style={{flex:1}} onClick={savePromo}
                disabled={saving||(!promoForm.auto_apply&&!promoForm.code)}>
                {saving ? 'Enregistrement...' : promoForm.id ? 'Enregistrer' : 'Créer la promo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
