import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Save, Key, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'

interface Props {
  user?: any
  onClose: () => void
}

export default function UserForm({ user, onClose }: Props) {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('receptionist')
  const [password, setPassword] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [joinedDate, setJoinedDate] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [notes, setNotes] = useState('')

  const [pwdReason, setPwdReason] = useState('')
  const [pwdModalOpen, setPwdModalOpen] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setRole(user.role || 'receptionist')
      setDateOfBirth(user.date_of_birth || '')
      setJoinedDate(user.joined_date || '')
      setEmergencyContact(user.emergency_contact || '')
      setNotes(user.notes || '')
    }
  }, [user])

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name, email, phone, role,
        date_of_birth: dateOfBirth || null,
        joined_date: joinedDate || null,
        emergency_contact: emergencyContact || null,
        notes: notes || null,
        ...(user ? {} : { password }),
      }
      return user ? api.put(`/users/${user.id}`, payload) : api.post('/users', payload)
    },
    onSuccess: () => {
      addToast('success', user ? 'User updated successfully.' : 'User created successfully.')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message || 'Action failed.')
    }
  })

  const pwdMutation = useMutation({
    mutationFn: () => api.post(`/users/${user.id}/reset-password`, { password, reason: pwdReason }),
    onSuccess: () => {
      addToast('success', 'User password updated successfully.')
      setPwdModalOpen(false)
      setPassword('')
      setPwdReason('')
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message || 'Password update failed.')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {user ? `Edit User: ${user.name}` : 'Create New User'}
          </h2>
          <button className="btn btn-secondary btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field-group">
              <label className="label">Full Name*</label>
              <input required className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="label">Email Address*</label>
              <input required className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field-group">
              <label className="label">Phone Number</label>
              <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="label">Access Role*</label>
              <select className="select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="receptionist">Receptionist</option>
                <option value="technician">Technician</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field-group">
              <label className="label">Date of Birth</label>
              <input className="input" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="label">Joined Date</label>
              <input className="input" type="date" value={joinedDate} onChange={e => setJoinedDate(e.target.value)} />
            </div>
          </div>

          <div className="field-group">
            <label className="label">Emergency Contact Details</label>
            <input className="input" placeholder="Name, Relationship, Phone" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} />
          </div>

          <div className="field-group">
            <label className="label">Staff Notes / Comments</label>
            <textarea className="input" style={{ height: 60 }} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {!user && (
            <div className="field-group">
              <label className="label">Initial Password*</label>
              <input required className="input" type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            {user && (
              <button type="button" className="btn btn-secondary" onClick={() => setPwdModalOpen(true)}>
                <Key size={16} /> Reset Password
              </button>
            )}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {user ? 'Update Profile' : 'Register Staff'}
              </button>
            </div>
          </div>
        </form>

        {/* Change password sub-modal */}
        {pwdModalOpen && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPwdModalOpen(false)}>
            <div className="modal-content" style={{ maxWidth: 420, marginTop: 120 }}>
              <div className="modal-header">
                <h3 style={{ fontWeight: 700 }}>🔐 Override Password</h3>
                <button className="btn btn-secondary btn-icon" onClick={() => setPwdModalOpen(false)}><X size={18} /></button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="field-group">
                  <label className="label">New Secure Password*</label>
                  <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="label">Override Reason*</label>
                  <input className="input" value={pwdReason} onChange={e => setPwdReason(e.target.value)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-secondary" onClick={() => setPwdModalOpen(false)}>Cancel</button>
                  <button className="btn btn-primary" disabled={pwdMutation.isPending || !password} onClick={() => pwdMutation.mutate()}>
                    {pwdMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Reset'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
