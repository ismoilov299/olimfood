import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getCategories, getProducts, getBanners, createOrder, getSetting, getMyOrders, validatePromo } from '../api'
import useCartStore from '../store/cartStore'
import LangSwitcher from '../components/LangSwitcher'

// ─── Design tokens (spec-exact) ───────────────────────────────────────────────
const THEMES = {
  light: {
    bg:       '#F5F2EF',
    surface:  '#FFFFFF',
    fg:       '#1A1513',
    muted:    '#8B827B',
    line:     'rgba(20,16,14,0.07)',
    red:      '#E5232B',
    shadow:   '0 10px 30px rgba(30,20,15,0.10)',
    // liquid glass
    glass:    'rgba(255,255,255,0.52)',
    glassS:   'rgba(255,255,255,0.72)',
    glassBd:  'rgba(255,255,255,0.66)',
    // ambient blobs
    blobA:    'rgba(255,70,60,0.20)',
    blobB:    'rgba(255,165,60,0.16)',
    blobC:    'rgba(255,90,70,0.13)',
  },
  dark: {
    bg:       '#0D0D0F',
    surface:  '#17181B',
    fg:       '#FFFFFF',
    muted:    '#A7A7A7',
    line:     '#2A2A2A',
    red:      '#E30613',
    shadow:   '0 10px 34px rgba(0,0,0,0.55)',
    glass:    'rgba(23,24,27,0.46)',
    glassS:   'rgba(30,31,35,0.62)',
    glassBd:  'rgba(255,255,255,0.10)',
    blobA:    'rgba(227,6,19,0.26)',
    blobB:    'rgba(255,150,50,0.17)',
    blobC:    'rgba(227,6,19,0.16)',
  },
}

