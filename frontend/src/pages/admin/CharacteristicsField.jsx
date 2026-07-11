import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { parseCharacteristics, stringifyCharacteristics } from '../../utils/characteristics'

const TABS = [
  { code: 'uz',  label: 'ЎЗ' },
  { code: 'uzl', label: 'UZ' },
  { code: 'ru',  label: 'RU' },
]

// Editable list of label/value spec rows (e.g. "Қобиқ диаметри: Ø 32 мм") —
// per-language, stored as JSON in form.characteristics_{lang}. Rows can be
// added, edited or removed individually.
export default function CharacteristicsField({ form, setForm }) {
  const [tab, setTab] = useState('uz')
  const { t } = useTranslation()
  const field = `characteristics_${tab}`
  const rows = parseCharacteristics(form[field])

  const commit = (next) => setForm(f => ({ ...f, [field]: stringifyCharacteristics(next) }))
  const updateRow = (i, key, val) => commit(rows.map((r, idx) => idx === i ? { ...r, [key]: val } : r))
  const addRow    = () => commit([...rows, { label: '', value: '' }])
  const removeRow = (i) => commit(rows.filter((_, idx) => idx !== i))

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <label style={labelStyle}>{t('admin.products.field_characteristics')}</label>
        <div style={{ display: 'flex', gap: 4 }}>
          {TABS.map(tb => {
            const filled = parseCharacteristics(form[`characteristics_${tb.code}`])
              .some(r => (r.label && r.label.trim()) || (r.value && r.value.trim()))
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 6 }}>
            <input value={row.label} placeholder={t('admin.products.characteristic_label_ph')}
              onChange={e => updateRow(i, 'label', e.target.value)}
              style={{ ...lightInput, flex: '0 0 40%' }} />
            <input value={row.value} placeholder={t('admin.products.characteristic_value_ph')}
              onChange={e => updateRow(i, 'value', e.target.value)}
              style={{ ...lightInput, flex: 1 }} />
            <button type="button" onClick={() => removeRow(i)} title={t('common.delete')}
              style={{ flexShrink: 0, width: 36, border: '1.5px solid #E8ECF0', background: '#fff', color: '#EF4444', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={addRow}
          style={{ alignSelf: 'flex-start', background: 'rgba(227,30,36,.06)', border: '1.5px dashed rgba(227,30,36,.35)', color: '#E31E24', borderRadius: 10, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
          + {t('admin.products.add_characteristic')}
        </button>
      </div>
    </div>
  )
}

const labelStyle = { fontSize: 11.5, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5 }
const lightInput = { background: '#F5F7FA', border: '1.5px solid #E8ECF0', color: '#111', borderRadius: 10, padding: '10px 14px', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
