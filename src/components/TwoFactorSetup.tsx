'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

interface TwoFactorSetupProps {
  onSetupComplete: (backupCodes: string[]) => void
  onCancel: () => void
}

export default function TwoFactorSetup({ onSetupComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'generate' | 'verify' | 'complete'>('generate')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [manualKey, setManualKey] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateQRCode = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.auth.setup2FA()
      setQrCodeUrl(response.qrCodeUrl)
      setManualKey(response.manualEntryKey)
      setStep('verify')
    } catch (error: any) {
      setError(error.message || 'Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.auth.verifySetup2FA({ verificationCode })
      setBackupCodes(response.backupCodes)
      setStep('complete')
    } catch (error: any) {
      setError(error.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    onSetupComplete(backupCodes)
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setVerificationCode(value)
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {step === 'generate' && (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-pt-turquoise/10 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-pt-dark-gray mb-2">
              Enable Two-Factor Authentication
            </h3>
            <p className="text-pt-light-gray">
              Add an extra layer of security to your account with 2FA using an authenticator app.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-blue-900 mb-2">What you'll need:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Google Authenticator, Authy, or similar app</li>
              <li>• Your smartphone or tablet</li>
              <li>• A few minutes to set it up</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={generateQRCode}
              disabled={loading}
              className="flex-1 bg-pt-turquoise text-white px-4 py-2 rounded-lg hover:bg-pt-turquoise-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Setting up...' : 'Get Started'}
            </button>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-pt-dark-gray mb-2">
              Scan QR Code
            </h3>
            <p className="text-pt-light-gray">
              Scan this QR code with your authenticator app
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
            <img 
              src={qrCodeUrl} 
              alt="2FA QR Code" 
              className="mx-auto mb-4"
            />
            
            <div className="text-xs text-pt-light-gray">
              <p className="mb-2">Can't scan? Enter this code manually:</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                {manualKey}
              </code>
            </div>
          </div>

          {/* Verification */}
          <div>
            <label className="block text-sm font-medium text-pt-dark-gray mb-2">
              Enter verification code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={handleCodeChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise text-center tracking-widest font-mono text-lg"
              placeholder="123456"
              maxLength={6}
              autoFocus
            />
            <p className="text-xs text-pt-light-gray mt-2">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep('generate')}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={verifyAndEnable}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 bg-pt-turquoise text-white px-4 py-2 rounded-lg hover:bg-pt-turquoise-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-pt-dark-gray mb-2">
              2FA Enabled Successfully!
            </h3>
            <p className="text-pt-light-gray">
              Your account is now protected with two-factor authentication.
            </p>
          </div>

          {/* Backup Codes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Save Your Backup Codes
            </h4>
            <p className="text-sm text-yellow-800 mb-3">
              Store these backup codes in a safe place. You can use them to access your account if you lose your phone.
            </p>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              {backupCodes.map((code, index) => (
                <code key={index} className="bg-white px-2 py-1 rounded text-xs font-mono text-center border">
                  {code}
                </code>
              ))}
            </div>
            
            <p className="text-xs text-yellow-700">
              Each backup code can only be used once. Generate new codes if you use them all.
            </p>
          </div>

          <button
            onClick={handleComplete}
            className="w-full bg-pt-turquoise text-white px-4 py-2 rounded-lg hover:bg-pt-turquoise-600 transition-colors"
          >
            Complete Setup
          </button>
        </div>
      )}
    </div>
  )
}
