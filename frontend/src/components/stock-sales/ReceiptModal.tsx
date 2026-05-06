import { X, Printer, RefreshCcw } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'

interface LineItem {
  name: string
  quantity: number
  unit_price: number
  line_total: number
}

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: {
    id: string
    invoice_no: string
    customer_name: string
    created_at: string
    subtotal: number
    discount_amount: number
    total_amount: number
    tendered_amount: number
    change_amount: number
    payment_method: string
    items?: LineItem[]
  } | null
  onNewSale: () => void
}

export default function ReceiptModal({ isOpen, onClose, invoice, onNewSale }: ReceiptModalProps) {
  if (!isOpen || !invoice) return null

  const handlePrint = () => {
    window.open(`/api/v1/stock-sales/${invoice.id}/pdf`, '_blank')
  }

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: 20 }}>
      <div className="card-elevated" style={{ width: 480, maxWidth: '100%', position: 'relative', background: 'var(--bg-primary)', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>SALE COMPLETE</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Invoice No:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{invoice.invoice_no}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Customer:</span>
            <span style={{ color: 'var(--text-primary)' }}>{invoice.customer_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Date & Time:</span>
            <span style={{ color: 'var(--text-primary)' }}>{new Date(invoice.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)', padding: '12px 0', margin: '12px 0' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>ITEMS</span>
          {invoice.items && invoice.items.length > 0 ? (
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '4px 0', fontWeight: 500 }}>Description</th>
                  <th style={{ padding: '4px 0', fontWeight: 500 }}>Qty</th>
                  <th style={{ padding: '4px 0', fontWeight: 500, textAlign: 'right' }}>Unit</th>
                  <th style={{ padding: '4px 0', fontWeight: 500, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((i, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    <td style={{ padding: '6px 0' }}>{i.name}</td>
                    <td style={{ padding: '6px 0' }}>{i.quantity}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right' }}>{formatCurrency(i.unit_price)}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(i.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No item details available.</p>
          )}
        </div>

        <div style={{ fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Invoice Total:</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(invoice.total_amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tendered:</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(invoice.tendered_amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Change:</span>
            <span style={{ fontWeight: 700, color: '#16A34A' }}>{formatCurrency(invoice.change_amount)}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Printer size={16} /> Print Receipt
          </button>
          <button type="button" className="btn btn-primary" onClick={onNewSale} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <RefreshCcw size={16} /> New Sale
          </button>
        </div>
      </div>
    </div>
  )
}
