import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Car, Clock } from 'lucide-react'
import api from '@/lib/api'
import { formatDate } from '@/lib/formatters'
import { useDebounce } from '@/hooks/useDebounce'

export default function VehicleList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', debouncedSearch],
    queryFn: () => api.get('/vehicles', { params: { search: debouncedSearch || undefined, per_page: 25 } }).then(r => r.data),
  })

  const vehicles = data?.data?.data ?? []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicles</h1>
          <p className="page-subtitle">Search and manage registered vehicles</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/vehicles/new')}>
          <Plus size={16} /> Register Vehicle
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-wrap" style={{ maxWidth: 420 }}>
          <Search className="search-icon" />
          <input
            className="input"
            placeholder="Search by vehicle number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <Car size={48} />
          <h3>No vehicles found</h3>
          <p>{search ? 'Try a different search term' : 'Register your first vehicle to get started'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {vehicles.map((v: any) => (
            <div key={v.id} className="card" style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
            >
              {/* Vehicle header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: 1 }}>{v.vehicle_no}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{v.brand?.name} {v.model}</div>
                </div>
                <div style={{
                  background: 'var(--bg-elevated)', borderRadius: 8, padding: '4px 10px',
                  fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize',
                }}>{v.category}</div>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  ['Owner', v.owner?.full_name],
                  ['Contact', v.owner?.contact_no],
                  ['Fuel', v.fuel_type],
                  ['Color', v.color],
                  ['Year', v.year_of_manufacture ?? '—'],
                  ['Services', v.service_cards_count ?? 0],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
                  onClick={() => navigate('/service-cards/new', { state: { vehicleId: v.id } })}>
                  <Plus size={13} /> Service Card
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/vehicles/${v.id}/history`)}>
                  <Clock size={13} /> History
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
