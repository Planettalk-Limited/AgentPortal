'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { formatCurrencyWithSymbol } from '@/lib/utils/currency'

// Add custom CSS for animations
const fadeInStyle = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out;
  }
`

interface DashboardData {
  overview: {
    totalUsers: number
    totalAgents: number
    totalEarnings: number
    totalPayouts: number
    pendingPayouts: number
  }
  recent: {
    users: RecentUser[]
    agents: RecentAgent[]
    payouts: RecentPayout[]
  }
}

interface RecentUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  createdAt: string
}

interface RecentAgent {
  id: string
  agentCode: string
  name: string
  status: string
  createdAt: string
}

interface RecentPayout {
  id: string
  amount: number | string
  agentName?: string
  status: string
  requestedAt: string
}

import { withAuth } from '@/contexts/AuthContext'

function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.admin.getDashboard()
      
      if (response && typeof response === 'object' && 'overview' in response && 'recent' in response) {
        setDashboardData(response as DashboardData)
      } else {
        setError('Invalid API response structure')
      }
    } catch (error) {
      // Failed to load dashboard data
      setError(`Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'pt_admin': return 'bg-purple-100 text-purple-800'
      case 'agent': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatHumanDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-pt-turquoise border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Dashboard</p>
          <p className="mt-2 text-sm text-gray-500">Fetching latest system data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 17.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Unavailable</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="bg-pt-turquoise text-white px-6 py-3 rounded-lg hover:bg-pt-turquoise-600 transition-colors duration-200 flex items-center space-x-2 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Try Again</span>
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600">No dashboard data available.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{fadeInStyle}</style>
      <div className="space-y-8 animate-fadeIn">
        {/* Header with Overlapping Stats Cards */}
        <div className="relative">
          <div className="bg-gradient-to-r from-pt-turquoise to-blue-600 rounded-2xl p-8 text-white pb-24">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-blue-100 text-lg">Welcome to your PlanetTalk management center</p>
                <div className="flex items-center mt-4 space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>System Online</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={loadDashboardData}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Stats Grid - Overlapping */}
          <div className="grid grid-cols-4 gap-6 -mt-16 relative z-10 px-4">
            {/* Total Users */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex-shrink-0">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.overview.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Total Agents */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg flex-shrink-0">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Total Agents</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.overview.totalAgents.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Total Earnings */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-gray-900">${Number(dashboardData.overview.totalEarnings).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            {/* Payouts */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg flex-shrink-0">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">Payouts</p>
                  <p className="text-3xl font-bold text-gray-900">${Number(dashboardData.overview.totalPayouts).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  {dashboardData.overview.pendingPayouts > 0 && (
                    <p className="text-sm text-orange-600 font-medium mt-1">
                      {dashboardData.overview.pendingPayouts} pending
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Recent Users
              </h3>
            </div>
            <div className="p-6">
              {dashboardData.recent.users.length > 0 ? (
                <div className="space-y-3">
                    {dashboardData.recent.users.slice(0, 3).map((user, index) => (
                      <div key={user.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors duration-200">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold text-sm sm:text-base lg:text-lg">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                          {index === 0 && (
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2 truncate">{user.email}</p>
                          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                            <span className={`inline-flex px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                              {user.role.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatHumanDate(user.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No recent users</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Recent Agents
              </h3>
            </div>
            <div className="p-6">
              {dashboardData.recent.agents.length > 0 ? (
                <div className="space-y-3">
                    {dashboardData.recent.agents.slice(0, 3).map((agent, index) => (
                      <div key={agent.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors duration-200">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                          </div>
                          {index === 0 && (
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{agent.name}</p>
                          <p className="text-xs sm:text-sm font-mono text-pt-turquoise mb-1.5 sm:mb-2">{agent.agentCode}</p>
                          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                            <span className={`inline-flex px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getStatusColor(agent.status)}`}>
                              {agent.status.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatHumanDate(agent.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No recent agents</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Payouts
              </h3>
            </div>
            <div className="p-6">
              {dashboardData.recent.payouts.length > 0 ? (
                <div className="space-y-3">
                    {dashboardData.recent.payouts.slice(0, 3).map((payout) => (
                      <div key={payout.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors duration-200">
                        <div className="p-2 sm:p-2.5 bg-purple-100 rounded-lg flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-gray-900">{formatCurrencyWithSymbol(payout.amount)}</p>
                          {payout.agentName && (
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{payout.agentName}</p>
                          )}
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            <span className={`inline-flex px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getStatusColor(payout.status)}`}>
                              {payout.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatHumanDate(payout.requestedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No recent payouts</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-500 mt-1">Navigate to management areas</p>
          </div>
          <div className="p-6 space-y-3">
            <Link
              href="/en/admin/dashboard"
              className="group flex items-center p-4 text-gray-700 hover:bg-pt-turquoise hover:text-white rounded-xl transition-all duration-200 border border-transparent hover:border-pt-turquoise hover:shadow-lg"
            >
              <div className="p-2 bg-blue-100 group-hover:bg-white/20 rounded-lg mr-4 transition-colors duration-200">
                <svg className="w-5 h-5 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Overview</p>
                <p className="text-sm opacity-70">Dashboard summary</p>
              </div>
            </Link>
            <Link
              href="/en/admin/users"
              className="group flex items-center p-4 text-gray-700 hover:bg-pt-turquoise hover:text-white rounded-xl transition-all duration-200 border border-transparent hover:border-pt-turquoise hover:shadow-lg"
            >
              <div className="p-2 bg-purple-100 group-hover:bg-white/20 rounded-lg mr-4 transition-colors duration-200">
                <svg className="w-5 h-5 text-purple-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Admins</p>
                <p className="text-sm opacity-70">Manage administrators</p>
              </div>
            </Link>
            <Link
              href="/en/admin/payouts"
              className="group flex items-center p-4 text-gray-700 hover:bg-pt-turquoise hover:text-white rounded-xl transition-all duration-200 border border-transparent hover:border-pt-turquoise hover:shadow-lg"
            >
              <div className="p-2 bg-green-100 group-hover:bg-white/20 rounded-lg mr-4 transition-colors duration-200">
                <svg className="w-5 h-5 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Payouts</p>
                <p className="text-sm opacity-70">Review and approve</p>
              </div>
            </Link>
            <Link
              href="/en/admin/resources"
              className="group flex items-center p-4 text-gray-700 hover:bg-pt-turquoise hover:text-white rounded-xl transition-all duration-200 border border-transparent hover:border-pt-turquoise hover:shadow-lg"
            >
              <div className="p-2 bg-indigo-100 group-hover:bg-white/20 rounded-lg mr-4 transition-colors duration-200">
                <svg className="w-5 h-5 text-indigo-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Resources</p>
                <p className="text-sm opacity-70">Manage media files</p>
              </div>
            </Link>
            <Link
              href="/en/admin/agents"
              className="group flex items-center p-4 text-gray-700 hover:bg-pt-turquoise hover:text-white rounded-xl transition-all duration-200 border border-transparent hover:border-pt-turquoise hover:shadow-lg"
            >
              <div className="p-2 bg-teal-100 group-hover:bg-white/20 rounded-lg mr-4 transition-colors duration-200">
                <svg className="w-5 h-5 text-teal-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Agents</p>
                <p className="text-sm opacity-70">Manage agent network</p>
              </div>
            </Link>
            <Link
              href="/en/admin/earnings"
              className="group flex items-center p-4 text-gray-700 hover:bg-pt-turquoise hover:text-white rounded-xl transition-all duration-200 border border-transparent hover:border-pt-turquoise hover:shadow-lg"
            >
              <div className="p-2 bg-orange-100 group-hover:bg-white/20 rounded-lg mr-4 transition-colors duration-200">
                <svg className="w-5 h-5 text-orange-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Earnings</p>
                <p className="text-sm opacity-70">Review commissions</p>
              </div>
            </Link>
          </div>

          {/* System Status */}
          <div className="border-t border-gray-200 mt-6 pt-6 px-6">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              System Status
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">API Server</span>
                </div>
                <span className="text-xs font-semibold text-green-700">Online</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Database</span>
                </div>
                <span className="text-xs font-semibold text-green-700">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">Last Sync</span>
                </div>
                <span className="text-xs font-semibold text-blue-700">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Pending Actions */}
          <div className="border-t border-gray-200 mt-6 pt-6 px-6">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Attention Needed
            </h4>
            <div className="space-y-2">
              {dashboardData.overview.pendingPayouts > 0 ? (
                <Link
                  href="/en/admin/payouts"
                  className="flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group border border-orange-100"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">{dashboardData.overview.pendingPayouts}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Pending Payouts</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <div className="text-center py-6 bg-green-50 rounded-lg border border-green-100">
                  <svg className="w-8 h-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-green-700">All caught up!</p>
                  <p className="text-xs text-green-600 mt-1">No pending actions</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="border-t border-gray-200 mt-6 pt-6 px-6 pb-6">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Quick Insights
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-sm text-gray-600">Users Today</span>
                <span className="text-sm font-bold text-gray-900">{dashboardData.recent.users.filter(u => {
                  const diffHours = (new Date().getTime() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60)
                  return diffHours < 24
                }).length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-sm text-gray-600">Agents Today</span>
                <span className="text-sm font-bold text-gray-900">{dashboardData.recent.agents.filter(a => {
                  const diffHours = (new Date().getTime() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60)
                  return diffHours < 24
                }).length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pt-turquoise/10 to-blue-500/10 rounded-lg border border-pt-turquoise/20">
                <span className="text-sm font-medium text-gray-700">Total Revenue</span>
                <span className="text-sm font-bold text-pt-turquoise">${Number(dashboardData.overview.totalEarnings).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default withAuth(AdminDashboardPage, ['admin', 'pt_admin'])
