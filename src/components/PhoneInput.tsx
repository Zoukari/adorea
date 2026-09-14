'use client'
import { useState, useRef, useEffect } from 'react'

export const COUNTRIES = [
  { code:'DJ', dial:'+253', flag:'🇩🇯', name:'Djibouti' },
  { code:'FR', dial:'+33',  flag:'🇫🇷', name:'France' },
  { code:'BE', dial:'+32',  flag:'🇧🇪', name:'Belgique' },
  { code:'ET', dial:'+251', flag:'🇪🇹', name:'Éthiopie' },
  { code:'SO', dial:'+252', flag:'🇸🇴', name:'Somalie' },
  { code:'SA', dial:'+966', flag:'🇸🇦', name:'Arabie Saoudite' },
  { code:'AE', dial:'+971', flag:'🇦🇪', name:'Émirats' },
  { code:'QA', dial:'+974', flag:'🇶🇦', name:'Qatar' },
  { code:'KE', dial:'+254', flag:'🇰🇪', name:'Kenya' },
  { code:'CA', dial:'+1',   flag:'🇨🇦', name:'Canada' },
  { code:'US', dial:'+1',   flag:'🇺🇸', name:'États-Unis' },
  { code:'GB', dial:'+44',  flag:'🇬🇧', name:'Royaume-Uni' },
  { code:'CH', dial:'+41',  flag:'🇨🇭', name:'Suisse' },
  { code:'TR', dial:'+90',  flag:'🇹🇷', name:'Turquie' },
  { code:'EG', dial:'+20',  flag:'🇪🇬', name:'Égypte' },
  { code:'MA', dial:'+212', flag:'🇲🇦', name:'Maroc' },
]

/** Découpe un numéro E.164 en indicatif + reste */
export function splitPhone(full: string): { dial: string; rest: string } {
  const v = (full || '').replace(/\s/g, '')
  const sorted = [...COUNTRIES].sort((a,b) => b.dial.length - a.dial.length)
  for (const c of sorted) {
    if (v.startsWith(c.dial)) return { dial: c.dial, rest: v.slice(c.dial.length) }
  }
  return { dial: '+253', rest: v.replace(/^\+/, '') }
}

type Props = {
  value: string
  onChange: (full: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  /** true = style landing (fond blanc, radius 14) ; false = style admin */
  landing?: boolean
}

export default function PhoneInput({
  value, onChange, placeholder = '77 59 61 59',
  className = 'f', autoFocus, landing = false,
}: Props) {
  const init = splitPhone(value)
  const [dial, setDial] = useState(init.dial)
  const [rest, setRest] = useState(init.rest)
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const s = splitPhone(value)
    if (s.dial !== dial || s.rest !== rest) { setDial(s.dial); setRest(s.rest) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const current = COUNTRIES.find(c => c.dial === dial) || COUNTRIES[0]

  function emit(d: string, r: string) {
    const clean = r.replace(/[^\d]/g, '')
    onChange(clean ? d + clean : '')
  }

  const border = landing ? '1.5px solid #DDD0BE' : '1.5px solid #E5DACE'
  const radius = landing ? 14 : 12

  return (
    <div ref={box} style={{ position:'relative', display:'flex', gap:6 }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:5, padding:'0 11px',
          border, borderRadius: radius, background:'#fff', cursor:'pointer',
          fontFamily:'inherit', fontSize:13, color:'#1A1A1A', flexShrink:0,
          minHeight: landing ? 46 : 42,
        }}>
        <span style={{ fontSize:15 }}>{current.flag}</span>
        <span style={{ fontWeight:500 }}>{current.dial}</span>
        <span style={{ fontSize:9, opacity:.5, marginLeft:1 }}>▾</span>
      </button>

      <input
        className={className}
        type="tel"
        inputMode="numeric"
        autoFocus={autoFocus}
        value={rest}
        placeholder={placeholder}
        onChange={e => {
          const r = e.target.value.replace(/[^\d\s]/g, '')
          setRest(r); emit(dial, r)
        }}
        style={{ marginBottom:0, flex:1, minWidth:0 }}
      />

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 5px)', left:0, zIndex:60,
          background:'#fff', border, borderRadius:14, overflow:'hidden',
          maxHeight:240, overflowY:'auto', minWidth:210,
          boxShadow:'0 10px 34px rgba(26,26,26,.16)',
        }}>
          {COUNTRIES.map(c => (
            <button key={c.code} type="button"
              onClick={() => { setDial(c.dial); emit(c.dial, rest); setOpen(false) }}
              style={{
                display:'flex', alignItems:'center', gap:9, width:'100%',
                padding:'10px 13px', border:'none',
                background: c.dial === dial ? '#FBF5EC' : 'transparent',
                cursor:'pointer', fontFamily:'inherit', fontSize:12.5,
                color:'#1A1A1A', textAlign:'left',
              }}>
              <span style={{ fontSize:15 }}>{c.flag}</span>
              <span style={{ flex:1 }}>{c.name}</span>
              <span style={{ color:'#8A7A74', fontSize:11.5 }}>{c.dial}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
