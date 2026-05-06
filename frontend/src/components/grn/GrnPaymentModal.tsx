import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'
import { useUIStore } from '@/stores/uiStore'

interface Props {
  grn: any
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function GrnPaymentModal({ grn, isOpen, onClose, onSuccess }: Props) {
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()

  const [amount, setAmount] = useState<number | ''>('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [referenceNo, setReferenceNo] = useState('')

  // Calculate balance due
  const totalAmount = grn?.total_amount || 0
  const totalPaid = (grn?.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0)
  const balanceDue = totalAmount - totalPaid

  const mutation = useMutation({
    mutationFn: (payload: any) => api.post(`/grn/${grn?.id}/payments`, payload),
    onSuccess: () => {
      addToast('success', 'GRN payment recorded successfully!')
      queryClient.invalidateQueries({ queryKey: ['grns'] })
      queryClient.invalidateQueries({ queryKey: ['grn', grn?.id] })
      if (onSuccess) onSuccess()
      onClose()
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message || 'Failed to record payment')
    }
  })

  if (!isOpen || !grn) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || amount <= 0) {
      addToast('error', 'Please enter a valid payment amount.')
      return
    }

    const amountInCents = Math.round(amount * 100)
    if (amountInCents > balanceDue) {
      addToast('error', 'Payment amount cannot exceed balance due.')
      return
    }

    mutation.mutate({
      amount: amountInCents,
      payment_method: paymentMethod,
      reference_no: referenceNo,
    })
  }

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }}>
      <div className="modal-content" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 420, position: 'relative' }}>
        
        {/* Close Button */}
        <button type="button" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <h3 style={{ margin: 0, marginBottom: 4, color: 'var(--text-primary)' }}>GRN Payment: {grn.grn_no}</h3>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}> Record a new payment or installment</p>

        {/* Balance Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Due</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{formatCurrency(totalAmount)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Balance Due</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-blue)' }}>{formatCurrency(balanceDue)}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field-group">
            <label className="label">Payment Amount (LKR) *</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              max={balanceDue / 100}
              value={amount}
              onChange={e => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
              placeholder={`${(balanceDue / 100).toFixed(2)}`}
            />
          </div>

          <div className="field-group">
            <label className="label">Payment Method *</label>
            <select className="select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div className="field-group">
            <label className="label">Reference / Note</label>
            <input
              className="input"
              type="text"
              value={referenceNo}
              onChange={e => setReferenceNo(e.target.value)}
              placeholder="e.g. Receipt or Ref no."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <><Loader2 size={16} className="animate-spin" style={{ marginRight: 6 }} /> Recording...</> : '✓ Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
