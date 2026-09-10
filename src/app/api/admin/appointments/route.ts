import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'
import type { AppointmentStatus, PaymentMethod } from '@/types'

const UpdateSchema = z.object({
  appointment_id: z.string().uuid(),
  statut:         z.enum(['creee','paiement_attendu','paiement_envoye','a_valider','confirmee','cliente_arrivee','en_cours','terminee','annulee','absente','refusee']).optional(),
  health_validated: z.boolean().optional(),
  prix_final:     z.number().optional(),
  remise_fixe:    z.number().optional(),
  remise_pct:     z.number().optional(),
  payment_method: z.enum(['cac_pay','waafi','d_money','cash']).optional(),
  payment_status: z.enum(['en_attente','valide','rembourse','echoue']).optional(),
  employee_id:    z.string().uuid().optional(),
  date_rdv:       z.string().optional(),
  heure_debut:    z.string().optional(),
  notes_admin:    z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  // Vérifier auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  // Vérifier rôle
  const { data: profile } = await supabase
    .from('profiles').select('role,actif').eq('id', user.id).single()
  if (!profile?.actif || !['super_admin','manager','employe','caisse'].includes(profile.role)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { appointment_id, ...updates } = UpdateSchema.parse(body)

    // Si validation santé → mettre à jour statut aussi
    if (updates.health_validated === true  && !updates.statut) updates.statut = 'confirmee' as AppointmentStatus
    if (updates.health_validated === false && !updates.statut) updates.statut = 'refusee' as AppointmentStatus

    // Recalculer heure_fin si changement heure/date
    if (updates.heure_debut) {
      const { data: appt } = await supabaseAdmin
        .from('appointments').select('service:services(duree_minutes)').eq('id', appointment_id).single()
      if (appt) {
        const duree = (appt.service as { duree_minutes: number }).duree_minutes
        const [h, m] = updates.heure_debut.split(':').map(Number)
        const fin = new Date(0, 0, 0, h, m + duree)
        const pad = (n: number) => String(n).padStart(2, '0')
        ;(updates as Record<string, unknown>).heure_fin = `${pad(fin.getHours())}:${pad(fin.getMinutes())}:00`
      }
    }

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', appointment_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Log audit
    await supabaseAdmin.from('audit_logs').insert({
      user_id:    user.id,
      action:     'update_appointment',
      table_name: 'appointments',
      record_id:  appointment_id,
      new_values: updates,
    })

    return NextResponse.json({ success: true, appointment: data })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'VALIDATION', details: err.errors }, { status: 422 })
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 })
  }
}

// GET - récupérer un RDV avec tout son contexte
export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      *,
      client:clients(*),
      service:services(*, category:categories(*)),
      employee:employees(nom, prenom, telephone, whatsapp_number),
      health_form:client_health_forms(*),
      consent:client_consents(*),
      payments(*),
      status_history:appointment_status_history(*, changed_by:profiles(nom, prenom))
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ appointment: data })
}
