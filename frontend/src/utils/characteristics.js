// Product "characteristics" are stored as a JSON-encoded array of
// { label, value } rows inside the characteristics_uz / _uzl / _ru text
// columns — lets admins add/remove/rename individual spec rows instead of
// editing one freeform paragraph.

export function parseCharacteristics(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .filter(row => row && typeof row === 'object')
        .map(row => ({ label: row.label || '', value: row.value || '' }))
    }
  } catch { /* legacy plain-text value saved before this format existed */ }
  return [{ label: '', value: String(raw) }]
}

export function stringifyCharacteristics(rows) {
  const cleaned = (rows || []).filter(r => (r.label && r.label.trim()) || (r.value && r.value.trim()))
  return cleaned.length ? JSON.stringify(cleaned) : ''
}
