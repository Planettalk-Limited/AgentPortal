/**
 * Parses the admin bulk earnings CSV into rows for `api.admin.bulkUploadAgentData`.
 *
 * Earlier parsing split lines on "," and turned anything unreadable into 0, so a blank
 * or oddly formatted Total Earnings column was uploaded as 0 for every partner and
 * wiped their totals (4 Nov 2026). This parser never invents a 0: a required cell that
 * is blank or unreadable becomes a problem the admin must fix before anything is sent.
 */

export interface EarningsCsvRow {
  agentCode: string
  totalEarnings: number
  earningsForCurrentMonth: number
  totalReferrals?: number
  referralsForCurrentMonth?: number
  totalReferralBonusIncome?: number
  referralBonusIncomeForCurrentMonth?: number
  availableBalance?: number
  totalPayoutAmount?: number
}

export interface EarningsCsvResult {
  rows: EarningsCsvRow[]
  /** File-level or row-level problems. When non-empty, nothing should be uploaded. */
  problems: string[]
}

/** RFC 4180-style parsing: quoted fields may contain commas, quotes ("") and newlines. */
export function parseCsvRecords(text: string): string[][] {
  const records: string[][] = []
  let record: string[] = []
  let field = ''
  let inQuotes = false
  const src = text.replace(/^﻿/, '')

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      record.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      record.push(field)
      records.push(record)
      record = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || record.length > 0) {
    record.push(field)
    records.push(record)
  }
  return records.map(r => r.map(c => c.trim())).filter(r => r.some(c => c !== ''))
}

type Parsed = { kind: 'blank' } | { kind: 'bad'; raw: string } | { kind: 'ok'; value: number }

/** Accepts "1,234.50", "$12.50", "USD 12.50", "R 45", "(5.00)". Blank stays blank. */
export function parseAmount(raw: string | undefined): Parsed {
  const s = (raw ?? '').trim()
  if (s === '' || s === '-') return { kind: 'blank' }
  const negative = /^\(.*\)$/.test(s) || s.startsWith('-')
  const cleaned = s.replace(/[()\s]/g, '').replace(/^-/, '').replace(/^[^\d.]+/, '').replace(/,/g, '')
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(cleaned)) return { kind: 'bad', raw: s }
  const value = Number(cleaned)
  return { kind: 'ok', value: negative ? -value : value }
}

const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

type FieldKey = Exclude<keyof EarningsCsvRow, 'agentCode'> | 'agentCode'

interface ColumnSpec {
  key: FieldKey
  label: string
  required: boolean
  integer?: boolean
  /** Normalized header names matched exactly, tried before `fuzzy`. */
  exact: string[]
  fuzzy: (h: string) => boolean
}

const isMonth = (h: string) => h.includes('current') && h.includes('month')
const isBonus = (h: string) => h.includes('bonus')

const COLUMNS: ColumnSpec[] = [
  {
    key: 'agentCode', label: 'Agent Code', required: true,
    exact: ['agent_code', 'partner_code', 'code'],
    fuzzy: h => (h.includes('agent') || h.includes('partner')) && h.includes('code'),
  },
  {
    key: 'totalEarnings', label: 'Total Earnings', required: true,
    exact: ['total_earnings'],
    fuzzy: h => h.includes('total') && h.includes('earning') && !isMonth(h) && !h.includes('referral') && !isBonus(h),
  },
  {
    key: 'earningsForCurrentMonth', label: 'Earnings for Current Month', required: true,
    exact: ['earnings_for_current_month', 'current_month_earnings'],
    fuzzy: h => isMonth(h) && h.includes('earning') && !h.includes('referral') && !isBonus(h),
  },
  {
    key: 'totalReferralBonusIncome', label: 'Total Referral Bonus Income', required: false,
    exact: ['total_referral_bonus_income'],
    fuzzy: h => h.includes('referral') && isBonus(h) && !isMonth(h),
  },
  {
    key: 'referralBonusIncomeForCurrentMonth', label: 'Referral Bonus Income for Current Month', required: false,
    exact: ['referral_bonus_income_for_current_month'],
    fuzzy: h => isMonth(h) && h.includes('referral') && isBonus(h),
  },
  {
    key: 'totalReferrals', label: 'Total Referrals', required: false, integer: true,
    exact: ['total_referrals'],
    fuzzy: h => h.includes('total') && h.includes('referral') && !isBonus(h) && !isMonth(h),
  },
  {
    key: 'referralsForCurrentMonth', label: 'Referrals for Current Month', required: false, integer: true,
    exact: ['referrals_for_current_month', 'current_month_referrals'],
    fuzzy: h => isMonth(h) && h.includes('referral') && !isBonus(h),
  },
  {
    key: 'availableBalance', label: 'Available Balance', required: false,
    exact: ['available_balance'],
    fuzzy: h => h.includes('available') || h.includes('balance'),
  },
  {
    key: 'totalPayoutAmount', label: 'Total Payout Amount', required: false,
    exact: ['total_payout_amount', 'total_payouts'],
    fuzzy: h => h.includes('payout'),
  },
]

