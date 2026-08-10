import { useState, useRef, useCallback, useEffect } from 'react'

// ── colour math ──────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null
  const n = parseInt(clean, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0)
    : max === gn ? (bn - rn) / d + 2
    : (rn - gn) / d + 4
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100, ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = ln - c / 2
  const [rp, gp, bp] = h < 60 ? [c, x, 0]
    : h < 120 ? [x, c, 0]
    : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c]
    : h < 300 ? [x, 0, c]
    : [c, 0, x]
  return [Math.round((rp + m) * 255), Math.round((gp + m) * 255), Math.round((bp + m) * 255)]
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const v = max, d = max - min
  const s = max === 0 ? 0 : d / max
  let h = 0
  if (d !== 0) {
    h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0)
      : max === gn ? (bn - rn) / d + 2
      : (rn - gn) / d + 4
    h /= 6
  }
  return [h * 360, s, v]
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h / 60) % 6
  const f = h / 60 - Math.floor(h / 60)
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s)
  const [r, g, b] = [
    [v, q, p, p, t, v],
    [t, v, v, q, p, p],
    [p, p, t, v, v, q],
  ].map(ch => ch[i])
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

function lin(c: number) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
function gam(c: number) { return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055 }

function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const lr = lin(r / 255), lg = lin(g / 255), lb = lin(b / 255)
  return [
    lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375,
    lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750,
    lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041,
  ]
}

function xyzToRgb(x: number, y: number, z: number): [number, number, number] {
  const lr = x * 3.2404542 - y * 1.5371385 - z * 0.4985314
  const lg = -x * 0.9692660 + y * 1.8760108 + z * 0.0415560
  const lb = x * 0.0556434 - y * 0.2040259 + z * 1.0572252
  return [
    Math.round(Math.max(0, Math.min(255, gam(lr) * 255))),
    Math.round(Math.max(0, Math.min(255, gam(lg) * 255))),
    Math.round(Math.max(0, Math.min(255, gam(lb) * 255))),
  ]
}

const D65 = [0.95047, 1.0, 1.08883] as const

const MAG_HALF = 5               // pixels on each side of center
const MAG_ZOOM = 10              // display pixels per source pixel
const MAG_SIZE = (MAG_HALF * 2 + 1) * MAG_ZOOM  // 110px

function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116
  const fx = f(x / D65[0]), fy = f(y / D65[1]), fz = f(z / D65[2])
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

function labToXyz(L: number, a: number, b: number): [number, number, number] {
  const fy = (L + 16) / 116, fx = a / 500 + fy, fz = fy - b / 200
  const f3 = (t: number) => t > 0.206897 ? t * t * t : (t - 16 / 116) / 7.787
  return [D65[0] * f3(fx), D65[1] * f3(fy), D65[2] * f3(fz)]
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  return xyzToLab(...rgbToXyz(r, g, b))
}

function labToRgb(L: number, a: number, b: number): [number, number, number] {
  return xyzToRgb(...labToXyz(L, a, b))
}

function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const lr = lin(r / 255), lg = lin(g / 255), lb = lin(b / 255)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ]
}

function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  return [
    Math.round(Math.max(0, Math.min(255, gam(lr) * 255))),
    Math.round(Math.max(0, Math.min(255, gam(lg) * 255))),
    Math.round(Math.max(0, Math.min(255, gam(lb) * 255))),
  ]
}

// ── component ─────────────────────────────────────────────────────────────────

