'use client'

import { useState, useEffect } from 'react'
import { api, User, UserQueryParams, ApiError } from '@/lib/api'
import CountryPicker from '@/components/CountryPicker'

// Helper function to get country display info
const getCountryInfo = (countryCode: string) => {
  const countryMap: { [key: string]: { name: string; flag: string } } = {
    'GB': { name: 'United Kingdom', flag: '🇬🇧' },
    'US': { name: 'United States', flag: '🇺🇸' },
    'CA': { name: 'Canada', flag: '🇨🇦' },
    'AU': { name: 'Australia', flag: '🇦🇺' },
    'ZW': { name: 'Zimbabwe', flag: '🇿🇼' },
    'KE': { name: 'Kenya', flag: '🇰🇪' },
    'ZA': { name: 'South Africa', flag: '🇿🇦' },
    'NG': { name: 'Nigeria', flag: '🇳🇬' },
    'GH': { name: 'Ghana', flag: '🇬🇭' },
    'UG': { name: 'Uganda', flag: '🇺🇬' },
    'TZ': { name: 'Tanzania', flag: '🇹🇿' },
    'ZM': { name: 'Zambia', flag: '🇿🇲' },
    'MW': { name: 'Malawi', flag: '🇲🇼' },
    'BW': { name: 'Botswana', flag: '🇧🇼' },
    'AO': { name: 'Angola', flag: '🇦🇴' }
  }
  return countryMap[countryCode] || { name: countryCode, flag: '🌍' }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [filters, setFilters] = useState<UserQueryParams>({
    page: 1,
    limit: 20,
    role: '',
    status: '',
    search: ''
  })
  const [stats, setStats] = useState({
    overview: {
      totalUsers: 0,
      activeUsers: 0,
      pendingUsers: 0,
      inactiveUsers: 0,
      suspendedUsers: 0
    },
    roleBreakdown: {
      admins: 0,
      agents: 0,
      breakdown: {
        admin: 0,
        pt_admin: 0,
        agent: 0
      }
    },
    statusSummary: {
      active: 0,
      pending: 0,
      inactive: 0,
      suspended: 0
    }
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUserData, setNewUserData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    password: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadUsers()
  }, [filters])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await api.admin.getUsers(filters)
      
      // Handle paginated response structure  
      const usersData = (response as any).users || response.data || []
      const paginationData = (response as any).pagination || {}
      const metricsData = (response as any).metrics || {}
      
      setUsers(Array.isArray(usersData) ? usersData : [])
      
      // Update pagination state
      setPagination({
        page: paginationData.page || filters.page || 1,
        limit: paginationData.limit || filters.limit || 20,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || 1
      })
      
      // Use API metrics instead of calculating locally
      setStats({
        overview: metricsData.overview || {
          totalUsers: 0,
          activeUsers: 0,
          pendingUsers: 0,
          inactiveUsers: 0,
          suspendedUsers: 0
        },
        roleBreakdown: metricsData.roleBreakdown || {
          admins: 0,
          agents: 0,
          breakdown: {
            admin: 0,
            pt_admin: 0,
            agent: 0
          }
        },
        statusSummary: metricsData.statusSummary || {
          active: 0,
          pending: 0,
          inactive: 0,
          suspended: 0
        }
      })
    } catch (error) {
      // Failed to load users
      setError('Failed to load users')
      setUsers([])
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 1 })
      setStats({
        overview: {
          totalUsers: 0,
          activeUsers: 0,
          pendingUsers: 0,
          inactiveUsers: 0,
          suspendedUsers: 0
        },
        roleBreakdown: {
          admins: 0,
          agents: 0,
          breakdown: {
            admin: 0,
            pt_admin: 0,
            agent: 0
          }
        },
        statusSummary: {
          active: 0,
          pending: 0,
          inactive: 0,
          suspended: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (userId: string, status: 'active' | 'inactive' | 'suspended') => {
    try {
      setUpdating(userId)
      setError(null)
      
      await api.admin.updateUserStatus(userId, { status })
      
      // Refresh users
      await loadUsers()
      setSuccess(`User ${status} successfully`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || `Failed to update user status`)
    } finally {
      setUpdating(null)
    }
  }

  const handleRoleUpdate = async (userId: string, role: 'admin' | 'agent') => {
    try {
      setUpdating(userId)
      setError(null)
      
      await api.admin.updateUserRole(userId, { role })
      
      // Refresh users
      await loadUsers()
      setSuccess(`User role updated to ${role}`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || `Failed to update user role`)
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800 border-green-200',
      'inactive': 'bg-gray-100 text-gray-800 border-gray-200',
      'suspended': 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getRoleColor = (role: string) => {
    const colors = {
      'admin': 'bg-purple-100 text-purple-800 border-purple-200',
      'pt_admin': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'agent': 'bg-blue-100 text-blue-800 border-blue-200'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (newUserData.firstName.length > 100) {
      errors.firstName = 'First name must be 100 characters or less'
    }
    
    if (newUserData.lastName.length > 100) {
      errors.lastName = 'Last name must be 100 characters or less'
    }
    
    if (!newUserData.country || newUserData.country.length !== 2) {
      errors.country = 'Please select a country'
    }
    
    if (newUserData.username.length < 3 || newUserData.username.length > 50) {
      errors.username = 'Username must be between 3 and 50 characters'
    }
    
    if (newUserData.email.length > 255) {
      errors.email = 'Email must be 255 characters or less'
    }
    
    if (newUserData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      
      await api.user.createUser(newUserData)
      
      // Reset form and close modal
      setNewUserData({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        country: '',
        password: ''
      })
      setFormErrors({})
      setShowAddModal(false)
      
      // Refresh users
      await loadUsers()
      setSuccess('Admin user created successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setShowViewModal(true)
  }

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewUserData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }
  
  const handleCountryChange = (countryCode: string) => {
    setNewUserData(prev => ({
      ...prev,
      country: countryCode
    }))
    // Clear error for country field
    if (formErrors.country) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.country
        return newErrors
      })
    }
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-pt-dark-gray mb-2">Admin Management</h1>
        <p className="text-pt-light-gray">Manage admin accounts and permissions</p>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center">
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 715.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Total Users</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.overview.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Admins</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.roleBreakdown.admins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-pt-turquoise/10 rounded-xl">
              <svg className="w-6 h-6 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Agents</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.roleBreakdown.agents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Active Users</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.overview.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Pending Users</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.overview.pendingUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-xl">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Suspended Users</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.overview.suspendedUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">Filters & Search</h3>
              {(filters.role || filters.status || filters.search) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pt-turquoise text-white">
                  Active
                </span>
              )}
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transform transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {filtersExpanded && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-pt-dark-gray mb-2">Search Users</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-pt-dark-gray mb-2">Role</label>
            <select
              value={filters.role || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value, page: 1 }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200"
            >
              <option value="">All Admin Types</option>
              <option value="admin">Admin</option>
              <option value="pt_admin">PT Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-pt-dark-gray mb-2">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ page: 1, limit: 20, role: '', status: '', search: '' })}
              className="w-full px-4 py-3 bg-gray-100 text-pt-dark-gray rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-pt-dark-gray">Admin Accounts</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-pt-turquoise text-white px-4 py-2 rounded-lg font-medium hover:bg-pt-turquoise-600 transition-colors duration-200"
          >
            + Add Admin
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pt-turquoise mx-auto mb-4"></div>
            <p className="text-pt-light-gray">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 715.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-pt-dark-gray mb-2">No users found</h3>
            <p className="text-pt-light-gray">No users match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Country</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-pt-turquoise rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white font-medium">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-pt-dark-gray">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-pt-light-gray">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-pt-dark-gray">{user.email}</div>
                      {user.phoneNumber && (
                        <div className="text-sm text-pt-light-gray">{user.phoneNumber}</div>
                      )}
                      {user.username && (
                        <div className="text-xs text-pt-light-gray">@{user.username}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.country ? (
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getCountryInfo(user.country).flag}</span>
                          <div>
                            <div className="text-sm text-pt-dark-gray">{getCountryInfo(user.country).name}</div>
                            <div className="text-xs text-pt-light-gray">{user.country}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-pt-light-gray">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-pt-dark-gray">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                      {user.lastLoginAt && (
                        <div className="text-xs text-pt-light-gray">
                          Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                        </div>
                      )}
                      {user.emailVerifiedAt && (
                        <div className="text-xs text-green-600">✓ Email verified</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {/* Status Actions */}
                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleStatusUpdate(user.id, 'suspended')}
                            disabled={updating === user.id}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors duration-200 disabled:opacity-50"
                          >
                            {updating === user.id ? '...' : 'Suspend'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusUpdate(user.id, 'active')}
                            disabled={updating === user.id}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors duration-200 disabled:opacity-50"
                          >
                            {updating === user.id ? '...' : 'Activate'}
                          </button>
                        )}


                        <button 
                          onClick={() => handleViewUser(user)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors duration-200"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-pt-light-gray">
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                </span>
                <select
                  value={pagination.limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="ml-4 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-pt-turquoise focus:border-pt-turquoise"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-2 text-sm font-medium text-pt-dark-gray bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 4) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 3) {
                      pageNum = pagination.totalPages - 6 + i;
                    } else {
                      pageNum = pagination.page - 3 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          pageNum === pagination.page
                            ? 'bg-pt-turquoise text-white'
                            : 'text-pt-dark-gray bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-pt-dark-gray bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-purple-500 to-indigo-600 px-8 py-6 rounded-t-2xl">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setFormErrors({})
                }}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-white">Create New Admin</h2>
              <p className="text-purple-100 text-sm mt-1">Add a new administrator to the platform</p>
            </div>
            
            <form onSubmit={handleAddUser} className="p-8 space-y-6">
              {/* Form Errors */}
              {Object.keys(formErrors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800 mb-1">Please fix the following errors:</h3>
                      <ul className="text-sm text-red-700 space-y-1">
                        {Object.values(formErrors).map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={newUserData.firstName}
                    onChange={handleNewUserChange}
                    className={`w-full px-4 py-3 border ${formErrors.firstName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200`}
                    required
                    maxLength={100}
                    placeholder="John"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max 100 characters</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={newUserData.lastName}
                    onChange={handleNewUserChange}
                    className={`w-full px-4 py-3 border ${formErrors.lastName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200`}
                    required
                    maxLength={100}
                    placeholder="Doe"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max 100 characters</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={newUserData.username}
                  onChange={handleNewUserChange}
                  className={`w-full px-4 py-3 border ${formErrors.username ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200`}
                  required
                  minLength={3}
                  maxLength={50}
                  placeholder="john.doe"
                />
                <p className="text-xs text-gray-500 mt-1">3-50 characters, must be unique</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={newUserData.email}
                  onChange={handleNewUserChange}
                  className={`w-full px-4 py-3 border ${formErrors.email ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200`}
                  required
                  maxLength={255}
                  placeholder="john.doe@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">Max 255 characters, must be unique</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                <CountryPicker
                  value={newUserData.country}
                  onChange={handleCountryChange}
                  placeholder="Select country"
                  error={formErrors.country}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">ISO 3166-1 alpha-2 code (2 characters)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={newUserData.password}
                  onChange={handleNewUserChange}
                  className={`w-full px-4 py-3 border ${formErrors.password ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200`}
                  required
                  minLength={8}
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setFormErrors({})
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Admin
                    </>
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-pt-dark-gray">User Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* User Avatar and Basic Info */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-pt-turquoise rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">
                    {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                  </span>
                </div>
                <h4 className="text-xl font-semibold text-pt-dark-gray">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h4>
                <p className="text-pt-light-gray">{selectedUser.email}</p>
              </div>

              {/* User Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-pt-light-gray mb-1">User ID</label>
                    <p className="text-sm font-mono text-pt-dark-gray">{selectedUser.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pt-light-gray mb-1">Phone</label>
                    <p className="text-sm text-pt-dark-gray">{selectedUser.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-pt-light-gray mb-1">Country</label>
                    {selectedUser.country ? (
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getCountryInfo(selectedUser.country).flag}</span>
                        <div>
                          <p className="text-sm text-pt-dark-gray">{getCountryInfo(selectedUser.country).name}</p>
                          <p className="text-xs text-pt-light-gray">{selectedUser.country}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-pt-light-gray">Not set</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pt-light-gray mb-1">Username</label>
                    <p className="text-sm text-pt-dark-gray">{selectedUser.username || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-pt-light-gray mb-1">Role</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pt-light-gray mb-1">Status</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-pt-light-gray mb-1">Joined</label>
                    <p className="text-sm text-pt-dark-gray">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pt-light-gray mb-1">Last Updated</label>
                    <p className="text-sm text-pt-dark-gray">
                      {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 border border-gray-300 text-pt-dark-gray rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Close
                </button>
                <button className="bg-pt-turquoise text-white px-4 py-2 rounded-lg font-medium hover:bg-pt-turquoise-600 transition-colors duration-200">
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}