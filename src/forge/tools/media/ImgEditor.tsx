import { useState, useRef, useEffect } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

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
  const [dropping, setDropping] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const urlRef = useRef('')

  function acceptFile(f: File) {
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return }
    setError(''); setCrop(undefined); setCompletedCrop(undefined); setRotation(0); setFile(f)
    const img = new Image()
    img.onload = () => setSrcImg(img)
    img.onerror = () => setError('Could not load image.')
    img.src = URL.createObjectURL(f)
  }

  // Rebuild rotated working canvas whenever source or rotation changes
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
    setWorkingW(w); setWorkingH(h) // eslint-disable-line react-hooks/set-state-in-effect
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

  // Scale from display pixels → natural pixels
  // eslint-disable-next-line react-hooks/refs
  const scaleX = imgRef.current ? workingW / imgRef.current.width : 1
  // eslint-disable-next-line react-hooks/refs
  const scaleY = imgRef.current ? workingH / imgRef.current.height : 1
  const outputW = completedCrop ? Math.round(completedCrop.width * scaleX) : workingW
  const outputH = completedCrop ? Math.round(completedCrop.height * scaleY) : workingH

  function download() {
    const el = imgRef.current
    if (!workingSrc || !el) return

    const sx = completedCrop ? Math.round(completedCrop.x * (workingW / el.width)) : 0
    const sy = completedCrop ? Math.round(completedCrop.y * (workingH / el.height)) : 0
    const sw = completedCrop ? Math.round(completedCrop.width * (workingW / el.width)) : workingW
    const sh = completedCrop ? Math.round(completedCrop.height * (workingH / el.height)) : workingH

    const canvas = document.createElement('canvas')
    canvas.width = sw; canvas.height = sh
    const ctx = canvas.getContext('2d')!

    if (isCircle) {
      ctx.beginPath()
      ctx.ellipse(sw / 2, sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2)
      ctx.clip()
    }

    const drawImg = new Image()
    drawImg.onload = () => {
      ctx.drawImage(drawImg, sx, sy, sw, sh, 0, 0, sw, sh)
      const a = document.createElement('a')
      a.download = (file?.name.replace(/\.[^.]+$/, '') ?? 'image') + '-edited.png'
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    drawImg.src = workingSrc
  }

  const btn = "px-3 py-1.5 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer"
  const btnActive = "px-3 py-1.5 text-sm rounded bg-[#c4af64]/20 text-[#c4af64] border border-[#c4af64] transition-colors cursor-pointer"

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Image Editor</h1>

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
              <p className="text-xs text-[#6b7280] mt-1">
                {srcImg?.naturalWidth} × {srcImg?.naturalHeight}px
              </p>
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
              <button
                onClick={() => { setIsCircle(v => !v); setCrop(undefined); setCompletedCrop(undefined) }}
                className={isCircle ? btnActive : btn}
              >
                {isCircle ? '● Circle crop' : '○ Circle crop'}
              </button>
              {completedCrop && (
                <button onClick={() => { setCrop(undefined); setCompletedCrop(undefined) }} className={btn}>
                  ✕ Clear crop
                </button>
              )}
            </div>

            {/* Resolution */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-[#6b7280]">
                Source: <span className="text-[#e2e4ed] font-mono">{workingW} × {workingH}px</span>
              </span>
              <span className="text-[#3a3d4a]">→</span>
              <span className="text-[#6b7280]">
                Output:{' '}
                <span className={`font-mono ${completedCrop ? 'text-[#c4af64]' : 'text-[#e2e4ed]'}`}>
                  {outputW} × {outputH}px
                </span>
              </span>
            </div>

            {/* Crop editor */}
            <div className="flex justify-center bg-[#0f1117] rounded-lg p-3 overflow-hidden">
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
                circularCrop={isCircle}
                aspect={isCircle ? 1 : undefined}
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

            <button onClick={download} className="px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer self-start">
              Download PNG
            </button>
          </>
        )}
      </div>
    </div>
  )
}
