import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrendingUp, RefreshCw, Layers, Calendar, ArrowUpCircle, ArrowDownCircle, PlusCircle } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'
import { useUIStore } from '@/stores/uiStore'

export default function FinancePanel() {
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()
  const [investorName, setInvestorName] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [description, setDescription] = useState('')

  const { data: summary, refetch: refetchSummary } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => api.get('/finance/summary').then(r => r.data.data),
  })

  const { data: transactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['finance-transactions'],
    queryFn: () => api.get('/finance/transactions').then(r => r.data.data),
  })

  const mutation = useMutation({
    mutationFn: (payload: any) => api.post('/finance/capital', payload),
    onSuccess: () => {
      addToast('success', 'Capital contribution recorded successfully!')
      setInvestorName('')
      setAmount('')
      setDescription('')
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] })
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] })
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message || 'Failed to record capital contribution')
    }
  })

  const handleAddCapital = (e: React.FormEvent) => {
    e.preventDefault()
    if (!investorName || !amount || amount <= 0) {
      addToast('error', 'Please fill in required fields.')
      return
    }
    mutation.mutate({
      investor_name: investorName,
      amount: Math.round(amount * 100),
      description,
    })
  }

  const activeBalance = summary ? summary.active_balance : 0
  const totalIncome = summary ? summary.income.total_income : 0
  const totalExpenses = summary ? summary.expenses.total_expenses : 0
  const netProfit = summary ? summary.net_profit : 0
  const totalCapital = summary ? summary.total_capital : 0

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Unified P&L Panel & Balance Sheet</h1>
          <p className="page-subtitle">Ledger, Running Balances, & Capital Contributions</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { refetchSummary(); refetchTransactions() }}>
          <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card-elevated">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Operational Income</span>
            <ArrowUpCircle size={20} style={{ color: 'var(--success)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatCurrency(totalIncome)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            From income_entries
          </div>
        </div>

        <div className="card-elevated">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Operating Expenses</span>
            <ArrowDownCircle size={20} style={{ color: 'var(--danger)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatCurrency(totalExpenses)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            From expense_entries
          </div>
        </div>

        <div className="card-elevated">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Net Margin Profit</span>
            <TrendingUp size={20} style={{ color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {formatCurrency(netProfit)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Income minus Expenses
          </div>
        </div>

        <div className="card-elevated">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Capital</span>
            <PlusCircle size={20} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-blue)' }}>
            {formatCurrency(totalCapital)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            From capital_entries
          </div>
        </div>

        <div className="card-elevated" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--accent-blue)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Active Balance</span>
            <Layers size={20} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatCurrency(activeBalance)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Current cash availability
          </div>
        </div>
      </div>

      {/* Add Capital Contribution Form & Transaction Ledger */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        <div className="card-elevated">
          <h3 style={{ margin: 0, paddingBottom: 12, borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            Add Capital Contribution
          </h3>
          <form onSubmit={handleAddCapital} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
            <div className="field-group">
              <label className="label">Investor Name *</label>
              <input className="input" type="text" value={investorName} onChange={e => setInvestorName(e.target.value)} placeholder="Investor name" />
            </div>
            <div className="field-group">
              <label className="label">Amount (LKR) *</label>
              <input className="input" type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value ? parseFloat(e.target.value) : '')} placeholder="Amount" />
            </div>
            <div className="field-group">
              <label className="label">Description</label>
              <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Notes or description" rows={3} />
            </div>
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary" style={{ marginTop: 6 }}>
              {mutation.isPending ? 'Recording...' : '✓ Record Contribution'}
            </button>
          </form>
        </div>

        <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Unified Transaction Ledger</div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            <table className="data-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {(transactions ?? []).map((t: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{new Date(t.tx_date).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{t.description}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Source: {t.source_type}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className={`badge badge-${t.tx_type === 'income' ? 'success' : (t.tx_type === 'capital' ? 'secondary' : 'danger')}`} style={{ textTransform: 'capitalize' }}>
                        {t.tx_type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: t.tx_type === 'income' ? 'var(--success)' : (t.tx_type === 'capital' ? 'var(--accent-blue)' : 'var(--danger)') }}>
                      {t.tx_type === 'income' ? '+' : (t.tx_type === 'capital' ? '+' : '-')}{formatCurrency(Math.abs(t.amount))}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                      {formatCurrency(t.running_balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
