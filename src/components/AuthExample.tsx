/**
 * Auth System Example Component
 * Demonstrates all the enhanced authentication features
 */

'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { 
  AuthGuard, 
  AdminOnly, 
  AgentOnly, 
  CanManageUsers,
  CanManagePayouts,
  CanViewReports 
} from '@/components/AuthGuard'

export default function AuthExample() {
  const { 
    user, 
    isAuthenticated, 
    hasRole, 
    hasPermission, 
    logout,
    refreshUser,
    error,
    clearError
  } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
        <p>Please log in to see the auth system demo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Enhanced Auth System Demo</h1>
      
      {/* User Info Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Current User</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Name:</strong> {user?.firstName} {user?.lastName}
          </div>
          <div>
            <strong>Email:</strong> {user?.email}
          </div>
          <div>
            <strong>Role:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              user?.role === 'admin' ? 'bg-red-100 text-red-800' :
              user?.role === 'pt_admin' ? 'bg-purple-100 text-purple-800' :
              user?.role === 'agent' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {user?.role}
            </span>
          </div>
          <div>
            <strong>Status:</strong>
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              user?.status === 'active' ? 'bg-green-100 text-green-800' :
              user?.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
            }`}>
              {user?.status}
            </span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-red-800">{error}</span>
            <button 
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Role-Based Components */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Role-Based Access</h2>
        <div className="space-y-3">
          
          <AdminOnly fallback={<p className="text-gray-500">Admin access required</p>}>
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <h3 className="font-medium text-red-800">Admin Only Content</h3>
              <p className="text-red-600">This is only visible to admins and PT admins</p>
            </div>
          </AdminOnly>

          <AgentOnly fallback={<p className="text-gray-500">Agent access required</p>}>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-medium text-blue-800">Agent Only Content</h3>
              <p className="text-blue-600">This is only visible to agents</p>
            </div>
          </AgentOnly>

        </div>
      </div>

      {/* Permission-Based Components */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Permission-Based Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <CanManageUsers fallback={<p className="text-gray-500 text-sm">Cannot manage users</p>}>
            <button className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600">
              Manage Users
            </button>
          </CanManageUsers>

          <CanManagePayouts fallback={<p className="text-gray-500 text-sm">Cannot manage payouts</p>}>
            <button className="w-full p-3 bg-yellow-500 text-white rounded hover:bg-yellow-600">
              Manage Payouts
            </button>
          </CanManagePayouts>

          <CanViewReports fallback={<p className="text-gray-500 text-sm">Cannot view reports</p>}>
            <button className="w-full p-3 bg-purple-500 text-white rounded hover:bg-purple-600">
              View Reports
            </button>
          </CanViewReports>

          <AuthGuard 
            permissions={['notifications.manage']}
            fallback={<p className="text-gray-500 text-sm">Cannot manage notifications</p>}
          >
            <button className="w-full p-3 bg-indigo-500 text-white rounded hover:bg-indigo-600">
              Send Notifications
            </button>
          </AuthGuard>

        </div>
      </div>

      {/* Complex Permission Logic */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Complex Permission Checks</h2>
        <div className="space-y-3">
          
          {/* Multiple roles OR permission */}
          <AuthGuard
            roles={['admin', 'pt_admin']}
            permissions="system.admin"
            requireAll={false}
            fallback={<p className="text-gray-500">Need admin role OR system permission</p>}
          >
            <div className="p-3 bg-orange-50 border border-orange-200 rounded">
              <h3 className="font-medium text-orange-800">System Access</h3>
              <p className="text-orange-600">Either admin role OR system permission required</p>
            </div>
          </AuthGuard>

          {/* Multiple requirements AND */}
          <AuthGuard
            roles={['admin']}
            permissions="users.manage"
            requireAll={true}
            fallback={<p className="text-gray-500">Need admin role AND user management permission</p>}
          >
            <div className="p-3 bg-teal-50 border border-teal-200 rounded">
              <h3 className="font-medium text-teal-800">Advanced User Management</h3>
              <p className="text-teal-600">Both admin role AND user permission required</p>
            </div>
          </AuthGuard>

        </div>
      </div>

      {/* Raw Permission Checks */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Current Permissions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {[
            'users.manage',
            'agents.manage',
            'applications.review',
            'payouts.manage',
            'system.admin',
            'reports.view',
            'notifications.manage',
            'training.manage',
            'profile.update',
            'payouts.request',
            'earnings.view',
            'referrals.manage',
            'training.access'
          ].map(permission => (
            <div key={permission} className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${
                hasPermission(permission) ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              <span className={hasPermission(permission) ? 'text-green-700' : 'text-red-700'}>
                {permission}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Actions</h2>
        <div className="flex space-x-4">
          <button
            onClick={refreshUser}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh User Data
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <details className="bg-gray-50 p-4 rounded-lg">
        <summary className="font-medium cursor-pointer">Debug Information</summary>
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify({
            isAuthenticated,
            hasAdminRole: hasRole(['admin', 'pt_admin']),
            hasAgentRole: hasRole('agent'),
            canManageUsers: hasPermission('users.manage'),
            canViewReports: hasPermission('reports.view'),
            user: user ? {
              id: user.id,
              email: user.email,
              role: user.role,
              status: user.status
            } : null
          }, null, 2)}
        </pre>
      </details>
    </div>
  )
}
