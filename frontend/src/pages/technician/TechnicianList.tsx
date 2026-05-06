import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, ShieldCheck, ToggleLeft, ToggleRight, Sparkles, UserCog, Trophy, Eye, X } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'
import { formatCurrency } from '@/lib/formatters'
import TechnicianForm from './TechnicianForm'
import CircularProgress from '@/components/technician/CircularProgress'

export default function TechnicianList() {
  const queryClient = useQueryClient()
  const { addToast } = useUIStore()

  const [activeTab, setActiveTab] = useState<'roster' | 'leaderboard'>('roster')
  const [availability, setAvailability] = useState('')
  const [specialization, setSpecialization] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingTech, setEditingTech] = useState<any>(null)

  const [selectedTech, setSelectedTech] = useState<any>(null)
  const [progressOpen, setProgressOpen] = useState(false)

  const { data: techsData, isLoading: isLoadingTechs } = useQuery({
    queryKey: ['technicians', availability, specialization],
    queryFn: () => api.get('/technicians', {
      params: { is_available: availability || null, specialization: specialization || null }
    }).then(r => r.data.data),
  })

  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['technicians-leaderboard'],
    queryFn: () => api.get('/technicians/leaderboard').then(r => r.data.data),
    enabled: activeTab === 'leaderboard',
  })

  const { data: techProgress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['technicians-progress', selectedTech?.id],
    queryFn: () => api.get(`/technicians/${selectedTech?.id}/progress`).then(r => r.data.data),
    enabled: !!selectedTech && progressOpen,
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/technicians/${id}/toggle-available`),
    onSuccess: () => {
      addToast('success', 'Technician availability updated.')
      queryClient.invalidateQueries({ queryKey: ['technicians'] })
    },
    onError: () => addToast('error', 'Status update failed.')
  })

  const techs = techsData?.data ?? []

  const handleEdit = (t: any) => {
    setEditingTech(t)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditingTech(null)
    setFormOpen(true)
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Workshop Technicians & Leaderboard</h1>
          <p className="page-subtitle">Track workshop profiles, skills, and productivity</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={16} style={{ marginRight: 6 }} /> Register Technician
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button className={`btn ${activeTab === 'roster' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('roster')}>
          <Users size={16} style={{ marginRight: 6 }} /> Active Technicians
        </button>
        <button className={`btn ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('leaderboard')}>
          <Trophy size={16} style={{ marginRight: 6 }} /> Performance & Leaderboard
        </button>
      </div>

      {activeTab === 'roster' && (
        <>
          <div className="card-elevated" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <select className="select" value={availability} onChange={e => setAvailability(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="true">Available Only</option>
                <option value="false">Unavailable Only</option>
              </select>
            </div>
            <div>
              <select className="select" value={specialization} onChange={e => setSpecialization(e.target.value)}>
                <option value="">All Specializations</option>
                <option value="engine">Engine Specialist</option>
                <option value="electrical">Electrical Diagnostics</option>
                <option value="bodywork">Body & Paint</option>
                <option value="ac_repair">A/C Climate Control</option>
              </select>
            </div>
          </div>

          {isLoadingTechs ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
          ) : techs.length === 0 ? (
            <div className="empty-state">
              <Sparkles size={48} style={{ opacity: 0.3 }} />
              <h3>No technicians found</h3>
              <p>Add your workshop staff to start assigning service card jobs.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {techs.map((t: any) => (
                <div key={t.id} className="card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="badge" style={{ fontFamily: 'monospace', fontSize: 11, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {t.technician_code}
                      </span>
                      <span className={`badge badge-${t.is_available ? 'success' : 'secondary'}`}>
                        {t.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 8, color: 'var(--text-primary)' }}>{t.user?.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{t.user?.email}</div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                      {t.specialization && t.specialization.map((spec: string) => (
                        <span key={spec} className="badge" style={{ textTransform: 'capitalize', fontSize: 11 }}>
                          {spec.replace('_', ' ')}
                        </span>
                      ))}
                    </div>

                    {t.workshop_bay && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Bay: <strong>{t.workshop_bay}</strong>
                      </div>
                    )}
                    {t.certification && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Cert: <strong>{t.certification}</strong>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 10, gap: 6 }}>
                    <button className="btn btn-secondary btn-icon" onClick={() => handleEdit(t)} title="Edit">
                      <UserCog size={16} />
                    </button>
                    <button className="btn btn-secondary btn-icon" onClick={() => toggleMutation.mutate(t.id)} title="Toggle Status">
                      {t.is_available ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'leaderboard' && (
        <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoadingLeaderboard ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Technician Name</th>
                  <th>Completed Job Cards</th>
                  <th>Total Revenue Generated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(leaderboard || []).map((t: any, idx: number) => (
                  <tr key={t.id}>
                    <td>
                      <span className="badge" style={{ fontWeight: 700, background: idx === 0 ? 'var(--warning-light)' : (idx === 1 ? 'var(--border)' : 'none') }}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td>{t.total_cards} cards</td>
                    <td>{formatCurrency(t.total_revenue)}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm btn-icon"
                        onClick={() => {
                          setSelectedTech(t)
                          setProgressOpen(true)
                        }}
                        title="View Detailed Performance"
                      >
                        <Eye size={14} style={{ marginRight: 4 }} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Progress Detail Modal */}
      {progressOpen && selectedTech && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="modal-content card-elevated" style={{ width: '100%', maxWidth: 440, padding: 24, position: 'relative' }}>
            <button
              onClick={() => { setProgressOpen(false); setSelectedTech(null) }}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: 0, color: 'var(--text-primary)', marginBottom: 2 }}>Performance Details</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{selectedTech.name}</p>

            {isLoadingProgress ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
                <CircularProgress value={techProgress?.productivity_score || 0} size={130} strokeWidth={11} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', gap: 12 }}>
                  <div className="card-elevated" style={{ textAlign: 'center', padding: '12px 6px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed Cards</div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{techProgress?.total_cards || 0}</div>
                  </div>
                  <div className="card-elevated" style={{ textAlign: 'center', padding: '12px 6px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Duration</div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{techProgress?.avg_duration || 0} hrs</div>
                  </div>
                </div>

                <div className="card-elevated" style={{ width: '100%', textAlign: 'center', padding: '14px 6px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue Generated</div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: 'var(--success)' }}>
                    {formatCurrency(techProgress?.total_revenue || 0)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {formOpen && (
        <TechnicianForm
          technician={editingTech}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  )
}
