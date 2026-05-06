import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, User, Car, ChevronRight, ChevronLeft, Loader2, Check } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'

// ── Step 1: Owner ────────────────────────────────────────────────────────────
const ownerSchema = z.object({
  full_name:  z.string().min(2, 'Name is required'),
  contact_no: z.string().min(6, 'Contact number is required'),
  email:      z.string().email('Invalid email').or(z.literal('')).optional(),
  address:    z.string().min(3, 'Address is required'),
  nic_no:     z.string().optional(),
})

// ── Step 2: Vehicle ──────────────────────────────────────────────────────────
const vehicleSchema = z.object({
  vehicle_no:               z.string().min(2, 'Vehicle number is required'),
  brand_id:                 z.string().min(1, 'Brand is required'),
  model:                    z.string().min(1, 'Model is required'),
  category:                 z.enum(['car', 'van', 'bike', 'truck', 'bus']),
  fuel_type:                z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
  color:                    z.string().min(1, 'Color is required'),
  year_of_manufacture:      z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().or(z.literal('')),
  mileage_at_registration:  z.number().min(0).optional().or(z.literal('')),
})

type OwnerForm  = z.infer<typeof ownerSchema>
type VehicleForm = z.infer<typeof vehicleSchema>

export default function VehicleWizard() {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const [step, setStep] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedOwner, setSelectedOwner] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)

  const ownerForm  = useForm<OwnerForm>({ resolver: zodResolver(ownerSchema) })
  const vehicleForm = useForm<VehicleForm>({ resolver: zodResolver(vehicleSchema) })

  const { data: brandsData } = useQuery({
    queryKey: ['vehicle-brands', 'active'],
    queryFn: () => api.get('/vehicle-brands', { params: { active_only: true } }).then(r => r.data.data),
  })
  const vehicleBrands = brandsData ?? []

  // Search existing owners
  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    setIsSearching(true)
    try {
      const res = await api.get('/owners', { params: { search: searchTerm, per_page: 10 } })
      setSearchResults(res.data.data.data ?? [])
    } finally { setIsSearching(false) }
  }

  // Step 1 submit: create or use existing owner
  const handleOwnerSubmit = async (data: OwnerForm) => {
    try {
      const res = await api.post('/owners', data)
      setSelectedOwner(res.data.data)
      addToast('success', `Owner "${res.data.data.full_name}" created`)
      setStep(2)
    } catch (err: any) {
      addToast('error', err.response?.data?.message ?? 'Failed to create owner')
    }
  }

  // Step 2 submit: create vehicle linked to owner
  const handleVehicleSubmit = async (data: VehicleForm) => {
    try {
      const payload = {
        ...data,
        owner_id: selectedOwner.id,
        vehicle_no: String(data.vehicle_no).toUpperCase(),
        year_of_manufacture: data.year_of_manufacture ? Number(data.year_of_manufacture) : undefined,
        mileage_at_registration: data.mileage_at_registration ? Number(data.mileage_at_registration) : undefined,
      }
      await api.post('/vehicles', payload)
      addToast('success', `Vehicle ${payload.vehicle_no} registered successfully!`)
      navigate('/vehicles')
    } catch (err: any) {
      addToast('error', err.response?.data?.message ?? 'Failed to register vehicle')
    }
  }

  const StepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {[1, 2].map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s === 1 ? '0 0 auto' : 1 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: step >= s ? 'var(--accent-blue)' : 'var(--bg-elevated)',
            border: `2px solid ${step >= s ? 'var(--accent-blue)' : 'var(--border)'}`,
            color: step >= s ? '#fff' : 'var(--text-muted)', fontWeight: 700, fontSize: 14, flexShrink: 0,
          }}>
            {step > s ? <Check size={16} /> : s}
          </div>
          <div style={{ marginLeft: 8, marginRight: i === 0 ? 0 : 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: step >= s ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {s === 1 ? 'Owner' : 'Vehicle'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {s === 1 ? 'Register or find owner' : 'Vehicle details'}
            </div>
          </div>
          {i === 0 && <div style={{ flex: 1, height: 2, margin: '0 16px', background: step > 1 ? 'var(--accent-blue)' : 'var(--border)' }} />}
        </div>
      ))}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Register Vehicle</h1>
          <p className="page-subtitle">Two-step wizard: owner → vehicle</p>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <StepIndicator />

        {/* Step 1: Owner */}
        {step === 1 && (
          <div className="card">
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} style={{ color: 'var(--accent-blue)' }} /> Step 1 — Owner Information
            </div>

            {/* Search existing */}
            <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>🔍 Search existing owner</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  placeholder="Search by name, NIC, or phone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button className="btn btn-secondary" onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {searchResults.map((o: any) => (
                    <div key={o.id}
                      onClick={() => { setSelectedOwner(o); setStep(2) }}
                      style={{
                        padding: '10px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)',
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{o.full_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.contact_no} {o.nic_no ? `· NIC: ${o.nic_no}` : ''}</div>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--accent-blue)' }}>Select →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>— or create new owner —</div>

            <form onSubmit={ownerForm.handleSubmit(handleOwnerSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="field-group">
                  <label className="label">Full Name *</label>
                  <input {...ownerForm.register('full_name')} className={`input ${ownerForm.formState.errors.full_name ? 'input-error' : ''}`} placeholder="John Silva" />
                  {ownerForm.formState.errors.full_name && <span className="error-text">{ownerForm.formState.errors.full_name.message}</span>}
                </div>
                <div className="field-group">
                  <label className="label">Contact Number *</label>
                  <input {...ownerForm.register('contact_no')} className={`input ${ownerForm.formState.errors.contact_no ? 'input-error' : ''}`} placeholder="+94771234567" />
                  {ownerForm.formState.errors.contact_no && <span className="error-text">{ownerForm.formState.errors.contact_no.message}</span>}
                </div>
                <div className="field-group">
                  <label className="label">Email</label>
                  <input {...ownerForm.register('email')} type="email" className="input" placeholder="john@email.com" />
                </div>
                <div className="field-group">
                  <label className="label">NIC Number</label>
                  <input {...ownerForm.register('nic_no')} className="input" placeholder="200012345678" />
                </div>
              </div>
              <div className="field-group">
                <label className="label">Address *</label>
                <textarea {...ownerForm.register('address')} className={`input ${ownerForm.formState.errors.address ? 'input-error' : ''}`} placeholder="123 Main Street, Colombo 03" rows={2} />
                {ownerForm.formState.errors.address && <span className="error-text">{ownerForm.formState.errors.address.message}</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={ownerForm.formState.isSubmitting} className="btn btn-primary">
                  {ownerForm.formState.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  Create Owner & Continue <ChevronRight size={16} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Vehicle */}
        {step === 2 && selectedOwner && (
          <div>
            {/* Owner Summary Card */}
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', fontWeight: 700, fontSize: 16 }}>{selectedOwner.full_name[0]}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedOwner.full_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedOwner.contact_no} {selectedOwner.nic_no ? `· NIC: ${selectedOwner.nic_no}` : ''}</div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setStep(1)}>
                <ChevronLeft size={14} /> Change Owner
              </button>
            </div>

            <div className="card">
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Car size={18} style={{ color: 'var(--accent-blue)' }} /> Step 2 — Vehicle Details
              </div>

              <form onSubmit={vehicleForm.handleSubmit(handleVehicleSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div className="field-group">
                    <label className="label">Vehicle Number *</label>
                    <input {...vehicleForm.register('vehicle_no')} className={`input ${vehicleForm.formState.errors.vehicle_no ? 'input-error' : ''}`} placeholder="ABC-1234" style={{ textTransform: 'uppercase' }} />
                    {vehicleForm.formState.errors.vehicle_no && <span className="error-text">{vehicleForm.formState.errors.vehicle_no.message}</span>}
                  </div>
                  <div className="field-group">
                    <label className="label">Brand *</label>
                    <select {...vehicleForm.register('brand_id')} className={`input ${vehicleForm.formState.errors.brand_id ? 'input-error' : ''}`}>
                      <option value="">Select a brand...</option>
                      {vehicleBrands.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    {vehicleForm.formState.errors.brand_id && <span className="error-text">{vehicleForm.formState.errors.brand_id.message}</span>}
                  </div>
                  <div className="field-group">
                    <label className="label">Model *</label>
                    <input {...vehicleForm.register('model')} className="input" placeholder="Corolla" />
                  </div>
                  <div className="field-group">
                    <label className="label">Category *</label>
                    <select {...vehicleForm.register('category')} className="input">
                      <option value="">Select...</option>
                      {['car', 'van', 'bike', 'truck', 'bus'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="label">Fuel Type *</label>
                    <select {...vehicleForm.register('fuel_type')} className="input">
                      <option value="">Select...</option>
                      {['petrol', 'diesel', 'electric', 'hybrid'].map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="label">Color *</label>
                    <input {...vehicleForm.register('color')} className="input" placeholder="White" />
                  </div>
                  <div className="field-group">
                    <label className="label">Year of Manufacture</label>
                    <input {...vehicleForm.register('year_of_manufacture', { valueAsNumber: true })} type="number" className="input" placeholder="2020" min={1900} max={new Date().getFullYear() + 1} />
                  </div>
                  <div className="field-group">
                    <label className="label">Mileage at Registration (km)</label>
                    <input {...vehicleForm.register('mileage_at_registration', { valueAsNumber: true })} type="number" className="input" placeholder="45000" min={0} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button type="submit" disabled={vehicleForm.formState.isSubmitting} className="btn btn-primary">
                    {vehicleForm.formState.isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Register Vehicle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
