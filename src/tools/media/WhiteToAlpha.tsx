import { useState, useRef, useEffect, useCallback } from 'react'

const SQRT3 = Math.sqrt(3)

function removeWhite(img: HTMLImageElement, threshold: number, feather: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) { reject(new Error('Canvas not supported')); return }
    ctx.drawImage(img, 0, 0)
    const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = id.data
    const t = threshold / 100
    const f = feather / 100
    const featherStart = Math.max(0, t - f)

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255
      const g = data[i + 1] / 255
      const b = data[i + 2] / 255
      // Normalized distance from white (0 = white, 1 = black)
      const dist = Math.sqrt((1 - r) ** 2 + (1 - g) ** 2 + (1 - b) ** 2) / SQRT3
      if (dist < t) {
        if (dist <= featherStart) {
          data[i + 3] = 0
        } else {
          data[i + 3] = Math.round(((dist - featherStart) / (t - featherStart)) * 255)
        }
      }
    }

    ctx.putImageData(id, 0, 0)
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Blob conversion failed')), 'image/png')
  })
}

export function WhiteToAlpha() {
  const [file, setFile] = useState<File | null>(null)
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null)
  const [threshold, setThreshold] = useState(25)
  const [feather, setFeather] = useState(10)
  const [dropping, setDropping] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputName, setOutputName] = useState('')
  const [error, setError] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const outputUrlRef = useRef<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const applyAndPreview = useCallback(async (img: HTMLImageElement, t: number, f: number) => {
    setProcessing(true)
    await new Promise(r => setTimeout(r, 0))
    try {
      const blob = await removeWhite(img, t, f)
      const url = URL.createObjectURL(blob)
      if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current)
      outputUrlRef.current = url
      setOutputUrl(url)
    } catch {
      setError('Processing failed.')
    } finally {
      setProcessing(false)
    }
  }, [])

  useEffect(() => {
    if (!imgEl) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => applyAndPreview(imgEl, threshold, feather), 150)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [imgEl, threshold, feather, applyAndPreview])

  function acceptFile(f: File) {
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return }
    setError('')
    setOutputUrl(null)
    setFile(f)
    setOutputName(f.name.replace(/\.[^.]+$/, '') + '-alpha.png')
    const img = new Image()
    img.onload = () => setImgEl(img)
    img.onerror = () => setError('Could not load this image.')
    img.src = URL.createObjectURL(f)
  }

  const btnClass = "px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">White to Alpha</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-5">

        <div
          onDragOver={e => { e.preventDefault(); setDropping(true) }}
          onDragLeave={() => setDropping(false)}
          onDrop={e => { e.preventDefault(); setDropping(false); const f = e.dataTransfer.files[0]; if (f) acceptFile(f) }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dropping ? 'border-[#c4af64] bg-[#c4af64]/5' : 'border-[#2a2d3a] hover:border-[#3a3d4a]'
          }`}
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f) }} />
          {file ? (
            <div>
              <p className="text-sm text-[#e2e4ed] font-mono truncate">{file.name}</p>
              <p className="text-xs text-[#6b7280] mt-1">{(file.size / 1024).toFixed(0)} KB · {imgEl ? `${imgEl.naturalWidth}×${imgEl.naturalHeight}` : '…'}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#6b7280]">Drop an image here or click to upload</p>
              <p className="text-xs text-[#3a3d4a] mt-1">PNG, JPG, WEBP · white background removed, exported as PNG · all processing is local</p>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {imgEl && (
          <>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-[#6b7280]">Threshold</label>
                  <span className="text-xs text-[#6b7280] font-mono">{threshold}%</span>
                </div>
                <input type="range" min={0} max={80} value={threshold}
                  onChange={e => setThreshold(Number(e.target.value))}
                  className="w-full accent-[#c4af64]" />
                <p className="text-xs text-[#3a3d4a] mt-1">How aggressively to remove white</p>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-[#6b7280]">Feather</label>
                  <span className="text-xs text-[#6b7280] font-mono">{feather}%</span>
                </div>
                <input type="range" min={0} max={40} value={feather}
                  onChange={e => setFeather(Number(e.target.value))}
                  className="w-full accent-[#c4af64]" />
                <p className="text-xs text-[#3a3d4a] mt-1">Soften edges near the cut boundary</p>
              </div>
            </div>

            {(processing || outputUrl) && (
              <div>
                <p className="text-xs text-[#6b7280] mb-2">Preview</p>
                <div
                  className="rounded overflow-hidden flex justify-center items-center"
                  style={{
                    background: 'repeating-conic-gradient(#2a2d3a 0% 25%, #1a1d27 0% 50%) 0 0 / 20px 20px',
                    minHeight: 80,
                  }}
                >
                  {processing
                    ? <p className="text-xs text-[#6b7280] py-6">Processing…</p>
                    : outputUrl && <img src={outputUrl} alt="Preview" className="max-w-full max-h-80 object-contain" />
                  }
                </div>
              </div>
            )}

            {outputUrl && !processing && (
              <div className="flex gap-3 items-center">
                <a href={outputUrl} download={outputName} className={btnClass}>
                  Download {outputName}
                </a>
                <span className="text-xs text-[#6b7280]">PNG with transparency · all processing is local</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
