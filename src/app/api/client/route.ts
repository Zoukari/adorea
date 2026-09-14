import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { phoneKey } from '@/lib/phone'

// GET /api/client?tel=+25377...
export async function GET(req: NextRequest) {
  const tel = new URL(req.url).searchParams.get('tel')
  if (!tel) return NextResponse.json({ client: null })

  const key = phoneKey(tel)
  if (key.length < 6) return NextResponse.json({ client: null })

  // Recherche tolérante : on compare les derniers chiffres,
  // peu importe le format enregistré (0766..., +253766..., 766...)
  const { data } = await supabaseAdmin
    .from('clients')
    .select('id, nom, prenom, date_naissance, telephone, email, total_prestations, derniere_visite')
    .ilike('telephone', `%${key}`)
    .order('total_prestations', { ascending: false })
    .limit(1)

  const client = data && data.length ? data[0] : null
  return NextResponse.json({ client })
}
