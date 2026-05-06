import { create } from 'zustand'
import type { UserRole } from '@/lib/permissions'

interface AuthUser {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  is_active: boolean
}

interface AuthStore {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (v: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null }),
}))
