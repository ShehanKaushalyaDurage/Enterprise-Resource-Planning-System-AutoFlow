import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Save } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'

const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'technician', 'cashier', 'receptionist']),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  is_active: z.boolean(),
})

type UserFormValues = z.infer<typeof userSchema>

export default function UserForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'receptionist',
      is_active: true,
    },
  })

  // Fetch data if editing
  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get(`/users/${id}`).then(r => r.data.data),
    enabled: isEditing,
  })

  useEffect(() => {
    if (userData) {
      reset({
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        role: userData.role,
        is_active: userData.is_active,
        password: '', // never populate password
      })
    }
  }, [userData, reset])

  const mutation = useMutation({
    mutationFn: (data: UserFormValues) => {
      // Remove empty password if not changing
      if (isEditing && !data.password) {
        delete data.password
      }
      return isEditing ? api.put(`/users/${id}`, data) : api.post('/users', data)
    },
    onSuccess: () => {
      addToast('success', `User ${isEditing ? 'updated' : 'created'} successfully`)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate('/settings/users')
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message || 'Failed to save user')
    },
  })

  if (isEditing && isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/settings/users')} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Back to Users
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">{isEditing ? 'Edit User' : 'New User'}</h1>
          <p className="page-subtitle">Configure system access and roles</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="label">Full Name *</label>
            <input className="input" placeholder="e.g. John Doe" {...register('name')} />
            {errors.name && <div className="error-message">{errors.name.message}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="form-group">
              <label className="label">Email Address *</label>
              <input type="email" className="input" placeholder="e.g. john@autoflow.test" {...register('email')} />
              {errors.email && <div className="error-message">{errors.email.message}</div>}
            </div>
            <div className="form-group">
              <label className="label">Phone Number</label>
              <input className="input" placeholder="e.g. 0771234567" {...register('phone')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="form-group">
              <label className="label">Role *</label>
              <select className="input" {...register('role')}>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="technician">Technician</option>
                <option value="cashier">Cashier</option>
                <option value="receptionist">Receptionist</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">{isEditing ? 'New Password' : 'Password *'}</label>
              <input 
                type="password" 
                className="input" 
                placeholder={isEditing ? "Leave blank to keep unchanged" : "Min 8 characters"} 
                {...register('password')} 
              />
              {errors.password && <div className="error-message">{errors.password.message}</div>}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" {...register('is_active')} />
              <span style={{ fontWeight: 500 }}>Account is Active (Can log in)</span>
            </label>
          </div>
        </div>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/settings/users')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending || isSubmitting}>
            <Save size={16} /> {isEditing ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}
