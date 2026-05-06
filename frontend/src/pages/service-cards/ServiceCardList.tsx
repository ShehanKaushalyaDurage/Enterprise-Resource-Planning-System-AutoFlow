import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Eye, FileText } from 'lucide-react'
import api from '@/lib/api'
import { formatDateTime, titleCase } from '@/lib/formatters'
import { useDebounce } from '@/hooks/useDebounce'
import { useUIStore } from '@/stores/uiStore'

export default function ServiceCardList() {
  const navigate = useNavigate()
  const { openInvoiceModal } = useUIStore()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['service-cards', debouncedSearch],
    queryFn: () => api.get('/service-cards', { params: { search: debouncedSearch, per_page: 25 } }).then(r => r.data.data),
  })

  const cards = data?.data ?? []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Service Cards</h1>
          <p className="page-subtitle">Manage all vehicle service tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/service-cards/new')}>
          <Plus size={16} /> New Service Card
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-wrap" style={{ maxWidth: 420 }}>
          <Search className="search-icon" />
          <input
            className="input"
            placeholder="Search by card number or vehicle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : cards.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <FileText size={48} />
            <h3>No service cards found</h3>
            <p>Create a new service card to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Card No</th>
                <th>Vehicle</th>
                <th>Owner</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card: any) => (
                <tr key={card.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-blue)' }}>{card.card_no}</td>
                  <td style={{ fontWeight: 600 }}>{card.vehicle?.vehicle_no}</td>
                  <td>{card.owner?.full_name}</td>
                  <td>{card.service_type?.label}</td>
                  <td>
                    <span className={`badge badge-${card.status.replace('_', '-')}`}>{titleCase(card.status)}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatDateTime(card.created_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {card.invoice && (
                        <button className="btn btn-secondary btn-icon btn-sm" title="View Invoice" onClick={() => openInvoiceModal(card.id)}>
                          <FileText size={14} />
                        </button>
                      )}
                      <button className="btn btn-secondary btn-icon btn-sm" title="View Detail" onClick={() => navigate(`/service-cards/${card.id}`)}>
                        <Eye size={14} />
                      </button>
                    </div>
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
