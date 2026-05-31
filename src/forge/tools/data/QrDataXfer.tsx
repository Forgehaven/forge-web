import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'

// ─── PRNG ────────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── ROBUST SOLITON ──────────────────────────────────────────────────────────

function buildCDF(K: number): number[] {
  if (K === 1) return [1]
  const delta = 0.05, c = 0.1
  const R = c * Math.log(K / delta) * Math.sqrt(K)
  const S = Math.max(1, Math.min(K, Math.floor(K / R)))
  let Z = 0
  const vals: number[] = []
  for (let d = 1; d <= K; d++) {
    const rho = d === 1 ? 1 / K : 1 / (d * (d - 1))
    let tau = 0
    if (d < S)        tau = R / (K * d)
    else if (d === S) tau = (R * Math.log(R / delta)) / K
    const v = rho + tau; vals.push(v); Z += v
  }
  let cum = 0
  return vals.map((v, i) => { cum += v / Z; return i === K - 1 ? 1 : Math.min(1, cum) })
}

function sampleDegree(cdf: number[], rand: () => number): number {
  const u = rand()
  const i = cdf.findIndex(c => u <= c)
  return i === -1 ? cdf.length : i + 1
}

function pickNeighbors(K: number, degree: number, rand: () => number): number[] {
  const arr = Array.from({ length: K }, (_, i) => i)
  for (let i = 0; i < degree; i++) {
    const j = i + Math.floor(rand() * (K - i))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, degree)
}

// Systematic fountain: seeds 1..K send raw source chunks, K+1+ are fountain-encoded.

function neighborsForSeed(seed: number, K: number, cdf: number[]): number[] {
  if (seed <= K) return [seed - 1]
  const rand = mulberry32(seed)
  return pickNeighbors(K, sampleDegree(cdf, rand), rand)
}

// ─── LT ENCODE ───────────────────────────────────────────────────────────────

function ltEncode(sources: Uint8Array[], seed: number, cdf: number[]): string {
  if (seed <= sources.length) return uint8ToBase64(sources[seed - 1])
  const rand      = mulberry32(seed)
  const degree    = sampleDegree(cdf, rand)
  const neighbors = pickNeighbors(sources.length, degree, rand)
  const out       = new Uint8Array(sources[0].length)
  for (const i of neighbors) for (let j = 0; j < out.length; j++) out[j] ^= sources[i][j]
  return uint8ToBase64(out)
}

// ─── LT DECODE ───────────────────────────────────────────────────────────────

class LTDecoder {
  readonly K: number
  readonly chunkSize: number
  decoded: (Uint8Array | null)[]
  decodedCount = 0
  private packets: { data: Uint8Array; neighbors: Set<number> }[] = []
  private chunkPackets: Set<number>[]

  constructor(K: number, chunkSize: number) {
    this.K            = K
    this.chunkSize    = chunkSize
    this.decoded      = new Array<Uint8Array | null>(K).fill(null)
    this.chunkPackets = Array.from({ length: K }, () => new Set<number>())
  }

  add(data: Uint8Array, neighbors: number[]) {
    const idx = this.packets.length
    const ns  = new Set(neighbors)
    const pkt = { data: data.slice(), neighbors: ns }
    for (const ci of [...ns]) {
      if (this.decoded[ci] !== null) {
        ns.delete(ci)
        const src = this.decoded[ci]!
        for (let i = 0; i < src.length; i++) pkt.data[i] ^= src[i]
      }
    }
    this.packets.push(pkt)
    for (const n of ns) this.chunkPackets[n]?.add(idx)
    this.propagate(idx)
  }

  private propagate(start: number) {
    const q = [start]
    while (q.length) {
      const pIdx = q.shift()!
      const p    = this.packets[pIdx]
      if (p.neighbors.size !== 1) continue
      const ci = [...p.neighbors][0]
      if (this.decoded[ci] !== null) continue
      this.decoded[ci] = p.data.slice()
      this.decodedCount++
      for (const oi of this.chunkPackets[ci]!) {
        if (oi === pIdx) continue
        const op = this.packets[oi]
        if (!op.neighbors.has(ci)) continue
        op.neighbors.delete(ci)
        const src = this.decoded[ci]!
        for (let i = 0; i < src.length; i++) op.data[i] ^= src[i]
        if (op.neighbors.size === 1) q.push(oi)
      }
    }
  }

