import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, uploadImage } from '../../api'
import { buildCategoryTree } from '../../utils/categoryTree'
import { parseCharacteristics, stringifyCharacteristics, cleanCharacteristics } from '../../utils/characteristics'
import LangTabs from './LangTabs'
import CharacteristicsField from './CharacteristicsField'

// Yangi maxsulot qo'shishda "Характеристикаси" ro'yxatiga tushadigan boshlang'ich
// qatorlar — nomlari tayyor, qiymatlari bo'sh; admin to'ldiradi, o'zgartiradi
// yoki yangi qator qo'shadi/o'chiradi.
const CHARACTERISTICS_TEMPLATE_UZ = stringifyCharacteristics([
  { label: 'Маҳсулот тури',        value: '' },
  { label: 'Қобиқ тури',           value: '' },
  { label: 'Қобиқ диаметри',       value: 'Ø ' },
  { label: 'Сақлаш шартлари',      value: '' },
  { label: 'Яроқлилик муддати',    value: '' },
])

const EMPTY = {
  name_uz:'', name_uzl:'', name_ru:'',
  description_uz:'', description_uzl:'', description_ru:'',
  characteristics_uz: CHARACTERISTICS_TEMPLATE_UZ, characteristics_uzl:'', characteristics_ru:'',
  weight_uz:'', weight_uzl:'', weight_ru:'',
  price:'', unit:'dona', step:0.5, net_weight:'', image_url:'', cat_id:'', discount:0, available:true, popular:false,
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCatFilter]  = useState(searchParams.get('cat_id') || '')
  const [page,       setPage]       = useState(1)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [toast,      setToast]      = useState('')
  const fileRef = useRef(null)
  const { t } = useTranslation()
  const fmt = (n) => n?.toLocaleString() + ' ' + t('common.currency')
  const PER = 12

  const load = () => getProducts({ search: search || undefined, cat_id: catFilter || undefined, lang:'uz' }).then(r => setProducts(r.data))
  const catTree = buildCategoryTree(categories)
  const catFilterObj = categories.find(c => String(c.id) === String(catFilter))

  useEffect(() => { getCategories('uz').then(r => setCategories(r.data)) }, [])
  useEffect(() => { load() }, [search, catFilter])

  const handleCatFilterChange = (value) => {
    setCatFilter(value); setPage(1)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('cat_id', value); else next.delete('cat_id')
    setSearchParams(next, { replace: true })
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const openNew = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (p) => {
    setEditing(p)
    setForm({
      name_uz: p.name_uz||'', name_uzl: p.name_uzl||'', name_ru: p.name_ru||'',
      description_uz: p.description_uz||'', description_uzl: p.description_uzl||'', description_ru: p.description_ru||'',
      characteristics_uz: p.characteristics_uz||'', characteristics_uzl: p.characteristics_uzl||'', characteristics_ru: p.characteristics_ru||'',
      weight_uz: p.weight_uz||'', weight_uzl: p.weight_uzl||'', weight_ru: p.weight_ru||'',
      price: p.price, unit: p.unit||'dona', step: p.step||0.5, net_weight: p.net_weight ?? '', image_url: p.image_url||'', cat_id: p.cat_id,
      discount: p.discount||0, available: p.available, popular: p.popular,
    })
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.name_uz || !form.price || !form.cat_id) { showToast(t('admin.products.toast_required')); return }
    setSaving(true)
    try {
      const finalizeCharacteristics = (raw) => stringifyCharacteristics(cleanCharacteristics(parseCharacteristics(raw)))
      const data = {
        ...form,
        characteristics_uz: finalizeCharacteristics(form.characteristics_uz),
        characteristics_uzl: finalizeCharacteristics(form.characteristics_uzl),
        characteristics_ru: finalizeCharacteristics(form.characteristics_ru),
        price: parseFloat(form.price), cat_id: parseInt(form.cat_id), discount: parseInt(form.discount)||0,
        step: parseFloat(form.step) || 0.5,
        net_weight: form.net_weight !== '' ? parseFloat(form.net_weight) : null,
      }
      if (editing) { await updateProduct(editing.id, data) }
      else         { await createProduct(data) }
      showToast(editing ? t('admin.products.toast_updated') : t('admin.products.toast_added'))
      setModal(false); load()
    } catch (e) { showToast(t('admin.products.toast_error') + ' ' + (e.response?.data?.detail || '')) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('admin.products.confirm_delete'))) return
    await deleteProduct(id); showToast(t('admin.products.toast_deleted')); load()
  }

  const handleToggle = async (p, field) => { await updateProduct(p.id, { [field]: !p[field] }); load() }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try {
      const res = await uploadImage(file)
      setForm(f => ({ ...f, image_url: res.data.url }))
      showToast(t('admin.products.toast_img_ok'))
    } catch { showToast(t('admin.products.toast_img_error')) }
    finally { setUploading(false); e.target.value = '' }
  }

  const pages     = Math.ceil(products.length / PER)
  const paginated = products.slice((page-1)*PER, page*PER)

  return (
    <div>
      {toast && <Toast msg={toast} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <h1 style={{ fontSize:24, fontWeight:900, color:'#111' }}>{t('admin.products.title')}</h1>
        <button onClick={openNew} style={redBtn}>{t('admin.products.new_btn')}</button>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <input placeholder={t('admin.products.search_placeholder')} value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ ...lightInput, borderRadius:12, flex:2 }} />
        <select value={catFilter} onChange={e => handleCatFilterChange(e.target.value)}
          style={{ ...lightInput, borderRadius:12, flex:1 }}>
          <option value="">{t('admin.products.filter_all_categories')}</option>
          {catTree.map(c => <option key={c.id} value={c.id}>{'—'.repeat(c.depth)} {c.emoji} {c.name_uz}</option>)}
        </select>
      </div>

      {catFilterObj && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(227,30,36,.08)', color:'#E31E24', borderRadius:20, padding:'6px 12px', fontSize:12.5, fontWeight:700 }}>
            {t('admin.products.filtered_by', { name: catFilterObj.name_uz })}
            <button onClick={() => handleCatFilterChange('')} style={{ background:'none', border:'none', color:'#E31E24', cursor:'pointer', fontWeight:900, fontSize:13, padding:0, lineHeight:1 }}>✕</button>
          </span>
        </div>
      )}

      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E8ECF0', overflowX:'auto', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
          <thead>
            <tr style={{ color:'#999', fontSize:12, background:'#FAFAFA' }}>
              {[t('admin.products.col_product'),t('admin.products.col_category'),t('admin.products.col_price'),t('admin.products.col_discount'),t('admin.products.col_available'),t('admin.products.col_popular'),''].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, borderBottom:'1px solid #F0F2F5' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map(p => (
              <tr key={p.id} style={{ borderTop:'1px solid #F5F5F5' }}>
                <td style={{ padding:'12px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{ width:44, height:44, borderRadius:10, objectFit:'cover', flexShrink:0 }} />
                      : <div style={{ width:44, height:44, borderRadius:10, background:'#F0F2F5', flexShrink:0 }} />
                    }
                    <div>
                      <div style={{ fontWeight:700, color:'#111' }}>{p.name}</div>
                      {p.weight && <div style={{ fontSize:11, color:'#aaa' }}>{p.weight}</div>}
                    </div>
                  </div>
                </td>
                <td style={{ padding:'12px 16px', color:'#666' }}>{p.category_emoji} {p.category_name}</td>
                <td style={{ padding:'12px 16px', fontWeight:700, color:'#111' }}>
                  {fmt(p.price)}
                  <span style={{ fontWeight:600, color:'#aaa' }}> / {t(`admin.products.unit_${p.unit || 'dona'}`)}</span>
                </td>
                <td style={{ padding:'12px 16px' }}>
                  {p.discount > 0
                    ? <span style={{ background:'rgba(227,30,36,.08)', color:'#E31E24', borderRadius:20, padding:'2px 9px', fontSize:11, fontWeight:800 }}>-{p.discount}%</span>
                    : <span style={{ color:'#ccc' }}>—</span>}
                </td>
                <td style={{ padding:'12px 16px' }}><ToggleBtn value={p.available} onChange={() => handleToggle(p,'available')} color="#22C55E" /></td>
                <td style={{ padding:'12px 16px' }}><ToggleBtn value={p.popular}   onChange={() => handleToggle(p,'popular')}   color="#F59E0B" /></td>
                <td style={{ padding:'12px 16px' }}>
                  <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                    <button onClick={() => openEdit(p)}    style={actBtn('#3B82F6')}>✏️</button>
                    <button onClick={() => handleDelete(p.id)} style={actBtn('#EF4444')}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'#ccc' }}>{t('admin.products.no_products')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:16 }}>
          {Array.from({ length:pages },(_,i)=>i+1).map(n => (
            <button key={n} onClick={() => setPage(n)} style={{
              width:34, height:34, borderRadius:8, border:'none',
              background: n===page ? '#E31E24' : '#fff',
              color: n===page ? '#fff' : '#666',
              border: n===page ? 'none' : '1px solid #E8ECF0',
              fontWeight:700, fontSize:13, cursor:'pointer',
            }}>{n}</button>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'#fff', borderRadius:20, border:'1px solid #E8ECF0',
            padding:'28px', width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto',
            boxShadow:'0 20px 60px rgba(0,0,0,.12)',
          }}>
            <div style={{ fontWeight:900, fontSize:18, marginBottom:22, color:'#111' }}>
              {editing ? t('admin.products.modal_edit') : t('admin.products.modal_new')}
            </div>

            <LangTabs label={t('admin.products.field_name')} baseKey="name" required
              form={form} setForm={setForm} placeholder={t('admin.products.field_name')} />
            <LangTabs label={t('admin.products.field_desc')} baseKey="description" multiline
              form={form} setForm={setForm} placeholder={t('admin.products.field_desc')} />
            <CharacteristicsField form={form} setForm={setForm} />

            {/* Image */}
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>{t('admin.products.field_image')}</label>
              {form.image_url && (
                <div style={{ position:'relative', marginBottom:10, borderRadius:12, overflow:'hidden', height:150 }}>
                  <img src={form.image_url} alt="preview"
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                    onError={e => { e.target.parentElement.style.display='none' }} />
                  <button onClick={() => setForm(f => ({ ...f, image_url:'' }))}
                    style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.55)', border:'none', borderRadius:8, color:'#fff', padding:'4px 10px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                    ✕ {t('common.delete')}
                  </button>
                </div>
              )}
              <div onClick={() => fileRef.current?.click()}
                style={{ border:'2px dashed #E0E4EA', borderRadius:12, padding:'16px', textAlign:'center', cursor:'pointer', background:'#FAFAFA', marginBottom:8, transition:'border-color .2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='#E31E24'}
                onMouseLeave={e => e.currentTarget.style.borderColor='#E0E4EA'}>
                {uploading
                  ? <div style={{ color:'#888', fontSize:13 }}>⏳ {t('common.uploading')}</div>
                  : <>
                      <div style={{ fontSize:22, marginBottom:4 }}>📁</div>
                      <div style={{ fontSize:13, color:'#666', fontWeight:600 }}>
                        {form.image_url ? t('admin.products.change_img') : t('admin.products.upload_btn')}
                      </div>
                      <div style={{ fontSize:11, color:'#bbb', marginTop:2 }}>{t('admin.products.file_types')}</div>
                    </>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileUpload} />
              <input placeholder={t('admin.products.field_image') + ': https://...'} value={form.image_url}
                onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                style={{ ...lightInput, fontSize:12 }} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={labelStyle}>{t('admin.products.field_price')}</label>
                <input type="number" placeholder="45000" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  style={lightInput} />
              </div>
              <div>
                <label style={labelStyle}>{t('admin.products.field_unit')}</label>
                <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} style={lightInput}>
                  <option value="dona">{t('admin.products.unit_dona')}</option>
                  <option value="kg">{t('admin.products.unit_kg')}</option>
                  <option value="gr">{t('admin.products.unit_gr')}</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t('admin.products.field_discount')}</label>
                <input type="number" min={0} max={80} placeholder="0" value={form.discount}
                  onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                  style={lightInput} />
              </div>
            </div>

            {(form.unit === 'kg' || form.unit === 'gr') && (
              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>{t('admin.products.field_step')}</label>
                <input type="number" min={form.unit === 'gr' ? 1 : 0.1} step={form.unit === 'gr' ? 1 : 0.1}
                  placeholder={form.unit === 'gr' ? '50' : '0.5'} value={form.step}
                  onChange={e => setForm(f => ({ ...f, step: e.target.value }))}
                  style={lightInput} />
                <div style={{ fontSize:11.5, color:'#aaa', marginTop:5 }}>{t('admin.products.field_step_hint')}</div>
              </div>
            )}

            {form.unit === 'dona' && (
              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>{t('admin.products.field_net_weight')}</label>
                <input type="number" min={0.1} step={0.1} placeholder="350" value={form.net_weight}
                  onChange={e => setForm(f => ({ ...f, net_weight: e.target.value }))}
                  style={lightInput} />
                <div style={{ fontSize:11.5, color:'#aaa', marginTop:5 }}>{t('admin.products.field_net_weight_hint')}</div>
              </div>
            )}

            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>{t('admin.products.field_category')}</label>
              <select value={form.cat_id} onChange={e => setForm(f => ({ ...f, cat_id: e.target.value }))}
                style={{ ...lightInput }}>
                <option value="">—</option>
                {catTree.map(c => <option key={c.id} value={c.id}>{'—'.repeat(c.depth)} {c.emoji} {c.name_uz}</option>)}
              </select>
            </div>

            <div style={{ display:'flex', gap:20, marginBottom:24 }}>
              {[{key:'available',label:t('admin.products.check_available')},{key:'popular',label:t('admin.products.check_popular')}].map(({ key, label }) => (
                <label key={key} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#555', fontWeight:600 }}>
                  <input type="checkbox" checked={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    style={{ width:16, height:16, accentColor:'#E31E24' }} />
                  {label}
                </label>
              ))}
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setModal(false)} style={cancelBtn}>{t('common.cancel')}</button>
              <button onClick={handleSave} disabled={saving} style={{ ...redBtn, flex:2, padding:'12px', borderRadius:12, fontSize:14 }}>
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
const lightInput = { background:'#F5F7FA', border:'1.5px solid #E8ECF0', color:'#111', borderRadius:10, padding:'10px 14px', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, outline:'none', width:'100%', transition:'border-color .2s', boxSizing:'border-box' }
const redBtn = { background:'#E31E24', color:'#fff', border:'none', borderRadius:10, padding:'9px 18px', fontSize:14, fontWeight:800, cursor:'pointer' }
const cancelBtn = { flex:1, background:'#F5F7FA', color:'#666', border:'1.5px solid #E8ECF0', borderRadius:12, padding:'12px', fontSize:14, fontWeight:700, cursor:'pointer' }
const actBtn = (color) => ({ background:color+'12', border:`1px solid ${color}33`, color, borderRadius:8, padding:'5px 9px', fontSize:13, cursor:'pointer' })

function ToggleBtn({ value, onChange, color }) {
  return (
    <button onClick={onChange} style={{ width:38, height:22, borderRadius:11, border:'none', background: value ? color : '#E0E4EA', cursor:'pointer', position:'relative', transition:'background .2s' }}>
      <span style={{ position:'absolute', top:2, left: value ? 18 : 2, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.2)' }} />
    </button>
  )
}

function Toast({ msg }) {
  return (
    <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:'#fff', border:'1px solid #E8ECF0', color:'#111', padding:'10px 20px', borderRadius:12, fontSize:13, fontWeight:700, boxShadow:'0 8px 32px rgba(0,0,0,.12)' }}>
      {msg}
    </div>
  )
}
