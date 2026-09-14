import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'
import { phoneKey, toE164 } from '@/lib/phone'

const BookingSchema = z.object({
  service_id:     z.string().uuid(),
  date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heure_debut:    z.string().regex(/^\d{2}:\d{2}$/),
  payment_method: z.enum(['cac_pay', 'waafi', 'd_money', 'cash']),
  promo_code:     z.string().optional().nullable(),
  nom:            z.string().min(1),
  prenom:         z.string().min(1),
  telephone:      z.string().min(6),
  date_naissance: z.string().optional().nullable(),
  email:          z.string().email().optional().nullable(),
  grossesse:      z.boolean().default(false),
  diabete:        z.boolean().default(false),
  allergies:      z.boolean().default(false),
  traitement_med: z.boolean().default(false),
  pb_peau:        z.boolean().default(false),
  herpes:         z.boolean().default(false),
  anticoagulants: z.boolean().default(false),
  commentaires_sante: z.string().optional().nullable(),
  signature_data: z.string().optional().nullable(),
  consent_text:   z.string().optional().nullable(),
})

// GET — récupérer un RDV par référence
export async function GET(req: NextRequest) {
  const ref = new URL(req.url).searchParams.get('ref')
  if (!ref) return NextResponse.json({ appointment: null })

  const { data } = await supabaseAdmin
    .from('appointments')
    .select('reference, date_rdv, heure_debut, heure_fin, statut, prix_final, health_validated, service:services(nom_fr), client:clients(prenom, nom)')
    .eq('reference', ref)
    .single()

  if (!data) return NextResponse.json({ appointment: null })

  return NextResponse.json({
    appointment: {
      ...data,
      needs_health_validation: data.health_validated === null && data.statut === 'a_valider',
    }
  })
}

// POST — créer un rendez-vous
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = BookingSchema.parse(body)

    // 1. Client
    let client_id: string
    const tel = toE164(data.telephone)
    const key = phoneKey(tel)
    const { data: matches } = await supabaseAdmin
      .from('clients').select('id, total_prestations')
      .ilike('telephone', `%${key}`)
      .order('total_prestations', { ascending: false })
      .limit(1)
    const existing = matches && matches.length ? matches[0] : null

    if (existing) {
      client_id = existing.id
      if (data.payment_method === 'cash' && existing.total_prestations === 0)
        return NextResponse.json({ error: 'CASH_NOT_ALLOWED' }, { status: 400 })
    } else {
      const { data: newClient, error: err } = await supabaseAdmin
        .from('clients').insert({
          nom: data.nom, prenom: data.prenom, telephone: tel,
          date_naissance: data.date_naissance || null, email: data.email || null,
        }).select('id').single()
      if (err || !newClient) return NextResponse.json({ error: 'CLIENT_CREATE_FAILED' }, { status: 500 })
      client_id = newClient.id
      if (data.payment_method === 'cash') return NextResponse.json({ error: 'CASH_NOT_ALLOWED' }, { status: 400 })
    }

    // 2. RDV — insert direct (pas de RPC : elle exige une employée assignée)
    const { data: svc } = await supabaseAdmin
      .from('services').select('prix, prix_sur_devis, duree_minutes, buffer_minutes')
      .eq('id', data.service_id).single()

    if (!svc) return NextResponse.json({ error: 'SERVICE_NOT_FOUND' }, { status: 400 })

    const duree = Number(svc.duree_minutes || 60)
    const [hh, mm] = data.heure_debut.split(':').map(Number)
    const endMin = hh * 60 + mm + duree
    const heure_fin = `${String(Math.floor(endMin / 60) % 24).padStart(2,'0')}:${String(endMin % 60).padStart(2,'0')}:00`

    // Créneau déjà pris ?
    const { data: clash } = await supabaseAdmin
      .from('appointments').select('id, heure_debut, heure_fin')
      .eq('date_rdv', data.date).not('statut', 'in', '(annulee,no_show)')

    const startMin = hh * 60 + mm
    const overlap = (clash || []).some(a => {
      if (!a.heure_debut) return false
      const [ah, am] = a.heure_debut.split(':').map(Number)
      const [eh, em] = (a.heure_fin || a.heure_debut).split(':').map(Number)
      return startMin < eh * 60 + em && endMin > ah * 60 + am
    })
    if (overlap) return NextResponse.json({ error: 'SLOT_TAKEN' }, { status: 400 })

    const hasCI = data.grossesse || data.diabete || data.allergies ||
      data.traitement_med || data.pb_peau || data.herpes || data.anticoagulants

    const reference = 'ADR-' + Math.random().toString(36).slice(2, 8).toUpperCase()

    const { data: appt, error: rdvErr } = await supabaseAdmin
      .from('appointments').insert({
        client_id, service_id: data.service_id,
        date_rdv: data.date,
        heure_debut: data.heure_debut + ':00',
        heure_fin,
        statut: hasCI ? 'a_valider' : 'creee',
        prix_final: svc.prix_sur_devis ? 0 : Number(svc.prix || 0),
        payment_method: data.payment_method,
        payment_status: 'en_attente',
        reference,
        is_walkin: false,
        health_validated: hasCI ? null : true,
      }).select('id, reference, heure_debut, heure_fin, prix_final').single()

    if (rdvErr || !appt) {
      console.error('[BOOKING] insert', rdvErr)
      return NextResponse.json({ error: 'RDV_CREATE_FAILED', detail: rdvErr?.message }, { status: 400 })
    }

    const appointment_id: string = appt.id
    const result = {
      reference: appt.reference, heure_debut: appt.heure_debut,
      heure_fin: appt.heure_fin, prix_final: appt.prix_final,
    }

    // 3. Santé
    await supabaseAdmin.from('client_health_forms').insert({
      client_id, appointment_id,
      grossesse: data.grossesse, diabete: data.diabete, allergies: data.allergies,
      traitement_med: data.traitement_med, pb_peau: data.pb_peau,
      herpes: data.herpes, anticoagulants: data.anticoagulants,
      commentaires: data.commentaires_sante || null,
    })

    // 4. Consentement
    if (data.signature_data && data.consent_text) {
      await supabaseAdmin.from('client_consents').insert({
        client_id, appointment_id, consent_text: data.consent_text,
        consent_version: '1.0', signature_data: data.signature_data,
        ip_address: req.headers.get('x-forwarded-for') || null,
      })
    }

    await supabaseAdmin.from('notification_logs').insert({
      type: 'booking_created', client_id, appointment_id, statut: 'envoye'
    })

    return NextResponse.json({
      success: true, appointment_id, reference: result.reference,
      heure_debut: result.heure_debut, heure_fin: result.heure_fin,
      prix_final: result.prix_final,
      statut: hasCI ? 'a_valider' : 'creee',
      needs_health_validation: hasCI,
    })
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: 'VALIDATION', details: err.errors }, { status: 422 })
    console.error('[BOOKING]', err)
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 })
  }
}
