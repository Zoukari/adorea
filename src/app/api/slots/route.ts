import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const DEFAULT_OPEN = '09:00'
const DEFAULT_CLOSE = '19:00'
const STEP = 30 // minutes

const toMin = (t: string) => {
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}
const toStr = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

// GET /api/slots?service_id=xxx&date=2026-09-15
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const service_id = searchParams.get('service_id')
  const date = searchParams.get('date')

  if (!service_id || !date) {
    return NextResponse.json({ error: 'service_id and date required' }, { status: 400 })
  }

  // 1. Durée de la prestation
  const { data: svc } = await supabaseAdmin
    .from('services').select('duree_minutes, buffer_minutes').eq('id', service_id).maybeSingle()
  const duree = Number(svc?.duree_minutes || 60) + Number(svc?.buffer_minutes || 0)

  // 2. Horaires d'ouverture du jour (site_settings.horaires_ouverture)
  const jsDay = new Date(date + 'T00:00:00').getDay()      // 0 = dimanche
  const dowIndex = jsDay === 0 ? 6 : jsDay - 1             // 0 = lundi

  let open = DEFAULT_OPEN, close = DEFAULT_CLOSE, closed = false
  const { data: setting } = await supabaseAdmin
    .from('site_settings').select('value').eq('key', 'horaires_ouverture').maybeSingle()

  if (setting?.value) {
    try {
      const h = JSON.parse(setting.value)[String(dowIndex)]
      if (h) { open = h.open || open; close = h.close || close; closed = !!h.closed }
    } catch { /* valeurs par défaut */ }
  }
  if (closed) return NextResponse.json({ slots: [] })

  // 3. Créneaux bruts
  const openM = toMin(open), closeM = toMin(close)
  const raw: number[] = []
  for (let m = openM; m + duree <= closeM; m += STEP) raw.push(m)

  // 4. Indisponibilités du jour (toutes employées confondues)
  const { data: blocks } = await supabaseAdmin
    .from('employee_schedules')
    .select('heure_debut, heure_fin, est_disponible')
    .eq('date_jour', date).eq('est_disponible', false)

  const busy: { start: number; end: number }[] = []
  let fullDayClosed = false
  for (const b of blocks || []) {
    if (!b.heure_debut) { fullDayClosed = true; break }
    busy.push({ start: toMin(b.heure_debut), end: toMin(b.heure_fin || b.heure_debut) })
  }
  if (fullDayClosed) return NextResponse.json({ slots: [] })

  // 5. Rendez-vous déjà pris
  const { data: appts } = await supabaseAdmin
    .from('appointments')
    .select('heure_debut, heure_fin')
    .eq('date_rdv', date)
    .not('statut', 'in', '(annulee,no_show)')

  for (const a of appts || []) {
    if (a.heure_debut) busy.push({ start: toMin(a.heure_debut), end: toMin(a.heure_fin || a.heure_debut) })
  }

  // 6. Filtrage : le créneau + sa durée ne doit chevaucher aucune plage occupée
  const now = new Date()
  const isToday = date === new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().split('T')[0]
  const nowM = now.getHours() * 60 + now.getMinutes()

  const slots = raw
    .filter(m => !(isToday && m <= nowM + 60))
    .filter(m => !busy.some(b => m < b.end && m + duree > b.start))
    .map(toStr)

  return NextResponse.json({ slots })
}
