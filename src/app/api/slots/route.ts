import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/slots?service_id=xxx&date=2025-01-15
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const service_id = searchParams.get('service_id')
  const date       = searchParams.get('date')
  const mode       = searchParams.get('mode') // 'slots' | 'days'
  const year       = searchParams.get('year')
  const month      = searchParams.get('month')

  if (!service_id) {
    return NextResponse.json({ error: 'service_id required' }, { status: 400 })
  }

  if (mode === 'days' && year && month) {
    const { data, error } = await supabaseAdmin.rpc('get_available_days', {
      p_service_id: service_id,
      p_year:       parseInt(year),
      p_month:      parseInt(month),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ days: data })
  }

  if (!date) {
    return NextResponse.json({ error: 'date required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.rpc('get_available_slots', {
    p_service_id: service_id,
    p_date:       date,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slots: data })
}
