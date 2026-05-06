import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Printer } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDateTime, titleCase } from '@/lib/formatters'

export default function GrnDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: grn, isLoading } = useQuery({
    queryKey: ['grn', id],
    queryFn: () => api.get(`/grn/${id}`).then(r => r.data.data),
  })

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
  }

  if (!grn) {
    return <div className="empty-state">GRN not found</div>
  }

  const handlePrint = () => {
    window.open(`/api/v1/reports/grn/${grn.id}`, '_blank')
  }

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/grn')} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Back to List
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">GRN: {grn.grn_no}</h1>
          <p className="page-subtitle">Received on {formatDateTime(grn.received_at)}</p>
        </div>
        <button className="btn btn-secondary" onClick={handlePrint}>
          <Printer size={16} /> Print GRN
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Received Items & Versions</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Selected</th>
                  <th>Decision</th>
                  <th>Resulting Item</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ textAlign: 'right' }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {(grn.items ?? []).map((item: any) => {
                  const isMerged = item.stock_item_id === item.resulting_stock_item_id
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.stock_item?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Code: {item.stock_item?.item_code}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${isMerged ? 'success' : 'pending'}`}>
                          {isMerged ? 'Merged ✓' : 'New version created'}
                        </span>
                      </td>
                      <td>
                        {item.resulting_stock_item ? (
                          <div style={{ fontWeight: 600, color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => navigate(`/stock/${item.resulting_stock_item.id}/edit`)}>
                            {item.resulting_stock_item.item_code}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>{item.received_qty}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_cost)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.line_total)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ textAlign: 'right', fontWeight: 600, padding: 16 }}>Grand Total</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, padding: 16, fontSize: 16 }}>{formatCurrency(grn.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {grn.remarks && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>Remarks</div>
              <p style={{ fontSize: 14 }}>{grn.remarks}</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Supplier Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Supplier Name</div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{grn.supplier?.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Supplier Invoice No</div>
                <div style={{ fontFamily: 'monospace' }}>{grn.supplier_invoice_no || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</div>
                <div style={{ marginTop: 4 }}>
                  <span className={`badge badge-${grn.payment_status}`}>{titleCase(grn.payment_status || '')}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Received By</div>
                <div>{grn.received_by_user?.name || grn.received_by?.name || 'Unknown'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Payment Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Amount</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(grn.total_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Paid Amount</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(grn.paid_amount)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Balance Due</span>
                <span style={{ fontWeight: 600, color: grn.total_amount > grn.paid_amount ? 'var(--danger)' : 'inherit' }}>
                  {formatCurrency(grn.total_amount - grn.paid_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
