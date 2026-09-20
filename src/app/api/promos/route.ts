import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/promos — promos actives affichées sur le site
export async function GET() {
  const now = new Date().toISOString()

  const { data } = await supabaseAdmin
    .from('promo_codes')
    .select(`
      id, code, remise_pct, remise_fixe, montant_min,
      date_fin, date_fin_heure, auto_repeat, duree_heures, afficher_site,
      nb_utilisations_max, nb_utilisations_actuel,
      service:services(id, nom_fr, prix, prix_sur_devis),
      category:categories(id, nom_fr)
    `)
    .eq('actif', true)
    .eq('afficher_site', true)

  if (!data) return NextResponse.json({ promos: [] })

  // Filtrer : pas épuisées, pas expirées (sauf auto_repeat)
  const promos = data.filter(p => {
    if (p.nb_utilisations_max && p.nb_utilisations_actuel >= p.nb_utilisations_max) return false
    const fin = p.date_fin_heure || (p.date_fin ? p.date_fin + 'T23:59:59Z' : null)
    if (fin && !p.auto_repeat && fin < now) return false
    return true
  }).map(p => {
    // Si auto_repeat : calculer la prochaine échéance
    let endsAt = p.date_fin_heure || (p.date_fin ? p.date_fin + 'T23:59:59Z' : null)

    if (p.auto_repeat && p.duree_heures && endsAt) {
      const nowMs = Date.now()
      let t = new Date(endsAt).getTime()
      const dur = p.duree_heures * 3600 * 1000
      // Avancer jusqu'à la prochaine échéance future
      while (t < nowMs) t += dur
      endsAt = new Date(t).toISOString()
    }

    return {
      id: p.id, code: p.code,
      remise_pct: p.remise_pct, remise_fixe: p.remise_fixe,
      montant_min: p.montant_min,
      service: p.service, category: p.category,
      ends_at: endsAt,
      auto_repeat: p.auto_repeat,
    }
  })

  return NextResponse.json({ promos })
}
