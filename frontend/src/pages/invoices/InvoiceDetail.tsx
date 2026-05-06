import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, FileText } from 'lucide-react'
import api from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { openInvoiceModal } = useUIStore()

  // We fetch just enough info to know which service card to open the modal for,
  // or we could just render the modal directly. For now, redirect to the modal
  // or show it inline. We'll show a simple wrapper.

  const { data: inv, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get(`/invoices/${id}`).then(r => r.data.data),
  })

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
  }

  if (!inv) {
    return <div className="empty-state">Invoice not found</div>
  }

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/invoices')} style={{ marginBottom: 16 }}>
        <ChevronLeft size={16} /> Back to List
      </button>

      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <FileText size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
        <h2 style={{ marginBottom: 8 }}>Invoice {inv.invoice_no}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Invoices are managed through the Service Card Invoice Modal.
        </p>
        <button className="btn btn-primary" onClick={() => openInvoiceModal(inv.service_card_id)} style={{ margin: '0 auto' }}>
          Open Invoice Modal
        </button>
      </div>
    </div>
  )
}
