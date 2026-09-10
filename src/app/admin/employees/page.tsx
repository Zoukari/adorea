'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Employee, Service, UserRole } from '@/types'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }

const ROLES: { key: UserRole; label: string }[] = [
  { key:'super_admin', label:'Super Admin' },
  { key:'manager',     label:'Manager' },
  { key:'employe',     label:'Employée' },
  { key:'caisse',      label:'Caisse' },
]

const EMPTY_EMP: Partial<Employee> = {
  nom:'', prenom:'', email:'', telephone:'', role:'employe',
  actif:true, commission_on:false, commission_pct:undefined, commission_fixe:undefined,
}

export default function EmployeesPage() {
  const supabase = createClient()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [services, setServices]   = useState<Service[]>([])
  const [selected, setSelected]   = useState<Employee | null>(null)
  const [empServices, setEmpServices] = useState<string[]>([])
  const [loading, setLoading]     = useState(true)
  const [adding, setAdding]       = useState(false)
  const [form, setForm]           = useState<Partial<Employee>>(EMPTY_EMP)
  const [saving, setSaving]       = useState(false)
  const [tab, setTab]             = useState<'info'|'prestations'|'commissions'>('info')

  async function load() {
    setLoading(true)
    const [empRes, srvRes] = await Promise.all([
      supabase.from('employees').select('*').order('prenom'),
      supabase.from('services').select('*, category:categories(nom_fr)').eq('actif', true).order('ordre'),
    ])
    setEmployees((empRes.data as Employee[]) || [])
    setServices((srvRes.data as Service[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function openEmployee(e: Employee) {
    setSelected(e)
    setForm(e)
    setTab('info')
    const { data } = await supabase
      .from('employee_services')
      .select('service_id')
      .eq('employee_id', e.id)
    setEmpServices((data || []).map((r: { service_id: string }) => r.service_id))
  }

  async function saveEmployee() {
    if (!form.nom || !form.prenom) return
    setSaving(true)
    if (selected) {
      await supabase.from('employees').update({
        nom: form.nom, prenom: form.prenom, email: form.email || null,
        telephone: form.telephone || null, role: form.role,
        actif: form.actif, commission_on: form.commission_on,
        commission_pct: form.commission_on ? form.commission_pct || null : null,
        commission_fixe: form.commission_on ? form.commission_fixe || null : null,
        notes_internes: form.notes_internes || null,
        whatsapp_number: form.whatsapp_number || null,
      }).eq('id', selected.id)
    } else {
      await supabase.from('employees').insert({
        nom: form.nom, prenom: form.prenom, email: form.email || null,
        telephone: form.telephone || null, role: form.role || 'employe',
        actif: true, commission_on: form.commission_on || false,
      })
    }
    setAdding(false); setSelected(null); load()
    setSaving(false)
  }

  async function toggleService(svcId: string) {
    if (!selected) return
    if (empServices.includes(svcId)) {
      await supabase.from('employee_services').delete()
        .eq('employee_id', selected.id).eq('service_id', svcId)
      setEmpServices(s => s.filter(id => id !== svcId))
    } else {
      await supabase.from('employee_services').insert({ employee_id: selected.id, service_id: svcId })
      setEmpServices(s => [...s, svcId])
    }
  }

  async function toggleActive(id: string, actif: boolean) {
    await supabase.from('employees').update({ actif }).eq('id', id)
    load()
  }

  const roleLabel = (r: string) => ROLES.find(x => x.key === r)?.label || r

  type ServiceWithCat = Service & { category?: { nom_fr: string } }

  // Grouper services par catégorie
  const svcByCategory = services.reduce((acc: Record<string, ServiceWithCat[]>, sv) => {
    const cat = (sv as ServiceWithCat).category?.nom_fr || 'Autre'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(sv as ServiceWithCat)
    return acc
  }, {})

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* LEFT — Liste */}
      <div style={{ width:300, background:'white', borderRight:`1px solid ${T.beige}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'24px 20px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${T.beige}` }}>
          <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:24, fontWeight:300 }}>Équipe</h1>
          <button onClick={() => { setAdding(true); setSelected(null); setForm(EMPTY_EMP) }} style={{
            padding:'7px 14px', borderRadius:4, border:'none', cursor:'pointer',
            background:T.black, color:T.offwhite, fontSize:11, fontWeight:600, fontFamily:'Manrope,sans-serif',
          }}>+</button>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:20, color:T.muted, fontSize:13 }}>Chargement...</div>
          ) : employees.map(e => (
            <div key={e.id} onClick={() => openEmployee(e)} style={{
              padding:'14px 20px', cursor:'pointer', borderBottom:`1px solid ${T.beige}`,
              background: selected?.id === e.id ? T.offwhite : 'white',
              borderLeft: selected?.id === e.id ? `3px solid ${T.gold}` : '3px solid transparent',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:500, color: e.actif ? T.black : T.muted }}>
                    {e.prenom} {e.nom}
                  </div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{roleLabel(e.role)}</div>
                </div>
                <div style={{
                  width:8, height:8, borderRadius:4,
                  background: e.actif ? '#4CAF50' : '#ccc',
                }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Détail / Formulaire */}
      <div style={{ flex:1, overflowY:'auto', background:T.offwhite }}>
        {!selected && !adding && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:T.muted, fontSize:13 }}>
            Sélectionner un membre de l&apos;équipe
          </div>
        )}

        {/* Formulaire ajout / édition */}
        {(adding || (selected && tab === 'info')) && (
          <div style={{ padding:40, maxWidth:560 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
              <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:28, fontWeight:300 }}>
                {adding ? 'Nouvelle employée' : `${selected?.prenom} ${selected?.nom}`}
              </h2>
              <div style={{ display:'flex', gap:8 }}>
                {selected && !adding && (
                  <button onClick={() => toggleActive(selected.id, !selected.actif)} style={{
                    padding:'8px 14px', borderRadius:4, border:`1px solid ${selected.actif ? '#F44336' : '#4CAF50'}`,
                    background:'transparent', cursor:'pointer', fontSize:11, fontWeight:600,
                    color: selected.actif ? '#F44336' : '#4CAF50', fontFamily:'Manrope,sans-serif',
                  }}>{selected.actif ? 'Désactiver' : 'Activer'}</button>
                )}
                {adding && (
                  <button onClick={() => { setAdding(false); setSelected(null) }} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:20, color:T.muted }}>×</button>
                )}
              </div>
            </div>

            {/* Tabs si édition */}
            {selected && !adding && (
              <div style={{ display:'flex', gap:2, background:'white', borderRadius:6, padding:4, border:`1px solid ${T.beige}`, marginBottom:24 }}>
                {(['info','prestations','commissions'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    flex:1, padding:'8px 4px', borderRadius:4, border:'none', cursor:'pointer',
                    background: tab === t ? T.black : 'transparent',
                    color: tab === t ? T.offwhite : T.muted,
                    fontSize:11, fontWeight:500, fontFamily:'Manrope,sans-serif',
                  }}>{t === 'info' ? 'Infos' : t === 'prestations' ? 'Prestations' : 'Commissions'}</button>
                ))}
              </div>
            )}

            {/* Champs info */}
            {[
              { key:'prenom', label:'Prénom *', type:'text' },
              { key:'nom',    label:'Nom *',    type:'text' },
              { key:'email',  label:'Email',    type:'email' },
              { key:'telephone', label:'Téléphone', type:'tel' },
              { key:'whatsapp_number', label:'WhatsApp (optionnel)', type:'tel' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>{f.label}</label>
                <input type={f.type}
                  value={(form as Record<string, string | undefined>)[f.key] || ''}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width:'100%', padding:'11px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white' }} />
              </div>
            ))}

            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Rôle</label>
              <select value={form.role || 'employe'} onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))}
                style={{ width:'100%', padding:'11px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none', background:'white', color:T.black }}>
                {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Notes internes</label>
              <textarea value={form.notes_internes || ''} onChange={e => setForm(p => ({ ...p, notes_internes: e.target.value }))}
                style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, resize:'vertical', minHeight:80, outline:'none', background:'white' }} />
            </div>

            <button onClick={saveEmployee} disabled={saving} style={{
              width:'100%', padding:'13px', borderRadius:4, border:'none', cursor:'pointer',
              background:T.black, color:T.offwhite, fontSize:13, fontWeight:600, fontFamily:'Manrope,sans-serif',
            }}>{saving ? 'Enregistrement...' : selected ? 'Sauvegarder' : 'Créer'}</button>
          </div>
        )}

        {/* Tab Prestations */}
        {selected && !adding && tab === 'prestations' && (
          <div style={{ padding:40, maxWidth:600 }}>
            <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:26, fontWeight:300, marginBottom:8 }}>Prestations autorisées</h2>
            <p style={{ fontSize:12, color:T.muted, marginBottom:24 }}>Cochez les prestations que {selected.prenom} est autorisée à réaliser.</p>
            {Object.entries(svcByCategory).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom:20 }}>
                <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.15em', color:T.gold, textTransform:'uppercase', marginBottom:10 }}>{cat}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {items.map(sv => {
                    const checked = empServices.includes(sv.id)
                    return (
                      <div key={sv.id} onClick={() => toggleService(sv.id)} style={{
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                        padding:'12px 16px', background:'white', border:`1px solid ${checked ? T.gold : T.beige}`,
                        borderRadius:6, cursor:'pointer', transition:'border-color 0.15s',
                      }}>
                        <span style={{ fontSize:13, color:T.black }}>{sv.nom_fr}</span>
                        <div style={{
                          width:20, height:20, borderRadius:4, border:`2px solid ${checked ? T.gold : T.beige}`,
                          background: checked ? T.gold : 'white', display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:12, color:'white', transition:'all 0.15s',
                        }}>{checked ? '✓' : ''}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Commissions */}
        {selected && !adding && tab === 'commissions' && (
          <div style={{ padding:40, maxWidth:500 }}>
            <h2 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:26, fontWeight:300, marginBottom:24 }}>Commissions</h2>

            <div style={{ background:'white', border:`1px solid ${T.beige}`, borderRadius:8, padding:24, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <span style={{ fontSize:13, fontWeight:500, color:T.black }}>Commission activée</span>
                <div style={{
                  width:44, height:24, borderRadius:12, cursor:'pointer', position:'relative',
                  background: form.commission_on ? T.gold : T.beige, transition:'background 0.2s',
                }} onClick={() => setForm(p => ({ ...p, commission_on: !p.commission_on }))}>
                  <div style={{ width:18, height:18, borderRadius:9, background:'white', position:'absolute', top:3, transition:'left 0.2s', left: form.commission_on ? 23 : 3 }}/>
                </div>
              </div>

              {form.commission_on && (
                <>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Commission % (sur le CA)</label>
                    <input type="number" min={0} max={100} value={form.commission_pct || ''} onChange={e => setForm(p => ({ ...p, commission_pct: Number(e.target.value) || undefined, commission_fixe: undefined }))}
                      style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none' }} />
                  </div>
                  <div style={{ fontSize:11, color:T.muted, marginBottom:14, textAlign:'center' }}>— OU —</div>
                  <div>
                    <label style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', color:T.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Commission fixe (FDJ par prestation)</label>
                    <input type="number" min={0} value={form.commission_fixe || ''} onChange={e => setForm(p => ({ ...p, commission_fixe: Number(e.target.value) || undefined, commission_pct: undefined }))}
                      style={{ width:'100%', padding:'10px 14px', border:`1px solid ${T.beige}`, borderRadius:4, fontFamily:'Manrope,sans-serif', fontSize:13, outline:'none' }} />
                  </div>
                </>
              )}
            </div>

            <button onClick={saveEmployee} disabled={saving} style={{
              width:'100%', padding:'13px', borderRadius:4, border:'none', cursor:'pointer',
              background:T.black, color:T.offwhite, fontSize:13, fontWeight:600, fontFamily:'Manrope,sans-serif',
            }}>{saving ? 'Enregistrement...' : 'Sauvegarder'}</button>
          </div>
        )}
      </div>
    </div>
  )
}
