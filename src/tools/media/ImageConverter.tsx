import { useState, useRef, useEffect } from 'react'
import { Select } from '../../components/Select'

const FORMATS = [
  { mime: 'image/png',  ext: 'png',  label: 'PNG',  lossless: true },
  { mime: 'image/jpeg', ext: 'jpg',  label: 'JPEG', lossless: false },
  { mime: 'image/webp', ext: 'webp', label: 'WebP', lossless: false },
]

export function ImageConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [outMime, setOutMime] = useState('image/png')
  const [quality, setQuality] = useState(0.85)
  const [dropping, setDropping] = useState(false)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputSize, setOutputSize] = useState(0)
  const [outputName, setOutputName] = useState('')
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const outputUrlRef = useRef<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!img) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setConverting(true)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const fmt = FORMATS.find(f => f.mime === outMime)!
      const q = fmt.lossless ? undefined : quality
      canvas.toBlob(blob => {
        if (!blob) { setConverting(false); return }
        if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current)
        const url = URL.createObjectURL(blob)
        outputUrlRef.current = url
        setOutputUrl(url)
        setOutputSize(blob.size)
        setConverting(false)
      }, outMime, q)
    }, 150)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [img, outMime, quality])

  function acceptFile(f: File) {
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return }
    setError(''); setOutputUrl(null); setFile(f)
    const ext = FORMATS.find(fmt => fmt.mime === outMime)?.ext ?? 'png'
    setOutputName(f.name.replace(/\.[^.]+$/, '') + `-converted.${ext}`)
    const image = new Image()
    image.onload = () => setImg(image)
    image.onerror = () => setError('Could not load image.')
    image.src = URL.createObjectURL(f)
  }

  const fmt = FORMATS.find(f => f.mime === outMime)!
  const savings = file && outputSize ? Math.round((1 - outputSize / file.size) * 100) : null
  const btnClass ="px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer"

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Image Converter</h1>
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-5">

        <div
          onDragOver={e => { e.preventDefault(); setDropping(true) }}
          onDragLeave={() => setDropping(false)}
          onDrop={e => { e.preventDefault(); setDropping(false); const f = e.dataTransfer.files[0]; if (f) acceptFile(f) }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dropping ? 'border-[#c4af64] bg-[#c4af64]/5' : 'border-[#2a2d3a] hover:border-[#3a3d4a]'}`}
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f) }} />
          {file ? (
            <div>
              <p className="text-sm text-[#e2e4ed] font-mono truncate">{file.name}</p>
              <p className="text-xs text-[#6b7280] mt-1">{(file.size / 1024).toFixed(0)} KB · {img ? `${img.naturalWidth}×${img.naturalHeight}` : '…'}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#6b7280]">Drop an image here or click to upload</p>
              <p className="text-xs text-[#3a3d4a] mt-1">PNG, JPEG, WebP, GIF, AVIF · all processing is local</p>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#6b7280] mb-1">Convert to</label>
            <Select
              options={FORMATS.map(f => ({ value: f.mime, label: `${f.label}${f.lossless ? ' (lossless)' : ''}` }))}
              value={{ value: outMime, label: FORMATS.find(f => f.mime === outMime)?.label ?? outMime }}
              onChange={opt => opt && setOutMime(opt.value)}
              className="w-full"
            />
          </div>
          {!fmt.lossless && (
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-[#6b7280]">Quality</label>
                <span className="text-xs text-[#6b7280] font-mono">{Math.round(quality * 100)}%</span>
              </div>
              <input type="range" min={0.1} max={1} step={0.05} value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                className="w-full mt-2 accent-[#c4af64]" />
            </div>
          )}
        </div>

        {converting && <p className="text-xs text-[#6b7280]">Converting…</p>}

        {outputUrl && !converting && file && (
          <div className="flex flex-col gap-3 border-t border-[#2a2d3a] pt-4">
            <div className="flex items-center gap-4 text-xs text-[#6b7280]">
              <span>Original: <span className="text-[#e2e4ed]">{(file.size / 1024).toFixed(0)} KB</span></span>
              <span>→</span>
              <span>Output: <span className="text-[#e2e4ed]">{(outputSize / 1024).toFixed(0)} KB</span></span>
              {savings !== null && (
                <span className={savings > 0 ? 'text-green-400' : 'text-yellow-400'}>
                  {savings > 0 ? `${savings}% smaller` : `${Math.abs(savings)}% larger`}
                </span>
              )}
            </div>
            <a href={outputUrl} download={outputName} className={btnClass + ' self-start'}>
              Download {outputName}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
