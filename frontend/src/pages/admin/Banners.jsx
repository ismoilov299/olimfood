import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getBanners, createBanner, updateBanner, deleteBanner, uploadImage, getProducts, getCategories } from '../../api'

const THEME_COLORS = {
  red:    '#E31E24',
  blue:   '#2563EB',
  orange: '#EA580C',
  green:  '#16A34A',
  purple: '#7C3AED',
  custom: '#888',
}
const THEME_BG = {
  red:    'radial-gradient(ellipse 65% 100% at 88% 50%,rgba(227,30,36,.85) 0%,transparent 70%),linear-gradient(135deg,#0C0000,#200101)',
  blue:   'radial-gradient(ellipse 65% 100% at 88% 50%,rgba(37,99,235,.85) 0%,transparent 70%),linear-gradient(135deg,#00040C,#010F20)',
  orange: 'radial-gradient(ellipse 65% 100% at 88% 50%,rgba(234,88,12,.85) 0%,transparent 70%),linear-gradient(135deg,#080200,#1E0800)',
  green:  'radial-gradient(ellipse 65% 100% at 88% 50%,rgba(22,163,74,.85) 0%,transparent 70%),linear-gradient(135deg,#000C02,#011E07)',
  purple: 'radial-gradient(ellipse 65% 100% at 88% 50%,rgba(124,58,237,.85) 0%,transparent 70%),linear-gradient(135deg,#04000C,#0E0120)',
}
const EMPTY_D = { mode:'design', title:'', subtitle:'', code:'', cta_text:'', cta_action:'', cta_target:'', emoji:'🔥', discount:0, theme:'red', grad_from:'#E31E24', grad_to:'#8B0000', image_url:'', image_title:'', image_sub:'', active:true }
const EMPTY_I = { mode:'image',  title:'', subtitle:'', code:'', cta_text:'', cta_action:'', cta_target:'', emoji:'',   discount:0, theme:'red', grad_from:'#E31E24', grad_to:'#8B0000', image_url:'', image_title:'', image_sub:'', active:true }


