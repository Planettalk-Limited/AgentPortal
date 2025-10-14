'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api, Agent, PaginatedResponse } from '@/lib/api'
import { formatCurrencyWithSymbol } from '@/lib/utils/currency'
import CountryPicker from '@/components/CountryPicker'
import PhoneNumberInput from '@/components/PhoneNumberInput'

// Mapping from country codes to phone codes
const countryToPhoneCodeMap: Record<string, string> = {
  'US': '+1', 'CA': '+1', 'GB': '+44', 'AU': '+61', 'DE': '+49', 'FR': '+33', 'IT': '+39', 'ES': '+34',
  'NL': '+31', 'BE': '+32', 'CH': '+41', 'AT': '+43', 'SE': '+46', 'NO': '+47', 'DK': '+45', 'FI': '+358',
  'IE': '+353', 'PT': '+351', 'GR': '+30', 'PL': '+48', 'CZ': '+420', 'HU': '+36', 'RO': '+40',
  'BG': '+359', 'HR': '+385', 'SI': '+386', 'SK': '+421', 'LT': '+370', 'LV': '+371', 'EE': '+372',
  'RU': '+7', 'CN': '+86', 'JP': '+81', 'KR': '+82', 'IN': '+91', 'PK': '+92', 'BD': '+880', 'LK': '+94',
  'TH': '+66', 'VN': '+84', 'MY': '+60', 'SG': '+65', 'ID': '+62', 'PH': '+63', 'TW': '+886', 'HK': '+852',
  'MO': '+853', 'BR': '+55', 'AR': '+54', 'CL': '+56', 'CO': '+57', 'PE': '+51', 'VE': '+58', 'UY': '+598',
  'PY': '+595', 'BO': '+591', 'EC': '+593', 'GY': '+592', 'SR': '+597', 'MX': '+52', 'GT': '+502',
  'BZ': '+501', 'SV': '+503', 'HN': '+504', 'NI': '+505', 'CR': '+506', 'PA': '+507', 'CU': '+53',
  'JM': '+1876', 'HT': '+509', 'DO': '+1849', 'PR': '+1939', 'TT': '+1868', 'BB': '+1246', 'GD': '+1473',
  'LC': '+1758', 'VC': '+1784', 'AG': '+1268', 'DM': '+1767', 'KN': '+1869', 'EG': '+20', 'LY': '+218',
  'SD': '+249', 'TN': '+216', 'DZ': '+213', 'MA': '+212', 'ZA': '+27', 'ZW': '+263', 'ZM': '+260',
  'MW': '+265', 'MZ': '+258', 'MG': '+261', 'MU': '+230', 'RE': '+262', 'YT': '+262', 'KM': '+269',
  'SC': '+248', 'KE': '+254', 'UG': '+256', 'TZ': '+255', 'RW': '+250', 'BI': '+257', 'DJ': '+253',
  'SO': '+252', 'ET': '+251', 'ER': '+291', 'SS': '+211', 'NG': '+234', 'GH': '+233', 'CI': '+225',
  'BF': '+226', 'ML': '+223', 'NE': '+227', 'TD': '+235', 'SN': '+221', 'GM': '+220', 'GW': '+245',
  'GN': '+224', 'SL': '+232', 'LR': '+231', 'BJ': '+229', 'TG': '+228', 'GA': '+241', 'GQ': '+240',
  'CM': '+237', 'CF': '+236', 'CG': '+242', 'CD': '+243', 'AO': '+244', 'NA': '+264', 'BW': '+267',
  'LS': '+266', 'SZ': '+268', 'TR': '+90', 'GE': '+995', 'AM': '+374', 'AZ': '+994', 'BY': '+375',
  'UA': '+380', 'MD': '+373', 'IL': '+972', 'PS': '+970', 'JO': '+962', 'LB': '+961', 'SY': '+963',
  'IQ': '+964', 'KW': '+965', 'SA': '+966', 'YE': '+967', 'OM': '+968', 'AE': '+971', 'QA': '+974',
  'BH': '+973', 'IR': '+98', 'AF': '+93', 'UZ': '+998', 'TM': '+993', 'TJ': '+992', 'KG': '+996',
  'KZ': '+7', 'MN': '+976', 'NP': '+977', 'BT': '+975', 'MM': '+95', 'LA': '+856', 'KH': '+855',
  'FJ': '+679', 'NC': '+687', 'PF': '+689', 'TO': '+676', 'WS': '+685', 'KI': '+686', 'TV': '+688',
  'NR': '+674', 'PW': '+680', 'FM': '+691', 'MH': '+692', 'PG': '+675', 'SB': '+677', 'VU': '+678',
  'NU': '+683', 'CK': '+682', 'TK': '+690', 'AS': '+1684', 'GU': '+1671', 'MP': '+1670'
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showAgentModal, setShowAgentModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [createdAgentData, setCreatedAgentData] = useState<any>(null)
  const [createdAgentFormData, setCreatedAgentFormData] = useState<any>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [phoneCountryCode, setPhoneCountryCode] = useState('+44') // Default to UK
  const [newAgent, setNewAgent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    notes: ''
  })
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 20
  })
  const [stats, setStats] = useState({
    overview: {
      totalAgents: 0,
      activeAgents: 0,
      pendingAgents: 0,
      suspendedAgents: 0,
      inactiveAgents: 0
    },
    statusBreakdown: {
      active: 0,
      pending_application: 0,
      suspended: 0,
      inactive: 0
    }
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  })

  const t = useTranslations('admin.agents')
  const locale = useLocale()

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load agents
      const agentsResponse = await api.agent.getAgents(filters)
      
      // Handle paginated response structure
      const agentsData = (agentsResponse as any).agents || (agentsResponse as any).data || []
      const paginationData = (agentsResponse as any).pagination || {}
      const metricsData = (agentsResponse as any).metrics || {}
      
      setAgents(Array.isArray(agentsData) ? agentsData : [])
      
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
          totalAgents: 0,
          activeAgents: 0,
          pendingAgents: 0,
          suspendedAgents: 0,
          inactiveAgents: 0
        },
        statusBreakdown: metricsData.statusBreakdown || {
          active: 0,
          pending_application: 0,
          suspended: 0,
          inactive: 0
        }
      })

    } catch (error) {
      // Failed to load agents data
      setError('Failed to load agents data')
      setAgents([])
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 1 })
      setStats({
        overview: {
          totalAgents: 0,
          activeAgents: 0,
          pendingAgents: 0,
          suspendedAgents: 0,
          inactiveAgents: 0
        },
        statusBreakdown: {
          active: 0,
          pending_application: 0,
          suspended: 0,
          inactive: 0
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (agentId: string, newStatus: string) => {
    try {
      if (newStatus === 'active') {
        await api.agent.activateAgent(agentId)
      } else if (newStatus === 'approve') {
        await api.agent.approveAgent(agentId)
      }
      loadData() // Reload data
    } catch (error) {
      // Failed to update agent status
      setError('Failed to update agent status')
    }
  }

  const handleSendCredentials = async (agentId: string) => {
    try {
      await api.agent.sendCredentials(agentId)
      loadData() // Reload data
    } catch (error) {
      // Failed to send credentials
      setError('Failed to send credentials')
    }
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }))
  }

  const handleViewAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setShowAgentModal(true)
  }

  const handleCreateAgent = async () => {
    try {
      setCreateLoading(true)
      setError(null)

      // Validate required fields
      if (!newAgent.firstName || !newAgent.lastName || !newAgent.email) {
        setError('Please fill in all required fields (First Name, Last Name, Email)')
        setCreateLoading(false)
        return
      }

      // Prepare the request body
      const requestBody: any = {
        firstName: newAgent.firstName,
        lastName: newAgent.lastName,
        email: newAgent.email
      }

      // Add optional fields if they have values
      if (newAgent.phone) requestBody.phone = newAgent.phone
      if (newAgent.address) requestBody.address = newAgent.address
      if (newAgent.country) requestBody.country = newAgent.country
      if (newAgent.notes) requestBody.notes = newAgent.notes

      // Create the agent
      const response = await api.agent.createAgent(requestBody)

      // Check if response exists and has required fields
      if (!response || !response.agentCode) {
        throw new Error('No agent code received from server')
      }

      // Use the create response directly - it has all the agent data we need
      setCreatedAgentData(response)
      
      // Save form data for display (in case user object is not fully populated)
      setCreatedAgentFormData({
        firstName: newAgent.firstName,
        lastName: newAgent.lastName,
        email: newAgent.email
      })

      // Reset form and close create modal
      setNewAgent({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        country: '',
        notes: ''
      })
      setPhoneCountryCode('+44')
      setShowCreateModal(false)

      // Show credentials modal with agent details after a brief delay
      setTimeout(() => {
        setShowCredentialsModal(true)
      }, 100)

      // Reload agents list
      loadData()
    } catch (error: any) {
      setError(error.error || error.message || 'Failed to create agent')
    } finally {
      setCreateLoading(false)
    }
  }

  const getCurrentMonth = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending_application': return 'bg-yellow-100 text-yellow-800'
      case 'application_approved': return 'bg-blue-100 text-blue-800'
      case 'code_generated': return 'bg-purple-100 text-purple-800'
      case 'credentials_sent': return 'bg-indigo-100 text-indigo-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pt-turquoise mx-auto mb-4"></div>
          <p className="text-pt-light-gray">Loading agents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-md">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-pt-dark-gray mb-2">Agent Management</h1>
          <p className="text-pt-light-gray">Manage agents and monitor performance</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-pt-turquoise text-white rounded-lg hover:bg-pt-turquoise-600 transition-colors font-semibold shadow-lg flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Create New Agent
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-pt-turquoise/10 rounded-lg">
              <svg className="w-6 h-6 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Total Agents</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.overview.totalAgents}</p>
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
              <p className="text-sm font-medium text-pt-light-gray">Active</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.overview.activeAgents}</p>
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
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.overview.pendingAgents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Suspended</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.overview.suspendedAgents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Inactive</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{stats.overview.inactiveAgents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Agents Table */}
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
              {(filters.status || filters.search) && (
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
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search agents..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending_application">Pending Application</option>
              <option value="application_approved">Application Approved</option>
              <option value="code_generated">Code Generated</option>
              <option value="credentials_sent">Credentials Sent</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg m-6 mb-0">
            {error}
          </div>
        )}

        {/* Agents Table */}
        <div className="p-6 pt-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrals</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agents.map((agent) => (
                    <tr 
                      key={agent.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleViewAgent(agent)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-pt-turquoise rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {agent.user.firstName.charAt(0)}{agent.user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {agent.user.firstName} {agent.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{agent.user.email}</div>
                            <div className="text-xs text-gray-400">Code: {agent.agentCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(agent.status)}`}>
                          {agent.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div>Total: {formatCurrencyWithSymbol(agent.totalEarnings)}</div>
                          <div className="text-xs text-gray-500">Available: {formatCurrencyWithSymbol(agent.availableBalance)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div>Total: {agent.totalReferrals}</div>
                          <div className="text-xs text-gray-500">Commission: {parseFloat(String(agent.commissionRate || '0'))}%</div>
                          <div className="text-xs text-gray-500">Active: {agent.activeReferrals}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                        {agent.status === 'application_approved' && (
                          <button
                            onClick={() => handleStatusChange(agent.id, 'approve')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                        )}
                        {agent.status === 'code_generated' && (
                          <button
                            onClick={() => handleSendCredentials(agent.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Send Credentials
                          </button>
                        )}
                        {agent.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(agent.id, 'suspend')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Suspend
                          </button>
                        )}
                        {agent.status === 'suspended' && (
                          <button
                            onClick={() => handleStatusChange(agent.id, 'active')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


          {/* Empty State */}
          {agents.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No agents found</h3>
              <p className="mt-1 text-sm text-gray-500">No agents match your current filters.</p>
            </div>
          )}

          {/* Pagination */}
          {!loading && agents.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-pt-light-gray">
                  <span>
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} agents
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
      </div>

      {/* Agent Detail Modal */}
      {showAgentModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-pt-turquoise to-pt-turquoise-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {selectedAgent.user.firstName.charAt(0)}{selectedAgent.user.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {selectedAgent.user.firstName} {selectedAgent.user.lastName}
                    </h3>
                    <p className="text-pt-turquoise-100">
                      Agent Code: <span className="font-mono font-bold">{selectedAgent.agentCode}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAgentModal(false)}
                  className="text-white/80 hover:text-white transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-8">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
                {/* Total Earnings */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="text-center">
                    <div className="p-3 bg-green-100 rounded-lg mx-auto w-fit mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrencyWithSymbol(selectedAgent.totalEarnings)}</div>
                    <div className="text-sm text-gray-500">Total Earnings</div>
                  </div>
                </div>
                
                {/* Total Referrals */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="text-center">
                    <div className="p-3 bg-blue-100 rounded-lg mx-auto w-fit mb-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 715 0z" />
                      </svg>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{selectedAgent.totalReferrals || 0}</div>
                    <div className="text-sm text-gray-500">Total Referrals</div>
                  </div>
                </div>
                
                {/* Commission Rate */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="text-center">
                    <div className="p-3 bg-purple-100 rounded-lg mx-auto w-fit mb-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{parseFloat(String(selectedAgent.commissionRate || '0'))}%</div>
                    <div className="text-sm text-gray-500">Commission Rate</div>
                  </div>
                </div>
                
                {/* Current Month Earnings */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="text-center">
                    <div className="p-3 bg-yellow-100 rounded-lg mx-auto w-fit mb-3">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrencyWithSymbol(selectedAgent.availableBalance)}</div>
                    <div className="text-sm text-gray-500">{getCurrentMonth()}</div>
                  </div>
                </div>
                
                {/* Monthly Active Referrals */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="text-center">
                    <div className="p-3 bg-indigo-100 rounded-lg mx-auto w-fit mb-3">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{selectedAgent.activeReferrals || 0}</div>
                    <div className="text-sm text-gray-500">This Month</div>
                  </div>
                </div>
                
                {/* Available Balance */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="text-center">
                    <div className="p-3 bg-emerald-100 rounded-lg mx-auto w-fit mb-3">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrencyWithSymbol(selectedAgent.availableBalance)}</div>
                    <div className="text-sm text-gray-500">Available Balance</div>
                  </div>
                </div>
              </div>

              {/* Agent Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Agent Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Agent Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedAgent.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedAgent.user.phoneNumber || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Country:</span>
                      <span className="font-medium">{selectedAgent.user.country || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAgent.status)}`}>
                        {selectedAgent.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Joined:</span>
                      <span className="font-medium">
                        {selectedAgent.createdAt ? new Date(selectedAgent.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Earnings:</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrencyWithSymbol(selectedAgent.totalEarnings)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Commission Rate:</span>
                      <span className="text-lg font-bold text-blue-600">{parseFloat(String(selectedAgent.commissionRate || '0'))}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Available Balance:</span>
                      <span className="text-lg font-bold text-emerald-600">{formatCurrencyWithSymbol(selectedAgent.availableBalance)}</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Referrals:</span>
                        <span className="text-lg font-bold text-purple-600">{selectedAgent.totalReferrals || 0}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">Active:</span>
                        <span className="font-medium text-blue-600">{selectedAgent.activeReferrals || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAgentModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Close
                </button>
                {selectedAgent.status === 'application_approved' && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedAgent.id, 'approve')
                      setShowAgentModal(false)
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                  >
                    Approve Agent
                  </button>
                )}
                {selectedAgent.status === 'code_generated' && (
                  <button
                    onClick={() => {
                      handleSendCredentials(selectedAgent.id)
                      setShowAgentModal(false)
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    Send Credentials
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-pt-turquoise to-pt-turquoise-600 px-8 py-6 rounded-t-2xl">
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-white">Create New Agent</h2>
              <p className="text-pt-turquoise-100 text-sm mt-1">Add a new agent to the platform</p>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
              {/* Required Fields */}
              <div className="space-y-5">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Required Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAgent.firstName}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 h-[48px] sm:h-[60px] border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-gray-50 focus:bg-white focus:ring-0 focus:border-pt-turquoise hover:border-pt-turquoise transition-all text-base sm:text-lg"
                      placeholder="John"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAgent.lastName}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 h-[48px] sm:h-[60px] border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-gray-50 focus:bg-white focus:ring-0 focus:border-pt-turquoise hover:border-pt-turquoise transition-all text-base sm:text-lg"
                      placeholder="Doe"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newAgent.email}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 h-[48px] sm:h-[60px] border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-gray-50 focus:bg-white focus:ring-0 focus:border-pt-turquoise hover:border-pt-turquoise transition-all text-base sm:text-lg"
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Optional Fields */}
              <div className="space-y-5">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                  <span className="ml-2 text-xs text-gray-500 font-normal">(Optional)</span>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <CountryPicker
                      value={newAgent.country}
                      onChange={(countryCode) => {
                        setNewAgent(prev => ({ ...prev, country: countryCode }))
                        
                        // Automatically update phone country code when country changes
                        const phoneCode = countryToPhoneCodeMap[countryCode]
                        if (phoneCode) {
                          setPhoneCountryCode(phoneCode)
                          // Reset phone number to avoid confusion with old country code
                          setNewAgent(prev => ({ ...prev, phone: '' }))
                        }
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <PhoneNumberInput
                      value={newAgent.phone}
                      onChange={(value) => setNewAgent(prev => ({ ...prev, phone: value }))}
                      countryCode={phoneCountryCode}
                      onCountryCodeChange={setPhoneCountryCode}
                      className="w-full"
                      label="Phone Number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={newAgent.address}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 h-[48px] sm:h-[60px] border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-gray-50 focus:bg-white focus:ring-0 focus:border-pt-turquoise hover:border-pt-turquoise transition-all text-base sm:text-lg"
                      placeholder="123 Main St, City, Country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                      <span className="ml-2 text-xs text-gray-500 font-normal">({newAgent.notes.length}/1000)</span>
                    </label>
                    <textarea
                      value={newAgent.notes}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, notes: e.target.value }))}
                      rows={4}
                      maxLength={1000}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-gray-50 focus:bg-white focus:ring-0 focus:border-pt-turquoise hover:border-pt-turquoise transition-all resize-none text-base sm:text-lg"
                      placeholder="Add any additional notes about this agent..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-white hover:border-gray-400 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAgent}
                disabled={createLoading}
                className="px-8 py-3 bg-pt-turquoise text-white rounded-xl font-semibold hover:bg-pt-turquoise-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-pt-turquoise/30"
              >
                {createLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Agent...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Agent
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Credentials Modal */}
      {showCredentialsModal && createdAgentData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-green-500 to-green-600 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Agent Created Successfully!</h2>
                  <p className="text-green-100 text-sm mt-1">Save these credentials - they won't be shown again</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              {/* Important Warning or Info */}
              {createdAgentData.user?.metadata?.tempPassword ? (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.732-1.333-2.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h4 className="font-bold text-amber-900 mb-1">⚠️ Important - Save This Information</h4>
                      <p className="text-sm text-amber-800">
                        These login credentials will not be displayed again. Please save them securely and share with the agent.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4">
                  <div className="flex items-start">
                    <svg className="w-6 h-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-bold text-blue-900 mb-1">ℹ️ Agent Created</h4>
                      <p className="text-sm text-blue-800">
                        The agent has been created successfully. Login credentials will be sent to the agent's email address.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Agent Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Agent Information
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {/* Agent Code */}
                  <div className="bg-gradient-to-br from-pt-turquoise/10 to-pt-turquoise/5 border-2 border-pt-turquoise rounded-xl p-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-2">AGENT CODE</label>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xl font-bold text-pt-turquoise tracking-wider">{createdAgentData.agentCode}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(createdAgentData.agentCode)
                          setSuccessMessage('Agent code copied!')
                          setTimeout(() => setSuccessMessage(null), 2000)
                        }}
                        className="p-2 hover:bg-pt-turquoise/20 rounded-lg transition-colors"
                        title="Copy agent code"
                      >
                        <svg className="w-5 h-5 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Agent Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">NAME</label>
                      <p className="text-sm font-medium text-gray-900">
                        {createdAgentData.user?.firstName || createdAgentFormData?.firstName} {createdAgentData.user?.lastName || createdAgentFormData?.lastName}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">EMAIL</label>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {createdAgentData.user?.email || createdAgentFormData?.email}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">STATUS</label>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {createdAgentData.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">COMMISSION RATE</label>
                      <p className="text-sm font-medium text-gray-900">{createdAgentData.commissionRate}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Credentials */}
              {createdAgentData.user?.metadata?.tempPassword && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Login Credentials
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Username */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-blue-900">USERNAME</label>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(createdAgentData.user?.username || createdAgentData.user?.email)
                            setSuccessMessage('Username copied!')
                            setTimeout(() => setSuccessMessage(null), 2000)
                          }}
                          className="p-1.5 hover:bg-blue-200 rounded transition-colors"
                          title="Copy username"
                        >
                          <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      <p className="font-mono text-lg font-bold text-blue-900">{createdAgentData.user?.username || createdAgentData.user?.email}</p>
                    </div>

                    {/* Temporary Password */}
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-purple-900">TEMPORARY PASSWORD</label>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(createdAgentData.user?.metadata?.tempPassword)
                            setSuccessMessage('Password copied!')
                            setTimeout(() => setSuccessMessage(null), 2000)
                          }}
                          className="p-1.5 hover:bg-purple-200 rounded transition-colors"
                          title="Copy password"
                        >
                          <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      <p className="font-mono text-lg font-bold text-purple-900">{createdAgentData.user?.metadata?.tempPassword}</p>
                      <p className="text-xs text-purple-700 mt-2">Agent should change this password on first login</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Share */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy All Information
                </h4>
                <button
                  onClick={() => {
                    const agentName = `${createdAgentData.user?.firstName || createdAgentFormData?.firstName} ${createdAgentData.user?.lastName || createdAgentFormData?.lastName}`
                    const agentEmail = createdAgentData.user?.email || createdAgentFormData?.email
                    
                    let credentials = `Agent Account Created
━━━━━━━━━━━━━━━━━━━━━━

Agent Code: ${createdAgentData.agentCode}
Status: ${createdAgentData.status?.replace('_', ' ').toUpperCase()}
Commission Rate: ${createdAgentData.commissionRate}%

CONTACT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━
Name: ${agentName}
Email: ${agentEmail}`

                    if (createdAgentData.user?.metadata?.tempPassword) {
                      credentials += `

LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━
Username: ${createdAgentData.user?.username || createdAgentData.user?.email}
Password: ${createdAgentData.user?.metadata?.tempPassword}

⚠️ Please change your password after first login.
Login at: ${window.location.origin}/en/auth/login`
                    }
                    
                    navigator.clipboard.writeText(credentials)
                    setSuccessMessage('All information copied to clipboard!')
                    setTimeout(() => setSuccessMessage(null), 3000)
                  }}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy All Details
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowCredentialsModal(false)
                  setCreatedAgentData(null)
                  setCreatedAgentFormData(null)
                  setSuccessMessage('Agent created successfully!')
                  setTimeout(() => setSuccessMessage(null), 3000)
                }}
                className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 flex items-center shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}