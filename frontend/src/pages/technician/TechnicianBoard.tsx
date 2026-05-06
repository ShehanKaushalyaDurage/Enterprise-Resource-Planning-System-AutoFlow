import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Wrench, Clock, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/formatters'

export default function TechnicianBoard() {
  const navigate = useNavigate()

  // For the technician board, we fetch service cards that are either pending or in_progress.
  // Realistically we'd filter by the assigned technician ID if logged in as a technician.
  const { data, isLoading } = useQuery({
    queryKey: ['service-cards', 'active'],
    queryFn: () => api.get('/service-cards', { params: { per_page: 50 } }).then(r => r.data.data),
  })

  const cards = (data?.data ?? []).filter((c: any) => c.status !== 'completed' && c.status !== 'cancelled')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Technician Board</h1>
          <p className="page-subtitle">Active and pending service tasks</p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : cards.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={48} style={{ color: 'var(--success)' }} />
          <h3>All caught up!</h3>
          <p>There are no pending service tasks right now.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {cards.map((card: any) => (
            <div 
              key={card.id} 
              className="card" 
              style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => navigate(`/service-cards/${card.id}`)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 4 }}>
                    {card.card_no}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDateTime(card.created_at)}</div>
                </div>
                {card.status === 'pending' ? (
                  <span className="badge badge-pending"><Clock size={12} style={{ marginRight: 4 }}/> Pending</span>
                ) : (
                  <span className="badge badge-in-progress"><Wrench size={12} style={{ marginRight: 4 }}/> In Progress</span>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{card.vehicle?.vehicle_no}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{card.vehicle?.brand?.name} {card.vehicle?.model}</div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 6, fontSize: 13 }}>
                <div style={{ marginBottom: 4 }}><strong>Service:</strong> {card.service_type?.label}</div>
                {card.technician && (
                  <div><strong>Tech:</strong> {card.technician.name}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
