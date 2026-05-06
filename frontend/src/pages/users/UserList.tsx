import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Trash2, Key, ToggleLeft, ToggleRight, UserCog, Mail, Calendar, Phone } from 'lucide-react'
import api from '@/lib/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useUIStore } from '@/stores/uiStore'
import { titleCase } from '@/lib/formatters'
import UserForm from './UserForm'

export default function UserList() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['users', debouncedSearch, roleFilter, statusFilter],
    queryFn: () => api.get('/users', {
      params: { search: debouncedSearch, role: roleFilter, status: statusFilter }
    }).then(r => r.data.data),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (user: any) => api.patch(`/users/${user.id}/toggle-active`),
    onSuccess: () => {
      addToast('success', 'User status toggled successfully.')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message || 'Action failed.')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      addToast('success', 'User deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message || 'Delete failed.')
    }
  })

  const users = data?.data ?? []

  const handleEdit = (user: any) => {
    setEditingUser(user)
    setDrawerOpen(true)
  }

  const handleAdd = () => {
    setEditingUser(null)
    setDrawerOpen(true)
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Add, manage, and audit all system users</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={18} style={{ marginRight: 6 }} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card-elevated" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="search-wrap">
          <Search className="search-icon" />
          <input
            className="input"
            placeholder="Search by name, email, or employee ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select className="select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="receptionist">Receptionist</option>
            <option value="technician">Technician</option>
            <option value="cashier">Cashier</option>
          </select>
        </div>
        <div>
          <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <UserCog size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <h3>No users found</h3>
            <p>Try clearing your filters or create a new user profile.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name & Email</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Joined</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{u.employee_id || '—'}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ textTransform: 'capitalize' }}>{titleCase(u.role)}</span>
                  </td>
                  <td>
                    {u.phone || '—'}
                  </td>
                  <td>
                    {u.joined_date || '—'}
                  </td>
                  <td>
                    <span className={`badge badge-${u.is_active ? 'success' : 'secondary'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-icon" onClick={() => handleEdit(u)} title="Edit">
                        <UserCog size={16} />
                      </button>
                      <button className="btn btn-secondary btn-icon" onClick={() => toggleActiveMutation.mutate(u)} title="Toggle Active Status">
                        {u.is_active ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                      </button>
                      <button className="btn btn-danger btn-icon" onClick={() => { if (confirm('Are you sure you want to delete this user?')) deleteMutation.mutate(u.id) }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawerOpen && (
        <UserForm
          user={editingUser}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  )
}
