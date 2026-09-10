'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const C = {
  nude: '#D7B6B1', beige: '#EADCC8', gold: '#C9A96A',
  black: '#1A1A1A', offwhite: '#F9F6F2', muted: '#8A7A74',
}

interface ApptData {
  reference: string
  date_rdv: string
  heure_debut: string
  heure_fin: string
  statut: string
  prix_final: number
  needs_health_validation: boolean
  service: { nom_fr: string }
  client: { prenom: string; nom: string }
}

function ConfirmationContent() {
  const params = useSearchParams()
  const ref    = params.get('ref')
  const [appt, setAppt] = useState<ApptData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ref) { setLoading(false); return }
    fetch(`/api/booking?ref=${ref}`)
      .then(r => r.json())
      .then(d => { setAppt(d.appointment); setLoading(false) })
      .catch(() => setLoading(false))
  }, [ref])

  const FDJ = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FDJ'

  const waCalendar = (a: ApptData) => {
    const msg = `Bonjour,\n\nJe souhaite ajouter mon rendez-vous ADORÉA à mon calendrier.\n\nPrestation : ${a.service?.nom_fr}\nDate : ${a.date_rdv}\nHeure : ${a.heure_debut?.slice(0,5)}\nRéférence : ${a.reference}`
    return `https://wa.me/25377596159?text=${encodeURIComponent(msg)}`
  }

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background: C.offwhite }}>
        <div style={{ width:32, height:32, borderRadius:'50%', border:`2px solid ${C.beige}`, borderTopColor: C.gold, animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background: C.offwhite, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Manrope:wght@400;500;600&display=swap');`}</style>

      <div style={{ width:'100%', maxWidth:440 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:28, fontWeight:300, color: C.black }}>ADORÉA</div>
          <div style={{ fontSize:10, letterSpacing:'0.18em', color: C.muted, marginTop:3, textTransform:'uppercase' }}>PMU · Makeup Pro · Nails</div>
        </div>

        {/* Carte confirmation */}
        <div style={{ background:'white', borderRadius:28, padding:36, boxShadow:'0 8px 40px rgba(26,26,26,0.08)' }}>

          {!appt ? (
            // Fallback sans RDV en DB (nouveau booking)
            <>
              <div style={{ textAlign:'center', marginBottom:28 }}>
                <div style={{ width:64, height:64, borderRadius:'50%', background:`${C.gold}18`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:28 }}>✓</div>
                <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300, color: C.black, marginBottom:8 }}>
                  Demande enregistrée
                </h1>
                <p style={{ fontSize:13, color: C.muted, lineHeight:1.65 }}>
                  Votre demande de rendez-vous a bien été reçue. L&apos;équipe ADORÉA va la traiter et vous confirmer par WhatsApp.
                </p>
              </div>

              {ref && (
                <div style={{ background: C.offwhite, borderRadius:16, padding:'14px 18px', textAlign:'center', marginBottom:24 }}>
                  <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.15em', color: C.muted, textTransform:'uppercase', marginBottom:6 }}>Référence</div>
                  <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, fontWeight:300, color: C.black, letterSpacing:'0.05em' }}>{ref}</div>
                </div>
              )}
            </>
          ) : (
            // Confirmation avec données RDV
            <>
              <div style={{ textAlign:'center', marginBottom:28 }}>
                <div style={{ width:64, height:64, borderRadius:'50%', background: appt.needs_health_validation ? '#FFF8E7' : `${C.gold}18`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:28 }}>
                  {appt.needs_health_validation ? '⏳' : '✓'}
                </div>
                <h1 style={{ fontFamily:'Cormorant Garamond,serif', fontSize:32, fontWeight:300, color: C.black, marginBottom:8 }}>
                  Merci {appt.client?.prenom} 🌸
                </h1>
                {appt.needs_health_validation ? (
                  <p style={{ fontSize:13, color:'#B8830A', lineHeight:1.65, fontWeight:500 }}>
                    En attente de confirmation ADORÉA
                  </p>
                ) : (
                  <p style={{ fontSize:13, color: C.muted, lineHeight:1.65 }}>
                    Votre rendez-vous est enregistré.
                  </p>
                )}
              </div>

              {/* Détails */}
              <div style={{ display:'flex', flexDirection:'column', gap:0, marginBottom:24 }}>
                {[
                  { l:'Référence',  v: appt.reference },
                  { l:'Prestation', v: appt.service?.nom_fr },
                  { l:'Date',       v: new Date(appt.date_rdv).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) },
                  { l:'Heure',      v: `${appt.heure_debut?.slice(0,5)} – ${appt.heure_fin?.slice(0,5)}` },
                  { l:'Montant',    v: FDJ(appt.prix_final) },
                ].map(row => (
                  <div key={row.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'start', padding:'12px 0', borderBottom:`1px solid ${C.beige}` }}>
                    <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.1em', color: C.muted, textTransform:'uppercase', flexShrink:0 }}>{row.l}</span>
                    <span style={{ fontSize:13, color: C.black, textAlign:'right', marginLeft:12 }}>{row.v}</span>
                  </div>
                ))}
              </div>

              {appt.needs_health_validation && (
                <div style={{ background:'#FFF8E7', border:'1.5px solid #E6A817', borderRadius:16, padding:16, marginBottom:20 }}>
                  <p style={{ fontSize:12, color:'#B8830A', lineHeight:1.6 }}>
                    ⚠ Votre réservation contient une contre-indication médicale. L&apos;équipe ADORÉA va vous contacter pour validation avant confirmation définitive.
                  </p>
                  <a href={`https://wa.me/25377596159?text=${encodeURIComponent(`Bonjour ADORÉA,\n\nJe viens d'effectuer une demande de rendez-vous.\n\nPrestation : ${appt.service?.nom_fr}\nDate : ${appt.date_rdv}\nRéférence : ${appt.reference}\n\nUne information de santé nécessite validation.\n\nMerci.`)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px', borderRadius:100, background:'#25D366', color:'white', textDecoration:'none', fontSize:12, fontWeight:700, marginTop:12, fontFamily:'Manrope,sans-serif' }}>
                    💬 Demander confirmation WhatsApp
                  </a>
                </div>
              )}

              <a href={waCalendar(appt)} target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px', borderRadius:100, background:'#25D366', color:'white', textDecoration:'none', fontSize:12, fontWeight:700, marginBottom:10, fontFamily:'Manrope,sans-serif' }}>
                💬 Ajouter à mon calendrier via WhatsApp
              </a>
            </>
          )}

          <a href="/" style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'13px', borderRadius:100, border:`1.5px solid ${C.beige}`, color: C.muted, textDecoration:'none', fontSize:12, fontWeight:500, fontFamily:'Manrope,sans-serif' }}>
            ← Retour à l&apos;accueil
          </a>
        </div>

        {/* Contact */}
        <div style={{ textAlign:'center', marginTop:24 }}>
          <p style={{ fontSize:12, color: C.muted }}>Une question ? <a href="tel:+25377596159" style={{ color: C.gold, textDecoration:'none', fontWeight:600 }}>+253 77 59 61 59</a></p>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#F9F6F2' }} />}>
      <ConfirmationContent />
    </Suspense>
  )
}
