'use client'

import { useState, useEffect } from 'react'
import { api, PartnerHealth, StuckPartner, DeadCodePartner } from '@/lib/api'
import { withAuth } from '@/contexts/AuthContext'
import Toast from '@/components/Toast'

/**
 * Removing admin review also removed the page admins watched partners on, so the
 * states that are now anomalies became invisible. Each section here is a way an
 * account can be stuck and never recover on its own.
 */
function PartnerHealthPage() {
  const [health, setHealth] = useState<PartnerHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      setHealth(await api.admin.getPartnerHealth())
    } catch (err: any) {
      setToast({ message: err?.message || 'Failed to load partner health', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const reactivate = async (partner: DeadCodePartner) => {
    setRestoring(partner.id)
    try {
      await api.admin.reactivateAgent(
        partner.agentId,
        'Code was not resolving — agent left in a non-active status',
      )
      setToast({
        message: `${partner.agentCode} is live again. Referrals using it will now resolve.`,
        type: 'success',
      })
      await load()
    } catch (err: any) {
      setToast({ message: err?.message || 'Failed to reactivate agent', type: 'error' })
    } finally {
      setRestoring(null)
    }
  }

  const restore = async (partner: StuckPartner) => {
    setRestoring(partner.id)
    try {
      const result = await api.admin.restoreBusinessPartner(partner.id)
      setToast({
        message:
          result.status === 'active'
            ? `${partner.email} is active again with code ${result.agentCode}. Their welcome email is on its way.`
            : `${partner.email} has been restored to pending — they activate once they verify their email.`,
        type: 'success',
      })
      await load()
    } catch (err: any) {
      setToast({ message: err?.message || 'Failed to restore partner', type: 'error' })
    } finally {
      setRestoring(null)
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Loading partner health…</div>
  }

  if (!health) {
    return <div className="p-6 text-gray-500">No data.</div>
  }

  const { codePool, counts } = health
  const allClear =
    counts.deadCode === 0 &&
    counts.missingProfile === 0 &&
    counts.awaitingApproval === 0 &&
    counts.rejected === 0

  return (
    <div className="p-6 max-w-6xl">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Partner Health</h1>
        <p className="text-sm text-gray-600 mt-1">
          Accounts in a state that will not resolve on its own, and how much of the partner code
          pool is left.
        </p>
      </div>

      {/* Code pool */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Partner code pool</h2>
          <span className="text-sm text-gray-500 font-mono">
            {codePool.prefix}
            {String(codePool.min).padStart(4, '0')}–{codePool.prefix}
            {codePool.max}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all ${
              codePool.percentUsed > 90
                ? 'bg-red-500'
                : codePool.percentUsed > 70
                  ? 'bg-amber-500'
                  : 'bg-pt-turquoise'
            }`}
            style={{ width: `${Math.max(codePool.percentUsed, 0.5)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-gray-700">
            <strong>{codePool.used.toLocaleString()}</strong> used ·{' '}
            <strong>{codePool.available.toLocaleString()}</strong> available
          </span>
          <span className="text-gray-500">
            {codePool.percentUsed}% · highest {codePool.highestAssigned || '—'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Every partner takes a code at registration, including ones who never verify their email.
          Exhausting the range makes registration fail outright.
        </p>
      </div>

      {allClear && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-green-800">Nothing needs attention</p>
          <p className="text-sm text-green-700 mt-1">
            No dead codes, no missing profiles, nobody stuck awaiting approval or locked out by a
            rejection.
          </p>
        </div>
      )}

      {counts.deadCode > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-200 bg-red-50 text-red-800">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Code not working</h2>
              <span className="px-2 py-0.5 rounded-md bg-white/70 text-sm font-bold">
                {counts.deadCode}
              </span>
            </div>
            <p className="text-sm mt-1.5 opacity-90">
              These partners are active and verified, and their dashboard shows a code — but the
              agent profile behind it is not active, so every referral that uses it is turned away
              with &quot;This agent is not currently active&quot;. The partner is never told, and
              someone whose code is refused does not report it, so this can sit for months.
            </p>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-6 py-2.5 font-semibold">Partner</th>
                <th className="px-6 py-2.5 font-semibold">Code</th>
                <th className="px-6 py-2.5 font-semibold">Agent status</th>
                <th className="px-6 py-2.5 font-semibold">Since</th>
                <th className="px-6 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {health.deadCode.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">
                      {p.companyName || `${p.firstName} ${p.lastName}`}
                    </div>
                    <div className="text-xs text-gray-500">{p.email}</div>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-gray-900">{p.agentCode}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                      {p.agentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => reactivate(p)}
                      disabled={restoring === p.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-pt-turquoise text-white disabled:opacity-40 hover:bg-pt-turquoise/90 transition-colors"
                    >
                      {restoring === p.id ? 'Activating…' : 'Activate code'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Section
        title="No partner profile"
        count={counts.missingProfile}
        tone="red"
        explanation="These accounts can log in, but /agents/me returns 404 so the dashboard shows 'Unable to Load Dashboard'. They have no code and cannot earn. Fix with the backfill script."
        remedy="npx ts-node src/scripts/backfill-missing-agent-profiles.ts --include-pending --apply"
        partners={health.missingProfile}
      />

      <Section
        title="Awaiting approval (legacy)"
        count={counts.awaitingApproval}
        tone="amber"
        explanation="A dead end. Admin review no longer exists, so nothing transitions these accounts out — login refuses them and their token is rejected. They verified their email and are waiting on a step that will never come."
        remedy="npx ts-node src/scripts/backfill-missing-agent-profiles.ts --include-pending --apply"
        partners={health.awaitingApproval}
      />

      <Section
        title="Rejected (legacy)"
        count={counts.rejected}
        tone="gray"
        explanation="Rejected under the old rules, which no longer exist. They are locked out and hold no code. Restoring mints their profile, clears the rejection, and activates them if their email is verified. This reverses a deliberate past decision, so it is one-at-a-time and manual."
        partners={health.rejected}
        action={{ label: 'Restore', onClick: restore, busyId: restoring }}
      />

      <div className="mt-8 text-sm text-gray-500">
        <strong className="text-gray-700">{counts.unverified.toLocaleString()}</strong> partners are
        pending email verification. That is normal — they activate themselves as soon as they enter
        their code.
      </div>
    </div>
  )
}

function Section({
  title,
  count,
  tone,
  explanation,
  remedy,
  partners,
  action,
}: {
  title: string
  count: number
  tone: 'red' | 'amber' | 'gray'
  explanation: string
  remedy?: string
  partners: StuckPartner[]
  action?: {
    label: string
    onClick: (p: StuckPartner) => void
    busyId: string | null
  }
}) {
  if (count === 0) return null

  const tones = {
    red: 'border-red-200 bg-red-50 text-red-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    gray: 'border-gray-200 bg-gray-50 text-gray-800',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
      <div className={`px-6 py-4 border-b ${tones[tone]}`}>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="px-2 py-0.5 rounded-md bg-white/70 text-sm font-bold">{count}</span>
        </div>
        <p className="text-sm mt-1.5 opacity-90">{explanation}</p>
        {remedy && (
          <code className="block mt-2 text-xs bg-white/70 rounded px-2 py-1.5 font-mono overflow-x-auto">
            {remedy}
          </code>
        )}
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            <th className="px-6 py-2.5 font-semibold">Partner</th>
            <th className="px-6 py-2.5 font-semibold">Type</th>
            <th className="px-6 py-2.5 font-semibold">Email verified</th>
            <th className="px-6 py-2.5 font-semibold">Registered</th>
            {action && <th className="px-6 py-2.5" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {partners.map((p) => (
            <tr key={p.id}>
              <td className="px-6 py-3">
                <div className="font-medium text-gray-900">
                  {p.companyName || `${p.firstName} ${p.lastName}`}
                </div>
                <div className="text-xs text-gray-500">{p.email}</div>
              </td>
              <td className="px-6 py-3 text-gray-700">
                {p.partnerType === 'business' ? 'Business' : 'Individual'}
              </td>
              <td className="px-6 py-3">
                {p.emailVerified ? (
                  <span className="text-green-700">Yes</span>
                ) : (
                  <span className="text-gray-400">No</span>
                )}
              </td>
              <td className="px-6 py-3 text-gray-600">
                {new Date(p.createdAt).toLocaleDateString()}
              </td>
              {action && (
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => action.onClick(p)}
                    disabled={action.busyId === p.id}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-pt-turquoise text-white disabled:opacity-40 hover:bg-pt-turquoise/90 transition-colors"
                  >
                    {action.busyId === p.id ? 'Restoring…' : action.label}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default withAuth(PartnerHealthPage, ['admin', 'pt_admin'])
