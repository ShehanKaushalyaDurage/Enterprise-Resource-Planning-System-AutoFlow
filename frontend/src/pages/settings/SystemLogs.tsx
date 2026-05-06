import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, Search, RefreshCw, Calendar, Clock } from 'lucide-react'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/formatters'

export default function SystemLogs() {
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['system-logs', page],
    queryFn: () => api.get('/system-logs', { params: { page, per_page: 25 } }).then(r => r.data.data),
  })

  const logs = data?.data ?? []
  const pagination = data?.meta ?? {}

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Application Audit Trail</h1>
          <p className="page-subtitle">Inspect historical application and database state writes</p>
        </div>
        <button className="btn btn-secondary" onClick={() => refetch()}>
          <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh Logs
        </button>
      </div>

      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck size={48} style={{ opacity: 0.3 }} />
            <h3>No audit records found</h3>
            <p>Once system operations occur, their traces will populate here.</p>
          </div>
        ) : (
          <div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Model Type</th>
                  <th>Model ID</th>
                  <th>Actor</th>
                  <th>Context Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {formatDateTime(log.recorded_at)}
                    </td>
                    <td>
                      <span className={`badge badge-${log.action === 'created' ? 'success' : (log.action === 'voided' ? 'danger' : 'secondary')}`} style={{ textTransform: 'uppercase', fontSize: 11 }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{log.model_type}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                      {log.model_id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.user?.name || 'System Auto'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.user?.email || ''}</div>
                    </td>
                    <td>
                      {log.payload ? (
                        <pre style={{ margin: 0, fontSize: 11, background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: 4, maxHeight: 60, overflowY: 'auto' }}>
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Simple Pagination */}
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(prev => prev - 1)}
              >
                Previous
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Page <strong>{page}</strong> of <strong>{data?.last_page || 1}</strong>
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= (data?.last_page || 1)}
                onClick={() => setPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
