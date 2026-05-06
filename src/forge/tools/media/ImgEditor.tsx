import { useState, useRef, useEffect } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

function LockIcon({ locked }: { locked: boolean }) {
  return locked ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  )
}

type RatioPreset = { kind: 'ratio'; label: string; rw: number; rh: number }
type SizePreset  = { kind: 'size';  label: string; w: number;  h: number  }
type Preset = RatioPreset | SizePreset

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b) }
function simplifyRatio(w: number, h: number): string {
  const g = gcd(Math.round(w), Math.round(h))
  return `${Math.round(w) / g}:${Math.round(h) / g}`
}

const RATIO_PRESETS: RatioPreset[] = [
  { kind: 'ratio', label: '1:1',  rw: 1,  rh: 1  },
  { kind: 'ratio', label: '4:3',  rw: 4,  rh: 3  },
  { kind: 'ratio', label: '3:2',  rw: 3,  rh: 2  },
  { kind: 'ratio', label: '16:9', rw: 16, rh: 9  },
  { kind: 'ratio', label: '9:16', rw: 9,  rh: 16 },
  { kind: 'ratio', label: '2:3',  rw: 2,  rh: 3  },
]

const SIZE_PRESETS: SizePreset[] = [
  { kind: 'size', label: '720p',  w: 1280, h: 720  },
  { kind: 'size', label: '1080p', w: 1920, h: 1080 },
  { kind: 'size', label: '4K',    w: 3840, h: 2160 },
  { kind: 'size', label: '1080²', w: 1080, h: 1080 },
  { kind: 'size', label: 'Story', w: 1080, h: 1920 },
]

