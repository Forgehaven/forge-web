import { useState, useMemo } from 'react'

const KNOWN: Record<string, string> = {
  'accept': 'Media types the client can process',
  'accept-encoding': 'Compression algorithms the client supports',
  'accept-language': 'Preferred natural languages',
  'access-control-allow-credentials': 'Whether credentials are included in CORS requests',
  'access-control-allow-headers': 'CORS: which headers can be used in the request',
  'access-control-allow-methods': 'CORS: which HTTP methods are permitted',
  'access-control-allow-origin': 'CORS: which origins are permitted',
  'access-control-max-age': 'CORS: how long to cache preflight response (seconds)',
  'authorization': 'Credentials for authenticating the client',
  'cache-control': 'Caching directives for both requests and responses',
  'connection': 'Control options for the current connection',
  'content-encoding': 'Compression applied to the body',
  'content-length': 'Size of the body in bytes',
  'content-security-policy': 'Controls which resources the browser may load',
  'content-type': 'Media type and optional charset of the body',
  'cookie': 'Stored HTTP cookies from the client',
  'date': 'Date and time the message was sent',
  'etag': 'Identifier for a specific version of a resource',
  'expires': 'Date after which the response is considered stale',
  'host': 'Domain name (and port) of the server',
  'if-modified-since': 'Returns 304 if content unchanged since this date',
  'if-none-match': 'Returns 304 if ETag matches (conditional GET)',
  'last-modified': 'Date the resource was last changed',
  'location': 'URL to redirect the client to',
  'origin': 'Initiating origin of the cross-origin request',
  'pragma': 'Implementation-specific directives (legacy)',
  'referer': 'Address of the page making the request',
  'retry-after': 'How long to wait before retrying the request',
  'server': 'Software handling the request on the server',
  'set-cookie': 'Instructs the client to store a cookie',
  'strict-transport-security': 'HSTS: enforce HTTPS for future requests',
  'transfer-encoding': 'Encoding used to safely transfer the body',
  'user-agent': 'Identifier string for the client application',
  'vary': 'Which request headers affect the cached response',
  'www-authenticate': 'Authentication scheme required by the server',
  'x-content-type-options': 'Prevents MIME-type sniffing (nosniff)',
  'x-forwarded-for': 'Originating IP address through proxies',
  'x-frame-options': 'Controls whether page can be framed (clickjacking)',
  'x-real-ip': 'Real client IP address set by a reverse proxy',
  'x-request-id': 'Unique identifier for tracing requests',
  'x-xss-protection': 'XSS filtering (legacy browsers)',
}

interface ParsedMessage {
  type: 'request' | 'response'
  firstLine: string
  method?: string
  path?: string
  httpVersion?: string
  statusCode?: number
  statusText?: string
  headers: { name: string; value: string; description?: string }[]
  body?: string
}

function parseMessage(raw: string): ParsedMessage | null {
  const [head, ...bodyParts] = raw.split(/\r?\n\r?\n/)
  const body = bodyParts.join('\n\n').trim() || undefined
  const lines = head.split(/\r?\n/)
  if (!lines.length) return null

  const firstLine = lines[0].trim()
  const isRequest  = /^[A-Z]+\s/.test(firstLine)
  const isResponse = /^HTTP\//.test(firstLine)
  if (!isRequest && !isResponse) return null

  const headers = lines.slice(1)
    .filter(l => l.includes(':'))
    .map(l => {
      const colon = l.indexOf(':')
      const name  = l.slice(0, colon).trim()
      const value = l.slice(colon + 1).trim()
      return { name, value, description: KNOWN[name.toLowerCase()] }
    })

  if (isRequest) {
    const [method, path, httpVersion] = firstLine.split(' ')
    return { type: 'request', firstLine, method, path, httpVersion, headers, body }
  } else {
    const spaceIdx = firstLine.indexOf(' ')
    const rest = firstLine.slice(spaceIdx + 1)
    const spaceIdx2 = rest.indexOf(' ')
    const statusCode = parseInt(rest.slice(0, spaceIdx2))
    const statusText = rest.slice(spaceIdx2 + 1)
    const httpVersion = firstLine.slice(0, spaceIdx)
    return { type: 'response', firstLine, httpVersion, statusCode, statusText, headers, body }
  }
}

const STATUS_COLORS: Record<number, string> = {}
function statusColor(code: number): string {
  if (code < 200) return 'text-blue-400'
  if (code < 300) return 'text-green-400'
  if (code < 400) return 'text-yellow-400'
  if (code < 500) return 'text-orange-400'
  return 'text-red-400'
}
void STATUS_COLORS

const SAMPLE_REQUEST = `GET /api/users/42 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Accept: application/json
Accept-Encoding: gzip, deflate, br
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Cache-Control: no-cache`

export function HttpHeaderInspector() {
  const [raw, setRaw] = useState(SAMPLE_REQUEST)

  const parsed = useMemo(() => {
    if (!raw.trim()) return null
    return parseMessage(raw)
  }, [raw])

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">HTTP Header Inspector</h1>

      <div className="mb-4">
        <label className="block text-xs text-[#6b7280] mb-1">Raw HTTP request or response</label>
        <textarea
          className="bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono resize-none"
          rows={8}
          value={raw}
          onChange={e => setRaw(e.target.value)}
          spellCheck={false}
        />
      </div>

      {raw.trim() && !parsed && (
        <p className="text-sm text-red-400">Could not parse — paste a valid HTTP request or response starting with a request line or status line.</p>
      )}

      {parsed && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
            {parsed.type === 'request' ? (
              <div className="flex items-baseline gap-3 font-mono text-sm">
                <span className="text-[#c4af64] font-semibold">{parsed.method}</span>
                <span className="text-[#e2e4ed]">{parsed.path}</span>
                <span className="text-[#6b7280] text-xs">{parsed.httpVersion}</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-3 font-mono text-sm">
                <span className="text-[#6b7280] text-xs">{parsed.httpVersion}</span>
                <span className={`font-semibold ${statusColor(parsed.statusCode!)}`}>{parsed.statusCode}</span>
                <span className="text-[#e2e4ed]">{parsed.statusText}</span>
              </div>
            )}
          </div>

          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-[#2a2d3a] grid grid-cols-[1fr_2fr_2fr] gap-4">
              <span className="text-xs text-[#6b7280] uppercase tracking-wider">Header</span>
              <span className="text-xs text-[#6b7280] uppercase tracking-wider">Value</span>
              <span className="text-xs text-[#6b7280] uppercase tracking-wider">Description</span>
            </div>
            {parsed.headers.map((h, i) => (
              <div
                key={i}
                className="px-4 py-2.5 border-b border-[#2a2d3a] last:border-0 grid grid-cols-[1fr_2fr_2fr] gap-4 hover:bg-[#2a2d3a]/30 transition-colors"
              >
                <span className="font-mono text-xs text-[#c4af64] break-all">{h.name}</span>
                <span className="font-mono text-xs text-[#e2e4ed] break-all">{h.value}</span>
                <span className="text-xs text-[#6b7280]">{h.description ?? '—'}</span>
              </div>
            ))}
          </div>

          {parsed.body && (
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
              <p className="text-xs text-[#6b7280] mb-2">Body</p>
              <pre className="font-mono text-xs text-[#e2e4ed] whitespace-pre-wrap break-all">{parsed.body}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
