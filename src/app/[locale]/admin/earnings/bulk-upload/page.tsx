'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import { formatCurrencyWithSymbol } from '@/lib/utils/currency'

interface BulkEarningEntry {
  agentCode: string
  amount: number
  type: 'referral_commission' | 'bonus' | 'penalty' | 'adjustment' | 'promotion_bonus'
  description: string
  referenceId?: string
  commissionRate?: number
  earnedAt?: string
  currency?: string
}

interface BulkUploadResponse {
  totalProcessed: number
  successful: number
  failed: number
  skipped: number
  totalAmount: number
  updatedAgents: string[]
  details: Array<{
    agentCode: string
    status: 'success' | 'failed' | 'skipped'
    earningId?: string
    amount: number
    message?: string
    error?: string
  }>
  errorSummary: {
    invalidAgentCodes: string[]
    duplicateReferences: string[]
    validationErrors: string[]
    otherErrors: string[]
  }
  batchInfo: {
    batchId: string
    processedAt: string
    processingTimeMs: number
    uploadedBy: string
  }
}

export default function BulkEarningsUploadPage() {
  const [earnings, setEarnings] = useState<BulkEarningEntry[]>([
    {
      agentCode: '',
      amount: 0,
      type: 'referral_commission',
      description: '',
      referenceId: '',
      commissionRate: 0,
      currency: 'USD'
    }
  ])
  const [batchDescription, setBatchDescription] = useState('')
  const [autoConfirm, setAutoConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BulkUploadResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [jsonInput, setJsonInput] = useState('')
  const [inputMode, setInputMode] = useState<'form' | 'json' | 'file'>('form')
  const [uploadedFileName, setUploadedFileName] = useState('')

  const t = useTranslations('admin')
  const locale = useLocale()

  const addEarningRow = () => {
    setEarnings([...earnings, {
      agentCode: '',
      amount: 0,
      type: 'referral_commission',
      description: '',
      referenceId: '',
      commissionRate: 0,
      currency: 'USD'
    }])
  }

  const removeEarningRow = (index: number) => {
    setEarnings(earnings.filter((_, i) => i !== index))
  }

  const updateEarning = (index: number, field: keyof BulkEarningEntry, value: any) => {
    const updated = [...earnings]
    updated[index] = { ...updated[index], [field]: value }
    setEarnings(updated)
  }

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      if (parsed.earnings && Array.isArray(parsed.earnings)) {
        setEarnings(parsed.earnings)
        if (parsed.batchDescription) setBatchDescription(parsed.batchDescription)
        if (parsed.autoConfirm !== undefined) setAutoConfirm(parsed.autoConfirm)
        setError(null)
      } else {
        setError('Invalid JSON format. Expected an object with "earnings" array.')
      }
    } catch (err) {
      setError('Invalid JSON format. Please check your syntax.')
    }
  }

  const exportToJson = () => {
    const data = {
      earnings: earnings.filter(e => e.agentCode && e.amount > 0),
      batchDescription,
      autoConfirm,
      metadata: {
        uploadSource: 'Admin Panel',
        createdAt: new Date().toISOString()
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bulk-earnings-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadTemplate = () => {
    const headers = ['Agent Code', 'Amount', 'Type', 'Description', 'Reference ID', 'Commission Rate', 'Currency']
    const sampleData = [
      ['AG123456', '25.50', 'referral_commission', 'Commission for customer referral', 'TXN-12345-ABC', '10.5', 'USD'],
      ['AG789012', '50.00', 'bonus', 'Monthly performance bonus', 'BONUS-JAN-2025', '12.0', 'USD'],
      ['AG345678', '15.75', 'referral_commission', 'Commission for mobile top-up referral', 'TXN-67890-DEF', '10.5', 'USD']
    ]
    
    const csvContent = [headers, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bulk-earnings-template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFileName(file.name)
    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string
      
      try {
        if (file.name.endsWith('.csv')) {
          parseCSV(content)
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // For Excel files, we'll need a library like xlsx
          setError('Excel files are not yet supported. Please export to CSV format and try again.')
        } else {
          setError('Unsupported file format. Please use CSV files.')
        }
      } catch (error) {
        setError('Failed to parse file. Please check the format and try again.')
      }
    }

    reader.readAsText(file)
  }

  const parseCSV = (content: string) => {
    const lines = content.split('\\n').filter(line => line.trim())
    if (lines.length < 2) {
      setError('CSV file must have at least a header row and one data row.')
      return
    }

    // Parse header to determine column mapping
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
    
    const expectedColumns = {
      agentCode: ['agent code', 'agentcode', 'agent_code', 'code'],
      amount: ['amount', 'earning', 'earnings', 'value'],
      type: ['type', 'earning_type', 'earningtype'],
      description: ['description', 'desc', 'note', 'notes'],
      referenceId: ['reference id', 'referenceid', 'reference_id', 'ref_id', 'refid'],
      commissionRate: ['commission rate', 'commissionrate', 'commission_rate', 'rate'],
      currency: ['currency', 'curr']
    }

    const columnMapping: { [key: string]: number } = {}
    
    Object.entries(expectedColumns).forEach(([key, possibleNames]) => {
      const foundIndex = headers.findIndex(h => possibleNames.includes(h))
      if (foundIndex !== -1) {
        columnMapping[key] = foundIndex
      }
    })

    if (columnMapping.agentCode === undefined || columnMapping.amount === undefined) {
      setError('CSV must contain at least "Agent Code" and "Amount" columns.')
      return
    }

    const parsedEarnings: BulkEarningEntry[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
      
      if (values.length < 2) continue // Skip empty rows

      const entry: BulkEarningEntry = {
        agentCode: values[columnMapping.agentCode] || '',
        amount: parseFloat(values[columnMapping.amount]) || 0,
        type: (values[columnMapping.type] as any) || 'referral_commission',
        description: values[columnMapping.description] || '',
        referenceId: values[columnMapping.referenceId] || undefined,
        commissionRate: columnMapping.commissionRate !== undefined ? parseFloat(values[columnMapping.commissionRate]) || undefined : undefined,
        currency: values[columnMapping.currency] || 'USD'
      }

      if (entry.agentCode && entry.amount > 0) {
        parsedEarnings.push(entry)
      }
    }

    if (parsedEarnings.length === 0) {
      setError('No valid earnings found in CSV file.')
      return
    }

    setEarnings(parsedEarnings)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validEarnings = earnings.filter(e => e.agentCode && e.amount > 0)
    if (validEarnings.length === 0) {
      setError('Please add at least one valid earning entry.')
      return
    }

    if (validEarnings.length > 1000) {
      setError('Maximum 1,000 entries per batch allowed.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const payload = {
        earnings: validEarnings.map(e => ({
          ...e,
          referenceId: e.referenceId || undefined,
          commissionRate: e.commissionRate || undefined,
          earnedAt: e.earnedAt || undefined,
          currency: e.currency || 'USD'
        })),
        batchDescription: batchDescription || `Bulk upload - ${new Date().toLocaleDateString()}`,
        autoConfirm,
        metadata: {
          uploadSource: 'Admin Panel',
          uploadedAt: new Date().toISOString()
        }
      }

      const response = await api.admin.bulkUploadEarnings(payload)
      setResult(response)

    } catch (error: any) {
      setError(error.message || 'Failed to upload earnings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Earnings Upload</h1>
            <p className="text-gray-600">Upload agent earnings in bulk to update balances and commissions</p>
          </div>
        </div>
      </div>

      {/* Input Mode Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <span className="text-sm font-medium text-gray-700">Input Mode:</span>
          <div className="flex rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setInputMode('form')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md transition-colors ${
                inputMode === 'form'
                  ? 'bg-pt-turquoise text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Form Input
            </button>
            <button
              onClick={() => setInputMode('file')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                inputMode === 'file'
                  ? 'bg-pt-turquoise text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              CSV Upload
            </button>
            <button
              onClick={() => setInputMode('json')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md transition-colors ${
                inputMode === 'json'
                  ? 'bg-pt-turquoise text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              JSON Import
            </button>
          </div>
        </div>

        {inputMode === 'json' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste JSON Data:
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"earnings": [{"agentCode": "AG123456", "amount": 25.50, "type": "referral_commission", "description": "Commission"}]}'
                className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise font-mono text-sm"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleJsonImport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Import JSON
              </button>
              <button
                onClick={() => {
                  setJsonInput(JSON.stringify({
                    earnings: [
                      {
                        agentCode: "AG123456",
                        amount: 25.50,
                        type: "referral_commission",
                        description: "Commission for customer referral",
                        referenceId: "TXN-12345-ABC",
                        commissionRate: 10.5
                      }
                    ],
                    batchDescription: "Monthly commission upload",
                    autoConfirm: false
                  }, null, 2))
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Load Example
              </button>
            </div>
          </div>
        )}

        {inputMode === 'file' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File:
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pt-turquoise file:text-white hover:file:bg-pt-turquoise-600"
                />
                <button
                  onClick={downloadTemplate}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
                >
                  Download Template
                </button>
              </div>
              {uploadedFileName && (
                <div className="mt-2 text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  File uploaded: {uploadedFileName}
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">CSV Format Requirements:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Required columns:</strong> "Agent Code", "Amount"</p>
                <p>• <strong>Optional columns:</strong> "Type", "Description", "Reference ID", "Commission Rate", "Currency"</p>
                <p>• <strong>Column names are flexible:</strong> "Agent Code" can also be "AgentCode", "agent_code", etc.</p>
                <p>• <strong>Encoding:</strong> UTF-8 recommended for international characters</p>
                <p>• <strong>Excel support:</strong> Export your Excel file to CSV format first</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Batch Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Batch Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Description
            </label>
            <input
              type="text"
              value={batchDescription}
              onChange={(e) => setBatchDescription(e.target.value)}
              placeholder="e.g., Monthly commission upload - January 2025"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoConfirm}
                onChange={(e) => setAutoConfirm(e.target.checked)}
                className="h-5 w-5 text-pt-turquoise focus:ring-pt-turquoise border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Auto-Confirm Earnings</span>
            </label>
            <div className="text-xs text-gray-500">
              {autoConfirm ? 'Balances will be updated immediately' : 'Earnings will be pending approval'}
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Form */}
      {inputMode === 'form' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Earnings Entries</h2>
            <div className="flex space-x-3">
              <button
                onClick={exportToJson}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Export JSON
              </button>
              <button
                onClick={addEarningRow}
                className="bg-pt-turquoise text-white px-4 py-2 rounded-lg hover:bg-pt-turquoise-600 transition-colors"
              >
                + Add Row
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {earnings.map((earning, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={earning.agentCode}
                        onChange={(e) => updateEarning(index, 'agentCode', e.target.value)}
                        placeholder="AG123456"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-pt-turquoise focus:border-pt-turquoise"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={earning.amount}
                        onChange={(e) => updateEarning(index, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="25.50"
                        step="0.01"
                        min="0"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-pt-turquoise focus:border-pt-turquoise"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={earning.type}
                        onChange={(e) => updateEarning(index, 'type', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-pt-turquoise focus:border-pt-turquoise"
                      >
                        <option value="referral_commission">Referral Commission</option>
                        <option value="bonus">Bonus</option>
                        <option value="penalty">Penalty</option>
                        <option value="adjustment">Adjustment</option>
                        <option value="promotion_bonus">Promotion Bonus</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={earning.description}
                        onChange={(e) => updateEarning(index, 'description', e.target.value)}
                        placeholder="Commission for customer referral"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-pt-turquoise focus:border-pt-turquoise"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={earning.referenceId || ''}
                        onChange={(e) => updateEarning(index, 'referenceId', e.target.value)}
                        placeholder="TXN-12345 (optional)"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-pt-turquoise focus:border-pt-turquoise"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={earning.commissionRate || ''}
                        onChange={(e) => updateEarning(index, 'commissionRate', parseFloat(e.target.value) || undefined)}
                        placeholder="10.5"
                        step="0.1"
                        min="0"
                        max="100"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-pt-turquoise focus:border-pt-turquoise"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeEarningRow(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        disabled={earnings.length === 1}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Upload Summary</h3>
            <p className="text-gray-600">
              {earnings.filter(e => e.agentCode && e.amount > 0).length} valid entries • 
              Total Amount: {formatCurrencyWithSymbol(earnings.reduce((sum, e) => sum + (e.amount || 0), 0))}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || earnings.filter(e => e.agentCode && e.amount > 0).length === 0}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {loading ? 'Processing...' : 'Upload Earnings'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Upload Results</h2>
          </div>
          
          <div className="p-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{result.successful}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{result.skipped}</div>
                <div className="text-sm text-gray-600">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{formatCurrencyWithSymbol(result.totalAmount)}</div>
                <div className="text-sm text-gray-600">Total Amount</div>
              </div>
            </div>

            {/* Batch Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Batch Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Batch ID:</span>
                  <span className="font-mono ml-2">{result.batchInfo.batchId}</span>
                </div>
                <div>
                  <span className="text-gray-600">Processed At:</span>
                  <span className="ml-2">{new Date(result.batchInfo.processedAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Processing Time:</span>
                  <span className="ml-2">{result.batchInfo.processingTimeMs}ms</span>
                </div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Detailed Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earning ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {result.details.map((detail, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">{detail.agentCode}</td>
                        <td className="px-4 py-3 text-sm">{formatCurrencyWithSymbol(detail.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            detail.status === 'success' ? 'bg-green-100 text-green-800' :
                            detail.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {detail.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {detail.message || detail.error || 'No message'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">
                          {detail.earningId ? detail.earningId.slice(0, 8) + '...' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Error Summary */}
            {(result.errorSummary.invalidAgentCodes.length > 0 || 
              result.errorSummary.duplicateReferences.length > 0 || 
              result.errorSummary.validationErrors.length > 0) && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">Error Summary</h3>
                {result.errorSummary.invalidAgentCodes.length > 0 && (
                  <div className="mb-2">
                    <span className="text-red-700 font-medium">Invalid Agent Codes:</span>
                    <span className="ml-2 font-mono text-sm">{result.errorSummary.invalidAgentCodes.join(', ')}</span>
                  </div>
                )}
                {result.errorSummary.duplicateReferences.length > 0 && (
                  <div className="mb-2">
                    <span className="text-red-700 font-medium">Duplicate References:</span>
                    <span className="ml-2 font-mono text-sm">{result.errorSummary.duplicateReferences.join(', ')}</span>
                  </div>
                )}
                {result.errorSummary.validationErrors.length > 0 && (
                  <div>
                    <span className="text-red-700 font-medium">Validation Errors:</span>
                    <ul className="ml-4 mt-1 list-disc text-sm">
                      {result.errorSummary.validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Success Actions */}
            {result.successful > 0 && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-800">Upload Successful!</h3>
                    <p className="text-green-700 text-sm">
                      {result.successful} earnings processed successfully. 
                      {result.updatedAgents.length} agent balances updated.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setResult(null)
                      setEarnings([{
                        agentCode: '',
                        amount: 0,
                        type: 'referral_commission',
                        description: '',
                        referenceId: '',
                        commissionRate: 0,
                        currency: 'USD'
                      }])
                      setBatchDescription('')
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start New Batch
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-3">💡 Usage Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
          <ul className="space-y-2">
            <li>• <strong>Agent Code:</strong> Must be exact match (e.g., AG123456)</li>
            <li>• <strong>Amount:</strong> Use positive numbers for credits, negative for deductions</li>
            <li>• <strong>Reference ID:</strong> Optional but recommended for tracking</li>
            <li>• <strong>Commission Rate:</strong> Optional override for this specific earning</li>
          </ul>
          <ul className="space-y-2">
            <li>• <strong>Auto-Confirm:</strong> Updates balances immediately when checked</li>
            <li>• <strong>Batch Size:</strong> Maximum 1,000 entries per upload</li>
            <li>• <strong>CSV Upload:</strong> Upload Excel/CSV files with earnings data</li>
            <li>• <strong>JSON Import:</strong> Use for large batches or API integration</li>
            <li>• <strong>Duplicate Prevention:</strong> Reference IDs must be unique</li>
          </ul>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-100 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Earning Types:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• <strong>Referral Commission:</strong> Standard commission from referrals</div>
              <div>• <strong>Bonus:</strong> Performance or promotional bonuses</div>
              <div>• <strong>Penalty:</strong> Deductions or penalties</div>
              <div>• <strong>Adjustment:</strong> Manual adjustments (positive or negative)</div>
              <div>• <strong>Promotion Bonus:</strong> Special promotional bonuses</div>
            </div>
          </div>
          
          <div className="bg-green-100 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">CSV Template Columns:</h4>
            <div className="text-sm text-green-700 space-y-1">
              <div>• <strong>Agent Code</strong> (required): AG123456</div>
              <div>• <strong>Amount</strong> (required): 25.50</div>
              <div>• <strong>Type</strong> (optional): referral_commission</div>
              <div>• <strong>Description</strong> (optional): Commission details</div>
              <div>• <strong>Reference ID</strong> (optional): TXN-12345</div>
              <div>• <strong>Commission Rate</strong> (optional): 10.5</div>
              <div>• <strong>Currency</strong> (optional): USD</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
