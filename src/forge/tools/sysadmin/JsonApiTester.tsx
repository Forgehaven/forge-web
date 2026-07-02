import { useCopy } from '../../../hooks/useCopy'
import { useState } from 'react'
import { Select } from '../../../components/Select'
import type { SelectOption } from '../../../components/Select'

const methodOptions: SelectOption[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => ({ value: m, label: m }))

const METHOD_COLORS: Record<string, string> = {
  GET: '#86efac',
  POST: '#60a5fa',
  PUT: '#fbbf24',
  PATCH: '#c084fc',
  DELETE: '#f87171',
}

function syntaxHighlight(json: string): string {
  const escaped = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    match => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span style="color:#c4af64">${match}</span>`
        return `<span style="color:#86efac">${match}</span>`
      }
      if (/true|false/.test(match)) return `<span style="color:#60a5fa">${match}</span>`
      if (/null/.test(match)) return `<span style="color:#f87171">${match}</span>`
      return `<span style="color:#9ca3af">${match}</span>`
    }
  )
}

type HeaderPair = { key: string; value: string }

interface ResponseData {
  status: number
  statusText: string
  time: number
  highlighted: string
  isJson: boolean
  size: number
  raw: string
}

export function JsonApiTester() {
  const { copy, copied } = useCopy()
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState('GET')
  const [headers, setHeaders] = useState<HeaderPair[]>([{ key: '', value: '' }])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [error, setError] = useState('')

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method)

  function addHeader() { setHeaders(h => [...h, { key: '', value: '' }]) }
  function removeHeader(i: number) { setHeaders(h => h.filter((_, idx) => idx !== i)) }
  function updateHeader(i: number, field: 'key' | 'value', val: string) {
    setHeaders(h => h.map((row, idx) => idx === i ? { ...row, [field]: val } : row))
  }

  async function send() {
    const trimUrl = url.trim()
    if (!trimUrl) return
    setLoading(true)
    setError('')
    setResponse(null)

    const reqHeaders: Record<string, string> = { Accept: 'application/json' }
    headers.forEach(({ key, value }) => { if (key.trim()) reqHeaders[key.trim()] = value })
    if (hasBody && body) reqHeaders['Content-Type'] = 'application/json'

    const start = performance.now()
    try {
      const res = await fetch(trimUrl, {
        method,
        headers: reqHeaders,
        body: hasBody && body ? body : undefined,
      })
      const time = Math.round(performance.now() - start)
      const text = await res.text()

      let isJson = false
      let highlighted = ''
      let raw = text

      try {
        const parsed = JSON.parse(text)
        raw = JSON.stringify(parsed, null, 2)
        highlighted = syntaxHighlight(raw)
        isJson = true
      } catch {
        highlighted = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        time,
        highlighted,
        isJson,
        size: new TextEncoder().encode(text).length,
        raw,
      })
    } catch {
      setError(
        `Request failed - the API likely blocks cross-origin requests (CORS). Try a local dev server or an API that allows browser requests.`
      )
    } finally {
      setLoading(false)
    }
  }

  function copyResponse() {
    if (!response) return
    copy(response.raw)
  }

  function statusColor(s: number) {
    if (s < 300) return 'text-green-400'
    if (s < 400) return 'text-yellow-400'
    return 'text-red-400'
  }

  const inputClass = 'bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] font-mono'
  const btnClass = 'px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0'

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">JSON API Tester</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">

        <div className="flex gap-2">
          <Select
            options={methodOptions}
            value={methodOptions.find(o => o.value === method) ?? null}
            onChange={opt => opt && setMethod(opt.value)}
            formatOptionLabel={(opt, { context }) =>
              context === 'value'
                ? <span style={{ color: METHOD_COLORS[opt.value], fontWeight: 600 }}>{opt.label}</span>
                : <>{opt.label}</>
            }
          />
          <input
            className={`${inputClass} flex-1 min-w-0`}
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="https://api.example.com/endpoint"
          />
          <button onClick={send} disabled={loading || !url.trim()} className={btnClass}>
            {loading ? 'Sending…' : 'Send'}
          </button>
        </div>

        <div>
          <p className="text-xs text-[#6b7280] mb-2">Headers</p>
          <div className="flex flex-col gap-1.5">
            {headers.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className={`${inputClass} flex-1 min-w-0`}
                  placeholder="Key"
                  value={row.key}
                  onChange={e => updateHeader(i, 'key', e.target.value)}
                />
                <input
                  className={`${inputClass} flex-1 min-w-0`}
                  placeholder="Value"
                  value={row.value}
                  onChange={e => updateHeader(i, 'value', e.target.value)}
                />
                <button
                  onClick={() => removeHeader(i)}
                  className="text-[#6b7280] hover:text-[#e2e4ed] transition-colors text-lg leading-none shrink-0 cursor-pointer"
                >×</button>
              </div>
            ))}
            <button onClick={addHeader} className="text-xs text-[#6b7280] hover:text-[#c4af64] transition-colors self-start cursor-pointer">
              + Add header
            </button>
          </div>
        </div>

        {hasBody && (
          <div>
            <p className="text-xs text-[#6b7280] mb-2">Body <span className="text-[#3a3d4a]">(JSON)</span></p>
            <textarea
              className={`${inputClass} w-full resize-y min-h-[80px]`}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder='{"key": "value"}'
            />
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        {response && (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-sm font-mono font-semibold ${statusColor(response.status)}`}>
                {response.status} {response.statusText}
              </span>
              <span className="text-xs text-[#6b7280]">{response.time}ms</span>
              <span className="text-xs text-[#6b7280]">{(response.size / 1024).toFixed(1)} KB</span>
              {!response.isJson && <span className="text-xs text-yellow-400">not JSON</span>}
              <button onClick={copyResponse} className="text-xs text-[#6b7280] hover:text-[#c4af64] transition-colors ml-auto cursor-pointer">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre
              className="bg-[#0f1117] rounded-lg p-4 text-xs overflow-auto max-h-[60vh] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: response.highlighted }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