export default function Banners() {
  const [banners,    setBanners]    = useState([])
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [tab,        setTab]        = useState('design')
  const [form,       setForm]       = useState(EMPTY_D)
  const [saving,     setSaving]     = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [toast,      setToast]      = useState('')
  const fileRef = useRef(null)
  const { t } = useTranslation()

  const CTA_ACTIONS = [
    { key:'',         label: t('admin.banners.cta_none')     },
    { key:'product',  label: t('admin.banners.cta_product')  },
    { key:'category', label: t('admin.banners.cta_category') },
    { key:'url',      label: t('admin.banners.cta_url')      },
    { key:'phone',    label: t('admin.banners.cta_phone')    },
  ]
  const THEMES = Object.entries(THEME_COLORS).map(([key, color]) => ({
    key, color, label: t(`admin.banners.theme_${key}`)
  }))

  const load = () => getBanners().then(r => setBanners(r.data))
  useEffect(() => {
    load()
    getProducts({}).then(r => setProducts(r.data)).catch(() => {})
    getCategories().then(r => setCategories(r.data)).catch(() => {})
  }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const openNew = () => { setEditing(null); setTab('design'); setForm(EMPTY_D); setModal(true) }
  const openEdit = (b) => {
    setEditing(b)
    const mode = b.mode||'design'; setTab(mode)
    setForm({ mode, title:b.title||'', subtitle:b.subtitle||'', code:b.code||'',
              cta_text:b.cta_text||'', cta_action:b.cta_action||'', cta_target:b.cta_target||'',
              emoji:b.emoji||(mode==='design'?'🔥':''),
              discount:b.discount||0, theme:b.theme||'red',
              grad_from:b.grad_from||'#E31E24', grad_to:b.grad_to||'#8B0000',
              image_url:b.image_url||'', image_title:b.image_title||'',
              image_sub:b.image_sub||'', active:b.active })
    setModal(true)
  }
  const switchTab = (t) => { setTab(t); setForm(t==='design' ? EMPTY_D : EMPTY_I) }

  const handleFile = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try { const res = await uploadImage(file); setForm(f => ({ ...f, image_url: res.data.url })) }
    catch { showToast(t('admin.banners.toast_upload_error')) }
    finally { setUploading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = { ...form, mode:tab, discount:parseInt(form.discount)||0 }
      if (tab==='design' && !form.title)     { showToast(t('admin.banners.toast_title_required')); setSaving(false); return }
      if (tab==='image'  && !form.image_url) { showToast(t('admin.banners.toast_url_required'));   setSaving(false); return }
      if (editing) { await updateBanner(editing.id, data) } else { await createBanner(data) }
      showToast(editing ? t('admin.banners.toast_updated') : t('admin.banners.toast_added'))
      setModal(false); load()
    } catch (e) { showToast('❌ ' + (e.response?.data?.detail||'')) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('admin.banners.confirm_delete'))) return
    await deleteBanner(id); showToast(t('admin.banners.toast_deleted')); load()
  }
  const handleToggle = async (b) => { await updateBanner(b.id, { active:!b.active }); load() }

  const previewBg = () => {
    if (form.theme==='custom') return `radial-gradient(ellipse 65% 100% at 88% 50%,${form.grad_from}CC 0%,transparent 70%),linear-gradient(135deg,${form.grad_to}55,${form.grad_from}33)`
    return THEME_BG[form.theme]||THEME_BG.red
  }

  return (
    <div>
      {toast && <Toast msg={toast} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <h1 style={{ fontSize:24, fontWeight:900, color:'#111' }}>{t('admin.banners.title')}</h1>
        <button onClick={openNew} style={redBtn}>{t('admin.banners.new_btn')}</button>
      </div>

      <div style={{ display:'grid', gap:10 }}>
        {banners.map(b => (
          <div key={b.id} style={{ background:'#fff', borderRadius:14, border:'1px solid #E8ECF0', padding:'14px 18px', display:'flex', alignItems:'center', gap:14, boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
            {b.mode==='image' && b.image_url
              ? <img src={b.image_url} style={{ width:72, height:48, objectFit:'cover', borderRadius:8 }} />
              : <div style={{ width:72, height:48, borderRadius:8, background: THEME_BG[b.theme]||THEME_BG.red, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{b.emoji||'🎯'}</div>
            }
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, color:'#111', fontSize:14 }}>
                {b.mode==='image' ? (b.image_title||t('admin.banners.tab_image')) : b.title}
              </div>
              <div style={{ fontSize:11.5, color:'#aaa', marginTop:2 }}>
                {b.mode==='image' ? `🖼️ ${t('admin.banners.tab_image')}` : `🎨 ${t('admin.banners.tab_design')} · ${THEMES.find(th=>th.key===b.theme)?.label||b.theme}`}
                {b.discount>0 && ` · -${b.discount}%`}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <ToggleBtn value={b.active} onChange={() => handleToggle(b)} />
              <button onClick={() => openEdit(b)} style={actBtn('#3B82F6')}>✏️</button>
              <button onClick={() => handleDelete(b.id)} style={actBtn('#EF4444')}>🗑️</button>
            </div>
          </div>
        ))}
        {!banners.length && <div style={{ textAlign:'center', padding:'60px 0', color:'#ccc' }}><div style={{ fontSize:48, marginBottom:12 }}>🖼️</div><div>{t('admin.banners.no_banners')}</div></div>}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:500, overflowY:'auto', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 20px' }}
          onClick={() => setModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, border:'1px solid #E8ECF0', padding:'28px', width:'100%', maxWidth:540, boxShadow:'0 20px 60px rgba(0,0,0,.12)' }}>
            <div style={{ fontWeight:900, fontSize:18, marginBottom:20, color:'#111' }}>
              {editing ? t('admin.banners.modal_edit') : t('admin.banners.modal_new')}
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:8, marginBottom:22, background:'#F5F7FA', borderRadius:12, padding:4 }}>
              {[['design', t('admin.banners.tab_design')],['image', t('admin.banners.tab_image')]].map(([tabKey,l]) => (
                <button key={tabKey} onClick={() => switchTab(tabKey)} style={{ flex:1, padding:'8px 12px', borderRadius:9, border:'none', background: tab===tabKey ? '#E31E24' : 'transparent', color: tab===tabKey ? '#fff' : '#888', fontSize:13, fontWeight:700, cursor:'pointer' }}>{l}</button>
              ))}
            </div>

            {/* Preview */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:'#aaa', fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>{t('admin.banners.preview_label')}</div>
              {tab==='image'
                ? form.image_url
                  ? <div style={{ position:'relative', borderRadius:14, overflow:'hidden', height:160 }}>
                      <img src={form.image_url} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                      {(form.image_title||form.image_sub) && (
                        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,.8))', padding:'14px 16px' }}>
                          {form.image_title && <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:'#fff' }}>{form.image_title}</div>}
                          {form.image_sub   && <div style={{ fontSize:11, color:'rgba(255,255,255,.65)' }}>{form.image_sub}</div>}
                        </div>
                      )}
                    </div>
                  : <div style={{ height:160, background:'#F5F7FA', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:6, border:'2px dashed #E0E4EA' }}>
                      <span style={{ fontSize:28 }}>🖼️</span>
                      <span style={{ fontSize:12, color:'#bbb' }}>{t('admin.banners.image_placeholder')}</span>
                    </div>
                : <div style={{ background:previewBg(), borderRadius:14, padding:'18px 20px', height:160, position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                    <span style={{ position:'absolute', right:12, bottom:-4, fontSize:52, opacity:.3, transform:'rotate(-10deg)', userSelect:'none' }}>{form.emoji}</span>
                    {form.discount>0 && <div style={{ display:'inline-flex', background:'rgba(255,255,255,.18)', border:'1px solid rgba(255,255,255,.24)', borderRadius:20, padding:'2px 9px', fontSize:9, fontWeight:800, color:'#fff', marginBottom:6, width:'fit-content' }}>🎁 {t('admin.banners.special_offer')}</div>}
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:'#fff', lineHeight:1.1 }}>{form.title||t('admin.banners.field_title').replace(' *','')}</div>
                    {form.subtitle && <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', marginTop:3 }}>{form.subtitle}{form.code?` · ${form.code}`:''}</div>}
                    {form.cta_text && <div style={{ marginTop:10, background:'#fff', borderRadius:16, padding:'5px 14px', fontSize:11, fontWeight:800, width:'fit-content', color:'#E31E24' }}>{form.cta_text}</div>}
                  </div>
              }
            </div>

            {/* Design fields */}
            {tab==='design' && (
              <>
                {[{key:'title',label:t('admin.banners.field_title'),ph:'MAXSUS TAKLIF'},{key:'subtitle',label:t('admin.banners.field_subtitle'),ph:'30% chegirma'},{key:'code',label:t('admin.banners.field_promo'),ph:'OLIMFOOD30'},{key:'emoji',label:t('admin.banners.field_emoji'),ph:'🔥'}].map(({key,label,ph}) => (
                  <div key={key} style={{ marginBottom:12 }}>
                    <label style={labelStyle}>{label}</label>
                    <input placeholder={ph} value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} style={lightInput} />
                  </div>
                ))}
                <div style={{ marginBottom:12 }}>
                  <label style={labelStyle}>{t('admin.banners.field_discount')}: <strong style={{ color:'#E31E24' }}>{form.discount}%</strong></label>
                  <input type="range" min={0} max={80} value={form.discount} onChange={e => setForm(f=>({...f,discount:e.target.value}))} style={{ accentColor:'#E31E24', width:'100%' }} />
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={labelStyle}>{t('admin.banners.field_theme')}</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {THEMES.map(({key,label,color}) => (
                      <button key={key} onClick={() => setForm(f=>({...f,theme:key}))}
                        style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:20, border: form.theme===key ? `2px solid ${color}` : '2px solid #E8ECF0', cursor:'pointer', background: form.theme===key ? color+'15' : '#F5F7FA', color:'#333', fontSize:12, fontWeight:700 }}>
                        <span style={{ width:10, height:10, borderRadius:'50%', background:color, display:'inline-block' }} />
                        {label}
                      </button>
                    ))}
                  </div>
                  {form.theme==='custom' && (
                    <div style={{ display:'flex', gap:12, marginTop:10 }}>
                      {[{key:'grad_from',label:t('admin.banners.field_from_color')},{key:'grad_to',label:t('admin.banners.field_to_color')}].map(({key,label}) => (
                        <div key={key}>
                          <label style={labelStyle}>{label}</label>
                          <input type="color" value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))}
                            style={{ width:50, height:36, padding:2, borderRadius:8, border:'1.5px solid #E8ECF0', cursor:'pointer' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Image fields */}
            {tab==='image' && (
              <>
                <div style={{ marginBottom:14 }}>
                  <label style={labelStyle}>{t('common.upload')}</label>
                  <div onClick={() => fileRef.current?.click()}
                    style={{ border:'2px dashed #E0E4EA', borderRadius:12, padding:'20px', textAlign:'center', cursor:'pointer', background:'#FAFAFA', marginBottom:10 }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='#E31E24'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='#E0E4EA'}>
                    {uploading ? <div style={{ color:'#888', fontSize:13 }}>⏳ {t('common.uploading')}</div>
                      : <><div style={{ fontSize:26, marginBottom:4 }}>📁</div><div style={{ fontSize:13, color:'#666', fontWeight:600 }}>{t('common.upload')}</div><div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>JPG · PNG · GIF · WebP</div></>
                    }
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
                </div>
                <div style={{ marginBottom:12 }}>
                  <label style={labelStyle}>{t('admin.banners.field_image_url')}</label>
                  <input placeholder="https://..." value={form.image_url} onChange={e => setForm(f=>({...f,image_url:e.target.value}))} style={lightInput} />
                </div>
                {[{key:'image_title',label:t('admin.banners.field_overlay_title'),ph:'Mahsulot aksiyasi'},{key:'image_sub',label:t('admin.banners.field_overlay_sub'),ph:'30% chegirma'}].map(({key,label,ph}) => (
                  <div key={key} style={{ marginBottom:12 }}>
                    <label style={labelStyle}>{label}</label>
                    <input placeholder={ph} value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} style={lightInput} />
                  </div>
                ))}
              </>
            )}

            {/* CTA button — shared across both tabs */}
            <div style={{ borderTop:'1.5px solid #F0F2F5', paddingTop:16, marginBottom:16 }}>
              <div style={{ fontWeight:800, fontSize:12, color:'#888', letterSpacing:'.06em', marginBottom:12 }}>{t('admin.banners.cta_section')}</div>
              <div style={{ marginBottom:12 }}>
                <label style={labelStyle}>{t('admin.banners.cta_text')}</label>
                <input placeholder={t('admin.banners.cta_text_placeholder')} value={form.cta_text}
                  onChange={e => setForm(f=>({...f,cta_text:e.target.value}))} style={lightInput} />
              </div>
              <div style={{ marginBottom:4 }}>
                <label style={labelStyle}>{t('admin.banners.cta_action')}</label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom: form.cta_action ? 10 : 0 }}>
                  {CTA_ACTIONS.map(({ key, label }) => (
                    <button key={key} type="button"
                      onClick={() => setForm(f => ({ ...f, cta_action:key, cta_target:'' }))}
                      style={{ padding:'6px 13px', borderRadius:20, border: form.cta_action===key ? '1.5px solid #E31E24' : '1.5px solid #E8ECF0', background: form.cta_action===key ? '#E31E2412' : '#F5F7FA', color: form.cta_action===key ? '#E31E24' : '#666', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>
                {form.cta_action === 'product' && (
                  <ProductPicker
                    products={products}
                    value={form.cta_target}
                    onChange={id => setForm(f=>({...f,cta_target:id}))}
                  />
                )}
                {form.cta_action === 'category' && (
                  <select value={form.cta_target} onChange={e => setForm(f=>({...f,cta_target:e.target.value}))} style={lightInput}>
                    <option value="">{t('admin.banners.select_category')}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                  </select>
                )}
                {form.cta_action === 'url' && (
                  <input placeholder="https://..." value={form.cta_target}
                    onChange={e => setForm(f=>({...f,cta_target:e.target.value}))} style={lightInput} />
                )}
                {form.cta_action === 'phone' && (
                  <input type="tel" placeholder="+998 90 123 45 67" value={form.cta_target}
                    onChange={e => setForm(f=>({...f,cta_target:e.target.value}))} style={lightInput} />
                )}
              </div>
            </div>

            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#555', fontWeight:600, marginBottom:22 }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f=>({...f,active:e.target.checked}))} style={{ width:16, height:16, accentColor:'#E31E24' }} />
              {t('admin.banners.check_active')}
            </label>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setModal(false)} style={cancelBtn}>{t('common.cancel')}</button>
              <button onClick={handleSave} disabled={saving}
                style={{ ...redBtn, flex:2, padding:'12px', borderRadius:12, fontSize:14, opacity: saving ? .6 : 1 }}>
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle = { fontSize:11.5, color:'#888', fontWeight:700, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }
const lightInput = { background:'#F5F7FA', border:'1.5px solid #E8ECF0', color:'#111', borderRadius:10, padding:'10px 14px', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, outline:'none', width:'100%', boxSizing:'border-box' }
const redBtn    = { background:'#E31E24', color:'#fff', border:'none', borderRadius:10, padding:'9px 18px', fontSize:14, fontWeight:800, cursor:'pointer' }
const cancelBtn = { flex:1, background:'#F5F7FA', color:'#666', border:'1.5px solid #E8ECF0', borderRadius:12, padding:'12px', fontSize:14, fontWeight:700, cursor:'pointer' }
const actBtn = (color) => ({ background:color+'12', border:`1px solid ${color}33`, color, borderRadius:8, padding:'5px 9px', fontSize:13, cursor:'pointer' })

function ToggleBtn({ value, onChange }) {
  return (
    <button onClick={onChange} style={{ width:38, height:22, borderRadius:11, border:'none', background: value ? '#22C55E' : '#E0E4EA', cursor:'pointer', position:'relative', transition:'background .2s' }}>
      <span style={{ position:'absolute', top:2, left: value ? 18 : 2, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.2)' }} />
    </button>
  )
}

function Toast({ msg }) {
  return <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:'#fff', border:'1px solid #E8ECF0', color:'#111', padding:'10px 20px', borderRadius:12, fontSize:13, fontWeight:700, boxShadow:'0 8px 32px rgba(0,0,0,.12)' }}>{msg}</div>
}

function ProductPicker({ products, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const { t } = useTranslation()

  const selected = products.find(p => String(p.id) === String(value))
  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width:'100%', background:'#F5F7FA', border:'1.5px solid ' + (open ? '#E31E24' : '#E8ECF0'), borderRadius:10, padding:'8px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:10, textAlign:'left' }}>
        {selected ? (
          <>
            <img src={selected.image_url} alt="" style={{ width:36, height:36, borderRadius:8, objectFit:'cover', flexShrink:0, background:'#eee' }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selected.name}</div>
              <div style={{ fontSize:11, color:'#E31E24', fontWeight:700 }}>{selected.price?.toLocaleString()} {t('common.currency')}</div>
            </div>
          </>
        ) : (
          <span style={{ fontSize:13, color:'#aaa', flex:1 }}>{t('admin.banners.select_product')}</span>
        )}
        <span style={{ fontSize:10, color:'#aaa', transform: open ? 'rotate(180deg)' : 'none', transition:'transform .15s' }}>▼</span>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'#fff', border:'1.5px solid #E8ECF0', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,.12)', zIndex:600, overflow:'hidden', maxHeight:300 }}>
          <div style={{ padding:'8px 10px', borderBottom:'1px solid #F0F2F5' }}>
            <input autoFocus placeholder={t('admin.banners.search_product')} value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:'100%', border:'none', background:'transparent', outline:'none', fontSize:13, color:'#111', boxSizing:'border-box' }} />
          </div>
          <div style={{ overflowY:'auto', maxHeight:248 }}>
            {filtered.length === 0
              ? <div style={{ padding:'16px', textAlign:'center', color:'#bbb', fontSize:13 }}>{t('common.not_found')}</div>
              : filtered.map(p => (
                  <button key={p.id} type="button"
                    onClick={() => { onChange(String(p.id)); setOpen(false); setSearch('') }}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', border:'none', background: String(p.id) === String(value) ? '#FFF0F0' : '#fff', cursor:'pointer', textAlign:'left', borderBottom:'1px solid #F5F7FA' }}
                    onMouseEnter={e => { if (String(p.id) !== String(value)) e.currentTarget.style.background='#F8F9FA' }}
                    onMouseLeave={e => { e.currentTarget.style.background = String(p.id) === String(value) ? '#FFF0F0' : '#fff' }}>
                    <img src={p.image_url} alt="" style={{ width:40, height:40, borderRadius:8, objectFit:'cover', flexShrink:0, background:'#F0F2F5' }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize:11, color: String(p.id) === String(value) ? '#E31E24' : '#888', fontWeight:600 }}>{p.price?.toLocaleString()} {t('common.currency')}</div>
                    </div>
                    {String(p.id) === String(value) && <span style={{ color:'#E31E24', fontSize:16 }}>✓</span>}
                  </button>
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
