'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { api, Agent, AgentDashboard, Earning, Payout } from '@/lib/api'
import { CreatePayoutRequest } from '@/lib/api/types'
import { formatCurrencyWithSymbol, parseCurrency } from '@/lib/utils/currency'
import { MINIMUM_PAYOUT_AMOUNT } from '@/lib/constants/payout'
import ShareButton from '@/components/ShareButton'
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
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 -m-4 sm:-m-6">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-pt-turquoise to-pt-turquoise-600 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-8 lg:mb-0">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-2xl font-bold text-white">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
    <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white">
          {t('welcomeBack', { name: user?.firstName || 'Agent' })}
        </h1>
                  <p className="text-pt-turquoise-100 text-lg mt-1">
                    Agent Code: <span className="font-mono font-bold">{agent.agentCode}</span>
            </p>
      </div>
              </div>
      </div>

            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{parseFloat(String(agent.commissionRate || '0'))}%</div>
                <div className="text-pt-turquoise-100 text-sm">Commission Rate</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{formatCurrencyWithSymbol(agent.availableBalance)}</div>
                <div className="text-pt-turquoise-100 text-sm">{t('available')}</div>
            </div>
                </div>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 -mt-16 relative z-10">
          {/* Total Earnings */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{formatCurrencyWithSymbol(agent.totalEarnings)}</div>
                <div className="text-sm text-gray-500">{t('totalEarnings')}</div>
              </div>
            </div>
            <div className="flex items-center text-green-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm font-medium">{t('allTime')}</span>
            </div>
          </div>
          
          {/* This Month */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{formatCurrencyWithSymbol(dashboard?.summary.monthlyEarnings || 0)}</div>
                <div className="text-sm text-gray-500">{getCurrentMonth()}</div>
              </div>
                </div>
            <div className="flex items-center text-blue-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{t('currentMonth')}</span>
            </div>
          </div>
          
          {/* Total Referrals */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{agent.totalReferrals || 0}</div>
                <div className="text-sm text-gray-500">{t('totalReferrals')}</div>
            </div>
            </div>
            <div className="flex items-center text-purple-600">
              <span className="text-sm font-medium">{parseFloat(String(agent.commissionRate || '0'))}% rate</span>
          </div>
        </div>

          {/* Available Balance */}
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{formatCurrencyWithSymbol(agent.availableBalance)}</div>
                <div className="text-sm text-gray-500">Available</div>
              </div>
            </div>
            {parseCurrency(agent.availableBalance) < MINIMUM_PAYOUT_AMOUNT ? (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((parseCurrency(agent.availableBalance) / MINIMUM_PAYOUT_AMOUNT) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  ${MINIMUM_PAYOUT_AMOUNT - parseCurrency(agent.availableBalance)} {t('toPayout')}
                </div>
                </div>
              ) : (
              <div className="flex items-center text-emerald-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">{t('readyForPayoutShort')}</span>
              </div>
              )}
            </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Share & Earn Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-pt-turquoise to-pt-turquoise-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white mb-2">{t('shareAndEarnHeader')}</h2>
                <p className="text-pt-turquoise-100">{t('shareAgentCodeEarn')}</p>
      </div>

              <div className="p-8">
                {/* Agent Code Showcase */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center bg-gradient-to-r from-pt-turquoise-50 to-pt-turquoise-100 rounded-2xl p-6 mb-6">
        <div className="text-center">
                      <div className="text-sm font-semibold text-pt-turquoise-700 mb-2">{t('yourAgentCode')}</div>
                      <div className="font-mono text-4xl font-bold text-pt-turquoise mb-3 tracking-wider">
                        {agent.agentCode}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(agent.agentCode)
                          setSuccessMessage(t('agentCodeCopied'))
                        }}
                        className="inline-flex items-center space-x-2 text-pt-turquoise hover:text-pt-turquoise-600 font-medium transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>{t('copyCode')}</span>
                      </button>
          </div>
        </div>
      </div>

                {/* Enhanced Share Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <button
                    onClick={() => {
                      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Hi, my name is ${user?.firstName} ${user?.lastName}. Download the PlanetTalk app for great rates on international calls and top-ups! Use my agent code: ${agent.agentCode} when you sign up. https://app.planettalk.com/Jxk8/shareapp`)}`
                      window.open(whatsappUrl, '_blank')
                    }}
                    className="flex flex-col items-center p-6 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group"
                  >
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </div>
                    <div className="text-green-700 font-semibold">{t('whatsapp')}</div>
                    <div className="text-green-600 text-sm">{t('quickShare')}</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      const emailSubject = 'Join PlanetTalk - International Top-ups'
                      const emailBody = `Hi, my name is ${user?.firstName} ${user?.lastName}.\\n\\nI'd like to invite you to download the PlanetTalk app for great rates on international calls and mobile top-ups.\\n\\nPlease use my agent code: ${agent.agentCode} when you sign up - this helps support my business.\\n\\nDownload the app here: https://app.planettalk.com/Jxk8/shareapp\\n\\nThanks!\\n${user?.firstName}`
                      window.open(`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`, '_blank')
                    }}
                    className="flex flex-col items-center p-6 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-blue-700 font-semibold">{t('email')}</div>
                    <div className="text-blue-600 text-sm">{t('professional')}</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      const tweetText = `Hi, my name is ${user?.firstName} ${user?.lastName}. Download PlanetTalk for great international calls & top-ups! Use my agent code: ${agent.agentCode} when you sign up 📱💰 #PlanetTalk`
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(`https://app.planettalk.com/Jxk8/shareapp`)}`, '_blank')
                    }}
                    className="flex flex-col items-center p-6 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors group"
                  >
                    <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </div>
                    <div className="text-sky-700 font-semibold">{t('twitter')}</div>
                    <div className="text-sky-600 text-sm">{t('socialMedia')}</div>
                  </button>
                </div>
                
                {/* Advanced Share Button */}
                <div className="border-t pt-6">
                      <ShareButton 
                        code={agent.agentCode}
                        agentName={`${user?.firstName} ${user?.lastName}`}
                    variant="primary"
                    size="lg"
                    showUrl={true}
                    className="w-full"
                      />
                    </div>
              </div>
                </div>
                </div>
          
          {/* Payout Section */}
          <div className="space-y-8">
            {/* Payout Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">{t('requestPayout')}</h3>
              </div>
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {formatCurrencyWithSymbol(agent.availableBalance)}
                  </div>
                  <div className="text-gray-500">{t('availableBalance')}</div>
                </div>
                
                {parseCurrency(agent.availableBalance) < MINIMUM_PAYOUT_AMOUNT ? (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold text-yellow-700">{t('almostThere')}</span>
                      </div>
                      <p className="text-yellow-600 text-sm">
                        {t('needMore', { amount: formatCurrencyWithSymbol(MINIMUM_PAYOUT_AMOUNT - parseCurrency(agent.availableBalance)) })}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t('progressTo')} ${MINIMUM_PAYOUT_AMOUNT}</span>
                        <span className="font-medium">{Math.round((parseCurrency(agent.availableBalance) / MINIMUM_PAYOUT_AMOUNT) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min((parseCurrency(agent.availableBalance) / MINIMUM_PAYOUT_AMOUNT) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
                    >
                      {t('payoutUnavailable')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-semibold text-green-700">{t('readyForPayout')}</span>
                      </div>
                      <p className="text-green-600 text-sm">
                        {t('balanceMeetsRequirement')}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setShowPayoutModal(true)}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-colors font-semibold shadow-lg"
                    >
                      {t('requestPayout')}
                    </button>
                </div>
                  )}
                </div>
              </div>
            
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('quickStats')}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('commissionRate')}</span>
                  <span className="font-semibold text-pt-turquoise">{parseFloat(String(agent.commissionRate || '0'))}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Referrals</span>
                  <span className="font-semibold">{agent.activeReferrals || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Commission Rate</span>
                  <span className="font-semibold">{parseFloat(String(agent.commissionRate || '0'))}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          {/* Recent Earnings */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-green-800 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('recentEarnings')}
              </h3>
            </div>
            
            <div className="p-6">
              {earnings.length > 0 ? (
                <div className="space-y-4">
                  {earnings.slice(0, 5).map((earning, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                </div>
                <div>
                          <p className="font-medium text-gray-900">
                            {earning.description || t('commissionEarned')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(earning.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrencyWithSymbol(earning.amount)}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{t('noEarningsYet')}</h4>
                  <p className="text-gray-500">{t('startSharing')}</p>
                </div>
              )}
                </div>
              </div>
          
          {/* Recent Payouts */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {t('recentPayouts')}
              </h3>
            </div>
            
            <div className="p-6">
              {payouts.length > 0 ? (
                <div className="space-y-4">
                  {payouts.slice(0, 5).map((payout, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                </div>
                <div>
                          <p className="font-medium text-gray-900">
                            {payout.method || t('bankTransfer')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(payout.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrencyWithSymbol(payout.amount)}
                        </p>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {t('pending')}
                        </span>
                </div>
              </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{t('noPayoutsYet')}</h4>
                  <p className="text-gray-500">{t('requestFirstPayout', { amount: MINIMUM_PAYOUT_AMOUNT })}</p>
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
      
      {/* Success/Error Messages */}
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
          <button
            onClick={() => setSuccessMessage(null)}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-md">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}