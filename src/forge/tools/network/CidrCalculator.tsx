import { useState } from 'react'

function cidrCalc(cidr: string): {
  network: string; broadcast: string; mask: string;
  firstHost: string; lastHost: string; totalHosts: number
} | null {
  const match = cidr.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/)
  if (!match) return null
  const octets = [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])]
  const prefix = Number(match[5])
  if (octets.some(o => o > 255) || prefix > 32) return null

  const ipInt = octets.reduce((acc, o) => (acc << 8) | o, 0) >>> 0
  const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const networkInt = (ipInt & maskInt) >>> 0
  const broadcastInt = (networkInt | ~maskInt) >>> 0

  function intToIp(n: number) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')
  }

  const totalHosts = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.pow(2, 32 - prefix) - 2
  const firstHost = prefix >= 31 ? networkInt : networkInt + 1
  const lastHost = prefix >= 31 ? broadcastInt : broadcastInt - 1

  return {
    network: intToIp(networkInt),
    broadcast: intToIp(broadcastInt),
    mask: intToIp(maskInt),
    firstHost: intToIp(firstHost),
    lastHost: intToIp(lastHost),
    totalHosts: Math.max(0, totalHosts),
  }
}

export function CidrCalculator() {
  const [cidr, setCidr] = useState('192.168.1.0/24')
  const [copied, setCopied] = useState('')


  const result = cidrCalc(cidr.trim())

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }

  const rows: { label: string; value: string }[] = result ? [
    { label: 'Network Address', value: result.network },
    { label: 'Broadcast Address', value: result.broadcast },
    { label: 'Subnet Mask', value: result.mask },
    { label: 'First Host', value: result.firstHost },
    { label: 'Last Host', value: result.lastHost },
    { label: 'Total Hosts', value: result.totalHosts.toLocaleString() },
  ] : []

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">CIDR Calculator</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs text-[#6b7280] mb-1">CIDR Notation</label>
          <input
            className="forge-input-mono"
            value={cidr}
            onChange={e => setCidr(e.target.value)}
            placeholder="192.168.1.0/24"
          />
        </div>

        {cidr.trim() && !result && (
          <p className="text-xs text-red-400">Invalid CIDR notation</p>
        )}

        {result && (
          <div className="flex flex-col gap-2 pt-2 border-t border-[#2a2d3a]">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <p className="text-xs text-[#6b7280]">{label}</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-[#c4af64]">{value}</p>
                  <button
                    onClick={() => copy(value, label)}
                    className="text-xs text-[#6b7280] hover:text-[#c4af64] transition-colors"
                  >
                    {copied === label ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