  reconstruct(byteSize: number): Uint8Array {
    const out = new Uint8Array(byteSize)
    let off   = 0
    for (let i = 0; i < this.K && off < byteSize; i++) {
      const chunk = this.decoded[i]!
      const n     = Math.min(chunk.length, byteSize - off)
      out.set(chunk.subarray(0, n), off)
      off += n
    }
    return out
  }
}

// ─── COLOR BARCODE CODEC ─────────────────────────────────────────────────────
//
// Frame: 512×512. Anchor squares (40×40) at corners in hues not used by data palette.
// Data: 25×25 grid of 16×16 cells at offset (56,56). 8 colors = 3 bits/cell.
// Capacity: 625 × 3 = 1875 bits = 234 bytes. After 2-byte LE length prefix: 232 usable.
// Max chunk size: ~140 B (budget ~18 chars protocol overhead + base64).

const CB_SIZE   = 512
const CB_CELL   = 16
const CB_OFFSET = 56
const CB_GRID   = 25

// Anchor top-left corners and RGB colors (hues ~30°, ~90°, ~210°, ~330° — between data palette hues)
const CB_ANCS = [
  { x: 8,   y: 8,   rgb: [255, 128,   0] as [number,number,number] }, // TL orange
  { x: 464, y: 8,   rgb: [128, 255,   0] as [number,number,number] }, // TR lime
  { x: 8,   y: 464, rgb: [  0, 128, 255] as [number,number,number] }, // BL azure
  { x: 464, y: 464, rgb: [255,   0, 128] as [number,number,number] }, // BR rose
] as const

const ANC_CTR = 28   // anchor center offset in barcode space (8 margin + 20 half-size)
const ANC_FAR = CB_SIZE - ANC_CTR  // 484

// 8 data colors — full 0/255 values for maximum camera-distinguishable contrast
const CB_PAL: [number,number,number][] = [
  [  0,   0,   0],  // 0 black
  [255,   0,   0],  // 1 red
  [  0, 210,   0],  // 2 green  (210 not 255 to stay clear of lime anchor hue)
  [  0,   0, 255],  // 3 blue
  [255, 255,   0],  // 4 yellow
  [255,   0, 255],  // 5 magenta
  [  0, 255, 255],  // 6 cyan
  [255, 255, 255],  // 7 white
]

function cbRender(payload: string, canvas: HTMLCanvasElement) {
  canvas.width = canvas.height = CB_SIZE
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#222'
  ctx.fillRect(0, 0, CB_SIZE, CB_SIZE)

  for (const { x, y, rgb: [r, g, b] } of CB_ANCS) {
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(x, y, 40, 40)
    ctx.fillStyle = '#111'
    ctx.fillRect(x + 13, y + 13, 14, 14) // dark inner for orientation
  }

  const payBytes = new TextEncoder().encode(payload)
  const buf = new Uint8Array(2 + payBytes.length)
  buf[0] = (payBytes.length >> 8) & 0xFF  // MSB first — decoder reads big-endian
  buf[1] = payBytes.length & 0xFF
  buf.set(payBytes, 2)

  let bitPos = 0
  const totalBits = buf.length * 8
  for (let row = 0; row < CB_GRID; row++) {
    for (let col = 0; col < CB_GRID; col++) {
      let ci = 0
      for (let b = 2; b >= 0; b--) {
        if (bitPos < totalBits) {
          const by = Math.floor(bitPos / 8), bi = 7 - (bitPos % 8)
          if ((buf[by] >> bi) & 1) ci |= (1 << b)
          bitPos++
        }
      }
      const [r, g, bl] = CB_PAL[ci]
      ctx.fillStyle = `rgb(${r},${g},${bl})`
      ctx.fillRect(CB_OFFSET + col * CB_CELL, CB_OFFSET + row * CB_CELL, CB_CELL - 1, CB_CELL - 1)
    }
  }
}

