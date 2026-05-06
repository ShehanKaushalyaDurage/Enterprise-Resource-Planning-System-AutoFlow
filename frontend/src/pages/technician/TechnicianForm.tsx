import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Save, Shield, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'

interface Props {
  technician?: any
  onClose: () => void
}

export default function TechnicianForm({ technician, onClose }: Props) {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()

  // User Section
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  // Profile Section
  const [specialization, setSpecialization] = useState<string[]>([])
  const [certification, setCertification] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [workshopBay, setWorkshopBay] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)

  useEffect(() => {
    if (technician) {
      setName(technician.user?.name || '')
      setEmail(technician.user?.email || '')
      setPhone(technician.user?.phone || '')
      setSpecialization(technician.specialization || [])
      setCertification(technician.certification || '')
      setExperienceYears(technician.experience_years ? String(technician.experience_years) : '')
      setWorkshopBay(technician.workshop_bay || '')
      setIsAvailable(!!technician.is_available)
    }
  }, [technician])

  const mutation = useMutation({
    mutationFn: () => {
      if (technician) {
        // Only profile fields supported on update
        return api.put(`/technicians/${technician.id}`, {
          specialization,
          certification: certification || null,
          experience_years: experienceYears ? parseInt(experienceYears) : null,
          is_available: isAvailable,
          workshop_bay: workshopBay || null,
        })
      } else {
        return api.post('/technicians', {
          name, email, phone, password,
          specialization,
          certification: certification || null,
          experience_years: experienceYears ? parseInt(experienceYears) : null,
          is_available: isAvailable,
          workshop_bay: workshopBay || null,
        })
      }
    },
    onSuccess: () => {
      addToast('success', technician ? 'Profile updated successfully.' : 'Technician registered successfully.')
      queryClient.invalidateQueries({ queryKey: ['technicians'] })
      onClose()
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message || 'Action failed.')
    }
  })

  const handleToggleSpecialization = (spec: string) => {
    setSpecialization(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    )
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {technician ? `Update Profile: ${technician.user?.name}` : 'Register Workshop Technician'}
          </h2>
          <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleFormSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Section 1: Create user profile fields */}
          {!technician && (
            <>
              <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>
                <Shield size={16} /> <strong>User Login Information</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field-group">
                  <label className="label">Full Name*</label>
                  <input required className="input" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="label">Work Email*</label>
                  <input required className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field-group">
                  <label className="label">Phone Contact</label>
                  <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="label">Secure Password*</label>
                  <input required className="input" type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* Section 2: Extended Technician Profile */}
          <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 2, borderTop: technician ? '' : '1px solid var(--border)', paddingTop: technician ? 0 : 12 }}>
            <strong>🔧 Workshop Profile Details</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field-group">
              <label className="label">Years of Experience</label>
              <input className="input" type="number" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="label">Workshop Bay / Station</label>
              <input className="input" placeholder="e.g. Bay #1" value={workshopBay} onChange={e => setWorkshopBay(e.target.value)} />
            </div>
          </div>

          <div className="field-group">
            <label className="label">Certification/Qualifications</label>
            <input className="input" placeholder="e.g. Master Tech Level 3" value={certification} onChange={e => setCertification(e.target.value)} />
          </div>

          <div className="field-group">
            <label className="label" style={{ marginBottom: 6 }}>Service Specialties</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { id: 'engine', label: 'Engine' },
                { id: 'electrical', label: 'Electrical Diagnostics' },
                { id: 'bodywork', label: 'Bodywork / Spray' },
                { id: 'ac_repair', label: 'A/C Conditioning' }
              ].map(spec => (
                <label key={spec.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 16, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={specialization.includes(spec.id)}
                    onChange={() => handleToggleSpecialization(spec.id)}
                  />
                  {spec.label}
                </label>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label className="label">Available Status</label>
            <select className="select" value={isAvailable ? '1' : '0'} onChange={e => setIsAvailable(e.target.value === '1')}>
              <option value="1">Available</option>
              <option value="0">Unavailable</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {technician ? 'Update Workshop Profile' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
