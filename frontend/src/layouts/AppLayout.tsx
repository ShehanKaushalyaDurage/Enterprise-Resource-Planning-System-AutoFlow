import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import api from '@/lib/api'
import { hasPermission } from '@/lib/permissions'
import {
  LayoutDashboard, Car, ClipboardList, Receipt, Package,
  Truck, Wallet, Users, Settings, LogOut, Bell, Wrench, ChevronRight, X, FileText
} from 'lucide-react'
import InvoiceModal from '@/pages/invoices/InvoiceModal'

interface NavItemDef {
  label: string
  to: string
  icon: React.ReactNode
  permission?: Parameters<typeof hasPermission>[1]
}

const NAV_ITEMS: NavItemDef[] = [
  { label: 'Dashboard',     to: '/dashboard',      icon: <LayoutDashboard size={18} />, permission: 'dashboard.view' },
  { label: 'Vehicles',      to: '/vehicles',       icon: <Car size={18} />,             permission: 'vehicle.view' },
  { label: 'Service Cards', to: '/service-cards',  icon: <ClipboardList size={18} />,   permission: 'service_card.view' },
  { label: 'Invoices',      to: '/invoices',       icon: <Receipt size={18} />,          permission: 'invoice.view' },
  { label: 'Stock Sales',   to: '/stock-sales',    icon: <ClipboardList size={18} /> },
  { label: 'Stock',         to: '/stock',          icon: <Package size={18} />,          permission: 'stock.view' },
  { label: 'GRN',           to: '/grn',            icon: <Truck size={18} />,            permission: 'grn.view' },
  { label: 'Finance',       to: '/finance',        icon: <Wallet size={18} /> },
  { label: 'Expenses',      to: '/expenses',       icon: <FileText size={18} /> },
  { label: 'Petty Cash',    to: '/petty-cash',     icon: <Wallet size={18} />,           permission: 'petty_cash.view' },
  { label: 'Technicians',   to: '/technicians',    icon: <Wrench size={18} /> },
  { label: 'My Tasks',      to: '/my-tasks',       icon: <Wrench size={18} />,           permission: 'service_card.update_status' },
  { label: 'Users',         to: '/users',          icon: <Users size={18} /> },
  { label: 'Vehicle Brands',to: '/settings/vehicle-brands', icon: <Car size={18} />,        permission: 'settings.manage' },
  { label: 'Settings',      to: '/settings',       icon: <Settings size={18} />,         permission: 'settings.manage' },
]

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const { toasts, removeToast, invoiceModalOpen, invoiceModalServiceCardId, closeInvoiceModal } = useUIStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {})
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#fff',
            }}>A</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>AutoFlow</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Service Management</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.filter(item => !item.permission || hasPermission(user?.role, item.permission!)).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
            }}>{user?.name[0]?.toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Bar */}
        <header style={{
          height: 56, borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, flexShrink: 0,
        }}>
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary btn-icon" onClick={() => navigate('/stock/alerts')}>
            <Bell size={18} />
          </button>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Invoice Modal */}
      {invoiceModalOpen && invoiceModalServiceCardId && (
        <InvoiceModal
          serviceCardId={invoiceModalServiceCardId}
          onClose={closeInvoiceModal}
        />
      )}

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 2 }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
