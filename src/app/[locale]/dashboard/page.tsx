'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { api, Agent } from '@/lib/api'
import { formatCurrencyWithSymbol } from '@/lib/utils/currency'
import ShareButton from '@/components/ShareButton'

export default function DashboardPage() {
  const { user } = useAuth()
  const t = useTranslations('dashboard')
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get current agent data
      const agentData = await api.agent.getCurrentAgent()
      setAgent(agentData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading dashboard
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={loadDashboardData}
                className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-pt-dark-gray mb-2">
          {t('welcomeBack', { name: user?.firstName })}
        </h1>
            <p className="text-pt-light-gray">
              {t('agentId')}: <span className="font-mono font-medium">{agent?.agentCode || 'Loading...'}</span>
            </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-pt-turquoise/10 rounded-lg">
              <svg className="w-6 h-6 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">{t('totalEarnings')}</p>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              ) : (
                <p className="text-2xl font-bold text-pt-dark-gray">
                  {agent?.totalEarnings ? formatCurrencyWithSymbol(agent.totalEarnings) : '$0.00'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-pt-turquoise/10 rounded-lg">
              <svg className="w-6 h-6 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">{t('activeReferrals')}</p>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
              ) : (
                <p className="text-2xl font-bold text-pt-dark-gray">
                  {agent?.activeReferrals || 0}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-pt-turquoise/10 rounded-lg">
              <svg className="w-6 h-6 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-pt-light-gray">{t('availableBalance')}</p>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                </div>
              ) : (
                <p className="text-lg font-bold text-pt-dark-gray">
                  {agent?.availableBalance ? formatCurrencyWithSymbol(agent.availableBalance) : '$0.00'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-pt-dark-gray mb-4">
            {t('welcomeTitle')}
          </h2>
          <p className="text-lg text-pt-light-gray mb-6 max-w-2xl mx-auto">
            {t('welcomeDescription', { name: `${user?.firstName} ${user?.lastName}` })}
          </p>
          <div className="bg-pt-turquoise/10 border border-pt-turquoise/20 rounded-lg p-6 max-w-3xl mx-auto">
            <h3 className="text-xl font-semibold text-pt-dark-gray mb-4">{t('nextSteps')}</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-pt-turquoise rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-pt-dark-gray">{t('shareAgentCode')}</p>
                  <p className="text-sm text-pt-light-gray mb-3">{t('shareAgentCodeDescription', { code: agent?.agentCode || 'Loading...' })}</p>
                  {agent?.agentCode && (
                    <div className="relative">
                      <ShareButton 
                        code={agent.agentCode}
                        agentName={`${user?.firstName} ${user?.lastName}`}
                        variant="compact"
                        showCode={true}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-pt-turquoise rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-pt-dark-gray">{t('trackEarnings')}</p>
                  <p className="text-sm text-pt-light-gray">{t('trackEarningsDescription')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-pt-turquoise rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-pt-dark-gray">{t('accessTraining')}</p>
                  <p className="text-sm text-pt-light-gray">{t('accessTrainingDescription')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-pt-turquoise rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-white text-sm font-bold">4</span>
                </div>
                <div>
                  <p className="font-medium text-pt-dark-gray">{t('getSupport')}</p>
                  <p className="text-sm text-pt-light-gray">{t('getSupportDescription')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}