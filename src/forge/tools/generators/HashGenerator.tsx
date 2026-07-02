import { useState, useEffect, useMemo } from 'react'

function md5(input: string): string {
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff)
    return ((x >> 16) + (y >> 16) + (lsw >> 16)) << 16 | (lsw & 0xffff)
  }
  function bitRotL(num: number, cnt: number) { return num << cnt | num >>> (32 - cnt) }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(bitRotL(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(b & c | ~b & d, a, b, x, s, t) }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(b & d | c & ~d, a, b, x, s, t) }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(b ^ c ^ d, a, b, x, s, t) }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(c ^ (b | ~d), a, b, x, s, t) }

  const bytes = new TextEncoder().encode(input)
  const len8 = bytes.length
  const len32 = Math.ceil((len8 + 9) / 64) * 16
  const x = new Int32Array(len32)
  for (let i = 0; i < len8; i++) x[i >> 2] |= bytes[i] << (i % 4 * 8)
  x[len8 >> 2] |= 0x80 << (len8 % 4 * 8)
  x[len32 - 2] = len8 * 8

  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878
  for (let i = 0; i < len32; i += 16) {
    const [oa, ob, oc, od] = [a, b, c, d]
    a = ff(a,b,c,d,x[i],7,-680876936);   d = ff(d,a,b,c,x[i+1],12,-389564586);  c = ff(c,d,a,b,x[i+2],17,606105819);   b = ff(b,c,d,a,x[i+3],22,-1044525330)
    a = ff(a,b,c,d,x[i+4],7,-176418897); d = ff(d,a,b,c,x[i+5],12,1200080426);  c = ff(c,d,a,b,x[i+6],17,-1473231341); b = ff(b,c,d,a,x[i+7],22,-45705983)
    a = ff(a,b,c,d,x[i+8],7,1770035416); d = ff(d,a,b,c,x[i+9],12,-1958414417); c = ff(c,d,a,b,x[i+10],17,-42063);     b = ff(b,c,d,a,x[i+11],22,-1990404162)
    a = ff(a,b,c,d,x[i+12],7,1804603682);d = ff(d,a,b,c,x[i+13],12,-40341101);  c = ff(c,d,a,b,x[i+14],17,-1502002290);b = ff(b,c,d,a,x[i+15],22,1236535329)
    a = gg(a,b,c,d,x[i+1],5,-165796510); d = gg(d,a,b,c,x[i+6],9,-1069501632);  c = gg(c,d,a,b,x[i+11],14,643717713);  b = gg(b,c,d,a,x[i],20,-373897302)
    a = gg(a,b,c,d,x[i+5],5,-701558691); d = gg(d,a,b,c,x[i+10],9,38016083);    c = gg(c,d,a,b,x[i+15],14,-660478335); b = gg(b,c,d,a,x[i+4],20,-405537848)
    a = gg(a,b,c,d,x[i+9],5,568446438);  d = gg(d,a,b,c,x[i+14],9,-1019803690); c = gg(c,d,a,b,x[i+3],14,-187363961);  b = gg(b,c,d,a,x[i+8],20,1163531501)
    a = gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);     c = gg(c,d,a,b,x[i+7],14,1735328473);  b = gg(b,c,d,a,x[i+12],20,-1926607734)
    a = hh(a,b,c,d,x[i+5],4,-378558);    d = hh(d,a,b,c,x[i+8],11,-2022574463); c = hh(c,d,a,b,x[i+11],16,1839030562); b = hh(b,c,d,a,x[i+14],23,-35309556)
    a = hh(a,b,c,d,x[i+1],4,-1530992060);d = hh(d,a,b,c,x[i+4],11,1272893353);  c = hh(c,d,a,b,x[i+7],16,-155497632);  b = hh(b,c,d,a,x[i+10],23,-1094730640)
    a = hh(a,b,c,d,x[i+13],4,681279174); d = hh(d,a,b,c,x[i],11,-358537222);    c = hh(c,d,a,b,x[i+3],16,-722521979);  b = hh(b,c,d,a,x[i+6],23,76029189)
    a = hh(a,b,c,d,x[i+9],4,-640364487); d = hh(d,a,b,c,x[i+12],11,-421815835); c = hh(c,d,a,b,x[i+15],16,530742520);  b = hh(b,c,d,a,x[i+2],23,-995338651)
    a = ii(a,b,c,d,x[i],6,-198630844);   d = ii(d,a,b,c,x[i+7],10,1126891415);  c = ii(c,d,a,b,x[i+14],15,-1416354905);b = ii(b,c,d,a,x[i+5],21,-57434055)
    a = ii(a,b,c,d,x[i+12],6,1700485571);d = ii(d,a,b,c,x[i+3],10,-1894986606); c = ii(c,d,a,b,x[i+10],15,-1051523);   b = ii(b,c,d,a,x[i+1],21,-2054922799)
    a = ii(a,b,c,d,x[i+8],6,1873313359); d = ii(d,a,b,c,x[i+15],10,-30611744);  c = ii(c,d,a,b,x[i+6],15,-1560198380); b = ii(b,c,d,a,x[i+13],21,1309151649)
    a = ii(a,b,c,d,x[i+4],6,-145523070); d = ii(d,a,b,c,x[i+11],10,-1120210379);c = ii(c,d,a,b,x[i+2],15,718787259);   b = ii(b,c,d,a,x[i+9],21,-343485551)
    a = safeAdd(a, oa); b = safeAdd(b, ob); c = safeAdd(c, oc); d = safeAdd(d, od)
  }
  function wordToHex(w: number) {
    let s = ''
    for (let i = 0; i < 4; i++) s += ((w >> (i * 8)) & 0xff).toString(16).padStart(2, '0')
    return s
  }
  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)
}

