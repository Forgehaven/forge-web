import { useState, useMemo } from 'react'

// ── Parse helpers ─────────────────────────────────────────────────────────────

function expandField(expr: string, min: number, max: number): Set<number> | null {
  const result = new Set<number>()
  if (expr === '*') {
    for (let i = min; i <= max; i++) result.add(i)
    return result
  }
  for (const part of expr.split(',')) {
    if (part.startsWith('*/')) {
      const step = parseInt(part.slice(2))
      if (isNaN(step) || step < 1) return null
      for (let i = min; i <= max; i += step) result.add(i)
    } else if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number)
      if (isNaN(a) || isNaN(b) || a < min || b > max || a > b) return null
      for (let i = a; i <= b; i++) result.add(i)
    } else {
      const n = parseInt(part)
      if (isNaN(n) || n < min || n > max) return null
      result.add(n)
    }
  }
  return result
}

function describeField(expr: string, singular: string, plural: string, labels?: string[], offset = 0): string {
  if (expr === '*') return `every ${singular}`
  if (expr.startsWith('*/')) return `every ${expr.slice(2)} ${plural}`
  if (expr.includes(',')) {
    const vals = expr.split(',').map(v => labels ? labels[parseInt(v) - offset] ?? v : v)
    return vals.join(', ')
  }
  if (expr.includes('-')) {
    const [a, b] = expr.split('-')
    const la = labels ? labels[parseInt(a) - offset] ?? a : a
    const lb = labels ? labels[parseInt(b) - offset] ?? b : b
    return `${la}–${lb}`
  }
  const n = parseInt(expr)
  return labels ? (labels[n - offset] ?? expr) : expr
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DOW_LABELS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function humanReadable(parts: string[]): string {
  const [min, hr, dom, mon, dow] = parts
  const chunks: string[] = []

  if (min === '0' && hr === '0') chunks.push('at midnight')
  else if (min === '0' && hr === '12') chunks.push('at noon')
  else {
    const m = describeField(min, 'minute', 'minutes')
    const h = describeField(hr, 'hour', 'hours')
    if (hr === '*' && min === '*') chunks.push('every minute')
    else if (hr === '*') chunks.push(`at minute ${m} of every hour`)
    else if (min === '0') chunks.push(`at ${h}:00`)
    else chunks.push(`at ${h}:${min.padStart(2,'0')}`)
  }

  if (dom !== '*') chunks.push(`on day ${describeField(dom, 'day', 'days')} of the month`)
  if (mon !== '*') chunks.push(`in ${describeField(mon, 'month', 'months', MONTH_LABELS, 1)}`)
  if (dow !== '*') chunks.push(`on ${describeField(dow, 'day', 'days', DOW_LABELS, 0)}`)

  return chunks.join(', ')
}

function getNextRuns(parts: string[], count = 5): Date[] {
  const [minExpr, hrExpr, domExpr, monExpr, dowExpr] = parts
  const minutes = expandField(minExpr, 0, 59)
  const hours   = expandField(hrExpr,  0, 23)
  const doms    = expandField(domExpr, 1, 31)
  const months  = expandField(monExpr, 1, 12)
  const dows    = expandField(dowExpr, 0, 6)
  if (!minutes || !hours || !doms || !months || !dows) return []

  const results: Date[] = []
  const cur = new Date()
  cur.setSeconds(0, 0)
  cur.setMinutes(cur.getMinutes() + 1)
  const limit = new Date(cur)
  limit.setFullYear(limit.getFullYear() + 2)

  while (cur < limit && results.length < count) {
    if (
      months.has(cur.getMonth() + 1) &&
      doms.has(cur.getDate()) &&
      dows.has(cur.getDay()) &&
      hours.has(cur.getHours()) &&
      minutes.has(cur.getMinutes())
    ) results.push(new Date(cur))
    cur.setMinutes(cur.getMinutes() + 1)
  }
  return results
}

// ── Builder types ─────────────────────────────────────────────────────────────

type BuildMode = 'every' | 'step' | 'list' | 'range'

interface FieldState {
  mode: BuildMode
  step: string
  list: string
  from: string
  to: string
}

interface FieldMeta {
  label: string
  min: number
  max: number
  unit: string
  names: string[] | null
}

const FIELD_META: FieldMeta[] = [
  { label: 'Minute',  min: 0, max: 59, unit: 'minute',  names: null },
  { label: 'Hour',    min: 0, max: 23, unit: 'hour',    names: null },
  { label: 'Day',     min: 1, max: 31, unit: 'day',     names: null },
  { label: 'Month',   min: 1, max: 12, unit: 'month',   names: MONTH_LABELS },
  { label: 'Weekday', min: 0, max: 6,  unit: 'weekday', names: DOW_LABELS },
]

function defaultField(min: number): FieldState {
  return { mode: 'every', step: '2', list: String(min), from: String(min), to: String(min) }
}

function fieldToExpr(f: FieldState): string {
  switch (f.mode) {
    case 'every': return '*'
    case 'step':  return `*/${f.step || '1'}`
    case 'list':  return f.list || '*'
    case 'range': return `${f.from}-${f.to}`
  }
}

function exprToField(expr: string, min: number): FieldState {
  const base = defaultField(min)
  if (expr === '*') return base
  if (/^\*\/\d+$/.test(expr)) return { ...base, mode: 'step', step: expr.slice(2) }
  if (/^\d+-\d+$/.test(expr)) {
    const [from, to] = expr.split('-')
    return { ...base, mode: 'range', from, to }
  }
  return { ...base, mode: 'list', list: expr }
}

const INIT_EXPR = '0 9 * * 1-5'

// ── FieldRow ──────────────────────────────────────────────────────────────────

function FieldRow({ meta, field, onChange }: {
  meta: FieldMeta
  field: FieldState
  onChange: (f: FieldState) => void
}) {
  const numInput = (value: string, key: keyof FieldState) => (
    <input
      type="number"
      min={meta.min}
      max={meta.max}
      value={value}
      onChange={e => onChange({ ...field, [key]: e.target.value })}
      className="bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#c4af64] font-mono w-16"
    />
  )

  const namedSelect = (value: string, key: keyof FieldState) => (
    <select
      value={value}
      onChange={e => onChange({ ...field, [key]: e.target.value })}
      className="bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#c4af64] cursor-pointer"
    >
      {meta.names!.map((name, i) => (
        <option key={name} value={String(i + meta.min)}>{name}</option>
      ))}
    </select>
  )

  const selectedChips = new Set(field.list ? field.list.split(',').map(Number) : [])

  const toggleChip = (val: number) => {
    const next = selectedChips.has(val)
      ? [...selectedChips].filter(v => v !== val).sort((a, b) => a - b)
      : [...selectedChips, val].sort((a, b) => a - b)
    onChange({ ...field, list: next.length ? next.join(',') : String(meta.min) })
  }

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#2a2d3a] last:border-0 flex-wrap">
      <span className="text-xs text-[#6b7280] w-16 shrink-0">{meta.label}</span>

      <select
        value={field.mode}
        onChange={e => onChange({ ...field, mode: e.target.value as BuildMode })}
        className="bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#c4af64] cursor-pointer"
      >
        <option value="every">Every {meta.unit}</option>
        <option value="step">Every N {meta.unit}s</option>
        <option value="list">Specific</option>
        <option value="range">Range</option>
      </select>

      {field.mode === 'step' && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#6b7280]">every</span>
          {numInput(field.step, 'step')}
          <span className="text-xs text-[#6b7280]">{meta.unit}(s)</span>
        </div>
      )}

      {field.mode === 'list' && meta.names && (
        <div className="flex flex-wrap gap-1">
          {meta.names.map((name, i) => {
            const val = i + meta.min
            const active = selectedChips.has(val)
            return (
              <button
                key={name}
                onClick={() => toggleChip(val)}
                className={`text-xs px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#c4af64]/20 border-[#c4af64] text-[#c4af64]'
                    : 'border-[#2a2d3a] text-[#6b7280] hover:border-[#6b7280] hover:text-[#e2e4ed]'
                }`}
              >
                {name}
              </button>
            )
          })}
        </div>
      )}

      {field.mode === 'list' && !meta.names && (
        <input
          value={field.list}
          onChange={e => onChange({ ...field, list: e.target.value })}
          placeholder="e.g. 0,15,30"
          className="bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#c4af64] font-mono w-32"
        />
      )}

      {field.mode === 'range' && (
        <div className="flex items-center gap-2">
          {meta.names ? namedSelect(field.from, 'from') : numInput(field.from, 'from')}
          <span className="text-xs text-[#6b7280]">to</span>
          {meta.names ? namedSelect(field.to, 'to') : numInput(field.to, 'to')}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const EXAMPLES = [
  { label: 'Every minute',          expr: '* * * * *' },
  { label: 'Every hour',            expr: '0 * * * *' },
  { label: 'Every day at midnight', expr: '0 0 * * *' },
  { label: 'Every Monday 9am',      expr: '0 9 * * 1' },
  { label: 'Weekdays at noon',      expr: '0 12 * * 1-5' },
  { label: '1st of every month',    expr: '0 0 1 * *' },
]

export function CronParser() {
  const [tab, setTab] = useState<'parse' | 'build'>('parse')
  const [expr, setExpr] = useState(INIT_EXPR)
  const [fields, setFields] = useState<FieldState[]>(() =>
    INIT_EXPR.split(' ').map((e, i) => exprToField(e, FIELD_META[i].min))
  )

  function applyExpr(val: string) {
    setExpr(val)
    const parts = val.trim().split(/\s+/)
    if (parts.length === 5) {
      setFields(parts.map((e, i) => exprToField(e, FIELD_META[i].min)))
    }
  }

  function applyField(idx: number, field: FieldState) {
    const next = fields.map((f, i) => i === idx ? field : f)
    setFields(next)
    setExpr(next.map(fieldToExpr).join(' '))
  }

  const result = useMemo(() => {
    const parts = expr.trim().split(/\s+/)
    if (parts.length !== 5) return { error: 'Must have exactly 5 fields: minute hour day month weekday' }
    const [min, hr, dom, mon, dow] = parts
    if (!expandField(min, 0, 59)) return { error: 'Invalid minute field (0–59)' }
    if (!expandField(hr,  0, 23)) return { error: 'Invalid hour field (0–23)' }
    if (!expandField(dom, 1, 31)) return { error: 'Invalid day-of-month field (1–31)' }
    if (!expandField(mon, 1, 12)) return { error: 'Invalid month field (1–12)' }
    if (!expandField(dow, 0,  6)) return { error: 'Invalid day-of-week field (0–6)' }
    return { parts, description: humanReadable(parts), nextRuns: getNextRuns(parts) }
  }, [expr])

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded text-sm transition-colors ${
      active
        ? 'bg-[#c4af64] text-[#0f1117] font-medium'
        : 'bg-[#1a1d27] text-[#9ca3af] hover:text-[#e2e4ed] border border-[#2a2d3a]'
    }`

  const parseFields = result.parts
    ? [
        { label: 'Minute',       value: result.parts[0], range: '0–59' },
        { label: 'Hour',         value: result.parts[1], range: '0–23' },
        { label: 'Day of month', value: result.parts[2], range: '1–31' },
        { label: 'Month',        value: result.parts[3], range: '1–12' },
        { label: 'Day of week',  value: result.parts[4], range: '0–6' },
      ]
    : []

  return (
    <div className="pb-6 max-w-xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Cron Parser</h1>

      <div className="mb-3">
        <label className="block text-xs text-[#6b7280] mb-1">Expression</label>
        <input
          className="bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] font-mono w-full"
          value={expr}
          onChange={e => applyExpr(e.target.value)}
          placeholder="* * * * *"
          spellCheck={false}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {EXAMPLES.map(ex => (
          <button
            key={ex.expr}
            onClick={() => applyExpr(ex.expr)}
            className="text-xs px-2.5 py-1 rounded border border-[#2a2d3a] text-[#6b7280] hover:text-[#e2e4ed] hover:border-[#c4af64] transition-colors cursor-pointer"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('parse')} className={tabClass(tab === 'parse')}>Explain</button>
        <button onClick={() => setTab('build')} className={tabClass(tab === 'build')}>Build</button>
      </div>

      {'error' in result ? (
        <p className="text-sm text-red-400">{result.error}</p>
      ) : tab === 'parse' ? (
        <div className="flex flex-col gap-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
            <p className="text-xs text-[#6b7280] mb-1">Runs</p>
            <p className="text-[#e2e4ed]">{result.description}</p>
          </div>

          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
            <p className="text-xs text-[#6b7280] mb-3">Fields</p>
            <div className="grid grid-cols-5 gap-2">
              {parseFields.map(f => (
                <div key={f.label} className="flex flex-col gap-1">
                  <span className="text-xs text-[#6b7280]">{f.label}</span>
                  <span className="font-mono text-sm text-[#c4af64]">{f.value}</span>
                  <span className="text-xs text-[#3a3d4a]">{f.range}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
            <p className="text-xs text-[#6b7280] mb-3">Next {result.nextRuns.length} runs</p>
            {result.nextRuns.length === 0
              ? <p className="text-sm text-[#6b7280]">No runs found in the next 2 years</p>
              : <div className="flex flex-col gap-1.5">
                  {result.nextRuns.map((d, i) => (
                    <div key={i} className="font-mono text-sm text-[#e2e4ed]">
                      {d.toLocaleString(undefined, {
                        weekday: 'short', year: 'numeric', month: 'short',
                        day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      ) : (
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
          {fields.map((field, i) => (
            <FieldRow
              key={FIELD_META[i].label}
              meta={FIELD_META[i]}
              field={field}
              onChange={f => applyField(i, f)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
