'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Employee } from '@/types'

const T = { gold:'#C9A96A', black:'#1A1A1A', muted:'#8A7A74' }

const HOURS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
               '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00']

type Block = {
  id: string
  employee_id: string
  date_jour: string
  heure_debut: string | null
  heure_fin: string | null
  est_disponible: boolean
  notes: string | null
}

const iso = (d: Date) => {
  const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return x.toISOString().split('T')[0]
}
const fmtDay = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })
const hm = (t: string | null) => (t ? t.slice(0,5) : '')

export default function PlanningPage() {
  const supabase = createClient()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [empId, setEmpId] = useState<string>('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    const day = d.getDay()
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    d.setHours(0,0,0,0)
    return d
  })

  const [open, setOpen] = useState(false)
  const [fDate, setFDate] = useState(iso(new Date()))
  const [fMode, setFMode] = useState<'journee' | 'creneau'>('creneau')
  const [fStart, setFStart] = useState('09:00')
  const [fEnd, setFEnd] = useState('12:00')
  const [fNote, setFNote] = useState('')
  const [saving, setSaving] = useState(false)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return iso(d)
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: emps } = await supabase
      .from('employees').select('*').eq('actif', true).order('prenom')
    const list = (emps as Employee[]) || []
    setEmployees(list)

    const current = empId || list[0]?.id || ''
    if (!empId && current) setEmpId(current)

    if (current) {
      const { data } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('employee_id', current)
        .gte('date_jour', days[0])
        .lte('date_jour', days[6])
        .eq('est_disponible', false)
      setBlocks((data as Block[]) || [])
    } else {
      setBlocks([])
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empId, weekStart])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!empId) return
    setSaving(true)
    const payload: Record<string, string | boolean | null> = {
      employee_id: empId,
      date_jour: fDate,
      heure_debut: fMode === 'journee' ? null : fStart + ':00',
      heure_fin:   fMode === 'journee' ? null : fEnd + ':00',
      est_disponible: false,
      notes: fNote || null,
    }
    await supabase.from('employee_schedules').insert(payload)
    setSaving(false)
    setOpen(false)
    setFNote('')
    load()
  }

  async function remove(id: string) {
    await supabase.from('employee_schedules').delete().eq('id', id)
    load()
  }

  function openFor(date: string) {
    setFDate(date); setFMode('creneau'); setFStart('09:00'); setFEnd('12:00'); setFNote('')
    setOpen(true)
  }

  function shiftWeek(dir: -1 | 1) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + dir * 7)
    setWeekStart(d)
  }

  const byDay = (date: string) => blocks.filter(b => b.date_jour === date)
  const todayStr = iso(new Date())

  return (
    <div className="pg" style={{ padding:'26px 26px 60px' }}>
      <div className="ph">
        <div>
          <h1>Planning</h1>
          <div className="sub">Marquez les créneaux où l&apos;équipe n&apos;est pas disponible</div>
        </div>
        <button className="b-gold" onClick={() => openFor(todayStr)}>+ Indisponibilité</button>
      </div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
        {employees.map(e => (
          <button key={e.id} className={`chip${empId === e.id ? ' on' : ''}`}
            onClick={() => setEmpId(e.id)}>
            {e.prenom} {e.nom}
          </button>
        ))}
        {employees.length === 0 && !loading && (
          <div style={{ fontSize:12, color:T.muted }}>
            Aucune employée active — ajoutez-en dans Équipe.
          </div>
        )}
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, gap:10 }}>
        <button className="b-icon" onClick={() => shiftWeek(-1)}>‹</button>
        <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:T.black, textAlign:'center' }}>
          {new Date(days[0]+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}
          {' – '}
          {new Date(days[6]+'T00:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
        </div>
        <button className="b-icon" onClick={() => shiftWeek(1)}>›</button>
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 }}>
          {Array.from({length:7}).map((_,i) => <div key={i} className="skel" style={{height:150}}/>)}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 }}>
          {days.map(d => {
            const items = byDay(d)
            const isToday = d === todayStr
            const fullDay = items.some(i => !i.heure_debut)
            return (
              <div key={d} style={{
                background:'#fff',
                border:`1.5px solid ${isToday ? T.gold : '#EFE6DC'}`,
                borderRadius:16, padding:'13px 12px', minHeight:150,
                display:'flex', flexDirection:'column',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:11, fontWeight:600, color: isToday ? T.gold : T.muted, textTransform:'capitalize' }}>
                    {fmtDay(d)}
                  </span>
                  <button className="b-icon" style={{ width:24, height:24, fontSize:13, borderRadius:8 }}
                    onClick={() => openFor(d)}>+</button>
                </div>

                {fullDay ? (
                  <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span className="badge" style={{ background:'#FDECEC', color:'#C62828' }}>Journée fermée</span>
                  </div>
                ) : items.length === 0 ? (
                  <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:11, color:'#C9BDB2' }}>Disponible</div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {items.map(b => (
                      <div key={b.id} style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between', gap:6,
                        background:'#FDF0F0', border:'1px solid #F5D9D9', borderRadius:9, padding:'6px 8px',
                      }}>
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:'#C62828' }}>
                            {hm(b.heure_debut)} – {hm(b.heure_fin)}
                          </div>
                          {b.notes && <div style={{ fontSize:9.5, color:'#A87070' }}>{b.notes}</div>}
                        </div>
                        <button onClick={() => remove(b.id)} style={{
                          background:'transparent', border:'none', color:'#C62828', fontSize:14, padding:0, lineHeight:1,
                        }}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                {items.length > 0 && (
                  <button className="b-ghost" style={{ marginTop:'auto', padding:'6px 10px', fontSize:10.5 }}
                    onClick={() => items.forEach(i => remove(i.id))}>
                    Tout libérer
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {open && (
        <div className="ovl" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="mdl">
            <div className="mdl-h">
              <h3>Marquer une indisponibilité</h3>
              <button className="b-icon" onClick={() => setOpen(false)}>×</button>
            </div>

            <label className="lbl">Date</label>
            <input className="f" type="date" value={fDate} onChange={e => setFDate(e.target.value)} />

            <div style={{ height:14 }} />
            <label className="lbl">Type</label>
            <div style={{ display:'flex', gap:6, marginBottom:14 }}>
              <button className={`chip${fMode === 'creneau' ? ' on' : ''}`} style={{ flex:1 }}
                onClick={() => setFMode('creneau')}>Créneau précis</button>
              <button className={`chip${fMode === 'journee' ? ' on' : ''}`} style={{ flex:1 }}
                onClick={() => setFMode('journee')}>Journée entière</button>
            </div>

            {fMode === 'creneau' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                <div>
                  <label className="lbl">De</label>
                  <select className="f" value={fStart} onChange={e => setFStart(e.target.value)}>
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="lbl">À</label>
                  <select className="f" value={fEnd} onChange={e => setFEnd(e.target.value)}>
                    {HOURS.filter(h => h > fStart).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            )}

            <label className="lbl">Motif (optionnel)</label>
            <input className="f" value={fNote} onChange={e => setFNote(e.target.value)}
              placeholder="Formation, congé, rendez-vous personnel..." />

            <div style={{ display:'flex', gap:9, marginTop:20 }}>
              <button className="b-ghost" onClick={() => setOpen(false)}>Annuler</button>
              <button className="b-primary" style={{ flex:1 }} onClick={save}
                disabled={saving || !empId || (fMode === 'creneau' && fEnd <= fStart)}>
                {saving ? 'Enregistrement...' : 'Bloquer ce créneau'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
