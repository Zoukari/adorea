'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'

const T = { gold:'#C9A96A', black:'#1A1A1A', muted:'#8A7A74' }
const FDJ = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'
const iso = (d: Date) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset()*60000)
  return x.toISOString().split('T')[0]
}
const EXP_CATS = ['pigments','makeup','nails','consommables','hygiene','materiel','mobilier','marketing','transport','autre'] as const
const CAT_LABEL: Record<string,string> = {
  pigments:'Pigments', makeup:'Makeup', nails:'Nails', consommables:'Consommables',
  hygiene:'Hygiène', materiel:'Matériel', mobilier:'Mobilier', marketing:'Marketing',
  transport:'Transport', autre:'Autre',
}
const M_LABEL: Record<string,string> = { cash:'Cash', cac_pay:'CAC PAY', waafi:'WAAFI', d_money:'D-Money' }

type Expense = {
  id:string; date_depense:string; produit:string; categorie:string
  quantite:number; montant:number; marque:string|null; fournisseur:string|null; notes:string|null
}
type Closing = {
  id:string; date_cloture:string; cash_theorique:number; cash_reel:number
  ecart:number; commentaire:string|null
}
type Pay = { montant:number; methode:string; created_at:string }

export default function AccountingPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'resume'|'depenses'|'clotures'>('resume')
  const [loading, setLoading] = useState(true)

  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)
  const [from, setFrom] = useState(iso(monthAgo))
  const [to, setTo] = useState(iso(new Date()))

  const [pays, setPays] = useState<Pay[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [closings, setClosings] = useState<Closing[]>([])

  const [expOpen, setExpOpen] = useState(false)
  const [expForm, setExpForm] = useState({
    date_depense: iso(new Date()), produit:'', categorie:'consommables',
    quantite:'1', montant:'', marque:'', fournisseur:'', notes:'',
  })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [p, e, c] = await Promise.all([
      supabase.from('payments').select('montant,methode,created_at')
        .gte('created_at', from+'T00:00:00').lte('created_at', to+'T23:59:59').eq('statut','valide'),
      supabase.from('expenses').select('*')
        .gte('date_depense', from).lte('date_depense', to).order('date_depense',{ascending:false}),
      supabase.from('cash_closings').select('*')
        .gte('date_cloture', from).lte('date_cloture', to).order('date_cloture',{ascending:false}),
    ])
    setPays((p.data as Pay[])||[])
    setExpenses((e.data as Expense[])||[])
    setClosings((c.data as Closing[])||[])
    setLoading(false)
  }, [supabase, from, to])

  useEffect(() => { load() }, [load])

  const ca = pays.reduce((a,p)=>a+Number(p.montant),0)
  const dep = expenses.reduce((a,e)=>a+Number(e.montant),0)
  const marge = ca - dep

  // Série journalière
  const daily: Record<string,{name:string;ca:number;depenses:number}> = {}
  const d0 = new Date(from), d1 = new Date(to)
  for (let d = new Date(d0); d <= d1; d.setDate(d.getDate()+1)) {
    const k = iso(d)
    daily[k] = { name: new Date(k+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'}), ca:0, depenses:0 }
  }
  pays.forEach(p=>{ const k = p.created_at.split('T')[0]; if (daily[k]) daily[k].ca += Number(p.montant) })
  expenses.forEach(e=>{ if (daily[e.date_depense]) daily[e.date_depense].depenses += Number(e.montant) })
  const series = Object.values(daily)

  const byMethod = Object.entries(
    pays.reduce((acc,p)=>{ acc[p.methode]=(acc[p.methode]||0)+Number(p.montant); return acc }, {} as Record<string,number>)
  ).map(([k,v])=>({ name: M_LABEL[k]||k, montant: v }))

  const byCat = Object.entries(
    expenses.reduce((acc,e)=>{ acc[e.categorie]=(acc[e.categorie]||0)+Number(e.montant); return acc }, {} as Record<string,number>)
  ).map(([k,v])=>({ name: CAT_LABEL[k]||k, montant: v })).sort((a,b)=>b.montant-a.montant)

  async function saveExpense() {
    if (!expForm.produit || !expForm.montant) return
    setSaving(true)
    await supabase.from('expenses').insert({
      date_depense: expForm.date_depense,
      produit: expForm.produit,
      categorie: expForm.categorie,
      quantite: Number(expForm.quantite||1),
      montant: Number(expForm.montant),
      marque: expForm.marque||null,
      fournisseur: expForm.fournisseur||null,
      notes: expForm.notes||null,
    })
    setSaving(false); setExpOpen(false)
    setExpForm({ date_depense:iso(new Date()), produit:'', categorie:'consommables',
      quantite:'1', montant:'', marque:'', fournisseur:'', notes:'' })
    load()
  }

  async function delExpense(id:string) {
    if (!confirm('Supprimer cette dépense ?')) return
    await supabase.from('expenses').delete().eq('id',id); load()
  }

  const preset = (days:number) => {
    const d = new Date(); d.setDate(d.getDate()-days)
    setFrom(iso(d)); setTo(iso(new Date()))
  }

  return (
    <div className="pg" style={{ padding:'26px 26px 60px' }}>
      <div className="ph">
        <div>
          <h1>Comptabilité</h1>
          <div className="sub">
            {new Date(from+'T00:00:00').toLocaleDateString('fr-FR')} → {new Date(to+'T00:00:00').toLocaleDateString('fr-FR')}
          </div>
        </div>
        {tab==='depenses' && <button className="b-gold" onClick={()=>setExpOpen(true)}>+ Dépense</button>}
      </div>

      {/* Période */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'flex-end', marginBottom:18 }}>
        <div>
          <label className="lbl">Du</label>
          <input className="f" type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ width:160 }} />
        </div>
        <div>
          <label className="lbl">Au</label>
          <input className="f" type="date" value={to} onChange={e=>setTo(e.target.value)} style={{ width:160 }} />
        </div>
        <div style={{ display:'flex', gap:5 }}>
          <button className="chip" onClick={()=>preset(6)}>7 j</button>
          <button className="chip" onClick={()=>preset(29)}>30 j</button>
          <button className="chip" onClick={()=>preset(89)}>90 j</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="g3" style={{ marginBottom:20 }}>
        {[
          { l:'Chiffre d\'affaires', v:FDJ(ca), c:T.gold },
          { l:'Dépenses', v:FDJ(dep), c:'#D14343' },
          { l:'Marge', v:FDJ(marge), c: marge>=0?'#2E7D32':'#D14343' },
        ].map(k=>(
          <div key={k.l} style={{ background:'#fff', border:'1.5px solid #EFE6DC', borderRadius:16, padding:'16px 18px' }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:T.muted }}>{k.l}</div>
            <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:30, color:k.c, marginTop:5 }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        <button className={tab==='resume'?'on':''} onClick={()=>setTab('resume')}>Résumé</button>
        <button className={tab==='depenses'?'on':''} onClick={()=>setTab('depenses')}>Dépenses ({expenses.length})</button>
        <button className={tab==='clotures'?'on':''} onClick={()=>setTab('clotures')}>Clôtures ({closings.length})</button>
      </div>

      {loading ? (
        <div className="skel" style={{ height:280 }} />
      ) : (
        <>
          {/* ══ RÉSUMÉ ══ */}
          {tab==='resume' && (
            <>
              <div style={{ background:'#fff', border:'1.5px solid #EFE6DC', borderRadius:16, padding:18, marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase',
                  color:T.muted, marginBottom:14 }}>Évolution</div>
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="gCa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={T.gold} stopOpacity={0.32}/>
                        <stop offset="100%" stopColor={T.gold} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D14343" stopOpacity={0.22}/>
                        <stop offset="100%" stopColor="#D14343" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tick={{ fontSize:10, fill:T.muted }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize:10, fill:T.muted }} axisLine={false} tickLine={false}
                      tickFormatter={(v:number)=>(v/1000)+'k'}/>
                    <Tooltip formatter={(v)=>FDJ(Number(v))} contentStyle={{ fontFamily:'Manrope,sans-serif', fontSize:12, borderRadius:12 }}/>
                    <Legend iconSize={8} wrapperStyle={{ fontSize:11 }}/>
                    <Area type="monotone" dataKey="ca" name="CA" stroke={T.gold} strokeWidth={2} fill="url(#gCa)"/>
                    <Area type="monotone" dataKey="depenses" name="Dépenses" stroke="#D14343" strokeWidth={1.5} fill="url(#gExp)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>
                <div style={{ background:'#fff', border:'1.5px solid #EFE6DC', borderRadius:16, padding:18 }}>
                  <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase',
                    color:T.muted, marginBottom:14 }}>Encaissements par méthode</div>
                  {byMethod.length===0 ? <div className="empty" style={{padding:'28px 0'}}>Aucun encaissement.</div> : (
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart data={byMethod}>
                        <XAxis dataKey="name" tick={{ fontSize:10, fill:T.muted }} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fontSize:10, fill:T.muted }} axisLine={false} tickLine={false}
                          tickFormatter={(v:number)=>(v/1000)+'k'}/>
                        <Tooltip formatter={(v)=>FDJ(Number(v))} contentStyle={{ fontFamily:'Manrope,sans-serif', fontSize:12, borderRadius:12 }}/>
                        <Bar dataKey="montant" fill={T.gold} radius={[7,7,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div style={{ background:'#fff', border:'1.5px solid #EFE6DC', borderRadius:16, padding:18 }}>
                  <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase',
                    color:T.muted, marginBottom:14 }}>Dépenses par catégorie</div>
                  {byCat.length===0 ? <div className="empty" style={{padding:'28px 0'}}>Aucune dépense.</div> : (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {byCat.slice(0,6).map(c=>(
                        <div key={c.name}>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                            <span style={{ color:T.muted }}>{c.name}</span>
                            <span style={{ fontWeight:600, color:T.black }}>{FDJ(c.montant)}</span>
                          </div>
                          <div style={{ height:5, background:'#F2EDE8', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${(c.montant/byCat[0].montant)*100}%`,
                              background:T.gold, borderRadius:3 }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ══ DÉPENSES ══ */}
          {tab==='depenses' && (
            expenses.length===0 ? <div className="empty">Aucune dépense sur cette période.</div> : (
              <div className="rows">
                {expenses.map(e=>(
                  <div key={e.id} className="row" style={{ gridTemplateColumns:'auto 1fr auto auto' }}>
                    <div style={{ fontSize:11, color:T.muted, minWidth:52 }}>
                      {new Date(e.date_depense+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13.5, fontWeight:500, color:T.black }}>{e.produit}</div>
                      <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>
                        {CAT_LABEL[e.categorie]}
                        {e.quantite>1 && ` · ×${e.quantite}`}
                        {e.fournisseur && ` · ${e.fournisseur}`}
                      </div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#D14343', whiteSpace:'nowrap' }}>
                      −{FDJ(e.montant)}
                    </div>
                    <button className="b-icon" style={{ color:'#D14343' }} onClick={()=>delExpense(e.id)}>×</button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ══ CLÔTURES ══ */}
          {tab==='clotures' && (
            closings.length===0 ? <div className="empty">Aucune clôture sur cette période.</div> : (
              <>
                <div className="g3" style={{ marginBottom:16 }}>
                  {[
                    { l:'Clôtures', v:String(closings.length) },
                    { l:'Écart cumulé', v:FDJ(closings.reduce((a,c)=>a+Number(c.ecart),0)) },
                    { l:'Espèces totales', v:FDJ(closings.reduce((a,c)=>a+Number(c.cash_reel),0)) },
                  ].map(k=>(
                    <div key={k.l} style={{ background:'#fff', border:'1.5px solid #EFE6DC', borderRadius:14, padding:'13px 16px' }}>
                      <div style={{ fontSize:10, fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:T.muted }}>{k.l}</div>
                      <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, color:T.black, marginTop:4 }}>{k.v}</div>
                    </div>
                  ))}
                </div>

                <div className="rows">
                  {closings.map(c=>(
                    <div key={c.id} className="row" style={{ gridTemplateColumns:'auto 1fr 1fr auto' }}>
                      <div style={{ fontSize:12, fontWeight:600, color:T.black, minWidth:76 }}>
                        {new Date(c.date_cloture+'T00:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
                      </div>
                      <div>
                        <div style={{ fontSize:10.5, color:T.muted }}>Théorique</div>
                        <div style={{ fontSize:13, fontWeight:500 }}>{FDJ(c.cash_theorique)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:10.5, color:T.muted }}>Compté</div>
                        <div style={{ fontSize:13, fontWeight:500 }}>{FDJ(c.cash_reel)}</div>
                      </div>
                      <span className="badge" style={{
                        background: Number(c.ecart)===0 ? '#E8F5E9' : '#FDECEC',
                        color: Number(c.ecart)===0 ? '#2E7D32' : '#C62828' }}>
                        {Number(c.ecart)>0?'+':''}{FDJ(c.ecart)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )
          )}
        </>
      )}

      {/* Modal dépense */}
      {expOpen && (
        <div className="ovl" onClick={e=>e.target===e.currentTarget&&setExpOpen(false)}>
          <div className="mdl">
            <div className="mdl-h">
              <h3>Nouvelle dépense</h3>
              <button className="b-icon" onClick={()=>setExpOpen(false)}>×</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label className="lbl">Date</label>
                <input className="f" type="date" value={expForm.date_depense}
                  onChange={e=>setExpForm(f=>({...f,date_depense:e.target.value}))} />
              </div>
              <div>
                <label className="lbl">Catégorie</label>
                <select className="f" value={expForm.categorie}
                  onChange={e=>setExpForm(f=>({...f,categorie:e.target.value}))}>
                  {EXP_CATS.map(c=><option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                </select>
              </div>
            </div>

            <div style={{ height:12 }}/>
            <label className="lbl">Produit *</label>
            <input className="f" value={expForm.produit}
              onChange={e=>setExpForm(f=>({...f,produit:e.target.value}))}
              placeholder="Pigments Perma Blend" />

            <div style={{ height:12 }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label className="lbl">Quantité</label>
                <input className="f" type="number" value={expForm.quantite}
                  onChange={e=>setExpForm(f=>({...f,quantite:e.target.value}))} />
              </div>
              <div>
                <label className="lbl">Montant (FDJ) *</label>
                <input className="f" type="number" value={expForm.montant}
                  onChange={e=>setExpForm(f=>({...f,montant:e.target.value}))} />
              </div>
            </div>

            <div style={{ height:12 }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label className="lbl">Marque</label>
                <input className="f" value={expForm.marque}
                  onChange={e=>setExpForm(f=>({...f,marque:e.target.value}))} />
              </div>
              <div>
                <label className="lbl">Fournisseur</label>
                <input className="f" value={expForm.fournisseur}
                  onChange={e=>setExpForm(f=>({...f,fournisseur:e.target.value}))} />
              </div>
            </div>

            <div style={{ height:12 }}/>
            <label className="lbl">Notes</label>
            <input className="f" value={expForm.notes}
              onChange={e=>setExpForm(f=>({...f,notes:e.target.value}))} />

            <div style={{ display:'flex', gap:9, marginTop:20 }}>
              <button className="b-ghost" onClick={()=>setExpOpen(false)}>Annuler</button>
              <button className="b-primary" style={{flex:1}} onClick={saveExpense}
                disabled={saving||!expForm.produit||!expForm.montant}>
                {saving?'Enregistrement...':'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
