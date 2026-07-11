import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getFeedbackContext, submitFeedback } from '../api'

const T = {
  bg: '#0D0D0F', surface: '#17181B', fg: '#FFFFFF', muted: '#A7A7A7',
  line: '#2A2A2A', red: '#E30613', star: '#F5A623',
}
const INTER   = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
const MANROPE = "'Manrope', sans-serif"

function StarRating({ value, onChange, readOnly, size = 34 }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" disabled={readOnly} onClick={() => onChange?.(n)}
          style={{ background: 'none', border: 'none', padding: 0, lineHeight: 0, cursor: readOnly ? 'default' : 'pointer' }}>
          <svg width={size} height={size} viewBox="0 0 24 24" fill={n <= value ? T.star : 'none'} stroke={n <= value ? T.star : '#4A4A4A'} strokeWidth="1.5" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

export default function Feedback() {
  const { orderId } = useParams()
  const { t } = useTranslation()
  const [state, setState]   = useState('loading')   // loading | form | done | not_delivered | error
  const [delivery, setDelivery] = useState(0)
  const [product,  setProduct]  = useState(0)
  const [comment,  setComment]  = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [existing, setExisting] = useState(null)

  useEffect(() => {
    const wa = window.Telegram?.WebApp
    if (!wa) return
    wa.ready()
    wa.expand()
  }, [])

  useEffect(() => {
    getFeedbackContext(orderId)
      .then(({ data }) => {
        if (data.feedback) { setExisting(data.feedback); setState('done') }
        else if (data.status !== 'delivered') { setState('not_delivered') }
        else { setState('form') }
      })
      .catch(() => setState('error'))
  }, [orderId])

  const handleSubmit = async () => {
    if (!delivery || !product) return
    setSubmitting(true)
    try {
      await submitFeedback(orderId, { delivery_rating: delivery, product_rating: product, comment })
      setState('done')
      setExisting({ delivery_rating: delivery, product_rating: product, comment })
    } catch {
      setState('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: T.bg, color: T.fg, fontFamily: MANROPE, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '54px 20px 40px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 22, marginBottom: 6, textAlign: 'center' }}>{t('feedback.title')}</div>
        <div style={{ fontSize: 13.5, color: T.muted, textAlign: 'center', marginBottom: 30 }}>{t('feedback.order_label', { id: orderId })}</div>

        {state === 'loading' && (
          <div style={{ textAlign: 'center', color: T.muted, padding: '40px 0' }}>{t('common.loading')}</div>
        )}

        {state === 'error' && (
          <div style={{ textAlign: 'center', color: T.muted, padding: '40px 0', fontSize: 14, lineHeight: 1.6 }}>{t('feedback.error')}</div>
        )}

        {state === 'not_delivered' && (
          <div style={{ textAlign: 'center', color: T.muted, padding: '40px 0', fontSize: 14, lineHeight: 1.6 }}>{t('feedback.not_delivered')}</div>
        )}

        {state === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🙏</div>
            <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 17, marginBottom: 22 }}>{t('feedback.thanks')}</div>
            {existing && (
              <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 18, padding: 20, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: T.muted }}>{t('feedback.delivery_label')}</span>
                  <StarRating value={existing.delivery_rating} readOnly size={20} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: T.muted }}>{t('feedback.product_label')}</span>
                  <StarRating value={existing.product_rating} readOnly size={20} />
                </div>
                {existing.comment && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.line}`, fontSize: 13.5, color: T.fg, lineHeight: 1.6 }}>{existing.comment}</div>
                )}
              </div>
            )}
          </div>
        )}

        {state === 'form' && (
          <div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 18, padding: 20, marginBottom: 14 }}>
              <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{t('feedback.delivery_label')}</div>
              <StarRating value={delivery} onChange={setDelivery} />
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 18, padding: 20, marginBottom: 14 }}>
              <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{t('feedback.product_label')}</div>
              <StarRating value={product} onChange={setProduct} />
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 18, padding: 20, marginBottom: 22 }}>
              <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{t('feedback.comment_label')}</div>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder={t('feedback.comment_placeholder')} rows={4}
                style={{ width: '100%', background: 'transparent', border: `1px solid ${T.line}`, borderRadius: 12, padding: 12, color: T.fg, fontFamily: MANROPE, fontSize: 13.5, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleSubmit} disabled={!delivery || !product || submitting}
              style={{ width: '100%', background: (!delivery || !product || submitting) ? '#3A3A3A' : T.red, color: '#fff', border: 'none', borderRadius: 16, padding: 15, fontFamily: MANROPE, fontWeight: 700, fontSize: 15, cursor: (!delivery || !product || submitting) ? 'not-allowed' : 'pointer' }}>
              {submitting ? t('common.loading') : t('feedback.submit_btn')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
