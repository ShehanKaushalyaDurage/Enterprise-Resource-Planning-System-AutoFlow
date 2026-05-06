import { create } from 'zustand'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface UIStore {
  toasts: Toast[]
  invoiceModalOpen: boolean
  invoiceModalServiceCardId: string | null
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: string) => void
  openInvoiceModal: (serviceCardId: string) => void
  closeInvoiceModal: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  toasts: [],
  invoiceModalOpen: false,
  invoiceModalServiceCardId: null,

  addToast: (type, message) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  openInvoiceModal: (serviceCardId) =>
    set({ invoiceModalOpen: true, invoiceModalServiceCardId: serviceCardId }),

  closeInvoiceModal: () =>
    set({ invoiceModalOpen: false, invoiceModalServiceCardId: null }),
}))
