import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getCertificates, createCertificate, updateCertificate, deleteCertificate, getCategories, uploadImage } from '../../api'
import { buildCategoryTree } from '../../utils/categoryTree'
import LangTabs from './LangTabs'

const EMPTY = { name_uz:'', name_uzl:'', name_ru:'', logo_url:'', image_url:'', active:true, category_ids:[] }

export default function Certificates() {
  const [certs,      setCerts]      = useState([])
  const [categories, setCategories] = useState([])
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [uploadingLogo,  setUploadingLogo]  = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [toast,      setToast]      = useState('')
  const logoFileRef  = useRef(null)
  const imageFileRef = useRef(null)
  const { t } = useTranslation()

  const catTree = buildCategoryTree(categories)
  const load = () => getCertificates().then(r => setCerts(r.data))

  useEffect(() => {
    load()
    getCategories('uz').then(r => setCategories(r.data))
  }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const openNew = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (c) => {
    setEditing(c)
    setForm({
      name_uz: c.name_uz||'', name_uzl: c.name_uzl||'', name_ru: c.name_ru||'',
      logo_url: c.logo_url||'', image_url: c.image_url||'', active: c.active,
      category_ids: c.category_ids || [],
    })
    setModal(true)
  }

  const toggleCategory = (id) => {
    setForm(f => ({
      ...f,
      category_ids: f.category_ids.includes(id)
        ? f.category_ids.filter(x => x !== id)
        : [...f.category_ids, id],
    }))
  }

  const handleSave = async () => {
    if (!form.name_uz || !form.logo_url || !form.category_ids.length) { showToast(t('admin.certificates.toast_required')); return }
    setSaving(true)
    try {
      if (editing) { await updateCertificate(editing.id, form) }
      else         { await createCertificate(form) }
      showToast(editing ? t('admin.certificates.toast_updated') : t('admin.certificates.toast_added'))
      setModal(false); load()
    } catch (e) { showToast(t('admin.certificates.toast_error') + ' ' + (e.response?.data?.detail || '')) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('admin.certificates.confirm_delete'))) return
    await deleteCertificate(id); showToast(t('admin.certificates.toast_deleted')); load()
  }

  const handleToggle = async (c) => { await updateCertificate(c.id, { active: !c.active }); load() }

  const handleFile = (fieldKey, setUploading) => async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try {
      const res = await uploadImage(file)
      setForm(f => ({ ...f, [fieldKey]: res.data.url }))
      showToast(t('admin.products.toast_img_ok'))
    } catch { showToast(t('admin.products.toast_img_error')) }
    finally { setUploading(false); e.target.value = '' }
  }

  return (
    <div>
      {toast && <Toast msg={toast} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <h1 style={{ fontSize:24, fontWeight:900, color:'#111' }}>{t('admin.certificates.title')}</h1>
        <button onClick={openNew} style={redBtn}>{t('admin.certificates.new_btn')}</button>
      </div>

      <div style={{ display:'grid', gap:10 }}>
        {certs.map(c => (
          <div key={c.id} style={{ background:'#fff', borderRadius:14, border:'1px solid #E8ECF0', padding:'14px 18px', display:'flex', alignItems:'center', gap:14, boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
            {c.logo_url
              ? <img src={c.logo_url} alt="" style={{ width:48, height:48, borderRadius:10, objectFit:'cover', flexShrink:0, background:'#F0F2F5' }} />
              : <div style={{ width:48, height:48, borderRadius:10, background:'#F0F2F5', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🏅</div>
            }
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, color:'#111', fontSize:14 }}>{c.name_uz}</div>
              <div style={{ fontSize:11.5, color:'#aaa', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {c.category_ids?.length
                  ? categories.filter(cat => c.category_ids.includes(cat.id)).map(cat => cat.name_uz).join(', ')
                  : t('admin.certificates.no_categories')}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <ToggleBtn value={c.active} onChange={() => handleToggle(c)} />
              <button onClick={() => openEdit(c)} style={actBtn('#3B82F6')}>✏️</button>
              <button onClick={() => handleDelete(c.id)} style={actBtn('#EF4444')}>🗑️</button>
            </div>
          </div>
        ))}
        {!certs.length && <div style={{ textAlign:'center', padding:'60px 0', color:'#ccc' }}><div style={{ fontSize:48, marginBottom:12 }}>🏅</div><div>{t('admin.certificates.no_certificates')}</div></div>}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:500, overflowY:'auto', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 20px' }}
          onClick={() => setModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, border:'1px solid #E8ECF0', padding:'28px', width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,.12)' }}>
            <div style={{ fontWeight:900, fontSize:18, marginBottom:22, color:'#111' }}>
              {editing ? t('admin.certificates.modal_edit') : t('admin.certificates.modal_new')}
            </div>

            <LangTabs label={t('admin.certificates.field_name')} baseKey="name" required
              form={form} setForm={setForm} placeholder={t('admin.certificates.field_name')} />

            {/* Logo — small badge shown on the product page */}
            <ImageField
              label={t('admin.certificates.field_logo')} hint={t('admin.certificates.field_logo_hint')}
              value={form.logo_url} onChange={url => setForm(f => ({ ...f, logo_url: url }))}
              uploading={uploadingLogo} onFile={handleFile('logo_url', setUploadingLogo)} fileRef={logoFileRef} height={90} />

            {/* Full certificate scan — shown when the badge is tapped */}
            <ImageField
              label={t('admin.certificates.field_image')} hint={t('admin.certificates.field_image_hint')}
              value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))}
              uploading={uploadingImage} onFile={handleFile('image_url', setUploadingImage)} fileRef={imageFileRef} height={150} />

            {/* Categories this certificate applies to */}
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>{t('admin.certificates.field_categories')}</label>
              <div style={{ fontSize:11.5, color:'#aaa', marginBottom:8 }}>{t('admin.certificates.field_categories_hint')}</div>
              <div style={{ border:'1.5px solid #E8ECF0', borderRadius:12, maxHeight:220, overflowY:'auto', background:'#FAFAFA' }}>
                {catTree.map(c => (
                  <label key={c.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', paddingLeft: 12 + c.depth*18, cursor:'pointer', borderBottom:'1px solid #F0F2F5', fontSize:13, color:'#333' }}>
                    <input type="checkbox" checked={form.category_ids.includes(c.id)}
                      onChange={() => toggleCategory(c.id)}
                      style={{ width:15, height:15, accentColor:'#E31E24', flexShrink:0 }} />
                    <span>{c.emoji} {c.name_uz}</span>
                  </label>
                ))}
                {!catTree.length && <div style={{ padding:14, color:'#bbb', fontSize:12.5, textAlign:'center' }}>{t('admin.certificates.no_categories_yet')}</div>}
              </div>
            </div>

            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#555', fontWeight:600, marginBottom:22 }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ width:16, height:16, accentColor:'#E31E24' }} />
              {t('admin.certificates.check_active')}
            </label>

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

function ImageField({ label, hint, value, onChange, uploading, onFile, fileRef, height }) {
  const { t } = useTranslation()
  return (
    <div style={{ marginBottom:14 }}>
      <label style={labelStyle}>{label}</label>
      {hint && <div style={{ fontSize:11.5, color:'#aaa', marginBottom:8, marginTop:-2 }}>{hint}</div>}
      {value && (
        <div style={{ position:'relative', marginBottom:10, borderRadius:12, overflow:'hidden', height, background:'#F0F2F5' }}>
          <img src={value} alt="preview" style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }}
            onError={e => { e.target.parentElement.style.display='none' }} />
          <button onClick={() => onChange('')} type="button"
            style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.55)', border:'none', borderRadius:8, color:'#fff', padding:'4px 10px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            ✕ {t('common.delete')}
          </button>
        </div>
      )}
      <div onClick={() => fileRef.current?.click()}
        style={{ border:'2px dashed #E0E4EA', borderRadius:12, padding:'14px', textAlign:'center', cursor:'pointer', background:'#FAFAFA', marginBottom:8 }}
        onMouseEnter={e => e.currentTarget.style.borderColor='#E31E24'}
        onMouseLeave={e => e.currentTarget.style.borderColor='#E0E4EA'}>
        {uploading
          ? <div style={{ color:'#888', fontSize:13 }}>⏳ {t('common.uploading')}</div>
          : <div style={{ fontSize:13, color:'#666', fontWeight:600 }}>{value ? t('admin.products.change_img') : t('admin.products.upload_btn')}</div>
        }
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={onFile} />
      <input placeholder={label + ': https://...'} value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...lightInput, fontSize:12 }} />
    </div>
  )
}

const labelStyle = { fontSize:11.5, color:'#888', fontWeight:700, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }
const lightInput = { background:'#F5F7FA', border:'1.5px solid #E8ECF0', color:'#111', borderRadius:10, padding:'10px 14px', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, outline:'none', width:'100%', transition:'border-color .2s', boxSizing:'border-box' }
const redBtn = { background:'#E31E24', color:'#fff', border:'none', borderRadius:10, padding:'9px 18px', fontSize:14, fontWeight:800, cursor:'pointer' }
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
  return (
    <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:'#fff', border:'1px solid #E8ECF0', color:'#111', padding:'10px 20px', borderRadius:12, fontSize:13, fontWeight:700, boxShadow:'0 8px 32px rgba(0,0,0,.12)' }}>
      {msg}
    </div>
  )
}
