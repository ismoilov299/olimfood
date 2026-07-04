// Flattens a flat category list (each item has id/parent_id/order) into
// depth-first order with a `depth` field, so admin UIs can render indentation.
export function buildCategoryTree(categories) {
  const byParent = {}
  categories.forEach(c => {
    const key = c.parent_id ?? 'root'
    ;(byParent[key] ||= []).push(c)
  })
  Object.values(byParent).forEach(arr => arr.sort((a, b) => (a.order || 0) - (b.order || 0)))

  const walk = (parentId, depth) => {
    const key = parentId ?? 'root'
    return (byParent[key] || []).flatMap(c => [{ ...c, depth }, ...walk(c.id, depth + 1)])
  }
  return walk(null, 0)
}

// Removes a category and its whole subtree from a depth-annotated flat list
// (as produced by buildCategoryTree) — used so a category can't be set as
// its own parent when editing.
export function excludeSubtree(flatWithDepth, excludeId) {
  if (excludeId == null) return flatWithDepth
  const result = []
  let skipDepth = null
  for (const c of flatWithDepth) {
    if (skipDepth !== null) {
      if (c.depth > skipDepth) continue
      skipDepth = null
    }
    if (c.id === excludeId) { skipDepth = c.depth; continue }
    result.push(c)
  }
  return result
}
