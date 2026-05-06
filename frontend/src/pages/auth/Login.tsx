import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const { setUser } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: false },
  })

  const onSubmit = async (data: FormData) => {
    setApiError('')
    try {
      const res = await api.post('/auth/login', data)
      setUser(res.data.data)
      navigate('/dashboard')
    } catch (err: any) {
      setApiError(err.response?.data?.message ?? 'Login failed. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Welcome back</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sign in to your AutoFlow account</p>
      </div>

      {apiError && (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: 'var(--accent-red)', fontSize: 13,
        }}>
          {apiError}
        </div>
      )}

      <div className="field-group">
        <label className="label">Email address</label>
        <input
          {...register('email')}
          type="email"
          className={`input ${errors.email ? 'input-error' : ''}`}
          placeholder="admin@autoflow.test"
          autoComplete="email"
          autoFocus
        />
        {errors.email && <span className="error-text">{errors.email.message}</span>}
      </div>

      <div className="field-group">
        <label className="label">Password</label>
        <div style={{ position: 'relative' }}>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            className={`input ${errors.password ? 'input-error' : ''}`}
            placeholder="••••••••"
            autoComplete="current-password"
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <span className="error-text">{errors.password.message}</span>}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
        <input {...register('remember')} type="checkbox" style={{ accentColor: 'var(--accent-blue)' }} />
        Remember me
      </label>

      <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
        {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign in'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
        Demo: admin@autoflow.test / password
      </p>
    </form>
  )
}