export function ColourConverter() {
  const [hue, setHue] = useState(47)
  const [sat, setSat] = useState(0.7)
  const [val, setVal] = useState(0.75)
  const [alpha, setAlpha] = useState(1.0)
  const [hasImage, setHasImage] = useState(false)

  const [hex, setHex] = useState('')
  const [rgbStr, setRgbStr] = useState('')
  const [rgbaStr, setRgbaStr] = useState('')
  const [hslStr, setHslStr] = useState('')
  const [hslaStr, setHslaStr] = useState('')
  const [labStr, setLabStr] = useState('')
  const [oklabStr, setOklabStr] = useState('')
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')
  const [history, setHistory] = useState<string[]>([])

  const [hoverPos, setHoverPos] = useState<{ left: number; top: number } | null>(null)

  const gradientRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const alphaBarRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const magnifierRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const draggingGradient = useRef(false)
  const draggingHue = useRef(false)
  const draggingAlpha = useRef(false)
  const latestHexRef = useRef('')
  const alphaRef = useRef(1.0)


  const addToHistory = useCallback((canonical: string) => {
    setHistory(prev => {
      const filtered = prev.filter(c => c !== canonical)
      return [canonical, ...filtered].slice(0, 20)
    })
  }, [])

  const updateFromHsv = useCallback((h: number, s: number, v: number) => {
    setHue(h); setSat(s); setVal(v)
    const [r, g, b] = hsvToRgb(h, s, v)
    const newHex = rgbToHex(r, g, b)
    const [hl, sl, l] = rgbToHsl(r, g, b)
    const [L, aL, bL] = rgbToLab(r, g, b)
    const [Lok, aOk, bOk] = rgbToOklab(r, g, b)
    const a = alphaRef.current
    latestHexRef.current = newHex
    setHex(newHex)
    setRgbStr(`${r}, ${g}, ${b}`)
    setRgbaStr(`${r}, ${g}, ${b}, ${a.toFixed(2)}`)
    setHslStr(`${hl}, ${sl}%, ${l}%`)
    setHslaStr(`${hl}, ${sl}%, ${l}%, ${a.toFixed(2)}`)
    setLabStr(`${L.toFixed(2)}, ${aL.toFixed(2)}, ${bL.toFixed(2)}`)
    setOklabStr(`${Lok.toFixed(4)}, ${aOk.toFixed(4)}, ${bOk.toFixed(4)}`)
    setError('')
  }, [])

  const updateFromRgb = useCallback((r: number, g: number, b: number) => {
    const [h, s, v] = rgbToHsv(r, g, b)
    setHue(h); setSat(s); setVal(v)
    const newHex = rgbToHex(r, g, b)
    const [hl, sl, l] = rgbToHsl(r, g, b)
    const [L, aL, bL] = rgbToLab(r, g, b)
    const [Lok, aOk, bOk] = rgbToOklab(r, g, b)
    const a = alphaRef.current
    latestHexRef.current = newHex
    setHex(newHex)
    setRgbStr(`${r}, ${g}, ${b}`)
    setRgbaStr(`${r}, ${g}, ${b}, ${a.toFixed(2)}`)
    setHslStr(`${hl}, ${sl}%, ${l}%`)
    setHslaStr(`${hl}, ${sl}%, ${l}%, ${a.toFixed(2)}`)
    setLabStr(`${L.toFixed(2)}, ${aL.toFixed(2)}, ${bL.toFixed(2)}`)
    setOklabStr(`${Lok.toFixed(4)}, ${aOk.toFixed(4)}, ${bOk.toFixed(4)}`)
    setError('')
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect,react-hooks/exhaustive-deps
  useEffect(() => { updateFromHsv(47, 0.7, 0.75) }, [])

  // ── gradient picker drag ──────────────────────────────────────────────────

  const updateGradientFromEvent = useCallback((e: MouseEvent | Touch) => {
    const el = gradientRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))
    updateFromHsv(hue, s, v)
  }, [hue, updateFromHsv])

  const onGradientMouseDown = useCallback((e: React.MouseEvent) => {
    draggingGradient.current = true
    updateGradientFromEvent(e.nativeEvent)
  }, [updateGradientFromEvent])

  // ── hue bar drag ──────────────────────────────────────────────────────────

  const updateHueFromEvent = useCallback((e: MouseEvent | Touch) => {
    const el = hueRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360))
    updateFromHsv(h, sat, val)
  }, [sat, val, updateFromHsv])

  const onHueMouseDown = useCallback((e: React.MouseEvent) => {
    draggingHue.current = true
    updateHueFromEvent(e.nativeEvent)
  }, [updateHueFromEvent])

  // ── alpha bar drag ────────────────────────────────────────────────────────

  const updateAlphaFromEvent = useCallback((e: MouseEvent | Touch) => {
    const el = alphaBarRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const a = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    alphaRef.current = a
    setAlpha(a)
    const rgb = hexToRgb(latestHexRef.current)
    if (rgb) {
      const [r, g, b] = rgb
      const [hl, sl, l] = rgbToHsl(r, g, b)
      setRgbaStr(`${r}, ${g}, ${b}, ${a.toFixed(2)}`)
      setHslaStr(`${hl}, ${sl}%, ${l}%, ${a.toFixed(2)}`)
    }
  }, [])

  const onAlphaMouseDown = useCallback((e: React.MouseEvent) => {
    draggingAlpha.current = true
    updateAlphaFromEvent(e.nativeEvent)
  }, [updateAlphaFromEvent])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (draggingGradient.current) updateGradientFromEvent(e)
      if (draggingHue.current) updateHueFromEvent(e)
      if (draggingAlpha.current) updateAlphaFromEvent(e)
    }
    function onMouseUp(e: MouseEvent) {
      if (draggingGradient.current) {
        updateGradientFromEvent(e); draggingGradient.current = false
        addToHistory(latestHexRef.current)
      }
      if (draggingHue.current) {
        updateHueFromEvent(e); draggingHue.current = false
        addToHistory(latestHexRef.current)
      }
      if (draggingAlpha.current) {
        updateAlphaFromEvent(e); draggingAlpha.current = false
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [updateGradientFromEvent, updateHueFromEvent, updateAlphaFromEvent, addToHistory])

  // ── text input handlers ───────────────────────────────────────────────────

  function fromHex(v: string) {
    setHex(v); setError('')
    const rgb = hexToRgb(v)
    if (!rgb) { setError('Invalid HEX'); return }
    const [r, g, b] = rgb
    const [h, s, vv] = rgbToHsv(r, g, b)
    setHue(h); setSat(s); setVal(vv)
    const canonical = rgbToHex(r, g, b)
    latestHexRef.current = canonical
    const [hl, sl, l] = rgbToHsl(r, g, b)
    const [L, aL, bL] = rgbToLab(r, g, b)
    const [Lok, aOk, bOk] = rgbToOklab(r, g, b)
    const a = alphaRef.current
    setRgbStr(`${r}, ${g}, ${b}`)
    setRgbaStr(`${r}, ${g}, ${b}, ${a.toFixed(2)}`)
    setHslStr(`${hl}, ${sl}%, ${l}%`)
    setHslaStr(`${hl}, ${sl}%, ${l}%, ${a.toFixed(2)}`)
    setLabStr(`${L.toFixed(2)}, ${aL.toFixed(2)}, ${bL.toFixed(2)}`)
    setOklabStr(`${Lok.toFixed(4)}, ${aOk.toFixed(4)}, ${bOk.toFixed(4)}`)
  }

  function fromRgb(v: string) {
    setRgbStr(v); setError('')
    const parts = v.split(',').map(p => parseInt(p.trim()))
    if (parts.length !== 3 || parts.some(isNaN) || parts.some(x => x < 0 || x > 255)) {
      setError('Invalid RGB (use: R, G, B)'); return
    }
    updateFromRgb(parts[0], parts[1], parts[2])
  }

  function fromRgba(v: string) {
    setRgbaStr(v); setError('')
    const parts = v.split(',').map(p => p.trim())
    if (parts.length !== 4) { setError('Invalid RGBA (use: R, G, B, A)'); return }
    const [r, g, b] = parts.slice(0, 3).map(p => parseInt(p))
    const a = parseFloat(parts[3])
    if ([r, g, b].some(isNaN) || [r, g, b].some(x => x < 0 || x > 255)) { setError('Invalid RGBA (use: R, G, B, A)'); return }
    if (isNaN(a) || a < 0 || a > 1) { setError('Alpha must be 0–1'); return }
    alphaRef.current = a
    setAlpha(a)
    updateFromRgb(r, g, b)
  }

  function fromHsl(v: string) {
    setHslStr(v); setError('')
    const parts = v.split(',').map(p => parseInt(p.trim().replace('%', '')))
    if (parts.length !== 3 || parts.some(isNaN)) { setError('Invalid HSL (use: H, S%, L%)'); return }
    const [h, s, l] = parts
    if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) { setError('Invalid HSL values'); return }
    const [r, g, b] = hslToRgb(h, s, l)
    const [hv, sv, vv] = rgbToHsv(r, g, b)
    setHue(hv); setSat(sv); setVal(vv)
    const newHex = rgbToHex(r, g, b)
    latestHexRef.current = newHex
    setHex(newHex)
    const a = alphaRef.current
    const [hl2, sl2, l2] = rgbToHsl(r, g, b)
    const [L, aL, bL] = rgbToLab(r, g, b)
    const [Lok, aOk, bOk] = rgbToOklab(r, g, b)
    setRgbStr(`${r}, ${g}, ${b}`)
    setRgbaStr(`${r}, ${g}, ${b}, ${a.toFixed(2)}`)
    // keep hslStr as user typed
    setHslaStr(`${hl2}, ${sl2}%, ${l2}%, ${a.toFixed(2)}`)
    setLabStr(`${L.toFixed(2)}, ${aL.toFixed(2)}, ${bL.toFixed(2)}`)
    setOklabStr(`${Lok.toFixed(4)}, ${aOk.toFixed(4)}, ${bOk.toFixed(4)}`)
  }

  function fromHsla(v: string) {
    setHslaStr(v); setError('')
    const parts = v.split(',').map(p => p.trim().replace('%', ''))
    if (parts.length !== 4) { setError('Invalid HSLA (use: H, S%, L%, A)'); return }
    const [h, s, l, a] = parts.map(p => parseFloat(p))
    if ([h, s, l, a].some(isNaN)) { setError('Invalid HSLA (use: H, S%, L%, A)'); return }
    if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100 || a < 0 || a > 1) { setError('Invalid HSLA values'); return }
    alphaRef.current = a
    setAlpha(a)
    const [r, g, b] = hslToRgb(h, s, l)
    const [hv, sv, vv] = rgbToHsv(r, g, b)
    setHue(hv); setSat(sv); setVal(vv)
    const newHex = rgbToHex(r, g, b)
    latestHexRef.current = newHex
    setHex(newHex)
    const [hl2, sl2, l2] = rgbToHsl(r, g, b)
    const [L, aL, bL] = rgbToLab(r, g, b)
    const [Lok, aOk, bOk] = rgbToOklab(r, g, b)
    setRgbStr(`${r}, ${g}, ${b}`)
    setRgbaStr(`${r}, ${g}, ${b}, ${a.toFixed(2)}`)
    setHslStr(`${hl2}, ${sl2}%, ${l2}%`)
    // keep hslaStr as user typed
    setLabStr(`${L.toFixed(2)}, ${aL.toFixed(2)}, ${bL.toFixed(2)}`)
    setOklabStr(`${Lok.toFixed(4)}, ${aOk.toFixed(4)}, ${bOk.toFixed(4)}`)
  }

  function fromLab(v: string) {
    setLabStr(v); setError('')
    const parts = v.split(',').map(p => parseFloat(p.trim()))
    if (parts.length !== 3 || parts.some(isNaN)) { setError('Invalid LAB (use: L, a, b)'); return }
    const [L, a, b] = parts
    if (L < 0 || L > 100) { setError('LAB L must be 0–100'); return }
    const [r, g, bv] = labToRgb(L, a, b)
    updateFromRgb(r, g, bv)
    setLabStr(v) // restore after updateFromRgb overwrites it
  }

  function fromOklab(v: string) {
    setOklabStr(v); setError('')
    const parts = v.split(',').map(p => parseFloat(p.trim()))
    if (parts.length !== 3 || parts.some(isNaN)) { setError('Invalid OKLab (use: L, a, b)'); return }
    const [L, a, b] = parts
    if (L < 0 || L > 1) { setError('OKLab L must be 0–1'); return }
    const [r, g, bv] = oklabToRgb(L, a, b)
    updateFromRgb(r, g, bv)
    setOklabStr(v) // restore after updateFromRgb overwrites it
  }

  function onCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const src = canvasRef.current
    const dst = magnifierRef.current
    if (!src || !dst) return
    const rect = src.getBoundingClientRect()
    const scaleX = src.width / rect.width
    const scaleY = src.height / rect.height
    const px = Math.round((e.clientX - rect.left) * scaleX)
    const py = Math.round((e.clientY - rect.top) * scaleY)
    const srcSize = MAG_HALF * 2 + 1
    dst.width = MAG_SIZE
    dst.height = MAG_SIZE
    const ctx = dst.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(src, px - MAG_HALF, py - MAG_HALF, srcSize, srcSize, 0, 0, MAG_SIZE, MAG_SIZE)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 0.5
    for (let i = 1; i < srcSize; i++) {
      const p = i * MAG_ZOOM
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, MAG_SIZE); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(MAG_SIZE, p); ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 1.5
    const cp = MAG_HALF * MAG_ZOOM
    ctx.strokeRect(cp + 0.75, cp + 0.75, MAG_ZOOM - 1.5, MAG_ZOOM - 1.5)
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const flipX = cx + 20 + MAG_SIZE > rect.width
    setHoverPos({
      left: flipX ? cx - 20 - MAG_SIZE : cx + 20,
      top: Math.max(0, Math.min(cy - MAG_SIZE / 2, rect.height - MAG_SIZE)),
    })
  }

  function onCanvasMouseLeave() {
    setHoverPos(null)
  }

  function commitCurrent() {
    const rgb = hexToRgb(hex)
    if (!rgb) return
    setHex(rgbToHex(...rgb))
    addToHistory(rgbToHex(...rgb))
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 1500)
  }

  // ── image picker ──────────────────────────────────────────────────────────

  const pendingImageRef = useRef<HTMLImageElement | null>(null)

  function loadImageToCanvas(file: File) {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { pendingImageRef.current = img; URL.revokeObjectURL(url); setHasImage(true) }
    img.src = url
  }

  useEffect(() => {
    const img = pendingImageRef.current
    const canvas = canvasRef.current
    if (!img || !canvas || !hasImage) return
    const maxW = 480, maxH = 240
    const scale = Math.min(1, maxW / img.width, maxH / img.height)
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    pendingImageRef.current = null
  }, [hasImage])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) loadImageToCanvas(file)
  }

  function onCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width))
    const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height))
    const [r, g, b] = canvas.getContext('2d')!.getImageData(x, y, 1, 1).data
    updateFromRgb(r, g, b)
    addToHistory(rgbToHex(r, g, b))
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      if (item) { const file = item.getAsFile(); if (file) loadImageToCanvas(file) }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  // ── derived display values ────────────────────────────────────────────────

  const swatchColor = hexToRgb(hex) ? hex : '#1a1d27'
  const hueColor = `hsl(${hue}, 100%, 50%)`

  const fields = [
    { label: 'HEX',   value: hex,      onChange: fromHex,   display: hex },
    { label: 'RGB',   value: rgbStr,   onChange: fromRgb,   display: `rgb(${rgbStr})` },
    { label: 'RGBA',  value: rgbaStr,  onChange: fromRgba,  display: `rgba(${rgbaStr})` },
    { label: 'HSL',   value: hslStr,   onChange: fromHsl,   display: `hsl(${hslStr})` },
    { label: 'HSLA',  value: hslaStr,  onChange: fromHsla,  display: `hsla(${hslaStr})` },
    { label: 'LAB',   value: labStr,   onChange: fromLab,   display: `lab(${labStr.split(',').map(s => s.trim()).join(' ')})` },
    { label: 'OKLAB', value: oklabStr, onChange: fromOklab, display: `oklab(${oklabStr.split(',').map(s => s.trim()).join(' ')})` },
  ]

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Colour Converter</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">

        {/* colour swatch */}
        <div className="w-full h-12 rounded-lg border border-[#2a2d3a] overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
          <div className="w-full h-full" style={{ backgroundColor: swatchColor, opacity: alpha }} />
        </div>

        {/* gradient picker */}
        <div
          ref={gradientRef}
          className="relative w-full h-48 rounded-lg cursor-crosshair select-none"
          style={{
            background: `linear-gradient(to right, #fff, ${hueColor}), linear-gradient(to bottom, transparent, #000)`,
            backgroundBlendMode: 'multiply',
          }}
          onMouseDown={onGradientMouseDown}
        >
          <div
            className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${sat * 100}%`, top: `${(1 - val) * 100}%`, backgroundColor: swatchColor }}
          />
        </div>

        {/* hue bar */}
        <div
          ref={hueRef}
          className="relative w-full h-4 rounded-full cursor-pointer select-none"
          style={{ background: 'linear-gradient(to right, #f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}
          onMouseDown={onHueMouseDown}
        >
          <div
            className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2"
            style={{ left: `${(hue / 360) * 100}%`, top: 0, backgroundColor: hueColor }}
          />
        </div>

        {/* alpha bar */}
        <div
          ref={alphaBarRef}
          className="relative w-full h-4 rounded-full cursor-pointer select-none overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(to right, transparent, ${swatchColor}), repeating-conic-gradient(#808080 0% 25%, #ffffff 0% 50%)`,
            backgroundSize: '100% 100%, 10px 10px',
          }}
          onMouseDown={onAlphaMouseDown}
        >
          <div
            className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2"
            style={{ left: `${alpha * 100}%`, top: 0, backgroundColor: swatchColor, opacity: alpha }}
          />
        </div>

        {/* colour history */}
        {history.length > 0 && (
          <div>
            <p className="text-xs text-[#6b7280] mb-1.5">History</p>
            <div className="flex gap-1.5 flex-wrap">
              {history.map((c, i) => (
                <button
                  key={i}
                  title={c}
                  onClick={() => { const rgb = hexToRgb(c); if (rgb) { updateFromRgb(...rgb); addToHistory(c) } }}
                  className="w-6 h-6 rounded border border-[#2a2d3a] hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* text inputs */}
        {/* eslint-disable-next-line react-hooks/refs */}
        {fields.map(({ label, value, onChange, display }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#6b7280]">{label}</label>
              <button
                onClick={() => copy(display, label)}
                className="text-xs text-[#c4af64] hover:text-[#e2e4ed] transition-colors cursor-pointer"
              >
                {copied === label ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <input
              className="forge-input-mono"
              value={value}
              onChange={e => onChange(e.target.value)}
              onBlur={commitCurrent}
            />
          </div>
        ))}

        {/* image picker */}
        <div>
          <p className="text-xs text-[#6b7280] mb-2">Pick from image</p>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 text-xs rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer"
            >
              Upload image
            </button>
            <span className="text-xs text-[#3a3d4a] self-center">or paste (Ctrl+V) anywhere</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          {hasImage && (
            <div className="relative inline-block">
              <canvas
                ref={canvasRef}
                onClick={onCanvasClick}
                onMouseMove={onCanvasMouseMove}
                onMouseLeave={onCanvasMouseLeave}
                className="rounded border border-[#2a2d3a] cursor-crosshair max-w-full block"
              />
              <canvas
                ref={magnifierRef}
                className="absolute pointer-events-none rounded border border-[#6b7280] shadow-xl z-10"
                style={hoverPos ? { left: hoverPos.left, top: hoverPos.top } : { display: 'none' }}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
