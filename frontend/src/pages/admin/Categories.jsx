import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getCategories, createCategory, updateCategory, deleteCategory, uploadImage, getSetting, setSetting } from '../../api'
import { buildCategoryTree, excludeSubtree } from '../../utils/categoryTree'
import LangTabs from './LangTabs'

const EMPTY = { name_uz:'', name_uzl:'', name_ru:'', emoji:'🍽️', image_url:'', order:0, active:true, parent_id:null }

export default function Categories() {
  const [cats,       setCats]       = useState([])
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [allImg,     setAllImg]     = useState('')
  const [allSaving,  setAllSaving]  = useState(false)
  const [allUploading, setAllUploading] = useState(false)
  const [toast,      setToast]      = useState('')
  const fileRef    = useRef(null)
  const allFileRef = useRef(null)
  const { t } = useTranslation()
  const navigate = useNavigate()

  const load = () => getCategories('uz').then(r => setCats(r.data))
  useEffect(() => {
    load()
    getSetting('all_category_image').then(r => setAllImg(r.data.value || '')).catch(() => {})
  }, [])

  const tree = buildCategoryTree(cats)
  const parentOptions = excludeSubtree(tree, editing?.id)

  const saveAllImage = async () => {
    setAllSaving(true)
    try { await setSetting('all_category_image', allImg); showToast(t('admin.categories.toast_saved')) }
    catch { showToast(t('admin.categories.toast_error')) }
    finally { setAllSaving(false) }
  }

  const handleAllFile = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setAllUploading(true)
    try { const res = await uploadImage(file); setAllImg(res.data.url) }
    catch { showToast(t('admin.categories.toast_upload_error')) }
    finally { setAllUploading(false); e.target.value = '' }
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }
  const openNew  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (c) => {
    setEditing(c)
    setForm({
      name_uz: c.name_uz||'', name_uzl: c.name_uzl||'', name_ru: c.name_ru||'',
      emoji: c.emoji||'🍽️', image_url: c.image_url||'', order: c.order||0,
      active: c.active, parent_id: c.parent_id ?? null,
    })
    setModal(true)
  }

  const handleFile = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try { const res = await uploadImage(file); setForm(f => ({ ...f, image_url: res.data.url })) }
    catch { showToast(t('admin.categories.toast_upload_error')) }
    finally { setUploading(false); e.target.value = '' }
  }

  const handleSave = async () => {
    if (!form.name_uz) { showToast(t('admin.categories.toast_name_required')); return }
    setSaving(true)
    try {
      const data = { ...form, order: parseInt(form.order)||0, parent_id: form.parent_id ? parseInt(form.parent_id) : null }
      if (editing) { await updateCategory(editing.id, data) }
      else         { await createCategory(data) }
      showToast(editing ? t('admin.categories.toast_updated') : t('admin.categories.toast_added'))
      setModal(false); load()
    } catch (e) { showToast(t('admin.categories.toast_error') + ' ' + (e.response?.data?.detail||'')) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('admin.categories.confirm_delete'))) return
    try { await deleteCategory(id); showToast(t('admin.categories.toast_deleted')); load() }
    catch (e) { showToast('❌ ' + (e.response?.data?.detail||'Xatolik')) }
  }

  const handleToggle = async (c) => { await updateCategory(c.id, { active: !c.active }); load() }

  return (
    <div>
      {toast && <Toast msg={toast} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <h1 style={{ fontSize:24, fontWeight:900, color:'#111' }}>{t('admin.categories.title')}</h1>
        <button onClick={openNew} style={redBtn}>{t('admin.categories.new_btn')}</button>
      </div>

      {/* "Barchasi" special card */}
      <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #E8ECF0', padding:'16px 20px', marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
        <div style={{ fontWeight:800, fontSize:13, color:'#111', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>🍽️</span> {t('admin.categories.all_icon_label')}
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
          {allImg
            ? <img src={allImg} style={{ width:56, height:56, borderRadius:12, objectFit:'cover', border:'1.5px solid #E8ECF0', flexShrink:0 }} />
            : <div style={{ width:56, height:56, borderRadius:12, background:'#F5F7FA', border:'1.5px dashed #E0E4EA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:24 }}>🍽️</div>
          }
          <div style={{ flex:1 }}>
            <input placeholder="https://..." value={allImg}
              onChange={e => setAllImg(e.target.value)}
              style={{ ...lightInput, marginBottom:8 }} />
            <div style={{ display:'flex', gap:8 }}>
              <button type="button" onClick={() => allFileRef.current?.click()}
                style={{ flex:1, background:'#F5F7FA', border:'1.5px solid #E8ECF0', color:'#555', borderRadius:8, padding:'7px 12px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                {allUploading ? t('common.uploading') : t('common.upload')}
              </button>
              <button onClick={saveAllImage} disabled={allSaving}
                style={{ ...redBtn, padding:'7px 16px', borderRadius:8, fontSize:12, opacity: allSaving ? .6 : 1 }}>
                {allSaving ? t('common.saving') : t('common.save')}
              </button>
            </div>
            <input ref={allFileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAllFile} />
          </div>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {tree.map(c => (
          <div key={c.id} style={{ background:'#fff', borderRadius:14, border:'1px solid #E8ECF0', padding:'16px 18px', marginLeft: c.depth*28, display:'flex', alignItems:'center', gap:12, boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
            {c.depth > 0 && <span style={{ color:'#ccc', fontSize:16, flexShrink:0 }}>↳</span>}
            {c.image_url
              ? <img src={c.image_url} style={{ width:48, height:48, borderRadius:12, objectFit:'cover', flexShrink:0 }} />
              : <span style={{ fontSize:32 }}>{c.emoji}</span>
            }
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:15, color:'#111', marginBottom:2, display:'flex', alignItems:'center', gap:8 }}>
                {c.name_uz}
                {c.children_count > 0 && (
                  <span style={{ fontSize:10.5, fontWeight:800, color:'#3B82F6', background:'#3B82F612', border:'1px solid #3B82F633', borderRadius:20, padding:'2px 8px' }}>
                    {t('admin.categories.subcategory_count', { count: c.children_count })}
                  </span>
                )}
              </div>
              <div onClick={() => navigate(`/admin/products?cat_id=${c.id}`)}
                style={{ fontSize:12, color:'#3B82F6', fontWeight:600, cursor:'pointer', textDecoration:'underline', textUnderlineOffset:2, width:'fit-content' }}>
                {t('admin.categories.product_count', { count: c.product_count })}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <ToggleBtn value={c.active} onChange={() => handleToggle(c)} />
              <button onClick={() => navigate(`/admin/products?cat_id=${c.id}`)} style={actBtn('#8B5CF6')} title={t('admin.categories.view_products')}>👁️</button>
              <button onClick={() => openEdit(c)} style={actBtn('#3B82F6')}>✏️</button>
              <button onClick={() => handleDelete(c.id)} style={actBtn('#EF4444')}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, border:'1px solid #E8ECF0', padding:'28px', width:'100%', maxWidth:420, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.12)' }}>
            <div style={{ fontWeight:900, fontSize:18, marginBottom:22, color:'#111' }}>
              {editing ? t('admin.categories.modal_edit') : t('admin.categories.modal_new')}
            </div>

            <LangTabs label={t('admin.categories.field_name')} baseKey="name" required
              form={form} setForm={setForm} placeholder={t('admin.categories.field_name')} />

            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>{t('admin.categories.field_parent')}</label>
              <select value={form.parent_id ?? ''} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value || null }))} style={lightInput}>
                <option value="">{t('admin.categories.parent_none')}</option>
                {parentOptions.map(c => (
                  <option key={c.id} value={c.id}>{'—'.repeat(c.depth)} {c.emoji} {c.name_uz}</option>
                ))}
              </select>
            </div>

            {/* Image upload */}
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>{t('admin.categories.field_image')}</label>
              <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                {form.image_url
                  ? <img src={form.image_url} style={{ width:56, height:56, borderRadius:10, objectFit:'cover', border:'1.5px solid #E8ECF0', flexShrink:0 }} />
                  : <div style={{ width:56, height:56, borderRadius:10, background:'#F5F7FA', border:'1.5px dashed #E0E4EA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22 }}>{form.emoji||'🍽️'}</div>
                }
                <div style={{ flex:1 }}>
                  <input placeholder="https://..." value={form.image_url}
                    onChange={e => setForm(f => ({ ...f, image_url:e.target.value }))} style={{ ...lightInput, marginBottom:6 }} />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    style={{ background:'#F5F7FA', border:'1.5px solid #E8ECF0', color:'#555', borderRadius:8, padding:'6px 12px', fontSize:12, fontWeight:700, cursor:'pointer', width:'100%' }}>
                    {uploading ? t('common.uploading') : t('common.upload')}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
                </div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              <div>
                <label style={labelStyle}>{t('admin.categories.field_emoji')}</label>
                <input placeholder="🍔" value={form.emoji}
                  onChange={e => setForm(f => ({ ...f, emoji:e.target.value }))} style={lightInput} />
              </div>
              <div>
                <label style={labelStyle}>{t('admin.categories.field_order')}</label>
                <input type="number" placeholder="1" value={form.order}
                  onChange={e => setForm(f => ({ ...f, order:e.target.value }))} style={lightInput} />
              </div>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#555', fontWeight:600, marginBottom:24 }}>
              <input type="checkbox" checked={form.active}
                onChange={e => setForm(f => ({ ...f, active:e.target.checked }))}
                style={{ width:16, height:16, accentColor:'#E31E24' }} />
              {t('admin.categories.check_active')}
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
const redBtn   = { background:'#E31E24', color:'#fff', border:'none', borderRadius:10, padding:'9px 18px', fontSize:14, fontWeight:800, cursor:'pointer' }
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
