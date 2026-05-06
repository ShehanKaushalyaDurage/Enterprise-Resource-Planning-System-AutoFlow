import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Truck, FileText, DollarSign } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDateTime, titleCase } from '@/lib/formatters'
import { useDebounce } from '@/hooks/useDebounce'
import GrnPaymentModal from '@/components/grn/GrnPaymentModal'

export default function GrnList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [selectedGrn, setSelectedGrn] = useState<any>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['grns', debouncedSearch],
    queryFn: () => api.get('/grn', { params: { search: debouncedSearch, per_page: 25 } }).then(r => r.data.data),
  })

  const grns = data?.data ?? []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good Receive Notes (GRN)</h1>
          <p className="page-subtitle">Track incoming stock from suppliers</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/grn/new')}>
          <Plus size={16} /> Receive Stock
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-wrap" style={{ maxWidth: 420 }}>
          <Search className="search-icon" />
          <input
            className="input"
            placeholder="Search by GRN number, invoice, or supplier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : grns.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <Truck size={48} />
            <h3>No GRNs found</h3>
            <p>Create a new Good Receive Note when stock arrives from a supplier.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>GRN No</th>
                <th>Supplier Invoice</th>
                <th>Supplier</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
                <th>Status</th>
                <th>Date Received</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grns.map((grn: any) => (
                <tr key={grn.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-blue)' }}>{grn.grn_no}</td>
                  <td>{grn.supplier_invoice_no || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{grn.supplier?.name}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(grn.total_amount)}</td>
                  <td>
                    <span className={`badge badge-${grn.payment_status}`}>{titleCase(grn.payment_status || '')}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatDateTime(grn.received_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {grn.payment_status !== 'paid' && (
                        <button
                          className="btn btn-success btn-sm btn-icon"
                          title="Pay / Installment"
                          onClick={() => {
                            setSelectedGrn(grn)
                            setIsPaymentModalOpen(true)
                          }}
                        >
                          <DollarSign size={14} /> Pay
                        </button>
                      )}
                      <button className="btn btn-secondary btn-icon btn-sm" title="View Detail" onClick={() => navigate(`/grn/${grn.id}`)}>
                        <FileText size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <GrnPaymentModal
        grn={selectedGrn}
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setSelectedGrn(null)
        }}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
