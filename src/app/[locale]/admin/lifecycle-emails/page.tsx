'use client'

import { useState, useEffect } from 'react'
import { api, LifecycleEmailStats, LifecycleRunReport } from '@/lib/api'
import { withAuth } from '@/contexts/AuthContext'
import Toast from '@/components/Toast'

const SEGMENT_LABELS: Record<string, string> = {
  onboarding: 'Onboarding',
  referral_milestone: 'Referral milestones',
  earnings: 'Earnings',
  previously_active: 'Previously active',
  active: 'Active',
  inactive: 'Inactive re-engagement',
  internal: 'Partner team alerts',
}

const OUTCOME_LABELS: Record<string, string> = {
  would_send: 'Would send',
  deferred_daily_cap: 'Next day (1 email/day cap)',
  blocked_draft_copy: 'Held: draft copy',
  blocked_allowlist: 'Held: not on allowlist',
}

const pct = (v: number | null) => (v === null ? '—' : `${v}%`)

/**
 * Read-only view of the automated partner lifecycle emails: how each email and
 * segment performs, and a dry run of what today's scheduled pass would send.
 */
function LifecycleEmailsPage() {
  const [stats, setStats] = useState<LifecycleEmailStats | null>(null)
  const [preview, setPreview] = useState<LifecycleRunReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewing, setPreviewing] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      setStats(await api.admin.getLifecycleEmailStats({ from: from || undefined, to: to || undefined }))
    } catch (err: any) {
      setToast({ message: err?.message || 'Failed to load lifecycle email stats', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const runPreview = async () => {
    setPreviewing(true)
    try {
      setPreview(await api.admin.previewLifecycleEmails())
    } catch (err: any) {
      setToast({ message: err?.message || 'Failed to preview', type: 'error' })
    } finally {
      setPreviewing(false)
    }
  }

  if (loading && !stats) {
    return <div className="p-6 text-gray-500">Loading lifecycle emails…</div>
  }
  if (!stats) {
    return <div className="p-6 text-gray-500">No data.</div>
  }

  const segments = Object.entries(stats.segments)

  return (
    <div className="p-6 max-w-6xl">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lifecycle Emails</h1>
        <p className="text-sm text-gray-600 mt-1">
          Automated partner emails sent by the daily run: onboarding, milestones, earnings and
          re-engagement.
        </p>
      </div>

      {/* Audience */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          ['Partners tracked', stats.audience.partnersTracked],
          ['In inactive track', stats.audience.inInactiveTrack],
          ['Quiet list', stats.audience.quietList],
          ['Unsubscribed', stats.audience.unsubscribed],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{(value as number).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Range filter */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="text-sm text-gray-600">
          Sent from
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="block mt-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
        </label>
        <label className="text-sm text-gray-600">
          to (exclusive)
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="block mt-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
        </label>
        <button onClick={load} className="px-3 py-2 text-sm font-semibold rounded-lg bg-pt-turquoise text-white hover:bg-pt-turquoise/90">
          Apply
        </button>
      </div>

      {/* Segments */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-x-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">By segment</h2>
        </div>
        {segments.length === 0 ? (
          <p className="px-6 py-4 text-sm text-gray-500">No lifecycle emails sent yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-6 py-2.5 font-semibold">Segment</th>
                <th className="px-4 py-2.5 font-semibold text-right">Sent</th>
                <th className="px-4 py-2.5 font-semibold text-right">Open rate</th>
                <th className="px-4 py-2.5 font-semibold text-right">Click rate</th>
                <th className="px-4 py-2.5 font-semibold text-right">Converted</th>
                <th className="px-6 py-2.5 font-semibold">Conversion means</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {segments.map(([key, s]) => (
                <tr key={key}>
                  <td className="px-6 py-3 font-medium text-gray-900">{SEGMENT_LABELS[key] || key}</td>
                  <td className="px-4 py-3 text-right">{s.sent}</td>
                  <td className="px-4 py-3 text-right">{pct(s.openRate)}</td>
                  <td className="px-4 py-3 text-right">{pct(s.clickRate)}</td>
                  <td className="px-4 py-3 text-right">
                    {s.converted} <span className="text-gray-400">({pct(s.conversionRate)})</span>
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-500">{s.conversionDefinition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Templates */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-x-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">By email</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-6 py-2.5 font-semibold">Email</th>
              <th className="px-4 py-2.5 font-semibold text-right">Sent</th>
              <th className="px-4 py-2.5 font-semibold text-right">Opened</th>
              <th className="px-4 py-2.5 font-semibold text-right">Clicked</th>
              <th className="px-4 py-2.5 font-semibold text-right">Converted</th>
              <th className="px-4 py-2.5 font-semibold text-right">Unsub.</th>
              <th className="px-4 py-2.5 font-semibold text-right">Failed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.templates.map((t) => (
              <tr key={t.templateKey}>
                <td className="px-6 py-3">
                  <div className="font-medium text-gray-900">{t.subject}</div>
                  <div className="text-xs text-gray-500 font-mono">
                    {t.templateKey} · {SEGMENT_LABELS[t.segment] || t.segment}
                    {t.simulated > 0 && ` · ${t.simulated} simulated`}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{t.sent}</td>
                <td className="px-4 py-3 text-right">{t.opened} <span className="text-gray-400">({pct(t.openRate)})</span></td>
                <td className="px-4 py-3 text-right">{t.clicked} <span className="text-gray-400">({pct(t.clickRate)})</span></td>
                <td className="px-4 py-3 text-right">{t.converted}</td>
                <td className="px-4 py-3 text-right">{t.unsubscribed}</td>
                <td className="px-4 py-3 text-right">{t.failed}</td>
              </tr>
            ))}
            {stats.templates.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-gray-500">No lifecycle emails sent yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dry run */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-x-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Today&apos;s run (dry run)</h2>
            <p className="text-sm text-gray-600 mt-1">Who would get which email if the daily run happened now. Nothing is sent.</p>
          </div>
          <button
            onClick={runPreview}
            disabled={previewing}
            className="px-3 py-2 text-sm font-semibold rounded-lg bg-pt-turquoise text-white disabled:opacity-40 hover:bg-pt-turquoise/90 whitespace-nowrap"
          >
            {previewing ? 'Checking…' : 'Preview today'}
          </button>
        </div>
        {preview && (
          <>
            <p className="px-6 py-3 text-sm text-gray-600">
              {preview.partnersEvaluated} partners evaluated · {preview.emails.length} emails due ·{' '}
              {preview.transitions.enteredQuiet.length} would move to the quiet list ·{' '}
              {preview.transitions.welcomeBack.length} welcome back
            </p>
            {preview.emails.length > 0 && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-6 py-2.5 font-semibold">Partner</th>
                    <th className="px-6 py-2.5 font-semibold">Email</th>
                    <th className="px-6 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.emails.map((e) => (
                    <tr key={`${e.agentId}-${e.dedupeKey}`}>
                      <td className="px-6 py-3">
                        <div className="font-medium text-gray-900">{e.partnerName}</div>
                        <div className="text-xs text-gray-500">{e.agentCode} · {e.email}</div>
                      </td>
                      <td className="px-6 py-3 text-gray-700">{e.subject}</td>
                      <td className="px-6 py-3 text-xs text-gray-600">{OUTCOME_LABELS[e.outcome] || e.outcome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      <ul className="text-xs text-gray-500 space-y-1 list-disc pl-5">
        {stats.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  )
}

export default withAuth(LifecycleEmailsPage, ['admin', 'pt_admin'])
