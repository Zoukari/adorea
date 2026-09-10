'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import type { DashboardStats } from '@/types'

const T = {
  nude: '#D7B6B1', beige: '#EADCC8', gold: '#C9A96A',
  black: '#1A1A1A', offwhite: '#F9F6F2', muted: '#8A7A74',
}

const FDJ = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'

type Period = 'today' | 'week' | 'month' | 'year'

function getPeriodDates(period: Period): { debut: string; fin: string } {
  const now = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  if (period === 'today') return { debut: fmt(now), fin: fmt(now) }
  if (period === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay())
    return { debut: fmt(start), fin: fmt(now) }
  }
  if (period === 'month') {
    return { debut: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), fin: fmt(now) }
  }
  return { debut: fmt(new Date(now.getFullYear(), 0, 1)), fin: fmt(now) }
}

export default function AdminDashboard() {
  const supabase = createClient()
  const [period, setPeriod] = useState<Period>('month')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<{ name: string; ca: number }[]>([])
  const [catData, setCatData] = useState<{ name: string; ca: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [todayAppts, setTodayAppts] = useState<number>(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { debut, fin } = getPeriodDates(period)

      const [statsRes, catRes, apptTodayRes] = await Promise.all([
        supabase.rpc('get_dashboard_stats', { p_date_debut: debut, p_date_fin: fin }),
        supabase.rpc('get_ca_by_category', { p_date_debut: debut, p_date_fin: fin }),
        supabase.from('appointments')
          .select('id', { count: 'exact' })
          .eq('date_rdv', new Date().toISOString().split('T')[0])
          .not('statut', 'in', '(annulee,refusee,absente)'),
      ])

      if (statsRes.data) setStats(statsRes.data as DashboardStats)
      if (catRes.data) {
        setCatData((catRes.data as { categorie_nom: string; ca_total: number }[])
          .map(r => ({ name: r.categorie_nom, ca: r.ca_total })))
      }
      if (apptTodayRes.count !== null) setTodayAppts(apptTodayRes.count)

      // Données graphique CA sur 30 derniers jours (simplifié)
      const { data: rdvData } = await supabase
        .from('appointments')
        .select('date_rdv, prix_final')
        .gte('date_rdv', debut)
        .lte('date_rdv', fin)
        .eq('statut', 'terminee')

      if (rdvData) {
        const grouped: Record<string, number> = {}
        rdvData.forEach(r => {
          grouped[r.date_rdv] = (grouped[r.date_rdv] || 0) + r.prix_final
        })
        const sorted = Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, ca]) => ({
            name: date.slice(5),  // MM-DD
            ca: Math.round(ca),
          }))
        setChartData(sorted)
      }

      setLoading(false)
    }
    load()
  }, [period])

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'today', label: "Aujourd'hui" },
    { key: 'week', label: 'Semaine' },
    { key: 'month', label: 'Mois' },
    { key: 'year', label: 'Année' },
  ]

  const STAT_CARDS = stats ? [
    { label: 'CA encaissé', value: FDJ(stats.ca_encaisse), accent: T.gold, big: true },
    { label: 'Résultat net', value: FDJ(stats.resultat_net), accent: stats.resultat_net >= 0 ? '#4CAF50' : '#F44336' },
    { label: 'Dépenses', value: FDJ(stats.depenses), accent: T.nude },
    { label: 'Rendez-vous', value: stats.nb_rdv.toString(), accent: T.black },
    { label: 'Clientes', value: stats.nb_clientes.toString(), accent: T.muted },
    { label: 'Panier moyen', value: FDJ(stats.panier_moyen), accent: T.gold },
    { label: 'CA digital', value: FDJ(stats.ca_digital), accent: '#5C9BD6' },
    { label: 'RDV aujourd\'hui', value: todayAppts.toString(), accent: T.gold },
  ] : []

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 300, color: T.black }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {/* Period selector */}
        <div style={{ display: 'flex', gap: 4, background: T.beige, borderRadius: 6, padding: 4 }}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                padding: '7px 14px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                background: period === p.key ? T.black : 'transparent',
                color: period === p.key ? T.offwhite : T.muted,
                transition: 'all 0.15s',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: T.muted, fontSize: 14 }}>Chargement...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}>
            {STAT_CARDS.map(card => (
              <div key={card.label} style={{
                background: 'white',
                borderRadius: 8,
                padding: '20px 22px',
                border: `1px solid ${T.beige}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: T.muted, textTransform: 'uppercase', marginBottom: 10 }}>
                  {card.label}
                </div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: card.big ? 28 : 22,
                  fontWeight: 300,
                  color: card.accent,
                  lineHeight: 1.1,
                }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* CA Evolution */}
            <div style={{ background: 'white', borderRadius: 8, padding: 24, border: `1px solid ${T.beige}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: T.muted, textTransform: 'uppercase', marginBottom: 20 }}>
                Évolution CA
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.gold} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={T.gold} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} tickFormatter={v => (v/1000)+'k'} />
                    <Tooltip formatter={(v: number) => FDJ(v)} contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }} />
                    <Area type="monotone" dataKey="ca" stroke={T.gold} strokeWidth={2} fill="url(#caGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontSize: 13 }}>
                  Aucune donnée sur cette période
                </div>
              )}
            </div>

            {/* CA par catégorie */}
            <div style={{ background: 'white', borderRadius: 8, padding: 24, border: `1px solid ${T.beige}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: T.muted, textTransform: 'uppercase', marginBottom: 20 }}>
                CA par catégorie
              </div>
              {catData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={catData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} tickFormatter={v => (v/1000)+'k'} />
                    <Tooltip formatter={(v: number) => FDJ(v)} contentStyle={{ fontFamily: 'Manrope, sans-serif', fontSize: 12 }} />
                    <Bar dataKey="ca" fill={T.nude} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontSize: 13 }}>
                  Aucune donnée sur cette période
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
