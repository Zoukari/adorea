import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/promos — promos actives affichées sur le site
export async function GET() {
  const now = new Date().toISOString()

  // On ne filtre PAS sur afficher_site ici pour être robuste si la colonne
  // n'existe pas encore (migration 08 non appliquée) — on filtre en JS
  const { data, error } = await supabaseAdmin
    .from('promo_codes')
    .select('*')
    .eq('actif', true)

  if (error || !data) return NextResponse.json({ promos: [] })

  const promos = data.filter(p => {
    // La colonne afficher_site peut ne pas exister encore
    if (p.afficher_site === false) return false  // false explicite = masqué
    if (p.nb_utilisations_max && p.nb_utilisations_actuel >= p.nb_utilisations_max) return false
    const fin = p.date_fin_heure || (p.date_fin ? p.date_fin + 'T23:59:59Z' : null)
    if (fin && !p.auto_repeat && fin < now) return false
    return true
  }).map(p => {
    let endsAt: string|null = p.date_fin_heure || (p.date_fin ? p.date_fin + 'T23:59:59Z' : null)

    if (p.auto_repeat && p.duree_heures && endsAt) {
      const nowMs = Date.now()
      let t = new Date(endsAt).getTime()
      const dur = Number(p.duree_heures) * 3600 * 1000
      while (t < nowMs) t += dur
      endsAt = new Date(t).toISOString()
    }

    return {
      id: p.id, code: p.code,
      remise_pct: p.remise_pct ? Number(p.remise_pct) : null,
      remise_fixe: p.remise_fixe ? Number(p.remise_fixe) : null,
      montant_min: p.montant_min,
      service_id: p.service_id,
      ends_at: endsAt,
      auto_repeat: !!p.auto_repeat,
    }
  })

  // Enrichir avec les noms de services
  if (promos.length > 0) {
    const svcIds = [...new Set(promos.map(p => p.service_id).filter(Boolean))]
    const { data: svcs } = svcIds.length > 0
      ? await supabaseAdmin.from('services').select('id, nom_fr, prix, prix_sur_devis').in('id', svcIds as string[])
      : { data: [] }

    return NextResponse.json({
      promos: promos.map(p => ({
        ...p,
        service: svcs?.find(s => s.id === p.service_id) || null,
      }))
    })
  }

  return NextResponse.json({ promos })
}
