import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/diag — état des migrations et des données
export async function GET() {
  const out: Record<string, unknown> = {}

  const promoTest = await supabaseAdmin
    .from('promo_codes')
    .select('id, code, actif, afficher_site, date_fin_heure, auto_repeat, duree_heures')
    .limit(5)

  out.migration_08_promos = promoTest.error
    ? { ok: false, erreur: promoTest.error.message }
    : { ok: true, promos: promoTest.data }

  const profileTest = await supabaseAdmin
    .from('profiles')
    .select('id, email, prenom, nom, admin_pin_hash')
    .limit(5)

  out.migration_08_profiles = profileTest.error
    ? { ok: false, erreur: profileTest.error.message }
    : {
        ok: true,
        comptes: profileTest.data?.map(p => ({
          email: p.email, prenom: p.prenom, nom: p.nom,
          pin_configure: !!p.admin_pin_hash,
        })),
      }

  const allPromos = await supabaseAdmin.from('promo_codes').select('*').eq('actif', true)
  out.promos_actives_brutes = allPromos.error ? allPromos.error.message : allPromos.data

  return NextResponse.json(out, { status: 200 })
}
