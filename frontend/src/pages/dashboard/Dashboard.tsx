import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '@/lib/api'
import { formatCurrency, titleCase } from '@/lib/formatters'
import { TrendingUp, Receipt, ClipboardList, AlertTriangle, Plus, Clock } from 'lucide-react'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

export default function Dashboard() {
  const navigate = useNavigate()
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(timer)
  }, [])

  // KPI query (Auto-refresh every 30 seconds)
  const { data: kpis, dataUpdatedAt: kpiUpdated } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => api.get('/dashboard/kpis').then(r => r.data.data),
    refetchInterval: 30_000,
  })

  // Charts data (Auto-refresh every 2 minutes)
  const { data: trendData } = useQuery({
    queryKey: ['dashboard-revenue-expense'],
    queryFn: () => api.get('/dashboard/charts/monthly-revenue-expense').then(r => r.data.data),
    refetchInterval: 120_000,
  })

  const { data: pieDataRaw } = useQuery({
    queryKey: ['dashboard-service-breakdown'],
    queryFn: () => api.get('/dashboard/charts/service-type-breakdown').then(r => r.data.data),
    refetchInterval: 120_000,
  })

  // Top Vehicles (Auto-refresh every 2 minutes)
  const { data: topVehicles } = useQuery({
    queryKey: ['dashboard-top-vehicles'],
    queryFn: () => api.get('/dashboard/top-vehicles').then(r => r.data.data),
    refetchInterval: 120_000,
  })

  // Alerts query (Auto-refresh every 60 seconds)
  const { data: alerts } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => api.get('/dashboard/alerts').then(r => r.data.data),
    refetchInterval: 60_000,
  })

  const today = kpis?.today ?? {}
  const thisMonth = kpis?.this_month ?? {}
  const stock = kpis?.stock ?? {}

  const pieData = (pieDataRaw ?? []).map((p: any) => ({ name: p.label, value: p.count }))

  return (
    <div>
      {/* Real-time Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Workspace Dashboard</h1>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} /> Live Terminal: <strong style={{ color: 'var(--accent-blue)' }}>{liveTime}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/stock')}>Inventory List</button>
          <button className="btn btn-primary" onClick={() => navigate('/service-cards/new')}>
            <Plus size={16} style={{ marginRight: 6 }} /> New Service Card
          </button>
        </div>
      </div>

      {/* KPI Section - Today */}
      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 12, fontWeight: 700 }}>
        ⚡ Today's Quick Operations
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card-elevated" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Revenue Collected</span>
            <TrendingUp size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(today.revenue_collected || 0)}</div>
          <div style={{ fontSize: 11, color: 'var(--accent-green)', marginTop: 4 }}>✓ Fully Invoiced</div>
        </div>

        <div className="card-elevated" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>New Service Cards</span>
            <ClipboardList size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{today.new_service_cards || 0}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Open jobs</div>
        </div>

        <div className="card-elevated" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Pending Invoices</span>
            <Receipt size={18} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{today.pending_invoices_count || 0}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{formatCurrency(today.pending_invoices_value || 0)} due</div>
        </div>
      </div>

      {/* KPI Section - This Month */}
      <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 12, fontWeight: 700 }}>
        💼 Financial Summary (This Month)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card-elevated">
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Total Invoiced</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(thisMonth.total_invoiced || 0)}</div>
        </div>
        <div className="card-elevated">
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Total Expenses</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(thisMonth.total_expenses || 0)}</div>
        </div>
        <div className="card-elevated">
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Net Profit</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: thisMonth.net_profit >= 0 ? '#10b981' : '#ef4444' }}>
            {formatCurrency(thisMonth.net_profit || 0)}
          </div>
        </div>
        <div className="card-elevated">
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Total Stock Value</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-blue)' }}>{formatCurrency(stock.total_stock_value || 0)}</div>
        </div>
      </div>

      {/* Subtitle timer for KPI auto-updates */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginBottom: 12 }}>
        * KPI metrics refreshed {kpiUpdated ? Math.round((Date.now() - kpiUpdated) / 1000) : 0}s ago
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card-elevated">
          <div style={{ fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>📈 Revenue vs Expenses Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Total Income" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Total Expense" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated">
          <div style={{ fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>🛠 Service Breakdowns</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No data for the month</div>
          )}
        </div>
      </div>

      {/* Alerts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', fontWeight: 600, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            Top Active Vehicles (By Visit Count)
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Registration</th><th>Model</th><th>Visits</th></tr>
            </thead>
            <tbody>
              {(topVehicles ?? []).map((v: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{v.vehicle_no}</td>
                  <td>{v.model}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{v.visit_count} visits</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', fontWeight: 600, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            ⚠️ Active Supply Alerts
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/stock/alerts')}>View all</button>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Alert</th><th>Level</th></tr>
            </thead>
            <tbody>
              {(alerts?.low_stock ?? []).map((alert: any) => (
                <tr key={alert.id}>
                  <td>{alert.stock_item?.name}</td>
                  <td><span className="badge badge-danger">Reorder Required</span></td>
                </tr>
              ))}
              {(alerts?.low_stock ?? []).length === 0 && (
                <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>✓ No alerts active</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
