import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem(product, qty) {
        const items = get().items
        const existing = items.find(i => i.id === product.id)
        const step = (product.unit === 'kg' || product.unit === 'gr') ? (product.step || 0.5) : 1
        // First add jumps straight to the product's minimum orderable qty (falls
        // back to step); repeat +clicks on an already-in-cart item just add a step.
        const amount = qty ?? (existing ? step : (product.min_qty || step))
        const finalPrice = product.discount > 0
          ? Math.round(product.price * (1 - product.discount / 100))
          : product.price
        if (existing) {
          set({ items: items.map(i => i.id === product.id ? { ...i, qty: Math.round((i.qty + amount)*100)/100 } : i) })
        } else {
          set({ items: [...items, { ...product, finalPrice, qty: amount }] })
        }
      },

      removeItem(id) {
        set({ items: get().items.filter(i => i.id !== id) })
      },

      decrementItem(id, step) {
        const items = get().items
        const item = items.find(i => i.id === id)
        if (!item) return
        const baseStep = (item.unit === 'kg' || item.unit === 'gr') ? (item.step || 0.5) : 1
        const dec = step ?? baseStep
        const floor = item.min_qty || baseStep
        if (item.qty - dec < floor - 1e-9) {
          set({ items: items.filter(i => i.id !== id) })
        } else {
          set({ items: items.map(i => i.id === id ? { ...i, qty: Math.round((i.qty - dec)*100)/100 } : i) })
        }
      },

      clearCart() { set({ items: [] }) },

      get totalItems() { return get().items.reduce((s, i) => s + i.qty, 0) },
      get subtotal()   { return get().items.reduce((s, i) => s + i.finalPrice * i.qty, 0) },
    }),
    { name: 'of_cart' },
  ),
)

export default useCartStore
