import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertTriangle, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { formatDateTime, titleCase } from '@/lib/formatters'
import { useUIStore } from '@/stores/uiStore'

export default function StockAlerts() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()

  const { data, isLoading } = useQuery({
    queryKey: ['stock-alerts', 'unacknowledged'],
    queryFn: () => api.get('/stock-alerts', { params: { status: 'unacknowledged', per_page: 100 } }).then(r => r.data.data),
  })

  const ackMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/stock-alerts/${id}/acknowledge`),
    onSuccess: () => {
      addToast('success', 'Alert acknowledged')
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] })
    },
    onError: () => addToast('error', 'Failed to acknowledge alert'),
  })

  const alerts = data?.data ?? []

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/stock')} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Back to Stock
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Alerts</h1>
          <p className="page-subtitle">Low stock and out of stock notifications</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : alerts.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <CheckCircle size={48} style={{ color: 'var(--success)' }} />
            <h3>All clear!</h3>
            <p>No active stock alerts at the moment.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Alert Type</th>
                <th>Item</th>
                <th style={{ textAlign: 'right' }}>Current Stock</th>
                <th style={{ textAlign: 'right' }}>Reorder Level</th>
                <th>Triggered At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert: any) => (
                <tr key={alert.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: alert.alert_type === 'out_of_stock' ? 'var(--danger)' : 'var(--warning-text)' }}>
                      <AlertTriangle size={16} />
                      <span style={{ fontWeight: 600 }}>{titleCase(alert.alert_type)}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{alert.stock_item?.name} ({alert.stock_item?.part_number})</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--danger)' }}>{alert.stock_item?.stock_qty}</td>
                  <td style={{ textAlign: 'right' }}>{alert.stock_item?.reorder_level}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatDateTime(alert.triggered_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => ackMutation.mutate(alert.id)}
                      disabled={ackMutation.isPending}
                    >
                      Acknowledge
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
