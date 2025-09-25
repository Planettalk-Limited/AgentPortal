'use client'

import { useState, useEffect } from 'react'
import { api, UpdatePayoutStatusRequest, ApiError } from '@/lib/api'
import type { Payout } from '@/lib/api/types'
import { formatCurrencyWithSymbol } from '@/lib/utils/currency'
import type { PayoutQueryParams } from '@/lib/api/services/payout.service'

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [processingPayout, setProcessingPayout] = useState<Payout | null>(null)
  const [processNotes, setProcessNotes] = useState('')
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject'>('approve')
  const [bulkNotes, setBulkNotes] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [filters, setFilters] = useState<PayoutQueryParams>({
    page: 1,
    limit: 20,
    status: '',
    method: ''
  })
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    totalAmount: 0
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  })

  useEffect(() => {
    loadPayouts()
    setSelectedPayouts([]) // Clear selections when filters change
  }, [filters])

  const loadPayouts = async () => {
    try {
      setLoading(true)
      const response = await api.payout.getAllPayouts(filters)
      
      // Handle paginated response structure
      const payoutsData = (response as any).payouts || response.data || []
      const paginationData = (response as any).pagination || {}
      
      setPayouts(Array.isArray(payoutsData) ? payoutsData : [])
      
      // Update pagination state
      setPagination({
        page: paginationData.page || filters.page || 1,
        limit: paginationData.limit || filters.limit || 20,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || 1
      })
      
      // Update stats from API metrics if available, otherwise calculate from payouts
      if ((response as any).metrics) {
        const metrics = (response as any).metrics
        setStats({
          total: metrics.overview?.totalPayouts || 0,
          pending: metrics.statusSummary?.pending?.count || 0,
          completed: metrics.statusSummary?.completed?.count || 0,
          totalAmount: metrics.overview?.totalAmount || 0
        })
      } else {
        // Fallback: calculate stats from payouts data
        const payouts = Array.isArray(payoutsData) ? payoutsData : []
        setStats({
          total: payouts.length,
          pending: payouts.filter((p: any) => ['requested', 'pending_review', 'approved', 'processing'].includes(p.status)).length,
          completed: payouts.filter((p: any) => p.status === 'completed').length,
          totalAmount: payouts.reduce((sum: number, p: any) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0)
        })
      }
    } catch (error) {
      // Failed to load payouts
      setError('Failed to load payouts')
      setPayouts([]) // Ensure payouts is always an array
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 1 })
      setStats({
        total: 0,
        pending: 0,
        completed: 0,
        totalAmount: 0
      })
    } finally {
      setLoading(false)
    }
  }


  const handleProcessPayout = async () => {
    if (!processingPayout) return
    
    try {
      setUpdating(processingPayout.id)
      setError(null)
      
      await api.payout.processPayout(processingPayout.id, { adminNotes: processNotes })
      
      setSuccess('Payout is now being processed. Payment workflow has been initiated.')
      setProcessingPayout(null)
      setProcessNotes('')
      loadPayouts()
    } catch (error) {
      console.error('Error processing payout:', error)
      setError(error instanceof Error ? error.message : 'Failed to process payout')
    } finally {
      setUpdating(null)
    }
  }

  const handleSelectAll = () => {
    const approvablePayouts = payouts.filter(p => p.status === 'requested' || p.status === 'pending_review')
    if (selectedPayouts.length === approvablePayouts.length) {
      setSelectedPayouts([])
    } else {
      setSelectedPayouts(approvablePayouts.map(p => p.id))
    }
  }

  const handleSelectPayout = (payoutId: string) => {
    setSelectedPayouts(prev => 
      prev.includes(payoutId) 
        ? prev.filter(id => id !== payoutId)
        : [...prev, payoutId]
    )
  }

  const handleBulkAction = async () => {
    if (selectedPayouts.length === 0) return
    
    try {
      setUpdating('bulk')
      setError(null)
      
      const result = await api.payout.bulkProcessPayouts({
        payoutIds: selectedPayouts,
        action: bulkAction,
        reason: bulkNotes || undefined
      })
      
      setSuccess(`Successfully ${bulkAction}d ${result.success} payout(s)${result.failed > 0 ? `, ${result.failed} failed` : ''}`)
      setShowBulkModal(false)
      setBulkNotes('')
      setSelectedPayouts([])
      await loadPayouts()
    } catch (error) {
      console.error('Error with bulk action:', error)
      setError(error instanceof Error ? error.message : `Failed to ${bulkAction} payouts`)
    } finally {
      setUpdating(null)
    }
  }

  const handleExportCSV = async () => {
    try {
      setIsExporting(true)
      setError(null)
      
      const blob = await api.payout.exportPayouts({ ...filters, format: 'csv' })
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `payouts-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setSuccess('Payouts exported successfully')
    } catch (error) {
      console.error('Error exporting payouts:', error)
      setError(error instanceof Error ? error.message : 'Failed to export payouts')
    } finally {
      setIsExporting(false)
    }
  }

  const handleStatusUpdate = async (payoutId: string, status: 'approved' | 'rejected' | 'processing' | 'completed', notes?: string) => {
    try {
      setUpdating(payoutId)
      setError(null)
      
      const updateData: UpdatePayoutStatusRequest = { status }
      if (notes) updateData.adminNotes = notes
      
      // Use specific payout action methods based on status
      if (status === 'approved') {
        await api.payout.approvePayout(payoutId, { adminNotes: notes })
      } else if (status === 'rejected') {
        await api.payout.rejectPayout(payoutId, { rejectionReason: notes || 'Rejected by admin', adminNotes: notes })
      } else if (status === 'processing') {
        await api.payout.processPayout(payoutId, { adminNotes: notes })
      } else if (status === 'completed') {
        await api.payout.completePayout(payoutId, { transactionId: `TXN${Date.now()}`, adminNotes: notes })
      }
      
      // Refresh payouts
      await loadPayouts()
      setSuccess(`Payout ${status} successfully`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || `Failed to ${status} payout`)
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'requested': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'pending_review': 'bg-orange-100 text-orange-800 border-orange-200',
      'approved': 'bg-blue-100 text-blue-800 border-blue-200',
      'processing': 'bg-purple-100 text-purple-800 border-purple-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getMethodIcon = (method: string) => {
    const icons = {
      'bank_transfer': '🏦',
      'airtime_topup': '📱',
      'paypal': '💳',
      'check': '📧',
      'crypto': '₿'
    }
    return icons[method as keyof typeof icons] || '💰'
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
        <h1 className="text-3xl font-bold text-pt-dark-gray mb-2">Payouts Management</h1>
        <p className="text-pt-light-gray">Manage agent commissions and payment processing</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Total Payouts</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.total}</p>
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
              <p className="text-sm font-medium text-pt-light-gray">Pending Review</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Completed</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-pt-turquoise/10 rounded-xl">
              <svg className="w-6 h-6 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Total Amount</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{formatCurrencyWithSymbol(stats.totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
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
              {(filters.status || filters.method || filters.startDate || filters.endDate) && (
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
            <label className="block text-sm font-medium text-pt-dark-gray mb-2">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200"
            >
              <option value="">All Statuses</option>
              <option value="requested">Requested</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-pt-dark-gray mb-2">Payment Method</label>
            <select
              value={filters.method || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value, page: 1 }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200"
            >
              <option value="">All Methods</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="airtime_topup">Airtime Top-up</option>
              <option value="paypal">PayPal</option>
              <option value="check">Check</option>
              <option value="crypto">Cryptocurrency</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-pt-dark-gray mb-2">Date From</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-pt-dark-gray mb-2">Date To</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={() => setFilters({ page: 1, limit: 20, status: '', method: '', startDate: '', endDate: '' })}
            className="px-4 py-2 text-pt-turquoise hover:text-pt-turquoise-600 font-medium transition-colors duration-200"
          >
            Clear Filters
          </button>
        </div>
          </div>
        )}
      </div>

      {/* Bulk Actions & Export Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          {selectedPayouts.length > 0 && (
            <>
              <span className="text-sm text-gray-600">
                {selectedPayouts.length} payout{selectedPayouts.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => {
                  setBulkAction('approve')
                  setShowBulkModal(true)
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Bulk Approve
              </button>
              <button
                onClick={() => {
                  setBulkAction('reject')
                  setShowBulkModal(true)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Bulk Reject
              </button>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            disabled={isExporting || payouts.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-pt-dark-gray">Payout Requests</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pt-turquoise mx-auto mb-4"></div>
            <p className="text-pt-light-gray">Loading payouts...</p>
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-pt-dark-gray mb-2">No payouts found</h3>
            <p className="text-pt-light-gray">No payout requests match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedPayouts.length > 0 && selectedPayouts.length === payouts.filter(p => p.status === 'requested' || p.status === 'pending_review').length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Requested</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      {(payout.status === 'requested' || payout.status === 'pending_review') && (
                        <input
                          type="checkbox"
                          checked={selectedPayouts.includes(payout.id)}
                          onChange={() => handleSelectPayout(payout.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-pt-turquoise rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-medium">
                            {payout.id.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-pt-dark-gray">Agent #{payout.id.slice(0, 8)}</div>
                          <div className="text-sm text-pt-light-gray">ID: {payout.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-pt-dark-gray">{formatCurrencyWithSymbol(payout.amount)}</div>
                      <div className="text-sm text-pt-light-gray">Net: {formatCurrencyWithSymbol(payout.netAmount)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="mr-2">{getMethodIcon(payout.method)}</span>
                        <span className="text-sm font-medium text-pt-dark-gray capitalize">
                          {payout.method.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payout.status)}`}>
                        {payout.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-pt-dark-gray">
                      {new Date(payout.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {(payout.status === 'requested' || payout.status === 'pending_review') && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(payout.id, 'approved')}
                              disabled={updating === payout.id}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors duration-200 disabled:opacity-50"
                            >
                              {updating === payout.id ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(payout.id, 'rejected', 'Rejected by admin')}
                              disabled={updating === payout.id}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors duration-200 disabled:opacity-50"
                            >
                              {updating === payout.id ? '...' : 'Reject'}
                            </button>
                          </>
                        )}
                        {payout.status === 'approved' && (
                          <button
                            onClick={() => setProcessingPayout(payout)}
                            disabled={updating === payout.id}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors duration-200 disabled:opacity-50"
                          >
                            {updating === payout.id ? '...' : 'Process'}
                          </button>
                        )}
                        {payout.status === 'processing' && (
                          <button
                            onClick={() => handleStatusUpdate(payout.id, 'completed')}
                            disabled={updating === payout.id}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors duration-200 disabled:opacity-50"
                          >
                            {updating === payout.id ? '...' : 'Complete'}
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedPayout(payout)}
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
        {!loading && payouts.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-pt-light-gray">
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} payouts
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

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-pt-dark-gray">
                Bulk {bulkAction === 'approve' ? 'Approve' : 'Reject'} Payouts
              </h2>
              <button
                onClick={() => {
                  setShowBulkModal(false)
                  setBulkNotes('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Selection Summary */}
              <div className={`border rounded-lg p-4 mb-6 ${bulkAction === 'approve' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${bulkAction === 'approve' ? 'bg-green-500' : 'bg-red-500'}`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {bulkAction === 'approve' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <h3 className={`font-semibold ${bulkAction === 'approve' ? 'text-green-900' : 'text-red-900'}`}>
                      {bulkAction === 'approve' ? 'Approve' : 'Reject'} {selectedPayouts.length} Payout{selectedPayouts.length !== 1 ? 's' : ''}
                    </h3>
                    <p className={`text-sm ${bulkAction === 'approve' ? 'text-green-700' : 'text-red-700'}`}>
                      Selected payout requests will be {bulkAction}d
                    </p>
                  </div>
                </div>
                
                {/* Show selected payouts */}
                <div className="space-y-2">
                  {payouts
                    .filter(p => selectedPayouts.includes(p.id))
                    .slice(0, 3)
                    .map(payout => (
                      <div key={payout.id} className={`flex justify-between text-sm ${bulkAction === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
                        <span>{payout.agent?.agentCode || payout.id.slice(0, 8)}</span>
                        <span>{formatCurrencyWithSymbol(payout.amount)}</span>
                      </div>
                    ))
                  }
                  {selectedPayouts.length > 3 && (
                    <div className={`text-xs ${bulkAction === 'approve' ? 'text-green-600' : 'text-red-600'}`}>
                      ...and {selectedPayouts.length - 3} more
                    </div>
                  )}
                </div>
              </div>

              {/* Confirmation Message */}
              <div className="mb-6">
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">
                      {bulkAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                    </h4>
                    <p className="text-sm text-yellow-800">
                      {bulkAction === 'approve' 
                        ? 'This will approve all selected payouts and they will be ready for processing. Agents will be notified via email.'
                        : 'This will reject all selected payouts and return the funds to agent balances. Agents will be notified via email.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {bulkAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
                </label>
                <textarea
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder={bulkAction === 'approve' 
                    ? "Add any notes about the approval (e.g., batch approved, verified earnings, etc.)"
                    : "Explain why these payouts are being rejected (this will be sent to agents)"
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  required={bulkAction === 'reject'}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBulkModal(false)
                    setBulkNotes('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAction}
                  disabled={updating === 'bulk' || (bulkAction === 'reject' && !bulkNotes.trim())}
                  className={`px-6 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                    bulkAction === 'approve' 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {updating === 'bulk' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {bulkAction === 'approve' ? 'Approving...' : 'Rejecting...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {bulkAction === 'approve' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        )}
                      </svg>
                      {bulkAction === 'approve' ? 'Approve All' : 'Reject All'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Payout Modal */}
      {processingPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-pt-dark-gray">Process Payout</h2>
              <button
                onClick={() => {
                  setProcessingPayout(null)
                  setProcessNotes('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Payout Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Payout Details</h3>
                    <p className="text-sm text-blue-700">ID: {processingPayout.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-900">Amount:</span>
                    <p className="text-blue-700">{formatCurrencyWithSymbol(processingPayout.amount)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Method:</span>
                    <p className="text-blue-700 capitalize">{processingPayout.method.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Agent:</span>
                    <p className="text-blue-700">{processingPayout.agent?.agentCode || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Status:</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      APPROVED
                    </span>
                  </div>
                </div>
              </div>

              {/* Process Information */}
              <div className="mb-6">
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">Processing Payment</h4>
                    <p className="text-sm text-yellow-800">
                      This will mark the payout as "processing" and initiate the payment workflow. 
                      The agent will be notified that their payment is being processed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Processing Notes (Optional)
                </label>
                <textarea
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                  placeholder="Add any notes about the payment processing (e.g., batch ID, payment method details, etc.)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setProcessingPayout(null)
                    setProcessNotes('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayout}
                  disabled={updating === processingPayout.id}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {updating === processingPayout.id ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Start Processing
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Details Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-pt-dark-gray">Payout Details</h2>
              <button
                onClick={() => setSelectedPayout(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payout ID</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedPayout.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedPayout.status)}`}>
                    {selectedPayout.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <p className="text-lg font-semibold text-pt-dark-gray">{formatCurrencyWithSymbol(selectedPayout.amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Amount</label>
                  <p className="text-lg font-semibold text-green-600">{formatCurrencyWithSymbol(selectedPayout.netAmount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fees</label>
                  <p className="text-sm text-gray-900">{formatCurrencyWithSymbol(selectedPayout.fees)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <div className="flex items-center">
                    <span className="mr-2">{getMethodIcon(selectedPayout.method)}</span>
                    <span className="text-sm text-gray-900 capitalize">{selectedPayout.method.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Agent Info */}
              {selectedPayout.agent && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-pt-dark-gray mb-4">Agent Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Agent Code</label>
                      <p className="text-sm text-gray-900">{selectedPayout.agent.agentCode}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                      <p className="text-sm text-gray-900">{selectedPayout.agent.user?.firstName} {selectedPayout.agent.user?.lastName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-sm text-gray-900">{selectedPayout.agent.user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedPayout.agent.tier}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {selectedPayout.paymentDetails && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-pt-dark-gray mb-4">Payment Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedPayout.method === 'airtime_topup' && selectedPayout.paymentDetails.airtimeTopup && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <p className="text-sm text-gray-900">{selectedPayout.paymentDetails.airtimeTopup.phoneNumber}</p>
                      </div>
                    )}
                    {selectedPayout.method === 'bank_transfer' && selectedPayout.paymentDetails.bankTransfer && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                          <p className="text-sm text-gray-900">{selectedPayout.paymentDetails.bankTransfer.accountNumber}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                          <p className="text-sm text-gray-900">{selectedPayout.paymentDetails.bankTransfer.bankName}</p>
                        </div>
                        {selectedPayout.paymentDetails.bankTransfer.routingNumber && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                            <p className="text-sm text-gray-900">{selectedPayout.paymentDetails.bankTransfer.routingNumber}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Add other payment method details as needed */}
                    {!['airtime_topup', 'bank_transfer'].includes(selectedPayout.method) && (
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(selectedPayout.paymentDetails, null, 2)}</pre>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-pt-dark-gray mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Requested At:</span>
                    <span className="text-sm text-gray-900">{new Date(selectedPayout.requestedAt).toLocaleString()}</span>
                  </div>
                  {selectedPayout.approvedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Approved At:</span>
                      <span className="text-sm text-gray-900">{new Date(selectedPayout.approvedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedPayout.processedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Processed At:</span>
                      <span className="text-sm text-gray-900">{new Date(selectedPayout.processedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedPayout.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Completed At:</span>
                      <span className="text-sm text-gray-900">{new Date(selectedPayout.completedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description & Notes */}
              {(selectedPayout.description || selectedPayout.adminNotes || selectedPayout.rejectionReason) && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-pt-dark-gray mb-4">Additional Information</h3>
                  {selectedPayout.description && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedPayout.description}</p>
                    </div>
                  )}
                  {selectedPayout.adminNotes && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                      <p className="text-sm text-gray-900 bg-blue-50 px-3 py-2 rounded-lg">{selectedPayout.adminNotes}</p>
                    </div>
                  )}
                  {selectedPayout.rejectionReason && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                      <p className="text-sm text-red-900 bg-red-50 px-3 py-2 rounded-lg">{selectedPayout.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction ID */}
              {selectedPayout.transactionId && (
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg font-mono">{selectedPayout.transactionId}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedPayout(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
