'use client'

import { useState, useEffect } from 'react'
import { api, Payout, ApiError } from '@/lib/api'
import { formatCurrencyWithSymbol } from '@/lib/utils/currency'
import type { PayoutQueryParams } from '@/lib/api/services/payout.service'

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve' | 'review'>('approve')
  const [bulkNotes, setBulkNotes] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [showApprovalWarning, setShowApprovalWarning] = useState(false)
  const [pendingApproval, setPendingApproval] = useState<{payoutId: string, notes?: string} | null>(null)
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvImportAction, setCsvImportAction] = useState<'approve' | 'review'>('approve')
  const [csvImportNotes, setCsvImportNotes] = useState('')
  const [lastBulkActionReport, setLastBulkActionReport] = useState<{
    timestamp: string;
    action: string;
    totalProcessed: number;
    successful: number;
    failed: number;
    successfulPayouts: any[];
    failedPayouts: any[];
  } | null>(null)
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
      
      // Always calculate stats from actual payouts data to ensure accuracy
      const payouts = Array.isArray(payoutsData) ? payoutsData : []
      
      const pendingPayouts = payouts.filter((p: any) => ['pending', 'review', 'requested', 'pending_review'].includes(p.status))
      const completedPayouts = payouts.filter((p: any) => ['approved', 'completed'].includes(p.status))
      
      setStats({
        total: payouts.length,
        pending: pendingPayouts.length,
        completed: completedPayouts.length,
        totalAmount: payouts.reduce((sum: number, p: any) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0)
      })
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



  const handleSelectAll = () => {
    // Allow selection of payouts that can still be acted upon (not completed/approved)
    const actionablePayouts = payouts.filter(p => 
      !['approved', 'completed', 'cancelled', 'failed'].includes(p.status)
    )
    if (selectedPayouts.length === actionablePayouts.length) {
      setSelectedPayouts([])
    } else {
      setSelectedPayouts(actionablePayouts.map(p => p.id))
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
      
      // Use the new bulk process endpoint
      const response = await api.payout.bulkProcess({
        payoutIds: selectedPayouts,
        action: bulkAction,
        adminNotes: bulkNotes
      })
      
      
      // Handle the response structure
      if (response && typeof response === 'object') {
        const { success, failed, successfulPayouts, failedPayouts } = response
        
        // Store report data for download
        setLastBulkActionReport({
          timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
          action: bulkAction,
          totalProcessed: selectedPayouts.length,
          successful: success || 0,
          failed: failed || 0,
          successfulPayouts: successfulPayouts || [],
          failedPayouts: failedPayouts || []
        })
        
        if (failed && failed > 0) {
          const errorMessages = failedPayouts?.map((fp: any) => `${fp.payoutId}: ${fp.error}`).join(', ') || 'Some payouts failed'
          setError(`${success || 0} payout(s) ${bulkAction}d successfully, but ${failed} failed: ${errorMessages}`)
        } else {
          setSuccess(`Successfully ${bulkAction}d ${success || selectedPayouts.length} payout(s)`)
        }
      } else {
        // Fallback if response structure is unexpected
        setSuccess(`Bulk ${bulkAction} operation completed`)
      }
      
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
      
      // Only run on client side
      if (typeof window === 'undefined') return
      
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

  const handleStatusUpdate = async (payoutId: string, action: 'approve' | 'review', notes?: string, reviewMessage?: string) => {
    try {
      setUpdating(payoutId)
      setError(null)
      
      // Use specific payout action methods based on action
      if (action === 'approve') {
        await api.payout.approvePayout(payoutId, { adminNotes: notes })
      } else if (action === 'review') {
        await api.payout.setPayoutToReview(payoutId, { 
          reviewMessage: reviewMessage || notes || 'Requires additional review', 
          adminNotes: notes 
        })
      }
      
      // Refresh payouts
      await loadPayouts()
      setSuccess(`Payout ${action === 'approve' ? 'approved' : 'set to review'} successfully`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || `Failed to ${action} payout`)
    } finally {
      setUpdating(null)
    }
  }

  const handleApprovalWithWarning = (payoutId: string, notes?: string) => {
    setPendingApproval({ payoutId, notes })
    setShowApprovalWarning(true)
  }

  const confirmApproval = async () => {
    if (!pendingApproval) return
    
    setShowApprovalWarning(false)
    await handleStatusUpdate(pendingApproval.payoutId, 'approve', pendingApproval.notes)
    setPendingApproval(null)
  }

  const handleCsvImport = async () => {
    if (!csvFile) return
    
    try {
      setUpdating('csv-import')
      setError(null)
      
      const text = await csvFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
      
      // Find payout ID column
      const idColumnIndex = headers.findIndex(h => 
        h.includes('id') || h.includes('payout') || h.includes('reference')
      )
      
      if (idColumnIndex === -1) {
        setError('CSV must contain a column with payout IDs (e.g., "id", "payout_id", "reference")')
        return
      }
      
      const payoutIds = lines.slice(1).map(line => {
        const columns = line.split(',')
        return columns[idColumnIndex]?.trim()
      }).filter(id => id)
      
      if (payoutIds.length === 0) {
        setError('No valid payout IDs found in CSV file')
        return
      }
      
      // Use the bulk process endpoint
      const response = await api.payout.bulkProcess({
        payoutIds: payoutIds,
        action: csvImportAction,
        adminNotes: csvImportNotes
      })
      
      
      // Handle the response structure
      if (response && typeof response === 'object') {
        const { success, failed, successfulPayouts, failedPayouts } = response
        
        // Store report data for download
        setLastBulkActionReport({
          timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
          action: `CSV Import - ${csvImportAction}`,
          totalProcessed: payoutIds.length,
          successful: success || 0,
          failed: failed || 0,
          successfulPayouts: successfulPayouts || [],
          failedPayouts: failedPayouts || []
        })
        
        if (failed && failed > 0) {
          const errorMessages = failedPayouts?.map((fp: any) => `${fp.payoutId}: ${fp.error}`).join(', ') || 'Some payouts failed'
          setError(`CSV Import: ${success || 0} payout(s) ${csvImportAction}d successfully, but ${failed} failed: ${errorMessages}`)
        } else {
          setSuccess(`CSV Import: Successfully ${csvImportAction}d ${success || payoutIds.length} payout(s)`)
        }
      } else {
        // Fallback if response structure is unexpected
        setSuccess(`CSV Import: Bulk ${csvImportAction} operation completed`)
      }
      
      setShowCsvImport(false)
      setCsvFile(null)
      setCsvImportNotes('')
      await loadPayouts()
    } catch (error) {
      console.error('Error with CSV import:', error)
      setError(error instanceof Error ? error.message : 'Failed to process CSV file')
    } finally {
      setUpdating(null)
    }
  }

  const downloadSampleCsv = () => {
    const sampleData = [
      ['payout_id', 'agent_code', 'amount', 'notes'],
      ['payout_123456789', 'AG001', '150.00', 'Sample payout 1'],
      ['payout_987654321', 'AG002', '275.50', 'Sample payout 2'],
      ['payout_456789123', 'AG003', '89.25', 'Sample payout 3']
    ]
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = 'payout_import_sample.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const downloadBulkActionReport = () => {
    if (!lastBulkActionReport) return
    
    const reportData = [
      ['Bulk Action Report'],
      ['Generated:', new Date().toLocaleString()],
      ['Action:', lastBulkActionReport.action.toUpperCase()],
      ['Total Processed:', lastBulkActionReport.totalProcessed.toString()],
      ['Successful:', lastBulkActionReport.successful.toString()],
      ['Failed:', lastBulkActionReport.failed.toString()],
      [''],
      ['SUCCESSFUL PAYOUTS'],
      ['Payout ID', 'Agent Code', 'Amount', 'Message']
    ]
    
    // Add successful payouts
    lastBulkActionReport.successfulPayouts.forEach(payout => {
      reportData.push([
        payout.payoutId || '',
        payout.agentCode || '',
        payout.amount?.toString() || '',
        payout.message || ''
      ])
    })
    
    // Add failed payouts section
    if (lastBulkActionReport.failedPayouts.length > 0) {
      reportData.push([''])
      reportData.push(['FAILED PAYOUTS'])
      reportData.push(['Payout ID', 'Error Message'])
      
      lastBulkActionReport.failedPayouts.forEach(payout => {
        reportData.push([
          payout.payoutId || '',
          payout.error || ''
        ])
      })
    }
    
    const csvContent = reportData.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `bulk-action-report-${lastBulkActionReport.timestamp}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'requested': 'bg-blue-100 text-blue-800 border-blue-200',
      'review': 'bg-orange-100 text-orange-800 border-orange-200',
      'pending_review': 'bg-orange-100 text-orange-800 border-orange-200',
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'processing': 'bg-purple-100 text-purple-800 border-purple-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
      'failed': 'bg-red-100 text-red-800 border-red-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getMethodIcon = (method: string) => {
    const icons = {
      'bank_transfer': '🏦',
      'planettalk_credit': '📱',
      'airtime_topup': '📞',
      'mobile_money': '💳',
      'paypal': '💰',
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
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">{success}</span>
          </div>
          {lastBulkActionReport && (
            <button
              onClick={downloadBulkActionReport}
              className="ml-4 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Report
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">{error}</span>
          </div>
          {lastBulkActionReport && (
            <button
              onClick={downloadBulkActionReport}
              className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Report
            </button>
          )}
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
              <p className="text-sm font-medium text-pt-light-gray">Pending/Review</p>
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
              <p className="text-sm font-medium text-pt-light-gray">Approved</p>
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
              <option value="pending">Pending</option>
              <option value="review">Under Review</option>
              <option value="approved">Approved</option>
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
              <option value="planettalk_credit">PlanetTalk Credit</option>
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
                  setBulkAction('review')
                  setShowBulkModal(true)
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Bulk Review
              </button>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCsvImport(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Import CSV
          </button>
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
                      checked={selectedPayouts.length > 0 && selectedPayouts.length === payouts.filter(p => !['approved', 'completed', 'cancelled', 'failed'].includes(p.status)).length}
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
                      {!['approved', 'completed', 'cancelled', 'failed'].includes(payout.status) && (
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
                            {payout.agent?.agentCode ? payout.agent.agentCode.slice(0, 2).toUpperCase() : payout.id.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          {payout.agent?.agentCode && (
                            <div className="inline-flex items-center px-2 py-1 bg-pt-turquoise/10 border border-pt-turquoise rounded-md mb-1">
                              <span className="text-sm font-bold text-pt-turquoise">{payout.agent.agentCode}</span>
                            </div>
                          )}
                          <div className="text-xs text-pt-light-gray">ID: {payout.id.slice(0, 12)}...</div>
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
                        {!['approved', 'completed', 'cancelled', 'failed'].includes(payout.status) && (
                          <>
                            <button
                              onClick={() => handleApprovalWithWarning(payout.id)}
                              disabled={updating === payout.id}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors duration-200 disabled:opacity-50"
                            >
                              {updating === payout.id ? '...' : 'Approve'}
                            </button>
                            {!['review', 'pending_review'].includes(payout.status) && (
                              <button
                                onClick={() => handleStatusUpdate(payout.id, 'review', 'Requires additional review')}
                                disabled={updating === payout.id}
                                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors duration-200 disabled:opacity-50"
                              >
                                {updating === payout.id ? '...' : 'Review'}
                              </button>
                            )}
                          </>
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
                Bulk {bulkAction === 'approve' ? 'Approve' : 'Review'} Payouts
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
              <div className={`border rounded-lg p-4 mb-6 ${bulkAction === 'approve' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${bulkAction === 'approve' ? 'bg-green-500' : 'bg-orange-500'}`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {bulkAction === 'approve' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <h3 className={`font-semibold ${bulkAction === 'approve' ? 'text-green-900' : 'text-orange-900'}`}>
                      {bulkAction === 'approve' ? 'Approve' : 'Set to Review'} {selectedPayouts.length} Payout{selectedPayouts.length !== 1 ? 's' : ''}
                    </h3>
                    <p className={`text-sm ${bulkAction === 'approve' ? 'text-green-700' : 'text-orange-700'}`}>
                      Selected payout requests will be {bulkAction === 'approve' ? 'approved' : 'set to review status'}
                    </p>
                  </div>
                </div>
                
                {/* Show selected payouts */}
                <div className="space-y-2">
                  {payouts
                    .filter(p => selectedPayouts.includes(p.id))
                    .slice(0, 3)
                    .map(payout => (
                      <div key={payout.id} className={`flex justify-between items-center text-sm ${bulkAction === 'approve' ? 'text-green-800' : 'text-orange-800'}`}>
                        <div className="flex items-center">
                          {payout.agent?.agentCode ? (
                            <span className="font-bold px-2 py-0.5 bg-white rounded border border-current mr-2">{payout.agent.agentCode}</span>
                          ) : (
                            <span className="text-xs opacity-75">{payout.id.slice(0, 8)}</span>
                          )}
                        </div>
                        <span className="font-semibold">{formatCurrencyWithSymbol(payout.amount)}</span>
                      </div>
                    ))
                  }
                  {selectedPayouts.length > 3 && (
                    <div className={`text-xs ${bulkAction === 'approve' ? 'text-green-600' : 'text-orange-600'}`}>
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
                      {bulkAction === 'approve' ? 'Confirm Approval' : 'Confirm Review Status'}
                    </h4>
                    <p className="text-sm text-yellow-800">
                      {bulkAction === 'approve' 
                        ? 'This will approve all selected payouts and they will be ready for processing. Agents will be notified via email.'
                        : 'This will set all selected payouts to review status for additional verification. Agents will be notified via email.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {bulkAction === 'approve' ? 'Approval Notes (Optional)' : 'Review Message'}
                </label>
                <textarea
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  placeholder={bulkAction === 'approve' 
                    ? "Add any notes about the approval (e.g., batch approved, verified earnings, etc.)"
                    : "Explain why these payouts need additional review (this will be sent to agents)"
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  required={bulkAction === 'review'}
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
                  disabled={updating === 'bulk' || (bulkAction === 'review' && !bulkNotes.trim())}
                  className={`px-6 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                    bulkAction === 'approve' 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {updating === 'bulk' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {bulkAction === 'approve' ? 'Approving...' : 'Setting to Review...'}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {bulkAction === 'approve' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                      {bulkAction === 'approve' ? 'Approve All' : 'Set to Review'}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Agent Code</label>
                      <div className="inline-flex items-center px-4 py-2 bg-pt-turquoise/10 border-2 border-pt-turquoise rounded-lg">
                        <span className="text-lg font-bold text-pt-turquoise tracking-wide">{selectedPayout.agent.agentCode}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                      <p className="text-sm text-gray-900">{selectedPayout.agent.user?.firstName} {selectedPayout.agent.user?.lastName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-sm text-gray-900">{selectedPayout.agent.user?.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {selectedPayout.paymentDetails && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-pt-dark-gray mb-4">Payment Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedPayout.method === 'planettalk_credit' && selectedPayout.paymentDetails.planettalkCredit && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">PlanetTalk Mobile</label>
                          <p className="text-sm text-gray-900">{selectedPayout.paymentDetails.planettalkCredit.planettalkMobile}</p>
                        </div>
                        {selectedPayout.paymentDetails.planettalkCredit.accountName && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                            <p className="text-sm text-gray-900">{selectedPayout.paymentDetails.planettalkCredit.accountName}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedPayout.method === 'bank_transfer' && selectedPayout.paymentDetails.bankAccount && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                          <p className="text-sm text-gray-900">{selectedPayout.paymentDetails.bankAccount.bankName}</p>
                        </div>
                        {selectedPayout.paymentDetails.bankAccount.branchNameOrCode && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name/Code</label>
                            <p className="text-sm text-gray-900">{selectedPayout.paymentDetails.bankAccount.branchNameOrCode}</p>
                          </div>
                        )}
                        {selectedPayout.paymentDetails.bankAccount.accountName && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                            <p className="text-sm text-gray-900">{selectedPayout.paymentDetails.bankAccount.accountName}</p>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number/IBAN</label>
                          <p className="text-sm text-gray-900">{selectedPayout.paymentDetails.bankAccount.accountNumberOrIban}</p>
                        </div>
                        {selectedPayout.paymentDetails.bankAccount.swiftBicCode && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SWIFT/BIC Code</label>
                            <p className="text-sm text-gray-900">{selectedPayout.paymentDetails.bankAccount.swiftBicCode}</p>
                          </div>
                        )}
                        {selectedPayout.paymentDetails.bankAccount.currency && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                            <p className="text-sm text-gray-900">{selectedPayout.paymentDetails.bankAccount.currency}</p>
                          </div>
                        )}
                        {selectedPayout.paymentDetails.bankAccount.bankCountry && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Country</label>
                            <p className="text-sm text-gray-900">{selectedPayout.paymentDetails.bankAccount.bankCountry}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Add other payment method details as needed */}
                    {!['planettalk_credit', 'bank_transfer'].includes(selectedPayout.method) && (
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
                </div>
              </div>

              {/* Description & Notes */}
              {(selectedPayout.description || selectedPayout.adminNotes || selectedPayout.reviewMessage) && (
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
                  {selectedPayout.reviewMessage && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Review Message</label>
                      <p className="text-sm text-orange-900 bg-orange-50 px-3 py-2 rounded-lg">{selectedPayout.reviewMessage}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between p-6 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                {selectedPayout && !['approved', 'completed', 'cancelled', 'failed'].includes(selectedPayout.status) && (
                  <>
                    <button
                      onClick={() => handleApprovalWithWarning(selectedPayout.id)}
                      disabled={updating === selectedPayout.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 flex items-center"
                    >
                      {updating === selectedPayout.id ? (
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </>
                      )}
                    </button>
                    {!['review', 'pending_review'].includes(selectedPayout.status) && (
                      <button
                        onClick={() => handleStatusUpdate(selectedPayout.id, 'review', 'Requires additional review')}
                        disabled={updating === selectedPayout.id}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50 flex items-center"
                      >
                        {updating === selectedPayout.id ? (
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
                            Set to Review
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
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

      {/* Approval Warning Modal */}
      {showApprovalWarning && pendingApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-pt-dark-gray">Confirm Approval</h2>
              </div>
              <button
                onClick={() => {
                  setShowApprovalWarning(false)
                  setPendingApproval(null)
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
              <div className="mb-6">
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-1">Are you sure you want to approve this payout?</h4>
                    <p className="text-sm text-yellow-800">
                      This action cannot be undone. The payout will be processed and the agent will be notified via email.
                    </p>
                    <p className="text-sm text-yellow-800 mt-2">
                      <strong>Payout ID:</strong> {pendingApproval.payoutId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowApprovalWarning(false)
                    setPendingApproval(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApproval}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Yes, Approve Payout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-pt-dark-gray">Import CSV for Bulk Actions</h2>
              <button
                onClick={() => {
                  setShowCsvImport(false)
                  setCsvFile(null)
                  setCsvImportNotes('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* CSV Format Guide */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements</h4>
                    <div className="text-sm text-blue-800 space-y-2">
                      <p><strong>Required:</strong> One column containing payout IDs</p>
                      <p><strong>Accepted column names:</strong> &quot;id&quot;, &quot;payout_id&quot;, &quot;reference&quot;, or any column containing these words</p>
                      <p><strong>Format:</strong> Standard CSV with comma separators and headers in the first row</p>
                      <div className="bg-white rounded p-2 mt-2 font-mono text-xs">
                        <div className="text-gray-600">Example:</div>
                        <div>payout_id,agent_code,amount</div>
                        <div>payout_123456789,AG001,150.00</div>
                        <div>payout_987654321,AG002,275.50</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={downloadSampleCsv}
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Sample CSV
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      {csvFile ? csvFile.name : 'Click to upload CSV file'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Only CSV files are accepted
                    </p>
                  </label>
                </div>
              </div>

              {/* Action Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action to Perform</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="approve"
                      checked={csvImportAction === 'approve'}
                      onChange={(e) => setCsvImportAction(e.target.value as 'approve' | 'review')}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-900">Approve</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="review"
                      checked={csvImportAction === 'review'}
                      onChange={(e) => setCsvImportAction(e.target.value as 'approve' | 'review')}
                      className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 focus:ring-orange-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-900">Set to Review</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {csvImportAction === 'approve' ? 'Approval Notes (Optional)' : 'Review Message'}
                </label>
                <textarea
                  value={csvImportNotes}
                  onChange={(e) => setCsvImportNotes(e.target.value)}
                  placeholder={csvImportAction === 'approve' 
                    ? "Add any notes about the bulk approval"
                    : "Explain why these payouts need review"
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  required={csvImportAction === 'review'}
                />
              </div>

              {/* Warning */}
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">Bulk Action Warning</h4>
                  <p className="text-sm text-yellow-800">
                    This will {csvImportAction} all payouts listed in the CSV file. Make sure you have verified the file contents before proceeding.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCsvImport(false)
                    setCsvFile(null)
                    setCsvImportNotes('')
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCsvImport}
                  disabled={!csvFile || updating === 'csv-import' || (csvImportAction === 'review' && !csvImportNotes.trim())}
                  className={`px-6 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                    csvImportAction === 'approve' 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {updating === 'csv-import' ? (
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      Import & {csvImportAction === 'approve' ? 'Approve' : 'Review'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
