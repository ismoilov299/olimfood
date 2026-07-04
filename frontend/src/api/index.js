import api from './client'

// ── Auth ───────────────────────────────────────────
export const login = (username, password) =>
  api.post('/auth/login', { username, password })

export const changePassword = (old_password, new_password) =>
  api.post('/auth/change-password', { old_password, new_password })

export const getMe = () => api.get('/auth/me')

// ── Categories ─────────────────────────────────────
export const getCategories = (lang) => api.get('/categories', { params: { lang } })
export const createCategory = (data) => api.post('/categories', data)
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data)
export const deleteCategory = (id) => api.delete(`/categories/${id}`)

// ── Products ───────────────────────────────────────
export const getProducts = (params) => api.get('/products', { params })
export const getProduct = (id) => api.get(`/products/${id}`)
export const createProduct = (data) => api.post('/products', data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/products/${id}`)

// ── Banners ────────────────────────────────────────
export const getBanners = () => api.get('/banners')
export const createBanner = (data) => api.post('/banners', data)
export const updateBanner = (id, data) => api.put(`/banners/${id}`, data)
export const deleteBanner = (id) => api.delete(`/banners/${id}`)

// ── Orders ─────────────────────────────────────────
export const getOrders = (params) => api.get('/orders', { params })
export const getOrder = (id) => api.get(`/orders/${id}`)
export const createOrder = (data) => api.post('/orders', data)
export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status })
export const deleteOrder = (id) => api.delete(`/orders/${id}`)

// ── Stats ──────────────────────────────────────────
export const getStats = () => api.get('/stats')

// ── Settings ───────────────────────────────────────
export const getSetting = (key) => api.get(`/settings/${key}`)
export const setSetting = (key, value) => api.put(`/settings/${key}`, { value })

// ── Upload ─────────────────────────────────────────
export const uploadImage = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}
