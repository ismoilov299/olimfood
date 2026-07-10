import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getPromos, createPromo, updatePromo, deletePromo } from '../../api'

const EMPTY = {
  code: '', discount_type: 'percent', discount_value: 10,
  min_order: 0, max_discount: 0, usage_limit: 0, active: true, expires_at: '',
}

const fmt = (n) => Number(n || 0).toLocaleString('ru-RU').replace(/,/g, ' ')

export default function Promos() {
  const [promos,  setPromos]  = useState([])
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')
  const { t } = useTranslation()

  const load = () => getPromos().then(r => setPromos(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const openNew  = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (p) => {
    setEditing(p)
    setForm({
      code: p.code || '', discount_type: p.discount_type || 'percent',
      discount_value: p.discount_value || 0, min_order: p.min_order || 0,
      max_discount: p.max_discount || 0, usage_limit: p.usage_limit || 0,
      active: p.active, expires_at: p.expires_at ? p.expires_at.slice(0, 10) : '',
    })
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.code.trim()) { showToast(t('admin.promos.toast_code_required')); return }
    setSaving(true)
    try {
      const data = {
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value) || 0,
        min_order: parseFloat(form.min_order) || 0,
        max_discount: form.discount_type === 'percent' ? (parseFloat(form.max_discount) || 0) : 0,
        usage_limit: parseInt(form.usage_limit) || 0,
        active: form.active,
        expires_at: form.expires_at ? form.expires_at : null,
      }
      if (editing) { await updatePromo(editing.id, data) } else { await createPromo(data) }
      showToast(editing ? t('admin.promos.toast_updated') : t('admin.promos.toast_added'))
      setModal(false); load()
    } catch (e) { showToast('❌ ' + (e.response?.data?.detail || '')) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('admin.promos.confirm_delete'))) return
    await deletePromo(id); showToast(t('admin.promos.toast_deleted')); load()
  }
  const handleToggle = async (p) => { await updatePromo(p.id, { active: !p.active }); load() }

  const discountLabel = (p) => p.discount_type === 'percent'
    ? `−${p.discount_value}%`
    : `−${fmt(p.discount_value)} ${t('common.currency')}`

  const isExpired = (p) => p.expires_at && new Date(p.expires_at) < new Date()
  const limitReached = (p) => p.usage_limit > 0 && p.used_count >= p.usage_limit

  return (
    <div>
      {toast && <Toast msg={toast} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <h1 style={{ fontSize:24, fontWeight:900, color:'#111' }}>{t('admin.promos.title')}</h1>
        <button onClick={openNew} style={redBtn}>{t('admin.promos.new_btn')}</button>
      </div>

      <div style={{ display:'grid', gap:10 }}>
        {promos.map(p => (
          <div key={p.id} style={{ background:'#fff', borderRadius:14, border:'1px solid #E8ECF0', padding:'14px 18px', display:'flex', alignItems:'center', gap:14, boxShadow:'0 2px 8px rgba(0,0,0,.04)', opacity: p.active ? 1 : .55 }}>
            <div style={{ width:52, height:52, borderRadius:12, background:'linear-gradient(135deg,#E5232B,#C01820)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, boxShadow:'0 3px 10px rgba(229,35,43,.25)' }}>🎟</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontWeight:900, color:'#111', fontSize:15, letterSpacing:.5, fontFamily:'monospace' }}>{p.code}</span>
                <span style={{ background:'#E5232B12', color:'#E5232B', fontWeight:800, fontSize:12, padding:'2px 9px', borderRadius:8 }}>{discountLabel(p)}</span>
                {isExpired(p)    && <span style={pill('#EF4444')}>{t('admin.promos.expired')}</span>}
                {limitReached(p) && <span style={pill('#EA580C')}>{t('admin.promos.limit_reached')}</span>}
              </div>
              <div style={{ fontSize:11.5, color:'#aaa', marginTop:4, display:'flex', gap:12, flexWrap:'wrap' }}>
                {p.min_order > 0 && <span>{t('admin.promos.min_order')}: {fmt(p.min_order)}</span>}
                {p.discount_type === 'percent' && p.max_discount > 0 && <span>{t('admin.promos.max_discount')}: {fmt(p.max_discount)}</span>}
                <span>{t('admin.promos.used')}: {p.used_count}{p.usage_limit > 0 ? ` / ${p.usage_limit}` : ''}</span>
                {p.expires_at && <span>{t('admin.promos.until')}: {p.expires_at.slice(0, 10)}</span>}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <ToggleBtn value={p.active} onChange={() => handleToggle(p)} />
              <button onClick={() => openEdit(p)} style={actBtn('#3B82F6')}>✏️</button>
              <button onClick={() => handleDelete(p.id)} style={actBtn('#EF4444')}>🗑️</button>
            </div>
          </div>
        ))}
        {!promos.length && <div style={{ textAlign:'center', padding:'60px 0', color:'#ccc' }}><div style={{ fontSize:48, marginBottom:12 }}>🎟</div><div>{t('admin.promos.no_promos')}</div></div>}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:500, overflowY:'auto', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 20px' }}
          onClick={() => setModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, border:'1px solid #E8ECF0', padding:'28px', width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,.12)' }}>
            <div style={{ fontWeight:900, fontSize:18, marginBottom:20, color:'#111' }}>
              {editing ? t('admin.promos.modal_edit') : t('admin.promos.modal_new')}
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>{t('admin.promos.field_code')}</label>
              <input placeholder="OLIMFOOD30" value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                style={{ ...lightInput, fontFamily:'monospace', letterSpacing:1, fontWeight:700 }} />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>{t('admin.promos.field_type')}</label>
              <div style={{ display:'flex', gap:8 }}>
                {[['percent', t('admin.promos.type_percent')], ['fixed', t('admin.promos.type_fixed')]].map(([key, l]) => (
                  <button key={key} type="button" onClick={() => setForm(f => ({ ...f, discount_type: key }))}
                    style={{ flex:1, padding:'9px 12px', borderRadius:10, border: form.discount_type===key ? '1.5px solid #E31E24' : '1.5px solid #E8ECF0', background: form.discount_type===key ? '#E31E2412' : '#F5F7FA', color: form.discount_type===key ? '#E31E24' : '#666', fontSize:13, fontWeight:700, cursor:'pointer' }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:12, marginBottom:14 }}>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>{form.discount_type === 'percent' ? t('admin.promos.field_value_pct') : t('admin.promos.field_value_sum')}</label>
                <input type="number" min={0} value={form.discount_value}
                  onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} style={lightInput} />
              </div>
              {form.discount_type === 'percent' && (
                <div style={{ flex:1 }}>
                  <label style={labelStyle}>{t('admin.promos.field_max_discount')}</label>
                  <input type="number" min={0} placeholder="0 = ∞" value={form.max_discount}
                    onChange={e => setForm(f => ({ ...f, max_discount: e.target.value }))} style={lightInput} />
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:12, marginBottom:14 }}>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>{t('admin.promos.field_min_order')}</label>
                <input type="number" min={0} value={form.min_order}
                  onChange={e => setForm(f => ({ ...f, min_order: e.target.value }))} style={lightInput} />
              </div>
              <div style={{ flex:1 }}>
                <label style={labelStyle}>{t('admin.promos.field_usage_limit')}</label>
                <input type="number" min={0} placeholder="0 = ∞" value={form.usage_limit}
                  onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))} style={lightInput} />
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>{t('admin.promos.field_expires')}</label>
              <input type="date" value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} style={lightInput} />
            </div>

            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#555', fontWeight:600, marginBottom:22 }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ width:16, height:16, accentColor:'#E31E24' }} />
              {t('admin.promos.check_active')}
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
const pill = (color) => ({ background:color+'18', color, fontWeight:800, fontSize:10, padding:'2px 7px', borderRadius:7, textTransform:'uppercase', letterSpacing:.3 })

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
