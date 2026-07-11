import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem(product, qty = ((product.unit === 'kg' || product.unit === 'gr') ? (product.step || 0.5) : 1)) {
        const items = get().items
        const existing = items.find(i => i.id === product.id)
        const finalPrice = product.discount > 0
          ? Math.round(product.price * (1 - product.discount / 100))
          : product.price
        if (existing) {
          set({ items: items.map(i => i.id === product.id ? { ...i, qty: Math.round((i.qty + qty)*100)/100 } : i) })
        } else {
          set({ items: [...items, { ...product, finalPrice, qty }] })
        }
      },

      removeItem(id) {
        set({ items: get().items.filter(i => i.id !== id) })
      },

      decrementItem(id, step) {
        const items = get().items
        const item = items.find(i => i.id === id)
        if (!item) return
        const dec = step ?? ((item.unit === 'kg' || item.unit === 'gr') ? (item.step || 0.5) : 1)
        if (item.qty <= dec) {
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
