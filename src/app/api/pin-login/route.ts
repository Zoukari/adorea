import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

// GET /api/pin-login/profiles — liste les comptes actifs avec initiales
export async function GET() {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, prenom, nom, role, avatar_initials, email')
    .eq('actif', true)
    .order('prenom')

  return NextResponse.json({
    profiles: (data || []).map(p => ({
      id: p.id,
      prenom: p.prenom || 'Admin',
      nom: p.nom || '',
      role: p.role,
      email: p.email,
      initials: p.avatar_initials ||
        ((p.prenom || 'A').charAt(0) + (p.nom || 'A').charAt(0)).toUpperCase(),
      has_pin: true, // on suppose que les admins ont un PIN ou peuvent le définir
    }))
  })
}

// POST /api/pin-login — authentification par PIN
export async function POST(req: NextRequest) {
  const { profile_id, pin } = await req.json()

  if (!profile_id || !pin) {
    return NextResponse.json({ error: 'MISSING' }, { status: 400 })
  }

  // Récupérer le hash stocké + l'email du profil
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, email, admin_pin_hash, actif')
    .eq('id', profile_id)
    .maybeSingle()

  if (!profile || !profile.actif) {
    return NextResponse.json({ error: 'PROFILE_NOT_FOUND' }, { status: 404 })
  }

  if (!profile.admin_pin_hash) {
    return NextResponse.json({ error: 'NO_PIN_SET' }, { status: 400 })
  }

  // Vérifier le PIN : SHA-256 du code saisi
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(pin.trim()))
  const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')

  if (hash !== profile.admin_pin_hash) {
    return NextResponse.json({ error: 'WRONG_PIN' }, { status: 401 })
  }

  // PIN correct → créer une session Supabase Auth
  // On utilise le service role pour signer une session côté serveur
  const { data: session, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: profile.email!,
    options: { redirectTo: '/admin' }
  })

  if (error || !session?.properties?.hashed_token) {
    return NextResponse.json({ error: 'SESSION_FAILED', detail: error?.message }, { status: 500 })
  }

  return NextResponse.json({ token: session.properties.hashed_token, email: profile.email })
}

// PUT /api/pin-login — définir ou changer son PIN
export async function PUT(req: NextRequest) {
  const { pin, profile_id } = await req.json()

  if (!pin || pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
    return NextResponse.json({ error: 'PIN_INVALID' }, { status: 400 })
  }

  // Vérifier que l'appelant est bien authentifié
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })

  const id = profile_id || user.id

  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(pin.trim()))
  const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')

  await supabaseAdmin
    .from('profiles')
    .update({ admin_pin_hash: hash })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
