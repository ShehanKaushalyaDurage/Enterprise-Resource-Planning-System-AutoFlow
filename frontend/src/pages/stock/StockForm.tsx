import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Save } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'

const stockSchema = z.object({
  item_code: z.string().min(2, 'Item code is required'),
  name: z.string().min(2, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  unit_of_measure: z.enum(['pcs', 'liters', 'kg', 'meters']),
  location: z.string().optional(),
  reorder_level: z.number().min(0),
  reorder_qty: z.number().min(0),
  unit_cost: z.number().min(0, 'Must be positive'),
  unit_price: z.number().min(0, 'Must be positive'),
  is_active: z.boolean(),
})

type StockFormValues = z.infer<typeof stockSchema>

export default function StockForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      category: 'spare_part',
      unit_of_measure: 'pcs',
      reorder_level: 5,
      reorder_qty: 10,
      is_active: true,
      unit_cost: 0,
      unit_price: 0,
    },
  })

  // Fetch data if editing
  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock-item', id],
    queryFn: () => api.get(`/stock-items/${id}`).then(r => r.data.data),
    enabled: isEditing,
  })

  useEffect(() => {
    if (stockData) {
      reset({
        item_code: stockData.item_code,
        name: stockData.name,
        category: stockData.category,
        unit_of_measure: stockData.unit_of_measure,
        location: stockData.location || '',
        reorder_level: Number(stockData.reorder_level),
        reorder_qty: Number(stockData.reorder_qty),
        unit_cost: stockData.unit_cost / 100, // convert cents to decimal for input
        unit_price: stockData.unit_price / 100,
        is_active: stockData.is_active,
      })
    }
  }, [stockData, reset])

  const mutation = useMutation({
    mutationFn: (data: StockFormValues) => {
      // convert back to cents
      const payload = {
        ...data,
        unit_cost: Math.round(data.unit_cost * 100),
        unit_price: Math.round(data.unit_price * 100),
      }
      return isEditing ? api.put(`/stock-items/${id}`, payload) : api.post('/stock-items', payload)
    },
    onSuccess: () => {
      addToast('success', `Stock item ${isEditing ? 'updated' : 'created'} successfully`)
      queryClient.invalidateQueries({ queryKey: ['stock-items'] })
      navigate('/stock')
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message || 'Failed to save stock item')
    },
  })

  if (isEditing && isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/stock')} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Back to List
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">{isEditing ? 'Edit Stock Item' : 'New Stock Item'}</h1>
          <p className="page-subtitle">Register a new part or consumable in the system</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="form-group">
            <label className="label">Item Code *</label>
            <input className="input" placeholder="e.g. O-124-B" {...register('item_code')} />
            {errors.item_code && <div className="error-message">{errors.item_code.message}</div>}
          </div>

          <div className="form-group">
            <label className="label">Name *</label>
            <input className="input" placeholder="e.g. Oil Filter" {...register('name')} />
            {errors.name && <div className="error-message">{errors.name.message}</div>}
          </div>

          <div className="form-group">
            <label className="label">Category *</label>
            <select className="input" {...register('category')}>
              <option value="spare_part">Spare Part</option>
              <option value="consumable">Consumable</option>
              <option value="lubricant">Lubricant</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">Unit of Measure *</label>
            <select className="input" {...register('unit_of_measure')}>
              <option value="pcs">Pieces (pcs)</option>
              <option value="liters">Liters</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="meters">Meters</option>
            </select>
          </div>
        </div>

        <h3 style={{ marginTop: 24, marginBottom: 16, fontSize: 16 }}>Pricing & Inventory</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="form-group">
            <label className="label">Unit Cost (LKR)</label>
            <input className="input" type="number" step="0.01" {...register('unit_cost', { valueAsNumber: true })} />
            {errors.unit_cost && <div className="error-message">{errors.unit_cost.message}</div>}
          </div>

          <div className="form-group">
            <label className="label">Unit Price (LKR) *</label>
            <input className="input" type="number" step="0.01" {...register('unit_price', { valueAsNumber: true })} />
            {errors.unit_price && <div className="error-message">{errors.unit_price.message}</div>}
          </div>

          <div className="form-group">
            <label className="label">Reorder Level (Alert Threshold) *</label>
            <input className="input" type="number" {...register('reorder_level', { valueAsNumber: true })} />
            {errors.reorder_level && <div className="error-message">{errors.reorder_level.message}</div>}
          </div>

          <div className="form-group">
            <label className="label">Reorder Quantity *</label>
            <input className="input" type="number" {...register('reorder_qty', { valueAsNumber: true })} />
            {errors.reorder_qty && <div className="error-message">{errors.reorder_qty.message}</div>}
          </div>
        </div>

        <h3 style={{ marginTop: 24, marginBottom: 16, fontSize: 16 }}>Location</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          <div className="form-group">
            <label className="label">Location (e.g. Aisle 1, Rack A)</label>
            <input className="input" placeholder="e.g. A1-R4" {...register('location')} />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" {...register('is_active')} />
            <span style={{ fontWeight: 500 }}>Active (Available for use)</span>
          </label>
        </div>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/stock')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending || isSubmitting}>
            <Save size={16} /> {isEditing ? 'Update Item' : 'Save Item'}
          </button>
        </div>
      </form>
    </div>
  )
}
