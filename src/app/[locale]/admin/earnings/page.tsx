'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { api, Earning, ApiError } from '@/lib/api'
import { withAuth } from '@/contexts/AuthContext'
import { formatCurrencyWithSymbol } from '@/lib/utils/currency'

function EarningsManagementPage() {
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedEarnings, setSelectedEarnings] = useState<Set<string>>(new Set())
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false)
  const [rejectingEarning, setRejectingEarning] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectNotes, setRejectNotes] = useState('')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    agentId: '',
    tier: 'all',
    startDate: '',
    endDate: '',
    search: '',
    page: 1,
    limit: 20
  })
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    totalAmount: 0,
    pendingAmount: 0
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  })
  
  const t = useTranslations('admin.earnings')

  useEffect(() => {
    loadEarnings()
  }, [filters])

  const loadEarnings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Prepare API parameters
      const params = {
        page: filters.page,
        limit: filters.limit,
        status: filters.status === 'all' ? undefined : filters.status,
        type: filters.type === 'all' ? undefined : filters.type,
        agentId: filters.agentId || undefined,
        tier: filters.tier === 'all' ? undefined : filters.tier,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        search: filters.search || undefined
      }
      
      const data = await api.admin.getAllEarnings(params)
      
      // Handle paginated response
      const earningsData = (data as any).earnings || (data as any).data || []
      const paginationData = (data as any).pagination || {}
      const metricsData = (data as any).metrics || {}
      
      setEarnings(Array.isArray(earningsData) ? earningsData : [])
      
      // Update pagination state
      setPagination({
        page: paginationData.page || filters.page || 1,
        limit: paginationData.limit || filters.limit || 20,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || 1
      })

      // Use API metrics or calculate from data
      if (metricsData.overview) {
        setStats({
          total: metricsData.overview.totalEarnings || 0,
          pending: metricsData.statusBreakdown?.pending?.count || metricsData.statusSummary?.pending?.count || 0,
          confirmed: metricsData.statusBreakdown?.confirmed?.count || metricsData.statusSummary?.confirmed?.count || 0,
          cancelled: metricsData.statusBreakdown?.cancelled?.count || metricsData.statusSummary?.cancelled?.count || 0,
          totalAmount: metricsData.overview.totalAmount || 0,
          pendingAmount: metricsData.statusBreakdown?.pending?.amount || metricsData.statusSummary?.pending?.amount || 0
        })
      } else {
        // Fallback to local calculation
        const totalEarnings = earningsData.length
        const pending = earningsData.filter((e: Earning) => e.status === 'pending').length
        const confirmed = earningsData.filter((e: Earning) => e.status === 'confirmed').length
        const cancelled = earningsData.filter((e: Earning) => e.status === 'cancelled').length
        const totalAmount = earningsData.reduce((sum: number, e: Earning) => sum + parseFloat(e.amount?.toString() || '0'), 0)
        const pendingAmount = earningsData.filter((e: Earning) => e.status === 'pending').reduce((sum: number, e: Earning) => sum + parseFloat(e.amount?.toString() || '0'), 0)
        
        setStats({
          total: totalEarnings,
          pending,
          confirmed,
          cancelled,
          totalAmount,
          pendingAmount
        })
      }
    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || t('messages.loadError'))
      setEarnings([])
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 1 })
      setStats({ total: 0, pending: 0, confirmed: 0, cancelled: 0, totalAmount: 0, pendingAmount: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (earningId: string, notes?: string) => {
    try {
      setActionLoading(earningId)
      setError(null)
      
      await api.admin.approveEarning(earningId, { notes })
      
      // Reload earnings to reflect status changes
      setSuccess(t('messages.approveSuccess'))
      setTimeout(() => setSuccess(null), 3000)
      loadEarnings()
    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || t('messages.approveError'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (earningId: string, reason: string, notes?: string) => {
    try {
      setActionLoading(earningId)
      setError(null)
      
      await api.admin.rejectEarning(earningId, { reason, notes })
      
      // Reload earnings to reflect status changes
      setSuccess(t('messages.rejectSuccess'))
      setTimeout(() => setSuccess(null), 3000)
      loadEarnings()
      
      // Reset modal state
      setShowRejectModal(false)
      setRejectingEarning(null)
      setRejectReason('')
      setRejectNotes('')
    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || t('messages.rejectError'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedEarnings.size === 0) return

    try {
      setActionLoading('bulk-approve')
      setError(null)
      
      // Only include pending earnings in bulk operations
      const pendingEarningIds = earnings
        .filter(e => selectedEarnings.has(e.id) && e.status === 'pending')
        .map(e => e.id)
      
      if (pendingEarningIds.length === 0) {
        setError('No pending earnings selected for approval')
        setActionLoading(null)
        return
      }
      
      const result = await api.admin.bulkApproveEarnings({
        earningIds: pendingEarningIds,
        notes: 'Bulk approval from admin dashboard'
      })
      
      // Reload earnings to reflect status changes
      setSelectedEarnings(new Set())
      setSuccess(result.summary)
      setTimeout(() => setSuccess(null), 5000)
      loadEarnings()
    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || 'Failed to bulk approve earnings')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkReject = async () => {
    if (selectedEarnings.size === 0 || !rejectReason.trim()) return

    try {
      setActionLoading('bulk-reject')
      setError(null)
      
      // Only include pending earnings in bulk operations
      const pendingEarningIds = earnings
        .filter(e => selectedEarnings.has(e.id) && e.status === 'pending')
        .map(e => e.id)
      
      if (pendingEarningIds.length === 0) {
        setError('No pending earnings selected for rejection')
        setActionLoading(null)
        return
      }
      
      const result = await api.admin.bulkRejectEarnings({
        earningIds: pendingEarningIds,
        reason: rejectReason,
        notes: rejectNotes || undefined
      })
      
      // Reload earnings to reflect status changes
      setSelectedEarnings(new Set())
      setShowBulkRejectModal(false)
      setRejectReason('')
      setRejectNotes('')
      setSuccess(result.summary)
      setTimeout(() => setSuccess(null), 5000)
      loadEarnings()
    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || 'Failed to bulk reject earnings')
    } finally {
      setActionLoading(null)
    }
  }

  const toggleEarningSelection = (earningId: string) => {
    const newSelection = new Set(selectedEarnings)
    if (newSelection.has(earningId)) {
      newSelection.delete(earningId)
    } else {
      newSelection.add(earningId)
    }
    setSelectedEarnings(newSelection)
  }

  const selectAll = () => {
    if (selectedEarnings.size === earnings.length) {
      setSelectedEarnings(new Set())
    } else {
      setSelectedEarnings(new Set(earnings.map(e => e.id)))
    }
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }))
  }

  const handleTypeFilter = (type: string) => {
    setFilters(prev => ({ ...prev, type, page: 1 }))
  }

  const handleSearchFilter = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }))
  }

  const handleAgentFilter = (agentId: string) => {
    setFilters(prev => ({ ...prev, agentId, page: 1 }))
  }

  const handleTierFilter = (tier: string) => {
    setFilters(prev => ({ ...prev, tier, page: 1 }))
  }

  const handleDateRangeFilter = (startDate: string, endDate: string) => {
    setFilters(prev => ({ ...prev, startDate, endDate, page: 1 }))
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pt-turquoise mx-auto"></div>
          <p className="mt-4 text-pt-light-gray">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-pt-dark-gray">Earnings Management</h1>
        <p className="text-pt-light-gray mt-2">Monitor and manage all agent earnings across all statuses</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-pt-turquoise/10 rounded-lg">
              <svg className="w-6 h-6 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Total Earnings</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Pending</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Confirmed</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.confirmed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Cancelled</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.cancelled}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Total Value</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{formatCurrencyWithSymbol(stats.totalAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Pending Value</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{formatCurrencyWithSymbol(stats.pendingAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
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
              {(filters.status !== 'all' || filters.type !== 'all' || filters.tier !== 'all' || 
                filters.agentId || filters.startDate || filters.endDate || filters.search) && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            <div className="xl:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by agent, customer, or description..."
                value={filters.search}
                onChange={(e) => handleSearchFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
              >
                <option value="all">All Types</option>
                <option value="referral_commission">Referral Commission</option>
                <option value="bonus">Bonus</option>
                <option value="penalty">Penalty</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent ID</label>
              <input
                type="text"
                placeholder="Enter agent ID..."
                value={filters.agentId}
                onChange={(e) => handleAgentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={filters.tier}
                onChange={(e) => handleTierFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
              >
                <option value="all">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
                <option value="diamond">Diamond</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleDateRangeFilter(e.target.value, filters.endDate)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleDateRangeFilter(filters.startDate, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
              />
            </div>
          </div>

          {/* Quick Status Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.status === 'all'
                  ? 'bg-pt-turquoise text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => handleStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.status === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => handleStatusFilter('confirmed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.status === 'confirmed'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Confirmed ({stats.confirmed})
            </button>
            <button
              onClick={() => handleStatusFilter('cancelled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.status === 'cancelled'
                  ? 'bg-red-500 text-white'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              Cancelled ({stats.cancelled})
            </button>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Quick filters:</span>
              <button
                onClick={() => {
                  setFilters(prev => ({ ...prev, startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], endDate: '', page: 1 }))
                }}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Last 30 days
              </button>
              <button
                onClick={() => {
                  const today = new Date()
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
                  setFilters(prev => ({ ...prev, startDate: firstDay.toISOString().split('T')[0], endDate: '', page: 1 }))
                }}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                This month
              </button>
              <button
                onClick={() => {
                  setFilters(prev => ({ ...prev, tier: 'platinum', page: 1 }))
                }}
                className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
              >
                Platinum agents
              </button>
            </div>
            
            <button
              onClick={() => {
                setFilters({
                  status: 'all',
                  type: 'all',
                  agentId: '',
                  tier: 'all',
                  startDate: '',
                  endDate: '',
                  search: '',
                  page: 1,
                  limit: 20
                })
              }}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
          </div>
        )}
      </div>

      {/* Bulk Actions - Only available for pending earnings */}
      {selectedEarnings.size > 0 && earnings.some(e => selectedEarnings.has(e.id) && e.status === 'pending') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-800">
              {selectedEarnings.size} earning{selectedEarnings.size !== 1 ? 's' : ''} selected
            </span>
            <div className="space-x-3">
              <button
                onClick={handleBulkApprove}
                disabled={actionLoading === 'bulk-approve'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === 'bulk-approve' ? t('actions.approving') : t('actions.bulkApprove')}
              </button>
              <button
                onClick={() => setShowBulkRejectModal(true)}
                disabled={!!actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Bulk Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Earnings Table */}
      {earnings.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedEarnings.size === earnings.length && earnings.length > 0}
                    onChange={selectAll}
                    className="rounded border-gray-300 text-pt-turquoise focus:ring-pt-turquoise"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.agent')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.customer')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {earnings.map((earning) => (
                <tr key={earning.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedEarnings.has(earning.id)}
                      onChange={() => toggleEarningSelection(earning.id)}
                      className="rounded border-gray-300 text-pt-turquoise focus:ring-pt-turquoise"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(earning.earnedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {earning.agent?.agentCode || earning.metadata?.agentCode || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {earning.agent?.fullName || (earning.agent?.firstName && earning.agent?.lastName ? `${earning.agent.firstName} ${earning.agent.lastName}` : 'N/A')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {earning.agent?.email || 'N/A'}
                    </div>
                    {earning.agent?.tier && (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                        earning.agent.tier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                        earning.agent.tier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                        earning.agent.tier === 'silver' ? 'bg-gray-100 text-gray-800' :
                        earning.agent.tier === 'diamond' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {earning.agent.tier}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {earning.referralUsage?.referredUserName || earning.metadata?.customerInfo?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {earning.referralUsage?.referredUserPhone || earning.metadata?.customerInfo?.phone || 'N/A'}
                    </div>
                    {earning.metadata?.serviceType && (
                      <div className="text-xs text-gray-400 mt-1">
                        {earning.metadata.serviceType}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      earning.type === 'referral_commission' ? 'bg-blue-100 text-blue-800' :
                      earning.type === 'bonus' ? 'bg-green-100 text-green-800' :
                      earning.type === 'penalty' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {earning.type?.replace('_', ' ') || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrencyWithSymbol(earning.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      earning.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      earning.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      earning.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {earning.status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {earning.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApprove(earning.id, 'Approved via admin dashboard')}
                          disabled={actionLoading === earning.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {actionLoading === earning.id ? t('actions.approving') : t('actions.approve')}
                        </button>
                        <button
                          onClick={() => {
                            setRejectingEarning(earning.id)
                            setShowRejectModal(true)
                          }}
                          disabled={!!actionLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {t('actions.reject')}
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        {earning.status === 'confirmed' ? 'Approved' : 
                         earning.status === 'cancelled' ? 'Rejected' : 'No actions'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {!loading && earnings.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-pt-light-gray">
                  <span>
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} earnings
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
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noEarnings')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('noEarningsDescription')}</p>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Earning</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection *
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pt-turquoise focus:border-pt-turquoise"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Invalid referral">Invalid referral</option>
                  <option value="Duplicate referral">Duplicate referral</option>
                  <option value="No customer activity">No customer activity</option>
                  <option value="Fraudulent activity">Fraudulent activity</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional notes
                </label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pt-turquoise focus:border-pt-turquoise"
                  placeholder="Optional additional details..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectingEarning(null)
                    setRejectReason('')
                    setRejectNotes('')
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => rejectingEarning && handleReject(rejectingEarning, rejectReason, rejectNotes)}
                  disabled={!rejectReason.trim() || actionLoading === rejectingEarning}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === rejectingEarning ? 'Rejecting...' : 'Reject Earning'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reject Modal */}
      {showBulkRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Bulk Reject {selectedEarnings.size} Earnings
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection *
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pt-turquoise focus:border-pt-turquoise"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Invalid referrals">Invalid referrals</option>
                  <option value="Duplicate referrals">Duplicate referrals</option>
                  <option value="No customer activity">No customer activity</option>
                  <option value="Fraudulent activity">Fraudulent activity</option>
                  <option value="Policy violation">Policy violation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional notes
                </label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pt-turquoise focus:border-pt-turquoise"
                  placeholder="Optional additional details..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBulkRejectModal(false)
                    setRejectReason('')
                    setRejectNotes('')
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={!rejectReason.trim() || actionLoading === 'bulk-reject'}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === 'bulk-reject' ? 'Rejecting...' : `Reject ${selectedEarnings.size} Earnings`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default withAuth(EarningsManagementPage, ['admin', 'pt_admin'])