function resolveColumns(headers: string[], problems: string[]): Partial<Record<FieldKey, number>> {
  const normalized = headers.map(normalizeHeader)
  const taken = new Set<number>()
  const result: Partial<Record<FieldKey, number>> = {}

  // Exact names first so a fuzzy match can never steal a column that is named precisely.
  for (const spec of COLUMNS) {
    const idx = normalized.findIndex((h, i) => !taken.has(i) && spec.exact.includes(h))
    if (idx !== -1) {
      result[spec.key] = idx
      taken.add(idx)
    }
  }
  for (const spec of COLUMNS) {
    if (result[spec.key] !== undefined) continue
    const matches = normalized.map((h, i) => (!taken.has(i) && spec.fuzzy(h) ? i : -1)).filter(i => i !== -1)
    if (matches.length > 1) {
      problems.push(
        `More than one column could be "${spec.label}": ${matches.map(i => `"${headers[i]}"`).join(', ')}. Rename the correct one to "${spec.label}".`,
      )
      continue
    }
    if (matches.length === 1) {
      result[spec.key] = matches[0]
      taken.add(matches[0])
    }
  }
  for (const spec of COLUMNS) {
    if (spec.required && result[spec.key] === undefined && !problems.some(p => p.includes(`"${spec.label}"`))) {
      problems.push(`Missing required column "${spec.label}".`)
    }
  }
  return result
}

export function parseEarningsCsv(text: string): EarningsCsvResult {
  const problems: string[] = []
  const records = parseCsvRecords(text)
  if (records.length < 2) return { rows: [], problems: ['The file has no data rows.'] }

  const [headers, ...data] = records
  const cols = resolveColumns(headers, problems)
  if (problems.length > 0) return { rows: [], problems }

  const rows: EarningsCsvRow[] = []
  data.forEach((cells, i) => {
    const line = i + 2 // 1-based, after the header row
    const agentCode = cells[cols.agentCode!] ?? ''
    const where = `Row ${line}${agentCode ? ` (${agentCode})` : ''}`
    if (!agentCode) {
      problems.push(`${where}: Agent Code is blank.`)
      return
    }

    const row: Partial<EarningsCsvRow> = { agentCode }
    let rowOk = true
    for (const spec of COLUMNS) {
      if (spec.key === 'agentCode') continue
      const idx = cols[spec.key]
      if (idx === undefined) continue
      const parsed = parseAmount(cells[idx])
      if (parsed.kind === 'blank') {
        if (spec.required) {
          problems.push(`${where}: "${spec.label}" is blank. Enter 0 if the partner genuinely has none.`)
          rowOk = false
        }
        continue
      }
      if (parsed.kind === 'bad') {
        problems.push(`${where}: "${spec.label}" value "${parsed.raw}" is not a number.`)
        rowOk = false
        continue
      }
      if (parsed.value < 0) {
        problems.push(`${where}: "${spec.label}" is negative (${parsed.value}).`)
        rowOk = false
        continue
      }
      ;(row as Record<string, unknown>)[spec.key] = spec.integer ? Math.round(parsed.value) : Math.round(parsed.value * 100) / 100
    }
    if (!rowOk) return

    if (row.totalEarnings! < row.earningsForCurrentMonth!) {
      problems.push(
        `${where}: Total Earnings (${row.totalEarnings}) is less than Earnings for Current Month (${row.earningsForCurrentMonth}).`,
      )
      return
    }
    rows.push(row as EarningsCsvRow)
  })

  if (rows.length === 0 && problems.length === 0) problems.push('The file has no data rows.')
  return { rows, problems }
}
