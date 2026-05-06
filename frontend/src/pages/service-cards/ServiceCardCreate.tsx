import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, Plus, Trash2, Loader2, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { formatAmount, formatCurrency, toCents } from '@/lib/formatters'
import { useDebounce } from '@/hooks/useDebounce'
import OilPackageSelector from '@/components/service-card/OilPackageSelector'

const lineItemSchema = z.object({
  description: z.string().min(1, 'Required'),
  item_type: z.enum(['labour', 'part', 'consumable']),
  quantity: z.number().positive('Must be > 0'),
  unit_price_display: z.number().min(0, 'Must be ≥ 0'),
  stock_item_id: z.string().nullable().optional(),
  is_package_item: z.boolean().optional(),
  item_role: z.string().nullable().optional(),
})

const schema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  owner_id: z.string().min(1),
  service_type_id: z.string().min(1, 'Service type is required'),
  oil_type_id: z.string().optional(),
  oil_quantity_liters: z.number().optional(),
  remarks: z.string().optional(),
  inspection_notes: z.string().optional(),
  technician_id: z.string().optional(),
  mileage_at_service: z.number().optional(),
  items: z.array(lineItemSchema).min(1, 'At least one item is required'),
})

type FormData = z.infer<typeof schema>

const oilOptions: Record<string, string[]> = {
  'Toyo Genuine Oil': ['0w20 4liter', '5w30 4liter', '10w30 4liter', '15w40 4liter'],
  'Mobile Genuine Oil': ['5w30 4liter', '10w30 4liter', '15w40 4liter'],
  'Castrol Genuine Oil': ['0w20 3liter', '10w30 3liter'],
  'Petromin Genuine Oil': ['10w30 3liter'],
  'ENI Genuine Oil': ['15w40 4liter'],
  'Valvoline Genuine Oil': ['15w40 6liter']
}

