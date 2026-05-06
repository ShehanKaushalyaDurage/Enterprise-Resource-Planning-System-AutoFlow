import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'

export default function GrnCreate() {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()

  const [supplierId, setSupplierId] = useState('')
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('')
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().split('T')[0])
  const [remarks, setRemarks] = useState('')
  const [items, setItems] = useState<any[]>([])

  // Supplier modal state
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierPhone, setNewSupplierPhone] = useState('')

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then(r => r.data.data),
  })

  // We load only the latest versions by default for GRN select
  const { data: stockData } = useQuery({
    queryKey: ['stock-items', 'latest_only'],
    queryFn: () => api.get('/stock-items', { params: { latest_only: '1', per_page: 500 } }).then(r => r.data.data),
  })

  const suppliers = suppliersData?.data ?? []
  const stockItems = stockData?.data ?? []

  const addItem = () => {
    setItems([...items, { stock_item_id: '', quantity: 1, unit_cost: 0, unit_price: 0, original_cost: 0, original_price: 0 }])
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const mutation = useMutation({
    mutationFn: (payload: any) => api.post('/grn', payload),
    onSuccess: (res) => {
      addToast('success', 'GRN created successfully')
      queryClient.invalidateQueries({ queryKey: ['grn'] })
      queryClient.invalidateQueries({ queryKey: ['stock-items'] })
      navigate(`/grn/${res.data.data.id}`)
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message || 'Failed to create GRN')
    },
  })

  const supplierMutation = useMutation({
    mutationFn: (payload: any) => api.post('/suppliers', payload),
    onSuccess: (res) => {
      addToast('success', 'Supplier created')
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setSupplierId(res.data.data.id)
      setShowSupplierModal(false)
      setNewSupplierName('')
      setNewSupplierPhone('')
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message || 'Failed to create supplier')
    },
  })

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    supplierMutation.mutate({ name: newSupplierName, phone: newSupplierPhone })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId) {
      addToast('error', 'Please select a supplier')
      return
    }
    if (items.length === 0) {
      addToast('error', 'Please add at least one item')
      return
    }

    const payload = {
      supplier_id: supplierId,
      supplier_invoice_no: supplierInvoiceNo || undefined,
      remarks: remarks || undefined,
      received_at: receivedAt,
      items: items.map(item => ({
        stock_item_id: item.stock_item_id,
        ordered_qty: Number(item.quantity),
        received_qty: Number(item.quantity),
        unit_cost: Math.round(Number(item.unit_cost) * 100), // convert to cents
        unit_price: Math.round(Number(item.unit_price) * 100), // convert to cents
      }))
    }

    mutation.mutate(payload)
  }

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_cost)), 0)

  return (
    <div style={{ maxWidth: 1000 }}>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/grn')} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Back to List
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Receive Stock (GRN)</h1>
          <p className="page-subtitle">Record incoming stock and update inventory levels with version tracking</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Supplier Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="label" style={{ marginBottom: 0 }}>Supplier *</label>
                <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => setShowSupplierModal(true)}>
                  <Plus size={12} style={{ marginRight: 4 }} /> New
                </button>
              </div>
              <select className="input" value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
                <option value="">Select a supplier...</option>
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Supplier Invoice No</label>
              <input 
                className="input" 
                placeholder="e.g. INV-2026-88" 
                value={supplierInvoiceNo} 
                onChange={e => setSupplierInvoiceNo(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="label">Received Date *</label>
              <input 
                type="date"
                className="input" 
                value={receivedAt} 
                onChange={e => setReceivedAt(e.target.value)} 
                required
              />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="label">Remarks</label>
            <input 
              className="input" 
              placeholder="Any notes about this delivery..." 
              value={remarks} 
              onChange={e => setRemarks(e.target.value)} 
            />
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, margin: 0 }}>Received Items</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
              <Plus size={14} /> Add Item
            </button>
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>Stock Item</th>
                <th style={{ width: 100 }}>Quantity</th>
                <th style={{ width: 140 }}>Unit Cost (LKR)</th>
                <th style={{ width: 140 }}>Unit Price (LKR)</th>
                <th style={{ width: 120, textAlign: 'right' }}>Line Total</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    No items added yet. Click "Add Item" to begin.
                  </td>
                </tr>
              ) : items.map((item, idx) => {
                const selectedStock = stockItems.find((s: any) => s.id === item.stock_item_id)
                const isDiffCost = selectedStock && Number(item.unit_cost) !== (selectedStock.unit_cost / 100)
                const isDiffPrice = selectedStock && Number(item.unit_price) !== (selectedStock.unit_price / 100)

                return (
                  <tr key={idx}>
                    <td>
                      <select 
                        className="input" 
                        value={item.stock_item_id} 
                        onChange={e => {
                          updateItem(idx, 'stock_item_id', e.target.value)
                          const sel = stockItems.find((s: any) => s.id === e.target.value)
                          if (sel) {
                            updateItem(idx, 'unit_cost', sel.unit_cost / 100)
                            updateItem(idx, 'unit_price', sel.unit_price / 100)
                            updateItem(idx, 'original_cost', sel.unit_cost / 100)
                            updateItem(idx, 'original_price', sel.unit_price / 100)
                          }
                        }}
                        required
                      >
                        <option value="">Select item...</option>
                        {stockItems.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.item_code})
                          </option>
                        ))}
                      </select>
                      {selectedStock && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          Current version: <strong>{selectedStock.item_code}</strong> · Cost: Rs. {selectedStock.unit_cost / 100} · Sell: Rs. {selectedStock.unit_price / 100} · In Stock: {selectedStock.current_qty}
                        </div>
                      )}
                      {(isDiffCost || isDiffPrice) && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '2px 8px', background: 'var(--bg-secondary)', borderRadius: 4, border: '1px solid #f59e0b', color: '#f59e0b', fontSize: 11 }}>
                          <AlertCircle size={12} />
                          Price changed — a new version (V{selectedStock.version_number + 1}) will be created on issue
                        </div>
                      )}
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="input" 
                        min="1"
                        step="0.01"
                        value={item.quantity} 
                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="input" 
                        min="0"
                        step="0.01"
                        value={item.unit_cost} 
                        onChange={e => updateItem(idx, 'unit_cost', e.target.value)}
                        required
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="input" 
                        min="0"
                        step="0.01"
                        value={item.unit_price} 
                        onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                        required
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, verticalAlign: 'middle' }}>
                      {(Number(item.quantity) * Number(item.unit_cost)).toFixed(2)}
                    </td>
                    <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                      <button type="button" className="btn btn-secondary btn-icon btn-sm" onClick={() => removeItem(idx)}>
                        <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600, padding: '16px 24px' }}>Grand Total</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, padding: '16px 24px', fontSize: 16 }}>{totalAmount.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/grn')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            <Save size={16} /> Save GRN
          </button>
        </div>
      </form>

      {showSupplierModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 400 }}>
            <h3 style={{ marginBottom: 16 }}>New Supplier</h3>
            <form onSubmit={handleSupplierSubmit}>
              <div className="form-group">
                <label className="label">Supplier Name *</label>
                <input className="input" required value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="e.g. AutoParts LK" />
              </div>
              <div className="form-group">
                <label className="label">Phone Number *</label>
                <input className="input" required value={newSupplierPhone} onChange={e => setNewSupplierPhone(e.target.value)} placeholder="e.g. 0771234567" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSupplierModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={supplierMutation.isPending}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
