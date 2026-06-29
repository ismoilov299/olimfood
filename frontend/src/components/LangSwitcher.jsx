import { useTranslation } from 'react-i18next'

const LANGS = ['uz', 'ru', 'en']

export default function LangSwitcher({ style = {} }) {
  const { i18n } = useTranslation()
  const cur = i18n.language?.slice(0, 2) || 'uz'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2,
      background: 'rgba(0,0,0,0.06)',
      borderRadius: 20,
      padding: '3px 4px',
      ...style,
    }}>
      {LANGS.map(lng => (
        <button
          key={lng}
          onClick={() => i18n.changeLanguage(lng)}
          style={{
            padding: '4px 9px',
            borderRadius: 16,
            border: 'none',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '.03em',
            cursor: 'pointer',
            transition: 'all .15s',
            background: cur === lng ? '#E5232B' : 'transparent',
            color: cur === lng ? '#fff' : 'inherit',
            opacity: cur === lng ? 1 : 0.5,
          }}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
