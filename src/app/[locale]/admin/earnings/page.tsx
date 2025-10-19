'use client'

import { useState, useEffect } from 'react'
import { api, Earning, BulkAgentDataUploadResponse } from '@/lib/api'
import { formatCurrencyWithSymbol } from '@/lib/utils/currency'

interface BulkUploadData {
  agentCode: string
  totalEarnings: number
  earningsForCurrentMonth: number
  totalReferrals: number
  referralsForCurrentMonth: number
  availableBalance: number
  totalPayoutAmount: number
}

// Helper function to derive earning type from description or metadata
const deriveEarningType = (earning: Earning): string => {
  // If type is explicitly provided, use it
  if (earning.type) return earning.type

  // Try to derive from metadata
  if (earning.metadata?.earningType) return earning.metadata.earningType

  // Try to derive from description
  const desc = earning.description?.toLowerCase() || ''
  if (desc.includes('referral') || desc.includes('commission')) return 'referral_commission'
  if (desc.includes('bonus') || desc.includes('promotion')) return 'bonus'
  if (desc.includes('penalty') || desc.includes('deduction')) return 'penalty'
  if (desc.includes('adjustment') || desc.includes('correction')) return 'adjustment'

  // Check amount - negative amounts might be penalties
  const amount = typeof earning.amount === 'string' ? parseFloat(earning.amount) : earning.amount
  if (amount < 0) return 'penalty'

  // Default to referral_commission for positive amounts
  return 'referral_commission'
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [batchDescription, setBatchDescription] = useState('')
  const [autoConfirm, setAutoConfirm] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [lastUploadResult, setLastUploadResult] = useState<BulkAgentDataUploadResponse | null>(null)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [selectedEarnings, setSelectedEarnings] = useState<string[]>([])
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false)
  const [bulkApproveNotes, setBulkApproveNotes] = useState('')
  const [approvingEarning, setApprovingEarning] = useState<string | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    type: '',
    agentCode: '',
    startDate: '',
    endDate: ''
  })
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    totalAmount: 0
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  })

  useEffect(() => {
    loadEarnings()
  }, [filters])

  useEffect(() => {
    // Clear success/error messages after 5 seconds
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
    if (error) {
      const timer = setTimeout(() => setError(null), 8000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const loadEarnings = async () => {
    try {
      setLoading(true)
      const response = await api.admin.getAllEarnings(filters)
      
      // Handle paginated response structure
      let earningsData: Earning[] = []
      let paginationData: any = {}
      let metricsData: any = {}
      
      if (Array.isArray(response)) {
        earningsData = response
      } else {
        earningsData = (response as any).earnings || (response as any).data || []
        paginationData = (response as any).pagination || {}
        metricsData = (response as any).metrics || (response as any).stats || {}
      }
      
      setEarnings(Array.isArray(earningsData) ? earningsData : [])
      
      // Update pagination state
      setPagination({
        page: paginationData.page || filters.page || 1,
        limit: paginationData.limit || filters.limit || 20,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || 1
      })

      // Update stats from metrics.overview
      const overview = metricsData.overview || {}
      setStats({
        total: overview.totalEarnings || earningsData.length,
        pending: overview.pendingEarnings || 0,
        confirmed: overview.confirmedEarnings || 0,
        totalAmount: overview.totalAmount || 0
      })
    } catch (error) {
      setError('Failed to load earnings')
      setEarnings([])
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 1 })
      setStats({ total: 0, pending: 0, confirmed: 0, totalAmount: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpload = async () => {
    if (!csvFile) return
    
    try {
      setIsUploading(true)
      setError(null)
      
      const text = await csvFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/ /g, '_'))
      
      // Find required columns
      const agentCodeIndex = headers.findIndex(h => h.includes('agent'))
      const totalEarningsIndex = headers.findIndex(h => h.includes('total') && h.includes('earning'))
      const currentMonthEarningsIndex = headers.findIndex(h => h.includes('current') && h.includes('month') && h.includes('earning'))
      const totalReferralsIndex = headers.findIndex(h => h.includes('total') && h.includes('referral'))
      const currentMonthReferralsIndex = headers.findIndex(h => h.includes('current') && h.includes('month') && h.includes('referral'))
      const availableBalanceIndex = headers.findIndex(h => h.includes('available') || h.includes('balance'))
      const totalPayoutIndex = headers.findIndex(h => h.includes('payout'))
      
      if (agentCodeIndex === -1 || totalEarningsIndex === -1 || currentMonthEarningsIndex === -1) {
        setError('CSV must contain columns: Agent Code, Total Earnings, Earnings for Current Month')
        return
      }
      
      // Parse CSV data
      const agentsData: BulkUploadData[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(col => col.trim())
        if (columns.length < 3) continue
        
        const agentData: BulkUploadData = {
          agentCode: columns[agentCodeIndex],
          totalEarnings: parseFloat(columns[totalEarningsIndex]) || 0,
          earningsForCurrentMonth: parseFloat(columns[currentMonthEarningsIndex]) || 0,
          totalReferrals: totalReferralsIndex !== -1 ? parseInt(columns[totalReferralsIndex]) || 0 : 0,
          referralsForCurrentMonth: currentMonthReferralsIndex !== -1 ? parseInt(columns[currentMonthReferralsIndex]) || 0 : 0,
          availableBalance: availableBalanceIndex !== -1 ? parseFloat(columns[availableBalanceIndex]) || 0 : 0,
          totalPayoutAmount: totalPayoutIndex !== -1 ? parseFloat(columns[totalPayoutIndex]) || 0 : 0
        }
        
        agentsData.push(agentData)
      }
      
      if (agentsData.length === 0) {
        setError('No valid agent data found in CSV file')
        return
      }
      
      // Upload via new API endpoint
      const response = await api.admin.bulkUploadAgentData({
        agentsData: agentsData,
        batchDescription: batchDescription || `CSV Upload - ${new Date().toLocaleString()}`,
        autoUpdate: autoConfirm,
        metadata: {
          filename: csvFile.name,
          uploadSource: 'Admin Panel'
        }
      })
      
      setLastUploadResult(response)
      setShowBulkUpload(false)
      setShowResultsModal(true)
      setCsvFile(null)
      setBatchDescription('')
      await loadEarnings()
    } catch (error) {
      console.error('Error with bulk upload:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload earnings')
    } finally {
      setIsUploading(false)
    }
  }

  const handleApproveEarning = async (earningId: string) => {
    try {
      setApprovingEarning(earningId)
      setError(null)
      
      await api.admin.approveEarning(earningId)
      
      await loadEarnings()
      setSuccess('Earning approved and balance updated successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error approving earning:', error)
      setError(error instanceof Error ? error.message : 'Failed to approve earning')
    } finally {
      setApprovingEarning(null)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedEarnings.length === 0) return
    
    try {
      setIsUploading(true)
      setError(null)
      
      const response = await api.admin.bulkApproveEarnings({
        earningIds: selectedEarnings,
        notes: bulkApproveNotes
      })
      
      setShowBulkApproveModal(false)
      setBulkApproveNotes('')
      setSelectedEarnings([])
      
      await loadEarnings()
      setSuccess(`${response.approved} earnings approved successfully. Agent balances have been updated.`)
      setTimeout(() => setSuccess(null), 5000)
    } catch (error) {
      console.error('Error with bulk approve:', error)
      setError(error instanceof Error ? error.message : 'Failed to approve earnings')
    } finally {
      setIsUploading(false)
    }
  }

  const toggleEarningSelection = (earningId: string) => {
    setSelectedEarnings(prev => 
      prev.includes(earningId) 
        ? prev.filter(id => id !== earningId)
        : [...prev, earningId]
    )
  }

  const toggleAllEarnings = () => {
    const pendingEarnings = earnings.filter(e => e.status === 'pending')
    if (selectedEarnings.length === pendingEarnings.length) {
      setSelectedEarnings([])
    } else {
      setSelectedEarnings(pendingEarnings.map(e => e.id))
    }
  }

  const handleExportCSV = async () => {
    try {
      setIsExporting(true)
      setError(null)
      
      const blob = await api.admin.exportEarnings({ ...filters, format: 'csv' })
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `earnings-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setSuccess('Earnings exported successfully')
    } catch (error) {
      console.error('Error exporting earnings:', error)
      setError(error instanceof Error ? error.message : 'Failed to export earnings')
    } finally {
      setIsExporting(false)
    }
  }

  const downloadSampleCsv = () => {
    const sampleData = [
      ['Agent Code', 'Total Earnings', 'Earnings for Current Month', 'Total Referrals', 'Referrals for Current Month', 'Available Balance', 'Total Payout Amount'],
      ['AGT21618', '125.50', '25.50', '45', '5', '100.00', '25.50'],
      ['AGT92654', '250.00', '50.00', '80', '10', '200.00', '50.00'],
      ['AGT33421', '175.75', '35.75', '60', '8', '150.00', '25.75'],
      ['AGT88012', '95.25', '20.25', '30', '4', '80.00', '15.25']
    ]
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = 'agent_earnings_upload_sample.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const downloadUploadReport = () => {
    if (!lastUploadResult) return
    
    const reportData = [
      ['Agent Earnings Bulk Upload Report'],
      ['Generated:', new Date().toLocaleString()],
      ['Batch ID:', lastUploadResult.batchId],
      ['Description:', lastUploadResult.description || 'N/A'],
      ['Total Processed:', lastUploadResult.totalProcessed.toString()],
      ['Successful:', lastUploadResult.successful.toString()],
      ['Failed:', lastUploadResult.failed.toString()],
      ['Skipped:', (lastUploadResult.skipped || 0).toString()],
      ['Updated Agents:', (lastUploadResult.updatedAgents?.length || 0).toString()],
      ['Processing Time (ms):', (lastUploadResult.processingTimeMs || 0).toString()],
      [''],
      ['DETAILED RESULTS'],
      ['Agent Code', 'Status', 'Updated Fields', 'Message/Error']
    ]
    
    lastUploadResult.details.forEach(detail => {
      reportData.push([
        detail.agentCode,
        detail.status,
        detail.updatedFields?.join(', ') || '',
        detail.message || detail.error || ''
      ])
    })
    
    if (lastUploadResult.errorSummary?.invalidAgentCodes && lastUploadResult.errorSummary.invalidAgentCodes.length > 0) {
      reportData.push([''])
      reportData.push(['INVALID AGENT CODES'])
      lastUploadResult.errorSummary.invalidAgentCodes.forEach(code => {
        reportData.push([code])
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
    a.download = `earnings-upload-report-${lastUploadResult.batchId}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const getTypeColor = (type: string) => {
    const colors = {
      'referral_commission': 'bg-blue-100 text-blue-800 border-blue-200',
      'bonus': 'bg-green-100 text-green-800 border-green-200',
      'penalty': 'bg-red-100 text-red-800 border-red-200',
      'adjustment': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'promotion_bonus': 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'confirmed': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
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
        <h1 className="text-3xl font-bold text-pt-dark-gray mb-2">Earnings Management</h1>
        <p className="text-pt-light-gray">Manage agent earnings, commissions, and bulk uploads</p>
      </div>

      {/* Success/Error Alerts */}
      {success && !showResultsModal && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}

      {error && !showResultsModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">{error}</span>
          </div>
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
              <p className="text-sm font-medium text-pt-light-gray">Total Earnings</p>
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
              <p className="text-sm font-medium text-pt-light-gray">Pending</p>
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
              <p className="text-sm font-medium text-pt-light-gray">Confirmed</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.confirmed}</p>
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
              {(filters.status || filters.type || filters.agentCode || filters.startDate || filters.endDate) && (
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
                <label className="block text-sm font-medium text-pt-dark-gray mb-2">Status</label>
              <select
                value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200"
              >
                  <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                  <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-pt-dark-gray mb-2">Type</label>
              <select
                value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200"
              >
                  <option value="">All Types</option>
                <option value="referral_commission">Referral Commission</option>
                <option value="bonus">Bonus</option>
                <option value="penalty">Penalty</option>
                <option value="adjustment">Adjustment</option>
                  <option value="promotion_bonus">Promotion Bonus</option>
              </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-pt-dark-gray mb-2">Agent Code</label>
              <input
                type="text"
                  value={filters.agentCode}
                  onChange={(e) => setFilters(prev => ({ ...prev, agentCode: e.target.value, page: 1 }))}
                  placeholder="Search by agent code..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200"
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-pt-dark-gray mb-2">Date From</label>
              <input
                type="date"
                value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200"
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-pt-dark-gray mb-2">Date To</label>
              <input
                type="date"
                value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200"
              />
            </div>
          </div>

            <div className="flex justify-end mt-4">
            <button
                onClick={() => setFilters({ page: 1, limit: 20, status: '', type: '', agentCode: '', startDate: '', endDate: '' })}
                className="px-4 py-2 text-pt-turquoise hover:text-pt-turquoise-600 font-medium transition-colors duration-200"
              >
                Clear Filters
            </button>
            </div>
          </div>
        )}
          </div>

      {/* Action Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-pt-dark-gray">Earnings Records</h2>
        </div>
        
        <div className="flex items-center space-x-3">
              <button
            onClick={() => setShowBulkUpload(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Bulk Upload
              </button>
              <button
            onClick={handleExportCSV}
            disabled={isExporting || earnings.length === 0}
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
            
      {/* Bulk Actions Bar */}
      {selectedEarnings.length > 0 && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-800 font-medium">{selectedEarnings.length} earning(s) selected</span>
          </div>
          <button
            onClick={() => setShowBulkApproveModal(true)}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center font-medium shadow-md"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Bulk Approve Selected
          </button>
        </div>
      )}

      {/* Earnings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pt-turquoise mx-auto mb-4"></div>
            <p className="text-pt-light-gray">Loading earnings...</p>
          </div>
        ) : earnings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
          </div>
            <h3 className="text-lg font-medium text-pt-dark-gray mb-2">No earnings found</h3>
            <p className="text-pt-light-gray mb-4">No earnings records match your current filters.</p>
              <button
              onClick={() => setShowBulkUpload(true)}
              className="px-4 py-2 bg-pt-turquoise text-white rounded-lg hover:bg-pt-turquoise-600 transition-colors duration-200"
            >
              Upload Earnings
              </button>
            </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                  {earnings.some(e => e.status === 'pending') && (
                    <th className="px-4 py-4 text-left">
                      <input
                        type="checkbox"
                        onChange={toggleAllEarnings}
                        checked={selectedEarnings.length > 0 && selectedEarnings.length === earnings.filter(e => e.status === 'pending').length}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Earned Date</th>
                  {earnings.some(e => e.status === 'pending') && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-pt-dark-gray uppercase tracking-wider">Actions</th>
                  )}
              </tr>
            </thead>
              <tbody className="divide-y divide-gray-200">
              {earnings.map((earning) => (
                  <tr key={earning.id} className="hover:bg-gray-50 transition-colors duration-200">
                    {earnings.some(e => e.status === 'pending') && (
                      <td className="px-4 py-4">
                        {earning.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedEarnings.includes(earning.id)}
                            onChange={() => toggleEarningSelection(earning.id)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-pt-turquoise rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-medium">
                            {(earning.agent?.agentCode || 'AG').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-pt-dark-gray">{earning.agent?.agentCode || 'Unknown'}</div>
                          <div className="text-sm text-pt-light-gray">{earning.agent?.firstName} {earning.agent?.lastName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const amount = typeof earning.amount === 'string' ? parseFloat(earning.amount) : earning.amount
                        return (
                          <div className={`text-sm font-medium ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {amount >= 0 ? '+' : ''}{formatCurrencyWithSymbol(amount)}
                          </div>
                        )
                      })()}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const earningType = deriveEarningType(earning)
                      return (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(earningType)}`}>
                          {earningType.replace('_', ' ').toUpperCase()}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(earning.status || '')}`}>
                      {earning.status ? earning.status.toUpperCase() : 'UNKNOWN'}
                  </span>
                </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-pt-dark-gray max-w-xs truncate" title={earning.description}>
                        {earning.description}
                      </div>
                      {earning.referralCode && (
                        <div className="text-sm text-pt-light-gray">Ref: {earning.referralCode}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-pt-dark-gray">
                      {new Date(earning.earnedAt).toLocaleDateString()}
                    </td>
                    {earnings.some(e => e.status === 'pending') && (
                      <td className="px-6 py-4">
                        {earning.status === 'pending' && (
                          <button
                            onClick={() => handleApproveEarning(earning.id)}
                            disabled={approvingEarning === earning.id}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          >
                            {approvingEarning === earning.id ? (
                              <>
                                <svg className="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Approving...
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Approve
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
          
          {/* Pagination */}
          {!loading && earnings.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
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

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-pt-dark-gray">Bulk Upload Agent Earnings Data</h2>
                <button
                  onClick={() => {
                  setShowBulkUpload(false)
                  setCsvFile(null)
                  setBatchDescription('')
                  setAutoConfirm(false)
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
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-blue-900 mb-3">CSV Format Requirements</h4>
                    <div className="text-sm text-blue-800 space-y-2">
                      <div>
                        <p className="font-semibold mb-1">Required Columns:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-2">
                          <li>Agent Code</li>
                          <li>Total Earnings</li>
                          <li>Earnings for Current Month</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Optional Columns:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-2">
                          <li>Total Referrals</li>
                          <li>Referrals for Current Month</li>
                          <li>Available Balance</li>
                          <li>Total Payout Amount</li>
                        </ul>
                      </div>
                      <div className="bg-white rounded p-3 mt-3">
                        <p className="font-semibold text-gray-700 mb-2">Example Format:</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs font-mono">
                            <thead>
                              <tr className="border-b border-gray-300">
                                <th className="text-left py-1 px-2 whitespace-nowrap">Agent Code</th>
                                <th className="text-left py-1 px-2 whitespace-nowrap">Total Earnings</th>
                                <th className="text-left py-1 px-2 whitespace-nowrap">Current Month</th>
                                <th className="text-left py-1 px-2 whitespace-nowrap">Total Refs</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="text-gray-700">
                                <td className="py-1 px-2">AGT21618</td>
                                <td className="py-1 px-2">125.50</td>
                                <td className="py-1 px-2">25.50</td>
                                <td className="py-1 px-2">45</td>
                              </tr>
                              <tr className="text-gray-700">
                                <td className="py-1 px-2">AGT92654</td>
                                <td className="py-1 px-2">250.00</td>
                                <td className="py-1 px-2">50.00</td>
                                <td className="py-1 px-2">80</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={downloadSampleCsv}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              
              {/* Batch Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Description (Optional)</label>
                <input
                  type="text"
                  value={batchDescription}
                  onChange={(e) => setBatchDescription(e.target.value)}
                  placeholder="e.g., January 2025 commission upload"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Auto Update - Prominent Default */}
              <div className={`border-2 rounded-lg p-4 transition-all ${
                autoConfirm 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="auto-update"
                    checked={autoConfirm}
                    onChange={(e) => setAutoConfirm(e.target.checked)}
                    className="mt-1 w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <label htmlFor="auto-update" className="flex items-center text-sm font-semibold text-gray-900 mb-2 cursor-pointer">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Auto-Update Agent Data
                      <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-bold">RECOMMENDED</span>
                    </label>
                    <div className={`text-sm space-y-2 ${autoConfirm ? 'text-green-800' : 'text-gray-600'}`}>
                      <p className="font-medium">
                        ✓ When enabled (default):
                      </p>
                      <ul className="ml-4 space-y-1">
                        <li>• Agent earnings and referrals are updated immediately</li>
                        <li>• Balances are automatically calculated</li>
                        <li>• Data is synced across all dashboards</li>
                        <li>• No manual updates required</li>
                      </ul>
                      {!autoConfirm && (
                        <>
                          <p className="font-medium text-yellow-700 mt-2">
                            ⚠ When disabled:
                          </p>
                          <ul className="ml-4 space-y-1 text-yellow-700">
                            <li>• Data uploaded but NOT applied</li>
                            <li>• Manual review and approval needed</li>
                            <li>• Balances will not update</li>
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">Upload Warning</h4>
                  <p className="text-sm text-yellow-800">
                    This will update agent data for all rows in the CSV file. Make sure you have verified the file contents and agent codes before uploading.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBulkUpload(false)
                    setCsvFile(null)
                    setBatchDescription('')
                    setAutoConfirm(true)
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!csvFile || isUploading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      Upload Agent Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Approve Modal */}
      {showBulkApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-green-500 to-green-600 px-8 py-6 rounded-t-2xl">
                <button
                  onClick={() => {
                    setShowBulkApproveModal(false)
                    setBulkApproveNotes('')
                  }}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold text-white">Bulk Approve Earnings</h2>
                <p className="text-green-100 text-sm mt-1">Approve {selectedEarnings.length} pending earning(s)</p>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-6">
                {/* Info Box */}
                <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-green-900 mb-2">What happens when you approve:</h3>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>✓ All {selectedEarnings.length} earning(s) will be confirmed</li>
                        <li>✓ Agent balances will be automatically updated</li>
                        <li>✓ Agents can request payouts immediately</li>
                        <li>✓ Changes are permanent and cannot be undone</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Notes Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={bulkApproveNotes}
                    onChange={(e) => setBulkApproveNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                    placeholder="e.g., Batch approval for October 2025 commissions"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowBulkApproveModal(false)
                      setBulkApproveNotes('')
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkApprove}
                    disabled={isUploading}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Approving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Approve {selectedEarnings.length} Earnings
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Results Modal */}
      {showResultsModal && lastUploadResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
              {/* Modal Header */}
              <div className={`relative px-8 py-6 rounded-t-2xl ${
                lastUploadResult.failed > 0 || (lastUploadResult.skipped || 0) > 0
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-gradient-to-r from-green-500 to-green-600'
              }`}>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold text-white">Bulk Upload Results</h2>
                <p className="text-white/90 text-sm mt-1">Batch ID: {lastUploadResult.batchId}</p>
              </div>

              {/* Summary Stats */}
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{lastUploadResult.totalProcessed}</div>
                    <div className="text-sm text-blue-700 font-medium mt-1">Total Processed</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{lastUploadResult.successful}</div>
                    <div className="text-sm text-green-700 font-medium mt-1">Successful</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-red-600">{lastUploadResult.failed}</div>
                    <div className="text-sm text-red-700 font-medium mt-1">Failed</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-600">{lastUploadResult.skipped || 0}</div>
                    <div className="text-sm text-yellow-700 font-medium mt-1">Skipped</div>
                  </div>
                </div>

                {/* Total Amount */}
                {lastUploadResult.totalAmount !== undefined && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-700">Total Amount Processed:</span>
                      <span className="text-2xl font-bold text-purple-900">{formatCurrencyWithSymbol(lastUploadResult.totalAmount)}</span>
                    </div>
                  </div>
                )}

                {/* Batch Information */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Batch Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Batch ID:</span>
                      <p className="font-mono text-gray-900">{lastUploadResult.batchId}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Uploaded At:</span>
                      <p className="text-gray-900">{new Date(lastUploadResult.uploadedAt).toLocaleString()}</p>
                    </div>
                    {lastUploadResult.processingTimeMs !== undefined && (
                      <div>
                        <span className="text-gray-500">Processing Time:</span>
                        <p className="text-gray-900">{lastUploadResult.processingTimeMs}ms</p>
                      </div>
                    )}
                    {lastUploadResult.uploadedBy && (
                      <div>
                        <span className="text-gray-500">Uploaded By:</span>
                        <p className="text-gray-900">{lastUploadResult.uploadedBy}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Summary */}
                {lastUploadResult.errorSummary && (
                  (lastUploadResult.errorSummary.duplicateReferences?.length || 0) > 0 || 
                  (lastUploadResult.errorSummary.invalidAgentCodes?.length || 0) > 0 ||
                  (lastUploadResult.errorSummary.validationErrors?.length || 0) > 0 ||
                  (lastUploadResult.errorSummary.otherErrors?.length || 0) > 0
                ) && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Error Summary
                    </h3>
                    <div className="space-y-3 text-sm">
                      {lastUploadResult.errorSummary?.duplicateReferences && lastUploadResult.errorSummary.duplicateReferences.length > 0 && (
                        <div>
                          <p className="font-medium text-red-900 mb-1">Duplicate Reference IDs ({lastUploadResult.errorSummary.duplicateReferences.length}):</p>
                          <div className="bg-white rounded p-2 max-h-24 overflow-y-auto">
                            <div className="flex flex-wrap gap-1">
                              {lastUploadResult.errorSummary.duplicateReferences.map((ref, idx) => (
                                <span key={idx} className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-mono">
                                  {ref}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {lastUploadResult.errorSummary?.invalidAgentCodes && lastUploadResult.errorSummary.invalidAgentCodes.length > 0 && (
                        <div>
                          <p className="font-medium text-red-900 mb-1">Invalid Agent Codes ({lastUploadResult.errorSummary.invalidAgentCodes.length}):</p>
                          <div className="bg-white rounded p-2 max-h-24 overflow-y-auto">
                            <div className="flex flex-wrap gap-1">
                              {lastUploadResult.errorSummary.invalidAgentCodes.map((code, idx) => (
                                <span key={idx} className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-mono">
                                  {code}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {lastUploadResult.errorSummary?.validationErrors && lastUploadResult.errorSummary.validationErrors.length > 0 && (
                        <div>
                          <p className="font-medium text-red-900 mb-1">Validation Errors:</p>
                          <ul className="bg-white rounded p-2 space-y-1 text-red-700">
                            {lastUploadResult.errorSummary.validationErrors.map((err, idx) => (
                              <li key={idx}>• {err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {lastUploadResult.errorSummary?.otherErrors && lastUploadResult.errorSummary.otherErrors.length > 0 && (
                        <div>
                          <p className="font-medium text-red-900 mb-1">Other Errors:</p>
                          <ul className="bg-white rounded p-2 space-y-1 text-red-700">
                            {lastUploadResult.errorSummary.otherErrors.map((err, idx) => (
                              <li key={idx}>• {err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Detailed Results */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Detailed Results ({lastUploadResult.details.length} items)
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Agent Code</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Updated Fields</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastUploadResult.details.map((detail, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-gray-900">{detail.agentCode}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                detail.status === 'success' 
                                  ? 'bg-green-100 text-green-800'
                                  : detail.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {detail.status === 'success' ? '✓ Success' : detail.status === 'failed' ? '✗ Failed' : '⊘ Skipped'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {detail.updatedFields && detail.updatedFields.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {detail.updatedFields.map((field, fieldIdx) => (
                                    <span key={fieldIdx} className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                      {field}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {detail.error && (
                                <span className="text-red-600">{detail.error}</span>
                              )}
                              {detail.message && !detail.error && (
                                <span className="text-gray-600">{detail.message}</span>
                              )}
                              {detail.earningId && (
                                <div className="text-green-600 text-xs mt-1">ID: {detail.earningId}</div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={downloadUploadReport}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center font-medium"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Full Report
                  </button>
                  <button
                    onClick={() => setShowResultsModal(false)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}