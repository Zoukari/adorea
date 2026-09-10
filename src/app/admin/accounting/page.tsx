'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import type { DashboardStats } from '@/types'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }
const FDJ = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'

type Period = 'today' | 'week' | 'month' | 'year' | 'custom'

function getPeriodDates(period: Period, custom?: { debut: string; fin: string }) {
  const now = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  if (period === 'today')  return { debut: fmt(now), fin: fmt(now) }
  if (period === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1)
    const end   = new Date(start); end.setDate(start.getDate() + 6)
    return { debut: fmt(start), fin: fmt(end) }
  }
  if (period === 'month')  return { debut: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), fin: fmt(now) }
  if (period === 'year')   return { debut: fmt(new Date(now.getFullYear(), 0, 1)), fin: fmt(now) }
  return { debut: custom?.debut || fmt(now), fin: custom?.fin || fmt(now) }
}

export default function AccountingPage() {
  const supabase = createClient()
  const [period, setPeriod] = useState<Period>('month')
  const [custom, setCustom] = useState({ debut: '', fin: '' })
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [caByEmp, setCaByEmp] = useState<{ employee_nom: string; ca_total: number; commission_due: number }[]>([])
  const [caByCat, setCaByCat] = useState<{ categorie_nom: string; ca_total: number }[]>([])
  const [caByDay, setCaByDay] = useState<{ name: string; ca: number; depenses: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [period, custom.debut, custom.fin])

  async function load() {
    setLoading(true)
    const { debut, fin } = getPeriodDates(period, custom)
    if (!debut || !fin) { setLoading(false); return }

    const [statsRes, empRes, catRes, rdvRes, expRes] = await Promise.all([
      supabase.rpc('get_dashboard_stats', { p_date_debut: debut, p_date_fin: fin }),
      supabase.rpc('get_ca_by_employee', { p_date_debut: debut, p_date_fin: fin }),
      supabase.rpc('get_ca_by_category', { p_date_debut: debut, p_date_fin: fin }),
      supabase.from('appointments').select('date_rdv,prix_final').gte('date_rdv', debut).lte('date_rdv', fin).eq('statut','terminee'),
      supabase.from('expenses').select('date_depense,montant').gte('date_depense', debut).lte('date_depense', fin),
    ])

    if (statsRes.data) setStats(statsRes.data as DashboardStats)
    if (empRes.data)   setCaByEmp(empRes.data as typeof caByEmp)
    if (catRes.data)   setCaByCat((catRes.data as { categorie_nom: string; ca_total: number }[]).map(r => ({ categorie_nom: r.categorie_nom, ca_total: r.ca_total })))

    // Construire données jour par jour
    const caByDate: Record<string, number>  = {}
    const expByDate: Record<string, number> = {}
    ;(rdvRes.data || []).forEach((r: { date_rdv: string; prix_final: number }) => { caByDate[r.date_rdv]  = (caByDate[r.date_rdv]  || 0) + r.prix_final })
    ;(expRes.data || []).forEach((e: { date_depense: string; montant: number }) => { expByDate[e.date_depense] = (expByDate[e.date_depense] || 0) + e.montant })
    const allDates = Array.from(new Set([...Object.keys(caByDate), ...Object.keys(expByDate)])).sort()
    setCaByDay(allDates.map(d => ({ name: d.slice(5), ca: Math.round(caByDate[d] || 0), depenses: Math.round(expByDate[d] || 0) })))

    setLoading(false)
  }

  const PERIODS: { key: Period; label: string }[] = [
    { key:'today', label:"Auj." }, { key:'week', label:'Semaine' },
    { key:'month', label:'Mois' }, { key:'year', label:'Année' }, { key:'custom', label:'Perso' },
  ]

  return (
    <div style={{ padding:32, maxWidth:1100 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300 }}>Comptabilité</h1>
        <div style={{ display:'flex', gap:4, background:T.beige, borderRadius:6, padding:4 }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} style={{
              padding:'7px 12px', borderRadius:4, border:'none', cursor:'pointer', fontSize:12, fontWeight:500,
              background: period === p.key ? T.black : 'transparent',
              color: period === p.key ? T.offwhite : T.muted,
              fontFamily:'Manrope,sans-serif',
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {period === 'custom' && (
        <div style={{ display:'flex', gap:12, marginBottom:20 }}>
          <div>
            <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:4 }}>Début</label>
            <input type="date" value={custom.debut} onChange={e => setCustom(c => ({ ...c, debut: e.target.value }))}
              style={{ padding:'9px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none' }} />
          </div>
          <div>
            <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:4 }}>Fin</label>
            <input type="date" value={custom.fin} onChange={e => setCustom(c => ({ ...c, fin: e.target.value }))}
              style={{ padding:'9px 12px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none' }} />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color:T.muted, fontSize:13 }}>Chargement...</div>
      ) : stats && (
        <>
          {/* KPI résultat */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
            {[
              { l:'CA encaissé', v:FDJ(stats.ca_encaisse), color:T.gold, bg:'#FBF7EE' },
              { l:'Dépenses', v:FDJ(stats.depenses), color:'#F44336', bg:'#FFF5F5' },
              { l:'Résultat net', v:FDJ(stats.resultat_net), color: stats.resultat_net >= 0 ? '#4CAF50' : '#F44336', bg: stats.resultat_net >= 0 ? '#F1FFF1' : '#FFF5F5' },
            ].map(c => (
              <div key={c.l} style={{ background:c.bg, border:`1px solid ${c.color}30`, borderRadius:8, padding:'24px 24px' }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', marginBottom:10 }}>{c.l}</div>
                <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300, color:c.color }}>{c.v}</div>
              </div>
            ))}
          </div>

          {/* Détail paiements */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
            {[
              { l:'Cash', v:FDJ(stats.ca_cash) },
              { l:'Digital', v:FDJ(stats.ca_digital) },
              { l:'RDV terminés', v:stats.nb_rdv.toString() },
              { l:'Panier moyen', v:FDJ(stats.panier_moyen) },
            ].map(c => (
              <div key={c.l} style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:6, padding:'16px 18px' }}>
                <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', marginBottom:6 }}>{c.l}</div>
                <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, fontWeight:300, color:T.black }}>{c.v}</div>
              </div>
            ))}
          </div>

          {/* Graphique CA vs Dépenses */}
          {caByDay.length > 0 && (
            <div style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:8, padding:24, marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', marginBottom:20 }}>CA vs Dépenses</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={caByDay}>
                  <defs>
                    <linearGradient id="gCa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.gold} stopOpacity={0.2}/><stop offset="95%" stopColor={T.gold} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F44336" stopOpacity={0.15}/><stop offset="95%" stopColor="#F44336" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize:10, fill:T.muted }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:T.muted }} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v/1000)+'k'}/>
                  <Tooltip formatter={(v) => FDJ(Number(v))} contentStyle={{ fontFamily:'Manrope,sans-serif', fontSize:12 }}/>
                  <Legend iconSize={8} wrapperStyle={{ fontSize:11 }}/>
                  <Area type="monotone" dataKey="ca" name="CA" stroke={T.gold} strokeWidth={2} fill="url(#gCa)"/>
                  <Area type="monotone" dataKey="depenses" name="Dépenses" stroke="#F44336" strokeWidth={1.5} fill="url(#gExp)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* CA par catégorie */}
            {caByCat.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:8, padding:24 }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', marginBottom:20 }}>CA par catégorie</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={caByCat.map(c => ({ name: c.categorie_nom, ca: c.ca_total }))}>
                    <XAxis dataKey="name" tick={{ fontSize:10, fill:T.muted }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize:10, fill:T.muted }} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v/1000)+'k'}/>
                    <Tooltip formatter={(v) => FDJ(Number(v))} contentStyle={{ fontFamily:'Manrope,sans-serif', fontSize:12 }}/>
                    <Bar dataKey="ca" fill={T.nude} radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* CA + commissions par employée */}
            {caByEmp.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:8, padding:24 }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', marginBottom:16 }}>Par employée</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {caByEmp.map((e, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:T.offwhite, borderRadius:4 }}>
                      <span style={{ fontSize:13, fontWeight:500, color:T.black }}>{e.employee_nom}</span>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:13, fontWeight:600, color:T.gold }}>{FDJ(e.ca_total)}</div>
                        {e.commission_due > 0 && <div style={{ fontSize:11, color:T.muted }}>Commission : {FDJ(e.commission_due)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
