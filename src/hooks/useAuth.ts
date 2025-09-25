/**
 * Enhanced Auth Hook
 * Provides convenient auth utilities and permissions checking
 */

import { useAuth as useAuthContext } from '@/contexts/AuthContext'

export function useAuth() {
  return useAuthContext()
}

// Convenience hooks for specific roles
export function useIsAdmin() {
  const { hasRole } = useAuth()
  return hasRole(['admin', 'pt_admin'])
}

export function useIsAgent() {
  const { hasRole } = useAuth()
  return hasRole('agent')
}

export function useIsPTAdmin() {
  const { hasRole } = useAuth()
  return hasRole('pt_admin')
}

// Permission-based hooks
export function useCanManageUsers() {
  const { hasPermission } = useAuth()
  return hasPermission('users.manage')
}

export function useCanManageAgents() {
  const { hasPermission } = useAuth()
  return hasPermission('agents.manage')
}

export function useCanManagePayouts() {
  const { hasPermission } = useAuth()
  return hasPermission('payouts.manage')
}

export function useCanViewReports() {
  const { hasPermission } = useAuth()
  return hasPermission('reports.view')
}

export function useCanManageSystem() {
  const { hasPermission } = useAuth()
  return hasPermission('system.admin')
}

export function useCanManageNotifications() {
  const { hasPermission } = useAuth()
  return hasPermission('notifications.manage')
}

export function useCanManageTraining() {
  const { hasPermission } = useAuth()
  return hasPermission('training.manage')
}

// Agent-specific permissions
export function useCanRequestPayouts() {
  const { hasPermission } = useAuth()
  return hasPermission('payouts.request')
}

export function useCanViewEarnings() {
  const { hasPermission } = useAuth()
  return hasPermission('earnings.view')
}

export function useCanManageReferrals() {
  const { hasPermission } = useAuth()
  return hasPermission('referrals.manage')
}

export function useCanAccessTraining() {
  const { hasPermission } = useAuth()
  return hasPermission('training.access')
}

// Combined permission checks
export function useCanAccessAdminPanel() {
  const { hasRole } = useAuth()
  return hasRole(['admin', 'pt_admin'])
}

export function useCanAccessAgentPanel() {
  const { hasRole } = useAuth()
  return hasRole('agent')
}

// User info helpers
export function useUserDisplayName() {
  const { user } = useAuth()
  if (!user) return ''
  return `${user.firstName} ${user.lastName}`.trim()
}

export function useUserInitials() {
  const { user } = useAuth()
  if (!user) return ''
  return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
}

export function useUserRole() {
  const { user } = useAuth()
  return user?.role || null
}

export function useUserStatus() {
  const { user } = useAuth()
  return user?.status || null
}

export default useAuth