const fmtNum = n => n ? Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '0'
const qtyStep  = unit => unit === 'kg' ? 0.5 : 1
const fmtQty   = (qty, unit) => unit === 'kg' ? (Math.round(qty*10)/10).toFixed(1) : String(qty)
const INTER   = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
const MANROPE = "'Manrope', sans-serif"
const MONO    = "'Space Mono', monospace"

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const ICart = ({ s=21, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="20" r="1.4" fill={c}/><circle cx="18" cy="20" r="1.4" fill={c}/>
    <path d="M2.5 3h2.2l2.2 12.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2L21.5 7H6"/>
  </svg>
)
const IHome = ({ s=23, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round">
    <path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/>
  </svg>
)
const IMenu = ({ s=23, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
    <line x1="3.5" y1="6.5" x2="20.5" y2="6.5"/><line x1="3.5" y1="12" x2="20.5" y2="12"/><line x1="3.5" y1="17.5" x2="20.5" y2="17.5"/>
  </svg>
)
const IBox = ({ s=23, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round">
    <path d="M3 8 12 3l9 5v8l-9 5-9-5Z"/><path d="m3 8 9 5 9-5M12 13v8"/>
  </svg>
)
const IGrid = ({ s=23, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round">
    <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6"/>
    <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6"/>
    <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6"/>
    <rect x="13" y="13" width="7.5" height="7.5" rx="1.6"/>
  </svg>
)
const IPerson = ({ s=23, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>
  </svg>
)
const IHeart = ({ s=15, c='currentColor', filled=false }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? c : 'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>
  </svg>
)
const IBack = ({ s=20, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 5-7 7 7 7"/>
  </svg>
)
const IPlus = ({ s=16, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IMinus = ({ s=16, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IMoon = ({ s=18, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
)
const ISun = ({ s=18, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const ICross = ({ s=14, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IArrow = ({ s=18, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
)
const ITrash = ({ s=17, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>
  </svg>
)
const ITag = ({ s=19, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5 12 4l9 5.5v9L12 20l-9-1.5z"/><path d="m3 9.5 9 5 9-5M12 14.5V20"/>
  </svg>
)
const ICheckCircle = ({ s=52, c='currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

// ─── Ambient blobs ────────────────────────────────────────────────────────────
function Blobs({ t }) {
  return (
    <>
      <div style={{ position:'fixed', top:-70, right:-60, width:300, height:300, borderRadius:'50%', background:`radial-gradient(circle, ${t.blobA}, transparent 68%)`, pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', top:'38%', left:-80, width:260, height:260, borderRadius:'50%', background:`radial-gradient(circle, ${t.blobB}, transparent 68%)`, pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:60, right:-60, width:240, height:240, borderRadius:'50%', background:`radial-gradient(circle, ${t.blobC}, transparent 70%)`, pointerEvents:'none', zIndex:0 }} />
    </>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ t, totalItems, onCartOpen, onFavorites, isDark, onToggle, cartBtnRef }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t: tr } = useTranslation()
  return (
    <header style={{ position:'sticky', top:0, zIndex:20, background:t.glass, backdropFilter:'blur(22px) saturate(180%)', WebkitBackdropFilter:'blur(22px) saturate(180%)', padding:'16px 20px 13px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${t.glassBd}` }}>
      <button onClick={() => setMenuOpen(v => !v)} style={{ width:40, height:40, borderRadius:12, border:'none', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
        <IMenu s={22} c={t.fg} />
      </button>

      <img className="anim-logo" src={isDark ? '/logo-oq-dark.png' : '/logo-oq.png'} alt="OlimFood" style={{ height:32, objectFit:'contain', display:'block' }} />

      <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
        <button onClick={onFavorites} style={{ width:40, height:40, borderRadius:12, border:'none', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <IHeart s={20} c={t.fg} />
        </button>
        <button ref={cartBtnRef} onClick={onCartOpen} style={{ position:'relative', width:40, height:40, borderRadius:12, border:'none', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <ICart s={21} c={t.fg} />
          {totalItems > 0 && (
            <span style={{ position:'absolute', top:1, right:1, minWidth:17, height:17, padding:'0 4px', background:t.red, color:'#fff', borderRadius:'999px', fontFamily:MANROPE, fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:`2px solid ${t.surface}` }}>{totalItems}</span>
          )}
        </button>
      </div>

      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position:'fixed', inset:0, zIndex:99 }} />}
      {menuOpen && (
        <div style={{ position:'absolute', top:'100%', left:16, marginTop:8, background:t.surface, border:`1px solid ${t.line}`, borderRadius:16, padding:14, boxShadow:t.shadow, zIndex:100, display:'flex', flexDirection:'column', gap:10, minWidth:180 }}>
          <LangSwitcher style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: t.fg }} />
          <button onClick={onToggle} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 11px', borderRadius:10, border:`1px solid ${t.line}`, background:'transparent', cursor:'pointer', color:t.fg, fontFamily:MANROPE, fontSize:13, fontWeight:600 }}>
            {isDark ? <ISun s={16} c={t.muted} /> : <IMoon s={16} c={t.muted} />}
            {isDark ? tr('header.light_mode') : tr('header.dark_mode')}
          </button>
        </div>
      )}
    </header>
  )
}

// ─── Banner ───────────────────────────────────────────────────────────────────
const BANNER_BG = {
  red:    'radial-gradient(120% 140% at 100% 30%, #ff2d20 0%, #8e1018 38%, #2c0507 100%)',
  blue:   'radial-gradient(120% 140% at 100% 30%, #2563EB, #1e3a8a 38%, #0f172a)',
  orange: 'radial-gradient(120% 140% at 100% 30%, #f97316, #92400e 38%, #1c0a00)',
  green:  'radial-gradient(120% 140% at 100% 30%, #16a34a, #14532d 38%, #052e16)',
  purple: 'radial-gradient(120% 140% at 100% 30%, #7c3aed, #4c1d95 38%, #1e0047)',
}

function BannerSlide({ b, onCta }) {
  const handleCta = () => { if (onCta) onCta(b) }
  const { t: tr } = useTranslation()

  if (b.mode === 'image' && b.image_url) {
    return (
      <div style={{ overflow:'hidden', position:'relative', background:'#1a1a1a', height:180 }}>
        <img src={b.image_url} alt={b.image_title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(transparent 30%, rgba(0,0,0,.75))' }} />
        {(b.image_title || b.image_sub) && (
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'16px 20px' }}>
            {b.image_title && <div style={{ fontFamily:INTER, fontSize:22, fontWeight:800, color:'#fff', lineHeight:1.15 }}>{b.image_title}</div>}
            {b.image_sub   && <div style={{ fontFamily:MANROPE, fontSize:12, color:'rgba(255,255,255,.6)', marginTop:3 }}>{b.image_sub}</div>}
          </div>
        )}
        {b.cta_text && (
          <button onClick={handleCta} style={{ position:'absolute', bottom:16, right:16, display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.92)', backdropFilter:'blur(8px)', color:'#171010', border:'none', fontFamily:MANROPE, fontWeight:700, fontSize:12, padding:'9px 16px', borderRadius:12, cursor:'pointer' }}>
            {b.cta_text} <span style={{ fontSize:13 }}>→</span>
          </button>
        )}
      </div>
    )
  }
  const bg = b.theme === 'custom' && b.grad_from
    ? `radial-gradient(120% 140% at 100% 30%, ${b.grad_from}, ${b.grad_to} 38%, #0d0000)`
    : (BANNER_BG[b.theme] || BANNER_BG.red)
  return (
    <div style={{ position:'relative', overflow:'hidden', padding:'26px 24px', background:bg }}>
      <div style={{ position:'absolute', right:-40, bottom:-60, width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,120,60,.55), rgba(255,60,40,0) 65%)', pointerEvents:'none' }} />
      <div style={{ position:'relative' }}>
        {b.discount > 0 && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.16)', backdropFilter:'blur(4px)', color:'#fff', fontFamily:MANROPE, fontWeight:800, fontSize:10, letterSpacing:'.08em', padding:'7px 12px', borderRadius:'999px' }}>
            {tr('admin.banners.special_offer')}
          </div>
        )}
        <div style={{ fontFamily:INTER, fontWeight:800, fontSize:36, color:'#fff', marginTop:14, letterSpacing:'-.02em', lineHeight:1.02 }}>
          {b.discount > 0 ? `${b.discount}% ${tr('admin.banners.discount_label')}` : b.title}
        </div>
        {(b.subtitle || b.code) && (
          <div style={{ fontFamily:MANROPE, fontWeight:500, fontSize:13, color:'rgba(255,255,255,.78)', marginTop:7 }}>
            {b.subtitle}{b.code && <> · <span style={{ fontFamily:MONO, letterSpacing:'.02em' }}>{b.code}</span></>}
          </div>
        )}
        {b.cta_text && (
          <button onClick={handleCta} style={{ marginTop:18, display:'inline-flex', alignItems:'center', gap:8, background:'#fff', color:'#171010', border:'none', fontFamily:MANROPE, fontWeight:700, fontSize:13, padding:'12px 18px', borderRadius:14, cursor:'pointer' }}>
            {b.cta_text} <span style={{ fontSize:15 }}>→</span>
          </button>
        )}
      </div>
    </div>
  )
}

function BannerCarousel({ banners, t, onCta }) {
  const [idx, setIdx] = useState(0)
  const touchX = useRef(null)
  const timer  = useRef(null)
  const go = useCallback(i => setIdx((i + banners.length) % banners.length), [banners.length])

  useEffect(() => {
    if (banners.length < 2) return
    timer.current = setInterval(() => go(idx + 1), 3200)
    return () => clearInterval(timer.current)
  }, [idx, go, banners.length])

  if (!banners.length) return null
  return (
    <div style={{ padding:'10px 0 4px' }}>
      <div style={{ overflow:'hidden' }}
        onTouchStart={e => { touchX.current = e.touches[0].clientX }}
        onTouchEnd={e => {
          if (touchX.current === null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          if (Math.abs(dx) > 40) go(dx < 0 ? idx+1 : idx-1)
          touchX.current = null
        }}>
        <div style={{ display:'flex', transform:`translateX(-${idx*100}%)`, transition:'transform .4s cubic-bezier(.4,0,.2,1)' }}>
          {banners.map(b => <div key={b.id} style={{ minWidth:'100%' }}><BannerSlide b={b} onCta={onCta} /></div>)}
        </div>
      </div>
      {banners.length > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:7, marginTop:14 }}>
          {banners.map((_, i) => (
            <button key={i} onClick={() => go(i)} style={{ width: i===idx ? 22 : 7, height:7, borderRadius:'999px', border:'none', padding:0, cursor:'pointer', background: i===idx ? t.red : t.line, transition:'all .3s' }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Categories ───────────────────────────────────────────────────────────────
function CategoryScroll({ categories, active, onSelect, t, allImage, onViewAll }) {
  const { t: tr } = useTranslation()
  const all = [{ id:null, name: tr('home.all_category'), _isAll:true, image_url:allImage }, ...categories]
  return (
    <div style={{ padding:'14px 0 4px' }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', padding:'0 20px 14px' }}>
        <span style={{ fontFamily:INTER, fontWeight:800, fontSize:18, color:t.fg }}>{tr('home.categories_label_title')}</span>
        <span onClick={onViewAll} style={{ fontFamily:MANROPE, fontWeight:600, fontSize:13, color:t.red, cursor:'pointer' }}>{tr('home.view_all')}</span>
      </div>
      <div className="scroll-x" style={{ gap:12, padding:'2px 20px 6px' }}>
        {all.map(c => {
          const isActive = active === c.id
          return (
            <button key={c.id ?? 'all'} onClick={() => onSelect(c.id)}
              style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:8, border:'none', background:'transparent', cursor:'pointer', width:64, padding:0 }}>
              <span style={{ width:56, height:56, borderRadius:16, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:t.surface, border: isActive ? `1.5px solid ${t.red}` : `1px solid ${t.line}`, transition:'border-color .15s' }}>
                {c.image_url
                  ? <img src={c.image_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:24 }}>{c._isAll ? '🍽️' : (c.emoji || '🍴')}</span>
                }
              </span>
              <span title={c.name} style={{ fontFamily:MANROPE, fontWeight: isActive ? 700 : 500, fontSize:12, color: isActive ? t.red : t.muted, width:64, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'center' }}>{c.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Sub-category chip row — appears under CategoryScroll when the selected
// top-level category has children (parent/child category tree).
function SubCategoryRow({ subs, active, onSelect, t }) {
  const { t: tr } = useTranslation()
  if (!subs.length) return null
  return (
    <div className="scroll-x" style={{ gap:8, padding:'4px 20px 12px' }}>
      <button onClick={() => onSelect(null)}
        style={{ flexShrink:0, border:'none', cursor:'pointer', borderRadius:'999px', padding:'8px 15px', fontFamily:MANROPE, fontWeight:700, fontSize:12.5,
          background: active===null ? t.red : t.glassS, color: active===null ? '#fff' : t.muted,
          backdropFilter: active===null ? 'none' : 'blur(10px) saturate(160%)', WebkitBackdropFilter: active===null ? 'none' : 'blur(10px) saturate(160%)',
          border: active===null ? 'none' : `1px solid ${t.glassBd}` }}>
        {tr('home.all_category')}
      </button>
      {subs.map(s => {
        const isActive = active === s.id
        return (
          <button key={s.id} onClick={() => onSelect(s.id)} title={s.name}
            style={s.image_url ? {
              flexShrink:0, border:'none', cursor:'pointer', borderRadius:'999px', overflow:'hidden',
              width:88, height:38, padding:0,
              background:t.glassS, backdropFilter:'blur(10px) saturate(160%)', WebkitBackdropFilter:'blur(10px) saturate(160%)',
              boxShadow: isActive ? `0 0 0 2.5px ${t.red}` : `inset 0 0 0 1px ${t.glassBd}`, transition:'box-shadow .15s',
            } : {
              flexShrink:0, display:'flex', alignItems:'center', gap:6, border:'none', cursor:'pointer', borderRadius:'999px', padding:'8px 15px', fontFamily:MANROPE, fontWeight:700, fontSize:12.5,
              background: isActive ? t.red : t.glassS, color: isActive ? '#fff' : t.muted,
              backdropFilter: isActive ? 'none' : 'blur(10px) saturate(160%)', WebkitBackdropFilter: isActive ? 'none' : 'blur(10px) saturate(160%)',
              border: isActive ? 'none' : `1px solid ${t.glassBd}`,
            }}>
            {s.image_url
              ? <img src={s.image_url} alt={s.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
              : <><span>{s.emoji}</span>{s.name}</>
            }
          </button>
        )
      })}
    </div>
  )
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
function ProductCard({ p, t, onTap, onAdd, onDec, qty, liked, onLike, index=0, onFly }) {
  const final  = p.discount > 0 ? Math.round(p.price * (1 - p.discount/100)) : p.price
  const { t: tr } = useTranslation()
  const handleAddClick = e => { onFly?.(e.currentTarget, p.image_url); onAdd() }

  return (
    <div className="anim-card" onClick={onTap} style={{ animationDelay:`${Math.min(index,10)*40}ms`, background:t.surface, border:`1px solid ${t.line}`, borderRadius:16, overflow:'hidden', boxShadow:'0 2px 10px rgba(20,16,14,.06)', cursor:'pointer' }}>
      <div style={{ position:'relative', aspectRatio:'1/1', background:'repeating-linear-gradient(135deg, #ECE8E3 0, #ECE8E3 9px, #F5F2EE 9px, #F5F2EE 18px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {p.image_url && <img src={p.image_url} alt={p.name} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />}
        {!p.image_url && <span style={{ fontFamily:MONO, fontSize:9, letterSpacing:'.1em', color:t.muted, opacity:.6 }}>RASM</span>}
        {p.discount > 0 && (
          <span style={{ position:'absolute', top:7, left:7, background:t.red, color:'#fff', fontFamily:MANROPE, fontWeight:800, fontSize:9.5, padding:'4px 7px', borderRadius:'999px' }}>
            -{p.discount}%
          </span>
        )}
        {p.popular && (
          <span style={{ position:'absolute', top:7, right:7, background:'rgba(20,16,14,.72)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', color:'#fff', fontFamily:MANROPE, fontWeight:700, fontSize:8.5, padding:'4px 7px', borderRadius:'999px' }}>
            {tr('home.popular_badge')}
          </span>
        )}
        {/* Like — top-right, reference-style */}
        <button onClick={e => { e.stopPropagation(); onLike() }} style={{ position:'absolute', bottom:7, left:7, width:26, height:26, borderRadius:'50%', border:'none', background:'rgba(255,255,255,.85)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <IHeart s={12} c={liked ? t.red : t.muted} filled={liked} />
        </button>
      </div>
      <div style={{ padding:'9px 9px 11px' }}>
        <div style={{ fontFamily:MANROPE, fontWeight:700, fontSize:12, lineHeight:1.25, color:t.fg, minHeight:29 }}>{p.name}</div>
        {p.weight && (
          <div style={{ marginTop:4 }}>
            <span style={{ fontFamily:MANROPE, fontWeight:500, fontSize:10.5, color:t.muted }}>{p.weight}</span>
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:9 }}>
          <div style={{ minWidth:0 }}>
            <span style={{ fontFamily:INTER, fontWeight:800, fontSize:13, color:t.red }}>{fmtNum(final)}</span>
            {' '}<span style={{ fontFamily:MANROPE, fontWeight:600, fontSize:9.5, color:t.red }}>{tr('common.currency')}</span>
            {p.discount > 0 && <div style={{ fontFamily:MANROPE, fontSize:9, color:t.muted, textDecoration:'line-through', marginTop:1 }}>{fmtNum(p.price)} {tr('common.currency')}</div>}
          </div>
          <div onClick={e => e.stopPropagation()} style={{ flexShrink:0 }}>
            {qty > 0 ? (
              <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                <button onClick={onDec} style={{ width:24, height:24, borderRadius:8, border:`1.5px solid ${t.red}44`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><IMinus s={11} c={t.red}/></button>
                <span style={{ fontFamily:MANROPE, fontWeight:700, fontSize:12, color:t.fg, minWidth:20, textAlign:'center' }}>{fmtQty(qty, p.unit)}</span>
                <button onClick={handleAddClick} style={{ width:24, height:24, borderRadius:8, border:'none', background:t.red, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><IPlus s={11} c="#fff"/></button>
              </div>
            ) : (
              <button onClick={handleAddClick} style={{ width:28, height:28, borderRadius:9, border:'none', background:t.red, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <ICart s={13} c="#fff" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Flying-to-cart animation ─────────────────────────────────────────────────
function FlyingItem({ from, to, image, color, onDone }) {
  const [landed, setLanded] = useState(false)
  useEffect(() => {
    let raf2
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setLanded(true)) })
    const timer = setTimeout(onDone, 600)
    return () => { cancelAnimationFrame(raf1); if (raf2) cancelAnimationFrame(raf2); clearTimeout(timer) }
  }, [])
  const size = 30
  const pos = landed ? to : from
  return (
    <div style={{
      position:'fixed', zIndex:500, pointerEvents:'none',
      left: pos.x - size/2, top: pos.y - size/2, width:size, height:size,
      borderRadius:'50%', overflow:'hidden', boxShadow:'0 4px 14px rgba(0,0,0,.3)',
      background: image ? '#fff' : color,
      opacity: landed ? 0 : 1,
      transform: landed ? 'scale(.25)' : 'scale(1)',
      transition: landed
        ? 'left .55s cubic-bezier(.3,.1,.3,1), top .55s cubic-bezier(.65,0,.85,.35), transform .55s cubic-bezier(.3,.1,.3,1), opacity .2s ease .38s'
        : 'none',
    }}>
      {image && <img src={image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
    </div>
  )
}

// ─── Product Detail ───────────────────────────────────────────────────────────
function ProductDetail({ p, t, onClose, onAddCart, liked, onLike }) {
  const step = qtyStep(p.unit)
  const [qty, setQty] = useState(step)
  const [imgFull, setImgFull] = useState(false)
  const { t: tr } = useTranslation()
  const final  = p.discount > 0 ? Math.round(p.price * (1 - p.discount/100)) : p.price
  const rating = p.popular ? '4.9' : '4.7'

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, background:t.bg, overflowY:'auto', fontFamily:MANROPE }}>
      <Blobs t={t} />
      <div style={{ position:'relative', zIndex:1 }}>
        {/* Hero — 330px */}
        <div style={{ position:'relative', height:330, background:'repeating-linear-gradient(135deg, #ECE8E3 0, #ECE8E3 12px, #F5F2EE 12px, #F5F2EE 24px)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
          {p.image_url && <img src={p.image_url} alt={p.name} onClick={() => setImgFull(true)} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display:'block', cursor:'pointer' }} />}
          {!p.image_url && <span style={{ fontFamily:MONO, fontSize:11, letterSpacing:'.14em', color:t.muted, opacity:.6 }}>{tr('home.product_image')}</span>}
          {/* back — top:54px */}
          <button onClick={onClose} style={{ position:'absolute', top:54, left:20, width:44, height:44, borderRadius:14, border:`1px solid ${t.glassBd}`, background:t.glassS, backdropFilter:'blur(16px) saturate(170%)', WebkitBackdropFilter:'blur(16px) saturate(170%)', boxShadow:t.shadow, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <IBack s={20} c={t.fg} />
          </button>
          {/* like */}
          <button onClick={onLike} style={{ position:'absolute', top:54, right:20, width:44, height:44, borderRadius:14, border:`1px solid ${t.glassBd}`, background:t.glassS, backdropFilter:'blur(16px) saturate(170%)', WebkitBackdropFilter:'blur(16px) saturate(170%)', boxShadow:t.shadow, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <IHeart s={20} c={liked ? t.red : t.fg} filled={liked} />
          </button>
          {p.discount > 0 && (
            <span style={{ position:'absolute', bottom:34, left:20, background:t.red, color:'#fff', fontFamily:MANROPE, fontWeight:800, fontSize:12, padding:'7px 12px', borderRadius:'999px' }}>
              -{p.discount}% {tr('home.discount')}
            </span>
          )}
        </div>

        {/* Sheet — bg not surface */}
        <div style={{ position:'relative', marginTop:-22, background:t.bg, borderRadius:'28px 28px 0 0', padding:'24px 22px 140px' }}>
          <div style={{ width:42, height:5, borderRadius:'999px', background:t.line, margin:'0 auto 18px' }} />
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14 }}>
            <div>
              <div style={{ fontFamily:MANROPE, fontWeight:600, fontSize:12, color:t.red, letterSpacing:'.04em', marginBottom:6 }}>{p.category_name || tr('home.dish')}</div>
              <div style={{ fontFamily:INTER, fontWeight:800, fontSize:25, color:t.fg, letterSpacing:'-.01em', lineHeight:1.1 }}>{p.name}</div>
            </div>
            <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6, background:t.glassS, backdropFilter:'blur(14px) saturate(160%)', WebkitBackdropFilter:'blur(14px) saturate(160%)', border:`1px solid ${t.glassBd}`, padding:'8px 12px', borderRadius:14 }}>
              <span style={{ color:'#f5a623' }}>★</span>
              <span style={{ fontFamily:MANROPE, fontWeight:700, fontSize:14, color:t.fg }}>{rating}</span>
            </div>
          </div>
          {p.description && <p style={{ fontFamily:MANROPE, fontWeight:400, fontSize:14, lineHeight:1.65, color:t.muted, margin:'16px 0 4px' }}>{p.description}</p>}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:22 }}>
            <span style={{ fontFamily:MANROPE, fontWeight:700, fontSize:14, color:t.fg }}>{tr('home.quantity')}</span>
            <div style={{ display:'flex', alignItems:'center', gap:18, background:t.glassS, backdropFilter:'blur(14px) saturate(160%)', WebkitBackdropFilter:'blur(14px) saturate(160%)', border:`1px solid ${t.glassBd}`, borderRadius:16, padding:'8px 14px' }}>
              <button onClick={() => setQty(q => Math.max(step, Math.round((q-step)*100)/100))} style={{ width:30, height:30, borderRadius:10, border:`1px solid ${t.line}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <IMinus s={15} c={t.fg} />
              </button>
              <span style={{ fontFamily:INTER, fontWeight:800, fontSize:17, color:t.fg, minWidth:44, textAlign:'center' }}>{fmtQty(qty, p.unit)} {tr(`home.unit_${p.unit === 'kg' ? 'kg' : 'dona'}`)}</span>
              <button onClick={() => setQty(q => Math.round((q+step)*100)/100)} style={{ width:30, height:30, borderRadius:10, border:'none', background:t.red, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <IPlus s={15} c="#fff" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky add — glass */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, display:'flex', alignItems:'center', gap:16, padding:'16px 22px 30px', background:t.glassS, backdropFilter:'blur(26px) saturate(185%)', WebkitBackdropFilter:'blur(26px) saturate(185%)', borderTop:`1px solid ${t.glassBd}`, zIndex:410 }}>
        <div style={{ display:'flex', flexDirection:'column' }}>
          <span style={{ fontFamily:MANROPE, fontWeight:600, fontSize:11, color:t.muted }}>{tr('home.total_price')}</span>
          <span style={{ fontFamily:INTER, fontWeight:800, fontSize:21, color:t.fg }}>
            {fmtNum(final * qty)} <span style={{ fontFamily:MANROPE, fontWeight:600, fontSize:12, color:t.muted }}>{tr('common.currency')}</span>
          </span>
        </div>
        <button onClick={() => { onAddCart(qty); onClose() }} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:9, background:t.red, color:'#fff', border:'none', borderRadius:18, padding:17, fontFamily:MANROPE, fontWeight:700, fontSize:15, cursor:'pointer' }}>
          <ICart s={19} c="#fff" /> {tr('home.add_to_cart')}
        </button>
      </div>

      {/* Fullscreen image viewer — tap the hero photo to open, tap anywhere to close */}
      {imgFull && p.image_url && (
        <div className="anim-lightbox" onClick={() => setImgFull(false)}
          style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(6,4,3,.97)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out' }}>
          <button onClick={() => setImgFull(false)} style={{ position:'absolute', top:54, right:20, width:44, height:44, borderRadius:14, border:'1px solid rgba(255,255,255,.18)', background:'rgba(255,255,255,.1)', backdropFilter:'blur(16px) saturate(170%)', WebkitBackdropFilter:'blur(16px) saturate(170%)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <ICross s={18} c="#fff" />
          </button>
          <img src={p.image_url} alt={p.name} className="anim-lightbox-img"
            style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', display:'block' }} />
        </div>
      )}
    </div>
  )
}

// ─── Cart Screen (full page — spec-exact) ────────────────────────────────────
function CartScreen({ t, items, totalItems, subtotal, delivery, total, discount, promo, promoError, onApplyPromo, onRemovePromo, onClose, onCheckout, addItem, decrementItem, removeItem }) {
  const { t: tr } = useTranslation()
  const [code, setCode] = useState('')
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:t.bg, display:'flex', flexDirection:'column', transition:'background .3s' }}>
      <Blobs t={t} />

      {/* Header */}
      <div style={{ position:'relative', zIndex:20, display:'flex', alignItems:'center', gap:14, padding:'16px 20px 13px', background:t.glass, backdropFilter:'blur(22px) saturate(180%)', WebkitBackdropFilter:'blur(22px) saturate(180%)', borderBottom:`1px solid ${t.glassBd}` }}>
        <button onClick={onClose} style={{ width:42, height:42, borderRadius:14, border:`1px solid ${t.glassBd}`, background:t.glassS, backdropFilter:'blur(14px) saturate(160%)', WebkitBackdropFilter:'blur(14px) saturate(160%)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <IBack s={20} c={t.fg} />
        </button>
        <span style={{ fontFamily:INTER, fontWeight:800, fontSize:20, color:t.fg }}>{tr('cart.title')}</span>
        <span style={{ marginLeft:'auto', fontFamily:MANROPE, fontWeight:600, fontSize:13, color:t.muted }}>{totalItems} {tr('cart.item_count')}</span>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div style={{ position:'relative', zIndex:1, flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:40, textAlign:'center' }}>
          <div style={{ width:88, height:88, borderRadius:28, background:t.glassS, backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)', border:`1px solid ${t.glassBd}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ICart s={38} c={t.muted} />
          </div>
          <div style={{ fontFamily:INTER, fontWeight:700, fontSize:17, color:t.fg }}>{tr('cart.empty_title')}</div>
          <div style={{ fontFamily:MANROPE, fontWeight:500, fontSize:14, lineHeight:1.5, color:t.muted, maxWidth:230 }}>{tr('cart.empty_sub')}</div>
          <button onClick={onClose} style={{ marginTop:6, background:t.red, color:'#fff', border:'none', borderRadius:16, padding:'14px 24px', fontFamily:MANROPE, fontWeight:700, fontSize:14, cursor:'pointer' }}>{tr('cart.go_menu')}</button>
        </div>
      )}

      {/* Items + promo + checkout bar */}
      {items.length > 0 && (
        <div style={{ position:'relative', zIndex:1, flex:1, minHeight:0 }}>
          {/* Scrollable list */}
          <div style={{ height:'100%', overflowY:'auto', padding:'16px 20px 230px', scrollbarWidth:'none', msOverflowStyle:'none' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {items.map(item => (
                <div key={item.id} style={{ display:'flex', gap:13, padding:11, background:t.surface, border:`1px solid ${t.line}`, borderRadius:20, boxShadow:t.shadow }}>
                  {/* Image 74×74 */}
                  <div style={{ flexShrink:0, width:74, height:74, borderRadius:15, overflow:'hidden', background:'repeating-linear-gradient(135deg,#ECE8E3 0,#ECE8E3 9px,#F5F2EE 9px,#F5F2EE 18px)' }}>
                    {item.image_url && <img src={item.image_url} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />}
                  </div>
                  {/* Info column */}
                  <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
                    {/* Top: category + name + trash */}
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontFamily:MANROPE, fontWeight:600, fontSize:11, color:t.red }}>{item.category_name || ''}</div>
                        <div style={{ fontFamily:MANROPE, fontWeight:700, fontSize:14, lineHeight:1.25, color:t.fg, marginTop:2 }}>{item.name}</div>
                      </div>
                      <button onClick={() => removeItem(item.id)} style={{ flexShrink:0, width:28, height:28, borderRadius:9, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <ITrash s={17} c={t.muted} />
                      </button>
                    </div>
                    {/* Bottom: line total + stepper */}
                    <div style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, paddingTop:8 }}>
                      <div style={{ fontFamily:INTER, fontWeight:800, fontSize:15, color:t.fg }}>
                        {fmtNum(item.finalPrice * item.qty)} <span style={{ fontFamily:MANROPE, fontWeight:600, fontSize:11, color:t.muted }}>{tr('common.currency')}</span>
                      </div>
                      {/* Glass stepper pill */}
                      <div style={{ display:'flex', alignItems:'center', gap:13, background:t.glassS, backdropFilter:'blur(12px) saturate(160%)', WebkitBackdropFilter:'blur(12px) saturate(160%)', border:`1px solid ${t.glassBd}`, borderRadius:13, padding:'5px 11px' }}>
                        <button onClick={() => decrementItem(item.id)} style={{ width:26, height:26, borderRadius:8, border:`1px solid ${t.line}`, background:'transparent', color:t.fg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, lineHeight:0 }}>−</button>
                        <span style={{ fontFamily:INTER, fontWeight:800, fontSize:14, color:t.fg, minWidth:24, textAlign:'center' }}>{fmtQty(item.qty, item.unit)}</span>
                        <button onClick={() => addItem(item)} style={{ width:26, height:26, borderRadius:8, border:'none', background:t.red, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, lineHeight:0 }}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo code */}
            {promo ? (
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:16, padding:'13px 15px', background:`${t.red}12`, border:`1px solid ${t.red}44`, borderRadius:16 }}>
                <ITag s={19} c={t.red} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:MANROPE, fontWeight:800, fontSize:14, color:t.fg }}>{promo.code}</div>
                  <div style={{ fontFamily:MANROPE, fontWeight:600, fontSize:12, color:t.red }}>−{fmtNum(discount)} {tr('common.currency')}</div>
                </div>
                <button onClick={onRemovePromo} style={{ border:'none', background:'transparent', color:t.muted, fontFamily:MANROPE, fontSize:13, fontWeight:700, cursor:'pointer' }}>{tr('promo.remove')}</button>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:16, padding:'13px 15px', background:t.glassS, backdropFilter:'blur(14px) saturate(160%)', WebkitBackdropFilter:'blur(14px) saturate(160%)', border:`1px dashed ${t.glassBd}`, borderRadius:16 }}>
                  <ITag s={19} c={t.red} />
                  <input value={code} onChange={e => setCode(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') onApplyPromo(code) }}
                    placeholder={tr('cart.promo_placeholder')}
                    style={{ flex:1, border:'none', outline:'none', background:'transparent', fontFamily:MANROPE, fontWeight:500, fontSize:14, color:t.fg, textTransform:'uppercase' }} />
                  <button onClick={() => onApplyPromo(code)} style={{ border:'none', background:'transparent', color:t.red, fontFamily:MANROPE, fontSize:13, fontWeight:700, cursor:'pointer' }}>{tr('cart.promo_apply')}</button>
                </div>
                {promoError && <div style={{ marginTop:7, marginLeft:4, fontFamily:MANROPE, fontWeight:600, fontSize:12, color:'#E5484D' }}>{promoError}</div>}
              </>
            )}
          </div>

          {/* Checkout bar — anchored to bottom */}
          <div style={{ position:'absolute', left:0, right:0, bottom:0, padding:'16px 22px 28px', background:t.glassS, backdropFilter:'blur(26px) saturate(185%)', WebkitBackdropFilter:'blur(26px) saturate(185%)', borderTop:`1px solid ${t.glassBd}`, zIndex:40 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontFamily:MANROPE, fontWeight:500, fontSize:13, color:t.muted }}>{tr('cart.subtotal')}</span>
              <span style={{ fontFamily:MANROPE, fontWeight:600, fontSize:13, color:t.fg }}>{fmtNum(subtotal)} {tr('common.currency')}</span>
            </div>
            {discount > 0 && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontFamily:MANROPE, fontWeight:500, fontSize:13, color:t.red }}>{tr('promo.discount')}{promo?.code ? ` · ${promo.code}` : ''}</span>
                <span style={{ fontFamily:MANROPE, fontWeight:700, fontSize:13, color:t.red }}>−{fmtNum(discount)} {tr('common.currency')}</span>
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:11 }}>
              <span style={{ fontFamily:MANROPE, fontWeight:500, fontSize:13, color:t.muted }}>{tr('cart.delivery')}</span>
              <span style={{ fontFamily:MANROPE, fontWeight:600, fontSize:13, color:t.fg }}>{fmtNum(delivery)} {tr('common.currency')}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:11, borderTop:`1px solid ${t.line}` }}>
              <span style={{ fontFamily:MANROPE, fontWeight:700, fontSize:15, color:t.fg }}>{tr('cart.total')}</span>
              <span style={{ fontFamily:INTER, fontWeight:800, fontSize:21, color:t.fg }}>
                {fmtNum(total)} <span style={{ fontFamily:MANROPE, fontWeight:600, fontSize:12, color:t.muted }}>{tr('common.currency')}</span>
              </span>
            </div>
            <button onClick={onCheckout} style={{ width:'100%', marginTop:13, display:'flex', alignItems:'center', justifyContent:'center', gap:9, background:t.red, color:'#fff', border:'none', borderRadius:18, padding:17, fontFamily:MANROPE, fontWeight:700, fontSize:15, cursor:'pointer' }}>
              {tr('cart.checkout_btn')}
              <IArrow s={18} c="#fff" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Checkout Sheet ───────────────────────────────────────────────────────────
function CheckoutSheet({ t, subtotal, delivery, discount, promo, total, onClose, onSubmit, form, setForm, errors, submitting }) {
  const { t: tr } = useTranslation()
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(10,8,7,0.22)', backdropFilter:'blur(3px)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ position:'absolute', bottom:0, left:0, right:0, background:t.glass, backdropFilter:'blur(44px) saturate(240%)', WebkitBackdropFilter:'blur(44px) saturate(240%)', borderTop:`1.5px solid ${t.glassBd}`, borderRadius:'28px 28px 0 0', maxHeight:'92dvh', boxShadow:'0 -20px 70px rgba(0,0,0,.18)', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-30, width:200, height:200, borderRadius:'50%', background:`radial-gradient(circle, ${t.blobA}, transparent 68%)`, filter:'blur(36px)', pointerEvents:'none', zIndex:0 }}/>
        <div style={{ position:'absolute', bottom:80, left:-40, width:160, height:160, borderRadius:'50%', background:`radial-gradient(circle, ${t.blobC}, transparent 68%)`, filter:'blur(32px)', pointerEvents:'none', zIndex:0 }}/>
        <div style={{ position:'relative', zIndex:1, overflowY:'auto', maxHeight:'92dvh' }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 8px' }}>
          <div style={{ width:38, height:4, borderRadius:2, background:t.glassBd }}/>
        </div>
        <div style={{ padding:'4px 20px 14px', borderBottom:`1px solid ${t.glassBd}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:INTER, fontWeight:700, fontSize:17, color:t.fg }}>{tr('checkout.title')}</span>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:9, background:t.glass, border:`1px solid ${t.glassBd}`, backdropFilter:'blur(8px)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ICross s={14} c={t.muted}/>
          </button>
        </div>
        <div style={{ padding:'18px 20px' }}>
          {[
            { key:'name',    label: tr('checkout.field_name'),    ph: tr('checkout.ph_name'),    type:'text' },
            { key:'phone',   label: tr('checkout.field_phone'),   ph:'+998 90 123 45 67',        type:'tel'  },
            { key:'address', label: tr('checkout.field_address'), ph: tr('checkout.ph_address'), type:'text' },
            { key:'note',    label: tr('checkout.field_note'),    ph: tr('checkout.ph_note'),    type:'text' },
          ].map(({ key, label, ph, type }) => (
            <div key={key} style={{ marginBottom:14 }}>
              <label style={{ fontFamily:MANROPE, fontSize:10.5, color:t.muted, fontWeight:700, display:'block', marginBottom:6, letterSpacing:'.8px' }}>{label}</label>
              <input type={type} placeholder={ph} value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]:e.target.value }))}
                style={{ width:'100%', padding:'12px 14px', background:t.glass, backdropFilter:'blur(8px)', border:`1.5px solid ${errors[key] ? t.red : t.glassBd}`, borderRadius:13, fontFamily:MANROPE, fontSize:14, color:t.fg, outline:'none', boxSizing:'border-box', transition:'border-color .2s' }}
                onFocus={e => e.target.style.borderColor=t.red}
                onBlur={e => e.target.style.borderColor=errors[key] ? t.red : t.glassBd}
              />
              {errors[key] && <div style={{ fontFamily:MANROPE, fontSize:11, color:t.red, marginTop:5 }}>{errors[key]}</div>}
            </div>
          ))}
          {/* price summary — glass card */}
          <div style={{ background:t.glass, backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:`1px solid ${t.glassBd}`, borderRadius:16, padding:'14px 16px', marginBottom:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontFamily:MANROPE, fontSize:13, color:t.muted, marginBottom:6 }}><span>{tr('cart.subtotal')}</span><span>{fmtNum(subtotal)} {tr('common.currency')}</span></div>
            {discount > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', fontFamily:MANROPE, fontSize:13, color:t.red, fontWeight:700, marginBottom:6 }}><span>{tr('promo.discount')}{promo?.code ? ` · ${promo.code}` : ''}</span><span>−{fmtNum(discount)} {tr('common.currency')}</span></div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', fontFamily:MANROPE, fontSize:13, color:t.muted, marginBottom:10 }}><span>{tr('cart.delivery')}</span><span>{fmtNum(delivery)} {tr('common.currency')}</span></div>
            <div style={{ display:'flex', justifyContent:'space-between', borderTop:`1px solid ${t.glassBd}`, paddingTop:10 }}>
              <span style={{ fontFamily:MANROPE, fontWeight:600, fontSize:16, color:t.fg }}>{tr('cart.total')}</span>
              <span style={{ fontFamily:INTER, fontWeight:800, fontSize:16, color:t.red }}>{fmtNum(total)} {tr('common.currency')}</span>
            </div>
          </div>
          <button onClick={onSubmit} disabled={submitting} style={{ width:'100%', background: submitting ? t.muted : t.red, color:'#fff', border:'none', borderRadius:18, padding:15, fontFamily:MANROPE, fontSize:14, fontWeight:700, cursor: submitting ? 'not-allowed' : 'pointer', marginBottom:28, boxShadow: submitting ? 'none' : `0 6px 24px ${t.red}44` }}>
            {submitting ? tr('checkout.submitting') : `${tr('checkout.confirm_btn')} — ${fmtNum(total)} ${tr('common.currency')}`}
          </button>
        </div>
        </div>{/* end zIndex:1 wrapper */}
      </div>
    </div>
  )
}

// ─── Bottom Nav — floating glass (spec: left:14 right:14 bottom:16) ──────────
function BottomNav({ t, active, onChange, cartCount }) {
  const { t: tr } = useTranslation()
  const tabs = [
    { Icon:IHome,    label: tr('nav.home') },
    { Icon:IGrid,    label: tr('nav.catalog') },
    { Icon:IHeart,   label: tr('nav.favorites') },
    { Icon:ICart,    label: tr('nav.cart'), badge: cartCount },
    { Icon:IPerson,  label: tr('nav.profile') },
  ]
  return (
    <nav style={{ position:'fixed', left:14, right:14, bottom:16, display:'flex', alignItems:'center', justifyContent:'space-around', padding:'13px 6px', borderRadius:28, background:t.glassS, backdropFilter:'blur(26px) saturate(185%)', WebkitBackdropFilter:'blur(26px) saturate(185%)', border:`1px solid ${t.glassBd}`, boxShadow:'0 14px 38px -10px rgba(0,0,0,.30)', zIndex:40 }}>
      {tabs.map(({ Icon, label, badge }, i) => (
        <button key={i} onClick={() => onChange(i)} style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:5, color: i===active ? t.red : t.muted, background:'none', border:'none', cursor:'pointer', padding:'0 6px' }}>
          <span style={{ position:'relative' }}>
            <Icon s={22} c={i===active ? t.red : t.muted} />
            {!!badge && (
              <span style={{ position:'absolute', top:-7, right:-9, minWidth:16, height:16, padding:'0 4px', borderRadius:'999px', background:t.red, color:'#fff', fontFamily:MANROPE, fontWeight:800, fontSize:9.5, display:'flex', alignItems:'center', justifyContent:'center' }}>{badge}</span>
            )}
          </span>
          <span style={{ fontFamily:MANROPE, fontWeight: i===active ? 700 : 600, fontSize:10.5 }}>{label}</span>
        </button>
      ))}
    </nav>
  )
}

// ─── Catalog (browse all top-level categories) ────────────────────────────────
function CatalogScreen({ t, categories, onSelectCategory }) {
  const { t: tr } = useTranslation()
  const topCats = categories.filter(c => !c.parent_id)
  return (
    <div style={{ position:'relative', zIndex:1, padding:'20px 20px 120px' }}>
      <div style={{ fontFamily:INTER, fontWeight:800, fontSize:22, color:t.fg, marginBottom:20 }}>{tr('nav.catalog')}</div>
      {topCats.length === 0 && (
        <div style={{ textAlign:'center', padding:'50px 20px', color:t.muted, fontFamily:MANROPE, fontSize:13.5 }}>{tr('home.nothing_found')}</div>
      )}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {topCats.map(c => (
          <button key={c.id} onClick={() => onSelectCategory(c.id)}
            style={{ display:'flex', alignItems:'center', gap:14, background:t.surface, border:`1px solid ${t.line}`, borderRadius:18, padding:14, boxShadow:'0 2px 10px rgba(20,16,14,.06)', cursor:'pointer', textAlign:'left' }}>
            <span style={{ width:52, height:52, borderRadius:14, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:t.glassS }}>
              {c.image_url
                ? <img src={c.image_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontSize:24 }}>{c.emoji || '🍽️'}</span>
              }
            </span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:MANROPE, fontWeight:700, fontSize:15, color:t.fg }}>{c.name}</div>
              <div style={{ fontFamily:MANROPE, fontSize:12, color:t.muted, marginTop:2 }}>{tr('admin.categories.subcategory_count', { count: c.children_count })}</div>
            </div>
            <IArrow s={16} c={t.muted} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Favorites (liked products) ───────────────────────────────────────────────
function FavoritesScreen({ t, liked, onTap, onAdd, onDec, getQty, onLike, onFly }) {
  const { t: tr } = useTranslation()
  const [all,     setAll]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts({ available:true }).then(r => setAll(r.data)).finally(() => setLoading(false))
  }, [])

  const favProducts = all.filter(p => liked.has(p.id))

  return (
    <div style={{ position:'relative', zIndex:1, padding:'20px 20px 120px' }}>
      <div style={{ fontFamily:INTER, fontWeight:800, fontSize:22, color:t.fg, marginBottom:20 }}>{tr('nav.favorites')}</div>
      {loading && (
        <div style={{ textAlign:'center', padding:'50px 20px', color:t.muted, fontFamily:MANROPE, fontSize:13.5 }}>{tr('common.loading')}</div>
      )}
      {!loading && favProducts.length === 0 && (
        <div style={{ textAlign:'center', padding:'50px 20px', color:t.muted, fontFamily:MANROPE, fontSize:13.5 }}>{tr('home.favorites_empty')}</div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {favProducts.map((p, i) => (
          <ProductCard key={p.id} p={p} t={t} index={i}
            onTap={() => onTap(p)}
            onAdd={() => onAdd(p)}
            onDec={() => onDec(p.id)}
            qty={getQty(p.id)}
            liked={liked.has(p.id)}
            onLike={() => onLike(p.id)}
            onFly={onFly} />
        ))}
      </div>
    </div>
  )
}

// ─── Profile (Telegram user info + order history) ────────────────────────────
const ORDER_STATUS_COLOR = { new:'#3B82F6', confirmed:'#8B5CF6', preparing:'#F59E0B', delivering:'#06B6D4', delivered:'#22C55E', cancelled:'#EF4444' }

function ProfileScreen({ t, tgUser, telegramChatId }) {
  const { t: tr } = useTranslation()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!telegramChatId) return
    setLoading(true)
    getMyOrders(telegramChatId).then(r => setOrders(r.data)).finally(() => setLoading(false))
  }, [telegramChatId])

  const displayName = tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : tr('profile.guest')

  return (
    <div style={{ position:'relative', zIndex:1, padding:'20px 20px 120px' }}>
      <div style={{ fontFamily:INTER, fontWeight:800, fontSize:22, color:t.fg, marginBottom:20 }}>{tr('nav.profile')}</div>

      {/* Profile card */}
      <div style={{ display:'flex', alignItems:'center', gap:14, background:t.glassS, backdropFilter:'blur(18px) saturate(170%)', WebkitBackdropFilter:'blur(18px) saturate(170%)', border:`1px solid ${t.glassBd}`, borderRadius:22, padding:18, boxShadow:t.shadow, marginBottom:26 }}>
        <div style={{ width:56, height:56, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:t.surface, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${t.glassBd}` }}>
          {tgUser?.photo_url
            ? <img src={tgUser.photo_url} alt={displayName} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <IPerson s={26} c={t.muted} />
          }
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:INTER, fontWeight:800, fontSize:17, color:t.fg }}>{displayName}</div>
          {tgUser?.username && <div style={{ fontFamily:MANROPE, fontSize:13, color:t.muted, marginTop:2 }}>@{tgUser.username}</div>}
        </div>
      </div>

      <div style={{ fontFamily:INTER, fontWeight:700, fontSize:17, color:t.fg, marginBottom:14 }}>{tr('profile.orders_title')}</div>

      {!telegramChatId && (
        <div style={{ textAlign:'center', padding:'40px 20px', color:t.muted, fontFamily:MANROPE, fontSize:13.5, lineHeight:1.65 }}>{tr('profile.no_telegram')}</div>
      )}
      {telegramChatId && loading && (
        <div style={{ textAlign:'center', padding:'40px 20px', color:t.muted, fontFamily:MANROPE, fontSize:13.5 }}>{tr('common.loading')}</div>
      )}
      {telegramChatId && !loading && orders.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 20px', color:t.muted, fontFamily:MANROPE, fontSize:13.5 }}>{tr('profile.no_orders')}</div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {orders.map(o => (
          <div key={o.id} style={{ background:t.surface, border:`1px solid ${t.line}`, borderRadius:18, padding:14, boxShadow:t.shadow }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:t.glassS, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <IBox s={16} c={t.fg} />
                </div>
                <div>
                  <div style={{ fontFamily:MANROPE, fontWeight:700, fontSize:13.5, color:t.fg }}>#{o.id}</div>
                  <div style={{ fontFamily:MANROPE, fontSize:11, color:t.muted }}>{new Date(o.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <span style={{ fontFamily:MANROPE, fontWeight:700, fontSize:10.5, padding:'5px 10px', borderRadius:20, color:'#fff', background: ORDER_STATUS_COLOR[o.status] || t.muted, flexShrink:0 }}>
                {tr('status.' + o.status)}
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:MANROPE, fontSize:12, color:t.muted }}>{tr('profile.items_count', { count: o.items.length })}</span>
              <span style={{ fontFamily:INTER, fontWeight:800, fontSize:14, color:t.fg }}>{fmtNum(o.total)} {tr('common.currency')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, show }) {
  return (
    <div style={{ position:'fixed', left:'50%', bottom:108, transform:`translateX(-50%) translateY(${show ? 0 : 10}px)`, opacity:show ? 1 : 0, transition:'all .25s cubic-bezier(.4,0,.2,1)', background:'rgba(20,16,14,.92)', backdropFilter:'blur(8px)', color:'#fff', fontFamily:MANROPE, fontWeight:600, fontSize:13, padding:'12px 20px', borderRadius:'999px', zIndex:80, whiteSpace:'nowrap', boxShadow:'0 10px 30px rgba(0,0,0,.4)', pointerEvents:'none' }}>
      ✓ {msg}
    </div>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [isDark,     setIsDark]    = useState(() => !window.matchMedia?.('(prefers-color-scheme: light)')?.matches)
  const t = THEMES[isDark ? 'dark' : 'light']
  const { t: tr, i18n } = useTranslation()

  // Follow the device's light/dark setting live (dark is the default; only an
  // explicit "light" system preference switches to the light theme)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: light)')
    if (!mq) return
    const handler = e => setIsDark(!e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const [categories, setCats]      = useState([])
  const [products,   setProducts]  = useState([])
  const [banners,    setBanners]   = useState([])
  const [allCatImg,  setAllCatImg] = useState('')
  const [activeCat,  setActiveCat] = useState(null)
  const [subPath,    setSubPath]   = useState([])   // drill-down chain of selected sub-category ids — supports any nesting depth
  const [detail,     setDetail]    = useState(null)
  const [cartOpen,   setCartOpen]  = useState(false)
  const [checkout,   setCheckout]  = useState(false)
  const [success,    setSuccess]   = useState(null)
  const [toast,      setToast]     = useState({ msg:'', show:false })
  const [liked,      setLiked]     = useState(new Set())
  const [form,       setForm]      = useState({ name:'', phone:'', address:'', note:'', payment:'naqd' })
  const [errors,     setErrors]    = useState({})
  const [submitting, setSubmitting]= useState(false)
  const [nav,        setNav]       = useState(0)   // 0 = home, 1 = profile
  const [tgUser,     setTgUser]    = useState(null)
  const [flights,    setFlights]   = useState([])
  const toastTimer = useRef(null)
  const cartBtnRef = useRef(null)

  const spawnFly = useCallback((el, image) => {
    if (!el || !cartBtnRef.current) return
    const a = el.getBoundingClientRect()
    const b = cartBtnRef.current.getBoundingClientRect()
    const id = Date.now() + Math.random()
    setFlights(f => [...f, {
      id,
      from: { x: a.left + a.width/2,  y: a.top + a.height/2 },
      to:   { x: b.left + b.width/2,  y: b.top + b.height/2 },
      image,
    }])
  }, [])
  const removeFlight = id => setFlights(f => f.filter(x => x.id !== id))

  // Telegram Mini App integration — reads the current user from the WebApp
  // SDK (injected only when opened inside Telegram) and tells Telegram the
  // app is ready / lets it expand to full height.
  useEffect(() => {
    const wa = window.Telegram?.WebApp
    if (!wa) return
    wa.ready()
    wa.expand()
    if (wa.initDataUnsafe?.user) setTgUser(wa.initDataUnsafe.user)
  }, [])
  const telegramChatId = tgUser?.id ? String(tgUser.id) : ''

  const { items, addItem, removeItem, decrementItem, clearCart } = useCartStore()
  const totalItems = items.reduce((s, i) => s + i.qty, 0)
  const subtotal   = items.reduce((s, i) => s + i.finalPrice * i.qty, 0)
  const delivery   = 15000

  // Promo code — validated against the backend; server re-checks at order time.
  const [promo, setPromo]         = useState(null)  // { code, discount } when applied
  const [promoError, setPromoError] = useState('')
  const discount = Math.min(promo?.discount || 0, subtotal)
  const total    = Math.max(0, subtotal - discount) + delivery

  const applyPromo = async (code) => {
    const c = (code || '').trim()
    if (!c) return
    setPromoError('')
    try {
      const { data } = await validatePromo(c, subtotal)
      if (data.valid) { setPromo({ code: data.code, discount: data.discount }); setPromoError('') }
      else { setPromo(null); setPromoError(tr(`promo.err_${data.reason}`) || tr('promo.err_invalid')) }
    } catch { setPromo(null); setPromoError(tr('promo.err_invalid')) }
  }
  const removePromo = () => { setPromo(null); setPromoError('') }

  // Re-validate a live promo when the cart subtotal changes (min_order / percent).
  useEffect(() => {
    if (!promo?.code) return
    validatePromo(promo.code, subtotal)
      .then(({ data }) => {
        if (data.valid) setPromo(p => p ? { ...p, discount: data.discount } : p)
        else { setPromo(null); setPromoError(tr(`promo.err_${data.reason}`) || tr('promo.err_invalid')) }
      })
      .catch(() => {})
  }, [subtotal]) // eslint-disable-line react-hooks/exhaustive-deps

  const topCats = categories.filter(c => !c.parent_id)

  // One row per nesting level: children of activeCat, then (once one of
  // those is picked) its children, and so on for as deep as the admin has
  // nested categories — mirrors the admin panel's unlimited category tree.
  const subCatLevels = useMemo(() => {
    const levels = []
    let parentId = activeCat
    let depth = 0
    while (parentId) {
      const subs = categories.filter(c => c.parent_id === parentId)
      if (!subs.length) break
      const active = subPath[depth] ?? null
      levels.push({ depth, subs, active })
      if (!active) break
      parentId = active
      depth++
    }
    return levels
  }, [categories, activeCat, subPath])

  const handleSelectCat = (id) => { setActiveCat(id); setSubPath([]) }
  const handleSelectSubAt = (depth, id) => {
    setSubPath(prev => {
      const next = prev.slice(0, depth)
      if (id) next.push(id)
      return next
    })
  }

  // Bottom nav: 0=Home 1=Catalog 2=Favorites 3=Cart(overlay) 4=Profile
  const handleNavChange = (i) => {
    if (i === 3) { setCartOpen(true); return }
    setCartOpen(false)
    setNav(i)
  }
  const handleCatalogSelect = (id) => { handleSelectCat(id); setNav(0) }

  useEffect(() => {
    getBanners().then(r => setBanners(r.data.filter(b => b.active)))
    getSetting('all_category_image').then(r => setAllCatImg(r.data.value || '')).catch(() => {})
  }, [])

  useEffect(() => {
    getCategories(i18n.language).then(r => setCats(r.data.filter(c => c.active)))
  }, [i18n.language])

  useEffect(() => {
    const params = { available:true, lang: i18n.language }
    const catFilter = subPath.length ? subPath[subPath.length - 1] : activeCat
    if (catFilter) params.cat_id = catFilter
    getProducts(params).then(r => setProducts(r.data))
  }, [activeCat, subPath, i18n.language])

  const showToast = msg => {
    clearTimeout(toastTimer.current)
    setToast({ msg, show:true })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show:false })), 1700)
  }

  const handleBannerCta = (b) => {
    if (!b.cta_action || !b.cta_target) return
    if (b.cta_action === 'url') {
      window.open(b.cta_target, '_blank', 'noopener')
    } else if (b.cta_action === 'category') {
      handleSelectCat(parseInt(b.cta_target))
    } else if (b.cta_action === 'product') {
      const p = products.find(x => x.id === parseInt(b.cta_target))
      if (p) setDetail(p)
    }
  }

  const handleAdd = (product, qty) => {
    addItem(product, qty)
    showToast(tr('home.added_to_cart'))
  }

  const toggleLike = id => setLiked(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const getQty = id => items.find(i => i.id === id)?.qty || 0

  const validateForm = () => {
    const e = {}
    if (!form.name.trim())    e.name    = tr('checkout.error_name')
    if (!form.phone.trim())   e.phone   = tr('checkout.error_phone')
    if (!form.address.trim()) e.address = tr('checkout.error_address')
    setErrors(e); return !Object.keys(e).length
  }

  const handleCheckout = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      const res = await createOrder({ ...form, subtotal, delivery, total, telegram_chat_id: telegramChatId, promo_code: promo?.code || '', items: items.map(i => ({ product_id:i.id, name:i.name, price:i.finalPrice, qty:i.qty, emoji:'' })) })
      clearCart(); setPromo(null); setPromoError(''); setCheckout(false); setCartOpen(false); setSuccess(res.data)
    } catch { showToast(tr('checkout.error')) }
    finally { setSubmitting(false) }
  }

  // ── Success ──
  if (success) return (
    <div style={{ minHeight:'100dvh', background:t.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center', fontFamily:MANROPE, position:'relative', transition:'background .3s' }}>
      <Blobs t={t} />
      <div style={{ position:'relative', zIndex:1, background:t.surface, borderRadius:28, padding:'48px 36px', maxWidth:360, width:'100%', boxShadow:t.shadow, border:`1px solid ${t.line}` }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}><ICheckCircle s={56} c="#22C55E"/></div>
        <div style={{ fontFamily:INTER, fontSize:24, fontWeight:800, color:t.fg, marginBottom:8 }}>{tr('success.title')}</div>
        <div style={{ fontFamily:MANROPE, fontSize:12, color:t.muted, marginBottom:8 }}>{tr('success.order_number')}</div>
        <div style={{ fontFamily:INTER, fontSize:36, fontWeight:800, color:t.red, marginBottom:20 }}>#{success.id}</div>
        <div style={{ color:t.muted, fontFamily:MANROPE, fontSize:13.5, marginBottom:32, lineHeight:1.7 }}>
          {tr('success.delivery_time')}<br/>
          Tel: <strong style={{ color:t.fg }}>{success.phone}</strong>
        </div>
        <button onClick={() => setSuccess(null)} style={{ width:'100%', background:t.red, color:'#fff', border:'none', borderRadius:16, padding:14, fontFamily:MANROPE, fontSize:14, fontWeight:700, cursor:'pointer' }}>
          {tr('success.back_home')}
        </button>
      </div>
    </div>
  )

  // ── Product detail ──
  if (detail) return (
    <ProductDetail p={detail} t={t} onClose={() => setDetail(null)}
      onAddCart={qty => handleAdd(detail, qty)}
      liked={liked.has(detail.id)} onLike={() => toggleLike(detail.id)} />
  )

  // ── Cart screen ──
  if (cartOpen) return (
    <>
      <CartScreen t={t} items={items} totalItems={totalItems} subtotal={subtotal} delivery={delivery} total={total}
        discount={discount} promo={promo} promoError={promoError} onApplyPromo={applyPromo} onRemovePromo={removePromo}
        onClose={() => setCartOpen(false)}
        onCheckout={() => setCheckout(true)}
        addItem={addItem} decrementItem={decrementItem} removeItem={removeItem} />
      {checkout && (
        <CheckoutSheet t={t} subtotal={subtotal} delivery={delivery} discount={discount} promo={promo} total={total} onClose={() => setCheckout(false)} onSubmit={handleCheckout}
          form={form} setForm={setForm} errors={errors} submitting={submitting} />
      )}
      <Toast msg={toast.msg} show={toast.show} />
      {flights.map(f => (
        <FlyingItem key={f.id} from={f.from} to={f.to} image={f.image} color={t.red} onDone={() => removeFlight(f.id)} />
      ))}
    </>
  )

  // ── Main ──
  return (
    <div style={{ background:t.bg, minHeight:'100dvh', paddingBottom:100, position:'relative', transition:'background .3s ease' }}>
      <Blobs t={t} />
      <div style={{ position:'relative', zIndex:1 }}>
        <Header t={t} totalItems={totalItems} onCartOpen={() => setCartOpen(true)} onFavorites={() => handleNavChange(2)} isDark={isDark} onToggle={() => setIsDark(d => !d)} cartBtnRef={cartBtnRef} />
        {nav === 1 ? (
          <CatalogScreen t={t} categories={categories} onSelectCategory={handleCatalogSelect} />
        ) : nav === 2 ? (
          <FavoritesScreen t={t} liked={liked} onTap={setDetail} onAdd={handleAdd} onDec={id => decrementItem(id)} getQty={getQty} onLike={toggleLike} onFly={spawnFly} />
        ) : nav === 4 ? (
          <ProfileScreen t={t} tgUser={tgUser} telegramChatId={telegramChatId} />
        ) : (
          <>
            <BannerCarousel banners={banners} t={t} onCta={handleBannerCta} />
            <CategoryScroll categories={topCats} active={activeCat} onSelect={handleSelectCat} t={t} allImage={allCatImg} onViewAll={() => setNav(1)} />
            {subCatLevels.map(lvl => (
              <SubCategoryRow key={lvl.depth} subs={lvl.subs} active={lvl.active} onSelect={id => handleSelectSubAt(lvl.depth, id)} t={t} />
            ))}
            <div style={{ padding:'12px 20px 20px' }}>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:14 }}>
                <span style={{ fontFamily:INTER, fontWeight:700, fontSize:19, color:t.fg }}>{tr('home.popular_dishes')}</span>
                <span onClick={() => handleSelectCat(null)} style={{ fontFamily:MANROPE, fontWeight:600, fontSize:13, color:t.red, cursor:'pointer' }}>{tr('home.view_all')}</span>
              </div>
              {products.length === 0 && (
                <div style={{ textAlign:'center', padding:'50px 20px', color:t.muted, fontFamily:MANROPE, fontWeight:500, fontSize:14 }}>
                  {tr('home.nothing_found')}
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {products.map((p, i) => (
                  <ProductCard key={p.id} p={p} t={t} index={i}
                    onTap={() => setDetail(p)}
                    onAdd={() => handleAdd(p)}
                    onDec={() => decrementItem(p.id)}
                    qty={getQty(p.id)}
                    liked={liked.has(p.id)}
                    onLike={() => toggleLike(p.id)}
                    onFly={spawnFly} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav t={t} active={cartOpen ? 3 : nav} onChange={handleNavChange} cartCount={totalItems} />

      <Toast msg={toast.msg} show={toast.show} />
      {flights.map(f => (
        <FlyingItem key={f.id} from={f.from} to={f.to} image={f.image} color={t.red} onDone={() => removeFlight(f.id)} />
      ))}
    </div>
  )
}
