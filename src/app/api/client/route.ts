import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/client?tel=+25377...
export async function GET(req: NextRequest) {
  const tel = new URL(req.url).searchParams.get('tel')
  if (!tel) return NextResponse.json({ client: null })

  const { data } = await supabaseAdmin
    .from('clients')
    .select('id, nom, prenom, date_naissance, telephone, email, total_prestations, derniere_visite')
    .eq('telephone', tel)
    .single()

  // Ne retourner que si au moins 1 prestation (pour pré-remplir)
  if (data && data.total_prestations > 0) {
    return NextResponse.json({ client: data })
  }
  return NextResponse.json({ client: null })
}
