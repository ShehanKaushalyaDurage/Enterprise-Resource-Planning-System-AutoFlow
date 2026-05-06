import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash, Save, ArrowLeft, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'
import { formatCurrency } from '@/lib/formatters'
import ReceiptModal from '@/components/stock-sales/ReceiptModal'

interface LineItem {
  stock_item_id: string
  name: string
  available_qty: number
  quantity: number
  unit_price: number
  line_total: number
}

export default function StockSaleCreate() {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()

  const [customerName, setCustomerName] = useState('')
  const [customerContact, setCustomerContact] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)

  // Gap 1C segment buttons
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash')
  const [referenceNo, setReferenceNo] = useState('')
  const [tenderedAmount, setTenderedAmount] = useState(0)

  const [items, setItems] = useState<LineItem[]>([])
  const [searchItem, setSearchItem] = useState('')

  // Modal open flag and success data
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [createdInvoice, setCreatedInvoice] = useState<any>(null)

  const { data: stockItems } = useQuery({
    queryKey: ['stock-items', searchItem],
    queryFn: () => api.get('/stock-items', { params: { search: searchItem, per_page: 25 } }).then(r => r.data.data),
  })

  const stockList = stockItems?.data ?? []

  const handleAddProduct = (p: any) => {
    if (items.find(i => i.stock_item_id === p.id)) {
      addToast('error', 'This item is already listed.')
      return
    }
    if (p.current_qty <= 0) {
      addToast('error', 'Item is currently out of stock.')
      return
    }

    setItems([...items, {
      stock_item_id: p.id,
      name: p.name,
      available_qty: p.current_qty,
      quantity: 1,
      unit_price: p.unit_price,
      line_total: p.unit_price,
    }])
  }

  const handleRemoveLine = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  const handleQtyChange = (idx: number, val: number) => {
    const updated = [...items]
    updated[idx].quantity = Math.max(0.01, val)
    updated[idx].line_total = Math.round(updated[idx].quantity * updated[idx].unit_price)
    setItems(updated)
  }

  const handlePriceChange = (idx: number, val: number) => {
    const updated = [...items]
    updated[idx].unit_price = Math.max(0, val)
    updated[idx].line_total = Math.round(updated[idx].quantity * updated[idx].unit_price)
    setItems(updated)
  }

  const subtotal = items.reduce((sum, i) => sum + i.line_total, 0)
  const total = Math.max(0, subtotal - discountAmount)

  // Validate checkout
  const isCard = paymentMethod === 'card' || paymentMethod === 'bank_transfer'
  const isTenderedValid = isCard || tenderedAmount >= total
  const isFormValid = items.length > 0 && customerName && isTenderedValid

  const changeAmount = isCard ? 0 : Math.max(0, tenderedAmount - total)

  const resetForm = () => {
    setCustomerName('')
    setCustomerContact('')
    setCustomerAddress('')
    setNotes('')
    setDiscountAmount(0)
    setPaymentMethod('cash')
    setReferenceNo('')
    setTenderedAmount(0)
    setItems([])
    setIsReceiptOpen(false)
    setCreatedInvoice(null)
  }

  const mutation = useMutation({
    mutationFn: () => api.post('/stock-sales', {
      customer_name: customerName,
      customer_contact: customerContact || null,
      customer_address: customerAddress || null,
      subtotal,
      discount_amount: discountAmount,
      total_amount: total,
      notes: notes || null,
      payment_method: paymentMethod,
      tendered_amount: isCard ? total : tenderedAmount,
      reference_no: isCard ? referenceNo : null,
      items: items.map(i => ({
        stock_item_id: i.stock_item_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: i.line_total,
      }))
    }),
    onSuccess: (res) => {
      addToast('success', 'Sale created successfully.')
      queryClient.invalidateQueries({ queryKey: ['stock-sales'] })
      // Load modal data
      setCreatedInvoice({
        id: res.data.data.id,
        invoice_no: res.data.data.invoice_no,
        customer_name: res.data.data.customer_name,
        created_at: res.data.data.created_at,
        subtotal: res.data.data.subtotal,
        discount_amount: res.data.data.discount_amount,
        total_amount: res.data.data.total_amount,
        tendered_amount: res.data.data.tendered_amount,
        change_amount: res.data.data.change_amount,
        payment_method: res.data.data.payment_method,
        items: items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          line_total: i.line_total
        }))
      })
      setIsReceiptOpen(true)
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message || 'Failed to complete transaction.')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    mutation.mutate()
  }

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/stock-sales')} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={14} /> View Retail Sales List
          </button>
          <h1 className="page-title">Direct Sales Invoice</h1>
          <p className="page-subtitle">Immediate point of sale counter checkout</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24 }}>
        {/* Customer Sidebar */}
        <div className="card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ margin: 0, paddingBottom: 10, borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>Customer Context</h3>

          <div className="field-group">
            <label className="label">Full Name*</label>
            <input required className="input" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </div>

          <div className="field-group">
            <label className="label">Contact Phone</label>
            <input className="input" value={customerContact} onChange={e => setCustomerContact(e.target.value)} />
          </div>

          <div className="field-group">
            <label className="label">Full Address</label>
            <input className="input" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
          </div>

          <div className="field-group">
            <label className="label">Sales Notes / Comments</label>
            <textarea className="input" style={{ height: 60 }} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <h3 style={{ margin: '14px 0 0 0', paddingBottom: 10, borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>Adjustments</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <div className="field-group">
              <label className="label">Discount (Cents)</label>
              <input type="number" className="input" value={discountAmount} onChange={e => setDiscountAmount(parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <h3 style={{ margin: '14px 0 0 0', paddingBottom: 10, borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>Payment Processing</h3>
          <div className="field-group">
            <label className="label">Payment Method*</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {(['cash', 'card', 'bank_transfer'] as const).map(m => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize', border: '1px solid var(--border)', background: paymentMethod === m ? 'var(--accent-blue)' : 'var(--bg-secondary)', color: paymentMethod === m ? '#fff' : 'var(--text-primary)' }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {!isCard ? (
            <div className="field-group">
              <label className="label">Tendered Amount (Cents)*</label>
              <input
                type="number"
                className="input"
                required
                value={tenderedAmount}
                onChange={e => setTenderedAmount(parseInt(e.target.value) || 0)}
              />
            </div>
          ) : (
            <div className="field-group">
              <label className="label">Reference / Auth Code</label>
              <input
                className="input"
                placeholder="Optional card or bank transaction ID..."
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
              />
            </div>
          )}

          <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 8, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Subtotal:</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Discount:</span>
              <span style={{ fontSize: 14 }}>{formatCurrency(discountAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Total Due:</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-blue)' }}>{formatCurrency(total)}</span>
            </div>
            {tenderedAmount > 0 && !isCard && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Change Returned:</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#16A34A' }}>{formatCurrency(changeAmount)}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: 12 }}
            disabled={!isFormValid || mutation.isPending}
            title={!isTenderedValid ? 'Enter tendered amount to proceed' : ''}
          >
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Complete Sale
          </button>
        </div>

        {/* Dynamic Items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Select Products</h3>
            <input
              className="input"
              placeholder="Search by code or item description..."
              value={searchItem}
              onChange={e => setSearchItem(e.target.value)}
            />
            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: 4 }}>
              {stockList.map((p: any) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Code: {p.item_code} | On Hand: <strong>{p.current_qty}</strong></div>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAddProduct(p)}>
                    <Plus size={12} /> Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>On Hand</th>
                  <th>Qty</th>
                  <th>Price (Cents)</th>
                  <th>Line Total</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.stock_item_id}>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                    </td>
                    <td>{item.available_qty}</td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        style={{ width: 80, padding: 6, height: 32 }}
                        value={item.quantity}
                        onChange={e => handleQtyChange(idx, parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input"
                        style={{ width: 100, padding: 6, height: 32 }}
                        value={item.unit_price}
                        onChange={e => handlePriceChange(idx, parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(item.line_total)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveLine(idx)}>
                        <Trash size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No items selected.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </form>

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false)
          navigate('/stock-sales')
        }}
        invoice={createdInvoice}
        onNewSale={resetForm}
      />
    </div>
  )
}
