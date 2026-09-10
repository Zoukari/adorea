'use client'
import { useState, useEffect } from 'react'
import { useAvailableDays, useAvailableSlots } from '@/hooks/useAvailableSlots'

const C = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }
const DAYS_FR = ['L','M','M','J','V','S','D']

interface Props {
  serviceId: string
  onSelect: (date: string, slot: { heure_debut: string; heure_fin: string }) => void
  lang?: 'FR' | 'EN' | 'AR'
}

export default function CalendarPicker({ serviceId, onSelect, lang = 'FR' }: Props) {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const { days, loading: daysLoading }   = useAvailableDays(serviceId, year, month)
  const { slots, loading: slotsLoading } = useAvailableSlots(serviceId, selectedDate)

  const monthLabel = new Date(year, month - 1, 1)
    .toLocaleDateString(lang === 'AR' ? 'ar' : lang === 'EN' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' })

  // Jours du mois
  const firstDay = new Date(year, month - 1, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate()
  const offset = firstDay === 0 ? 6 : firstDay - 1 // lundi = 0

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  const availSet = new Set(days.filter(d => d.a_des_creneaux).map(d => d.jour))
  const todayStr = now.toISOString().split('T')[0]

  return (
    <div>
      {/* En-tête mois */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <button onClick={prevMonth} style={{ background:'transparent', border:`1px solid ${C.beige}`, borderRadius:10, width:32, height:32, cursor:'pointer', color:C.muted, fontSize:14 }}>‹</button>
        <div style={{ fontSize:13, fontWeight:500, color:C.black, textTransform:'capitalize' }}>{monthLabel}</div>
        <button onClick={nextMonth} style={{ background:'transparent', border:`1px solid ${C.beige}`, borderRadius:10, width:32, height:32, cursor:'pointer', color:C.muted, fontSize:14 }}>›</button>
      </div>

      {/* Jours de la semaine */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:6 }}>
        {DAYS_FR.map((d, i) => (
          <div key={i} style={{ textAlign:'center', fontSize:10, fontWeight:600, color:C.muted, padding:'4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Grille */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:20 }}>
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day  = i + 1
          const str  = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const past = str < todayStr
          const avail = !past && (daysLoading ? false : availSet.has(str))
          const sel   = selectedDate === str
          return (
            <button key={day} onClick={() => avail && setSelectedDate(str)} disabled={!avail}
              style={{
                width:'100%', aspectRatio:'1', borderRadius:12, border:'none',
                cursor: avail ? 'pointer' : 'default',
                background: sel ? C.gold : avail ? C.offwhite : 'transparent',
                color: sel ? C.black : avail ? C.black : C.beige,
                fontSize:13, fontWeight: sel ? 600 : 400,
                transition:'all 0.15s ease',
              }}>
              {day}
            </button>
          )
        })}
      </div>

      {/* Créneaux */}
      {selectedDate && (
        <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.15em', color:C.muted, textTransform:'uppercase', marginBottom:12 }}>
            {lang === 'AR' ? 'الأوقات المتاحة' : lang === 'EN' ? 'Available slots' : 'Créneaux disponibles'}
          </div>
          {slotsLoading ? (
            <div style={{ color:C.muted, fontSize:12 }}>
              {lang === 'AR' ? 'جارٍ التحميل...' : lang === 'EN' ? 'Loading...' : 'Chargement...'}
            </div>
          ) : slots.length === 0 ? (
            <div style={{ color:C.muted, fontSize:12 }}>
              {lang === 'AR' ? 'لا توجد أوقات متاحة' : lang === 'EN' ? 'No slots available' : 'Aucun créneau disponible'}
            </div>
          ) : (
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {slots.map((slot, i) => (
                <button key={i}
                  onClick={() => onSelect(selectedDate, { heure_debut: slot.heure_debut, heure_fin: slot.heure_fin })}
                  style={{
                    padding:'8px 16px', borderRadius:100, border:`1.5px solid ${C.nude}`,
                    background:C.offwhite, cursor:'pointer', fontSize:12, fontWeight:500,
                    color:C.black, fontFamily:'Manrope,sans-serif', transition:'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.background = C.gold; (e.target as HTMLElement).style.borderColor = C.gold }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.background = C.offwhite; (e.target as HTMLElement).style.borderColor = C.nude }}
                >
                  {slot.heure_debut.slice(0,5)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
