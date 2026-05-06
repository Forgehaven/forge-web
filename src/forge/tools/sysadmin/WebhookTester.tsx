import { useState } from 'react'
import { Select } from '../../../components/Select'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const METHODS: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const METHOD_COLORS_HEX: Record<Method, string> = {
  GET:    '#4ade80',
  POST:   '#60a5fa',
  PUT:    '#facc15',
  PATCH:  '#fb923c',
  DELETE: '#f87171',
}

const methodOptions = METHODS.map(m => ({ value: m, label: m }))

function statusColor(code: number): string {
  if (code < 300) return 'text-green-400'
  if (code < 400) return 'text-yellow-400'
  return 'text-red-400'
}

function tryPretty(s: string): string {
  try { return JSON.stringify(JSON.parse(s), null, 2) } catch { return s }
}

interface ResponseData {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  ms: number
}

export function WebhookTester() {
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState<Method>('POST')
  const [body, setBody] = useState('{\n  \n}')
  const [headersText, setHeadersText] = useState('{\n  "Content-Type": "application/json"\n}')
  const [showHeaders, setShowHeaders] = useState(false)
  const [sending, setSending] = useState(false)
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [error, setError] = useState('')
  const [copiedBody, setCopiedBody] = useState(false)

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method)

  async function send() {
    const target = url.trim()
    if (!target) return
    setSending(true)
    setError('')
    setResponse(null)

    let parsedHeaders: Record<string, string> = {}
    try {
      if (headersText.trim()) parsedHeaders = JSON.parse(headersText)
    } catch {
      setError('Headers must be valid JSON.')
      setSending(false)
      return
    }

    const opts: RequestInit = { method, headers: parsedHeaders }
    if (hasBody && body.trim()) opts.body = body

    const t0 = Date.now()
    try {
      const res = await fetch(target, opts)
      const text = await res.text()
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: text,
        ms: Date.now() - t0,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed'
      const isCors = msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')
      setError(isCors
        ? `Request blocked — likely a CORS error. The target server must allow cross-origin requests from the browser. For local dev servers this usually works fine.`
        : msg
      )
    } finally {
      setSending(false)
    }
  }

  function copyBody() {
    if (!response) return
    navigator.clipboard.writeText(tryPretty(response.body))
    setCopiedBody(true)
    setTimeout(() => setCopiedBody(false), 1500)
  }

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] font-mono"
  const btnClass = "px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Webhook Tester</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">

        {/* URL + method */}
        <div className="flex gap-2">
          <Select
            options={methodOptions}
            value={methodOptions.find(o => o.value === method) ?? null}
            onChange={opt => opt && setMethod(opt.value as Method)}
            formatOptionLabel={(opt, { context }) =>
              context === 'value'
                ? <span style={{ color: METHOD_COLORS_HEX[opt.value as Method], fontWeight: 600 }}>{opt.label}</span>
                : <>{opt.label}</>
            }
          />
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="https://example.com/webhook"
            className={`${inputClass} flex-1`}
          />
        </div>

        {/* Headers toggle */}
        <div>
          <button
            onClick={() => setShowHeaders(v => !v)}
            className="text-xs text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer"
          >
            {showHeaders ? '▲' : '▶'} Headers
          </button>
          {showHeaders && (
            <textarea
              value={headersText}
              onChange={e => setHeadersText(e.target.value)}
              rows={4}
              className={`${inputClass} w-full mt-2 resize-none`}
            />
          )}
        </div>

        {/* Body */}
        {hasBody && (
          <div>
            <label className="block text-xs text-[#6b7280] mb-1">Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              className={`${inputClass} w-full resize-none`}
              placeholder='{"key": "value"}'
            />
          </div>
        )}

        <button onClick={send} disabled={sending || !url.trim()} className={btnClass}>
          {sending ? 'Sending…' : 'Send Request'}
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* Response */}
        {response && (
          <div className="border-t border-[#2a2d3a] pt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-mono font-semibold ${statusColor(response.status)}`}>
                {response.status} {response.statusText}
              </span>
              <span className="text-xs text-[#3a3d4a]">{response.ms}ms</span>
            </div>

            {Object.keys(response.headers).length > 0 && (
              <div>
                <p className="text-xs text-[#6b7280] mb-1">Response Headers</p>
                <div className="bg-[#0f1117] rounded p-3 max-h-32 overflow-y-auto">
                  {Object.entries(response.headers).map(([k, v]) => (
                    <div key={k} className="text-xs font-mono">
                      <span className="text-[#6b7280]">{k}: </span>
                      <span className="text-[#9ca3af]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {response.body && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-[#6b7280]">Response Body</p>
                  <button onClick={copyBody} className="text-xs text-[#6b7280] hover:text-[#c4af64] transition-colors cursor-pointer">
                    {copiedBody ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-[#0f1117] rounded p-3 text-xs font-mono text-[#c4af64] whitespace-pre-wrap break-all max-h-64 overflow-y-auto">
                  {tryPretty(response.body)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
