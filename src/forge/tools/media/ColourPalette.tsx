import { useState, useRef, useEffect, useCallback } from 'react'

type RGB = [number, number, number]

function distSq(a: RGB, b: RGB): number {
  return (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2
}

function toHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function extractPalette(img: HTMLImageElement, k: number): RGB[] {
  const SIZE = 150
  const canvas = document.createElement('canvas')
  canvas.width = SIZE; canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, SIZE, SIZE)
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE)

  const pixels: RGB[] = []
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    pixels.push([data[i], data[i+1], data[i+2]])
  }
  if (pixels.length === 0) return []

  // k-means++ init
  const centroids: RGB[] = [pixels[Math.floor(Math.random() * pixels.length)]]
  while (centroids.length < k) {
    const dists = pixels.map(p => Math.min(...centroids.map(c => distSq(p, c))))
    const total = dists.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    let pick = pixels[0]
    for (let i = 0; i < dists.length; i++) { r -= dists[i]; if (r <= 0) { pick = pixels[i]; break } }
    centroids.push(pick)
  }

  // k-means iterations
  for (let iter = 0; iter < 20; iter++) {
    const sums: RGB[] = Array.from({ length: k }, () => [0, 0, 0])
    const counts = new Array<number>(k).fill(0)
    for (const p of pixels) {
      let best = 0, bestD = Infinity
      for (let i = 0; i < k; i++) { const d = distSq(p, centroids[i]); if (d < bestD) { bestD = d; best = i } }
      sums[best][0] += p[0]; sums[best][1] += p[1]; sums[best][2] += p[2]
      counts[best]++
    }
    for (let i = 0; i < k; i++) {
      if (counts[i] > 0) centroids[i] = [
        Math.round(sums[i][0] / counts[i]),
        Math.round(sums[i][1] / counts[i]),
        Math.round(sums[i][2] / counts[i]),
      ]
    }
  }

  // Sort by perceived lightness
  return centroids.sort((a, b) =>
    (0.299*a[0] + 0.587*a[1] + 0.114*a[2]) - (0.299*b[0] + 0.587*b[1] + 0.114*b[2])
  )
}

export function ColourPalette() {
  const [file, setFile] = useState<File | null>(null)
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [count, setCount] = useState(6)
  const [palette, setPalette] = useState<RGB[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [dropping, setDropping] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const generate = useCallback((img: HTMLImageElement, k: number) => {
    const result = extractPalette(img, k)
    setPalette(result)
  }, [])

  useEffect(() => {
    if (!imgEl) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => generate(imgEl, count), 100)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [imgEl, count, generate])

  function acceptFile(f: File) {
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return }
    setError('')
    setPalette([])
    setFile(f)
    if (imgUrl) URL.revokeObjectURL(imgUrl)
    const url = URL.createObjectURL(f)
    setImgUrl(url)
    const img = new Image()
    img.onload = () => setImgEl(img)
    img.onerror = () => setError('Could not load image.')
    img.src = url
  }

  function copyHex(hex: string) {
    navigator.clipboard.writeText(hex)
    setCopied(hex)
    setTimeout(() => setCopied(null), 1500)
  }

  function luminance([r, g, b]: RGB): number {
    return 0.299 * r + 0.587 * g + 0.114 * b
  }

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Colour Palette</h1>

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
            <p className="text-sm text-[#e2e4ed] font-mono truncate">{file.name}</p>
          ) : (
            <div>
              <p className="text-sm text-[#6b7280]">Drop an image here or click to upload</p>
              <p className="text-xs text-[#3a3d4a] mt-1">PNG, JPG, WEBP · all processing is local</p>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {imgEl && (
          <>
            <div className="flex items-center gap-4">
              <label className="text-xs text-[#6b7280] shrink-0">Colours</label>
              <input type="range" min={3} max={12} value={count}
                onChange={e => setCount(Number(e.target.value))}
                className="flex-1 accent-[#c4af64]" />
              <span className="text-xs text-[#6b7280] font-mono w-4">{count}</span>
            </div>

            {imgUrl && (
              <img src={imgUrl} alt="Uploaded" className="w-full max-h-48 object-contain rounded bg-[#0f1117]" />
            )}

            {palette.length > 0 && (
              <div className="flex rounded-lg overflow-hidden h-20">
                {palette.map((rgb, i) => {
                  const hex = toHex(rgb)
                  const light = luminance(rgb) > 128
                  return (
                    <button
                      key={i}
                      onClick={() => copyHex(hex)}
                      className="flex-1 flex flex-col items-center justify-end pb-2 transition-transform hover:scale-105 hover:z-10 relative cursor-pointer"
                      style={{ background: hex }}
                      title={`Click to copy ${hex}`}
                    >
                      <span className={`text-[10px] font-mono leading-tight ${light ? 'text-black/60' : 'text-white/70'}`}>
                        {copied === hex ? 'Copied!' : hex}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {palette.length > 0 && (
              <div className="grid gap-2">
                {palette.map((rgb, i) => {
                  const hex = toHex(rgb)
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded shrink-0 border border-[#2a2d3a]" style={{ background: hex }} />
                      <button
                        onClick={() => copyHex(hex)}
                        className="text-sm font-mono text-[#e2e4ed] hover:text-[#c4af64] transition-colors cursor-pointer"
                      >
                        {copied === hex ? 'Copied!' : hex}
                      </button>
                      <span className="text-xs text-[#6b7280]">rgb({rgb[0]}, {rgb[1]}, {rgb[2]})</span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