type HashAlgo = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512'

async function hashString(input: string, algo: HashAlgo): Promise<string> {
  if (algo === 'MD5') return md5(input)
  const enc = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest(algo, enc)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function identifyHash(h: string): HashAlgo[] {
  const clean = h.trim().toLowerCase()
  if (!/^[0-9a-f]+$/.test(clean)) return []
  if (clean.length === 32)  return ['MD5']
  if (clean.length === 40)  return ['SHA-1']
  if (clean.length === 64)  return ['SHA-256']
  if (clean.length === 128) return ['SHA-512']
  return []
}

const COMMON_WORDS = [
  'password','123456','password1','qwerty','abc123','letmein','monkey','1234567890',
  'iloveyou','admin','welcome','login','master','hello','shadow','sunshine','princess',
  'dragon','passw0rd','batman','superman','trustno1','football','baseball','hockey',
  'soccer','michael','jessica','ashley','jennifer','daniel','joshua','matthew','andrew',
  'january','february','march','april','summer','winter','spring','autumn',
  'google','facebook','amazon','apple','microsoft','twitter','linkedin',
  'test','testing','temp','user','root','guest','demo','sample',
  '111111','000000','password123','changeme','qwerty123','abcdef','zxcvbn',
]

type Tab = 'generate' | 'lookup'

export function HashGenerator() {
  const [tab, setTab] = useState<Tab>('generate')

  // Generate tab
  const [input, setInput] = useState('')
  const [hashes, setHashes] = useState<Record<HashAlgo, string>>({ 'MD5': '', 'SHA-1': '', 'SHA-256': '', 'SHA-512': '' })
  const [copied, setCopied] = useState<HashAlgo | null>(null)

  // Lookup tab
  const [lookupHash, setLookupHash] = useState('')
  const [customWords, setCustomWords] = useState('')
  const [cracking, setCracking] = useState(false)
  const [crackResult, setCrackResult] = useState<{ found: true; input: string; algo: HashAlgo } | { found: false } | null>(null)

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono"

  useEffect(() => {
    if (!input) return
    const enc = new TextEncoder().encode(input)
    const md5Hash = md5(input)
    Promise.all([
      crypto.subtle.digest('SHA-1', enc),
      crypto.subtle.digest('SHA-256', enc),
      crypto.subtle.digest('SHA-512', enc),
    ]).then(([s1, s256, s512]) => {
      const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
      setHashes({ 'MD5': md5Hash, 'SHA-1': toHex(s1), 'SHA-256': toHex(s256), 'SHA-512': toHex(s512) })
    })
  }, [input])

  function copy(algo: HashAlgo) {
    navigator.clipboard.writeText(hashes[algo])
    setCopied(algo)
    setTimeout(() => setCopied(null), 1500)
  }

  const candidates = useMemo(() => identifyHash(lookupHash), [lookupHash])

  async function crack() {
    if (!lookupHash.trim() || candidates.length === 0) return
    setCracking(true); setCrackResult(null)
    const target = lookupHash.trim().toLowerCase()
    const words = [
      ...COMMON_WORDS,
      ...customWords.split('\n').map(w => w.trim()).filter(Boolean),
    ]
    for (const word of words) {
      for (const algo of candidates) {
        const h = await hashString(word, algo)
        if (h === target) {
          setCrackResult({ found: true, input: word, algo })
          setCracking(false)
          return
        }
      }
    }
    setCrackResult({ found: false })
    setCracking(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#e2e4ed]">Hash Generator</h1>
        <div className="flex bg-[#1a1d27] border border-[#2a2d3a] rounded overflow-hidden">
          {(['generate', 'lookup'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs capitalize transition-colors cursor-pointer ${
                tab === t ? 'bg-[#c4af64]/10 text-[#c4af64]' : 'text-[#6b7280] hover:text-[#e2e4ed]'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'generate' ? (
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-[#6b7280] mb-1">Input Text</label>
            <input className={inputClass} value={input} onChange={e => setInput(e.target.value)} placeholder="Enter text to hash..." />
          </div>
          {(['MD5', 'SHA-1', 'SHA-256', 'SHA-512'] as HashAlgo[]).map(algo => (
            <div key={algo} className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[#6b7280]">{algo}</p>
                {hashes[algo] && (
                  <button onClick={() => copy(algo)} className="text-xs text-[#c4af64] hover:text-[#e2e4ed] transition-colors cursor-pointer">
                    {copied === algo ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
              <p className="font-mono text-xs text-[#c4af64] break-all min-h-[1rem]">{input ? hashes[algo] : ''}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs text-[#6b7280] mb-1">Hash to look up</label>
              <input
                className={inputClass}
                value={lookupHash}
                onChange={e => { setLookupHash(e.target.value); setCrackResult(null) }}
                placeholder="Paste an MD5, SHA-1, SHA-256 or SHA-512 hash..."
              />
              {lookupHash.trim() && (
                <p className="text-xs text-[#6b7280] mt-1">
                  {candidates.length > 0
                    ? `Detected: ${candidates.join(', ')}`
                    : 'Unknown hash format'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-[#6b7280] mb-1">
                Custom wordlist <span className="text-[#3a3d4a]">(one word per line, appended to built-in list)</span>
              </label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={4}
                value={customWords}
                onChange={e => setCustomWords(e.target.value)}
                placeholder="hunter2&#10;correcthorsebatterystaple&#10;..."
              />
            </div>

            <button
              onClick={crack}
              disabled={!lookupHash.trim() || candidates.length === 0 || cracking}
              className="px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              {cracking ? 'Searching…' : 'Search Wordlist'}
            </button>

            {crackResult && (
              crackResult.found ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-green-500/10 border-green-500/20 text-green-400 text-sm">
                  <span className="font-semibold">Found:</span>
                  <code className="font-mono">{crackResult.input}</code>
                  <span className="text-xs text-green-400/60">({crackResult.algo})</span>
                </div>
              ) : (
                <div className="px-4 py-3 rounded-lg border bg-[#2a2d3a]/40 border-[#2a2d3a] text-[#6b7280] text-sm">
                  Not found in wordlist
                </div>
              )
            )}
          </div>

          <p className="text-xs text-[#3a3d4a] px-1">
            Dictionary attack against common passwords. Hashes are not reversible - only succeeds if the original input is in the wordlist.
          </p>
        </div>
      )}
    </div>
  )
}
