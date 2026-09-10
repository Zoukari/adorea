'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Client, Service, PaymentMethod } from '@/types'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }
const FDJ = (n:number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'

const PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key:'cac_pay', label:'CAC PAY' },
  { key:'waafi',   label:'WAAFI' },
  { key:'d_money', label:'D-MONEY' },
  { key:'cash',    label:'CASH' },
]

export default function CaissePage() {
  const supabase = createClient()
  const [step, setStep] = useState<1|2|3|4|5>(1)
  const [clientSearch, setClientSearch] = useState('')
  const [clientResult, setClientResult] = useState<Client | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [prix, setPrix] = useState(0)
  const [remise, setRemise] = useState(0)
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [heure, setHeure] = useState('09:00')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('services').select('*, category:categories(nom_fr)').eq('actif', true).order('ordre')
      .then(({ data }) => setServices((data as Service[]) || []))
  }, [])

  async function searchClient() {
    if (!clientSearch) return
    const { data } = await supabase.from('clients')
      .select('*').or(`telephone.eq.${clientSearch},nom.ilike.%${clientSearch}%`).limit(1).single()
    setClientResult(data as Client || null)
  }

  async function confirm() {
    if (!clientResult || !selectedService) return
    setLoading(true)
    const prixFinal = Math.max(0, prix - remise)

    const { data, error } = await supabase.rpc('create_appointment', {
      p_client_id:     clientResult.id,
      p_service_id:    selectedService.id,
      p_date:          date,
      p_heure_debut:   heure + ':00',
      p_payment_method: payMethod,
    })

    if (!error && data?.success) {
      // Marquer directement confirmé + paiement validé si caisse
      await supabase.from('appointments').update({
        statut: 'confirmee',
        prix_final: prixFinal,
        remise_fixe: remise > 0 ? remise : null,
        payment_status: 'valide',
      }).eq('id', data.appointment_id)

      setSuccess(data.reference)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{padding:32,maxWidth:480}}>
        <div style={{background:'white',border:`1px solid ${T.beige}`,borderRadius:8,padding:40,textAlign:'center'}}>
          <div style={{fontSize:40,marginBottom:16}}>✓</div>
          <div style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:300,marginBottom:8}}>Réservation créée</div>
          <div style={{fontSize:13,color:T.muted,marginBottom:24}}>Référence : <strong>{success}</strong></div>
          <button onClick={() => { setStep(1); setClientResult(null); setSelectedService(null); setPrix(0); setRemise(0); setSuccess(null) }}
            style={{padding:'12px 28px',borderRadius:4,border:'none',cursor:'pointer',background:T.black,color:T.offwhite,fontSize:13,fontWeight:600,fontFamily:'Manrope,sans-serif'}}>
            Nouveau RDV
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{padding:32,maxWidth:600}}>
      <h1 style={{fontFamily:'Cormorant Garamond,serif',fontSize:32,fontWeight:300,marginBottom:32}}>Caisse</h1>

      {/* Progress */}
      <div style={{display:'flex',gap:4,marginBottom:32}}>
        {[1,2,3,4,5].map(n => (
          <div key={n} style={{flex:1,height:3,borderRadius:2,background: step >= n ? T.gold : T.beige}} />
        ))}
      </div>

      {/* STEP 1 — Client */}
      {step === 1 && (
        <div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.15em',color:T.muted,textTransform:'uppercase',marginBottom:20}}>Rechercher une cliente</div>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            <input value={clientSearch} onChange={e => setClientSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && searchClient()}
              placeholder="Téléphone ou nom..."
              style={{flex:1,padding:'12px 16px',border:`1px solid ${T.beige}`,borderRadius:4,fontFamily:'Manrope,sans-serif',fontSize:14,outline:'none'}} />
            <button onClick={searchClient}
              style={{padding:'12px 20px',borderRadius:4,border:'none',cursor:'pointer',background:T.black,color:T.offwhite,fontSize:12,fontWeight:600,fontFamily:'Manrope,sans-serif'}}>
              Chercher
            </button>
          </div>
          {clientResult && (
            <div style={{background:'white',border:`1px solid ${T.gold}`,borderRadius:6,padding:16,marginBottom:16}}>
              <div style={{fontWeight:600,fontSize:14}}>{clientResult.prenom} {clientResult.nom}</div>
              <div style={{fontSize:12,color:T.muted}}>{clientResult.telephone} · {clientResult.total_prestations} prestation(s)</div>
            </div>
          )}
          {!clientResult && (
            <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Cliente introuvable ? Créez-la directement ici (redirige vers la fiche cliente).</div>
          )}
          <button onClick={() => clientResult && setStep(2)} disabled={!clientResult}
            style={{padding:'13px 28px',borderRadius:4,border:'none',cursor: clientResult ? 'pointer' : 'not-allowed',background: clientResult ? T.black : T.beige,color: clientResult ? T.offwhite : T.muted,fontSize:13,fontWeight:600,fontFamily:'Manrope,sans-serif'}}>
            Suivant
          </button>
        </div>
      )}

      {/* STEP 2 — Service */}
      {step === 2 && (
        <div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.15em',color:T.muted,textTransform:'uppercase',marginBottom:20}}>Choisir la prestation</div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
            {services.map(sv => (
              <button key={sv.id} onClick={() => { setSelectedService(sv); setPrix(sv.prix) }}
                style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',borderRadius:4,border:`1px solid ${selectedService?.id===sv.id ? T.gold : T.beige}`,background: selectedService?.id===sv.id ? '#FBF7EE' : 'white',cursor:'pointer',textAlign:'left',fontFamily:'Manrope,sans-serif'}}>
                <span style={{fontSize:13,fontWeight:500}}>{sv.nom_fr}</span>
                <span style={{fontSize:13,color:T.gold,fontWeight:600}}>{sv.prix_sur_devis ? 'Devis' : FDJ(sv.prix)}</span>
              </button>
            ))}
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={() => setStep(1)} style={{padding:'12px 20px',borderRadius:4,border:`1px solid ${T.beige}`,background:'white',cursor:'pointer',fontSize:12,color:T.muted,fontFamily:'Manrope,sans-serif'}}>←</button>
            <button onClick={() => selectedService && setStep(3)} disabled={!selectedService}
              style={{flex:1,padding:'13px',borderRadius:4,border:'none',cursor: selectedService ? 'pointer' : 'not-allowed',background: selectedService ? T.black : T.beige,color: selectedService ? T.offwhite : T.muted,fontSize:13,fontWeight:600,fontFamily:'Manrope,sans-serif'}}>
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Date / Heure */}
      {step === 3 && (
        <div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.15em',color:T.muted,textTransform:'uppercase',marginBottom:20}}>Date & heure</div>
          <div style={{display:'flex',gap:12,marginBottom:24}}>
            <div style={{flex:1}}>
              <label style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',color:T.muted,textTransform:'uppercase',display:'block',marginBottom:8}}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{width:'100%',padding:'12px 16px',border:`1px solid ${T.beige}`,borderRadius:4,fontFamily:'Manrope,sans-serif',fontSize:14,outline:'none'}} />
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',color:T.muted,textTransform:'uppercase',display:'block',marginBottom:8}}>Heure</label>
              <input type="time" value={heure} onChange={e => setHeure(e.target.value)}
                style={{width:'100%',padding:'12px 16px',border:`1px solid ${T.beige}`,borderRadius:4,fontFamily:'Manrope,sans-serif',fontSize:14,outline:'none'}} />
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={() => setStep(2)} style={{padding:'12px 20px',borderRadius:4,border:`1px solid ${T.beige}`,background:'white',cursor:'pointer',fontSize:12,color:T.muted,fontFamily:'Manrope,sans-serif'}}>←</button>
            <button onClick={() => setStep(4)}
              style={{flex:1,padding:'13px',borderRadius:4,border:'none',cursor:'pointer',background:T.black,color:T.offwhite,fontSize:13,fontWeight:600,fontFamily:'Manrope,sans-serif'}}>
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — Prix + remise */}
      {step === 4 && (
        <div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.15em',color:T.muted,textTransform:'uppercase',marginBottom:20}}>Prix & remise</div>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',color:T.muted,textTransform:'uppercase',display:'block',marginBottom:8}}>Prix (FDJ)</label>
            <input type="number" value={prix} onChange={e => setPrix(Number(e.target.value))}
              style={{width:'100%',padding:'12px 16px',border:`1px solid ${T.beige}`,borderRadius:4,fontFamily:'Manrope,sans-serif',fontSize:14,outline:'none'}} />
          </div>
          <div style={{marginBottom:24}}>
            <label style={{fontSize:11,fontWeight:600,letterSpacing:'0.12em',color:T.muted,textTransform:'uppercase',display:'block',marginBottom:8}}>Remise (FDJ)</label>
            <input type="number" value={remise} min={0} max={prix} onChange={e => setRemise(Number(e.target.value))}
              style={{width:'100%',padding:'12px 16px',border:`1px solid ${T.beige}`,borderRadius:4,fontFamily:'Manrope,sans-serif',fontSize:14,outline:'none'}} />
          </div>
          <div style={{background:T.beige,borderRadius:6,padding:'16px 20px',marginBottom:24,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:12,fontWeight:600,color:T.muted,letterSpacing:'0.1em',textTransform:'uppercase'}}>Total à payer</span>
            <span style={{fontFamily:'Cormorant Garamond,serif',fontSize:28,fontWeight:300,color:T.black}}>{FDJ(Math.max(0,prix-remise))}</span>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={() => setStep(3)} style={{padding:'12px 20px',borderRadius:4,border:`1px solid ${T.beige}`,background:'white',cursor:'pointer',fontSize:12,color:T.muted,fontFamily:'Manrope,sans-serif'}}>←</button>
            <button onClick={() => setStep(5)}
              style={{flex:1,padding:'13px',borderRadius:4,border:'none',cursor:'pointer',background:T.black,color:T.offwhite,fontSize:13,fontWeight:600,fontFamily:'Manrope,sans-serif'}}>
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* STEP 5 — Paiement */}
      {step === 5 && (
        <div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:'0.15em',color:T.muted,textTransform:'uppercase',marginBottom:20}}>Mode de paiement</div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
            {PAYMENT_METHODS.map(pm => {
              const disabled = pm.key==='cash' && clientResult?.total_prestations === 0
              return (
                <button key={pm.key} onClick={() => !disabled && setPayMethod(pm.key)} disabled={disabled}
                  style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',borderRadius:4,border:`1px solid ${payMethod===pm.key ? T.gold : T.beige}`,background: payMethod===pm.key ? '#FBF7EE' : 'white',cursor: disabled ? 'not-allowed' : 'pointer',opacity: disabled ? 0.4 : 1,fontFamily:'Manrope,sans-serif'}}>
                  <span style={{fontSize:13,fontWeight:500}}>{pm.label}</span>
                  {disabled && <span style={{fontSize:11,color:T.muted}}>Nouvelle cliente</span>}
                </button>
              )
            })}
          </div>

          {/* Récap */}
          <div style={{background:'white',border:`1px solid ${T.beige}`,borderRadius:6,padding:16,marginBottom:24}}>
            <div style={{fontSize:12,fontWeight:600,color:T.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Récapitulatif</div>
            {[
              {l:'Cliente', v:`${clientResult?.prenom} ${clientResult?.nom}`},
              {l:'Prestation', v:selectedService?.nom_fr || ''},
              {l:'Date', v:`${date} · ${heure}`},
              {l:'Total', v:FDJ(Math.max(0,prix-remise))},
              {l:'Paiement', v:PAYMENT_METHODS.find(p => p.key===payMethod)?.label || ''},
            ].map(r => (
              <div key={r.l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${T.beige}`}}>
                <span style={{fontSize:11,color:T.muted,textTransform:'uppercase',letterSpacing:'0.08em'}}>{r.l}</span>
                <span style={{fontSize:13,fontWeight:500}}>{r.v}</span>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:8}}>
            <button onClick={() => setStep(4)} style={{padding:'12px 20px',borderRadius:4,border:`1px solid ${T.beige}`,background:'white',cursor:'pointer',fontSize:12,color:T.muted,fontFamily:'Manrope,sans-serif'}}>←</button>
            <button onClick={confirm} disabled={loading}
              style={{flex:1,padding:'13px',borderRadius:4,border:'none',cursor:'pointer',background:T.gold,color:T.black,fontSize:13,fontWeight:600,fontFamily:'Manrope,sans-serif'}}>
              {loading ? 'Création...' : 'Confirmer le RDV'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
