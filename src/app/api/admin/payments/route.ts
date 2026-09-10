import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const PaymentSchema = z.object({
  appointment_id: z.string().uuid(),
  montant:        z.number().positive(),
  methode:        z.enum(['cac_pay','waafi','d_money','cash']),
  reference_ext:  z.string().optional().nullable(),
  screenshot_url: z.string().url().optional().nullable(),
})

// POST — créer un paiement et valider le RDV
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const body = await req.json()
    const data = PaymentSchema.parse(body)

    // Créer le paiement
    const { data: payment, error: payErr } = await supabaseAdmin
      .from('payments')
      .insert({
        appointment_id: data.appointment_id,
        montant:        data.montant,
        methode:        data.methode,
        statut:         'valide',
        reference_ext:  data.reference_ext || null,
        screenshot_url: data.screenshot_url || null,
        validated_by:   user.id,
        validated_at:   new Date().toISOString(),
      })
      .select()
      .single()

    if (payErr) return NextResponse.json({ error: payErr.message }, { status: 400 })

    // Mettre à jour le statut du RDV
    await supabaseAdmin
      .from('appointments')
      .update({ payment_status: 'valide', statut: 'confirmee' })
      .eq('id', data.appointment_id)

    return NextResponse.json({ success: true, payment })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'VALIDATION', details: err.errors }, { status: 422 })
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 })
  }
}

// PATCH — valider un screenshot de paiement reçu sur WA
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { payment_id, statut } = await req.json()
  if (!payment_id) return NextResponse.json({ error: 'payment_id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('payments')
    .update({ statut, validated_by: user.id, validated_at: new Date().toISOString() })
    .eq('id', payment_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (statut === 'valide') {
    await supabaseAdmin
      .from('appointments')
      .update({ payment_status: 'valide', statut: 'confirmee' })
      .eq('id', data.appointment_id)
  }

  return NextResponse.json({ success: true, payment: data })
}
