import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatCurrency, formatDateTime, titleCase } from '@/lib/formatters'
import { useDebounce } from '@/hooks/useDebounce'
import { FileText, Search } from 'lucide-react'

export default function Expenses() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', debouncedSearch, page],
    queryFn: () => api.get('/expenses', {
      params: { search: debouncedSearch || undefined, page, per_page: 25 }
    }).then(r => r.data.data),
  })

  const expenses = data?.data ?? []
  const pagination = data?.meta ?? data ?? {}

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Expense Analytics</h1>
          <p className="page-subtitle">Track and analyze all recorded operational expenses</p>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div className="search-wrap" style={{ maxWidth: 420, flex: 1 }}>
          <Search className="search-icon" />
          <input
            className="input"
            placeholder="Search expenses by description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : expenses.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <FileText size={48} />
            <h3>No expenses found</h3>
            <p>Expense logs will be automatically generated upon payment completions.</p>
          </div>
        ) : (
          <div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp: any) => (
                  <tr key={exp.id}>
                    <td>{formatDateTime(exp.expense_date || exp.created_at)}</td>
                    <td>
                      <span className={`badge badge-${exp.expense_type}`}>
                        {titleCase(exp.expense_type === 'petty_cash' ? 'Petty Cash' : exp.expense_type)}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{exp.reference_no || '—'}</td>
                    <td>{exp.description}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(exp.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.last_page > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                  Page {page} of {pagination.last_page}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page === pagination.last_page}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
