import { useState } from 'react'

const TABS = [
  { code: 'uz',  label: 'ЎЗ' },
  { code: 'uzl', label: 'UZ' },
  { code: 'ru',  label: 'RU' },
]

// Multi-language text input: renders one input/textarea at a time with tabs
// to switch between uz (kirill, required) / uzl (lotin) / ru (rus).
// `baseKey` + `_${langCode}` must match the form field names, e.g.
// baseKey="name" -> form.name_uz / form.name_uzl / form.name_ru
export default function LangTabs({ label, baseKey, form, setForm, required, multiline, placeholder }) {
  const [tab, setTab] = useState('uz')
  const field = `${baseKey}_${tab}`
  const Comp = multiline ? 'textarea' : 'input'

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <label style={labelStyle}>{label}{required ? ' *' : ''}</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(tb => {
            const filled = !!form[`${baseKey}_${tb.code}`]
            return (
              <button key={tb.code} type="button" onClick={() => setTab(tb.code)}
                style={{
                  position: 'relative', padding: '3px 9px', borderRadius: 8, border: 'none',
                  fontSize: 10.5, fontWeight: 800, cursor: 'pointer',
                  background: tab === tb.code ? '#E31E24' : '#F0F2F5',
                  color: tab === tb.code ? '#fff' : '#888',
                }}>
                {tb.label}
                {!filled && tb.code !== 'uz' && (
                  <span style={{ position: 'absolute', top: -2, right: -2, width: 6, height: 6, borderRadius: '50%', background: '#F59E0B' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>
      <Comp placeholder={placeholder} value={form[field] || ''}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        style={multiline ? { ...lightInput, minHeight: 70, resize: 'vertical' } : lightInput} />
    </div>
  )
}

const labelStyle = { fontSize: 11.5, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5 }
const lightInput = { background: '#F5F7FA', border: '1.5px solid #E8ECF0', color: '#111', borderRadius: 10, padding: '10px 14px', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
