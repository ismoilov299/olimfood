import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'uz',  label: 'ЎЗ' },
  { code: 'uzl', label: 'UZ' },
  { code: 'ru',  label: 'RU' },
]

export default function LangSwitcher({ style = {} }) {
  const { i18n } = useTranslation()
  const cur = i18n.language || 'uz'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2,
      background: 'rgba(0,0,0,0.06)',
      borderRadius: 20,
      padding: '3px 4px',
      ...style,
    }}>
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          style={{
            padding: '4px 9px',
            borderRadius: 16,
            border: 'none',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '.03em',
            cursor: 'pointer',
            transition: 'all .15s',
            background: cur === code ? '#E5232B' : 'transparent',
            color: cur === code ? '#fff' : 'inherit',
            opacity: cur === code ? 1 : 0.5,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
