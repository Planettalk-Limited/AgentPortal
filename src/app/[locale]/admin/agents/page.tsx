'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api, Agent, PaginatedResponse } from '@/lib/api'
import { formatCurrencyWithSymbol } from '@/lib/utils/currency'

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    tier: '',
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
    },
    tierBreakdown: {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0
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
        },
        tierBreakdown: metricsData.tierBreakdown || {
          bronze: 0,
          silver: 0,
          gold: 0,
          platinum: 0,
          diamond: 0
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
        },
        tierBreakdown: {
          bronze: 0,
          silver: 0,
          gold: 0,
          platinum: 0,
          diamond: 0
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

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800'
      case 'gold': return 'bg-yellow-100 text-yellow-800'
      case 'silver': return 'bg-gray-100 text-gray-800'
      case 'bronze': return 'bg-orange-100 text-orange-800'
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-pt-dark-gray mb-2">Agent Management</h1>
        <p className="text-pt-light-gray">Manage agents and monitor performance</p>
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

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">Platinum+ Tier</p>
              <p className="text-2xl font-bold text-pt-dark-gray">{(stats.tierBreakdown.platinum || 0) + (stats.tierBreakdown.diamond || 0)}</p>
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
              {(filters.status || filters.tier || filters.search) && (
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
            <select
              value={filters.tier}
              onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
            >
              <option value="">All Tiers</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrals</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(agent.tier)}`}>
                          {agent.tier.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>Total: {formatCurrencyWithSymbol(agent.totalEarnings)}</div>
                        <div className="text-xs text-gray-500">Available: {formatCurrencyWithSymbol(agent.availableBalance)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>Total: {agent.totalReferrals}</div>
                        <div className="text-xs text-gray-500">Active: {agent.activeReferrals}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
    </div>
  )
}