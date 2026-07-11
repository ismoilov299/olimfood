import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getFeedbackList } from '../../api'

export default function Feedback() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'en' ? 'en-US' : 'uz-UZ'

  useEffect(() => {
    getFeedbackList().then(r => setList(r.data)).finally(() => setLoading(false))
  }, [])

  const avg = (key) => list.length ? (list.reduce((s, f) => s + f[key], 0) / list.length).toFixed(1) : '—'

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <h1 style={{ fontSize:24, fontWeight:900, color:'#111' }}>{t('admin.feedback.title')}</h1>
      </div>

      {!loading && list.length > 0 && (
        <div style={{ display:'flex', gap:14, marginBottom:20 }}>
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E8ECF0', padding:'14px 20px', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize:11.5, color:'#aaa', fontWeight:700, marginBottom:4 }}>{t('admin.feedback.avg_delivery')}</div>
            <div style={{ fontSize:20, fontWeight:900, color:'#111' }}>⭐ {avg('delivery_rating')}</div>
          </div>
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E8ECF0', padding:'14px 20px', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize:11.5, color:'#aaa', fontWeight:700, marginBottom:4 }}>{t('admin.feedback.avg_product')}</div>
            <div style={{ fontSize:20, fontWeight:900, color:'#111' }}>⭐ {avg('product_rating')}</div>
          </div>
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #E8ECF0', padding:'14px 20px', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize:11.5, color:'#aaa', fontWeight:700, marginBottom:4 }}>{t('admin.feedback.total_count')}</div>
            <div style={{ fontSize:20, fontWeight:900, color:'#111' }}>{list.length}</div>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gap:10 }}>
        {list.map(f => (
          <div key={f.id} style={{ background:'#fff', borderRadius:14, border:'1px solid #E8ECF0', padding:'16px 18px', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, gap:12 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:14, color:'#111' }}>{f.customer_name || '—'}</div>
                <div style={{ fontSize:11.5, color:'#aaa', marginTop:2 }}>
                  {t('admin.feedback.order_ref', { id: f.order_id })} · {new Date(f.created_at).toLocaleString(locale, { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                </div>
              </div>
              <div style={{ display:'flex', gap:16, flexShrink:0 }}>
                <Stars label={t('admin.feedback.col_delivery')} value={f.delivery_rating} />
                <Stars label={t('admin.feedback.col_product')} value={f.product_rating} />
              </div>
            </div>
            {f.comment && (
              <div style={{ background:'#F8F9FA', borderRadius:10, padding:'10px 12px', fontSize:13, color:'#333', lineHeight:1.5 }}>{f.comment}</div>
            )}
          </div>
        ))}
        {!loading && !list.length && (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#ccc' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>⭐</div>
            <div>{t('admin.feedback.no_feedback')}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Stars({ label, value }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:9.5, color:'#bbb', fontWeight:700, textTransform:'uppercase', letterSpacing:.4, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:13, color:'#F5A623', letterSpacing:1 }}>
        {'★'.repeat(value)}<span style={{ color:'#E8ECF0' }}>{'★'.repeat(5 - value)}</span>
      </div>
    </div>
  )
}
