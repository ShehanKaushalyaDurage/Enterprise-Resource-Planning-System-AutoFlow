import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Trash2, Edit2, Car } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'

export default function VehicleBrandList() {
  const navigate = useNavigate()
  const { addToast } = useUIStore()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [brandName, setBrandName] = useState('')
  const [isActive, setIsActive] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['vehicle-brands'],
    queryFn: () => api.get('/vehicle-brands', { params: { search } }).then(r => r.data.data),
  })

  const brands = data ?? []

  const saveMutation = useMutation({
    mutationFn: (payload: { name: string, is_active: boolean }) => {
      return editId 
        ? api.put(`/vehicle-brands/${editId}`, payload)
        : api.post('/vehicle-brands', payload)
    },
    onSuccess: () => {
      addToast('success', `Brand ${editId ? 'updated' : 'created'} successfully`)
      queryClient.invalidateQueries({ queryKey: ['vehicle-brands'] })
      closeModal()
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message || 'Failed to save brand')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicle-brands/${id}`),
    onSuccess: () => {
      addToast('success', 'Brand deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['vehicle-brands'] })
    },
    onError: (err: any) => {
      addToast('error', err.response?.data?.message || 'Failed to delete brand')
    },
  })

  const openModal = (brand?: any) => {
    if (brand) {
      setEditId(brand.id)
      setBrandName(brand.name)
      setIsActive(brand.is_active)
    } else {
      setEditId(null)
      setBrandName('')
      setIsActive(true)
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditId(null)
    setBrandName('')
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!brandName.trim()) {
      addToast('error', 'Brand name is required')
      return
    }
    saveMutation.mutate({ name: brandName.trim(), is_active: isActive })
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicle Brands</h1>
          <p className="page-subtitle">Manage the list of vehicle brands available in the system</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Add Brand
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-wrap" style={{ maxWidth: 420 }}>
          <Search className="search-icon" />
          <input
            className="input"
            placeholder="Search brands..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : brands.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <Car size={48} />
            <h3>No brands found</h3>
            <p>Add a new vehicle brand to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Brand Name</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand: any) => (
                <tr key={brand.id}>
                  <td style={{ fontWeight: 600 }}>{brand.name}</td>
                  <td>
                    <span className={`badge badge-${brand.is_active ? 'success' : 'secondary'}`}>
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openModal(brand)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteMutation.mutate(brand.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 400 }}>
            <h3 style={{ marginBottom: 16 }}>{editId ? 'Edit Brand' : 'New Brand'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="label">Brand Name *</label>
                <input className="input" required value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Toyota" />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                  <span style={{ fontWeight: 500 }}>Active (Available for selection)</span>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
