import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, FileText } from 'lucide-react'
import api from '@/lib/api'
import { useDebounce } from '@/hooks/useDebounce'
import { formatCurrency, titleCase } from '@/lib/formatters'

export default function StockSaleList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['stock-sales', debouncedSearch, status],
    queryFn: () => api.get('/stock-sales', {
      params: { search: debouncedSearch, status: status || null, per_page: 50 }
    }).then(r => r.data.data),
  })

  const sales = data?.data ?? []

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Direct Stock Sales</h1>
          <p className="page-subtitle">Track counter checkout items and immediate retail sales</p>
        </div>
      </div>

      <div className="card-elevated" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="search-wrap">
          <Search className="search-icon" />
          <input
            className="input"
            placeholder="Search by invoice number or customer name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="voided">Voided</option>
          </select>
        </div>
      </div>

      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : sales.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} style={{ opacity: 0.3 }} />
            <h3>No direct sales found</h3>
            <p>Try resetting filters or start a new sale.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Created At</th>
                <th>Total Value</th>
                <th>Paid Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s: any) => (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/stock-sales/${s.id}`)}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.invoice_no}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.customer_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.customer_contact}</div>
                  </td>
                  <td>{new Date(s.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(s.total_amount)}</td>
                  <td>{formatCurrency(s.paid_amount)}</td>
                  <td>
                    <span className={`badge badge-${s.status === 'voided' ? 'secondary' : s.status === 'paid' ? 'success' : s.status === 'partial' ? 'pending' : 'danger'}`}>
                      {titleCase(s.status)}
                    </span>
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