function toHSV(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) {
    if (max === r)      h = ((g - b) / d % 6) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else                h = ((r - g) / d + 4) / 6
    if (h < 0) h += 1
  }
  return [h, max ? d / max : 0, max]
}

type Pt2 = [number, number]

// Detect anchor centroids. Each anchor is searched only in its expected quadrant
// so wider hue ranges don't cause cross-anchor confusion.
function findAnchors(data: Uint8ClampedArray, W: number, H: number): (Pt2 | null)[] {
  const hW = W / 2, hH = H / 2
  // [xMin, xMax, yMin, yMax, hLo, hHi, hLo2?, hHi2?] — 2nd range handles hue wrap-around
  const specs: [number,number,number,number,number,number,number?,number?][] = [
    [0,  hW, 0,  hH, 0.0,  0.18],              // TL: orange  ~30°, wider window
    [hW, W,  0,  hH, 0.17, 0.37],              // TR: lime    ~90°, wider window
    [0,  hW, hH, H,  0.47, 0.67],              // BL: azure  ~210°, wider window
    [hW, W,  hH, H,  0.77, 1.0,  0.0,  0.07], // BR: rose   ~330°, wraps through 0
  ]
  return specs.map(([x0, x1, y0, y1, hLo, hHi, hLo2, hHi2]) => {
    let sumX = 0, sumY = 0, cnt = 0
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * 4
      const [h, s, v] = toHSV(data[i], data[i + 1], data[i + 2])
      if (s < 0.45 || v < 0.2) continue
      const match = (h >= hLo && h <= hHi) || (hLo2 !== undefined && h >= hLo2 && h <= hHi2!)
      if (match) { sumX += x; sumY += y; cnt++ }
    }
    return cnt < 200 ? null : [sumX / cnt, sumY / cnt] as Pt2
  })
}

// Map barcode space → camera space via bilinear interpolation from 4 anchor corners.
function barcodeToCamera(bx: number, by: number, anc: Pt2[]): Pt2 {
  const u = (bx - ANC_CTR) / (ANC_FAR - ANC_CTR)
  const v = (by - ANC_CTR) / (ANC_FAR - ANC_CTR)
  const [tl, tr, bl, br] = anc
  return [
    tl[0]*(1-u)*(1-v) + tr[0]*u*(1-v) + bl[0]*(1-u)*v + br[0]*u*v,
    tl[1]*(1-u)*(1-v) + tr[1]*u*(1-v) + bl[1]*(1-u)*v + br[1]*u*v,
  ]
}

function samplePixel(data: Uint8ClampedArray, W: number, H: number, cx: number, cy: number): [number, number, number] {
  let r = 0, g = 0, b = 0, n = 0
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const px = Math.round(cx + dx), py = Math.round(cy + dy)
    if (px < 0 || px >= W || py < 0 || py >= H) continue
    const i = (py * W + px) * 4; r += data[i]; g += data[i + 1]; b += data[i + 2]; n++
  }
  return n ? [r / n, g / n, b / n] : [0, 0, 0]
}

function nearestPalette(r: number, g: number, b: number): number {
  let best = Infinity, idx = 0
  for (let ci = 0; ci < CB_PAL.length; ci++) {
    const [pr, pg, pb] = CB_PAL[ci]
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
    if (d < best) { best = d; idx = ci }
  }
  return idx
}

function cbDecode(img: ImageData, anchors: (Pt2 | null)[]): { payload: string | null; len: number } {
  const { data, width: W, height: H } = img
  const allFound = anchors.every(p => p !== null)

  function toCamera(bx: number, by: number): Pt2 {
    if (allFound) return barcodeToCamera(bx, by, anchors as Pt2[])
    // Fallback: assume barcode fills entire camera frame
    return [bx / CB_SIZE * W, by / CB_SIZE * H]
  }

  const bits: number[] = []
  for (let row = 0; row < CB_GRID; row++) for (let col = 0; col < CB_GRID; col++) {
    const [cx, cy] = toCamera(CB_OFFSET + col * CB_CELL + CB_CELL / 2 - 0.5, CB_OFFSET + row * CB_CELL + CB_CELL / 2 - 0.5)
    const [r, g, b] = samplePixel(data, W, H, cx, cy)
    const ci = nearestPalette(r, g, b)
    bits.push((ci >> 2) & 1, (ci >> 1) & 1, ci & 1)
  }

  let len = 0
  for (let i = 0; i < 16; i++) len = (len << 1) | (bits[i] ?? 0)
  if (len <= 0 || len > 232) return { payload: null, len }

  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    let byte = 0
    for (let b = 0; b < 8; b++) byte = (byte << 1) | (bits[16 + i * 8 + b] ?? 0)
    bytes[i] = byte
  }
  try {
    const s = new TextDecoder().decode(bytes)
    return { payload: s.startsWith('FH|') ? s : null, len }
  } catch { return { payload: null, len } }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function uint8ToBase64(arr: Uint8Array): string {
  let s = ''
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i])
  return btoa(s)
}

