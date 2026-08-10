import { useState, useRef, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { Select } from '../../../components/Select'
import type { SelectOption } from '../../../components/Select'
import { FileDropZone } from '../../../components/FileDropZone'

const sizeOptions: SelectOption[] = [
  { value: '128', label: '128 px' },
  { value: '256', label: '256 px' },
  { value: '512', label: '512 px' },
]

function decodeImageFile(file: File): Promise<string | null> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(null); return }
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const result = jsQR(imageData.data, imageData.width, imageData.height)
        resolve(result ? result.data : null)
      }
      img.onerror = () => resolve(null)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

function QrDecoder({ onDecode }: { onDecode: (text: string) => void }) {
  const [decodeResult, setDecodeResult] = useState<string | null | 'none'>(null)

  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const result = await decodeImageFile(file)
    setDecodeResult(result ?? 'none')
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      if (!item) return
      const file = item.getAsFile()
      if (file) processFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs text-[#6b7280]">Decode QR Code</label>

      <FileDropZone accept="image/*" className="px-4 py-6" onFiles={files => processFile(files[0])}>
        <p className="text-sm text-[#6b7280]">Upload or drag & drop an image</p>
        <p className="text-xs text-[#3a3d4a] mt-1">or paste one with Ctrl+V / Cmd+V</p>
      </FileDropZone>

      {decodeResult === 'none' && (
        <p className="text-xs text-red-400">No QR code found in image.</p>
      )}

      {decodeResult && decodeResult !== 'none' && (
        <div className="flex items-start gap-3 bg-[#0f1117] border border-[#2a2d3a] rounded px-3 py-2">
          <p className="flex-1 text-sm text-[#e2e4ed] font-mono break-all">{decodeResult}</p>
          <button
            onClick={() => { onDecode(decodeResult); setDecodeResult(null) }}
            className="shrink-0 text-xs px-2.5 py-1 rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer"
          >
            Use
          </button>
        </div>
      )}

      <div className="border-t border-[#2a2d3a]" />
    </div>
  )
}

export function QrGenerator() {
  const [text, setText] = useState('')
  const [fg, setFg] = useState('#000000')
  const [bg, setBg] = useState('#ffffff')
  const [size, setSize] = useState(256)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const copyImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !text.trim()) return
    canvas.toBlob(blob => {
      if (!blob) return
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        .then(() => {
          setCopied(true)
          if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
          copyTimerRef.current = setTimeout(() => setCopied(false), 1500)
        })
        .catch(() => {})
    }, 'image/png')
  }, [text])

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">QR Code Generator</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-5">

        <QrDecoder onDecode={setText} />

        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Text or URL</label>
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="https://example.com"
            className="forge-input"
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
            <button onClick={download} className="forge-btn-accent">
              Download PNG
            </button>
            <button onClick={copyImage} className="forge-btn-accent">
              {copied ? 'Copied!' : 'Copy to Clipboard'}
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
