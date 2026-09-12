'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const T = { nude:'#D7B6B1', beige:'#EADCC8', gold:'#C9A96A', black:'#1A1A1A', offwhite:'#F9F6F2', muted:'#8A7A74' }

const NAV = [
  { href:'/admin',              icon:'▦',  label:'Dashboard' },
  { href:'/admin/appointments', icon:'📅', label:'Rendez-vous' },
  { href:'/admin/caisse',       icon:'💳', label:'Caisse' },
  { href:'/admin/clients',      icon:'👤', label:'Clientes' },
  { href:'/admin/services',     icon:'✦',  label:'Prestations' },
  { href:'/admin/employees',    icon:'👥', label:'Équipe' },
  { href:'/admin/planning',     icon:'🗓', label:'Planning' },
  { href:'/admin/loyalty',      icon:'⭐', label:'Fidélité' },
  { href:'/admin/promotions',   icon:'🏷', label:'Promos' },
  { href:'/admin/accounting',   icon:'📊', label:'Comptabilité' },
  { href:'/admin/expenses',     icon:'🧾', label:'Dépenses' },
  { href:'/admin/gallery',      icon:'🖼', label:'Galerie' },
  { href:'/admin/settings',     icon:'⚙️', label:'Paramètres' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#F2EDE8' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Manrope:wght@400;500;600&display=swap');
        .nav-link { display:flex; align-items:center; gap:10px; padding:10px 16px; border-radius:14px; text-decoration:none; font-size:13px; font-weight:400; transition:all 0.2s ease; margin:2px 8px; white-space:nowrap; }
        .nav-link:hover { background:rgba(201,169,106,0.1); color:#C9A96A; }
        .nav-link.active { background:rgba(201,169,106,0.15); color:#C9A96A; font-weight:500; }
        .nav-link .ico { font-size:16px; flex-shrink:0; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{
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
        <div style={{ padding: collapsed ? '28px 16px' : '28px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
          {!collapsed && (
            <div style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, color:T.offwhite, fontWeight:300, letterSpacing:'0.02em' }}>ADORÉA</div>
          )}
          {collapsed && <div style={{ fontSize:16, color:T.gold, fontWeight:700, textAlign:'center' }}>A</div>}
          <div style={{ fontSize:9, letterSpacing:'0.18em', color:T.muted, marginTop:3, textTransform:'uppercase' }}>
            {collapsed ? '' : 'Admin'}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'10px 0', overflowY:'auto', overflowX:'hidden', scrollbarWidth:'none' }}>
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
        <button onClick={logout} style={{
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
        <button onClick={() => setCollapsed(c => !c)} style={{
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
      <main style={{
        flex:1,
        marginLeft: collapsed ? 68 : 224,
        transition:'margin-left 0.25s cubic-bezier(0.25,0.46,0.45,0.94)',
        minHeight:'100vh',
        background:'#F2EDE8',
      }}>
        {/* Content wrapper avec padding et coins arrondis visuels */}
        <div style={{ padding:'20px 20px 80px', minHeight:'100vh' }}>
          <div style={{
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