function base64ToUint8(b64: string): Uint8Array {
  const s = atob(b64)
  const buf = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i)
  return buf
}

function formatBytes(n: number): string {
  if (n < 1024)    return `${n} B`
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1048576).toFixed(2)} MB`
}

// Protocol:
//   Header: FH|H|{K}|{encodedName}|{byteSize}
//   Packet: FH|{seed}|{K}|{base64}

type HeaderInfo = { K: number; name: string; byteSize: number }

function parsePayload(raw: string):
  | { type: 'header'; info: HeaderInfo }
  | { type: 'packet'; seed: number; K: number; data: Uint8Array }
  | null
{
  if (!raw.startsWith('FH|')) return null
  const parts = raw.split('|')
  if (parts[1] === 'H' && parts.length >= 5) {
    const K = parseInt(parts[2]), byteSize = parseInt(parts[4])
    if (isNaN(K) || isNaN(byteSize)) return null
    return { type: 'header', info: { K, name: decodeURIComponent(parts[3]), byteSize } }
  }
  const seed = parseInt(parts[1]), K = parseInt(parts[2])
  if (isNaN(seed) || isNaN(K) || parts.length < 4) return null
  return { type: 'packet', seed, K, data: base64ToUint8(parts[3]) }
}

async function makeQR(data: string): Promise<string> {
  return QRCode.toDataURL(data, { errorCorrectionLevel: 'M', margin: 2, width: 300 })
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

type Mode = 'qr' | 'cb'

const CHUNK_OPTS_QR = [
  { value: 100, label: '100 B — fastest scan' },
  { value: 200, label: '200 B — fast scan'    },
  { value: 300, label: '300 B — easy scan'    },
  { value: 500, label: '500 B — balanced'     },
] as const

// CB max payload ~232 bytes. After ~18 chars protocol overhead + base64(3/4): ~140 B max chunk.
const CHUNK_OPTS_CB = [
  { value: 60,  label: '60 B — safest'  },
  { value: 100, label: '100 B — medium' },
  { value: 130, label: '130 B — max'    },
] as const

const SPEED_OPTS = [
  { value: 0,    label: 'Manual'  },
  { value: 50,   label: '0.05 s'  },
  { value: 100,  label: '0.1 s'   },
  { value: 250,  label: '0.25 s'  },
  { value: 500,  label: '0.5 s'   },
  { value: 1000, label: '1 s'     },
  { value: 2000, label: '2 s'     },
  { value: 3000, label: '3 s'     },
] as const

// ─── SHARED STYLES ───────────────────────────────────────────────────────────

const btnBase   = 'px-4 py-2 text-sm rounded border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
const btnGold   = `${btnBase} border-[#c4af64]/40 text-[#c4af64] hover:bg-[#c4af64]/10`
const btnDanger = `${btnBase} border-red-500/40 text-red-400 hover:bg-red-500/10`
const btnGhost  = `${btnBase} border-[#2a2d3a] text-[#9ca3af] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]`
const selectCls = 'bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] text-sm rounded px-2 py-1.5 focus:outline-none focus:border-[#c4af64]/50 cursor-pointer'

// ─── ENCODER STATE ───────────────────────────────────────────────────────────

type EncState = { sources: Uint8Array[]; cdf: number[]; K: number; name: string; byteSize: number }

// ─── OUTPUT PANEL ────────────────────────────────────────────────────────────

function OutputPanel({ mode }: { mode: Mode }) {
  const [rawFile,   setRawFile]   = useState<File | null>(null)
  const [enc,       setEnc]       = useState<EncState | null>(null)
  const [chunkSize, setChunkSize] = useState(500)
  const [packetNum, setPacketNum] = useState(0)
  const [qrUrl,     setQrUrl]     = useState<string | null>(null)
  const [speedMs,   setSpeedMs]   = useState(250)
  const [running,   setRunning]   = useState(false)
  const cbCanvasRef = useRef<HTMLCanvasElement>(null)

  const chunkOpts = mode === 'qr' ? CHUNK_OPTS_QR : CHUNK_OPTS_CB

  // Reset chunk size and state when mode changes
  useEffect(() => {
    setChunkSize(mode === 'qr' ? 500 : 100) // eslint-disable-line react-hooks/set-state-in-effect
    setRunning(false)
    setPacketNum(0)
  }, [mode])

  // Build encoder when file or chunk size changes
  useEffect(() => {
    if (!rawFile) return
    let live = true
    rawFile.arrayBuffer().then(buf => {
      if (!live) return
      const bytes = new Uint8Array(buf)
      const K = Math.max(1, Math.ceil(bytes.length / chunkSize))
      const sources = Array.from({ length: K }, (_, i) => {
        const s = new Uint8Array(chunkSize)
        s.set(bytes.slice(i * chunkSize, (i + 1) * chunkSize))
        return s
      })
      setEnc({ sources, cdf: buildCDF(K), K, name: rawFile.name, byteSize: bytes.length })
      setPacketNum(0)
      setRunning(false)
    })
    return () => { live = false }
  }, [rawFile, chunkSize])

  // QR mode: generate data URL
  useEffect(() => {
    if (mode !== 'qr') { setQrUrl(null); return } // eslint-disable-line react-hooks/set-state-in-effect
    if (!enc) { setQrUrl(null); return }
    let live = true
    const payload = packetNum === 0
      ? `FH|H|${enc.K}|${encodeURIComponent(enc.name)}|${enc.byteSize}`
      : `FH|${packetNum}|${enc.K}|${ltEncode(enc.sources, packetNum, enc.cdf)}`
    makeQR(payload).then(url => { if (live) setQrUrl(url) })
    return () => { live = false }
  }, [mode, enc, packetNum])

  // CB mode: render to canvas synchronously
  useEffect(() => {
    if (mode !== 'cb' || !enc || !cbCanvasRef.current) return
    const payload = packetNum === 0
      ? `FH|H|${enc.K}|${encodeURIComponent(enc.name)}|${enc.byteSize}`
      : `FH|${packetNum}|${enc.K}|${ltEncode(enc.sources, packetNum, enc.cdf)}`
    cbRender(payload, cbCanvasRef.current)
  }, [mode, enc, packetNum])

  // Auto-advance — fountain runs indefinitely
  useEffect(() => {
    if (!running || speedMs === 0) return
    const t = setTimeout(() => setPacketNum(n => n + 1), speedMs)
    return () => clearTimeout(t)
  }, [running, speedMs, packetNum])

  const label = packetNum === 0 ? 'Header' : `Packet ${packetNum}`
  const isCB  = mode === 'cb'

  // Nav bar used by both modes
  const NavBar = (
    <div className="flex border-t border-gray-200" style={{ width: isCB ? '100%' : '300px' }}>
      <button
        className="px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
        onClick={() => { setPacketNum(0); setRunning(false) }}
        disabled={packetNum === 0}
        title="Back to header"
      >⇤</button>
      <div className="w-px bg-gray-200" />
      <button
        className="flex-1 py-1.5 text-sm text-gray-400 hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
        onClick={() => setPacketNum(n => Math.max(0, n - 1))}
        disabled={packetNum === 0}
      >← Prev</button>
      <div className="w-px bg-gray-200" />
      <button
        className="flex-1 py-1.5 text-sm text-gray-400 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
        onClick={() => setPacketNum(n => n + 1)}
      >Next →</button>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className={`${btnGold} cursor-pointer`}>
          Choose File
          <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setRawFile(f) }} />
        </label>
        <select className={selectCls} value={chunkSize} onChange={e => setChunkSize(+e.target.value)}>
          {chunkOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {rawFile && <span className="text-sm text-[#6b7280] truncate max-w-[180px]">{rawFile.name}</span>}
      </div>

      {enc && (
        <>
          <div className="text-sm text-[#6b7280] tabular-nums">
            {formatBytes(enc.byteSize)} · {enc.K} source chunk{enc.K !== 1 ? 's' : ''} · ~{Math.ceil(enc.K * 1.15)} packets needed
          </div>

          {enc.K > 400 && (() => {
            const opts = isCB ? CHUNK_OPTS_CB : CHUNK_OPTS_QR
            const recommended = [...opts].reverse().find(o => Math.ceil(enc.byteSize / o.value) <= 400)
            return (
              <div className="text-xs text-amber-400/80 bg-amber-400/5 border border-amber-400/20 rounded px-3 py-2">
                Large transfer ({enc.K} chunks). Needs ~{Math.ceil(enc.K * 1.15)} unique packets to decode.
                {recommended && ` Try ${recommended.value} B chunks (~${Math.ceil(enc.byteSize / recommended.value)} chunks).`}
              </div>
            )
          })()}

          {/* QR mode display */}
          {!isCB && qrUrl && (
            <div className="flex flex-col items-center gap-0">
              <div className="bg-white text-black rounded-t px-6 py-2 font-mono font-bold text-base text-center leading-tight w-[300px]">
                {label}
                <div className="text-[11px] font-normal text-[#444] truncate mt-0.5">{enc.name}</div>
              </div>
              {NavBar}
              <img src={qrUrl} alt="QR code" width={300} height={300} className="block" />
            </div>
          )}

          {/* CB mode display — no white elements above canvas so camera samples only barcode */}
          {isCB && enc && (
            <div className="flex flex-col gap-1">
              <canvas ref={cbCanvasRef} className="block w-full rounded" style={{ imageRendering: 'pixelated' }} />
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-[#6b7280] font-mono tabular-nums">{label}</span>
                <span className="text-xs text-[#4b5563] truncate max-w-[200px]">{enc.name}</span>
              </div>
              {NavBar}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <select className={selectCls} value={speedMs} onChange={e => { setSpeedMs(+e.target.value); setRunning(false) }}>
              {SPEED_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {speedMs > 0 && (
              <button
                className={running ? btnDanger : btnGold}
                onClick={() => { if (running) { setRunning(false) } else { setPacketNum(0); setRunning(true) } }}
              >
                {running ? 'Pause' : 'Start'}
              </button>
            )}
          </div>
        </>
      )}

      {!enc && (
        <p className="text-sm text-[#6b7280]">
          {isCB
            ? 'Choose a file. The receiver needs to fill the guide rectangle with their camera. Anchors enable perspective correction automatically.'
            : 'Choose a file to begin. Show the Header QR first, then stream fountain packets — the receiver decodes when it has enough unique packets, in any order.'}
        </p>
      )}
    </div>
  )
}

// ─── INPUT PANEL ─────────────────────────────────────────────────────────────

function InputPanel({ mode }: { mode: Mode }) {
  const [scanning,     setScanning]     = useState(false)
  const [headerInfo,   setHeaderInfo]   = useState<HeaderInfo | null>(null)
  const [decodedCount, setDecodedCount] = useState(0)
  const [packetCount,  setPacketCount]  = useState(0)
  const [sourceK,      setSourceK]      = useState(0)
  const [startTime,    setStartTime]    = useState<number | null>(null)
  const [endTime,      setEndTime]      = useState<number | null>(null)
  const [error,        setError]        = useState('')

  const videoRef        = useRef<HTMLVideoElement>(null)
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const streamRef       = useRef<MediaStream | null>(null)
  const rafRef          = useRef(0)
  const activeRef       = useRef(false)
  const decoderRef      = useRef<LTDecoder | null>(null)
  const seenSeeds       = useRef<Set<number>>(new Set())
  const cdfRef          = useRef<{ K: number; cdf: number[] } | null>(null)
  const isDoneRef       = useRef(false)
  const anchorThrottRef = useRef(0)
  const [anchorsFound, setAnchorsFound] = useState(-1)
  const [cbDebugLen,   setCbDebugLen]   = useState<number | null>(null)

  const K      = headerInfo?.K ?? sourceK
  const isDone = K > 0 && decodedCount === K

  function getCDF(K: number): number[] {
    if (!cdfRef.current || cdfRef.current.K !== K) cdfRef.current = { K, cdf: buildCDF(K) }
    return cdfRef.current.cdf
  }

  async function startCamera() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()
      activeRef.current = true
      setScanning(true)
      scan()
    } catch {
      setError('Camera access denied. Allow camera access and try again.')
    }
  }

  function stopCamera() {
    activeRef.current = false
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  function processPayload(raw: string) {
    const parsed = parsePayload(raw)
    if (!parsed) return
    if (parsed.type === 'header') {
      setHeaderInfo(prev => prev ?? parsed.info)
    } else if (parsed.type === 'packet') {
      const { seed, K: pK, data } = parsed
      if (!seenSeeds.current.has(seed)) {
        seenSeeds.current.add(seed)
        if (seenSeeds.current.size === 1) setStartTime(Date.now())
        if (!decoderRef.current) {
          decoderRef.current = new LTDecoder(pK, data.length)
          setSourceK(pK)
        }
        if (decoderRef.current.K === pK) {
          const neighbors = neighborsForSeed(seed, pK, getCDF(pK))
          decoderRef.current.add(data, neighbors)
          setDecodedCount(decoderRef.current.decodedCount)
          setPacketCount(seenSeeds.current.size)
          if (decoderRef.current.decodedCount === pK && !isDoneRef.current) {
            isDoneRef.current = true
            setEndTime(Date.now())
          }
        }
      }
    }
  }

  function scan() {
    if (!activeRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      if (!activeRef.current) return
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) { scan(); return }
      const w = video.videoWidth || 640, h = video.videoHeight || 480
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(video, 0, 0, w, h)
      const img = ctx.getImageData(0, 0, w, h)

      if (mode === 'qr') {
        const result = jsQR(img.data, w, h)
        if (result?.data) processPayload(result.data)
      } else {
        const anchors = findAnchors(img.data, w, h)
        const { payload, len } = cbDecode(img, anchors)
        const now = Date.now()
        if (now - anchorThrottRef.current > 250) {
          anchorThrottRef.current = now
          setAnchorsFound(anchors.filter(Boolean).length)
          setCbDebugLen(len)
        }
        if (payload) processPayload(payload)
      }

      scan()
    })
  }

  function download() {
    const dec = decoderRef.current, info = headerInfo
    if (!dec || !info) return
    const out  = dec.reconstruct(info.byteSize)
    const blob = new Blob([out.buffer.slice(0) as ArrayBuffer])
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = info.name; a.click()
    URL.revokeObjectURL(url)
  }

  function reset() {
    stopCamera()
    setHeaderInfo(null); setDecodedCount(0); setPacketCount(0)
    setSourceK(0); setStartTime(null); setEndTime(null); setError('')
    decoderRef.current = null; seenSeeds.current = new Set()
    cdfRef.current = null; isDoneRef.current = false; setAnchorsFound(-1); setCbDebugLen(null)
  }

  useEffect(() => {
    return () => {
      activeRef.current = false
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const elapsedSec  = startTime && endTime ? (endTime - startTime) / 1000 : null
  const kbps        = elapsedSec && headerInfo ? (headerInfo.byteSize / 1024 / elapsedSec) : null

  return (
    <div className="flex flex-col gap-5">
      <div className="relative bg-[#0f1117] rounded-lg overflow-hidden aspect-square max-w-xs w-full mx-auto">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        {!scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[#4b5563] text-sm">Camera off</span>
          </div>
        )}
        {/* CB mode: fill-frame guide + anchor indicator */}
        {mode === 'cb' && scanning && (
          <>
            <div className="absolute inset-0 border-2 border-dashed border-[#c4af64]/40 rounded-lg pointer-events-none" />
            <div className={`absolute top-2 left-2 text-xs font-mono px-2 py-1 rounded bg-black/70 ${anchorsFound === 4 ? 'text-[#4ade80]' : anchorsFound > 0 ? 'text-amber-400' : 'text-[#6b7280]'}`}>
              anchors {anchorsFound < 0 ? '—' : `${anchorsFound}/4`}
              {cbDebugLen !== null && (
                <span className={cbDebugLen > 0 && cbDebugLen <= 232 ? ' text-[#4ade80]' : ' text-red-400'}>
                  {' '}len={cbDebugLen}
                </span>
              )}
            </div>
          </>
        )}
        {scanning && packetCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-[#4ade80] text-xs font-mono px-2 py-1 rounded tabular-nums">
            {decodedCount}&thinsp;/&thinsp;{K || '?'}
          </div>
        )}
      </div>

      {(headerInfo || packetCount > 0) && (
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4 flex flex-col gap-3">
          {headerInfo && (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xs text-[#6b7280] uppercase tracking-widest shrink-0">File</span>
              <span className="text-sm text-[#e2e4ed] font-medium truncate flex-1">{headerInfo.name}</span>
              <span className="text-xs text-[#6b7280] tabular-nums shrink-0">{formatBytes(headerInfo.byteSize)}</span>
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs text-[#6b7280] mb-1">
              <span>Decoded</span>
              <span className="tabular-nums">{decodedCount}&thinsp;/&thinsp;{K || '?'}</span>
            </div>
            <div className="h-2 bg-[#0f1117] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c4af64] rounded-full transition-all duration-300"
                style={{ width: K > 0 ? `${(decodedCount / K) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {!isDone && (
            <p className="text-xs text-[#6b7280] tabular-nums">
              {packetCount} unique packet{packetCount !== 1 ? 's' : ''} received
            </p>
          )}

          {isDone && (
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <div className="w-2 h-2 rounded-full bg-[#4ade80] shrink-0" />
              <span className="text-sm text-[#4ade80] font-medium">Transfer complete</span>
              {elapsedSec !== null && kbps !== null && (
                <span className="text-xs text-[#6b7280] tabular-nums">
                  {elapsedSec.toFixed(1)}s · {kbps.toFixed(1)} KB/s
                </span>
              )}
              <button className={`${btnGold} ml-auto`} onClick={download}>Download</button>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 flex-wrap items-center">
        {error && <p className="text-xs text-red-400 w-full">{error}</p>}
        <button className={scanning ? btnDanger : btnGold} onClick={scanning ? stopCamera : () => void startCamera()}>
          {scanning ? 'Stop Camera' : 'Start Camera'}
        </button>
        {(headerInfo !== null || packetCount > 0) && (
          <button className={btnGhost} onClick={reset}>Reset</button>
        )}
      </div>

      {!headerInfo && packetCount === 0 && (
        <p className="text-sm text-[#6b7280]">
          {mode === 'cb'
            ? 'Fill the entire camera frame with the barcode. Anchor detection (shown top-left) enables perspective correction when all 4 are found.'
            : 'Point your camera at the QR codes from the Output device. Any packet order works — the fountain decoder accumulates packets until it can reconstruct the file.'}
        </p>
      )}
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export function QrDataXfer() {
  const [mode, setMode] = useState<Mode>('qr')
  const [tab,  setTab]  = useState<'output' | 'input'>('output')

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-[#e2e4ed]">QR Data Transfer</h1>
        <div className="flex rounded border border-[#2a2d3a] overflow-hidden text-sm">
          {(['output', 'input'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 cursor-pointer transition-colors ${
                tab === t ? 'bg-[#c4af64]/10 text-[#c4af64]' : 'text-[#6b7280] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]'
              }`}
            >
              {t === 'output' ? 'Output' : 'Input'}
            </button>
          ))}
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex rounded border border-[#2a2d3a] overflow-hidden text-xs mb-5 self-start w-fit">
        {([['qr', 'QR Code'], ['cb', 'Color Barcode']] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 cursor-pointer transition-colors ${
              mode === m ? 'bg-[#c4af64]/10 text-[#c4af64]' : 'text-[#6b7280] hover:text-[#e2e4ed] hover:bg-[#2a2d3a]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'output' ? <OutputPanel mode={mode} /> : <InputPanel mode={mode} />}
    </div>
  )
}
