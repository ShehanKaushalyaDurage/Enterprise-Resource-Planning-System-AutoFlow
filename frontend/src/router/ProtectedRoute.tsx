import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { Permission } from '@/lib/permissions'
import { hasPermission } from '@/lib/permissions'

interface ProtectedRouteProps {
  permission?: Permission
}

export default function ProtectedRoute({ permission }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (permission && !hasPermission(user.role, permission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Access Denied</h1>
        <p style={{ color: 'var(--text-muted)' }}>You don't have permission to view this page.</p>
      </div>
    )
  }

  return <Outlet />
}
