import { useCopy } from '../../../hooks/useCopy'
import { useState } from 'react'

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const raw = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: 100_000, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function aesEncrypt(password: string, plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv   = crypto.getRandomValues(new Uint8Array(12))
  const key  = await deriveKey(password, salt)
  const ct   = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext))
  const out  = new Uint8Array(16 + 12 + ct.byteLength)
  out.set(salt, 0); out.set(iv, 16); out.set(new Uint8Array(ct), 28)
  return btoa(String.fromCharCode(...out))
}

async function aesDecrypt(password: string, b64: string): Promise<string> {
  let bytes: Uint8Array
  try { bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0)) } catch { throw new Error('Invalid base64') }
  if (bytes.length < 29) throw new Error('Ciphertext too short')
  const salt = bytes.slice(0, 16)
  const iv   = bytes.slice(16, 28)
  const ct   = bytes.slice(28)
  const key  = await deriveKey(password, salt)
  const pt   = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new TextDecoder().decode(pt)
}

type Mode = 'encrypt' | 'decrypt'

export function AesEncryptDecrypt() {
  const { copy, copied } = useCopy()
  const [mode, setMode] = useState<Mode>('encrypt')
  const [password, setPassword] = useState('')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function run() {
    if (!password || !input.trim()) return
    setLoading(true); setError(''); setOutput('')
    try {
      const result = mode === 'encrypt'
        ? await aesEncrypt(password, input)
        : await aesDecrypt(password, input.trim())
      setOutput(result)
    } catch (e) {
      setError(mode === 'decrypt' ? 'Decryption failed — wrong password or corrupted ciphertext' : (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full"

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#e2e4ed]">AES Encrypt / Decrypt</h1>
        <div className="flex bg-[#1a1d27] border border-[#2a2d3a] rounded overflow-hidden">
          {(['encrypt', 'decrypt'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setOutput(''); setError('') }}
              className={`px-3 py-1.5 text-xs capitalize transition-colors cursor-pointer ${
                mode === m ? 'bg-[#c4af64]/10 text-[#c4af64]' : 'text-[#6b7280] hover:text-[#e2e4ed]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Password</label>
          <input type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} placeholder="Secret password" />
        </div>

        <div>
          <label className="block text-xs text-[#6b7280] mb-1">{mode === 'encrypt' ? 'Plaintext' : 'Ciphertext (base64)'}</label>
          <textarea
            className={`${inputClass} font-mono resize-none`}
            rows={5}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={mode === 'encrypt' ? 'Text to encrypt…' : 'Base64 ciphertext to decrypt…'}
          />
        </div>

        <button
          onClick={run}
          disabled={!password || !input.trim() || loading}
          className="px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? 'Working…' : mode === 'encrypt' ? 'Encrypt' : 'Decrypt'}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {output && (
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6b7280]">{mode === 'encrypt' ? 'Ciphertext (base64, AES-256-GCM)' : 'Decrypted plaintext'}</span>
              <button onClick={() => copy(output)} className="text-xs text-[#c4af64] hover:text-[#e2e4ed] transition-colors cursor-pointer">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="font-mono text-xs text-[#e2e4ed] whitespace-pre-wrap break-all">{output}</pre>
          </div>
        )}

        <p className="text-xs text-[#3a3d4a]">AES-256-GCM · PBKDF2 key derivation (100k iterations) · Random salt + IV per encryption</p>
      </div>
    </div>
  )
}
