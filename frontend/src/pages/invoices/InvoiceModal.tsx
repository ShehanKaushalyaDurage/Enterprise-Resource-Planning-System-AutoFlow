import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Printer, CreditCard, Banknote, Building2, Loader2, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency, formatDateTime, toCents, titleCase, pct } from '@/lib/formatters'

interface Props {
  serviceCardId: string
  onClose: () => void
}

export default function InvoiceModal({ serviceCardId, onClose }: Props) {
  const { addToast } = useUIStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash')
  const [reference, setReference] = useState('')
  const [payError, setPayError] = useState('')

  // Load service card with invoice
  const { data: card, isLoading } = useQuery({
    queryKey: ['service-card', serviceCardId],
    queryFn: () => api.get(`/service-cards/${serviceCardId}`).then(r => r.data.data),
  })

  const invoice = card?.invoice
  const balanceCents = invoice ? invoice.total_amount - invoice.paid_amount : 0

  const payMutation = useMutation({
    mutationFn: () => {
      const amountCents = toCents(payAmount)
      if (!amountCents || amountCents <= 0) throw new Error('Enter a valid amount')
      if (amountCents > balanceCents) throw new Error(`Amount exceeds balance (${formatCurrency(balanceCents)})`)
      return api.post(`/invoices/${invoice.id}/payments`, {
        amount: amountCents,
        payment_method: payMethod,
        reference_no: reference || null,
      })
    },
    onSuccess: () => {
      addToast('success', 'Payment recorded!')
      setPayAmount('')
      setReference('')
      setPayError('')
      queryClient.invalidateQueries({ queryKey: ['service-card', serviceCardId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (err: any) => {
      setPayError(err.message || err.response?.data?.message || 'Payment failed')
    },
  })

  const handlePrint = () => {
    window.open(`/api/v1/reports/invoice/${invoice.id}`, '_blank')
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 750 }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Invoice</h2>
            {invoice && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{invoice.invoice_no}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {invoice && (
              <>
                <span className={`badge badge-${invoice.status}`}>{titleCase(invoice.status)}</span>
                <button className="btn btn-secondary btn-sm" onClick={handlePrint}><Printer size={14} /> Print PDF</button>
              </>
            )}
            <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className="modal-body">
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : !invoice ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No invoice found</p>
          ) : (
            <>
              {/* Vehicle & Owner */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div className="card-elevated">
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 6 }}>Vehicle / Owner</div>
                  <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'monospace', color: 'var(--accent-blue)' }}>{card.vehicle?.vehicle_no}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{card.vehicle?.brand?.name || card.vehicle?.brand} {card.vehicle?.model}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 600 }}>{card.owner?.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{card.owner?.contact_no}</div>
                </div>
                <div className="card-elevated">
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 6 }}>Invoice Summary</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {([
                      ['Subtotal', formatCurrency(invoice.subtotal)],
                      invoice.discount_amount > 0 ? ['Discount', `- ${formatCurrency(invoice.discount_amount)}`] : null,
                    ].filter(Boolean) as [string, any][]).map(([k, v]) => (
                      <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
                        <span>{k}</span><span>{v}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2 }}>
                      <span>Total</span><span style={{ color: 'var(--accent-blue)' }}>{formatCurrency(invoice.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance progress */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <span>Paid: <strong style={{ color: 'var(--accent-green)' }}>{formatCurrency(invoice.paid_amount)}</strong></span>
                  <span>Balance: <strong style={{ color: invoice.status === 'paid' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{formatCurrency(balanceCents)}</strong></span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct(invoice.paid_amount, invoice.total_amount)}%`, background: invoice.status === 'paid' ? 'var(--accent-green)' : 'var(--accent-blue)' }} />
                </div>
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Line Items</div>
                <table className="data-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr><th>Description</th><th>Type</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Unit</th><th style={{ textAlign: 'right' }}>Total</th></tr>
                  </thead>
                  <tbody>
                    {(card.items ?? []).map((item: any) => (
                      <tr key={item.id}>
                        <td>{item.description}</td>
                        <td><span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{item.item_type}</span></td>
                        <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Payment History */}
              {(invoice.payments ?? []).length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Payment History</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {invoice.payments.map((p: any) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} />
                          <span>{titleCase(p.payment_method)}</span>
                          {p.reference_no && <span style={{ color: 'var(--text-muted)' }}>· {p.reference_no}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{formatDateTime(p.paid_at)}</span>
                          <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatCurrency(p.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Form */}
              {invoice.status !== 'paid' && invoice.status !== 'voided' && (
                <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>💳 Add Payment</div>

                  {/* Method Selector */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    {[
                      { value: 'cash', icon: <Banknote size={16} />, label: 'Cash' },
                      { value: 'card', icon: <CreditCard size={16} />, label: 'Card' },
                      { value: 'bank_transfer', icon: <Building2 size={16} />, label: 'Bank' },
                    ].map(m => (
                      <button key={m.value} type="button"
                        onClick={() => setPayMethod(m.value as any)}
                        className={`btn btn-sm ${payMethod === m.value ? 'btn-primary' : 'btn-secondary'}`}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div className="field-group">
                      <label className="label">Amount (LKR)</label>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={payAmount}
                        onChange={e => { setPayAmount(e.target.value); setPayError('') }}
                        placeholder={`Max: ${(balanceCents / 100).toFixed(2)}`}
                      />
                    </div>
                    {(payMethod === 'card' || payMethod === 'bank_transfer') && (
                      <div className="field-group">
                        <label className="label">Reference No.</label>
                        <input className="input" value={reference} onChange={e => setReference(e.target.value)} placeholder="Transaction / cheque no." />
                      </div>
                    )}
                  </div>

                  {payError && <div style={{ color: 'var(--accent-red)', fontSize: 13, marginBottom: 10 }}>{payError}</div>}

                  <button className="btn btn-success" disabled={payMutation.isPending || !payAmount} onClick={() => payMutation.mutate()}>
                    {payMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Record Payment
                  </button>
                </div>
              )}

              {invoice.status === 'paid' && (
                <div style={{ padding: 16, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, textAlign: 'center', color: 'var(--accent-green)', fontWeight: 600 }}>
                  ✓ Invoice fully paid — Thank you!
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
