import { useState, useMemo } from 'react'

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - str.length % 4) % 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function JwtDecoder() {
  const [jwt, setJwt] = useState('')
  const [copiedHeader, setCopiedHeader] = useState(false)
  const [copiedPayload, setCopiedPayload] = useState(false)

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono resize-none"

  function decode() {
    const parts = jwt.trim().split('.')
    if (parts.length !== 3) return null
    try {
      const header = JSON.parse(base64UrlDecode(parts[0]))
      const payload = JSON.parse(base64UrlDecode(parts[1]))
      return { header, payload }
    } catch {
      return null
    }
  }

  const result = jwt.trim() ? decode() : null

  const expiry = useMemo(() => {
    const payload = result?.payload as Record<string, unknown> | undefined
    if (!payload || !('exp' in payload)) return null
    const exp = Number(payload.exp)
    // eslint-disable-next-line react-hooks/purity -- expiry check is inherently time-dependent
    const expired = Math.floor(Date.now() / 1000) > exp
    return { expired, expDate: new Date(exp * 1000).toISOString() }
  }, [result])

  function copy(text: string, which: 'header' | 'payload') {
    navigator.clipboard.writeText(text)
    if (which === 'header') { setCopiedHeader(true); setTimeout(() => setCopiedHeader(false), 1500) }
    else { setCopiedPayload(true); setTimeout(() => setCopiedPayload(false), 1500) }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">JWT Decoder</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs text-[#6b7280] mb-1">JWT Token</label>
          <textarea
            className={inputClass}
            rows={4}
            value={jwt}
            onChange={e => setJwt(e.target.value)}
            placeholder="Paste your JWT here..."
          />
        </div>

        {jwt.trim() && !result && (
          <p className="text-xs text-red-400">Invalid JWT format</p>
        )}

        {result && (
          <>
            {expiry && (
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                  expiry.expired
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {expiry.expired ? 'EXPIRED' : 'VALID'}
                </span>
                <span className="text-xs text-[#6b7280]">exp: {expiry.expDate}</span>
              </div>
            )}

            <div className="pt-2 border-t border-[#2a2d3a]">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[#6b7280]">Header</p>
                <button
                  onClick={() => copy(JSON.stringify(result.header, null, 2), 'header')}
                  className="text-xs text-[#c4af64] hover:text-[#e2e4ed] transition-colors"
                >
                  {copiedHeader ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="font-mono text-xs text-[#c4af64] whitespace-pre-wrap">{JSON.stringify(result.header, null, 2)}</pre>
            </div>

            <div className="pt-2 border-t border-[#2a2d3a]">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[#6b7280]">Payload</p>
                <button
                  onClick={() => copy(JSON.stringify(result.payload, null, 2), 'payload')}
                  className="text-xs text-[#c4af64] hover:text-[#e2e4ed] transition-colors"
                >
                  {copiedPayload ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="font-mono text-xs text-[#c4af64] whitespace-pre-wrap">{JSON.stringify(result.payload, null, 2)}</pre>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
