import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/promo-check  { code, service_id, montant, client_id? }
export async function POST(req: NextRequest) {
  const { code, service_id, montant, client_id } = await req.json()

  if (!code) return NextResponse.json({ error: 'CODE_REQUIRED' }, { status: 400 })

  const { data: p } = await supabaseAdmin
    .from('promo_codes')
    .select('*')
    .ilike('code', code.trim())
    .single()

  if (!p || !p.actif) return NextResponse.json({ error: 'CODE_INVALID' }, { status: 400 })

  const now = new Date().toISOString()
  const fin = p.date_fin_heure || (p.date_fin ? p.date_fin + 'T23:59:59Z' : null)

  // Validité temporelle
  if (p.date_debut && p.date_debut > now.split('T')[0]) {
    return NextResponse.json({ error: 'CODE_NOT_STARTED' }, { status: 400 })
  }
  if (fin && !p.auto_repeat && fin < now) {
    return NextResponse.json({ error: 'CODE_EXPIRED' }, { status: 400 })
  }

  // Quota global
  if (p.nb_utilisations_max && p.nb_utilisations_actuel >= p.nb_utilisations_max) {
    return NextResponse.json({ error: 'CODE_EXHAUSTED' }, { status: 400 })
  }

  // Quota par cliente
  if (p.nb_par_cliente_max && client_id) {
    const { count } = await supabaseAdmin
      .from('promo_code_usage')
      .select('id', { count: 'exact', head: true })
      .eq('promo_id', p.id).eq('client_id', client_id)
    if (Number(count) >= p.nb_par_cliente_max) {
      return NextResponse.json({ error: 'CODE_USED_BY_CLIENT' }, { status: 400 })
    }
  }

  // Restriction service
  if (p.service_id && service_id && p.service_id !== service_id) {
    return NextResponse.json({ error: 'CODE_WRONG_SERVICE' }, { status: 400 })
  }

  // Montant minimum
  if (p.montant_min && Number(montant) < Number(p.montant_min)) {
    return NextResponse.json({ error: 'CODE_MIN_AMOUNT', min: p.montant_min }, { status: 400 })
  }

  // Calcul remise
  const remise = p.remise_pct
    ? Math.round(Number(montant) * Number(p.remise_pct) / 100)
    : Math.min(Number(p.remise_fixe || 0), Number(montant))

  return NextResponse.json({
    valid: true,
    remise_pct: p.remise_pct,
    remise_fixe: p.remise_fixe,
    remise,
    prix_final: Number(montant) - remise,
    message: p.remise_pct
      ? `−${p.remise_pct}% appliqué`
      : `−${new Intl.NumberFormat('fr-FR').format(remise)} FDJ`,
  })
}
