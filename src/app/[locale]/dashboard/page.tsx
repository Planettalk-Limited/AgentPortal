'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { api, Agent, AgentDashboard, Earning, Payout, CreatePayoutRequest } from '@/lib/api'
import { formatCurrencyWithSymbol, parseCurrency } from '@/lib/utils/currency'
import { MINIMUM_PAYOUT_AMOUNT } from '@/lib/constants/payout'
import SocialShareButton from '@/components/SocialShareButton'
import SimplifiedPayoutModal from '@/components/SimplifiedPayoutModal'

export default function DashboardPage() {
  const { user } = useAuth()
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [dashboard, setDashboard] = useState<AgentDashboard | null>(null)
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutLoading, setPayoutLoading] = useState(false)

  // Function to format dates in a human-readable way
  const formatHumanDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

    // If it's today
    if (diffInDays === 0) {
      if (diffInHours === 0) {
        if (diffInMinutes === 0) {
          return t('justNow') || 'Just now'
        }
        return `${diffInMinutes} ${t('minutesAgo') || 'minutes ago'}`
      }
      return `${diffInHours} ${t('hoursAgo') || 'hours ago'}`
    }
    
    // If it's yesterday
    if (diffInDays === 1) {
      return t('yesterday') || 'Yesterday'
    }
    
    // If it's within the last week
    if (diffInDays < 7) {
      return `${diffInDays} ${t('daysAgo') || 'days ago'}`
    }
    
    // For older dates, show formatted date
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Function to get status display info
  const getPayoutStatusInfo = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          label: t('approved') || 'Approved',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800'
        }
      case 'review':
        return {
          label: t('review') || 'Under Review',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800'
        }
      case 'pending':
      default:
        return {
          label: t('pending') || 'Pending',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800'
        }
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get current agent data
      const agentData = await api.agent.getCurrentAgent()
      if (!agentData) {
        throw new Error('No agent data received from API')
      }
      
      setAgent(agentData)
      
      // Set dashboard data directly from agent response
      setDashboard({
        agent: agentData,
        earnings: [],
        referralCodes: [],
        summary: {
          totalEarnings: Number(agentData.totalEarnings) || 0,
          monthlyEarnings: 0, // This would need to be calculated from earnings data
          weeklyEarnings: 0,
          dailyEarnings: 0,
          availableBalance: Number(agentData.availableBalance) || 0,
          pendingBalance: Number(agentData.pendingBalance) || 0,
          totalReferrals: agentData.totalReferrals || 0,
          activeReferralCodes: agentData.activeReferrals || 0,
          thisMonthReferrals: 0, // This would need to be calculated from referrals data
          conversionRate: 0,
        },
        recentPayouts: [],
        monthlyStats: []
      })
      
      // Load recent earnings and calculate monthly totals
      try {
        const earningsResponse = await api.agent.getAgentEarnings(agentData.id, { limit: 100 }) // Get more to calculate monthly
        let earningsData = []
        if (Array.isArray(earningsResponse)) {
          earningsData = earningsResponse
        } else if (earningsResponse && typeof earningsResponse === 'object') {
          earningsData = (earningsResponse as any).earnings || earningsResponse.data || []
        }
        
        const earnings = Array.isArray(earningsData) ? earningsData : []
        setEarnings(earnings.slice(0, 5)) // Keep only 5 for display
        
        // Calculate current month earnings
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const monthlyEarnings = earnings
          .filter(earning => {
            const earningDate = new Date(earning.createdAt || earning.earnedAt || Date.now())
            return earningDate.getMonth() === currentMonth && earningDate.getFullYear() === currentYear
          })
          .reduce((sum, earning) => sum + (Number(earning.amount) || 0), 0)
        
        // Update dashboard with calculated monthly earnings
        setDashboard(prev => prev ? {
          ...prev,
          summary: {
            ...prev.summary,
            monthlyEarnings
          }
        } : null)
        
      } catch (error) {
        setEarnings([])
      }
      
      // Load recent payouts
      try {
        const payoutsResponse = await api.payout.getAgentPayouts(agentData.id, { limit: 5 })
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
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data'
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
      
      setSuccessMessage(`${payoutData.method.replace('_', ' ')} payout request submitted successfully!`)
      loadDashboardData() // Reload data
    } catch (error: any) {
      if (error.message && Array.isArray(error.message)) {
        setError(error.message.join(', '))
      } else if (error.error) {
        setError(error.error)
      } else {
        setError('Failed to request payout')
      }
      throw error
    } finally {
      setPayoutLoading(false)
    }
  }
  
  const getCurrentMonth = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-pt-turquoise border-t-transparent mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-pt-turquoise rounded-full opacity-20"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">{t('loadingDashboard')}</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('unableToLoad')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={loadDashboardData}
            className="bg-pt-turquoise text-white px-6 py-3 rounded-lg hover:bg-pt-turquoise-600 transition-colors font-semibold shadow-lg"
              >
            {t('tryAgain')}
              </button>
            </div>
          </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('noAgentData')}</h2>
          <p className="text-gray-600">{t('unableToLoadAgent')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 pb-4 sm:pb-6">
      {/* Hero Header - Clean with rounded edges */}
      <div className="px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        <div className="relative bg-gradient-to-r from-pt-turquoise to-pt-turquoise-600 rounded-2xl sm:rounded-3xl overflow-hidden max-w-7xl mx-auto">
          <div className="absolute inset-0 bg-black opacity-5"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          
          <div className="relative px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 pb-8 sm:pb-10 lg:pb-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
              {/* Left side - User info */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/20 backdrop-blur-sm rounded-full sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    {t('welcomeBack', { name: user?.firstName || 'Agent' })}
                  </h1>
                </div>
              </div>

              {/* Right side - Stats */}
              <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{parseFloat(String(agent.commissionRate || '10'))}%</div>
                  <div className="text-pt-turquoise-100 text-xs sm:text-sm whitespace-nowrap mt-1">{t('commissionRate')}</div>
                </div>
                <div className="w-px h-12 sm:h-14 lg:h-16 bg-white/30"></div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{formatCurrencyWithSymbol(agent.availableBalance)}</div>
                  <div className="text-pt-turquoise-100 text-xs sm:text-sm whitespace-nowrap mt-1">{t('available')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Key Metrics - 2-column grid on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 lg:gap-4 transform -translate-y-6 sm:-translate-y-8 lg:-translate-y-10 relative z-10">
          {/* Total Earnings */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
              <div className="p-2 sm:p-2.5 lg:p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-lg lg:rounded-xl w-fit">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-0.5">{t('totalEarnings')}</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{formatCurrencyWithSymbol(agent.totalEarnings)}</div>
              </div>
            </div>
          </div>

          {/* This Month Earnings */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
              <div className="p-2 sm:p-2.5 lg:p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg lg:rounded-xl w-fit">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-0.5">{t('thisMonth')}</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{formatCurrencyWithSymbol(agent.earningsThisMonth || 0)}</div>
              </div>
            </div>
          </div>
          
          {/* Total Referrals */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
              <div className="p-2 sm:p-2.5 lg:p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg lg:rounded-xl w-fit">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-0.5">{t('referrals')}</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{agent.totalReferrals || 0}</div>
              </div>
            </div>
          </div>

          {/* Referrals This Month */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
              <div className="p-2 sm:p-2.5 lg:p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg lg:rounded-xl w-fit">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-0.5">{t('thisMonth')}</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{agent.referralsThisMonth || 0}</div>
              </div>
            </div>
          </div>

        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {/* Share & Earn Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-pt-turquoise to-pt-turquoise-600 px-4 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-5">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">{t('shareAndEarnHeader')}</h2>
                <p className="text-pt-turquoise-100 text-sm sm:text-base">{t('shareAgentCodeEarn')}</p>
              </div>

              <div className="p-3 sm:p-4 lg:p-5">
                {/* Agent Code Display - Prominent */}
                <div className="mb-4">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    {t('yourAgentCode')}
                  </label>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 p-3 sm:p-4 rounded-xl border-2 border-gray-200">
                    <div className="flex-1">
                      <span className="font-mono font-bold text-gray-900 text-xl sm:text-2xl lg:text-3xl tracking-wider block">
                        {agent.agentCode}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500 mt-1 block">
                        {t('earnCommission', { rate: parseFloat(String(agent.commissionRate || '10')) })}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(agent.agentCode)
                          setSuccessMessage(t('agentCodeCopied'))
                          setTimeout(() => setSuccessMessage(null), 2000)
                        } catch (err) {
                          setError(t('failedToCopyCode'))
                        }
                      }}
                      className="flex-shrink-0 bg-pt-turquoise hover:bg-pt-turquoise-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg transition-colors font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                      title={t('copyCode')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="hidden sm:inline">{t('copyCode')}</span>
                    </button>
                  </div>
                </div>

                {/* Social Media Sharing */}
                <SocialShareButton 
                  code={agent.agentCode}
                  agentName={`${user?.firstName} ${user?.lastName}`}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Payout Section */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-5">
            {/* Payout Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 sm:px-6 sm:py-4">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">{t('requestPayout')}</h3>
              </div>
              
              <div className="p-3 sm:p-4 lg:p-5">
                <div className="text-center mb-3 sm:mb-4">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                    {formatCurrencyWithSymbol(agent.availableBalance)}
                  </div>
                  <div className="text-sm text-gray-500">{t('availableBalance')}</div>
                </div>
                
                {parseCurrency(agent.availableBalance) < MINIMUM_PAYOUT_AMOUNT ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-yellow-50 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center mb-1.5 sm:mb-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold text-yellow-700 text-sm sm:text-base">{t('almostThere')}</span>
                      </div>
                      <p className="text-yellow-600 text-xs sm:text-sm">
                        {t('needMore', { amount: formatCurrencyWithSymbol(MINIMUM_PAYOUT_AMOUNT - parseCurrency(agent.availableBalance)) })}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">{t('progressTo', { amount: MINIMUM_PAYOUT_AMOUNT })}</span>
                        <span className="font-medium">{Math.round((parseCurrency(agent.availableBalance) / MINIMUM_PAYOUT_AMOUNT) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
                        <div 
                          className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2.5 sm:h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min((parseCurrency(agent.availableBalance) / MINIMUM_PAYOUT_AMOUNT) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Payout Requirements Information - Hidden on mobile */}
                    <div className="hidden sm:block bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('payoutRequirements')}
                      </h4>
                      <div className="space-y-2 text-sm text-blue-700">
                        <div className="flex items-start">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          <span>{t('minimumBalance', { amount: `$${MINIMUM_PAYOUT_AMOUNT}` })}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          <span>{t('processingTime')}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          <span>{t('availableMethods')}</span>
                        </div>
                      </div>
                    </div>

                    {/* How to Earn More - Compact on mobile */}
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {t('howToReachMinimum')}
                      </h4>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                        <div className="flex items-start">
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pt-turquoise rounded-full mt-1 sm:mt-1.5 mr-2 flex-shrink-0"></span>
                          <span>{t('shareAgentCode')}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pt-turquoise rounded-full mt-1 sm:mt-1.5 mr-2 flex-shrink-0"></span>
                          <span>{t('earnCommission', { rate: parseFloat(String(agent.commissionRate || '0')) })}</span>
                        </div>
                      </div>
                    </div>

                    
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg text-sm sm:text-base font-semibold cursor-not-allowed"
                    >
                      {t('payoutUnavailable')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center mb-1.5 sm:mb-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-semibold text-green-700 text-sm sm:text-base">{t('readyForPayout')}</span>
                      </div>
                      <p className="text-green-600 text-xs sm:text-sm">
                        {t('balanceMeetsRequirement')}
                      </p>
                    </div>

                    {/* Payout Information - Hidden on mobile */}
                    <div className="hidden sm:block bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('payoutInformation')}
                      </h4>
                      <div className="space-y-2 text-sm text-blue-700">
                        <div className="flex items-start">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          <span>{t('processingTime')}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          <span>{t('availableMethods')}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          <span>{t('emailConfirmation')}</span>
                        </div>
                      </div>
                    </div>

                    
                    <button
                      onClick={() => setShowPayoutModal(true)}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-colors text-sm sm:text-base font-semibold shadow-lg"
                    >
                      {t('requestPayout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5 mt-3 sm:mt-4 lg:mt-5">
          {/* Recent Earnings */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-3 py-2.5 sm:px-4 sm:py-3 border-b">
              <h3 className="text-base sm:text-lg font-semibold text-green-800 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('recentEarnings')}
              </h3>
            </div>
            
            <div className="p-3 sm:p-4 lg:p-5">
              {earnings.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:flex md:flex-col">
                  {earnings.slice(0, 6).map((earning, index) => (
                    <div key={index} className="flex flex-col md:flex-row md:justify-between md:items-center p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors">
                      {/* Mobile: Vertical Card Layout */}
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 md:min-w-0 md:flex-1">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          {/* Amount on mobile - top right */}
                          <p className="text-sm sm:text-base md:text-lg font-bold text-green-600 md:hidden ml-auto">
                            {formatCurrencyWithSymbol(earning.amount)}
                          </p>
                        </div>
                        <div className="min-w-0 flex-1 mt-1 md:mt-0">
                          <p className="font-medium text-gray-900 text-xs sm:text-sm md:text-base truncate leading-tight">
                            {earning.description || t('commissionEarned')}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatHumanDate(earning.createdAt || new Date().toISOString())}
                          </p>
                          <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full mt-1 ${
                            earning.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {earning.status === 'confirmed' ? t('confirmed') : t('pending')}
                          </span>
                        </div>
                      </div>
                      {/* Desktop: Amount & Status on Right */}
                      <div className="hidden md:block text-right flex-shrink-0 ml-2">
                        <p className="text-base sm:text-lg font-bold text-green-600">
                          {formatCurrencyWithSymbol(earning.amount)}
                        </p>
                        <span className={`inline-flex px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-semibold rounded-full ${
                          earning.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {earning.status === 'confirmed' ? t('confirmed') : t('pending')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">{t('noEarningsYet')}</h4>
                  <p className="text-sm text-gray-500">{t('startSharing')}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Payouts */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2.5 sm:px-4 sm:py-3 border-b">
              <h3 className="text-base sm:text-lg font-semibold text-blue-800 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {t('recentPayouts')}
              </h3>
            </div>
            
            <div className="p-3 sm:p-4 lg:p-5">
              {payouts.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:flex md:flex-col">
                  {payouts.slice(0, 6).map((payout, index) => {
                    const statusInfo = getPayoutStatusInfo(payout.status || 'pending')
                    return (
                      <div key={index} className="flex flex-col md:flex-row md:justify-between md:items-center p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors">
                        {/* Mobile: Vertical Card Layout */}
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 md:min-w-0 md:flex-1">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            </div>
                            {/* Amount on mobile - top right */}
                            <p className="text-sm sm:text-base md:text-lg font-bold text-blue-600 md:hidden ml-auto">
                              {formatCurrencyWithSymbol(payout.amount)}
                            </p>
                          </div>
                          <div className="min-w-0 flex-1 mt-1 md:mt-0">
                            <p className="font-medium text-gray-900 text-xs sm:text-sm md:text-base truncate leading-tight">
                              {payout.method === 'bank_transfer' ? t('bankTransfer') : 
                               payout.method === 'planettalk_credit' ? t('planettalkCredit') || 'PlanetTalk Credit' :
                               payout.method || t('bankTransfer')}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatHumanDate(payout.createdAt || new Date().toISOString())}
                            </p>
                            <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full mt-1 ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>
                        {/* Desktop: Amount & Status on Right */}
                        <div className="hidden md:block text-right flex-shrink-0 ml-2">
                          <p className="text-base sm:text-lg font-bold text-blue-600">
                            {formatCurrencyWithSymbol(payout.amount)}
                          </p>
                          <span className={`inline-flex px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">{t('noPayoutsYet')}</h4>
                  <p className="text-sm text-gray-500 px-4">{t('requestFirstPayout', { amount: MINIMUM_PAYOUT_AMOUNT })}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Payout Modal */}
      <SimplifiedPayoutModal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        onSubmit={handleRequestPayout}
        availableBalance={String(agent?.availableBalance || '0')}
        isLoading={payoutLoading}
      />
      
      {/* Success/Error Messages - Mobile Optimized - iOS Safe */}
      {successMessage && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 bg-green-500 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-xl shadow-2xl z-[9999] sm:max-w-md will-change-transform transform translate-z-0">
          <div className="flex items-center">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium text-sm sm:text-base flex-1 pr-6">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {error && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 bg-red-500 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-xl shadow-2xl z-[9999] sm:max-w-md will-change-transform transform translate-z-0">
          <div className="flex items-center">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="font-medium text-sm sm:text-base flex-1 pr-6">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}