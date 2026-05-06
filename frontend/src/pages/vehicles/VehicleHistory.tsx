import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, History, Wrench } from 'lucide-react'
import api from '@/lib/api'
import { formatDateTime, titleCase } from '@/lib/formatters'
import { useUIStore } from '@/stores/uiStore'

export default function VehicleHistory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { openInvoiceModal } = useUIStore()

  const { data: vehicleData, isLoading: vehicleLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => api.get(`/vehicles/${id}`).then(r => r.data.data),
  })

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['vehicle-history', id],
    queryFn: () => api.get(`/vehicles/${id}/history`).then(r => r.data.data),
  })

  if (vehicleLoading || historyLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
  }

  const vehicle = vehicleData
  const serviceCards = historyData?.history ?? []

  return (
    <div style={{ maxWidth: 900 }}>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/vehicles')} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Back to Vehicles
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Service History</h1>
          <p className="page-subtitle">
            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-blue)' }}>{vehicle?.vehicle_no}</span>
            {' • '}{vehicle?.brand?.name} {vehicle?.model}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/service-cards/new')}>
          New Service Card
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {serviceCards.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <History size={48} />
            <h3>No service history</h3>
            <p>This vehicle hasn't been serviced yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Card No</th>
                <th>Service Type</th>
                <th>Mileage</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {serviceCards.map((card: any) => (
                <tr key={card.id}>
                  <td style={{ fontWeight: 600 }}>{formatDateTime(card.created_at)}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent-blue)' }}>{card.card_no}</td>
                  <td>{card.service_type?.label}</td>
                  <td>{card.mileage_at_service ? `${card.mileage_at_service} km` : '—'}</td>
                  <td>
                    <span className={`badge badge-${card.status}`}>{titleCase(card.status)}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {card.invoice && (
                        <button className="btn btn-secondary btn-sm" onClick={() => openInvoiceModal(card.id)}>
                          Invoice
                        </button>
                      )}
                      <button className="btn btn-secondary btn-icon btn-sm" onClick={() => navigate(`/service-cards/${card.id}`)}>
                        <Wrench size={14} />
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
