/**
 * Auth Guard Component
 * Provides fine-grained permission control for UI elements
 */

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface AuthGuardProps {
  children: React.ReactNode
  roles?: string | string[]
  permissions?: string | string[]
  requireAll?: boolean // If true, user must have ALL roles/permissions. If false, user needs ANY
  fallback?: React.ReactNode
  loading?: React.ReactNode
}

export function AuthGuard({
  children,
  roles,
  permissions,
  requireAll = false,
  fallback = null,
  loading = null
}: AuthGuardProps) {
  const { user, loading: authLoading, hasRole, hasPermission } = useAuth()

  // Show loading if auth is still loading
  if (authLoading) {
    return loading ? <>{loading}</> : null
  }

  // Show fallback if not authenticated
  if (!user) {
    return fallback ? <>{fallback}</> : null
  }

  // Check roles if provided
  if (roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles]
    const roleCheck = requireAll
      ? roleArray.every(role => hasRole(role))
      : roleArray.some(role => hasRole(role))
    
    if (!roleCheck) {
      return fallback ? <>{fallback}</> : null
    }
  }

  // Check permissions if provided
  if (permissions) {
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
    const permissionCheck = requireAll
      ? permissionArray.every(permission => hasPermission(permission))
      : permissionArray.some(permission => hasPermission(permission))
    
    if (!permissionCheck) {
      return fallback ? <>{fallback}</> : null
    }
  }

  return <>{children}</>
}

// Convenience components for specific roles
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard roles={['admin', 'pt_admin']} fallback={fallback}>
      {children}
    </AuthGuard>
  )
}

export function AgentOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard roles="agent" fallback={fallback}>
      {children}
    </AuthGuard>
  )
}

export function PTAdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard roles="pt_admin" fallback={fallback}>
      {children}
    </AuthGuard>
  )
}

// Permission-based guards
export function CanManageUsers({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard permissions="users.manage" fallback={fallback}>
      {children}
    </AuthGuard>
  )
}

export function CanManageAgents({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard permissions="agents.manage" fallback={fallback}>
      {children}
    </AuthGuard>
  )
}

export function CanManagePayouts({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard permissions="payouts.manage" fallback={fallback}>
      {children}
    </AuthGuard>
  )
}

export function CanViewReports({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard permissions="reports.view" fallback={fallback}>
      {children}
    </AuthGuard>
  )
}

export function CanManageSystem({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard permissions="system.admin" fallback={fallback}>
      {children}
    </AuthGuard>
  )
}

// Example usage component
export function AuthGuardExample() {
  return (
    <div className="space-y-4">
      {/* Role-based guards */}
      <AdminOnly fallback={<p>Admin access required</p>}>
        <button className="bg-red-500 text-white px-4 py-2 rounded">
          Admin Only Button
        </button>
      </AdminOnly>

      <AgentOnly fallback={<p>Agent access required</p>}>
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Agent Only Button
        </button>
      </AgentOnly>

      {/* Permission-based guards */}
      <CanManageUsers fallback={<p>Cannot manage users</p>}>
        <button className="bg-green-500 text-white px-4 py-2 rounded">
          Manage Users
        </button>
      </CanManageUsers>

      {/* Multiple requirements */}
      <AuthGuard
        roles={['admin', 'pt_admin']}
        permissions="system.admin"
        requireAll={true}
        fallback={<p>Admin role AND system permission required</p>}
      >
        <button className="bg-purple-500 text-white px-4 py-2 rounded">
          System Admin Action
        </button>
      </AuthGuard>

      {/* Any of multiple permissions */}
      <AuthGuard
        permissions={['users.manage', 'agents.manage']}
        requireAll={false}
        fallback={<p>Need to manage users OR agents</p>}
      >
        <button className="bg-orange-500 text-white px-4 py-2 rounded">
          Management Action
        </button>
      </AuthGuard>
    </div>
  )
}

export default AuthGuard
