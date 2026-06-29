import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as api from '../api'

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      admin: null,

      async loginAction(username, password) {
        const res = await api.login(username, password)
        const token = res.data.access_token
        localStorage.setItem('of_token', token)
        set({ token })
        const me = await api.getMe()
        set({ admin: me.data })
        return me.data
      },

      logout() {
        localStorage.removeItem('of_token')
        set({ token: null, admin: null })
      },

      isAuthenticated() {
        return !!localStorage.getItem('of_token')
      },
    }),
    { name: 'of_auth', partialize: state => ({ token: state.token, admin: state.admin }) },
  ),
)

export default useAuthStore
