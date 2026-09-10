'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Appointment, AppointmentStatus } from '@/types'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }
const FDJ = (n:number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  creee:'Créée', paiement_attendu:'Paiement attendu', paiement_envoye:'Paiement envoyé',
  a_valider:'À valider', confirmee:'Confirmée', cliente_arrivee:'Arrivée',
  en_cours:'En cours', terminee:'Terminée', annulee:'Annulée', absente:'Absente', refusee:'Refusée'
}
const STATUS_COLORS: Record<AppointmentStatus, string> = {
  creee:'#8A7A74', paiement_attendu:'#E6A817', paiement_envoye:'#5C9BD6',
  a_valider:'#E67817', confirmee:'#4CAF50', cliente_arrivee:'#4CAF50',
  en_cours:'#C9A96A', terminee:'#1A1A1A', annulee:'#F44336', absente:'#F44336', refusee:'#F44336'
}

export default function AppointmentsPage() {
  const supabase = createClient()
  const [appts, setAppts] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'today' | 'all'>('today')
  const [selected, setSelected] = useState<Appointment | null>(null)
  const today = new Date().toISOString().split('T')[0]

  async function load() {
    setLoading(true)
    let q = supabase
      .from('appointments')
      .select('*, client:clients(nom,prenom,telephone), service:services(nom_fr), employee:employees(nom,prenom)')
      .order('date_rdv', { ascending: false })
      .order('heure_debut', { ascending: true })
    if (view === 'today') q = q.eq('date_rdv', today)
    const { data } = await q.limit(100)
    setAppts((data as Appointment[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [view])

  async function updateStatus(id: string, statut: AppointmentStatus) {
    await supabase.from('appointments').update({ statut }).eq('id', id)
    await load(); setSelected(null)
  }

  async function validateHealth(id: string, validated: boolean) {
    await supabase.from('appointments').update({
      health_validated: validated,
      statut: validated ? 'confirmee' : 'refusee'
    }).eq('id', id)
    await load(); setSelected(null)
  }

  type ClientInfo = { nom: string; prenom: string; telephone: string }
  type ServiceInfo = { nom_fr: string }
  type EmployeeInfo = { nom: string; prenom: string }

  const c = (a: Appointment) => a.client as unknown as ClientInfo
  const s = (a: Appointment) => a.service as unknown as ServiceInfo
  const e = (a: Appointment) => a.employee as unknown as EmployeeInfo

  return (
    <div style={{ padding: '32px', maxWidth: 1100 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300 }}>Rendez-vous</h1>
        <div style={{ display:'flex', gap:6 }}>
          {(['today','all'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding:'8px 16px', borderRadius:4, border:'none', cursor:'pointer',
              background: view===v ? T.black : T.beige, color: view===v ? T.offwhite : T.muted,
              fontSize:12, fontWeight:500, fontFamily:'Manrope,sans-serif',
            }}>{v==='today' ? "Aujourd'hui" : 'Tous'}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{color:T.muted,fontSize:13}}>Chargement...</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {appts.length === 0 && <div style={{padding:40,textAlign:'center',color:T.muted,fontSize:13}}>Aucun rendez-vous</div>}
          {appts.map(a => (
            <div key={a.id} onClick={() => setSelected(a)} style={{
              display:'grid', gridTemplateColumns:'90px 1fr 1fr 1fr 120px 120px',
              gap:16, padding:'14px 18px', background:'white',
              border:`1px solid ${T.beige}`, borderRadius:6, cursor:'pointer', alignItems:'center',
            }}>
              <div style={{fontSize:12,fontWeight:600}}>
                {a.heure_debut?.slice(0,5)}<br/>
                <span style={{fontSize:10,color:T.muted,fontWeight:400}}>{a.date_rdv}</span>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:500}}>{c(a)?.prenom} {c(a)?.nom}</div>
                <div style={{fontSize:11,color:T.muted}}>{c(a)?.telephone}</div>
              </div>
              <div style={{fontSize:13}}>{s(a)?.nom_fr}</div>
              <div style={{fontSize:12,color:T.muted}}>{e(a)?.prenom} {e(a)?.nom}</div>
              <div style={{fontSize:13,fontWeight:600,color:T.gold}}>{FDJ(a.prix_final)}</div>
              <div style={{
                padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                background:`${STATUS_COLORS[a.statut]}18`, color:STATUS_COLORS[a.statut],
              }}>{STATUS_LABELS[a.statut]}</div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={{position:'fixed',inset:0,background:'rgba(26,26,26,0.65)',zIndex:500,display:'flex',justifyContent:'flex-end'}}
          onClick={() => setSelected(null)}>
          <div style={{width:420,height:'100%',background:T.offwhite,overflowY:'auto',padding:32}}
            onClick={ev => ev.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:24}}>
              <div>
                <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:22,fontWeight:300}}>
                  {c(selected)?.prenom} {c(selected)?.nom}
                </div>
                <div style={{fontSize:11,letterSpacing:'0.12em',color:T.muted,marginTop:2}}>RÉF. {selected.reference}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:20,color:T.muted}}>×</button>
            </div>

            {[
              {l:'Prestation', v:s(selected)?.nom_fr},
              {l:'Date', v:`${selected.date_rdv} · ${selected.heure_debut?.slice(0,5)} – ${selected.heure_fin?.slice(0,5)}`},
              {l:'Employée', v:`${e(selected)?.prenom} ${e(selected)?.nom}`},
              {l:'Montant', v:FDJ(selected.prix_final)},
              {l:'Paiement', v:selected.payment_method?.toUpperCase() || '—'},
              {l:'Statut', v:STATUS_LABELS[selected.statut]},
            ].map(row => (
              <div key={row.l} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:`1px solid ${T.beige}`}}>
                <span style={{fontSize:11,fontWeight:600,letterSpacing:'0.1em',color:T.muted,textTransform:'uppercase'}}>{row.l}</span>
                <span style={{fontSize:13}}>{row.v || '—'}</span>
              </div>
            ))}

            {selected.statut === 'a_valider' && (
              <div style={{background:'#FFF8E7',border:'1px solid #E6A817',borderRadius:6,padding:16,marginTop:20,marginBottom:4}}>
                <div style={{fontSize:12,fontWeight:600,color:'#B8830A',marginBottom:12}}>⚠ Validation santé requise</div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={() => validateHealth(selected.id, true)} style={{flex:1,padding:10,borderRadius:4,border:'none',cursor:'pointer',background:'#4CAF50',color:'white',fontSize:12,fontWeight:600,fontFamily:'Manrope,sans-serif'}}>Valider ✓</button>
                  <button onClick={() => validateHealth(selected.id, false)} style={{flex:1,padding:10,borderRadius:4,border:'none',cursor:'pointer',background:'#F44336',color:'white',fontSize:12,fontWeight:600,fontFamily:'Manrope,sans-serif'}}>Refuser ✗</button>
                </div>
              </div>
            )}

            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:20,marginBottom:20}}>
              {(['cliente_arrivee','en_cours','terminee','annulee','absente'] as AppointmentStatus[]).map(st => (
                <button key={st} onClick={() => updateStatus(selected.id, st)} style={{
                  padding:'8px 12px',borderRadius:4,border:`1px solid ${T.beige}`,
                  background:'white',cursor:'pointer',fontSize:11,fontWeight:500,color:STATUS_COLORS[st],fontFamily:'Manrope,sans-serif'
                }}>{STATUS_LABELS[st]}</button>
              ))}
            </div>

            <a href={`https://wa.me/${c(selected)?.telephone?.replace(/\D/g,'')}?text=${encodeURIComponent(
              `Bonjour ${c(selected)?.prenom},\n\nVotre rendez-vous ADORÉA :\nPrestation : ${s(selected)?.nom_fr}\nDate : ${selected.date_rdv}\nHeure : ${selected.heure_debut?.slice(0,5)}\nRéférence : ${selected.reference}\n\nÀ très bientôt ✨`
            )}`} target="_blank" rel="noopener noreferrer" style={{
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              padding:12,borderRadius:4,background:'#25D366',color:'white',
              textDecoration:'none',fontSize:13,fontWeight:600,
            }}>💬 Contacter sur WhatsApp</a>
          </div>
        </div>
      )}
    </div>
  )
}