export default function ServiceCardCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const { addToast, openInvoiceModal } = useUIStore()
  const { user } = useAuthStore()

  const [vehicleSearch, setVehicleSearch] = useState('')
  const debouncedVehicleSearch = useDebounce(vehicleSearch, 300)
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [stockSearch, setStockSearch] = useState('')
  const debouncedStockSearch = useDebounce(stockSearch, 300)
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null)

  const [serviceTemplates, setServiceTemplates] = useState<any[]>([])

  const [oilBrand, setOilBrand] = useState('')
  const [oilGrade, setOilGrade] = useState('')

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      items: [{ description: 'Service Labour', item_type: 'labour', quantity: 1, unit_price_display: 0, stock_item_id: null, is_package_item: false, item_role: null }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const watchItems = form.watch('items')
  const watchServiceTypeId = form.watch('service_type_id')

  // Queries
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-search', debouncedVehicleSearch],
    queryFn: () => debouncedVehicleSearch ? api.get('/vehicles', { params: { search: debouncedVehicleSearch, per_page: 5 } }).then(r => r.data.data.data) : Promise.resolve([]),
    enabled: !!debouncedVehicleSearch && !selectedVehicle,
  })

  const { data: serviceTypes } = useQuery({ queryKey: ['service-types'], queryFn: () => api.get('/service-types').then(r => r.data.data) })
  const { data: technicians } = useQuery({ queryKey: ['technicians'], queryFn: () => api.get('/users', { params: { role: 'technician' } }).then(r => r.data.data.data) })
  const { data: stockItems } = useQuery({
    queryKey: ['stock-search', debouncedStockSearch],
    queryFn: () => debouncedStockSearch ? api.get('/stock-items', { params: { search: debouncedStockSearch, per_page: 8 } }).then(r => r.data.data.data) : Promise.resolve([]),
    enabled: !!debouncedStockSearch,
  })

  useEffect(() => {
    api.get('/service-templates')
      .then(r => setServiceTemplates(r.data.data || []))
      .catch(() => addToast('error', 'Failed to load service templates'))
  }, [])

  const selectedServiceType = serviceTypes?.find((st: any) => String(st.id) === watchServiceTypeId)
  const isFullService = selectedServiceType?.name === 'full_service'

  // Pre-fill vehicle if navigated from vehicle list
  useEffect(() => {
    if (location.state?.vehicleId) {
      api.get(`/vehicles/${location.state.vehicleId}`).then(res => {
        const v = res.data.data
        setSelectedVehicle(v)
        form.setValue('vehicle_id', v.id)
        form.setValue('owner_id', v.owner_id)
      })
    }
  }, [])

  // Handle package item selection
  const handlePackageSelected = (packageLineItems: any[]) => {
    // Retain only non-package items
    const nonPackageItems = watchItems.filter(i => !i.is_package_item)
    // Map package items
    const mapped = packageLineItems.map(p => ({
      description: p.description,
      item_type: 'part' as const,
      quantity: p.quantity,
      unit_price_display: p.unit_price / 100,
      stock_item_id: p.stock_item_id,
      is_package_item: true,
      item_role: p.item_role,
    }))

    form.setValue('items', [...nonPackageItems, ...mapped])
    addToast('success', 'Package items added to your card!')
  }

  const handleOilAppend = () => {
    if (!oilBrand || !oilGrade) {
      addToast('error', 'Please select both an oil brand and grade.')
      return
    }
    append({
      description: `${oilBrand} - ${oilGrade}`,
      item_type: 'part',
      quantity: 1,
      unit_price_display: 0,
      stock_item_id: null,
      is_package_item: false,
      item_role: null
    })
    addToast('success', `${oilBrand} (${oilGrade}) added to your service items.`)
    setOilGrade('')
  }

  // Computed totals
  const subtotal = watchItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price_display || 0), 0)

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        service_type_id: data.service_type_id,
        items: data.items.map(item => ({
          description: item.description,
          item_type: item.item_type,
          quantity: item.quantity,
          unit_price: toCents(item.unit_price_display),
          stock_item_id: item.stock_item_id || null,
        })),
      }
      return api.post('/service-cards', payload)
    },
    onSuccess: (res) => {
      const card = res.data.data.card
      addToast('success', `Service card ${card.card_no} created!`)
      openInvoiceModal(card.id)
      navigate('/service-cards')
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message ?? 'Failed to create service card')
    },
  })

  const onSubmit = (data: FormData) => mutation.mutate(data)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Service Card</h1>
          <p className="page-subtitle">Register a new vehicle service</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Vehicle Lookup */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🚗 Vehicle Lookup</div>
              {!selectedVehicle ? (
                <div>
                  <div className="search-wrap" style={{ marginBottom: 10 }}>
                    <Search className="search-icon" />
                    <input className="input" placeholder="Search by vehicle number..." value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} />
                  </div>
                  {(vehiclesData ?? []).map((v: any) => (
                    <div key={v.id} onClick={() => { setSelectedVehicle(v); form.setValue('vehicle_id', v.id); form.setValue('owner_id', v.owner_id) }}
                      style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-blue)' }}>{v.vehicle_no}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.brand?.name} {v.model} · {v.owner?.full_name}</div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  ))}
                  {form.formState.errors.vehicle_id && <span className="error-text">Vehicle is required</span>}
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--accent-blue)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 16, color: 'var(--accent-blue)' }}>{selectedVehicle.vehicle_no}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedVehicle.brand?.name} {selectedVehicle.model} · {selectedVehicle.owner?.full_name ?? 'Owner'} · {selectedVehicle.owner?.contact_no}</div>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSelectedVehicle(null); form.setValue('vehicle_id', ''); setVehicleSearch('') }}>Change</button>
                </div>
              )}
            </div>

            {/* Service Type */}
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🔧 Service Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="field-group">
                  <label className="label">Service Type *</label>
                  <select {...form.register('service_type_id')} className="input">
                    <option value="">Select type...</option>
                    {(serviceTypes ?? []).map((st: any) => <option key={st.id} value={st.id}>{st.label}</option>)}
                  </select>
                  {form.formState.errors.service_type_id && <span className="error-text">{form.formState.errors.service_type_id.message}</span>}
                </div>
                <div className="field-group">
                  <label className="label">Technician</label>
                  <select {...form.register('technician_id')} className="input">
                    <option value="">Unassigned</option>
                    {(technicians ?? []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="field-group">
                  <label className="label">Mileage at Service (km)</label>
                  <input {...form.register('mileage_at_service', { valueAsNumber: true })} type="number" className="input" placeholder="55000" />
                </div>
              </div>

              {isFullService && (
                <div style={{ marginTop: 20, background: 'var(--bg-secondary)', padding: 16, borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--accent-blue)' }}>🛢️ Oil Selection</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
                    <div className="field-group" style={{ marginBottom: 0 }}>
                      <label className="label" style={{ fontSize: 11 }}>Oil Brand</label>
                      <select className="select" value={oilBrand} onChange={e => { setOilBrand(e.target.value); setOilGrade('') }}>
                        <option value="">Select Brand...</option>
                        {Object.keys(oilOptions).map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="field-group" style={{ marginBottom: 0 }}>
                      <label className="label" style={{ fontSize: 11 }}>Type & Grade</label>
                      <select className="select" value={oilGrade} onChange={e => setOilGrade(e.target.value)} disabled={!oilBrand}>
                        <option value="">Select Grade...</option>
                        {(oilOptions[oilBrand] ?? []).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={handleOilAppend} style={{ height: 42 }}>
                      Add Oil
                    </button>
                  </div>
                </div>
              )}

              {isFullService && serviceTemplates.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <OilPackageSelector templateId={serviceTemplates[0].id} onPackageSelected={handlePackageSelected} />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div className="field-group">
                  <label className="label">Inspection Notes</label>
                  <textarea {...form.register('inspection_notes')} className="input" rows={3} placeholder="Defects observed, parts to check..." />
                </div>
                <div className="field-group">
                  <label className="label">Remarks</label>
                  <textarea {...form.register('remarks')} className="input" rows={3} placeholder="Customer instructions, notes..." />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>📋 Service Items</div>
                <button type="button" className="btn btn-secondary btn-sm"
                  onClick={() => append({ description: '', item_type: 'part', quantity: 1, unit_price_display: 0, stock_item_id: null, is_package_item: false, item_role: null })}>
                  <Plus size={14} /> Add Item
                </button>
              </div>

              {/* Stock search */}
              <div className="search-wrap" style={{ marginBottom: 12 }}>
                <Search className="search-icon" />
                <input className="input" placeholder="Search stock items to link..." value={stockSearch} onChange={e => { setStockSearch(e.target.value); setActiveItemIndex(fields.length - 1) }} />
              </div>
              {(stockItems ?? []).length > 0 && stockSearch && (
                <div style={{ marginBottom: 12, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
                  {(stockItems ?? []).map((s: any) => (
                    <div key={s.id} onClick={() => {
                      const idx = activeItemIndex ?? fields.length - 1
                      form.setValue(`items.${idx}.description`, s.name)
                      form.setValue(`items.${idx}.stock_item_id`, s.id)
                      form.setValue(`items.${idx}.unit_price_display`, s.unit_price / 100)
                      setStockSearch('')
                    }} style={{ padding: '8px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', fontSize: 13 }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span>{s.name} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({s.item_code})</span></span>
                      <span style={{ color: 'var(--accent-blue)' }}>LKR {(s.unit_price / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Description', 'Type', 'Qty', 'Unit Price (LKR)', 'Total', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', padding: '8px 6px', borderBottom: '1px solid var(--border)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const qty = watchItems[index]?.quantity || 0
                    const price = watchItems[index]?.unit_price_display || 0
                    const isPkg = watchItems[index]?.is_package_item || false

                    return (
                      <tr key={field.id} style={isPkg ? { background: 'var(--bg-secondary)', opacity: 0.9 } : undefined}>
                        <td style={{ padding: '6px 4px' }}>
                          <input {...form.register(`items.${index}.description`)} className="input" style={{ padding: '6px 10px', fontSize: 13 }} placeholder="Description" onFocus={() => setActiveItemIndex(index)} />
                        </td>
                        <td style={{ padding: '6px 4px' }}>
                          <select {...form.register(`items.${index}.item_type`)} className="input" style={{ padding: '6px 10px', fontSize: 13 }}>
                            <option value="labour">Labour</option>
                            <option value="part">Part</option>
                            <option value="consumable">Consumable</option>
                          </select>
                        </td>
                        <td style={{ padding: '6px 4px', width: 80 }}>
                          <input {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} type="number" step="0.01" min="0.01" className="input" style={{ padding: '6px 10px', fontSize: 13 }} />
                        </td>
                        <td style={{ padding: '6px 4px', width: 130 }}>
                          <input {...form.register(`items.${index}.unit_price_display`, { valueAsNumber: true })} type="number" step="0.01" min="0" className="input" style={{ padding: '6px 10px', fontSize: 13 }} />
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
                          {formatAmount(toCents(qty * price))}
                        </td>
                        <td style={{ padding: '6px 4px' }}>
                          <button type="button" onClick={() => remove(index)} className="btn btn-danger btn-icon btn-sm" disabled={fields.length === 1}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {form.formState.errors.items && <span className="error-text" style={{ marginTop: 8, display: 'block' }}>{form.formState.errors.items.message as string}</span>}
            </div>
          </div>

          {/* Right Column — Summary */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>💰 Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>Items</span><span>{fields.length}</span>
                </div>
                <hr className="divider" style={{ margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
                  <span>Subtotal</span>
                  <span style={{ color: 'var(--accent-blue)' }}>{formatCurrency(toCents(subtotal))}</span>
                </div>
              </div>
            </div>

            <button type="submit" disabled={mutation.isPending || !selectedVehicle} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              {mutation.isPending ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : '✓ Create Card + Generate Invoice'}
            </button>
            <button type="button" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
