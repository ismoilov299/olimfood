// A certificate assigned to a category applies to every product in that
// category AND any of its subcategories — so to resolve which certificates
// show on a product, walk from the product's own category up through its
// parent chain and match against each certificate's linked category_ids.

function categoryAncestorChain(categories, catId) {
  const byId = new Map(categories.map(c => [c.id, c]))
  const chain = []
  let cur = catId
  while (cur != null && byId.has(cur) && !chain.includes(cur)) {
    chain.push(cur)
    cur = byId.get(cur).parent_id
  }
  return chain
}

export function certificatesForCategory(certificates, categories, catId) {
  if (!catId) return []
  const chain = categoryAncestorChain(categories, catId)
  return certificates.filter(cert => cert.category_ids?.some(id => chain.includes(id)))
}
