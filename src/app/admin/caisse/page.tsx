'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Service, Category, Employee, Client } from '@/types'

const T = { gold:'#C9A96A', black:'#1A1A1A', muted:'#8A7A74' }
const FDJ = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'
const iso = (d: Date) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset()*60000)
  return x.toISOString().split('T')[0]
}
const METHODS = ['cash','cac_pay','waafi','d_money'] as const
const M_LABEL: Record<string,string> = { cash:'Cash', cac_pay:'CAC PAY', waafi:'WAAFI', d_money:'D-Money' }

type Line = { service: Service; qty: number }
type Appt = {
  id: string; date_rdv: string; heure_debut: string; statut: string
  prix_final: number; payment_status: string; reference: string
  client?: { nom: string; prenom: string; telephone: string } | null
  service?: { nom_fr: string; duree_minutes: number } | null
}

export default function CaissePage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'vente'|'rdv'|'cloture'>('vente')
  const [cats, setCats] = useState<Category[]>([])
  const [svcs, setSvcs] = useState<Service[]>([])
  const [emps, setEmps] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  // Vente
  const [activeCat, setActiveCat] = useState<string>('')
  const [search, setSearch] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [empId, setEmpId] = useState('')
  const [method, setMethod] = useState<string>('cash')
  const [discount, setDiscount] = useState('')
  const [phone, setPhone] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [foundClient, setFound] = useState<Client | null>(null)
  const [paying, setPaying] = useState(false)
  const [toast, setToast] = useState('')

  // RDV
  const [appts, setAppts] = useState<Appt[]>([])
  const [apptDate, setApptDate] = useState(iso(new Date()))

  // Clôture
  const [dayPayments, setDayPayments] = useState<{montant:number;methode:string}[]>([])
  const [closeOpen, setCloseOpen] = useState(false)
  const [cashReel, setCashReel] = useState('')
  const [closeNote, setCloseNote] = useState('')
  const [closedToday, setClosedToday] = useState<{cash_theorique:number;cash_reel:number;ecart:number}|null>(null)
  const [closing, setClosing] = useState(false)

  const today = iso(new Date())

  const load = useCallback(async () => {
    setLoading(true)
    const [c, s, e] = await Promise.all([
      supabase.from('categories').select('*').eq('actif',true).order('ordre'),
      supabase.from('services').select('*').eq('actif',true).order('ordre'),
      supabase.from('employees').select('*').eq('actif',true).order('prenom'),
    ])
    setCats((c.data as Category[])||[])
    setSvcs((s.data as Service[])||[])
    const el = (e.data as Employee[])||[]
    setEmps(el)
    if (!empId && el[0]) setEmpId(el[0].id)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  const loadAppts = useCallback(async () => {
    const { data } = await supabase.from('appointments')
      .select('id,date_rdv,heure_debut,statut,prix_final,payment_status,reference,client:clients(nom,prenom,telephone),service:services(nom_fr,duree_minutes)')
      .eq('date_rdv', apptDate).order('heure_debut')
    setAppts((data as unknown as Appt[])||[])
  }, [supabase, apptDate])

  const loadCloture = useCallback(async () => {
    const { data: pays } = await supabase.from('payments')
      .select('montant,methode,created_at')
      .gte('created_at', today+'T00:00:00').lte('created_at', today+'T23:59:59')
      .eq('statut','valide')
    setDayPayments((pays as {montant:number;methode:string}[])||[])
    const { data: cl } = await supabase.from('cash_closings')
      .select('cash_theorique,cash_reel,ecart').eq('date_cloture', today).maybeSingle()
    setClosedToday(cl as {cash_theorique:number;cash_reel:number;ecart:number}|null)
  }, [supabase, today])

  useEffect(() => { if (tab==='rdv') loadAppts() }, [tab, loadAppts])
  useEffect(() => { if (tab==='cloture') loadCloture() }, [tab, loadCloture])

  // ── Panier ──
  const add = (s: Service) => setLines(l => {
    const i = l.findIndex(x => x.service.id === s.id)
    if (i >= 0) { const n=[...l]; n[i]={...n[i],qty:n[i].qty+1}; return n }
    return [...l, { service:s, qty:1 }]
  })
  const setQty = (id: string, q: number) =>
    setLines(l => q<=0 ? l.filter(x=>x.service.id!==id) : l.map(x=>x.service.id===id?{...x,qty:q}:x))

  const subtotal = lines.reduce((a,l)=>a + (l.service.prix_sur_devis?0:l.service.prix)*l.qty, 0)
  const disc = Number(discount||0)
  const total = Math.max(0, subtotal - disc)
  const hasDevis = lines.some(l=>l.service.prix_sur_devis)

  async function lookupPhone(v: string) {
    setPhone(v)
    if (v.length < 6) { setFound(null); return }
    const { data } = await supabase.from('clients').select('*').eq('telephone', v).maybeSingle()
    if (data) { const c = data as Client; setFound(c); setNom(c.nom); setPrenom(c.prenom) }
    else setFound(null)
  }

  async function encaisser() {
    if (!lines.length || !phone || !prenom || !nom) return
    setPaying(true)
    try {
      let clientId = foundClient?.id
      if (!clientId) {
        const { data } = await supabase.from('clients')
          .insert({ nom, prenom, telephone: phone }).select('id').single()
        clientId = (data as {id:string})?.id
      }
      if (!clientId) throw new Error('client')

      const now = new Date()
      const h = now.toTimeString().slice(0,8)
      for (const l of lines) {
        const dur = l.service.duree_minutes || 60
        const end = new Date(now.getTime() + dur*60000).toTimeString().slice(0,8)
        const share = subtotal>0 ? ((l.service.prix_sur_devis?0:l.service.prix)*l.qty/subtotal)*total : 0
        const { data: ap } = await supabase.from('appointments').insert({
          client_id: clientId, service_id: l.service.id, employee_id: empId || null,
          date_rdv: today, heure_debut: h, heure_fin: end,
          statut: 'terminee', prix_final: Math.round(share),
          payment_method: method, payment_status: 'valide',
          is_walkin: true,
        }).select('id').single()
        if (ap) {
          await supabase.from('payments').insert({
            appointment_id: (ap as {id:string}).id,
            montant: Math.round(share), methode: method, statut: 'valide',
            validated_at: new Date().toISOString(),
          })
        }
      }
      setLines([]); setPhone(''); setNom(''); setPrenom(''); setFound(null); setDiscount('')
      setToast(`Encaissé — ${FDJ(total)}`)
      setTimeout(()=>setToast(''), 3000)
    } finally { setPaying(false) }
  }

  async function markPaid(a: Appt) {
    await supabase.from('appointments')
      .update({ payment_status:'valide', statut:'terminee', payment_method: method }).eq('id', a.id)
    await supabase.from('payments').insert({
      appointment_id: a.id, montant: a.prix_final, methode: method,
      statut:'valide', validated_at: new Date().toISOString(),
    })
    loadAppts()
  }

  const theorique = dayPayments.filter(p=>p.methode==='cash').reduce((a,p)=>a+Number(p.montant),0)
  const totalJour = dayPayments.reduce((a,p)=>a+Number(p.montant),0)

  async function cloturer() {
    setClosing(true)
    await supabase.from('cash_closings').upsert({
      date_cloture: today,
      cash_theorique: theorique,
      cash_reel: Number(cashReel||0),
      commentaire: closeNote || null,
    }, { onConflict:'date_cloture' })
    setClosing(false); setCloseOpen(false); setCashReel(''); setCloseNote('')
    loadCloture()
  }

  const shownSvcs = svcs.filter(s =>
    (!activeCat || s.category_id === activeCat) &&
    (!search || s.nom_fr.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="pg" style={{ padding:'26px 26px 60px' }}>
      <div className="ph">
        <div>
          <h1>Caisse</h1>
          <div className="sub">{new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</div>
        </div>
        {lines.length>0 && (
          <button className="b-ghost" onClick={()=>setLines([])}>Vider ({lines.length})</button>
        )}
      </div>

      <div className="tabs">
        <button className={tab==='vente'?'on':''} onClick={()=>setTab('vente')}>Vente rapide</button>
        <button className={tab==='rdv'?'on':''} onClick={()=>setTab('rdv')}>Rendez-vous</button>
        <button className={tab==='cloture'?'on':''} onClick={()=>setTab('cloture')}>Clôture</button>
      </div>

      {/* ══ VENTE ══ */}
      {tab === 'vente' && (
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1.55fr) minmax(280px,1fr)', gap:16, alignItems:'start' }}
          className="caisse-grid">

          {/* Catalogue */}
          <div>
            <input className="f" placeholder="Rechercher une prestation..." value={search}
              onChange={e=>setSearch(e.target.value)} style={{ marginBottom:12 }} />

            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
              <button className={`chip${!activeCat?' on':''}`} onClick={()=>setActiveCat('')}>Toutes</button>
              {cats.map(c=>(
                <button key={c.id} className={`chip${activeCat===c.id?' on':''}`}
                  onClick={()=>setActiveCat(c.id)}>{c.nom_fr}</button>
              ))}
            </div>

            {loading ? (
              <div className="g3">{Array.from({length:6}).map((_,i)=><div key={i} className="skel" style={{height:74}}/>)}</div>
            ) : shownSvcs.length===0 ? (
              <div className="empty">Aucune prestation.</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:9 }}>
                {shownSvcs.map(s=>{
                  const inCart = lines.find(l=>l.service.id===s.id)
                  return (
                    <button key={s.id} className={`tile${inCart?' on':''}`}
                      onClick={()=>add(s)} style={{ padding:'12px 13px', position:'relative' }}>
                      {inCart && (
                        <span style={{ position:'absolute', top:7, right:8, background:T.gold, color:'#fff',
                          width:19, height:19, borderRadius:'50%', fontSize:10, fontWeight:700,
                          display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {inCart.qty}
                        </span>
                      )}
                      <div style={{ fontSize:12.5, fontWeight:500, color:T.black, lineHeight:1.35, paddingRight:inCart?20:0 }}>
                        {s.nom_fr}
                      </div>
                      <div style={{ fontSize:11.5, fontWeight:600, color:T.gold, marginTop:5 }}>
                        {s.prix_sur_devis ? 'Sur devis' : FDJ(s.prix)}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Panier */}
          <div style={{ background:'#fff', border:'1.5px solid #EFE6DC', borderRadius:18, padding:16,
            position:'sticky', top:16 }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase',
              color:T.muted, marginBottom:12 }}>Panier</div>

            {lines.length===0 ? (
              <div style={{ padding:'28px 0', textAlign:'center', fontSize:12, color:'#C0B2A6' }}>
                Touchez une prestation
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:14 }}>
                {lines.map(l=>(
                  <div key={l.service.id} style={{ display:'flex', alignItems:'center', gap:8,
                    padding:'8px 10px', background:'#FBF7F1', borderRadius:11 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:T.black }}>{l.service.nom_fr}</div>
                      <div style={{ fontSize:10.5, color:T.gold }}>
                        {l.service.prix_sur_devis?'Sur devis':FDJ(l.service.prix*l.qty)}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <button className="b-icon" style={{width:24,height:24,fontSize:14,borderRadius:7}}
                        onClick={()=>setQty(l.service.id,l.qty-1)}>−</button>
                      <span style={{ fontSize:12, fontWeight:600, minWidth:14, textAlign:'center' }}>{l.qty}</span>
                      <button className="b-icon" style={{width:24,height:24,fontSize:14,borderRadius:7}}
                        onClick={()=>setQty(l.service.id,l.qty+1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {lines.length>0 && (
              <>
                <label className="lbl">Remise (FDJ)</label>
                <input className="f" type="number" value={discount}
                  onChange={e=>setDiscount(e.target.value)} placeholder="0" />

                <div style={{ borderTop:'1px solid #EFE6DC', margin:'14px 0', paddingTop:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:T.muted, marginBottom:4 }}>
                    <span>Sous-total</span><span>{FDJ(subtotal)}</span>
                  </div>
                  {disc>0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#D14343', marginBottom:4 }}>
                      <span>Remise</span><span>− {FDJ(disc)}</span>
                    </div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop:8 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:T.black }}>Total</span>
                    <span style={{ fontFamily:'Cormorant Garamond,serif', fontSize:27, color:T.gold }}>{FDJ(total)}</span>
                  </div>
                  {hasDevis && (
                    <div style={{ fontSize:10.5, color:'#B8860B', marginTop:6 }}>
                      Contient une prestation sur devis — ajustez le prix manuellement.
                    </div>
                  )}
                </div>

                <label className="lbl">Cliente</label>
                <input className="f" placeholder="Téléphone" value={phone}
                  onChange={e=>lookupPhone(e.target.value)} />
                {foundClient ? (
                  <div style={{ fontSize:11, color:'#2E7D32', marginTop:-6, marginBottom:10 }}>
                    ✓ {foundClient.prenom} {foundClient.nom} · {foundClient.total_prestations} visite(s)
                  </div>
                ) : phone.length>=6 && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:-4 }}>
                    <input className="f" placeholder="Prénom" value={prenom} onChange={e=>setPrenom(e.target.value)} />
                    <input className="f" placeholder="Nom" value={nom} onChange={e=>setNom(e.target.value)} />
                  </div>
                )}

                <label className="lbl" style={{ marginTop:8 }}>Réalisée par</label>
                <select className="f" value={empId} onChange={e=>setEmpId(e.target.value)}>
                  {emps.map(e=><option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                </select>

                <label className="lbl" style={{ marginTop:12 }}>Paiement</label>
                <div className="g4" style={{ marginBottom:14 }}>
                  {METHODS.map(m=>(
                    <button key={m} className={`chip gold${method===m?' on':''}`}
                      style={{ padding:'9px 6px', fontSize:11 }}
                      onClick={()=>setMethod(m)}>{M_LABEL[m]}</button>
                  ))}
                </div>

                <button className="b-gold" style={{ width:'100%', padding:'14px' }}
                  onClick={encaisser}
                  disabled={paying||!phone||!prenom||!nom}>
                  {paying?'Encaissement...':`Encaisser ${FDJ(total)}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ RENDEZ-VOUS ══ */}
      {tab === 'rdv' && (
        <>
          <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
            <input className="f" type="date" value={apptDate} onChange={e=>setApptDate(e.target.value)}
              style={{ maxWidth:180 }} />
            <button className="b-ghost" onClick={()=>setApptDate(today)}>Aujourd&apos;hui</button>
            <div style={{ marginLeft:'auto', display:'flex', gap:5 }}>
              {METHODS.map(m=>(
                <button key={m} className={`chip gold${method===m?' on':''}`}
                  style={{ padding:'7px 12px', fontSize:11 }} onClick={()=>setMethod(m)}>{M_LABEL[m]}</button>
              ))}
            </div>
          </div>

          {appts.length===0 ? (
            <div className="empty">Aucun rendez-vous ce jour.</div>
          ) : (
            <div className="rows">
              {appts.map(a=>(
                <div key={a.id} className="row" style={{ gridTemplateColumns:'auto 1fr auto auto' }}>
                  <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:19, color:T.gold, minWidth:52 }}>
                    {a.heure_debut?.slice(0,5)}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13.5, fontWeight:500, color:T.black }}>
                      {a.client?.prenom} {a.client?.nom}
                    </div>
                    <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
                      {a.service?.nom_fr} · {a.reference}
                    </div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.black, whiteSpace:'nowrap' }}>
                    {FDJ(a.prix_final)}
                  </div>
                  {a.payment_status==='valide' ? (
                    <span className="badge" style={{ background:'#E8F5E9', color:'#2E7D32' }}>Payé</span>
                  ) : (
                    <button className="b-gold" style={{ padding:'8px 16px', fontSize:11 }}
                      onClick={()=>markPaid(a)}>Encaisser</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══ CLÔTURE ══ */}
      {tab === 'cloture' && (
        <>
          <div className="g3" style={{ marginBottom:20 }}>
            {[
              { l:'Total encaissé', v:FDJ(totalJour), c:T.black },
              { l:'Espèces (théorique)', v:FDJ(theorique), c:T.gold },
              { l:'Transactions', v:String(dayPayments.length), c:T.black },
            ].map(k=>(
              <div key={k.l} style={{ background:'#fff', border:'1.5px solid #EFE6DC', borderRadius:16, padding:'16px 18px' }}>
                <div style={{ fontSize:10, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:T.muted }}>{k.l}</div>
                <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:28, color:k.c, marginTop:6 }}>{k.v}</div>
              </div>
            ))}
          </div>

          <div style={{ background:'#fff', border:'1.5px solid #EFE6DC', borderRadius:16, padding:18, marginBottom:18 }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase',
              color:T.muted, marginBottom:12 }}>Détail par méthode</div>
            {METHODS.map(m=>{
              const sum = dayPayments.filter(p=>p.methode===m).reduce((a,p)=>a+Number(p.montant),0)
              const n = dayPayments.filter(p=>p.methode===m).length
              return (
                <div key={m} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0',
                  borderBottom:'1px solid #F4EEE6', fontSize:13 }}>
                  <span style={{ color:T.muted }}>{M_LABEL[m]} <span style={{opacity:.6}}>({n})</span></span>
                  <span style={{ fontWeight:600, color:T.black }}>{FDJ(sum)}</span>
                </div>
              )
            })}
          </div>

          {closedToday ? (
            <div style={{ background:'#E8F5E9', border:'1.5px solid #A5D6A7', borderRadius:16, padding:18 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#2E7D32', marginBottom:10 }}>
                ✓ Caisse clôturée pour aujourd&apos;hui
              </div>
              <div style={{ display:'flex', gap:24, flexWrap:'wrap', fontSize:12.5, color:'#33691E' }}>
                <span>Théorique : <strong>{FDJ(closedToday.cash_theorique)}</strong></span>
                <span>Réel : <strong>{FDJ(closedToday.cash_reel)}</strong></span>
                <span>Écart : <strong style={{ color: closedToday.ecart===0?'#2E7D32':'#D14343' }}>
                  {closedToday.ecart>0?'+':''}{FDJ(closedToday.ecart)}
                </strong></span>
              </div>
            </div>
          ) : (
            <button className="b-primary" style={{ width:'100%', padding:'15px' }}
              onClick={()=>{ setCashReel(String(theorique)); setCloseOpen(true) }}>
              Fermer la caisse
            </button>
          )}
        </>
      )}

      {/* Modal clôture */}
      {closeOpen && (
        <div className="ovl" onClick={e=>e.target===e.currentTarget&&setCloseOpen(false)}>
          <div className="mdl">
            <div className="mdl-h">
              <h3>Fermeture de caisse</h3>
              <button className="b-icon" onClick={()=>setCloseOpen(false)}>×</button>
            </div>

            <div style={{ background:'#FBF7F1', borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, marginBottom:6 }}>
                <span style={{ color:T.muted }}>Espèces théoriques</span>
                <span style={{ fontWeight:600 }}>{FDJ(theorique)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5 }}>
                <span style={{ color:T.muted }}>Total journée</span>
                <span style={{ fontWeight:600 }}>{FDJ(totalJour)}</span>
              </div>
            </div>

            <label className="lbl">Espèces comptées en caisse *</label>
            <input className="f" type="number" value={cashReel} onChange={e=>setCashReel(e.target.value)} autoFocus />

            {cashReel !== '' && (
              <div style={{ marginTop:-6, marginBottom:12, fontSize:12,
                color: Number(cashReel)-theorique===0 ? '#2E7D32' : '#D14343' }}>
                Écart : {Number(cashReel)-theorique>0?'+':''}{FDJ(Number(cashReel)-theorique)}
              </div>
            )}

            <label className="lbl">Commentaire</label>
            <textarea className="f" style={{ minHeight:64, resize:'vertical' }} value={closeNote}
              onChange={e=>setCloseNote(e.target.value)} placeholder="Observation sur l'écart, incident..." />

            <div style={{ display:'flex', gap:9, marginTop:20 }}>
              <button className="b-ghost" onClick={()=>setCloseOpen(false)}>Annuler</button>
              <button className="b-primary" style={{ flex:1 }} onClick={cloturer} disabled={closing||cashReel===''}>
                {closing?'Fermeture...':'Confirmer la fermeture'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:600,
          background:T.black, color:'#F9F6F2', padding:'13px 24px', borderRadius:100, fontSize:13,
          boxShadow:'0 8px 28px rgba(0,0,0,.3)' }}>
          {toast}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .caisse-grid { grid-template-columns: 1fr !important; }
          .caisse-grid > div:last-child { position: static !important; }
        }
      `}</style>
    </div>
  )
}
