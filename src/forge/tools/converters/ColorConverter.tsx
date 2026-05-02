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
  const v = max
  const d = max - min
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
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  const [r, g, b] = [
    [v, q, p, p, t, v],
    [t, v, v, q, p, p],
    [p, p, t, v, v, q],
  ].map(ch => ch[i])
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

// ── component ─────────────────────────────────────────────────────────────────

export function ColorConverter() {
  const [hue, setHue] = useState(47)
  const [sat, setSat] = useState(0.7)
  const [val, setVal] = useState(0.75)
  const [hasImage, setHasImage] = useState(false)

  const [hex, setHex] = useState('')
  const [rgbStr, setRgbStr] = useState('')
  const [hslStr, setHslStr] = useState('')
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')
  const [history, setHistory] = useState<string[]>([])

  const gradientRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const draggingGradient = useRef(false)
  const draggingHue = useRef(false)
  // Tracks the most recently computed canonical hex — updated synchronously
  // inside updateFromHsv so mouseUp can read it without stale closure issues
  const latestHexRef = useRef('')

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono"

  const addToHistory = useCallback((canonical: string) => {
    setHistory(prev => {
      const filtered = prev.filter(c => c !== canonical)
      return [canonical, ...filtered].slice(0, 20)
    })
  }, [])

  // PICKER path: HSV → RGB via hsvToRgb (correct for gradient display)
  const updateFromHsv = useCallback((h: number, s: number, v: number) => {
    setHue(h); setSat(s); setVal(v)
    const [r, g, b] = hsvToRgb(h, s, v)
    const newHex = rgbToHex(r, g, b)
    const [hl, sl, l] = rgbToHsl(r, g, b)
    latestHexRef.current = newHex
    setHex(newHex)
    setRgbStr(`${r}, ${g}, ${b}`)
    setHslStr(`${hl}, ${sl}%, ${l}%`)
    setError('')
  }, [])

  // TEXT INPUT path: RGB → everything via direct conversions (no HSV roundtrip)
  // This avoids floating-point drift from RGB→HSV→RGB
  const updateFromRgb = useCallback((r: number, g: number, b: number) => {
    const [h, s, v] = rgbToHsv(r, g, b)
    setHue(h); setSat(s); setVal(v)
    const newHex = rgbToHex(r, g, b)
    const [hl, sl, l] = rgbToHsl(r, g, b)
    latestHexRef.current = newHex
    setHex(newHex)
    setRgbStr(`${r}, ${g}, ${b}`)
    setHslStr(`${hl}, ${sl}%, ${l}%`)
    setError('')
  }, [])

  // Init from default HSV
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

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (draggingGradient.current) updateGradientFromEvent(e)
      if (draggingHue.current) updateHueFromEvent(e)
    }
    function onMouseUp(e: MouseEvent) {
      if (draggingGradient.current) {
        updateGradientFromEvent(e)
        draggingGradient.current = false
        // latestHexRef is set synchronously by updateFromHsv inside updateGradientFromEvent
        addToHistory(latestHexRef.current)
      }
      if (draggingHue.current) {
        updateHueFromEvent(e)
        draggingHue.current = false
        addToHistory(latestHexRef.current)
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [updateGradientFromEvent, updateHueFromEvent, addToHistory])

  // ── text input handlers ───────────────────────────────────────────────────

  function parseRgb(s: string): [number, number, number] | null {
    const parts = s.split(',').map(p => parseInt(p.trim()))
    if (parts.length !== 3 || parts.some(isNaN) || parts.some(v => v < 0 || v > 255)) return null
    return parts as [number, number, number]
  }

  function parseHsl(s: string): [number, number, number] | null {
    const parts = s.split(',').map(p => parseInt(p.trim().replace('%', '')))
    if (parts.length !== 3 || parts.some(isNaN)) return null
    const [h, s2, l] = parts
    if (h < 0 || h > 360 || s2 < 0 || s2 > 100 || l < 0 || l > 100) return null
    return [h, s2, l]
  }

  // Hex typed: keep user's value in the hex field, update everything else from parsed RGB
  function fromHex(val: string) {
    setHex(val)
    setError('')
    const rgb = hexToRgb(val)
    if (!rgb) { setError('Invalid HEX'); return }
    const [r, g, b] = rgb
    const [h, s, v] = rgbToHsv(r, g, b)
    setHue(h); setSat(s); setVal(v)
    const canonical = rgbToHex(r, g, b)
    latestHexRef.current = canonical
    const [hl, sl, l] = rgbToHsl(r, g, b)
    setRgbStr(`${r}, ${g}, ${b}`)
    setHslStr(`${hl}, ${sl}%, ${l}%`)
  }

  // RGB typed: update everything from parsed RGB directly
  function fromRgb(val: string) {
    setRgbStr(val)
    setError('')
    const rgb = parseRgb(val)
    if (!rgb) { setError('Invalid RGB (use: R, G, B)'); return }
    updateFromRgb(...rgb)
  }

  // HSL typed: keep user's value in the HSL field, update everything else
  function fromHsl(val: string) {
    setHslStr(val)
    setError('')
    const hsl = parseHsl(val)
    if (!hsl) { setError('Invalid HSL (use: H, S%, L%)'); return }
    const [r, g, b] = hslToRgb(...hsl)
    const [h, s, v] = rgbToHsv(r, g, b)
    setHue(h); setSat(s); setVal(v)
    const newHex = rgbToHex(r, g, b)
    latestHexRef.current = newHex
    setHex(newHex)
    setRgbStr(`${r}, ${g}, ${b}`)
    // Don't overwrite hslStr — keep user's typed value
  }

  // Blur: just normalize and record history — no reconversion
  function commitCurrent() {
    const rgb = hexToRgb(hex)
    if (!rgb) return
    const canonical = rgbToHex(...rgb)
    setHex(canonical)
    addToHistory(canonical)
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
    img.onload = () => {
      pendingImageRef.current = img
      URL.revokeObjectURL(url)
      setHasImage(true)
    }
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

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Colour Converter</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">

        {/* colour swatch */}
        <div className="w-full h-12 rounded-lg border border-[#2a2d3a]" style={{ backgroundColor: swatchColor }} />

        {/* gradient picker */}
        <div
          ref={gradientRef}
          className="relative w-full h-48 rounded-lg cursor-crosshair select-none"
          style={{
            background: `linear-gradient(to right, #fff, ${hueColor}),
                         linear-gradient(to bottom, transparent, #000)`,
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
        {[
          { label: 'HEX', value: hex, onChange: fromHex, display: hex },
          { label: 'RGB', value: rgbStr, onChange: fromRgb, display: `rgb(${rgbStr})` },
          { label: 'HSL', value: hslStr, onChange: fromHsl, display: `hsl(${hslStr})` },
        ].map(({ label, value, onChange, display }) => (
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
              className={inputClass}
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
            <canvas
              ref={canvasRef}
              onClick={onCanvasClick}
              className="rounded border border-[#2a2d3a] cursor-crosshair max-w-full"
            />
          )}
        </div>

      </div>
    </div>
  )
}
