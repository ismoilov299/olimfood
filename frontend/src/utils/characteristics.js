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

// Used while editing — keeps every row, including ones the admin just added
// or is mid-way through typing into. Filtering here would make a freshly
// added blank row vanish immediately (it'd be stripped before ever rendering).
export function stringifyCharacteristics(rows) {
  return rows && rows.length ? JSON.stringify(rows) : ''
}

// Used only right before saving — drops rows left fully blank so we don't
// persist empty junk.
export function cleanCharacteristics(rows) {
  return (rows || []).filter(r => (r.label && r.label.trim()) || (r.value && r.value.trim()))
}
