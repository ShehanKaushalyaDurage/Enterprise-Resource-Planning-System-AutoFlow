import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, PackageOpen, AlertTriangle, Layers, ChevronDown, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, titleCase } from '@/lib/formatters'
import { useDebounce } from '@/hooks/useDebounce'

export default function StockList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [includeVersions, setIncludeVersions] = useState(false)
  const [expandedBaseCodes, setExpandedBaseCodes] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['stock-items', debouncedSearch, includeVersions],
    queryFn: () => api.get('/stock-items', {
      params: { search: debouncedSearch || undefined, include_versions: includeVersions ? '1' : undefined, per_page: includeVersions ? 100 : 50 }
    }).then(r => r.data.data),
  })

  const { data: alertsData } = useQuery({
    queryKey: ['stock-alerts', 'unacknowledged'],
    queryFn: () => api.get('/stock-alerts', { params: { status: 'unacknowledged' } }).then(r => r.data.data),
  })

  const items = data?.data ?? []
  const alertsCount = alertsData?.total ?? 0

  const toggleExpand = (baseCode: string) => {
    setExpandedBaseCodes(prev =>
      prev.includes(baseCode) ? prev.filter(c => c !== baseCode) : [...prev, baseCode]
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Management</h1>
          <p className="page-subtitle">Manage inventory and monitor versioned stock levels</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/stock/alerts')}>
            <AlertTriangle size={16} /> Alerts {alertsCount > 0 && <span className="badge badge-pending" style={{ marginLeft: 4 }}>{alertsCount}</span>}
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/stock/new')}>
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="search-wrap" style={{ maxWidth: 420 }}>
          <Search className="search-icon" />
          <input
            className="input"
            placeholder="Search by part number, name, or brand..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={includeVersions}
              onChange={e => setIncludeVersions(e.target.checked)}
            />
            <Layers size={16} /> Show all versions
          </label>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <PackageOpen size={48} />
            <h3>No stock items found</h3>
            <p>Add a new item to start tracking inventory.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {includeVersions && <th style={{ width: 40 }}></th>}
                <th>{includeVersions ? 'Base Code' : 'Item Code'}</th>
                <th>Name</th>
                <th>Location</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Stock Qty</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => {
                if (includeVersions) {
                  const isExpanded = expandedBaseCodes.includes(item.base_code)
                  return (
                    <React.Fragment key={item.id}>
                      <tr style={{ cursor: 'pointer' }} onClick={() => toggleExpand(item.base_code)}>
                        <td>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-blue)' }}>
                          {item.base_code}
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>{item.latest_version?.location || '—'}</td>
                        <td><span className="badge">{titleCase(item.category)}</span></td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.latest_version?.unit_price || 0)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{item.current_qty}</td>
                        <td>
                          <span className={`badge badge-${item.latest_version?.is_active ? 'success' : 'secondary'}`}>
                            {item.latest_version?.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/stock/${item.id}/edit`); }}>
                            Edit
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (item.versions ?? []).map((v: any) => (
                        <tr key={v.id} style={{ background: 'var(--bg-secondary)', fontSize: 13 }}>
                          <td></td>
                          <td style={{ fontFamily: 'monospace', paddingLeft: 24 }}>
                            └─ {v.item_code} <span className="badge" style={{ fontSize: 10 }}>V{v.version_number}</span>
                            {v.is_latest_version && <span className="badge badge-success" style={{ marginLeft: 4, fontSize: 10 }}>Latest</span>}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>—</td>
                          <td style={{ color: 'var(--text-muted)' }}>{v.location || '—'}</td>
                          <td><span className="badge" style={{ opacity: 0.7 }}>{titleCase(v.category)}</span></td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(v.unit_price)}</td>
                          <td style={{ textAlign: 'right' }}>{v.current_qty}</td>
                          <td>
                            <span className={`badge badge-${v.is_active ? 'success' : 'secondary'}`} style={{ opacity: 0.8 }}>
                              {v.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/stock/${v.id}/edit`)}>
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                }

                // Normal un-grouped listing
                return (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-blue)' }}>{item.item_code}</td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>{item.location || '—'}</td>
                    <td><span className="badge">{titleCase(item.category)}</span></td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ 
                        fontWeight: 600, 
                        color: Number(item.current_qty) <= Number(item.reorder_level) ? 'var(--danger)' : 'inherit'
                      }}>
                        {item.current_qty}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${item.is_active ? 'success' : 'secondary'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/stock/${item.id}/edit`)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
import React from 'react'
