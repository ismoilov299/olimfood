import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getStats, getOrders } from '../../api'

const SORA    = "'Sora', sans-serif"
const MANROPE = "'Manrope', sans-serif"
const MONO    = "'Space Mono', monospace"

const STATUS_CFG = {
  new:        { bg:'rgba(59,130,246,.10)',  color:'#2563EB', bd:'rgba(59,130,246,.22)'  },
  confirmed:  { bg:'rgba(139,92,246,.10)',  color:'#7C3AED', bd:'rgba(139,92,246,.22)'  },
  preparing:  { bg:'rgba(245,158,11,.10)',  color:'#D97706', bd:'rgba(245,158,11,.22)'  },
  delivering: { bg:'rgba(14,165,233,.10)',  color:'#0284C7', bd:'rgba(14,165,233,.22)'  },
  delivered:  { bg:'rgba(34,197,94,.10)',   color:'#15803D', bd:'rgba(34,197,94,.22)'   },
  cancelled:  { bg:'rgba(239,68,68,.10)',   color:'#DC2626', bd:'rgba(239,68,68,.22)'   },
}

const CARD_CFG = [
  { key:'total_orders',     Icon:IOrders,   accent:'#6366F1', trend:+12              },
  { key:'new_orders',       Icon:INew,      accent:'#E5232B', trend:+5               },
  { key:'today_orders',     Icon:IToday,    accent:'#F59E0B', trend:+8               },
  { key:'total_products',   Icon:IProducts, accent:'#06B6D4', trend:+2               },
  { key:'total_categories', Icon:ICats,     accent:'#8B5CF6', trend:0                },
  { key:'total_revenue',    Icon:IRevenue,  accent:'#22C55E', trend:+18, money:true  },
]

const LABEL_KEYS = {
  total_orders:     'admin.dashboard.total_orders',
  new_orders:       'admin.dashboard.new_orders',
  today_orders:     'admin.dashboard.today_orders',
  total_products:   'admin.dashboard.total_products',
  total_categories: 'admin.dashboard.categories',
  total_revenue:    'admin.dashboard.revenue',
}

const fmtN = n => n?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') ?? '—'
const fmtM = n => {
  if (!n) return '—'
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' mlrd'
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + ' mln'
  if (n >= 1_000)         return (n / 1_000).toFixed(0) + ' K'
  return n.toString()
}

function IOrders({ c })   { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function INew({ c })      { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> }
function IToday({ c })    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function IProducts({ c }) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> }
function ICats({ c })     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> }
function IRevenue({ c })  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> }
function IUp({ c })       { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }

