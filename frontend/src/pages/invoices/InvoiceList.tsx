import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, Plus } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDateTime, titleCase } from '@/lib/formatters'
import { useDebounce } from '@/hooks/useDebounce'
import { useUIStore } from '@/stores/uiStore'

export default function InvoiceList() {
  const navigate = useNavigate()
  const { openInvoiceModal } = useUIStore()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', debouncedSearch],
    queryFn: () => api.get('/invoices', { params: { search: debouncedSearch, per_page: 25 } }).then(r => r.data.data),
  })

  const invoices = data?.data ?? []

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Track and manage customer payments</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/stock-sales/new')}>
          <Plus size={16} style={{ marginRight: 6 }} /> Create Direct Sale
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-wrap" style={{ maxWidth: 420 }}>
          <Search className="search-icon" />
          <input
            className="input"
            placeholder="Search by invoice number or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : invoices.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <FileText size={48} />
            <h3>No invoices found</h3>
            <p>Invoices are generated automatically from completed service cards.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Service Card</th>
                <th>Customer</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
                <th style={{ textAlign: 'right' }}>Paid Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-blue)' }}>{inv.invoice_no}</td>
                  <td style={{ fontFamily: 'monospace' }}>{inv.service_card?.card_no}</td>
                  <td>{inv.service_card?.owner?.full_name}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(inv.total_amount)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--success)' }}>{formatCurrency(inv.paid_amount)}</td>
                  <td>
                    <span className={`badge badge-${inv.status}`}>{titleCase(inv.status)}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{formatDateTime(inv.created_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary btn-icon btn-sm" title="View Invoice" onClick={() => openInvoiceModal(inv.service_card_id)}>
                      <FileText size={14} />
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