export function ImgEditor() {
  const [file, setFile] = useState<File | null>(null)
  const [srcImg, setSrcImg] = useState<HTMLImageElement | null>(null)
  const [rotation, setRotation] = useState(0)
  const [workingSrc, setWorkingSrc] = useState('')
  const [workingW, setWorkingW] = useState(0)
  const [workingH, setWorkingH] = useState(0)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isCircle, setIsCircle] = useState(false)
  const [cropAspect, setCropAspect] = useState<{ ratio: number; label: string; source: 'ratio' | 'size' | 'custom' } | undefined>(undefined)
  const [resizeW, setResizeW] = useState('0')
  const [resizeH, setResizeH] = useState('0')
  const [lockAspect, setLockAspect] = useState(true)
  const [scaleOutput, setScaleOutput] = useState(false)
  const [dropping, setDropping] = useState(false)
  const [error, setError] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const urlRef = useRef('')

  function acceptFile(f: File) {
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return }
    setError(''); setCrop(undefined); setCompletedCrop(undefined)
    setRotation(0); setCropAspect(undefined); setFile(f)
    const img = new Image()
    img.onload = () => setSrcImg(img)
    img.onerror = () => setError('Could not load image.')
    img.src = URL.createObjectURL(f)
  }

  useEffect(() => {
    if (!srcImg) return
    const rotRad = (rotation * Math.PI) / 180
    const isOdd = rotation % 180 !== 0
    const w = isOdd ? srcImg.naturalHeight : srcImg.naturalWidth
    const h = isOdd ? srcImg.naturalWidth : srcImg.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.translate(w / 2, h / 2)
    ctx.rotate(rotRad)
    ctx.drawImage(srcImg, -srcImg.naturalWidth / 2, -srcImg.naturalHeight / 2)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWorkingW(w); setWorkingH(h); setResizeW(String(w)); setResizeH(String(h))
    setCrop(undefined); setCompletedCrop(undefined)
    canvas.toBlob(blob => {
      if (!blob) return
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setWorkingSrc(url)
    })
  }, [srcImg, rotation])

  function rotate(dir: 1 | -1) {
    setRotation(r => (r + dir * 90 + 360) % 360)
  }

  // eslint-disable-next-line react-hooks/refs
  const scaleX = imgRef.current ? workingW / imgRef.current.width : 1
  // eslint-disable-next-line react-hooks/refs
  const scaleY = imgRef.current ? workingH / imgRef.current.height : 1

  const cropW = completedCrop ? Math.round(completedCrop.width  * scaleX) : workingW
  const cropH = completedCrop ? Math.round(completedCrop.height * scaleY) : workingH
  const finalW = parseInt(resizeW) > 0 ? parseInt(resizeW) : cropW
  const finalH = parseInt(resizeH) > 0 ? parseInt(resizeH) : cropH

  // Effective export size: exact target (may distort) or raw crop dimensions (never distorts)
  const exportW = scaleOutput ? finalW : cropW
  const exportH = scaleOutput ? finalH : cropH

  // Live preview: redraws whenever crop, export size, or source changes
  useEffect(() => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    if (!workingSrc || exportW <= 0 || exportH <= 0) {
      canvas.width = 0; canvas.height = 0; return
    }
    const el = imgRef.current
    const dispW = el?.width || workingW
    const dispH = el?.height || workingH
    const sx = completedCrop ? Math.round(completedCrop.x * workingW / dispW) : 0
    const sy = completedCrop ? Math.round(completedCrop.y * workingH / dispH) : 0
    const sw = completedCrop ? Math.round(completedCrop.width  * workingW / dispW) : workingW
    const sh = completedCrop ? Math.round(completedCrop.height * workingH / dispH) : workingH
    const maxPW = 480
    const scale = Math.min(1, maxPW / exportW)
    const pw = Math.max(1, Math.round(exportW * scale))
    const ph = Math.max(1, Math.round(exportH * scale))
    canvas.width = pw; canvas.height = ph
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, pw, ph)
    if (isCircle) {
      ctx.beginPath()
      ctx.ellipse(pw / 2, ph / 2, pw / 2, ph / 2, 0, 0, Math.PI * 2)
      ctx.clip()
    }
    const img = new Image()
    img.onload = () => ctx.drawImage(img, sx, sy, sw, sh, 0, 0, pw, ph)
    img.src = workingSrc
  }, [workingSrc, completedCrop, exportW, exportH, isCircle, workingW, workingH])

  function onResizeW(v: string) {
    setResizeW(v)
    if (lockAspect && parseInt(v) > 0) {
      // Use locked ratio if set; otherwise derive from current values (avoids drift from image ratio)
      const ratio = cropAspect?.ratio ?? (parseInt(resizeW) > 0 ? parseInt(resizeH) / parseInt(resizeW) : 1)
      setResizeH(String(Math.round(parseInt(v) / ratio)))
    }
  }

  function onResizeH(v: string) {
    setResizeH(v)
    if (lockAspect && parseInt(v) > 0) {
      const ratio = cropAspect?.ratio ?? (parseInt(resizeH) > 0 ? parseInt(resizeW) / parseInt(resizeH) : 1)
      setResizeW(String(Math.round(parseInt(v) * ratio)))
    }
  }

  function toggleLock() {
    const next = !lockAspect
    setLockAspect(next)
    if (next) {
      // Lock to CURRENT W:H values (whatever user has typed), not the original crop ratio
      const w = parseInt(resizeW) || cropW
      const h = parseInt(resizeH) || cropH
      if (w > 0 && h > 0) {
        setCropAspect({ ratio: w / h, label: simplifyRatio(w, h), source: 'custom' })
        setCrop(undefined); setCompletedCrop(undefined)
      }
    } else {
      setCropAspect(undefined)
    }
  }

  // Build a centered auto-crop in display-pixel units for the given ratio
  function makeAutoCrop(rw: number, rh: number): { crop: Crop; completed: PixelCrop } | null {
    const el = imgRef.current
    if (!el || el.width === 0 || workingW === 0) return null
    const desiredRatio = rw / rh
    const srcRatio = workingW / workingH
    let wPct: number, hPct: number
    if (desiredRatio > srcRatio) { wPct = 100; hPct = (srcRatio / desiredRatio) * 100 }
    else                         { hPct = 100; wPct = (desiredRatio / srcRatio) * 100 }
    const xPct = (100 - wPct) / 2
    const yPct = (100 - hPct) / 2
    const px: PixelCrop = {
      unit: 'px',
      x:      xPct / 100 * el.width,
      y:      yPct / 100 * el.height,
      width:  wPct / 100 * el.width,
      height: hPct / 100 * el.height,
    }
    return { crop: { ...px }, completed: px }
  }

  function applyPreset(p: Preset) {
    // Toggle off if already active
    const alreadyOn = p.kind === 'ratio'
      ? (cropAspect?.source === 'ratio' && Math.abs((cropAspect?.ratio ?? -1) - p.rw / p.rh) < 0.001)
      : (cropAspect?.source === 'size' && parseInt(resizeW) === p.w && parseInt(resizeH) === p.h)
    if (alreadyOn) {
      setCropAspect(undefined)
      if (!isCircle) { setCrop(undefined); setCompletedCrop(undefined) }
      if (p.kind === 'size') setScaleOutput(false)
      return
    }

    const rw = p.kind === 'ratio' ? p.rw : p.w
    const rh = p.kind === 'ratio' ? p.rh : p.h
    const ratio = rw / rh
    const source: 'ratio' | 'size' = p.kind === 'ratio' ? 'ratio' : 'size'
    const label = p.kind === 'ratio' ? p.label : simplifyRatio(p.w, p.h)

    if (p.kind === 'ratio') {
      const base = parseInt(resizeW) || cropW
      setResizeW(String(base))
      setResizeH(String(Math.round(base / ratio)))
    } else {
      setResizeW(String(p.w))
      setResizeH(String(p.h))
      setScaleOutput(true)
    }

    setCropAspect({ ratio, label, source })

    // In circle mode: only store the preset for when the user returns to Square — don't
    // replace the circle crop with a non-1:1 rectangle (that would distort the circle preview)
    if (!isCircle) {
      const auto = makeAutoCrop(rw, rh)
      if (auto) { setCrop(auto.crop); setCompletedCrop(auto.completed) }
      else       { setCrop(undefined); setCompletedCrop(undefined) }
    }
  }

  function matchCrop() {
    setResizeW(String(cropW))
    setResizeH(String(cropH))
    if (lockAspect) setCropAspect({ ratio: cropW / cropH, label: simplifyRatio(cropW, cropH), source: 'custom' })
  }

  function resetResize() {
    setResizeW(String(workingW))
    setResizeH(String(workingH))
    setCropAspect(undefined)
    setCrop(undefined); setCompletedCrop(undefined)
  }

  function download() {
    const el = imgRef.current
    if (!workingSrc || !el) return
    const sx = completedCrop ? Math.round(completedCrop.x * workingW / el.width) : 0
    const sy = completedCrop ? Math.round(completedCrop.y * workingH / el.height) : 0
    const sw = completedCrop ? Math.round(completedCrop.width  * workingW / el.width)  : workingW
    const sh = completedCrop ? Math.round(completedCrop.height * workingH / el.height) : workingH
    const canvas = document.createElement('canvas')
    canvas.width = exportW; canvas.height = exportH
    const ctx = canvas.getContext('2d')!
    if (isCircle) {
      ctx.beginPath()
      ctx.ellipse(exportW / 2, exportH / 2, exportW / 2, exportH / 2, 0, 0, Math.PI * 2)
      ctx.clip()
    }
    const drawImg = new Image()
    drawImg.onload = () => {
      ctx.drawImage(drawImg, sx, sy, sw, sh, 0, 0, exportW, exportH)
      const a = document.createElement('a')
      a.download = (file?.name.replace(/\.[^.]+$/, '') ?? 'image') + '-edited.png'
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    drawImg.src = workingSrc
  }

  const btn = "px-3 py-1.5 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer"
  const inputCls = "w-20 bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-[#c4af64]"
  const presetBtn = (active: boolean) => active
    ? "px-2 py-1 text-xs rounded border border-[#c4af64]/40 text-[#c4af64] bg-[#c4af64]/10 cursor-pointer"
    : "px-2 py-1 text-xs rounded border border-[#2a2d3a] text-[#9ca3af] hover:border-[#c4af64]/40 hover:text-[#c4af64] transition-colors cursor-pointer"

  const isRatioActive = (p: RatioPreset) =>
    cropAspect?.source === 'ratio' && Math.abs(cropAspect.ratio - p.rw / p.rh) < 0.001
  const isSizeActive  = (p: SizePreset) =>
    cropAspect?.source === 'size' && parseInt(resizeW) === p.w && parseInt(resizeH) === p.h

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Image Editor</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-5">

        {/* Upload */}
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
              <p className="text-xs text-[#6b7280] mt-1">{srcImg?.naturalWidth} × {srcImg?.naturalHeight}px</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#6b7280]">Drop an image here or click to upload</p>
              <p className="text-xs text-[#3a3d4a] mt-1">PNG, JPG, WEBP · all processing is local</p>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {workingSrc && (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 items-center">
              <button onClick={() => rotate(-1)} className={btn}>↺ Rotate CCW</button>
              <button onClick={() => rotate(1)} className={btn}>↻ Rotate CW</button>
              <div className="w-px h-5 bg-[#2a2d3a]" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#6b7280]">Crop:</span>
                <div className="flex rounded border border-[#2a2d3a] overflow-hidden text-sm">
                  <button
                    onClick={() => {
                      setIsCircle(false)
                      if (cropAspect && cropAspect.source !== 'custom') {
                        // Re-apply the preset constraint coming back from circle
                        const auto = makeAutoCrop(cropAspect.ratio, 1)
                        if (auto) { setCrop(auto.crop); setCompletedCrop(auto.completed) }
                        else { setCrop(undefined); setCompletedCrop(undefined) }
                      }
                      // No preset: leave existing completedCrop in place (circle → square keeps the 1:1 crop)
                    }}
                    className={`px-3 py-1.5 transition-colors cursor-pointer ${!isCircle ? 'bg-[#c4af64]/20 text-[#c4af64]' : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2d3a]'}`}
                  >
                    ▭ Square
                  </button>
                  <div className="w-px bg-[#2a2d3a]" />
                  <button
                    onClick={() => {
                      setIsCircle(true)
                      // Preserve cropAspect so Square can restore it when switching back
                      const auto = makeAutoCrop(1, 1)
                      if (auto) { setCrop(auto.crop); setCompletedCrop(auto.completed) }
                      else { setCrop(undefined); setCompletedCrop(undefined) }
                    }}
                    className={`px-3 py-1.5 transition-colors cursor-pointer ${isCircle ? 'bg-[#c4af64]/20 text-[#c4af64]' : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2d3a]'}`}
                  >
                    ○ Circle
                  </button>
                </div>
              </div>
              {completedCrop && (
                <button onClick={() => { setCrop(undefined); setCompletedCrop(undefined) }} className={btn}>
                  ✕ Clear crop
                </button>
              )}
            </div>

            {/* Export size */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-[#6b7280]">
                  Source: <span className="text-[#e2e4ed] font-mono">{workingW} × {workingH}px</span>
                </span>
                {completedCrop && (
                  <>
                    <span className="text-[#3a3d4a]">→</span>
                    <span className="text-[#6b7280]">
                      Crop: <span className="text-[#c4af64] font-mono">{cropW} × {cropH}px</span>
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#6b7280]">Export:</span>
                <input type="number" inputMode="numeric" min={1} value={resizeW} onChange={e => onResizeW(e.target.value)} className={inputCls} />
                <span className="text-[#6b7280] text-xs">×</span>
                <input type="number" inputMode="numeric" min={1} value={resizeH} onChange={e => onResizeH(e.target.value)} className={inputCls} />
                <button
                  onClick={toggleLock}
                  title={lockAspect ? 'Aspect locked — click to free' : 'Aspect free — click to lock'}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors cursor-pointer ${lockAspect ? 'bg-[#c4af64]/10 text-[#c4af64] border-[#c4af64]/30' : 'text-[#6b7280] border-[#2a2d3a] hover:text-[#9ca3af]'}`}
                >
                  <LockIcon locked={lockAspect} />
                  {lockAspect ? 'Locked' : 'Free'}
                </button>
                {completedCrop && (
                  <button onClick={matchCrop} className="text-xs text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer" title="Set export size to crop dimensions (no scaling)">
                    Match crop
                  </button>
                )}
                <button onClick={resetResize} className="text-xs text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer">
                  Reset
                </button>
              </div>

              {/* Ratio presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-[#3a3d4a] w-12 shrink-0">Ratio:</span>
                {RATIO_PRESETS.map(p => (
                  <button key={p.label} onClick={() => applyPreset(p)} className={presetBtn(isRatioActive(p))}>{p.label}</button>
                ))}
              </div>

              {/* Size presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-[#3a3d4a] w-12 shrink-0">Size:</span>
                {SIZE_PRESETS.map(p => (
                  <button key={p.label} onClick={() => applyPreset(p)} className={presetBtn(isSizeActive(p))}>{p.label}</button>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-[#6b7280]">
                  Output: <span className="font-mono text-[#e2e4ed]">{exportW} × {exportH}px</span>
                </span>
                <div className="flex rounded border border-[#2a2d3a] overflow-hidden text-xs">
                  <button
                    onClick={() => setScaleOutput(false)}
                    className={`px-2 py-0.5 transition-colors cursor-pointer ${!scaleOutput ? 'bg-[#c4af64]/20 text-[#c4af64]' : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2d3a]'}`}
                  >
                    Crop size
                  </button>
                  <div className="w-px bg-[#2a2d3a]" />
                  <button
                    onClick={() => setScaleOutput(true)}
                    className={`px-2 py-0.5 transition-colors cursor-pointer ${scaleOutput ? 'bg-[#c4af64]/20 text-[#c4af64]' : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#2a2d3a]'}`}
                  >
                    Scale to target
                  </button>
                </div>
              </div>
            </div>

            {scaleOutput && (finalW > cropW || finalH > cropH) && (
              <p className="text-xs text-[#6b7280]">
                Output ({finalW} × {finalH}px) is larger than the source crop area ({cropW} × {cropH}px) — the image will be upscaled.
              </p>
            )}

            {/* Crop editor */}
            <div className="relative flex justify-center bg-[#0f1117] rounded-lg p-3 overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
                circularCrop={isCircle}
                aspect={isCircle ? 1 : (cropAspect && cropAspect.source !== 'custom' ? cropAspect.ratio : undefined)}
                keepSelection={false}
              >
                <img
                  ref={imgRef}
                  src={workingSrc}
                  alt="Edit preview"
                  style={{ maxWidth: '100%', maxHeight: '60vh', display: 'block' }}
                />
              </ReactCrop>
            </div>

            {/* Live preview */}
            <div>
              <p className="text-xs text-[#6b7280] mb-2">Preview</p>
              <div className="bg-[#0f1117] rounded-lg p-3 flex justify-center" style={{ minHeight: '3rem' }}>
                <canvas
                  ref={previewCanvasRef}
                  className="rounded max-w-full"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </div>

            <button onClick={download} className="px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer self-start">
              Download PNG
            </button>
          </>
        )}
      </div>
    </div>
  )
}
