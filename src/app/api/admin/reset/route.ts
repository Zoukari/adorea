import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

/**
 * POST /api/admin/reset
 * Efface les données d'activité (rendez-vous, paiements, clientes, dépenses,
 * clôtures) sans toucher à la configuration du studio.
 *
 * Body : { confirm: "REMISE A ZERO", scopes: string[] }
 */

// Ordre important : les tables enfants d'abord
const SCOPES: Record<string, { label: string; tables: string[] }> = {
  ventes: {
    label: 'Rendez-vous, ventes et paiements',
    tables: [
      'promo_code_usage',
      'payments',
      'appointment_status_history',
      'client_consents',
      'client_health_forms',
      'pmu_photos',
      'pmu_records',
      'appointments',
    ],
  },
  clients: {
    label: 'Fiches clientes',
    tables: ['client_rewards', 'clients'],
  },
  depenses: {
    label: 'Dépenses',
    tables: ['expenses'],
  },
  clotures: {
    label: 'Clôtures de caisse',
    tables: ['cash_closings'],
  },
  journaux: {
    label: 'Journaux de notifications',
    tables: ['notification_logs', 'audit_logs'],
  },
}

export async function GET() {
  return NextResponse.json({
    scopes: Object.entries(SCOPES).map(([k, v]) => ({ key: k, label: v.label })),
  })
}

export async function POST(req: NextRequest) {
  // Seul un utilisateur connecté peut déclencher la remise à zéro
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })

  const { confirm, scopes } = await req.json()

  if (confirm !== 'REMISE A ZERO') {
    return NextResponse.json({ error: 'CONFIRMATION_INVALIDE' }, { status: 400 })
  }

  const demandes: string[] = Array.isArray(scopes) && scopes.length
    ? scopes
    : Object.keys(SCOPES)

  const resultat: Record<string, number | string> = {}

  for (const scope of demandes) {
    const def = SCOPES[scope]
    if (!def) continue

    for (const table of def.tables) {
      // Compter avant suppression pour le rapport
      const { count } = await supabaseAdmin
        .from(table).select('id', { count: 'exact', head: true })

      const { error } = await supabaseAdmin
        .from(table).delete().not('id', 'is', null)

      resultat[table] = error ? `erreur : ${error.message}` : Number(count || 0)
    }
  }

  // Les compteurs de codes promo repartent de zéro
  if (demandes.includes('ventes')) {
    await supabaseAdmin
      .from('promo_codes').update({ nb_utilisations_actuel: 0 }).not('id', 'is', null)
  }

  return NextResponse.json({ ok: true, supprime: resultat })
}
