import { Outlet } from 'react-router-dom'

export default function CustomerLayout() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', position: 'relative' }}>
      <Outlet />
    </div>
  )
}
