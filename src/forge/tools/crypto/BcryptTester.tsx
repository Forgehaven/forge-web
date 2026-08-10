import { useState } from 'react'
import bcrypt from 'bcryptjs'
import { useCopy } from '../../../hooks/useCopy'

type Mode = 'hash' | 'verify'

export function BcryptTester() {
  const [mode, setMode] = useState<Mode>('hash')

  // Hash mode
  const [hashInput, setHashInput] = useState('')
  const [rounds, setRounds] = useState(10)
  const [hashOutput, setHashOutput] = useState('')
  const [hashing, setHashing] = useState(false)
  const { copy: copyHash, copied: hashCopied } = useCopy()

  // Verify mode
  const [verifyPassword, setVerifyPassword] = useState('')
  const [verifyHash, setVerifyHash] = useState('')
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null)
  const [verifying, setVerifying] = useState(false)

  async function doHash() {
    if (!hashInput) return
    setHashing(true); setHashOutput('')
    try {
      const result = await bcrypt.hash(hashInput, rounds)
      setHashOutput(result)
    } finally {
      setHashing(false)
    }
  }

  async function doVerify() {
    if (!verifyPassword || !verifyHash.trim()) return
    setVerifying(true); setVerifyResult(null)
    try {
      const match = await bcrypt.compare(verifyPassword, verifyHash.trim())
      setVerifyResult(match)
    } catch {
      setVerifyResult(false)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#e2e4ed]">Bcrypt Tester</h1>
        <div className="flex bg-[#1a1d27] border border-[#2a2d3a] rounded overflow-hidden">
          {(['hash', 'verify'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs capitalize transition-colors cursor-pointer ${
                mode === m ? 'bg-[#c4af64]/10 text-[#c4af64]' : 'text-[#6b7280] hover:text-[#e2e4ed]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === 'hash' ? (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-[#6b7280] mb-1">Password</label>
            <input className="forge-input" type="password" value={hashInput}
              onChange={e => setHashInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doHash()}
              placeholder="Password to hash" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#6b7280]">Cost factor (rounds): {rounds}</label>
              <span className="text-xs text-[#3a3d4a]">2^{rounds} = {(2 ** rounds).toLocaleString()} iterations</span>
            </div>
            <input
              type="range" min={4} max={14} value={rounds}
              onChange={e => setRounds(+e.target.value)}
              className="w-full accent-[#c4af64]"
            />
            <div className="flex justify-between text-xs text-[#3a3d4a] mt-0.5">
              <span>4 (fast)</span><span>10 (default)</span><span>14 (slow)</span>
            </div>
          </div>

          <button onClick={doHash} disabled={!hashInput || hashing} className="forge-btn-accent">
            {hashing ? 'Hashing…' : 'Hash Password'}
          </button>

          {hashOutput && (
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6b7280]">Bcrypt hash</span>
                <button onClick={() => copyHash(hashOutput)} className="text-xs text-[#c4af64] hover:text-[#e2e4ed] transition-colors cursor-pointer">
                  {hashCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="font-mono text-xs text-[#e2e4ed] break-all whitespace-pre-wrap">{hashOutput}</pre>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-[#6b7280] mb-1">Password</label>
            <input className="forge-input" type="password" value={verifyPassword}
              onChange={e => { setVerifyPassword(e.target.value); setVerifyResult(null) }}
              placeholder="Password to verify" />
          </div>

          <div>
            <label className="block text-xs text-[#6b7280] mb-1">Bcrypt hash</label>
            <input className="forge-input font-mono" value={verifyHash}
              onChange={e => { setVerifyHash(e.target.value); setVerifyResult(null) }}
              placeholder="$2a$10$..." />
          </div>

          <button onClick={doVerify} disabled={!verifyPassword || !verifyHash.trim() || verifying} className="forge-btn-accent">
            {verifying ? 'Verifying…' : 'Verify'}
          </button>

          {verifyResult !== null && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${
              verifyResult
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {verifyResult ? '✓ Password matches' : '✗ Password does not match'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
