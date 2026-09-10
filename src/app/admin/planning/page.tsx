'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Employee, EmployeeSchedule } from '@/types'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function getWeekDates(offset = 0): Date[] {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const fmt = (d: Date) => d.toISOString().split('T')[0]

export default function PlanningPage() {
  const supabase = createClient()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [schedules, setSchedules] = useState<Record<string, EmployeeSchedule>>({})
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [slotForm, setSlotForm] = useState({ debut: '09:00', fin: '19:00' })

  const weekDates = getWeekDates(weekOffset)

  useEffect(() => {
    supabase.from('employees').select('*').eq('actif', true).order('prenom')
      .then(({ data }) => {
        const emps = (data as Employee[]) || []
        setEmployees(emps)
        if (emps.length > 0 && !selectedEmp) setSelectedEmp(emps[0])
      })
  }, [])

  const loadSchedules = useCallback(async () => {
    if (!selectedEmp) return
    setLoading(true)
    const dates = weekDates.map(fmt)
    const { data } = await supabase
      .from('employee_schedules')
      .select('*, slots:schedule_slots(*)')
      .eq('employee_id', selectedEmp.id)
      .in('date_jour', dates)
    const map: Record<string, EmployeeSchedule> = {}
    ;(data as EmployeeSchedule[] || []).forEach(s => { map[s.date_jour] = s })
    setSchedules(map)
    setLoading(false)
  }, [selectedEmp, weekOffset])

  useEffect(() => { loadSchedules() }, [loadSchedules])

  async function toggleDay(date: Date, available: boolean) {
    if (!selectedEmp) return
    const dateStr = fmt(date)
    const existing = schedules[dateStr]
    if (existing) {
      await supabase.from('employee_schedules').update({ est_disponible: available }).eq('id', existing.id)
    } else {
      await supabase.from('employee_schedules').insert({ employee_id: selectedEmp.id, date_jour: dateStr, est_disponible: available })
    }
    loadSchedules()
  }

  async function addSlot(dateStr: string) {
    if (!selectedEmp) return
    let schedId = schedules[dateStr]?.id
    if (!schedId) {
      const { data } = await supabase.from('employee_schedules').insert({
        employee_id: selectedEmp.id, date_jour: dateStr, est_disponible: true
      }).select().single()
      schedId = data?.id
    }
    if (schedId) {
      await supabase.from('schedule_slots').insert({ schedule_id: schedId, heure_debut: slotForm.debut + ':00', heure_fin: slotForm.fin + ':00' })
      loadSchedules()
    }
    setEditing(null)
  }

  async function removeSlot(slotId: string) {
    await supabase.from('schedule_slots').delete().eq('id', slotId)
    loadSchedules()
  }

  async function duplicateWeek() {
    if (!selectedEmp) return
    const sourceDates = weekDates.map(fmt)
    const targetDates = getWeekDates(weekOffset + 1).map(fmt)
    await supabase.rpc('duplicate_schedule', {
      p_employee_id: selectedEmp.id,
      p_source_date: sourceDates[0],
      p_target_dates: targetDates,
    })
    setWeekOffset(w => w + 1)
  }

  async function addAbsence(dateStr: string, type: string) {
    if (!selectedEmp) return
    await supabase.from('employee_absences').insert({
      employee_id: selectedEmp.id,
      type_absence: type,
      date_debut: dateStr,
      date_fin: dateStr,
    })
    // Désactiver le jour
    await toggleDay(new Date(dateStr), false)
  }

  return (
    <div style={{ padding:32, maxWidth:1100 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300 }}>Planning</h1>
        <button onClick={duplicateWeek} style={{
          padding:'9px 18px', borderRadius:4, border:`1px solid ${T.beige}`,
          background:'white', cursor:'pointer', fontSize:12, fontWeight:500,
          color:T.muted, fontFamily:'Manrope,sans-serif',
        }}>Copier semaine suivante →</button>
      </div>

      {/* Sélection employé */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {employees.map(e => (
          <button key={e.id} onClick={() => setSelectedEmp(e)} style={{
            padding:'8px 16px', borderRadius:4, border:`1px solid ${selectedEmp?.id === e.id ? T.gold : T.beige}`,
            background: selectedEmp?.id === e.id ? '#FBF7EE' : 'white',
            cursor:'pointer', fontSize:12, fontWeight:500, fontFamily:'Manrope,sans-serif',
            color: selectedEmp?.id === e.id ? T.black : T.muted,
          }}>{e.prenom} {e.nom}</button>
        ))}
      </div>

      {/* Navigation semaine */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ background:'transparent', border:`1px solid ${T.beige}`, borderRadius:4, padding:'6px 14px', cursor:'pointer', fontSize:14, color:T.muted }}>←</button>
        <span style={{ fontSize:13, fontWeight:500, color:T.black }}>
          {weekDates[0].toLocaleDateString('fr-FR', { day:'numeric', month:'long' })} – {weekDates[6].toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
        </span>
        <button onClick={() => setWeekOffset(w => w + 1)} style={{ background:'transparent', border:`1px solid ${T.beige}`, borderRadius:4, padding:'6px 14px', cursor:'pointer', fontSize:14, color:T.muted }}>→</button>
        <button onClick={() => setWeekOffset(0)} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:11, color:T.muted, textDecoration:'underline' }}>Aujourd&apos;hui</button>
      </div>

      {loading ? (
        <div style={{ color:T.muted, fontSize:13 }}>Chargement...</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8 }}>
          {weekDates.map((date, i) => {
            const dateStr = fmt(date)
            const sched = schedules[dateStr]
            const isAvailable = sched?.est_disponible ?? false
            const isPast = date < new Date(new Date().setHours(0,0,0,0))
            const isToday = fmt(date) === fmt(new Date())

            return (
              <div key={i} style={{
                background: isPast ? T.offwhite : 'white',
                border: `1px solid ${isToday ? T.gold : T.beige}`,
                borderRadius:6, overflow:'hidden',
                opacity: isPast ? 0.6 : 1,
              }}>
                {/* Entête jour */}
                <div style={{
                  padding:'10px 12px', background: isAvailable && !isPast ? T.black : T.beige,
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color: isAvailable && !isPast ? T.gold : T.muted, textTransform:'uppercase' }}>{DAYS_FR[i]}</div>
                    <div style={{ fontSize:16, fontWeight:300, fontFamily:'Cormorant Garamond,serif', color: isAvailable && !isPast ? T.offwhite : T.black }}>{date.getDate()}</div>
                  </div>
                  {!isPast && (
                    <button onClick={() => toggleDay(date, !isAvailable)} style={{
                      width:24, height:24, borderRadius:12, border:'none', cursor:'pointer',
                      background: isAvailable ? '#4CAF50' : '#F44336', color:'white', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center',
                    }}>{isAvailable ? '✓' : '×'}</button>
                  )}
                </div>

                {/* Slots */}
                <div style={{ padding:8 }}>
                  {(sched?.slots || []).map((slot, j) => (
                    <div key={j} style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'5px 8px', background:T.offwhite, borderRadius:3, marginBottom:4, fontSize:11,
                    }}>
                      <span style={{ color:T.black, fontWeight:500 }}>
                        {(slot as { heure_debut: string }).heure_debut?.slice(0,5)}–{(slot as { heure_fin: string }).heure_fin?.slice(0,5)}
                      </span>
                      {!isPast && (
                        <button onClick={() => removeSlot((slot as { id: string }).id)} style={{ background:'transparent', border:'none', cursor:'pointer', color:T.muted, fontSize:13 }}>×</button>
                      )}
                    </div>
                  ))}

                  {/* Ajouter slot */}
                  {!isPast && isAvailable && (
                    editing === dateStr ? (
                      <div>
                        <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                          <input type="time" value={slotForm.debut} onChange={e => setSlotForm(f => ({ ...f, debut: e.target.value }))}
                            style={{ flex:1, padding:'4px 6px', border:`1px solid ${T.beige}`, borderRadius:3, fontSize:10, fontFamily:'Manrope,sans-serif', outline:'none' }} />
                          <input type="time" value={slotForm.fin} onChange={e => setSlotForm(f => ({ ...f, fin: e.target.value }))}
                            style={{ flex:1, padding:'4px 6px', border:`1px solid ${T.beige}`, borderRadius:3, fontSize:10, fontFamily:'Manrope,sans-serif', outline:'none' }} />
                        </div>
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={() => addSlot(dateStr)} style={{ flex:1, padding:'5px', borderRadius:3, border:'none', cursor:'pointer', background:T.gold, color:T.black, fontSize:10, fontWeight:600, fontFamily:'Manrope,sans-serif' }}>OK</button>
                          <button onClick={() => setEditing(null)} style={{ padding:'5px 8px', borderRadius:3, border:`1px solid ${T.beige}`, cursor:'pointer', background:'white', fontSize:10, color:T.muted, fontFamily:'Manrope,sans-serif' }}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setEditing(dateStr)} style={{
                        width:'100%', padding:'5px', borderRadius:3, border:`1px dashed ${T.nude}`,
                        background:'transparent', cursor:'pointer', fontSize:10, color:T.muted, fontFamily:'Manrope,sans-serif',
                      }}>+ Ajouter</button>
                    )
                  )}

                  {/* Absence rapide */}
                  {!isPast && (
                    <div style={{ marginTop:4 }}>
                      <select onChange={e => { if (e.target.value) { addAbsence(dateStr, e.target.value); e.target.value = '' }}}
                        style={{ width:'100%', padding:'4px 6px', border:`1px solid ${T.beige}`, borderRadius:3, fontSize:10, fontFamily:'Manrope,sans-serif', outline:'none', color:T.muted, background:'white' }}>
                        <option value="">Marquer absence...</option>
                        <option value="conge">Congé</option>
                        <option value="absence">Absence</option>
                        <option value="indisponibilite">Indispo</option>
                        <option value="rdv_perso">RDV perso</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