function StatCard({ Icon, label, value, accent, trend, stableLabel }) {
  const up = trend >= 0
  return (
    <div style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'blur(20px) saturate(180%)', WebkitBackdropFilter:'blur(20px) saturate(180%)', borderRadius:22, border:`1px solid rgba(255,255,255,0.95)`, padding:'22px 24px 20px', boxShadow:`0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px ${accent}18`, position:'relative', overflow:'hidden', cursor:'default', transition:'transform .18s, box-shadow .18s' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px ${accent}28` }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px ${accent}18` }}>
      <div style={{ position:'absolute', top:-40, right:-40, width:120, height:120, borderRadius:'50%', background:`radial-gradient(circle,${accent}28 0%,transparent 70%)`, filter:'blur(24px)', pointerEvents:'none' }} />
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
        <div style={{ width:44, height:44, borderRadius:14, background:`${accent}14`, border:`1px solid ${accent}26`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon c={accent} />
        </div>
        {trend !== 0
          ? <div style={{ display:'flex', alignItems:'center', gap:4, background: up ? 'rgba(34,197,94,.10)' : 'rgba(239,68,68,.10)', color: up ? '#15803D' : '#DC2626', fontFamily:MANROPE, fontSize:11, fontWeight:700, padding:'4px 9px', borderRadius:8, border:`1px solid ${up ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)'}` }}>
              <IUp c={up ? '#15803D' : '#DC2626'} />
              {up ? '+' : ''}{trend}%
            </div>
          : <div style={{ fontFamily:MANROPE, fontSize:11, fontWeight:600, color:'#8B827B', padding:'4px 9px', borderRadius:8, background:'rgba(139,130,123,.08)', border:'1px solid rgba(139,130,123,.14)' }}>{stableLabel}</div>
        }
      </div>
      <div style={{ fontFamily:SORA, fontWeight:800, fontSize:34, color:'#1A1513', lineHeight:1, marginBottom:6, letterSpacing:'-.02em' }}>{value ?? '—'}</div>
      <div style={{ fontFamily:MANROPE, fontWeight:600, fontSize:12.5, color:'#8B827B' }}>{label}</div>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${accent},${accent}30)`, borderRadius:'0 0 22px 22px' }} />
    </div>
  )
}

function SkeletonCard({ accent }) {
  return (
    <div style={{ borderRadius:22, background:`${accent}08`, border:`1px solid ${accent}14`, height:148, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.5) 50%,transparent 100%)', animation:'shimmer 1.4s infinite' }} />
    </div>
  )
}

export default function Dashboard() {
  const [stats,  setStats]  = useState(null)
  const [orders, setOrders] = useState([])
  const { t, i18n } = useTranslation()

  const now      = new Date()
  const locale   = i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'en' ? 'en-US' : 'uz-UZ'
  const weekday  = now.toLocaleDateString(locale, { weekday:'long' })
  const datePart = now.toLocaleDateString(locale, { year:'numeric', month:'long', day:'numeric' })

  useEffect(() => {
    getStats().then(r => setStats(r.data)).catch(() => {})
    getOrders().then(r => setOrders((r.data || []).slice(0, 10))).catch(() => {})
  }, [])

  return (
    <div style={{ fontFamily:MANROPE }}>
      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>

      <div style={{ marginBottom:32 }}>
        <div style={{ fontFamily:SORA, fontSize:30, fontWeight:800, color:'#1A1513', letterSpacing:'-.02em', lineHeight:1.1, marginBottom:6 }}>
          {t('admin.dashboard.title')}
        </div>
        <div style={{ fontFamily:MANROPE, fontSize:13.5, color:'#8B827B' }}>{weekday}, {datePart}</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18, marginBottom:32 }}>
        {CARD_CFG.map(({ key, Icon, accent, trend, money }) =>
          stats
            ? <StatCard key={key} Icon={Icon} label={t(LABEL_KEYS[key])} accent={accent} trend={trend} stableLabel={t('admin.dashboard.stable')}
                value={money ? fmtM(stats[key]) : fmtN(stats[key])} />
            : <SkeletonCard key={key} accent={accent} />
        )}
      </div>

      {orders.length > 0 && (
        <div style={{ display:'flex', gap:10, marginBottom:28, flexWrap:'wrap' }}>
          {Object.entries(STATUS_CFG).map(([key, s]) => {
            const count = orders.filter(o => o.status === key).length
            if (!count) return null
            return (
              <div key={key} style={{ display:'flex', alignItems:'center', gap:7, background:s.bg, border:`1px solid ${s.bd}`, borderRadius:20, padding:'6px 14px' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:s.color }} />
                <span style={{ fontFamily:MANROPE, fontSize:12, fontWeight:700, color:s.color }}>{t(`status.${key}`)}</span>
                <span style={{ fontFamily:SORA, fontSize:12, fontWeight:800, color:s.color }}>{count}</span>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'blur(20px) saturate(180%)', WebkitBackdropFilter:'blur(20px) saturate(180%)', borderRadius:22, border:'1px solid rgba(255,255,255,0.95)', boxShadow:'0 4px 28px rgba(0,0,0,0.06)', overflow:'hidden' }}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(20,16,14,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:SORA, fontWeight:700, fontSize:17, color:'#1A1513' }}>{t('admin.dashboard.recent_orders')}</div>
          <span style={{ fontFamily:MANROPE, fontWeight:700, fontSize:12.5, color:'#E5232B', cursor:'pointer', letterSpacing:'.01em' }}>{t('admin.dashboard.view_all')} →</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {[t('admin.dashboard.col_id'), t('admin.dashboard.col_customer'), t('admin.dashboard.col_address'), t('admin.dashboard.col_amount'), t('admin.dashboard.col_payment'), t('admin.dashboard.col_status'), t('admin.dashboard.col_time')].map(h => (
                  <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontFamily:MANROPE, fontWeight:800, fontSize:10.5, color:'#8B827B', letterSpacing:'.08em', background:'rgba(20,16,14,0.02)', borderBottom:'1px solid rgba(20,16,14,0.05)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const st = STATUS_CFG[o.status] || { bg:'rgba(0,0,0,.06)', color:'#888', bd:'rgba(0,0,0,.12)' }
                return (
                  <tr key={o.id} style={{ borderTop:'1px solid rgba(20,16,14,0.04)', transition:'background .15s', cursor:'default' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(20,16,14,.025)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'14px 20px', fontFamily:MONO, fontSize:11, color:'#C0B8B4', fontWeight:700 }}>#{o.id}</td>
                    <td style={{ padding:'14px 20px', fontFamily:MANROPE, fontWeight:700, fontSize:13.5, color:'#1A1513', whiteSpace:'nowrap' }}>{o.name}</td>
                    <td style={{ padding:'14px 20px', fontFamily:MANROPE, fontSize:13, color:'#8B827B', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.address || '—'}</td>
                    <td style={{ padding:'14px 20px', whiteSpace:'nowrap' }}>
                      <span style={{ fontFamily:SORA, fontWeight:800, fontSize:14, color:'#E5232B' }}>{fmtN(o.total)}</span>
                      {' '}<span style={{ fontFamily:MANROPE, fontSize:11, color:'#8B827B', fontWeight:600 }}>{t('common.currency')}</span>
                    </td>
                    <td style={{ padding:'14px 20px', fontFamily:MANROPE, fontSize:13, color:'#8B827B', textTransform:'capitalize' }}>{o.payment || '—'}</td>
                    <td style={{ padding:'14px 20px' }}>
                      <span style={{ background:st.bg, color:st.color, border:`1px solid ${st.bd}`, borderRadius:20, padding:'4px 12px', fontFamily:MANROPE, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>
                        {t(`status.${o.status}`, { defaultValue: o.status })}
                      </span>
                    </td>
                    <td style={{ padding:'14px 20px', fontFamily:MONO, fontSize:11, color:'#C0B8B4', whiteSpace:'nowrap' }}>
                      {new Date(o.created_at).toLocaleString(locale, { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                    </td>
                  </tr>
                )
              })}
              {orders.length === 0 && (
                <tr><td colSpan={7} style={{ padding:'64px 20px', textAlign:'center' }}>
                  <div style={{ fontFamily:MANROPE, color:'#C0B8B4', fontWeight:500, fontSize:14 }}>{t('admin.dashboard.no_orders')}</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
