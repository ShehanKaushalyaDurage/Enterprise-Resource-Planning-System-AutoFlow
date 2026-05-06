export type UserRole = 'admin' | 'manager' | 'technician' | 'cashier' | 'receptionist'

export type Permission =
  | 'dashboard.view'
  | 'vehicle.view' | 'vehicle.create' | 'vehicle.edit' | 'vehicle.delete'
  | 'service_card.view' | 'service_card.create' | 'service_card.edit' | 'service_card.delete' | 'service_card.update_status'
  | 'invoice.view' | 'invoice.pay' | 'invoice.void'
  | 'stock.view' | 'stock.manage' | 'stock.adjust'
  | 'grn.view' | 'grn.manage' | 'grn.pay'
  | 'petty_cash.view' | 'petty_cash.issue'
  | 'reports.view' | 'reports.financial'
  | 'users.manage'
  | 'settings.manage'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'dashboard.view',
    'vehicle.view', 'vehicle.create', 'vehicle.edit', 'vehicle.delete',
    'service_card.view', 'service_card.create', 'service_card.edit', 'service_card.delete', 'service_card.update_status',
    'invoice.view', 'invoice.pay', 'invoice.void',
    'stock.view', 'stock.manage', 'stock.adjust',
    'grn.view', 'grn.manage', 'grn.pay',
    'petty_cash.view', 'petty_cash.issue',
    'reports.view', 'reports.financial',
    'users.manage',
    'settings.manage',
  ],
  manager: [
    'dashboard.view',
    'vehicle.view', 'vehicle.create', 'vehicle.edit',
    'service_card.view', 'service_card.create', 'service_card.edit', 'service_card.update_status',
    'invoice.view', 'invoice.pay',
    'stock.view', 'stock.manage', 'stock.adjust',
    'grn.view', 'grn.manage', 'grn.pay',
    'petty_cash.view', 'petty_cash.issue',
    'reports.view', 'reports.financial',
  ],
  receptionist: [
    'dashboard.view',
    'vehicle.view', 'vehicle.create', 'vehicle.edit',
    'service_card.view', 'service_card.create',
    'invoice.view',
  ],
  technician: [
    'dashboard.view',
    'vehicle.view',
    'service_card.view', 'service_card.update_status',
    'stock.view',
  ],
  cashier: [
    'dashboard.view',
    'vehicle.view',
    'service_card.view',
    'invoice.view', 'invoice.pay',
    'reports.view',
  ],
}

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role: UserRole | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}
