'use client'

import { useState, useEffect } from 'react'
import { api, User } from '@/lib/api'
import { withAuth } from '@/contexts/AuthContext'
import Toast from '@/components/Toast'

const PARTNER_CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

const ACTIVITY_LABELS: Record<string, string> = {
  grocery_convenience: 'Grocery / Convenience',
  restaurant_cafe: 'Restaurant / Cafe',
  bar_pub: 'Bar / Pub',
  specialty_food_import: 'Specialty Food Import',
  professional_services: 'Professional Services',
  other: 'Other',
}

const INTERACTION_LABELS: Record<string, string> = {
  sit_down_table_service: 'Sit-down / Table Service',
  grab_and_go: 'Grab-and-go / Over the counter',
  appointment_based: 'Appointment based',
}

const ACTIVITY_OPTIONS = Object.entries(ACTIVITY_LABELS)
const INTERACTION_OPTIONS = Object.entries(INTERACTION_LABELS)

function generateSuggestedCode(companyName: string): string {
  return companyName
    .replace(/\b(ltd|limited|plc|inc|llc|co|corp|gmbh)\b/gi, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+$/, '')
    .slice(0, 40)
}

interface BusinessMeta {
  companyName?: string
  businessAddress?: string
  primaryBusinessActivity?: string
  primarySpecialty?: string
  customerInteractionType?: string
  sellsInternationalGoods?: boolean
  expectedVolume?: string
  region?: string
  companyRegistrationNumber?: string
}

function getBusinessMeta(user: User): BusinessMeta {
  const meta = user.metadata as Record<string, any> | undefined
  return (meta?.business as BusinessMeta) ?? {}
}

