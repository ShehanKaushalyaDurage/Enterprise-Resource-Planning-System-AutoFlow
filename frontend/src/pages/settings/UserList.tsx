import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Users } from 'lucide-react'
import api from '@/lib/api'
import { titleCase } from '@/lib/formatters'
import { useDebounce } from '@/hooks/useDebounce'

export default function UserList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['users', debouncedSearch],
    queryFn: () => api.get('/users', { params: { search: debouncedSearch, per_page: 50 } }).then(r => r.data.data),
  })

  const users = data?.data ?? []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system access and staff roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/settings/users/new')}>
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-wrap" style={{ maxWidth: 420 }}>
          <Search className="search-icon" />
          <input
            className="input"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <Users size={48} />
            <h3>No users found</h3>
            <p>Add a new user to grant system access.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || '—'}</td>
                  <td><span className="badge">{titleCase(user.role)}</span></td>
                  <td>
                    <span className={`badge badge-${user.is_active ? 'success' : 'secondary'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/settings/users/${user.id}/edit`)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
