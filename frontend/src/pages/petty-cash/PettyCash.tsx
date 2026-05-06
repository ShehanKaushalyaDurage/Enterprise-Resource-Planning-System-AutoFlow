import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Wallet, FileText, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { useUIStore } from '@/stores/uiStore'

export default function PettyCash() {
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [issuedTo, setIssuedTo] = useState('')

  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['petty-cash', 'today'],
    queryFn: () => api.get('/petty-cash/sessions/today').then(r => r.data.data),
  })

  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['petty-cash-entries'],
    queryFn: () => api.get('/petty-cash/entries', { params: { per_page: 50 } }).then(r => r.data.data),
  })

  const openSessionMutation = useMutation({
    mutationFn: () => api.post('/petty-cash/sessions', { daily_limit: 1000000 }), // Default 10k LKR limit (in cents)
    onSuccess: () => {
      addToast('success', 'Petty cash session opened for today')
      queryClient.invalidateQueries({ queryKey: ['petty-cash', 'today'] })
    },
    onError: (err: any) => addToast('error', err.response?.data?.message || 'Failed to open session'),
  })

  const issueEntryMutation = useMutation({
    mutationFn: (payload: any) => api.post('/petty-cash/entries', payload),
    onSuccess: () => {
      addToast('success', 'Petty cash issued successfully')
      setAmount('')
      setReason('')
      setIssuedTo('')
      queryClient.invalidateQueries({ queryKey: ['petty-cash', 'today'] })
      queryClient.invalidateQueries({ queryKey: ['petty-cash-entries'] })
    },
    onError: (err: any) => addToast('error', err.response?.data?.message || 'Failed to issue petty cash'),
  })

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault()
    issueEntryMutation.mutate({
      amount: Math.round(Number(amount) * 100),
      reason,
      issued_to: issuedTo || undefined,
    })
  }

  const session = sessionData
  const entries = entriesData?.data ?? []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Petty Cash Management</h1>
          <p className="page-subtitle">Track daily small expenses and cash handouts</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Left Column: Session & Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Active Session Status */}
          <div className="card" style={{ padding: 30, textAlign: 'center', background: session ? 'var(--bg-secondary)' : 'var(--bg-card)' }}>
            <Wallet size={48} style={{ margin: '0 auto 16px', color: session ? 'var(--accent-blue)' : 'var(--text-muted)' }} />
            {sessionLoading ? (
              <div className="spinner" style={{ margin: '0 auto' }} />
            ) : session ? (
              <>
                <h3 style={{ marginBottom: 8 }}>Today's Session Active</h3>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                  Opened by {session.opened_by_user?.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left', background: 'var(--bg-card)', padding: 16, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Daily Limit</div>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(session.daily_limit)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Spent</div>
                    <div style={{ fontWeight: 600, color: 'var(--warning-text)' }}>{formatCurrency(session.total_spent)}</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ marginBottom: 8 }}>No Active Session</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
                  You must open a petty cash session for today before you can issue funds.
                </p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => openSessionMutation.mutate()}
                  disabled={openSessionMutation.isPending}
                  style={{ margin: '0 auto' }}
                >
                  <Plus size={16} /> Open Today's Session
                </button>
              </>
            )}
          </div>

          {/* Issue Funds Form */}
          <div className={`card ${!session ? 'disabled-card' : ''}`}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Issue Petty Cash</h3>
            <form onSubmit={handleIssue}>
              <div className="form-group">
                <label className="label">Amount (LKR) *</label>
                <input 
                  type="number" 
                  className="input" 
                  min="0" 
                  step="0.01" 
                  required 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  disabled={!session}
                />
              </div>
              <div className="form-group">
                <label className="label">Reason *</label>
                <input 
                  className="input" 
                  placeholder="e.g. Workshop cleaning supplies" 
                  required 
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  disabled={!session}
                />
              </div>
              <div className="form-group">
                <label className="label">Issued To</label>
                <input 
                  className="input" 
                  placeholder="e.g. John Doe (Optional)" 
                  value={issuedTo}
                  onChange={e => setIssuedTo(e.target.value)}
                  disabled={!session}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: 20 }}
                disabled={!session || issueEntryMutation.isPending}
              >
                Issue Funds
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Recent Entries Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16, margin: 0 }}>Recent Expenses</h3>
          </div>
          {entriesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
          ) : entries.length === 0 ? (
            <div className="empty-state" style={{ padding: 60 }}>
              <FileText size={48} />
              <h3>No petty cash records</h3>
              <p>Recent transactions will appear here.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Issued To</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry: any) => (
                  <tr key={entry.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDateTime(entry.issued_at)}</td>
                    <td style={{ fontWeight: 500 }}>{entry.reason}</td>
                    <td>{entry.issued_to || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--warning-text)' }}>
                      {formatCurrency(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
