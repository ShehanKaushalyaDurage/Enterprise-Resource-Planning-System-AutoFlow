import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Printer, Wrench, CheckCircle, Clock } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDateTime, titleCase } from '@/lib/formatters'
import { useUIStore } from '@/stores/uiStore'

export default function ServiceCardDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { openInvoiceModal, addToast } = useUIStore()
  const queryClient = useQueryClient()

  const { data: card, isLoading } = useQuery({
    queryKey: ['service-card', id],
    queryFn: () => api.get(`/service-cards/${id}`).then(r => r.data.data),
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/service-cards/${id}/status`, { status }),
    onSuccess: () => {
      addToast('success', 'Status updated successfully')
      queryClient.invalidateQueries({ queryKey: ['service-card', id] })
    },
    onError: (err: any) => addToast('error', err.response?.data?.message || 'Failed to update status'),
  })

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
  }

  if (!card) {
    return <div className="empty-state">Service card not found</div>
  }

  const handlePrint = () => {
    window.open(`/api/v1/reports/service-card/${card.id}`, '_blank')
  }

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/service-cards')} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Back to List
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Service Card: {card.card_no}</h1>
          <p className="page-subtitle">Created on {formatDateTime(card.created_at)}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print Card
          </button>
          {card.invoice && (
            <button className="btn btn-primary" onClick={() => openInvoiceModal(card.id)}>
              View Invoice
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Main Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status Tracker */}
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {['pending', 'in_progress', 'completed'].map((status, idx) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <button
                    className={`btn ${card.status === status ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => updateStatusMutation.mutate(status)}
                    disabled={updateStatusMutation.isPending}
                  >
                    {status === 'pending' && <Clock size={16} />}
                    {status === 'in_progress' && <Wrench size={16} />}
                    {status === 'completed' && <CheckCircle size={16} />}
                    {titleCase(status)}
                  </button>
                  {idx < 2 && <div style={{ height: 2, background: 'var(--border)', width: 30 }} />}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Items</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(card.items ?? []).map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td><span className="badge">{item.item_type}</span></td>
                    <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Inspection Notes</div>
              <p style={{ fontSize: 14 }}>{card.inspection_notes || '—'}</p>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Remarks</div>
              <p style={{ fontSize: 14 }}>{card.remarks || '—'}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Vehicle & Owner</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vehicle No</div>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-blue)', fontSize: 16 }}>{card.vehicle?.vehicle_no}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Model</div>
                <div>{card.vehicle?.brand?.name} {card.vehicle?.model}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Owner</div>
                <div>{card.owner?.full_name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{card.owner?.contact_no}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Service Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Service Type</div>
                <div>{card.service_type?.label}</div>
              </div>
              {card.oil_type && (
                <>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Oil Type</div>
                    <div>{card.oil_type.brand} ({card.oil_type.viscosity_grade})</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Oil Quantity</div>
                    <div>{card.oil_quantity_liters} L</div>
                  </div>
                </>
              )}
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mileage</div>
                <div>{card.mileage_at_service ? `${card.mileage_at_service} km` : '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Technician</div>
                <div>{card.technician?.name || 'Unassigned'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
