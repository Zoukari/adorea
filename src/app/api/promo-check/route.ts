import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/promo-check  { code, service_id, montant, client_id? }
export async function POST(req: NextRequest) {
  const { code, service_id, montant, client_id } = await req.json()

  if (!code || !String(code).trim()) {
    return NextResponse.json({ error: 'CODE_REQUIRED' }, { status: 400 })
  }

  const clean = String(code).trim().toUpperCase()

  // Recherche insensible à la casse et aux espaces superflus
  const { data: rows } = await supabaseAdmin
    .from('promo_codes')
    .select('*')
    .eq('actif', true)

  const p = (rows || []).find(
    r => String(r.code || '').trim().toUpperCase() === clean
  )

  if (!p) return NextResponse.json({ error: 'CODE_INVALID' }, { status: 400 })

  const nowIso = new Date().toISOString()
  const today = nowIso.split('T')[0]

  // Pas encore commencée
  if (p.date_debut && p.date_debut > today) {
    return NextResponse.json({ error: 'CODE_NOT_STARTED' }, { status: 400 })
  }

  // Expiration — ignorée si la promo se relance automatiquement
  if (!p.auto_repeat) {
    const fin = p.date_fin_heure || (p.date_fin ? `${p.date_fin}T23:59:59.999Z` : null)
    if (fin && fin < nowIso) {
      return NextResponse.json({ error: 'CODE_EXPIRED' }, { status: 400 })
    }
  }

  // Quota global
  if (p.nb_utilisations_max && Number(p.nb_utilisations_actuel || 0) >= Number(p.nb_utilisations_max)) {
    return NextResponse.json({ error: 'CODE_EXHAUSTED' }, { status: 400 })
  }

  // Quota par cliente
  if (p.nb_par_cliente_max && client_id) {
    const { count } = await supabaseAdmin
      .from('promo_code_usage')
      .select('id', { count: 'exact', head: true })
      .eq('promo_id', p.id).eq('client_id', client_id)
    if (Number(count || 0) >= Number(p.nb_par_cliente_max)) {
      return NextResponse.json({ error: 'CODE_USED_BY_CLIENT' }, { status: 400 })
    }
  }

  // Restriction prestations : service_ids (liste) ou service_id (unique)
  const ciblees: string[] =
    Array.isArray(p.service_ids) && p.service_ids.length
      ? p.service_ids
      : p.service_id ? [p.service_id] : []

  if (ciblees.length > 0 && service_id && !ciblees.includes(service_id)) {
    return NextResponse.json({ error: 'CODE_WRONG_SERVICE' }, { status: 400 })
  }

  // Montant minimum
  const m = Number(montant || 0)
  if (p.montant_min && m < Number(p.montant_min)) {
    return NextResponse.json(
      { error: 'CODE_MIN_AMOUNT', min: Number(p.montant_min) },
      { status: 400 }
    )
  }

  const remise = p.remise_pct
    ? Math.round(m * Number(p.remise_pct) / 100)
    : Math.min(Number(p.remise_fixe || 0), m)

  return NextResponse.json({
    valid: true,
    promo_id: p.id,
    remise_pct: p.remise_pct ? Number(p.remise_pct) : null,
    remise_fixe: p.remise_fixe ? Number(p.remise_fixe) : null,
    remise,
    prix_final: Math.max(0, m - remise),
    message: p.remise_pct
      ? `−${Number(p.remise_pct)}% appliqué`
      : `−${new Intl.NumberFormat('fr-FR').format(remise)} FDJ`,
  })
}
