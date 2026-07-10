import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import LangSwitcher from '../components/LangSwitcher'

const INTER   = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
const MANROPE = "'Manrope', sans-serif"

const IChart    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const IBurger   = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
const IFolder   = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
const IImage    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const IPackage  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
const IGear     = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
const ILogout   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>

export default function AdminLayout() {
  const { logout, admin } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const handleLogout = () => { logout(); navigate('/admin/login') }

  const NAV = [
    { to:'dashboard',  label: t('admin.nav.dashboard'),  Icon:IChart   },
    { to:'products',   label: t('admin.nav.products'),   Icon:IBurger  },
    { to:'categories', label: t('admin.nav.categories'), Icon:IFolder  },
    { to:'banners',    label: t('admin.nav.banners'),    Icon:IImage   },
    { to:'orders',     label: t('admin.nav.orders'),     Icon:IPackage },
    { to:'settings',   label: t('admin.nav.settings'),   Icon:IGear    },
  ]

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#F5F2EF', fontFamily:MANROPE, position:'relative' }}>
      {/* Ambient blobs */}
      <div style={{ position:'fixed', inset:0, overflow:'hidden', zIndex:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:-200, right:-130, width:560, height:560, borderRadius:'50%', background:'radial-gradient(circle,rgba(229,35,43,.14) 0%,transparent 65%)', filter:'blur(90px)' }} />
        <div style={{ position:'absolute', bottom:-120, left:-110, width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,165,60,.10) 0%,transparent 65%)', filter:'blur(100px)' }} />
        <div style={{ position:'absolute', top:'42%', right:'15%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,90,70,.08) 0%,transparent 70%)', filter:'blur(70px)' }} />
      </div>

      {/* Sidebar */}
      <aside style={{
        width: 244, flexShrink: 0,
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        borderRight: '1px solid rgba(255,255,255,0.78)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0,
        height: '100vh', zIndex: 10,
        boxShadow: '4px 0 32px rgba(30,20,15,0.07)',
      }}>
        {/* Logo */}
        <div style={{ padding:'26px 22px 18px', borderBottom:'1px solid rgba(20,16,14,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', userSelect:'none' }}>
            <img src="/logo-oq.png" alt="OlimFood" style={{ height:34, objectFit:'contain', display:'block' }} />
          </div>
          <div style={{ fontFamily:MANROPE, fontSize:10, color:'#8B827B', marginTop:5, fontWeight:800, letterSpacing:'.1em' }}>ADMIN PANEL</div>
          <div style={{ marginTop:10 }}>
            <LangSwitcher style={{ background:'rgba(0,0,0,0.04)' }} />
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'14px 10px', overflowY:'auto' }}>
          <div style={{ fontFamily:MANROPE, fontSize:10, fontWeight:800, color:'#C0B8B4', letterSpacing:'.1em', padding:'6px 14px 10px' }}>{t('admin.nav.navigation')}</div>
          {NAV.map(({ to, label, Icon }) => (
            <NavLink key={to} to={`/admin/${to}`}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 12, marginBottom: 2,
                fontFamily: MANROPE, fontSize: 13.5, fontWeight: 600,
                textDecoration: 'none', transition: 'all .18s ease',
                background: isActive ? 'linear-gradient(135deg,rgba(229,35,43,.10),rgba(229,35,43,.05))' : 'transparent',
                color: isActive ? '#E5232B' : '#8B827B',
                border: isActive ? '1px solid rgba(229,35,43,.14)' : '1px solid transparent',
                boxShadow: isActive ? '0 2px 12px rgba(229,35,43,.10)' : 'none',
              })}>
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding:'14px 16px 20px', borderTop:'1px solid rgba(20,16,14,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
            <div style={{ width:36, height:36, borderRadius:11, background:'linear-gradient(135deg,#E5232B,#C01820)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:INTER, fontSize:15, fontWeight:800, flexShrink:0, boxShadow:'0 3px 10px rgba(229,35,43,.28)' }}>
              {(admin?.username || 'A')[0].toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontFamily:MANROPE, fontSize:13, fontWeight:700, color:'#1A1513', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{admin?.username || 'Admin'}</div>
              <div style={{ fontFamily:MANROPE, fontSize:11, color:'#8B827B' }}>{t('admin.nav.role')}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ flexShrink:0, background:'rgba(229,35,43,.07)', border:'1px solid rgba(229,35,43,.16)', color:'#E5232B', borderRadius:9, padding:'7px 10px', fontFamily:MANROPE, fontSize:11.5, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5, transition:'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(229,35,43,.13)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(229,35,43,.07)'}>
            <ILogout /> {t('admin.nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft:244, flex:1, padding:'36px 40px', minHeight:'100vh', color:'#1A1513', position:'relative', zIndex:1 }}>
        <Outlet />
      </main>
    </div>
  )
}
