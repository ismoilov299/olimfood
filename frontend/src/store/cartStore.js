import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem(product) {
        const items = get().items
        const existing = items.find(i => i.id === product.id)
        const finalPrice = product.discount > 0
          ? Math.round(product.price * (1 - product.discount / 100))
          : product.price
        if (existing) {
          set({ items: items.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) })
        } else {
          set({ items: [...items, { ...product, finalPrice, qty: 1 }] })
        }
      },

      removeItem(id) {
        set({ items: get().items.filter(i => i.id !== id) })
      },

      decrementItem(id) {
        const items = get().items
        const item = items.find(i => i.id === id)
        if (!item) return
        if (item.qty <= 1) {
          set({ items: items.filter(i => i.id !== id) })
        } else {
          set({ items: items.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i) })
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
