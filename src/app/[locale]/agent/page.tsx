'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api, Agent, AgentDashboard, Earning, Payout } from '@/lib/api'
import { CreatePayoutRequest } from '@/lib/api/types'
import SimplifiedPayoutModal from '@/components/SimplifiedPayoutModal'

import { withAuth, useAuth } from '@/contexts/AuthContext'
import { formatCurrencyWithSymbol, parseCurrency } from '@/lib/utils/currency'
import { MINIMUM_PAYOUT_AMOUNT } from '@/lib/constants/payout'
import ShareButton from '@/components/ShareButton'

function AgentPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [dashboard, setDashboard] = useState<AgentDashboard | null>(null)
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'payouts' | 'referrals'>('overview')
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([])

  const t = useTranslations('agent')
  const locale = useLocale()
  const { user, hasRole } = useAuth()

  const isAdmin = hasRole(['admin', 'pt_admin'])

  useEffect(() => {
    loadAgentData()
  }, [selectedAgentId, isAdmin])

  const loadAgentData = async () => {
    try {
      setLoading(true)
      setError(null)

      let agentData: Agent | null = null
      let agentId: string | null = null

      if (isAdmin) {
        // For admin users, first load available agents
        const agentsResponse = await api.agent.getAgents({ limit: 100 })
        const agents = Array.isArray(agentsResponse) ? agentsResponse : agentsResponse.data || []
        setAvailableAgents(agents)
        
        // If an agent is selected, use that; otherwise use the first agent or show selection
        if (selectedAgentId) {
          agentData = agents.find(a => a.id === selectedAgentId) || null
          agentId = selectedAgentId
        } else if (agents.length > 0) {
          agentData = agents[0]
          agentId = agents[0].id
          setSelectedAgentId(agentId)
        } else {
          // No agents available
          setLoading(false)
          return
        }
      } else {
        // For agent users, get their own data
        agentData = await api.agent.getCurrentAgent()
        
        if (!agentData) {
          throw new Error('No agent data received from API')
        }
        
        agentId = agentData.id
      }
      
      if (!agentData || !agentId) {
        throw new Error('No agent data available')
      }
      
      setAgent(agentData)

      // Set dashboard data directly from agent response (no separate API call needed)
      setDashboard({
        agent: agentData,
        earnings: [],
        referralCodes: [],
        summary: {
          totalEarnings: Number(agentData.totalEarnings) || 0,
          monthlyEarnings: 0,
          weeklyEarnings: 0,
          dailyEarnings: 0,
          availableBalance: Number(agentData.availableBalance) || 0,
          pendingBalance: Number(agentData.pendingBalance) || 0,
          totalReferrals: agentData.totalReferrals || 0,
          activeReferralCodes: agentData.activeReferrals || 0,
          thisMonthReferrals: 0,
          conversionRate: 0,
        },
        recentPayouts: [],
        monthlyStats: []
      })

      // Load earnings with error handling
      try {
        const earningsResponse = await api.agent.getAgentEarnings(agentId, { limit: 10 })
        
        let earningsData = []
        if (Array.isArray(earningsResponse)) {
          earningsData = earningsResponse
        } else if (earningsResponse && typeof earningsResponse === 'object') {
          earningsData = (earningsResponse as any).earnings || earningsResponse.data || []
        }
        setEarnings(Array.isArray(earningsData) ? earningsData : [])
          } catch (error) {
            setEarnings([])
          }

      // Load payouts with error handling
      try {
        const payoutsResponse = await api.payout.getAgentPayouts(agentId, { limit: 10 })
        
        let payoutsData = []
        if (Array.isArray(payoutsResponse)) {
          payoutsData = payoutsResponse
        } else if (payoutsResponse && typeof payoutsResponse === 'object') {
          payoutsData = (payoutsResponse as any).payouts || payoutsResponse.data || []
        }
        setPayouts(Array.isArray(payoutsData) ? payoutsData : [])
          } catch (error) {
            setPayouts([])
          }

      // Note: Referral codes now use user profile code instead of created codes

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load agent data'
          setError(errorMessage)
        } finally {
          setLoading(false)
        }
  }

  const handleRequestPayout = async (payoutData: CreatePayoutRequest) => {
    try {
      setPayoutLoading(true)
      setError(null)
      
      await api.payout.requestPayout(agent!.id, payoutData)
      
      // Show success message and reload data
      setSuccessMessage(`${payoutData.method.replace('_', ' ')} payout request submitted successfully!`)
      loadAgentData() // Reload data
    } catch (error: any) {
      // Handle API error messages
      if (error.message && Array.isArray(error.message)) {
        setError(error.message.join(', '))
      } else if (error.error) {
        setError(error.error)
      } else {
        setError('Failed to request payout')
      }
      throw error // Re-throw to let modal handle the error
    } finally {
      setPayoutLoading(false)
    }
  }


  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSuccessMessage(t('referrals.copied'))
    } catch (error) {
      // Copy to clipboard failed - fallback methods could be implemented
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-100 text-amber-800'
      case 'silver': return 'bg-gray-100 text-gray-800'
      case 'gold': return 'bg-yellow-100 text-yellow-800'
      case 'platinum': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pt-turquoise mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agent data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAgentData}
            className="bg-pt-turquoise text-white px-6 py-2 rounded-lg hover:bg-pt-turquoise/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!agent) {
    if (isAdmin && availableAgents.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-500 text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Agents Found</h2>
            <p className="text-gray-600 mb-4">There are no agents in the system yet.</p>
            <button
              onClick={() => window.location.href = `/${locale}/admin/users`}
              className="bg-pt-turquoise text-white px-6 py-2 rounded-lg hover:bg-pt-turquoise/90 transition-colors"
            >
              Manage Users & Agents
            </button>
          </div>
        </div>
      )
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Agent Data</h2>
          <p className="text-gray-600">Unable to load agent information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-gray-600 mt-1">{t('subtitle')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Agent Code</p>
                <p className="text-xl font-bold text-pt-turquoise">{agent.agentCode}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(agent.tier)}`}>
                {t(`tier.${agent.tier}`)}
              </div>
              {parseFloat(String(agent.availableBalance || '0')) < MINIMUM_PAYOUT_AMOUNT && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Payout Progress</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((parseCurrency(agent.availableBalance) / MINIMUM_PAYOUT_AMOUNT) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {formatCurrencyWithSymbol(agent.availableBalance)} / ${MINIMUM_PAYOUT_AMOUNT}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Agent Selector */}
      {isAdmin && availableAgents.length > 0 && (
        <div className="bg-blue-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium text-blue-900">Admin View:</span>
              </div>
              <select
                value={selectedAgentId || ''}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="px-3 py-2 border border-blue-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {availableAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.firstName} {agent.lastName} ({agent.agentCode}) - {agent.email}
                  </option>
                ))}
              </select>
              <span className="text-xs text-blue-600">
                Viewing data for selected agent
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('stats.totalEarnings')}</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrencyWithSymbol(agent.totalEarnings)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('stats.availableBalance')}</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrencyWithSymbol(agent.availableBalance)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('stats.commissionRate')}</p>
                <p className="text-2xl font-bold text-gray-900">{parseFloat(String(agent.commissionRate || '0'))}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('stats.totalReferrals')}</p>
                <p className="text-2xl font-bold text-gray-900">{agent.totalReferrals}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <div className="relative group">
              <button
                onClick={() => setShowPayoutModal(true)}
                disabled={parseCurrency(agent.availableBalance) < MINIMUM_PAYOUT_AMOUNT}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors relative overflow-hidden"
              >
                {t('actions.requestPayout')} ({formatCurrencyWithSymbol(agent.availableBalance)})
                {parseCurrency(agent.availableBalance) < MINIMUM_PAYOUT_AMOUNT && (
                  <div className="absolute bottom-0 left-0 h-1 bg-yellow-400" 
                       style={{ width: `${(parseCurrency(agent.availableBalance) / MINIMUM_PAYOUT_AMOUNT) * 100}%` }}></div>
                )}
              </button>
              {parseCurrency(agent.availableBalance) < MINIMUM_PAYOUT_AMOUNT && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Minimum payout amount is ${MINIMUM_PAYOUT_AMOUNT}. You need {formatCurrencyWithSymbol(MINIMUM_PAYOUT_AMOUNT - parseCurrency(agent.availableBalance))} more to request a payout.
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
            {agent?.agentCode && (
              <div className="relative">
                <ShareButton 
                  code={agent.agentCode}
                  agentName={`${user?.firstName} ${user?.lastName}`}
                  variant="compact"
                  showCode={true}
                  className="w-full"
                />
              </div>
            )}
          </div>
          
          {/* Helpful Information */}
          <div className="mt-4 p-4 bg-pt-turquoise-50 rounded-lg border border-pt-turquoise-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-pt-turquoise mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-pt-turquoise-700">
                <p className="font-medium mb-1">💡 Quick Tips:</p>
                <ul className="space-y-1 text-pt-turquoise-600">
                  <li>• Share your referral codes to earn commissions on customer top-ups</li>
                  <li>• Minimum payout amount is ${MINIMUM_PAYOUT_AMOUNT} - build your balance by referring customers</li>
                  <li>• Track your earnings and referrals in the tabs below</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: t('tabs.overview') },
                { key: 'earnings', label: t('tabs.earnings') },
                { key: 'referrals', label: t('tabs.referrals') },
                { key: 'payouts', label: t('tabs.payouts') }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-pt-turquoise text-pt-turquoise'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Agent Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-500 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agent.status)}`}>
                        {t(`status.${agent.status}`)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('overview.accountStatus')}</h3>
                    <p className="text-gray-600 text-sm">{t('overview.accountStatusDescription')}</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-500 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(agent.tier)}`}>
                        {t(`tier.${agent.tier}`)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('overview.agentTier')}</h3>
                    <p className="text-gray-600 text-sm">{t('overview.agentTierDescription')}</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-500 rounded-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{agent.activeReferrals}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('overview.activeReferrals')}</h3>
                    <p className="text-gray-600 text-sm">{t('overview.activeReferralsDescription')}</p>
                  </div>
                </div>

                {/* Performance Overview */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 text-pt-turquoise mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
{t('overview.performanceOverview')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-gray-900 mb-1">{agent.totalReferrals}</div>
                      <div className="text-sm text-gray-600">{t('overview.totalReferrals')}</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-gray-900 mb-1">{agent.activeReferrals}</div>
                      <div className="text-sm text-gray-600">{t('overview.activeReferralsCount')}</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-gray-900 mb-1">{parseFloat(String(agent.commissionRate || '0'))}%</div>
                      <div className="text-sm text-gray-600">{t('overview.commissionRate')}</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrencyWithSymbol(agent.totalEarnings)}</div>
                      <div className="text-sm text-gray-600">{t('overview.totalEarnings')}</div>
                    </div>
                  </div>
                </div>

                {/* Account Timeline */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 text-pt-turquoise mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
{t('overview.accountTimeline')}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{t('overview.accountCreated')}</h4>
                          <span className="text-xs text-gray-500">
                            {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : t('overview.unknown')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{t('overview.accountCreatedDescription')}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{t('overview.accountActivated')}</h4>
                          <span className="text-xs text-gray-500">
                            {agent.activatedAt ? new Date(agent.activatedAt).toLocaleDateString() : t('overview.notActivated')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{t('overview.accountActivatedDescription')}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{t('overview.lastActivity')}</h4>
                          <span className="text-xs text-gray-500">
                            {agent.lastActivityAt ? new Date(agent.lastActivityAt).toLocaleDateString() : t('overview.never')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{t('overview.lastActivityDescription')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('earnings.title')}</h3>
                {earnings.length > 0 ? (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('earnings.date')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('earnings.description')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('earnings.amount')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('earnings.status')}</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {earnings.map((earning, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(earning.createdAt || Date.now()).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {earning.description || 'Commission earned'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrencyWithSymbol(earning.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  earning.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : earning.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {earning.status === 'confirmed' 
                                    ? 'Confirmed' 
                                    : earning.status === 'pending'
                                    ? 'Pending'
                                    : 'Cancelled'
                                  }
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {earnings.map((earning, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {earning.description || 'Commission earned'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(earning.createdAt || Date.now()).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              earning.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : earning.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {earning.status === 'confirmed' 
                                ? 'Confirmed' 
                                : earning.status === 'pending'
                                ? 'Pending'
                                : 'Cancelled'
                              }
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-green-600">
                              {formatCurrencyWithSymbol(earning.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">💰</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Earnings Yet</h3>
                    <p className="text-gray-500 mb-4 max-w-md mx-auto">
                      You haven&apos;t earned any commissions yet. Start by creating referral codes and sharing them with customers.
                    </p>
                    <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Tip:</strong> When customers use your referral codes to top up, you&apos;ll earn commissions that appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Referrals Tab */}
            {activeTab === 'referrals' && (
              <div>
                <h3 className="text-lg font-semibold text-pt-dark-gray mb-4">{t('referrals.title')}</h3>
                
                {/* Your Agent Referral Code */}
                <div className="bg-white border border-pt-light-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-pt-turquoise to-pt-turquoise-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-xl font-bold">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </span>
                    </div>
                    
                    <h4 className="text-xl font-semibold text-pt-dark-gray mb-2">Your Agent Referral Code</h4>
                    <p className="text-pt-light-gray mb-6">Share this code with customers to start earning commissions</p>
                    
                    <div className="bg-pt-light-gray-50 border border-pt-light-gray-200 rounded-lg p-4 mb-6">
                      <label className="block text-sm font-medium text-pt-dark-gray mb-2">Agent Code:</label>
                      <div className="flex items-center justify-center space-x-3">
                        <span className="font-mono text-2xl font-bold text-pt-turquoise">
                          {agent?.agentCode || 'Loading...'}
                        </span>
                        <button
                          onClick={() => navigator.clipboard?.writeText(agent?.agentCode || '')}
                          className="text-pt-turquoise hover:text-pt-turquoise-dark p-2 rounded"
                          title="Copy code"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {agent?.agentCode && (
                      <div className="space-y-4">
                        <ShareButton 
                          code={agent.agentCode}
                          agentName={`${user?.firstName} ${user?.lastName}`}
                          variant="primary"
                          size="lg"
                          showUrl={true}
                          className="w-full"
                        />
                      </div>
                    )}
                    
                    <div className="mt-6 bg-pt-turquoise-50 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-pt-turquoise">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h5 className="font-medium text-pt-turquoise-700 mb-1">How it works:</h5>
                          <ul className="text-sm text-pt-turquoise-600 space-y-1">
                            <li>• Share your agent code with customers</li>
                            <li>• They use it when signing up for PlanetTalk</li>
                            <li>• You earn commission on every top-up they make</li>
                            <li>• Commission continues for 24 months per customer</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payouts Tab */}
            {activeTab === 'payouts' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('payouts.title')}</h3>
                {payouts.length > 0 ? (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('payouts.date')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('payouts.amount')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('payouts.method')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('payouts.status')}</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payouts.map((payout, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(payout.createdAt || Date.now()).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrencyWithSymbol(payout.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {payout.method || 'Bank Transfer'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {payouts.map((payout, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-lg font-semibold text-gray-900">
                                {formatCurrencyWithSymbol(payout.amount)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(payout.createdAt || Date.now()).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">{t('payouts.method')}</p>
                            <p className="text-sm font-medium text-gray-900">
                              {payout.method || 'Bank Transfer'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">💳</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Payouts Yet</h3>
                    <p className="text-gray-500 mb-4 max-w-md mx-auto">
                      You haven&apos;t requested any payouts yet. Build your balance to at least ${MINIMUM_PAYOUT_AMOUNT} to request your first payout.
                    </p>
                    <div className="bg-amber-50 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-amber-800">
                        <strong>💰 Current Balance:</strong> {formatCurrencyWithSymbol(agent.availableBalance)} 
                        {parseCurrency(agent.availableBalance) < MINIMUM_PAYOUT_AMOUNT && (
                          <span className="block mt-1">
                            You need {formatCurrencyWithSymbol(MINIMUM_PAYOUT_AMOUNT - parseCurrency(agent.availableBalance))} more to request a payout.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simplified Payout Modal */}
      <SimplifiedPayoutModal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        onSubmit={handleRequestPayout}
        availableBalance={String(agent?.availableBalance || '0')}
        isLoading={payoutLoading}
      />

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="absolute top-1 right-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="absolute top-1 right-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

export default withAuth(AgentPage, ['agent', 'admin', 'pt_admin'])