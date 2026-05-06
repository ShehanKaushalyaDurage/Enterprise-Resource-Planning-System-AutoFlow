import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'
import { formatCurrency, titleCase } from '@/lib/formatters'

export default function StockSaleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['stock-sales', id],
    queryFn: () => api.get(`/stock-sales/${id}`).then(r => r.data.data),
    enabled: !!id,
  })

  const voidMutation = useMutation({
    mutationFn: () => api.patch(`/stock-sales/${id}/void`),
    onSuccess: () => {
      addToast('success', 'Direct sales invoice successfully voided.')
      queryClient.invalidateQueries({ queryKey: ['stock-sales', id] })
    },
    onError: () => addToast('error', 'Failed to void invoice.')
  })

  if (isLoading || !invoice) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/stock-sales')} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={14} /> Back to Sales
          </button>
          <h1 className="page-title">Direct Sales Invoice: {invoice.invoice_no}</h1>
          <p className="page-subtitle">Detailed transactional history</p>
        </div>
        {invoice.status !== 'voided' && (
          <button className="btn btn-danger" onClick={() => { if (confirm('Are you sure you want to void this invoice?')) voidMutation.mutate() }}>
            <ShieldAlert size={16} style={{ marginRight: 6 }} /> Void Invoice
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 24 }}>
        {/* Sales Detail Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card-elevated" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Customer Name</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{invoice.customer_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Contact: {invoice.customer_contact || '—'}</div>
              {invoice.customer_address && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{invoice.customer_address}</div>}
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Checkout Context</div>
              <div style={{ fontSize: 13 }}>Invoiced At: <strong>{new Date(invoice.created_at).toLocaleString()}</strong></div>
              <div style={{ fontSize: 13 }}>Sales Rep: <strong>{invoice.sold_by?.name || 'Staff User'}</strong></div>
              <div style={{ display: 'inline-block', marginTop: 4 }}>
                <span className={`badge badge-${invoice.status === 'voided' ? 'secondary' : invoice.status === 'paid' ? 'success' : 'danger'}`}>
                  {titleCase(invoice.status)}
                </span>
              </div>
            </div>
          </div>

          <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Purchased Products</div>
            <table className="data-table">
              <thead>
                <tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr>
              </thead>
              <tbody>
                {(invoice.items ?? []).map((i: any) => (
                  <tr key={i.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{i.stock_item?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Code: {i.stock_item?.item_code}</div>
                    </td>
                    <td>{i.quantity}</td>
                    <td>{formatCurrency(i.unit_price)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(i.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action / Totals Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>Invoice Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Gross Subtotal:</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Discount Amount:</span>
                <span style={{ fontSize: 14, color: '#ef4444' }}>-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Total Value:</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{formatCurrency(invoice.total_amount)}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Payment Method:</span>
                <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>{invoice.payment_method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tendered:</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(invoice.tendered_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Change Amount:</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#16A34A' }}>{formatCurrency(invoice.change_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
