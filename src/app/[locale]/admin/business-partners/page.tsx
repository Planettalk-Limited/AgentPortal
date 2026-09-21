'use client'

import { useState, useEffect, useMemo } from 'react'
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

// Retained for records captured before the field was removed from the signup form.
const INTERACTION_LABELS: Record<string, string> = {
  sit_down_table_service: 'Sit-down / Table Service',
  grab_and_go: 'Grab-and-go / Over the counter',
  appointment_based: 'Appointment based',
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

function isBusinessPartner(user: User): boolean {
  return (user.metadata as Record<string, any> | undefined)?.partnerType === 'business'
}

function agentIdFor(user: User): string | null {
  const agents = (user as any).agents
  return Array.isArray(agents) && agents.length ? agents[0].id : null
}

function agentCodeFor(user: User): string | null {
  const agents = (user as any).agents
  return Array.isArray(agents) && agents.length ? agents[0].agentCode : null
}

function BusinessPartnersPage() {
  const [partners, setPartners] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Assigning a custom partner code is the only write left on this page.
  const [customCode, setCustomCode] = useState('')
  const [savingCode, setSavingCode] = useState(false)

  useEffect(() => {
    loadPartners()
  }, [])

  const loadPartners = async () => {
    setLoading(true)
    try {
      // Business partners are ordinary agents now, so they come from the standard
      // user listing rather than a dedicated approval queue.
      const response = await api.admin.getUsers({ role: 'agent', limit: 500 })
      // The endpoint returns { users: [...] }, not the generic { data: [...] } -
      // admin/users/page.tsx unwraps it the same way.
      const rows: User[] = (response as any).users || response.data || []
      setPartners(rows.filter(isBusinessPartner))
    } catch (err: any) {
      setToast({ message: err?.message || 'Failed to load business partners', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return partners
    return partners.filter((u) => {
      const biz = getBusinessMeta(u)
      return (
        u.email.toLowerCase().includes(q) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        (biz.companyName || '').toLowerCase().includes(q)
      )
    })
  }, [partners, search])

  const handleChangeCode = async () => {
    if (!selectedUser) return
    const code = customCode.trim()
    if (code.length < 3 || code.length > 40 || !PARTNER_CODE_REGEX.test(code)) {
      setToast({
        message:
          'Code must be 3–40 characters, start with a letter or digit, and use only letters, digits, _ or -.',
        type: 'error',
      })
      return
    }
    const agentId = agentIdFor(selectedUser)
    if (!agentId) {
      setToast({ message: 'This partner has no agent profile yet.', type: 'error' })
      return
    }

    setSavingCode(true)
    try {
      await api.admin.changeAgentCode(agentId, code)
      setToast({
        message: `Partner code changed to "${code.toUpperCase()}". Their previous code no longer works.`,
        type: 'success',
      })
      setCustomCode('')
      await loadPartners()
      setSelectedUser(null)
    } catch (err: any) {
      setToast({ message: err?.message || 'Failed to change partner code', type: 'error' })
    } finally {
      setSavingCode(false)
    }
  }

  if (selectedUser) {
    const biz = getBusinessMeta(selectedUser)
    const currentCode = agentCodeFor(selectedUser)

    return (
      <div className="p-6 max-w-4xl mx-auto">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <button
          onClick={() => setSelectedUser(null)}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to business partners
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {biz.companyName || `${selectedUser.firstName} ${selectedUser.lastName}`}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{selectedUser.email}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <Detail label="Contact" value={`${selectedUser.firstName} ${selectedUser.lastName}`} />
            <Detail label="Phone" value={selectedUser.phoneNumber} />
            <Detail label="Country" value={selectedUser.country} />
            <Detail label="Status" value={selectedUser.status} />
            <Detail label="Partner code" value={currentCode} />
            <Detail label="Business address" value={biz.businessAddress} />
            <Detail
              label="Primary activity"
              value={
                ACTIVITY_LABELS[biz.primaryBusinessActivity || ''] || biz.primaryBusinessActivity
              }
            />
            <Detail label="Primary specialty" value={biz.primarySpecialty} />
            {biz.customerInteractionType && (
              <Detail
                label="Customer interaction"
                value={
                  INTERACTION_LABELS[biz.customerInteractionType] || biz.customerInteractionType
                }
              />
            )}
            <Detail
              label="Sells international goods"
              value={
                biz.sellsInternationalGoods === undefined
                  ? null
                  : biz.sellsInternationalGoods
                    ? 'Yes'
                    : 'No'
              }
            />
            <Detail label="Company registration number" value={biz.companyRegistrationNumber} />
            <Detail label="Region" value={biz.region} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900">Assign a custom partner code</h2>
          <p className="text-sm text-gray-600 mt-1">
            Partners are issued a generic{' '}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">PTA</code> code automatically.
            Use this only when a partner has asked for a branded one.
          </p>
          <div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-400 text-sm text-amber-800">
            Their current code{currentCode ? ` (${currentCode})` : ''} stops working immediately.
            Anything already printed or shared with it will no longer resolve.
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="e.g. AFRO_FOODS_MCR"
              maxLength={40}
              className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-pt-turquoise focus:ring-0"
            />
            <button
              onClick={handleChangeCode}
              disabled={savingCode || !customCode.trim()}
              className="px-6 py-2.5 bg-pt-turquoise text-white rounded-lg font-semibold disabled:opacity-40 hover:bg-pt-turquoise/90 transition-colors"
            >
              {savingCode ? 'Saving…' : 'Change code'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Business Partners</h1>
        <p className="text-sm text-gray-600 mt-1">
          Business partners activate automatically once they verify their email. There is nothing to
          approve here — this is a directory of who has registered.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company, name or email"
          className="flex-1 max-w-md px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pt-turquoise focus:ring-0"
        />
        <span className="text-sm text-gray-500">
          {visible.length} partner{visible.length === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-gray-500">No business partners found.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Activity</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((user) => {
                const biz = getBusinessMeta(user)
                return (
                  <tr
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user)
                      setCustomCode('')
                    }}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{biz.companyName || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {ACTIVITY_LABELS[biz.primaryBusinessActivity || ''] ||
                        biz.primaryBusinessActivity ||
                        '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {agentCodeFor(user) || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-gray-100 text-gray-700',
    awaiting_partner_approval: 'bg-amber-100 text-amber-800',
    rejected: 'bg-red-100 text-red-800',
    inactive: 'bg-gray-100 text-gray-600',
    suspended: 'bg-red-100 text-red-800',
  }
  // awaiting_partner_approval is no longer reachable; anyone still in it predates
  // the removal of the approval gate and is cleared by the backfill script.
  const labels: Record<string, string> = {
    awaiting_partner_approval: 'Awaiting (legacy)',
  }
  return (
    <span
      className={`px-2 py-1 rounded-md text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}
    >
      {labels[status] || status}
    </span>
  )
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
    </div>
  )
}

export default withAuth(BusinessPartnersPage, ['admin', 'pt_admin'])
