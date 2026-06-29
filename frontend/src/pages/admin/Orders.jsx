import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getOrders, updateOrderStatus, deleteOrder } from '../../api'

const STATUS_COLORS = {
  new:        { color:'#3B82F6', icon:'🆕' },
  confirmed:  { color:'#8B5CF6', icon:'✅' },
  preparing:  { color:'#F59E0B', icon:'👨‍🍳' },
  delivering: { color:'#06B6D4', icon:'🚗' },
  delivered:  { color:'#22C55E', icon:'✅' },
  cancelled:  { color:'#EF4444', icon:'❌' },
}
const PER = 15

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')
  const [page,   setPage]   = useState(1)
  const [detail, setDetail] = useState(null)
  const [toast,  setToast]  = useState('')
  const { t, i18n } = useTranslation()

  const locale = i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'en' ? 'en-US' : 'uz-UZ'

  const STATUS_CONFIG = Object.fromEntries(
    Object.entries(STATUS_COLORS).map(([k, v]) => [k, { ...v, label: t(`status.${k}`) }])
  )

  const fmt = (n) => n?.toLocaleString() + ' ' + t('common.currency')

  const load = () => getOrders(filter ? { status:filter } : {}).then(r => setOrders(r.data))
  useEffect(() => { load() }, [filter])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const handleStatus = async (id, status) => {
    await updateOrderStatus(id, status); showToast(t('admin.orders.toast_status')); load()
  }
  const handleDelete = async (id) => {
    if (!confirm(t('admin.orders.confirm_delete'))) return
    await deleteOrder(id); showToast(t('admin.orders.toast_deleted')); load(); setDetail(null)
  }

  const pages     = Math.ceil(orders.length / PER)
  const paginated = orders.slice((page-1)*PER, page*PER)

  return (
    <div>
      {toast && <Toast msg={toast} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <h1 style={{ fontSize:24, fontWeight:900, color:'#111' }}>{t('admin.orders.title')}</h1>
        <button onClick={load} style={{ background:'#F5F7FA', color:'#555', border:'1.5px solid #E8ECF0', borderRadius:10, padding:'8px 16px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
          {t('admin.orders.refresh')}
        </button>
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
        {[['', t('admin.orders.all_filter')], ...Object.entries(STATUS_CONFIG).map(([k,v]) => [k, v.icon+' '+v.label])].map(([k,l]) => (
          <button key={k} onClick={() => { setFilter(k); setPage(1) }} style={{
            padding:'7px 14px', borderRadius:20, border:'none', cursor:'pointer',
            background: filter===k ? '#E31E24' : '#fff',
            color: filter===k ? '#fff' : '#666',
            border: filter===k ? 'none' : '1.5px solid #E8ECF0',
            fontSize:13, fontWeight:700, whiteSpace:'nowrap',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E8ECF0', overflowX:'auto', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
          <thead>
            <tr style={{ color:'#999', fontSize:12, background:'#FAFAFA' }}>
              {[t('admin.orders.col_id'), t('admin.orders.col_customer'), t('admin.orders.col_phone'), t('admin.orders.col_total'), t('admin.orders.col_status'), t('admin.orders.col_date'), ''].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, borderBottom:'1px solid #F0F2F5' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map(o => {
              const st = STATUS_CONFIG[o.status] || { label:o.status, color:'#888', icon:'?' }
              return (
                <tr key={o.id} style={{ borderTop:'1px solid #F5F5F5', cursor:'pointer' }} onClick={() => setDetail(o)}>
                  <td style={{ padding:'12px 16px', color:'#aaa', fontWeight:700 }}>#{o.id}</td>
                  <td style={{ padding:'12px 16px', fontWeight:700, color:'#111' }}>{o.name}</td>
                  <td style={{ padding:'12px 16px', color:'#666' }}>{o.phone}</td>
                  <td style={{ padding:'12px 16px', color:'#E31E24', fontWeight:800 }}>{fmt(o.total)}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <select value={o.status} onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); handleStatus(o.id, e.target.value) }}
                      style={{ background:st.color+'15', border:`1.5px solid ${st.color}44`, color:st.color, borderRadius:20, padding:'4px 10px', fontSize:11.5, fontWeight:800, width:'auto', cursor:'pointer', outline:'none' }}>
                      {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding:'12px 16px', color:'#aaa', fontSize:12 }}>
                    {new Date(o.created_at).toLocaleString(locale, { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <button onClick={e => { e.stopPropagation(); handleDelete(o.id) }}
                      style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', color:'#EF4444', borderRadius:8, padding:'5px 9px', fontSize:13, cursor:'pointer' }}>🗑️</button>
                  </td>
                </tr>
              )
            })}
            {!paginated.length && (
              <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'#ccc' }}>{t('admin.orders.no_orders')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:16 }}>
          {Array.from({ length:pages }, (_,i) => i+1).map(n => (
            <button key={n} onClick={() => setPage(n)} style={{ width:34, height:34, borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', background: n===page ? '#E31E24' : '#fff', color: n===page ? '#fff' : '#666', border: n===page ? 'none' : '1.5px solid #E8ECF0' }}>{n}</button>
          ))}
        </div>
      )}

      {detail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, border:'1px solid #E8ECF0', padding:'28px', width:'100%', maxWidth:460, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.12)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ fontWeight:900, fontSize:18, color:'#111' }}>{t('admin.orders.detail_title', { id: detail.id })}</div>
              <button onClick={() => setDetail(null)} style={{ background:'none', border:'none', color:'#aaa', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>
            {[
              [t('admin.orders.detail_customer'), detail.name],
              [t('admin.orders.detail_phone'),    detail.phone],
              [t('admin.orders.detail_address'),  detail.address],
              detail.note && [t('admin.orders.detail_note'), detail.note],
              [t('admin.orders.detail_payment'),  detail.payment],
              [t('admin.orders.detail_status'),   STATUS_CONFIG[detail.status]?.label || detail.status],
              [t('admin.orders.detail_time'),     new Date(detail.created_at).toLocaleString(locale)],
            ].filter(Boolean).map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:10, fontSize:13.5 }}>
                <span style={{ color:'#aaa' }}>{k}</span>
                <span style={{ color:'#111', fontWeight:600, textAlign:'right', maxWidth:'60%' }}>{v}</span>
              </div>
            ))}
            <div style={{ background:'#F8F9FA', borderRadius:12, padding:'14px', marginTop:16 }}>
              <div style={{ fontSize:11.5, fontWeight:800, color:'#aaa', marginBottom:10, textTransform:'uppercase', letterSpacing:.5 }}>{t('admin.orders.detail_products')}</div>
              {(detail.items||[]).map((item,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6, fontSize:13 }}>
                  <span style={{ color:'#333' }}>{item.name} × {item.qty}</span>
                  <span style={{ color:'#E31E24', fontWeight:700 }}>{fmt(item.price*item.qty)}</span>
                </div>
              ))}
              <div style={{ borderTop:'1px solid #E8ECF0', paddingTop:10, marginTop:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#aaa', marginBottom:4 }}><span>{t('admin.orders.detail_subtotal')}</span><span>{fmt(detail.subtotal)}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#aaa', marginBottom:8 }}><span>{t('admin.orders.detail_delivery')}</span><span>{fmt(detail.delivery)}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:900 }}><span style={{ color:'#111' }}>{t('admin.orders.detail_total')}</span><span style={{ color:'#E31E24' }}>{fmt(detail.total)}</span></div>
              </div>
            </div>
            <div style={{ marginTop:16 }}>
              <label style={{ fontSize:11.5, color:'#aaa', fontWeight:700, textTransform:'uppercase', letterSpacing:.5, display:'block', marginBottom:8 }}>{t('admin.orders.change_status')}</label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {Object.entries(STATUS_CONFIG).map(([k,v]) => (
                  <button key={k} onClick={() => { handleStatus(detail.id, k); setDetail(o => ({...o, status:k})) }}
                    style={{ padding:'6px 12px', borderRadius:20, border:'none', cursor:'pointer', background: detail.status===k ? v.color : v.color+'18', color: detail.status===k ? '#fff' : v.color, fontSize:11.5, fontWeight:700 }}>
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => handleDelete(detail.id)}
              style={{ width:'100%', marginTop:16, background:'rgba(239,68,68,.06)', border:'1.5px solid rgba(239,68,68,.2)', color:'#EF4444', borderRadius:12, padding:'10px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {t('admin.orders.delete_btn')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Toast({ msg }) {
  return <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:'#fff', border:'1px solid #E8ECF0', color:'#111', padding:'10px 20px', borderRadius:12, fontSize:13, fontWeight:700, boxShadow:'0 8px 32px rgba(0,0,0,.12)' }}>{msg}</div>
}
