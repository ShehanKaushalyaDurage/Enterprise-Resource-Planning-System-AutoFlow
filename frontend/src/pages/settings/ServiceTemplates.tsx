import { useQuery } from '@tanstack/react-query'
import { Plus, Settings, Shield } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

export default function ServiceTemplates() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['service-templates'],
    queryFn: () => api.get('/service-templates').then(r => r.data.data),
  })

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
  }

  return (
    <div style={{ maxWidth: 1024, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Service Package Management</h1>
          <p className="page-subtitle">Add and configure customized oil grades, required items, and brand overrides.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {(templates ?? []).map((t: any) => (
          <div key={t.id} className="card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>{t.name} ({t.code})</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{t.description}</p>
              </div>
              <span className={`badge badge-${t.is_active ? 'success' : 'secondary'}`}>
                {t.is_active ? 'Active Package' : 'Archived'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  Global Required Consumables
                </h4>
                {t.required_items?.map((ri: any) => (
                  <div key={ri.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bg-secondary)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{ri.stock_item?.name || 'Item'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Role: <strong>{ri.item_role}</strong></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{ri.default_qty} units</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatCurrency(ri.stock_item?.unit_price)} each</div>
                    </div>
                  </div>
                ))}
                {(!t.required_items || t.required_items.length === 0) && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 12 }}>No required consumables defined.</div>
                )}
              </div>

              <div>
                <h4 style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  Configured Brands & Supported Grades
                </h4>
                {t.brands?.map((b: any) => (
                  <div key={b.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--bg-secondary)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Settings size={14} /> {b.brand_name}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                      {b.grades?.map((g: any) => (
                        <div key={g.id} style={{ background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{g.grade_name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Default Qty: {g.default_qty} L</div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-blue)' }}>
                            {formatCurrency(g.stock_item?.unit_price || 0)}/L
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(!t.brands || t.brands.length === 0) && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 12 }}>No brands or grades configured.</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
