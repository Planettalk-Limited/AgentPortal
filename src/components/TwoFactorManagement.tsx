'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

interface TwoFactorManagementProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
}

export default function TwoFactorManagement({ isEnabled, onToggle }: TwoFactorManagementProps) {
  const [showDisableForm, setShowDisableForm] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDisable2FA = async () => {
    try {
      setLoading(true)
      setError(null)
      
      await api.auth.disable2FA({
        verificationCode,
        currentPassword
      })
      
      setShowDisableForm(false)
      setVerificationCode('')
      setCurrentPassword('')
      onToggle(false)
    } catch (error: any) {
      setError(error.message || 'Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setShowDisableForm(false)
    setVerificationCode('')
    setCurrentPassword('')
    setError(null)
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setVerificationCode(value)
  }

  if (!isEnabled) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-pt-dark-gray">Two-Factor Authentication</h3>
            <p className="text-sm text-pt-light-gray mt-1">
              Add an extra layer of security to your account
            </p>
            <p className="text-sm text-red-600 mt-2">
              ⚠️ Not enabled - Your account is less secure
            </p>
          </div>
          
          <button
            onClick={() => onToggle(true)}
            className="bg-pt-turquoise text-white px-4 py-2 rounded-lg hover:bg-pt-turquoise-600 transition-colors text-sm font-medium"
          >
            Enable 2FA
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-pt-dark-gray">Two-Factor Authentication</h3>
          <p className="text-sm text-pt-light-gray mt-1">
            Your account is protected with 2FA
          </p>
          <p className="text-sm text-green-600 mt-2">
            ✅ Enabled - Your account is secure
          </p>
        </div>
        
        <button
          onClick={() => setShowDisableForm(true)}
          className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
        >
          Disable 2FA
        </button>
      </div>

      {/* Disable 2FA Form */}
      {showDisableForm && (
        <div className="mt-6 pt-6 border-t border-green-200">
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <h4 className="font-semibold text-red-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Disable Two-Factor Authentication
            </h4>
            <p className="text-sm text-red-800 mb-4">
              This will make your account less secure. You&apos;ll only need your password to sign in.
            </p>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  2FA Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={handleCodeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center tracking-widest font-mono text-sm"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDisable2FA}
                disabled={loading || !currentPassword || verificationCode.length !== 6}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
