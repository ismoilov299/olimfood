import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import CustomerLayout from './layouts/CustomerLayout'
import AdminLayout from './layouts/AdminLayout'
import Home from './pages/Home'
import Feedback from './pages/Feedback'
import AdminLogin from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Products from './pages/admin/Products'
import Categories from './pages/admin/Categories'
import Certificates from './pages/admin/Certificates'
import Banners from './pages/admin/Banners'
import Orders from './pages/admin/Orders'
import AdminFeedback from './pages/admin/Feedback'
import Promos from './pages/admin/Promos'
import Settings from './pages/admin/Settings'

function RequireAuth({ children }) {
  const token = localStorage.getItem('of_token')
  return token ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/feedback/:orderId" element={<Feedback />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="products"   element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="banners"    element={<Banners />} />
          <Route path="orders"     element={<Orders />} />
          <Route path="feedback"   element={<AdminFeedback />} />
          <Route path="promos"     element={<Promos />} />
          <Route path="settings"   element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
