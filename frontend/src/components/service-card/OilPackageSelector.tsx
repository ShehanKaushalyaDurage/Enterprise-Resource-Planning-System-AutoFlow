import { useState, useEffect } from 'react'
import { Check, Sliders, RefreshCcw } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'
import { useUIStore } from '@/stores/uiStore'

interface OilPackageSelectorProps {
  templateId?: string
  onPackageSelected: (lineItems: any[]) => void
}

const oilOptions: Record<string, string[]> = {
  'Toyo Genuine Oil': ['0w20 4liter', '5w30 4liter', '10w30 4liter', '15w40 4liter'],
  'Mobile Genuine Oil': ['5w30 4liter', '10w30 4liter', '15w40 4liter'],
  'Castrol Genuine Oil': ['0w20 3liter', '10w30 3liter'],
  'Petromin Genuine Oil': ['10w30 3liter'],
  'ENI Genuine Oil': ['15w40 4liter'],
  'Valvoline Genuine Oil': ['15w40 6liter']
}

export default function OilPackageSelector({ onPackageSelected }: OilPackageSelectorProps) {
  const { addToast } = useUIStore()

  const [oilBrand, setOilBrand] = useState('Toyo Genuine Oil')
  const [oilGrade, setOilGrade] = useState('0w20 4liter')

  const [stockItems, setStockItems] = useState<any[]>([])

  const [customQtys, setCustomQtys] = useState<any>({
    oil: 1,
    oil_filter: 1,
    drain_plug_seal: 1
  })
  const [isCustomizing, setIsCustomizing] = useState(false)

  // Fetch stock items on mount to match prices dynamically
  useEffect(() => {
    api.get('/stock-items', { params: { per_page: 250 } })
      .then(r => setStockItems(r.data.data.data || []))
      .catch(() => addToast('error', 'Failed to fetch inventory items'))
  }, [])

  // Auto-select grade when brand changes
  const handleBrandChange = (brand: string) => {
    setOilBrand(brand)
    const grades = oilOptions[brand] || []
    if (grades.length > 0) {
      setOilGrade(grades[0])
    } else {
      setOilGrade('')
    }
  }

  // Find matching stock item for selected oil
  const selectedOilStockItem = stockItems.find((s: any) =>
    s.name.toLowerCase().includes(oilBrand.toLowerCase()) &&
    s.name.toLowerCase().includes(oilGrade.toLowerCase())
  )

  const selectedFilterStockItem = stockItems.find((s: any) =>
    s.name.toLowerCase().includes('filter')
  )

  const oilPrice = selectedOilStockItem ? selectedOilStockItem.unit_price : 450000 // default LKR 4,500 in cents
  const filterPrice = selectedFilterStockItem ? selectedFilterStockItem.unit_price : 120000 // default LKR 1,200 in cents
  const sealPrice = 15000 // default LKR 150 in cents

  // Line items
  const oilQty = customQtys.oil || 1
  const filterQty = customQtys.oil_filter || 1
  const sealQty = customQtys.drain_plug_seal || 1

  const packageLines = [
    {
      description: `${oilBrand} - ${oilGrade}`,
      item_role: 'oil',
      quantity: oilQty,
      unit_price: oilPrice,
      line_total: oilQty * oilPrice,
      stock_item_id: selectedOilStockItem?.id || null
    },
    {
      description: 'Premium Oil Filter',
      item_role: 'oil_filter',
      quantity: filterQty,
      unit_price: filterPrice,
      line_total: filterQty * filterPrice,
      stock_item_id: selectedFilterStockItem?.id || null
    },
    {
      description: 'Drain Plug Seal',
      item_role: 'drain_plug_seal',
      quantity: sealQty,
      unit_price: sealPrice,
      line_total: sealQty * sealPrice,
      stock_item_id: null
    }
  ]

  const totalPrice = packageLines.reduce((sum, li) => sum + li.line_total, 0)

  const handleConfirmPackage = () => {
    onPackageSelected(packageLines)
  }

  return (
    <div className="card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>🛢️ Oil Package Configurator</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field-group">
          <label className="label">Oil Brand</label>
          <select className="select" value={oilBrand} onChange={e => handleBrandChange(e.target.value)}>
            {Object.keys(oilOptions).map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="label">Oil Grade / Volume</label>
          <select className="select" value={oilGrade} onChange={e => setOilGrade(e.target.value)} disabled={!oilBrand}>
            {(oilOptions[oilBrand] ?? []).map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Package Preview */}
      <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>PACKAGE PREVIEW</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '4px 0' }}>Item</th>
              <th style={{ padding: '4px 0' }}>Qty</th>
              <th style={{ padding: '4px 0', textAlign: 'right' }}>Unit Price</th>
              <th style={{ padding: '4px 0', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {packageLines.map((li: any, idx: number) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '6px 0' }}>{li.description}</td>
                <td style={{ padding: '6px 0' }}>{li.quantity}</td>
                <td style={{ padding: '6px 0', textAlign: 'right' }}>{formatCurrency(li.unit_price)}</td>
                <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(li.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Package Total:</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{formatCurrency(totalPrice)}</span>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Sliders size={12} /> {isCustomizing ? 'Hide' : 'Customise quantities'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' }}
            onClick={handleConfirmPackage}
          >
            <Check size={14} /> Confirm Package
          </button>
        </div>

        {isCustomizing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg-primary)', padding: 12, borderRadius: 6, marginTop: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>OVERRIDE QUANTITIES</div>
            {packageLines.map((li: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12 }}>{li.description}</span>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  style={{ width: 80, height: 32, padding: 6 }}
                  value={customQtys[li.item_role] ?? li.quantity}
                  onChange={e => setCustomQtys({ ...customQtys, [li.item_role]: parseFloat(e.target.value) || 0 })}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
