import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const PmuSchema = z.object({
  client_id:     z.string().uuid(),
  service_id:    z.string().uuid(),
  appointment_id: z.string().uuid().optional().nullable(),
  pigment:       z.string().optional().nullable(),
  technique:     z.string().optional().nullable(),
  notes:         z.string().optional().nullable(),
  prochaine_retouche_avant: z.string().optional().nullable(),
  prochaine_retouche_apres: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const body = await req.json()
    const data = PmuSchema.parse(body)

    const { data: record, error } = await supabaseAdmin
      .from('pmu_records')
      .insert(data)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, record })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'VALIDATION', details: err.errors }, { status: 422 })
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('pmu_records')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, record: data })
}

// GET — dossier PMU d'un client
export async function GET(req: NextRequest) {
  const client_id = new URL(req.url).searchParams.get('client_id')
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('pmu_records')
    .select('*, service:services(nom_fr), photos:pmu_photos(*)')
    .eq('client_id', client_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ records: data })
}
