import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const BookingSchema = z.object({
  service_id:     z.string().uuid(),
  date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heure_debut:    z.string().regex(/^\d{2}:\d{2}$/),
  payment_method: z.enum(['cac_pay', 'waafi', 'd_money', 'cash']),
  promo_code:     z.string().optional().nullable(),
  // Client
  nom:            z.string().min(1),
  prenom:         z.string().min(1),
  telephone:      z.string().min(6),
  date_naissance: z.string().optional().nullable(),
  email:          z.string().email().optional().nullable(),
  // Santé
  grossesse:      z.boolean().default(false),
  diabete:        z.boolean().default(false),
  allergies:      z.boolean().default(false),
  traitement_med: z.boolean().default(false),
  pb_peau:        z.boolean().default(false),
  herpes:         z.boolean().default(false),
  anticoagulants: z.boolean().default(false),
  commentaires_sante: z.string().optional().nullable(),
  // Consentement
  signature_data: z.string().optional().nullable(),
  consent_text:   z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = BookingSchema.parse(body)

    // 1. Trouver ou créer le client
    let client_id: string

    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('id, total_prestations')
      .eq('telephone', data.telephone)
      .single()

    if (existingClient) {
      client_id = existingClient.id
      // Vérification cash pour clients sans historique
      if (data.payment_method === 'cash' && existingClient.total_prestations === 0) {
        return NextResponse.json({ error: 'CASH_NOT_ALLOWED' }, { status: 400 })
      }
    } else {
      const { data: newClient, error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          nom: data.nom,
          prenom: data.prenom,
          telephone: data.telephone,
          date_naissance: data.date_naissance || null,
          email: data.email || null,
        })
        .select('id')
        .single()

      if (clientError || !newClient) {
        return NextResponse.json({ error: 'CLIENT_CREATE_FAILED' }, { status: 500 })
      }
      client_id = newClient.id

      // Nouvelle cliente → cash interdit
      if (data.payment_method === 'cash') {
        return NextResponse.json({ error: 'CASH_NOT_ALLOWED' }, { status: 400 })
      }
    }

    // 2. Créer le RDV via la fonction SQL transactionnelle
    const { data: result, error: rdvError } = await supabaseAdmin
      .rpc('create_appointment', {
        p_client_id:      client_id,
        p_service_id:     data.service_id,
        p_date:           data.date,
        p_heure_debut:    data.heure_debut + ':00',
        p_payment_method: data.payment_method,
        p_promo_code:     data.promo_code || null,
      })

    if (rdvError || result?.error) {
      const errCode = result?.error || rdvError?.message
      return NextResponse.json({ error: errCode }, { status: 400 })
    }

    const appointment_id: string = result.appointment_id

    // 3. Enregistrer questionnaire santé
    const hasContraindication = data.grossesse || data.diabete || data.allergies ||
      data.traitement_med || data.pb_peau || data.herpes || data.anticoagulants

    await supabaseAdmin.from('client_health_forms').insert({
      client_id,
      appointment_id,
      grossesse:      data.grossesse,
      diabete:        data.diabete,
      allergies:      data.allergies,
      traitement_med: data.traitement_med,
      pb_peau:        data.pb_peau,
      herpes:         data.herpes,
      anticoagulants: data.anticoagulants,
      commentaires:   data.commentaires_sante || null,
    })

    // 4. Si contre-indication → passer en statut a_valider
    if (hasContraindication) {
      await supabaseAdmin
        .from('appointments')
        .update({ statut: 'a_valider', health_validated: null })
        .eq('id', appointment_id)
    }

    // 5. Enregistrer consentement + signature
    if (data.signature_data && data.consent_text) {
      await supabaseAdmin.from('client_consents').insert({
        client_id,
        appointment_id,
        consent_text:   data.consent_text,
        consent_version: '1.0',
        signature_data: data.signature_data,
        ip_address:     req.headers.get('x-forwarded-for') || req.ip || null,
      })
    }

    // 6. Log notification
    await supabaseAdmin.from('notification_logs').insert({
      type:           'booking_created',
      client_id,
      appointment_id,
      statut:         'envoye',
    })

    return NextResponse.json({
      success:              true,
      appointment_id,
      reference:            result.reference,
      heure_debut:          result.heure_debut,
      heure_fin:            result.heure_fin,
      prix_final:           result.prix_final,
      statut:               hasContraindication ? 'a_valider' : 'creee',
      needs_health_validation: hasContraindication,
    })

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'VALIDATION', details: err.errors }, { status: 422 })
    }
    console.error('[BOOKING ERROR]', err)
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 })
  }
}
