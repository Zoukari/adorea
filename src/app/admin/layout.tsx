'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AdminDiagnostic from '@/components/AdminDiagnostic'
import { ADMIN_CSS } from '@/lib/admin-ui'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }

const NAV = [
  { href:'/admin',              icon:'▦',  label:'Dashboard' },
  { href:'/admin/caisse',       icon:'💳', label:'Caisse' },
  { href:'/admin/appointments', icon:'📅', label:'Rendez-vous' },
  { href:'/admin/clients',      icon:'👤', label:'Clientes' },
  { href:'/admin/services',     icon:'✦',  label:'Prestations' },
  { href:'/admin/planning',     icon:'🗓', label:'Planning' },
  { href:'/admin/employees',    icon:'👥', label:'Équipe' },
  { href:'/admin/loyalty',      icon:'⭐', label:'Fidélité & Promos' },
  { href:'/admin/accounting',   icon:'📊', label:'Comptabilité' },
  { href:'/admin/gallery',      icon:'🖼', label:'Galerie' },
  { href:'/admin/settings',     icon:'⚙️', label:'Paramètres' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [authState, setAuthState] = useState<'checking' | 'ok'>('checking')

  // Garde d'authentification côté client
  useEffect(() => {
    const supabase = createClient()
    let alive = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return
      if (!session) {
        router.replace(`/login?from=${encodeURIComponent(pathname)}`)
      } else {
        setAuthState('ok')
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return
      if (!session) router.replace('/login')
    })

    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [router, pathname])

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (authState === 'checking') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F2EDE8' }}>
        <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, color:'#8A7A74', letterSpacing:'0.1em' }}>
          ADORÉA
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell adm" style={{ display:'flex', minHeight:'100vh', background:'#F2EDE8' }}>
      <style>{ADMIN_CSS}</style>
      <style>{`
        .nav-link { display:flex; align-items:center; gap:10px; padding:10px 16px; border-radius:14px; text-decoration:none; font-size:13px; font-weight:400; transition:all 0.2s ease; margin:2px 8px; white-space:nowrap; }
        .nav-link:hover { background:rgba(201,169,106,0.1); color:#C9A96A; }
        .nav-link.active { background:rgba(201,169,106,0.15); color:#C9A96A; font-weight:500; }
        .nav-link .ico { font-size:16px; flex-shrink:0; }

        /* ===== RESPONSIVE : sidebar -> navbar horizontale ===== */
        @media (max-width: 900px) {
          .admin-shell { flex-direction: column; }
          .admin-aside {
            position: static !important;
            width: 100% !important;
            border-radius: 0 0 20px 20px !important;
            box-shadow: 0 4px 20px rgba(26,26,26,0.18) !important;
          }
          .admin-aside-head {
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 18px !important;
          }
          .admin-nav {
            flex-direction: row !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            padding: 8px 10px !important;
            gap: 4px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .admin-nav::-webkit-scrollbar { display: none; }
          .admin-nav .nav-link {
            flex-direction: column; gap: 4px;
            padding: 8px 12px !important; margin: 0 !important;
            font-size: 10px !important; min-width: 64px;
            justify-content: center !important;
          }
          .admin-nav .nav-link .ico { font-size: 17px; }
          .admin-collapse { display: none !important; }
          .admin-logout {
            border-top: none !important; border-left: 1px solid rgba(255,255,255,0.1) !important;
            padding: 8px 14px !important; font-size: 11px !important;
            flex-direction: column !important; gap: 3px !important;
          }
          .admin-main { margin-left: 0 !important; }
          .admin-content { padding: 12px 12px 40px !important; }
          .admin-card { border-radius: 18px !important; min-height: auto !important; }
        }

        /* ══════════ SYSTÈME GLOBAL ADMIN ══════════ */
        .adm * { box-sizing: border-box; }

        /* --- Boutons avec retour visuel --- */
        button, .btn { font-family: 'Manrope', sans-serif; }
        button:not(:disabled), .btn:not(:disabled) { cursor: pointer; }
        button:not(:disabled):active, .btn:not(:disabled):active { transform: scale(0.97); }
        button, .btn { transition: transform .12s cubic-bezier(.2,0,.2,1), background .18s, box-shadow .18s, border-color .18s, color .18s; }

        .b-primary { background:#1A1A1A; color:#F9F6F2; border:none; border-radius:100px; padding:11px 22px; font-size:12px; font-weight:600; letter-spacing:.06em; }
        .b-primary:hover:not(:disabled) { background:#000; box-shadow:0 6px 18px rgba(26,26,26,.25); transform:translateY(-1px); }
        .b-primary:disabled { opacity:.35; cursor:not-allowed; }

        .b-gold { background:#C9A96A; color:#1A1A1A; border:none; border-radius:100px; padding:11px 22px; font-size:12px; font-weight:700; letter-spacing:.06em; }
        .b-gold:hover:not(:disabled) { background:#D9BC82; box-shadow:0 6px 18px rgba(201,169,106,.35); transform:translateY(-1px); }
        .b-gold:disabled { opacity:.35; cursor:not-allowed; }

        .b-ghost { background:transparent; color:#8A7A74; border:1.5px solid #E5DACE; border-radius:100px; padding:10px 18px; font-size:12px; font-weight:500; }
        .b-ghost:hover:not(:disabled) { border-color:#C9A96A; color:#1A1A1A; background:#FBF7F1; }

        .b-danger { background:transparent; color:#D14343; border:1.5px solid #F0C9C9; border-radius:100px; padding:10px 18px; font-size:12px; font-weight:500; }
        .b-danger:hover:not(:disabled) { background:#D14343; color:#fff; border-color:#D14343; }

        .b-icon { background:transparent; border:1.5px solid #E5DACE; border-radius:12px; width:34px; height:34px; display:inline-flex; align-items:center; justify-content:center; color:#8A7A74; font-size:14px; }
        .b-icon:hover:not(:disabled) { border-color:#C9A96A; color:#1A1A1A; background:#FBF7F1; }

        /* --- Chips / filtres --- */
        .chip { background:#fff; border:1.5px solid #E5DACE; border-radius:100px; padding:8px 16px; font-size:12px; font-weight:500; color:#8A7A74; }
        .chip:hover { border-color:#C9A96A; color:#1A1A1A; }
        .chip.on { background:#1A1A1A; border-color:#1A1A1A; color:#F9F6F2; }
        .chip.gold.on { background:#C9A96A; border-color:#C9A96A; color:#1A1A1A; }

        /* --- Cartes cliquables --- */
        .tile { background:#fff; border:1.5px solid #EFE6DC; border-radius:16px; text-align:left; transition:all .18s; }
        .tile:hover { border-color:#C9A96A; box-shadow:0 4px 16px rgba(26,26,26,.07); transform:translateY(-2px); }
        .tile.on { border-color:#C9A96A; background:#FBF5EC; box-shadow:0 0 0 2px rgba(201,169,106,.2); }

        /* --- Champs --- */
        .f { width:100%; padding:11px 14px; border:1.5px solid #E5DACE; border-radius:12px; font-family:'Manrope',sans-serif; font-size:13px; background:#fff; color:#1A1A1A; outline:none; transition:border-color .18s, box-shadow .18s; }
        .f:focus { border-color:#C9A96A; box-shadow:0 0 0 3px rgba(201,169,106,.12); }
        .lbl { display:block; font-size:10px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:#8A7A74; margin-bottom:6px; }

        /* --- En-tête de page --- */
        .ph { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:22px; }
        .ph h1 { font-family:'Cormorant Garamond',serif; font-size:30px; font-weight:300; color:#1A1A1A; margin:0; }
        .ph .sub { font-size:11px; color:#8A7A74; margin-top:2px; }

        /* --- Onglets --- */
        .tabs { display:flex; gap:4px; background:#F2EDE8; padding:4px; border-radius:100px; margin-bottom:20px; overflow-x:auto; scrollbar-width:none; }
        .tabs::-webkit-scrollbar { display:none; }
        .tabs button { flex:1; min-width:max-content; background:transparent; border:none; border-radius:100px; padding:9px 18px; font-size:12px; font-weight:500; color:#8A7A74; white-space:nowrap; }
        .tabs button.on { background:#fff; color:#1A1A1A; font-weight:600; box-shadow:0 2px 8px rgba(26,26,26,.08); }

        /* --- Modales --- */
        .ovl { position:fixed; inset:0; background:rgba(20,16,14,.6); backdrop-filter:blur(8px); z-index:500; display:flex; align-items:flex-end; justify-content:center; animation:ovlIn .2s ease; }
        @media(min-width:640px){ .ovl { align-items:center; } }
        @keyframes ovlIn { from{opacity:0} to{opacity:1} }
        .mdl { background:#F9F6F2; border-radius:24px 24px 0 0; width:100%; max-width:520px; max-height:92svh; overflow-y:auto; padding:26px 24px 32px; animation:mdlIn .3s cubic-bezier(.16,1,.3,1); }
        @media(min-width:640px){ .mdl { border-radius:24px; } }
        @keyframes mdlIn { from{opacity:0; transform:translateY(24px)} to{opacity:1; transform:none} }
        .mdl-h { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .mdl-h h3 { font-family:'Cormorant Garamond',serif; font-size:23px; font-weight:300; margin:0; color:#1A1A1A; }

        /* --- Tableaux responsive --- */
        .tw { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:thin; }
        .rows { display:flex; flex-direction:column; gap:6px; }
        .row { display:grid; gap:12px; align-items:center; padding:13px 16px; background:#fff; border:1.5px solid #EFE6DC; border-radius:14px; transition:border-color .18s, box-shadow .18s; }
        .row:hover { border-color:#DECFBE; box-shadow:0 2px 10px rgba(26,26,26,.05); }

        /* --- Switch --- */
        .sw { width:36px; height:20px; border-radius:10px; background:#E5DACE; position:relative; cursor:pointer; transition:background .22s; flex-shrink:0; border:none; padding:0; }
        .sw.on { background:#C9A96A; }
        .sw::after { content:''; position:absolute; top:3px; left:3px; width:14px; height:14px; border-radius:50%; background:#fff; transition:left .22s cubic-bezier(.2,0,.2,1); }
        .sw.on::after { left:19px; }

        /* --- États --- */
        .empty { padding:48px 20px; text-align:center; color:#B5A79E; font-size:13px; }
        .skel { background:linear-gradient(90deg,#F0EAE3 25%,#F7F2EC 50%,#F0EAE3 75%); background-size:200% 100%; animation:skel 1.4s infinite; border-radius:12px; }
        @keyframes skel { from{background-position:200% 0} to{background-position:-200% 0} }

        .badge { display:inline-flex; align-items:center; padding:4px 10px; border-radius:100px; font-size:10px; font-weight:600; letter-spacing:.04em; }

        /* --- Grilles auto-responsive --- */
        .g2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; }
        .g3 { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; }
        .g4 { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:10px; }

        @media (max-width: 900px) {
          /* Les lignes en grille passent en bloc empilé */
          .row { grid-template-columns: 1fr !important; gap: 9px !important; }
          .row > * { min-width: 0; }
          /* Toute grille inline à colonnes fixes devient fluide */
          [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
          .g2, .g3, .g4 { grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)) !important; }
        }

        @media (max-width: 640px) {
          .ph { margin-bottom: 16px; }
          .ph h1 { font-size: 24px; }
          .ph > button, .ph > a { width: 100%; }
          .row { padding: 12px 13px; }
          .mdl { padding: 20px 16px 26px; }
          .pg { padding: 14px 12px 32px !important; }
          .tabs { margin-bottom: 14px; }
          .tabs button { padding: 8px 13px; font-size: 11.5px; }
          .chip { padding: 7px 13px; font-size: 11.5px; }
          .f { font-size: 16px; } /* évite le zoom auto iOS */
          .lbl { font-size: 9.5px; }
          .b-primary, .b-gold { padding: 12px 20px; font-size: 12px; }
          /* Les modales prennent toute la largeur en bas d'écran */
          .mdl { max-height: 94svh; }
          /* Les tableaux scrollent au lieu de déborder */
          .tw { margin: 0 -12px; padding: 0 12px; }
        }

        /* Sécurité globale : rien ne déborde jamais */
        .adm img, .adm svg, .adm canvas { max-width: 100%; }
        .adm .recharts-wrapper { max-width: 100% !important; }
      `}</style>

      {/* SIDEBAR */}
      <aside className="admin-aside" style={{
        width: collapsed ? 68 : 224,
        background: T.black,
        display:'flex', flexDirection:'column',
        transition:'width 0.25s cubic-bezier(0.25,0.46,0.45,0.94)',
        position:'fixed', top:0, left:0, bottom:0,
        zIndex:100, overflow:'hidden',
        borderRadius:'0 24px 24px 0',
        boxShadow:'4px 0 24px rgba(26,26,26,0.15)',
      }}>
        {/* Logo */}
        <div className="admin-aside-head" style={{ padding: collapsed ? '28px 16px' : '28px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
          {!collapsed && (
            <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, color:T.offwhite, fontWeight:300, letterSpacing:'0.02em' }}>ADORÉA</div>
          )}
          {collapsed && <div style={{ fontSize:16, color:T.gold, fontWeight:700, textAlign:'center' }}>A</div>}
          <div style={{ fontSize:9, letterSpacing:'0.18em', color:T.muted, marginTop:3, textTransform:'uppercase' }}>
            {collapsed ? '' : 'Admin'}
          </div>
        </div>

        {/* Nav */}
        <nav className="admin-nav" style={{ flex:1, display:'flex', flexDirection:'column', padding:'10px 0', overflowY:'auto', overflowX:'hidden', scrollbarWidth:'none' }}>
          {NAV.map(item => {
            const active = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`nav-link${active ? ' active' : ''}`}
                style={{ color: active ? T.gold : 'rgba(255,255,255,0.42)', paddingLeft: collapsed ? 0 : 16, justifyContent: collapsed ? 'center' : 'flex-start' }}>
                <span className="ico">{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <button onClick={logout} className="admin-logout" style={{
          background:'transparent', border:'none', cursor:'pointer',
          padding: collapsed ? '14px 0' : '14px 20px', color:'rgba(255,255,255,0.5)',
          fontSize:12, borderTop:'1px solid rgba(255,255,255,0.06)',
          display:'flex', alignItems:'center', gap:10, transition:'all 0.2s',
          justifyContent: collapsed ? 'center' : 'flex-start', flexShrink:0,
          fontFamily:'Manrope,sans-serif', letterSpacing:'0.05em',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#F44336')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
        >
          <span style={{fontSize:14}}>↩</span>
          {!collapsed && 'Déconnexion'}
        </button>

        {/* Collapse */}
        <button onClick={() => setCollapsed(c => !c)} className="admin-collapse" style={{
          background:'transparent', border:'none', cursor:'pointer',
          padding:'16px', color:T.muted, fontSize:18, borderTop:'1px solid rgba(255,255,255,0.06)',
          display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'flex-end',
          paddingRight: collapsed ? 0 : 20, transition:'all 0.2s',
          flexShrink:0,
        }}>
          {collapsed ? '→' : '←'}
        </button>
      </aside>

      {/* MAIN */}
      <main className="admin-main" style={{
        flex:1,
        marginLeft: collapsed ? 68 : 224,
        transition:'margin-left 0.25s cubic-bezier(0.25,0.46,0.45,0.94)',
        minHeight:'100vh',
        background:'#F2EDE8',
      }}>
        {/* Content wrapper avec padding et coins arrondis visuels */}
        <div className="admin-content" style={{ padding:'20px 20px 80px', minHeight:'100vh' }}>
          <AdminDiagnostic />
          <div className="admin-card" style={{
            background:T.offwhite, borderRadius:24,
            minHeight:'calc(100vh - 40px)',
            boxShadow:'0 2px 16px rgba(26,26,26,0.06)',
            overflow:'hidden',
          }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
