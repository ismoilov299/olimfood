import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../../store/authStore'
import LangSwitcher from '../../components/LangSwitcher'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const { loginAction } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await loginAction(username, password)
      navigate('/admin/dashboard')
    } catch { setError(t('admin.login.error')) }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      padding:24, position:'relative', overflow:'hidden',
      background:'linear-gradient(145deg,#EEF2FF 0%,#FFF5F5 55%,#EFF8FF 100%)',
      fontFamily:"'Plus Jakarta Sans',sans-serif",
    }}>
      <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:-160, right:-100, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(227,30,36,.12) 0%,transparent 65%)', filter:'blur(70px)' }} />
        <div style={{ position:'absolute', bottom:-100, left:-80, width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,.09) 0%,transparent 65%)', filter:'blur(80px)' }} />
        <div style={{ position:'absolute', top:'50%', left:'30%', width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,.06) 0%,transparent 70%)', filter:'blur(60px)' }} />
      </div>

      {/* Language switcher */}
      <div style={{ position:'fixed', top:20, right:20, zIndex:10 }}>
        <LangSwitcher style={{ background:'rgba(255,255,255,.7)', backdropFilter:'blur(12px)' }} />
      </div>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <img src="/logo-full.jpg" alt="OlimFood" style={{ height:70, borderRadius:14, display:'inline-block', marginBottom:10 }} />
          <div style={{ fontSize:12, color:'#bbb', marginTop:4, fontWeight:600, letterSpacing:.8 }}>{t('admin.login.panel_label')}</div>
        </div>

        <div style={{
          background:'rgba(255,255,255,.78)',
          backdropFilter:'blur(32px) saturate(200%)',
          WebkitBackdropFilter:'blur(32px) saturate(200%)',
          border:'1px solid rgba(255,255,255,.85)',
          borderRadius:28,
          padding:'40px 36px',
          boxShadow:'0 20px 80px rgba(0,0,0,.1), 0 4px 16px rgba(0,0,0,.06)',
        }}>
          <h1 style={{ fontSize:22, fontWeight:900, color:'#111', marginBottom:6 }}>{t('admin.login.title')}</h1>
          <p style={{ fontSize:13.5, color:'#aaa', marginBottom:28 }}>{t('admin.login.subtitle')}</p>

          {error && (
            <div style={{ background:'rgba(227,30,36,.07)', border:'1.5px solid rgba(227,30,36,.2)', borderRadius:12, padding:'11px 16px', marginBottom:18, fontSize:13, color:'#E31E24', fontWeight:600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              { label: t('admin.login.username_label'), val:username, set:setUsername, ph:'admin',  type:'text'     },
              { label: t('admin.login.password_label'), val:password, set:setPassword, ph:'••••••', type:'password' },
            ].map(({ label, val, set, ph, type }) => (
              <div key={label} style={{ marginBottom:16 }}>
                <label style={{ fontSize:11, color:'#aaa', fontWeight:700, display:'block', marginBottom:7, letterSpacing:.8 }}>{label}</label>
                <input type={type} placeholder={ph} value={val} onChange={e => set(e.target.value)} required
                  style={{ background:'rgba(255,255,255,.7)', border:'1.5px solid rgba(0,0,0,.09)', borderRadius:14, padding:'13px 16px', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, outline:'none', width:'100%', boxSizing:'border-box', color:'#111', boxShadow:'0 2px 8px rgba(0,0,0,.04)', transition:'border-color .2s' }}
                  onFocus={e => e.target.style.borderColor='#E31E24'}
                  onBlur={e => e.target.style.borderColor='rgba(0,0,0,.09)'}
                />
              </div>
            ))}
            <button type="submit" disabled={loading} style={{
              width:'100%', marginTop:8,
              background: loading ? '#ccc' : 'linear-gradient(135deg,#E31E24,#c0181e)',
              color:'#fff', border:'none', borderRadius:16, padding:'14px',
              fontSize:15, fontWeight:800, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 6px 24px rgba(227,30,36,.4)',
              transition:'all .2s',
            }}>
              {loading ? t('admin.login.submitting') : t('admin.login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