function BusinessPartnersPage() {
  const [applications, setApplications] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'awaiting_partner_approval' | 'rejected'>('all')

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [partnerCode, setPartnerCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    country: '',
    phoneNumber: '',
    companyName: '',
    businessAddress: '',
    primaryBusinessActivity: '',
    primarySpecialty: '',
    customerInteractionType: '',
    sellsInternationalGoods: false,
    expectedVolume: '',
    region: '',
    companyRegistrationNumber: '',
  })

  useEffect(() => { loadApplications() }, [])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const data = await api.admin.getPendingBusinessPartners()
      setApplications(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to load applications', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const openReview = (user: User) => {
    const biz = getBusinessMeta(user)
    setSelectedUser(user)
    setPartnerCode('')
    setCodeError(null)
    setRejectionReason('')
    setShowRejectConfirm(false)
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      country: user.country || '',
      phoneNumber: user.phoneNumber || '',
      companyName: biz.companyName || '',
      businessAddress: biz.businessAddress || '',
      primaryBusinessActivity: biz.primaryBusinessActivity || '',
      primarySpecialty: biz.primarySpecialty || '',
      customerInteractionType: biz.customerInteractionType || '',
      sellsInternationalGoods: Boolean(biz.sellsInternationalGoods),
      expectedVolume: biz.expectedVolume || '',
      region: biz.region || '',
      companyRegistrationNumber: biz.companyRegistrationNumber || '',
    })
  }

  const backToList = () => {
    setSelectedUser(null)
    setPartnerCode('')
    setCodeError(null)
    setRejectionReason('')
    setShowRejectConfirm(false)
  }

  const validatePartnerCode = (code: string): string | null => {
    if (!code.trim()) return 'Partner code is required'
    if (code.length < 3) return 'Minimum 3 characters'
    if (code.length > 40) return 'Maximum 40 characters'
    if (!PARTNER_CODE_REGEX.test(code)) return 'Must start with a letter or digit, and contain only letters, digits, underscores or hyphens'
    return null
  }

  const handleApprove = async () => {
    if (!selectedUser) return
    const err = validatePartnerCode(partnerCode)
    if (err) { setCodeError(err); return }

    try {
      setActionLoading(true)
      setCodeError(null)
      await api.admin.approveBusinessPartner(selectedUser.id, partnerCode.trim())
      setApplications(prev => prev.filter(u => u.id !== selectedUser.id))
      setToast({ message: `Approved! Partner code "${partnerCode.trim()}" assigned to ${getBusinessMeta(selectedUser).companyName || selectedUser.firstName}.`, type: 'success' })
      backToList()
    } catch (err: any) {
      setCodeError(err.error || err.message || 'Approval failed — the partner code may already be in use.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveApplicationChanges = async () => {
    if (!selectedUser) return
    try {
      setActionLoading(true)
      const payload = {
        firstName: editForm.firstName.trim() || undefined,
        lastName: editForm.lastName.trim() || undefined,
        country: editForm.country.trim() || undefined,
        phoneNumber: editForm.phoneNumber.trim() || undefined,
        companyName: editForm.companyName.trim() || undefined,
        businessAddress: editForm.businessAddress.trim() || undefined,
        primaryBusinessActivity: editForm.primaryBusinessActivity || undefined,
        primarySpecialty: editForm.primarySpecialty.trim() || undefined,
        customerInteractionType: editForm.customerInteractionType || undefined,
        sellsInternationalGoods: editForm.sellsInternationalGoods,
        expectedVolume: editForm.expectedVolume.trim() || undefined,
        region: editForm.region.trim() || undefined,
        companyRegistrationNumber: editForm.companyRegistrationNumber.trim() || undefined,
      }

      await api.admin.updateBusinessPartnerApplication(selectedUser.id, payload)

      const nextStatus =
        selectedUser.status === 'rejected' ? 'awaiting_partner_approval' : selectedUser.status
      const nextUser: User = {
        ...selectedUser,
        firstName: payload.firstName || selectedUser.firstName,
        lastName: payload.lastName || selectedUser.lastName,
        country: payload.country || selectedUser.country,
        phoneNumber: payload.phoneNumber ?? selectedUser.phoneNumber,
        status: nextStatus,
        metadata: {
          ...(selectedUser.metadata || {}),
          business: {
            ...(getBusinessMeta(selectedUser) || {}),
            companyName: payload.companyName ?? getBusinessMeta(selectedUser).companyName,
            businessAddress: payload.businessAddress ?? getBusinessMeta(selectedUser).businessAddress,
            primaryBusinessActivity: payload.primaryBusinessActivity ?? getBusinessMeta(selectedUser).primaryBusinessActivity,
            primarySpecialty: payload.primarySpecialty ?? getBusinessMeta(selectedUser).primarySpecialty,
            customerInteractionType: payload.customerInteractionType ?? getBusinessMeta(selectedUser).customerInteractionType,
            sellsInternationalGoods: payload.sellsInternationalGoods ?? getBusinessMeta(selectedUser).sellsInternationalGoods,
            expectedVolume: payload.expectedVolume ?? getBusinessMeta(selectedUser).expectedVolume,
            region: payload.region ?? getBusinessMeta(selectedUser).region,
            companyRegistrationNumber: payload.companyRegistrationNumber ?? getBusinessMeta(selectedUser).companyRegistrationNumber,
          },
        },
      }

      setSelectedUser(nextUser)
      setApplications(prev => prev.map(u => (u.id === selectedUser.id ? nextUser : u)))
      setToast({
        message:
          selectedUser.status === 'rejected'
            ? 'Application updated and moved back to review.'
            : 'Application details updated successfully.',
        type: 'success',
      })
    } catch (err: any) {
      setToast({ message: err.error || err.message || 'Failed to update application', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleMoveToReview = async () => {
    if (!selectedUser) return
    try {
      setActionLoading(true)
      await api.admin.moveBusinessPartnerToReview(selectedUser.id)
      const nextUser: User = { ...selectedUser, status: 'awaiting_partner_approval' }
      setSelectedUser(nextUser)
      setApplications(prev => prev.map(u => (u.id === selectedUser.id ? nextUser : u)))
      setToast({ message: 'Application moved back to review.', type: 'success' })
    } catch (err: any) {
      setToast({ message: err.error || err.message || 'Failed to move application to review', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedUser) return
    try {
      setActionLoading(true)
      await api.admin.rejectBusinessPartner(selectedUser.id, rejectionReason.trim() || undefined)
      const nextUser: User = {
        ...selectedUser,
        status: 'rejected',
        metadata: {
          ...(selectedUser.metadata || {}),
          rejectionReason: rejectionReason.trim() || null,
        },
      }
      setApplications(prev => prev.map(u => (u.id === selectedUser.id ? nextUser : u)))
      setSelectedUser(nextUser)
      setShowRejectConfirm(false)
      setToast({ message: `Application from ${getBusinessMeta(selectedUser).companyName || selectedUser.firstName} has been rejected.`, type: 'success' })
    } catch (err: any) {
      setCodeError(err.error || err.message || 'Rejection failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  // ── Review Detail View ──
  if (selectedUser) {
    const biz = getBusinessMeta(selectedUser)
    const isRejected = selectedUser.status === 'rejected'

    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Back button */}
        <button onClick={backToList} className="inline-flex items-center text-sm text-gray-500 hover:text-pt-turquoise transition-colors mb-6">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to applications
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{biz.companyName || 'Business Application'}</h1>
          <p className="text-gray-500 mt-1">{selectedUser.firstName} {selectedUser.lastName} &middot; {selectedUser.email}</p>
          <div className="mt-3 inline-flex items-center gap-2">
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
              isRejected ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {isRejected ? 'Rejected' : 'In Review'}
            </span>
            {isRejected && selectedUser.metadata?.rejectionReason && (
              <span className="text-xs text-red-600">Reason: {String(selectedUser.metadata.rejectionReason)}</span>
            )}
          </div>
        </div>

        {/* Application Details */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Application Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Detail label="Company Name" value={biz.companyName} />
            <Detail label="Business Address" value={biz.businessAddress} />
            <Detail label="Primary Activity" value={ACTIVITY_LABELS[biz.primaryBusinessActivity || ''] || biz.primaryBusinessActivity} />
            <Detail label="Primary Specialty" value={biz.primarySpecialty} />
            <Detail label="Customer Interaction" value={INTERACTION_LABELS[biz.customerInteractionType || ''] || biz.customerInteractionType} />
            <Detail label="Sells International Goods" value={biz.sellsInternationalGoods ? 'Yes' : 'No'} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Edit Application Details</h2>
          </div>
          {isRejected && (
            <div className="mx-6 mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-800">Application is currently rejected</p>
                <p className="text-xs text-amber-700 mt-0.5">Use this action after making corrections to send it back to the review queue.</p>
              </div>
              <button
                onClick={handleMoveToReview}
                disabled={actionLoading}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
              >
                {actionLoading ? 'Moving...' : 'Move to Review'}
              </button>
            </div>
          )}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" value={editForm.firstName} onChange={(v) => setEditForm(f => ({ ...f, firstName: v }))} />
            <Input label="Last Name" value={editForm.lastName} onChange={(v) => setEditForm(f => ({ ...f, lastName: v }))} />
            <Input label="Country (2-char)" value={editForm.country} onChange={(v) => setEditForm(f => ({ ...f, country: v.toUpperCase() }))} />
            <Input label="Phone Number" value={editForm.phoneNumber} onChange={(v) => setEditForm(f => ({ ...f, phoneNumber: v }))} />
            <Input label="Company Name" value={editForm.companyName} onChange={(v) => setEditForm(f => ({ ...f, companyName: v }))} />
            <Input label="Business Address" value={editForm.businessAddress} onChange={(v) => setEditForm(f => ({ ...f, businessAddress: v }))} />
            <SelectInput
              label="Primary Business Activity"
              value={editForm.primaryBusinessActivity}
              options={ACTIVITY_OPTIONS}
              onChange={(v) => setEditForm(f => ({ ...f, primaryBusinessActivity: v }))}
            />
            <Input label="Primary Specialty" value={editForm.primarySpecialty} onChange={(v) => setEditForm(f => ({ ...f, primarySpecialty: v }))} />
            <SelectInput
              label="Customer Interaction"
              value={editForm.customerInteractionType}
              options={INTERACTION_OPTIONS}
              onChange={(v) => setEditForm(f => ({ ...f, customerInteractionType: v }))}
            />
            <Input label="Expected Volume" value={editForm.expectedVolume} onChange={(v) => setEditForm(f => ({ ...f, expectedVolume: v }))} />
            <Input label="Region" value={editForm.region} onChange={(v) => setEditForm(f => ({ ...f, region: v }))} />
            <Input label="Company Registration Number" value={editForm.companyRegistrationNumber} onChange={(v) => setEditForm(f => ({ ...f, companyRegistrationNumber: v }))} />
            <label className="text-sm text-gray-700 flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.sellsInternationalGoods}
                onChange={(e) => setEditForm(f => ({ ...f, sellsInternationalGoods: e.target.checked }))}
              />
              Sells International Goods
            </label>
          </div>
          <div className="px-6 pb-6">
            <button
              onClick={handleSaveApplicationChanges}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading
                ? 'Saving...'
                : isRejected
                  ? 'Save Changes & Move to Review'
                  : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Contact Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Detail label="Name" value={`${selectedUser.firstName} ${selectedUser.lastName}`} />
            <Detail label="Email" value={selectedUser.email} />
            <Detail label="Phone" value={selectedUser.phoneNumber} />
            <Detail label="Country" value={selectedUser.country} />
            <Detail label="Registered" value={selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined} />
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Approve */}
          <div className="bg-white rounded-2xl border-2 border-green-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-4">Approve & Assign Partner Code</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="partnerCode" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Partner Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="partnerCode"
                  type="text"
                  value={partnerCode}
                  onChange={e => { setPartnerCode(e.target.value.replace(/\s/g, '')); setCodeError(null) }}
                  maxLength={40}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-base font-mono tracking-wide focus:ring-0 transition-colors ${
                    codeError ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  }`}
                  placeholder="Type a unique partner code"
                />
                <div className="flex items-center justify-between mt-1.5">
                  {codeError
                    ? <p className="text-xs text-red-600">{codeError}</p>
                    : <p className="text-xs text-gray-400">3–40 chars. Letters, digits, underscores, hyphens.</p>
                  }
                  <span className="text-xs text-gray-400">{partnerCode.length}/40</span>
                </div>
                {!partnerCode && biz.companyName && (
                  <button
                    type="button"
                    onClick={() => setPartnerCode(generateSuggestedCode(biz.companyName!))}
                    className="mt-2 text-xs text-green-600 hover:text-green-700 underline underline-offset-2"
                  >
                    Suggest: {generateSuggestedCode(biz.companyName)}
                  </button>
                )}
              </div>
              <button
                onClick={handleApprove}
                disabled={actionLoading || !partnerCode.trim()}
                className="w-full flex items-center justify-center px-5 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Processing...</>
                ) : (
                  <><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Approve & Assign Code</>
                )}
              </button>
            </div>
          </div>

          {/* Reject */}
          <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-4">Reject Application</h2>
            {isRejected ? (
              <p className="text-sm text-red-600">This application is already rejected. You can edit details and move it back to review.</p>
            ) : !showRejectConfirm ? (
              <div className="flex items-center justify-center h-[calc(100%-2rem)]">
                <button
                  onClick={() => setShowRejectConfirm(true)}
                  className="w-full flex items-center justify-center px-5 py-3 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Reject Application
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="rejectionReason" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Reason <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-400 focus:ring-0 transition-colors text-sm"
                    placeholder="Reason sent to applicant via email..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectConfirm(false)}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── List View ──
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Business Partner Applications</h1>
        <p className="text-gray-500 mt-1">Review, approve or reject pending business partner registrations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">In Review</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{applications.filter(a => a.status === 'awaiting_partner_approval').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{applications.filter(a => a.status === 'rejected').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{applications.length}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm ${statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>All</button>
        <button onClick={() => setStatusFilter('awaiting_partner_approval')} className={`px-3 py-1.5 rounded-lg text-sm ${statusFilter === 'awaiting_partner_approval' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'}`}>In Review</button>
        <button onClick={() => setStatusFilter('rejected')} className={`px-3 py-1.5 rounded-lg text-sm ${statusFilter === 'rejected' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>Rejected</button>
      </div>

      {applications.filter(a => statusFilter === 'all' || a.status === statusFilter).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">All caught up</h3>
          <p className="text-gray-500 text-sm">No business partner applications found for this filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Company</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Contact</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Activity</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden lg:table-cell">Specialty</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden lg:table-cell">Submitted</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications
                  .filter(user => statusFilter === 'all' || user.status === statusFilter)
                  .map(user => {
                  const biz = getBusinessMeta(user)
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openReview(user)}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{biz.companyName || '—'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{biz.businessAddress || ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pt-turquoise/10 text-pt-turquoise-700">
                          {ACTIVITY_LABELS[biz.primaryBusinessActivity || ''] || biz.primaryBusinessActivity || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-gray-700">
                        {biz.primarySpecialty || '—'}
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-gray-500 text-xs">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {user.status === 'rejected' ? 'Rejected' : 'In Review'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); openReview(user) }}
                          className="inline-flex items-center px-4 py-2 bg-pt-turquoise text-white text-sm font-semibold rounded-lg hover:bg-pt-turquoise-600 transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pt-turquoise/30"
      />
    </label>
  )
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<[string, string]>
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pt-turquoise/30 bg-white"
      >
        <option value="">Select an option</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

export default withAuth(BusinessPartnersPage, ['admin', 'pt_admin'])
