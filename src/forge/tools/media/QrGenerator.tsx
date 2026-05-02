import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import { Select } from '../../../components/Select'
import type { SelectOption } from '../../../components/Select'

const sizeOptions: SelectOption[] = [
  { value: '128', label: '128 px' },
  { value: '256', label: '256 px' },
  { value: '512', label: '512 px' },
]

export function QrGenerator() {
  const [text, setText] = useState('')
  const [fg, setFg] = useState('#000000')
  const [bg, setBg] = useState('#ffffff')
  const [size, setSize] = useState(256)
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const canvas = canvasRef.current
      if (!canvas) return
      if (!text.trim()) {
        const ctx = canvas.getContext('2d')
        if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height) }
        setError('')
        return
      }
      try {
        await QRCode.toCanvas(canvas, text, {
          width: size,
          margin: 2,
          color: { dark: fg, light: bg },
          errorCorrectionLevel: 'M',
        })
        setError('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to generate QR code')
      }
    }, 150)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [text, fg, bg, size])

  function download() {
    const canvas = canvasRef.current
    if (!canvas || !text.trim()) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'qr-code.png'
    a.click()
  }

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full"
  const btnClass = "px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">QR Code Generator</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-5">

        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Text or URL</label>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="https://example.com"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-[#6b7280] mb-1">Size</label>
            <Select
              options={sizeOptions}
              value={sizeOptions.find(o => o.value === String(size)) ?? null}
              onChange={opt => opt && setSize(Number(opt.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-[#6b7280] mb-1">Foreground</label>
            <div className="flex items-center gap-2">
              <input type="color" value={fg} onChange={e => setFg(e.target.value)}
                className="w-9 h-9 rounded cursor-pointer border border-[#2a2d3a] bg-[#0f1117] p-0.5" />
              <span className="text-xs text-[#6b7280] font-mono">{fg}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#6b7280] mb-1">Background</label>
            <div className="flex items-center gap-2">
              <input type="color" value={bg} onChange={e => setBg(e.target.value)}
                className="w-9 h-9 rounded cursor-pointer border border-[#2a2d3a] bg-[#0f1117] p-0.5" />
              <span className="text-xs text-[#6b7280] font-mono">{bg}</span>
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {text.trim() && (
          <div className="flex flex-col items-center gap-4 pt-2">
            <canvas ref={canvasRef} className="rounded border border-[#2a2d3a]" />
            <button onClick={download} className={btnClass}>
              Download PNG
            </button>
          </div>
        )}

        {!text.trim() && (
          <div className="flex justify-center py-4">
            <canvas ref={canvasRef} className="hidden" />
            <p className="text-xs text-[#3a3d4a]">Enter text or a URL above to generate a QR code</p>
          </div>
        )}
      </div>
    </div>
  )
}
