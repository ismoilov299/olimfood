import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { changePassword, getSetting, setSetting } from '../../api'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const [form, setForm]     = useState({ old_password:'', new_password:'', confirm:'' })
  const [msg,  setMsg]      = useState(null)
  const [saving, setSaving] = useState(false)
  const [support, setSupport]           = useState({ telegram:'', phone:'' })
  const [supportSaving, setSupportSaving] = useState(false)
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  useEffect(() => {
    Promise.all([getSetting('support_telegram'), getSetting('support_phone')])
      .then(([tg, ph]) => setSupport({ telegram: tg.data.value || '', phone: ph.data.value || '' }))
      .catch(() => {})
  }, [])

  const showMsg = (text, type='success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000) }

  const handleChange = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm) { showMsg(t('admin.settings.error_mismatch'), 'error'); return }
    if (form.new_password.length < 4)       { showMsg(t('admin.settings.error_too_short'), 'error'); return }
    setSaving(true)
    try {
      await changePassword(form.old_password, form.new_password)
      showMsg(t('admin.settings.success_changed'))
      setForm({ old_password:'', new_password:'', confirm:'' })
    } catch (e) { showMsg(e.response?.data?.detail || t('admin.settings.error_generic'), 'error') }
    finally { setSaving(false) }
  }

  const handleSaveSupport = async () => {
    setSupportSaving(true)
    try {
      await Promise.all([
        setSetting('support_telegram', support.telegram),
        setSetting('support_phone', support.phone),
      ])
      showMsg(t('admin.settings.success_changed'))
    } catch { showMsg(t('admin.settings.error_generic'), 'error') }
    finally { setSupportSaving(false) }
  }

  return (
    <div>
      <h1 style={{ fontSize:24, fontWeight:900, color:'#111', marginBottom:28 }}>{t('admin.settings.title')}</h1>

      {msg && (
        <div style={{
          background: msg.type==='error' ? 'rgba(239,68,68,.06)' : 'rgba(34,197,94,.06)',
          border: `1.5px solid ${msg.type==='error' ? 'rgba(239,68,68,.2)' : 'rgba(34,197,94,.2)'}`,
          borderRadius:12, padding:'12px 16px', fontSize:13, fontWeight:700,
          color: msg.type==='error' ? '#EF4444' : '#16A34A', marginBottom:20,
        }}>{msg.text}</div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, maxWidth:800 }}>
        {/* Password */}
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E8ECF0', padding:'24px', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
          <div style={{ fontWeight:800, fontSize:16, marginBottom:20, color:'#111' }}>{t('admin.settings.password_section')}</div>
          <form onSubmit={handleChange}>
            {[
              { key:'old_password', label: t('admin.settings.old_password') },
              { key:'new_password', label: t('admin.settings.new_password') },
              { key:'confirm',      label: t('admin.settings.confirm_password') },
            ].map(({ key, label }) => (
              <div key={key} style={{ marginBottom:14 }}>
                <label style={labelStyle}>{label}</label>
                <input type="password" value={form[key]} placeholder="••••••••"
                  onChange={e => setForm(f => ({ ...f, [key]:e.target.value }))}
                  style={lightInput} />
              </div>
            ))}
            <button type="submit" disabled={saving} style={{ width:'100%', background: saving ? '#ccc' : '#E31E24', color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:800, cursor: saving ? 'not-allowed' : 'pointer', marginTop:4 }}>
              {saving ? t('admin.settings.saving_btn') : t('admin.settings.save_btn')}
            </button>
          </form>
        </div>

        {/* Account */}
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E8ECF0', padding:'24px', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
          <div style={{ fontWeight:800, fontSize:16, marginBottom:20, color:'#111' }}>{t('admin.settings.account_section')}</div>
          <div style={{ background:'#F5F7FA', borderRadius:12, padding:16, marginBottom:14 }}>
            <div style={{ fontSize:12, color:'#aaa', marginBottom:4, fontWeight:600 }}>{t('admin.settings.login_label')}</div>
            <div style={{ fontSize:16, fontWeight:800, color:'#111' }}>admin</div>
          </div>
          <div style={{ background:'rgba(34,197,94,.06)', border:'1.5px solid rgba(34,197,94,.2)', borderRadius:12, padding:14, marginBottom:16 }}>
            <div style={{ fontSize:12, color:'#16A34A', fontWeight:700, marginBottom:3 }}>{t('admin.settings.active_session')}</div>
            <div style={{ fontSize:13, color:'#888' }}>{t('admin.settings.logged_in_text')}</div>
          </div>
          <button onClick={() => { logout(); navigate('/admin/login') }}
            style={{ width:'100%', background:'rgba(239,68,68,.06)', border:'1.5px solid rgba(239,68,68,.2)', color:'#EF4444', borderRadius:12, padding:'12px', fontSize:14, fontWeight:800, cursor:'pointer' }}>
            {t('admin.settings.logout_btn')}
          </button>
        </div>

        {/* Support contacts — shown to customers at the bottom of the Profile tab */}
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E8ECF0', padding:'24px', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
          <div style={{ fontWeight:800, fontSize:16, marginBottom:6, color:'#111' }}>{t('admin.settings.support_section')}</div>
          <div style={{ fontSize:12, color:'#aaa', marginBottom:20 }}>{t('admin.settings.support_section_hint')}</div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>{t('admin.settings.field_telegram')}</label>
            <input value={support.telegram} placeholder="olimbrand_support"
              onChange={e => setSupport(s => ({ ...s, telegram: e.target.value }))}
              style={lightInput} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>{t('admin.settings.field_phone')}</label>
            <input value={support.phone} placeholder="+998 90 123 45 67"
              onChange={e => setSupport(s => ({ ...s, phone: e.target.value }))}
              style={lightInput} />
          </div>
          <button onClick={handleSaveSupport} disabled={supportSaving} style={{ width:'100%', background: supportSaving ? '#ccc' : '#E31E24', color:'#fff', border:'none', borderRadius:12, padding:'12px', fontSize:14, fontWeight:800, cursor: supportSaving ? 'not-allowed' : 'pointer' }}>
            {supportSaving ? t('admin.settings.saving_btn') : t('admin.settings.save_btn')}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { fontSize:11.5, color:'#888', fontWeight:700, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.5 }
const lightInput = { background:'#F5F7FA', border:'1.5px solid #E8ECF0', color:'#111', borderRadius:10, padding:'10px 14px', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, outline:'none', width:'100%', boxSizing:'border-box' }
