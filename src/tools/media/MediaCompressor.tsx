import { useState, useRef, useEffect } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { Select } from '../../components/Select'
import type { SelectOption } from '../../components/Select'

const imgFormatOptions: SelectOption[] = [
  { value: 'webp-lossless', label: 'WebP — lossless' },
  { value: 'webp-q',        label: 'WebP — quality' },
  { value: 'jpeg',          label: 'JPEG — quality' },
]

const audioModeOptions: SelectOption[] = [
  { value: 'flac', label: 'FLAC — lossless (best for WAV source)' },
  { value: 'mp3',  label: 'MP3 — bitrate reduction (lossy)' },
]

const audioBitrateOptions: SelectOption[] = [
  { value: '64',  label: '64 kbps — smallest' },
  { value: '96',  label: '96 kbps' },
  { value: '128', label: '128 kbps — standard' },
  { value: '192', label: '192 kbps — high quality' },
]

const videoScaleOptions: SelectOption[] = [
  { value: 'original', label: 'Original' },
  { value: '1080',     label: '1080p' },
  { value: '720',      label: '720p' },
  { value: '480',      label: '480p' },
  { value: '360',      label: '360p' },
]

// ── FFmpeg singleton ─────────────────────────────────────────────────────────
let _ffmpeg: FFmpeg | null = null
let _ffmpegReady: Promise<FFmpeg> | null = null
function getFFmpeg(onProgress: (p: number) => void): Promise<FFmpeg> {
  if (_ffmpegReady) return _ffmpegReady
  const ff = new FFmpeg()
  ff.on('progress', ({ progress }) => onProgress(Math.max(0, Math.min(1, progress))))
  _ffmpegReady = ff.load({ coreURL: '/ffmpeg/ffmpeg-core.js', wasmURL: '/ffmpeg/ffmpeg-core.wasm' })
    .then(() => { _ffmpeg = ff; return ff })
  return _ffmpegReady
}

// ── Image tab ────────────────────────────────────────────────────────────────
function ImageTab() {
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [formatId, setFormatId] = useState('webp-lossless')
  const [quality, setQuality] = useState(0.80)
  const [dropping, setDropping] = useState(false)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputSize, setOutputSize] = useState(0)
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const urlRef = useRef<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isLossless = formatId === 'webp-lossless'
  const mime = formatId === 'jpeg' ? 'image/jpeg' : 'image/webp'
  const ext = formatId === 'jpeg' ? 'jpg' : 'webp'

  useEffect(() => {
    if (!img) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setConverting(true)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        if (!blob) { setConverting(false); return }
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        const url = URL.createObjectURL(blob)
        urlRef.current = url; setOutputUrl(url); setOutputSize(blob.size); setConverting(false)
      }, mime, isLossless ? undefined : quality)
    }, 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [img, formatId, quality, mime, isLossless])

  function acceptFile(f: File) {
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return }
    setError(''); setOutputUrl(null); setFile(f)
    const image = new Image()
    image.onload = () => setImg(image)
    image.src = URL.createObjectURL(f)
  }

  const savings = file && outputSize ? Math.round((1 - outputSize / file.size) * 100) : null
  const outputName = file ? file.name.replace(/\.[^.]+$/, '') + `-compressed.${ext}` : ''

  const btnClass = "px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer"

  return (
    <div className="flex flex-col gap-5">
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
            <p className="text-xs text-[#3a3d4a] mt-1">PNG, JPEG, WebP · all processing is local</p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {img && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#6b7280] mb-1">Output format</label>
              <Select
                options={imgFormatOptions}
                value={imgFormatOptions.find(o => o.value === formatId) ?? null}
                onChange={opt => opt && setFormatId(opt.value)}
                className="w-full"
              />
            </div>
            {!isLossless && (
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

          {converting && <p className="text-xs text-[#6b7280]">Processing…</p>}

          {outputUrl && !converting && file && (
            <div className="flex flex-col gap-3 border-t border-[#2a2d3a] pt-4">
              <div className="flex items-center gap-4 text-xs">
                <span className="text-[#6b7280]">Original: <span className="text-[#e2e4ed]">{(file.size / 1024).toFixed(0)} KB</span></span>
                <span className="text-[#3a3d4a]">→</span>
                <span className="text-[#6b7280]">Output: <span className="text-[#e2e4ed]">{(outputSize / 1024).toFixed(0)} KB</span></span>
                {savings !== null && (
                  <span className={savings > 0 ? 'text-green-400' : 'text-yellow-400'}>
                    {savings > 0 ? `${savings}% smaller` : `${Math.abs(savings)}% larger`}
                  </span>
                )}
              </div>
              <a href={outputUrl} download={outputName} className={btnClass + ' self-start'}>{outputName}</a>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Audio tab ────────────────────────────────────────────────────────────────
function AudioTab() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'flac' | 'mp3'>('flac')
  const [bitrate, setBitrate] = useState(96)
  const [dropping, setDropping] = useState(false)
  const [ffmpegLoading, setFfmpegLoading] = useState(false)
  const [ffmpegProgress, setFfmpegProgress] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [procProgress, setProcProgress] = useState(0)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputName, setOutputName] = useState('')
  const [outputSize, setOutputSize] = useState(0)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function compress() {
    if (!file || processing || ffmpegLoading) return
    setError(''); setOutputUrl(null); setProcProgress(0)
    const progressHandler = (p: number) => { if (!_ffmpeg) setFfmpegProgress(p); else setProcProgress(p) }
    try {
      if (!_ffmpeg) { setFfmpegLoading(true); setFfmpegProgress(0) }
      const ff = await getFFmpeg(progressHandler)
      setFfmpegLoading(false); setProcessing(true)
      ff.on('progress', ({ progress }) => setProcProgress(Math.max(0, Math.min(1, progress))))
      const ext = file.name.match(/\.([^.]+)$/)?.[1] ?? 'mp3'
      const inName = `input.${ext}`
      await ff.writeFile(inName, await fetchFile(file))
      if (mode === 'flac') {
        await ff.exec(['-i', inName, '-c:a', 'flac', 'output.flac'])
        const data = await ff.readFile('output.flac') as Uint8Array
        await ff.deleteFile(inName); await ff.deleteFile('output.flac')
        const blob = new Blob([data as BlobPart], { type: 'audio/flac' })
        if (outputUrl) URL.revokeObjectURL(outputUrl)
        setOutputUrl(URL.createObjectURL(blob)); setOutputSize(blob.size)
        setOutputName(file.name.replace(/\.[^.]+$/, '') + '.flac')
      } else {
        await ff.exec(['-i', inName, '-c:a', 'libmp3lame', '-b:a', `${bitrate}k`, 'output.mp3'])
        const data = await ff.readFile('output.mp3') as Uint8Array
        await ff.deleteFile(inName); await ff.deleteFile('output.mp3')
        const blob = new Blob([data as BlobPart], { type: 'audio/mp3' })
        if (outputUrl) URL.revokeObjectURL(outputUrl)
        setOutputUrl(URL.createObjectURL(blob)); setOutputSize(blob.size)
        setOutputName(file.name.replace(/\.[^.]+$/, '') + `-${bitrate}k.mp3`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed.')
      _ffmpegReady = null; _ffmpeg = null
    } finally { setFfmpegLoading(false); setProcessing(false) }
  }

  const isBusy = ffmpegLoading || processing
  const btnClass = "px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"


  return (
    <div className="flex flex-col gap-5">
      <div
        onDragOver={e => { e.preventDefault(); setDropping(true) }}
        onDragLeave={() => setDropping(false)}
        onDrop={e => { e.preventDefault(); setDropping(false); const f = e.dataTransfer.files[0]; if (f) { setError(''); setOutputUrl(null); setFile(f) } }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dropping ? 'border-[#c4af64] bg-[#c4af64]/5' : 'border-[#2a2d3a] hover:border-[#3a3d4a]'}`}
      >
        <input ref={fileRef} type="file" accept="audio/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) { setError(''); setOutputUrl(null); setFile(f) } }} />
        {file
          ? <p className="text-sm text-[#e2e4ed] font-mono truncate">{file.name} <span className="text-[#6b7280]">({(file.size / 1024).toFixed(0)} KB)</span></p>
          : <div><p className="text-sm text-[#6b7280]">Drop an audio file here or click to upload</p><p className="text-xs text-[#3a3d4a] mt-1">MP3, WAV, FLAC, OGG · all processing is local</p></div>
        }
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {file && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#6b7280] mb-1">Mode</label>
              <Select
                options={audioModeOptions}
                value={audioModeOptions.find(o => o.value === mode) ?? null}
                onChange={opt => opt && setMode(opt.value as 'flac' | 'mp3')}
                className="w-full"
              />
            </div>
            {mode === 'mp3' && (
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Target bitrate</label>
                <Select
                  options={audioBitrateOptions}
                  value={audioBitrateOptions.find(o => o.value === String(bitrate)) ?? null}
                  onChange={opt => opt && setBitrate(Number(opt.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
          {mode === 'mp3' && <p className="text-xs text-[#3a3d4a]">Re-encoding an already-compressed file (e.g. MP3→MP3) introduces generation loss. Use FLAC for uncompressed sources.</p>}

          <div className="flex items-center gap-3">
            <button onClick={compress} disabled={isBusy} className={btnClass}>
              {processing ? 'Compressing…' : ffmpegLoading ? 'Loading FFmpeg…' : 'Compress'}
            </button>
          </div>
          {ffmpegLoading && <ProgressBar label="Loading FFmpeg (~24 MB, cached after first use)…" pct={ffmpegProgress} />}
          {processing && <ProgressBar label="Compressing…" pct={procProgress} />}
          {outputUrl && file && (
            <div className="flex flex-col gap-2 border-t border-[#2a2d3a] pt-4">
              <div className="flex gap-4 text-xs">
                <span className="text-[#6b7280]">Original: <span className="text-[#e2e4ed]">{(file.size / 1024).toFixed(0)} KB</span></span>
                <span className="text-[#3a3d4a]">→</span>
                <span className="text-[#6b7280]">Output: <span className="text-[#e2e4ed]">{(outputSize / 1024).toFixed(0)} KB</span></span>
                {(() => { const s = Math.round((1 - outputSize / file.size) * 100); return <span className={s > 0 ? 'text-green-400' : 'text-yellow-400'}>{s > 0 ? `${s}% smaller` : `${Math.abs(s)}% larger`}</span> })()}
              </div>
              <a href={outputUrl} download={outputName} className={btnClass + ' self-start'}>{outputName}</a>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Video tab ────────────────────────────────────────────────────────────────
function VideoTab() {
  const [file, setFile] = useState<File | null>(null)
  const [crf, setCrf] = useState(28)
  const [scale, setScale] = useState('original')
  const [dropping, setDropping] = useState(false)
  const [ffmpegLoading, setFfmpegLoading] = useState(false)
  const [ffmpegProgress, setFfmpegProgress] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [procProgress, setProcProgress] = useState(0)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputName, setOutputName] = useState('')
  const [outputSize, setOutputSize] = useState(0)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function compress() {
    if (!file || processing || ffmpegLoading) return
    setError(''); setOutputUrl(null); setProcProgress(0)
    const progressHandler = (p: number) => { if (!_ffmpeg) setFfmpegProgress(p); else setProcProgress(p) }
    try {
      if (!_ffmpeg) { setFfmpegLoading(true); setFfmpegProgress(0) }
      const ff = await getFFmpeg(progressHandler)
      setFfmpegLoading(false); setProcessing(true)
      ff.on('progress', ({ progress }) => setProcProgress(Math.max(0, Math.min(1, progress))))
      const ext = file.name.match(/\.([^.]+)$/)?.[1] ?? 'mp4'
      const inName = `input.${ext}`
      await ff.writeFile(inName, await fetchFile(file))
      const vf = scale === 'original' ? null : `scale=-2:${scale}`
      const args = ['-i', inName, '-c:v', 'libx264', '-crf', String(crf), '-c:a', 'aac', '-b:a', '128k']
      if (vf) args.push('-vf', vf)
      args.push('output.mp4')
      await ff.exec(args)
      const data = await ff.readFile('output.mp4') as Uint8Array
      await ff.deleteFile(inName); await ff.deleteFile('output.mp4')
      const blob = new Blob([data as BlobPart], { type: 'video/mp4' })
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      setOutputUrl(URL.createObjectURL(blob)); setOutputSize(blob.size)
      setOutputName(file.name.replace(/\.[^.]+$/, '') + '-compressed.mp4')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed.')
      _ffmpegReady = null; _ffmpeg = null
    } finally { setFfmpegLoading(false); setProcessing(false) }
  }

  const isBusy = ffmpegLoading || processing
  const btnClass = "px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"

  const quality = crf <= 20 ? 'High quality, larger file' : crf <= 26 ? 'Balanced' : 'Smaller file, visible quality loss'

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-[#3a3d4a]">Video compression re-encodes using H.264 (lossy). Lower CRF = better quality, larger file.</p>
      <div
        onDragOver={e => { e.preventDefault(); setDropping(true) }}
        onDragLeave={() => setDropping(false)}
        onDrop={e => { e.preventDefault(); setDropping(false); const f = e.dataTransfer.files[0]; if (f) { setError(''); setOutputUrl(null); setFile(f) } }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dropping ? 'border-[#c4af64] bg-[#c4af64]/5' : 'border-[#2a2d3a] hover:border-[#3a3d4a]'}`}
      >
        <input ref={fileRef} type="file" accept="video/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) { setError(''); setOutputUrl(null); setFile(f) } }} />
        {file
          ? <p className="text-sm text-[#e2e4ed] font-mono truncate">{file.name} <span className="text-[#6b7280]">({(file.size / 1024 / 1024).toFixed(1)} MB)</span></p>
          : <div><p className="text-sm text-[#6b7280]">Drop a video file here or click to upload</p><p className="text-xs text-[#3a3d4a] mt-1">MP4, WebM, MOV · all processing is local · may be slow for large files</p></div>
        }
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {file && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-[#6b7280]">CRF (quality)</label>
                <span className="text-xs text-[#6b7280] font-mono">{crf}</span>
              </div>
              <input type="range" min={16} max={34} step={1} value={crf}
                onChange={e => setCrf(Number(e.target.value))}
                className="w-full accent-[#c4af64]" />
              <p className="text-xs text-[#3a3d4a] mt-1">{quality}</p>
            </div>
            <div>
              <label className="block text-xs text-[#6b7280] mb-1">Resolution</label>
              <Select
                options={videoScaleOptions}
                value={videoScaleOptions.find(o => o.value === scale) ?? null}
                onChange={opt => opt && setScale(opt.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={compress} disabled={isBusy} className={btnClass}>
              {processing ? 'Compressing…' : ffmpegLoading ? 'Loading FFmpeg…' : 'Compress'}
            </button>
            {processing && <span className="text-xs text-[#6b7280]">This may take a while for large files…</span>}
          </div>
          {ffmpegLoading && <ProgressBar label="Loading FFmpeg (~24 MB, cached after first use)…" pct={ffmpegProgress} />}
          {processing && <ProgressBar label="Compressing video…" pct={procProgress} />}
          {outputUrl && file && (
            <div className="flex flex-col gap-2 border-t border-[#2a2d3a] pt-4">
              <div className="flex gap-4 text-xs">
                <span className="text-[#6b7280]">Original: <span className="text-[#e2e4ed]">{(file.size / 1024 / 1024).toFixed(1)} MB</span></span>
                <span className="text-[#3a3d4a]">→</span>
                <span className="text-[#6b7280]">Output: <span className="text-[#e2e4ed]">{(outputSize / 1024 / 1024).toFixed(1)} MB</span></span>
                {(() => { const s = Math.round((1 - outputSize / file.size) * 100); return <span className={s > 0 ? 'text-green-400' : 'text-yellow-400'}>{s > 0 ? `${s}% smaller` : `${Math.abs(s)}% larger`}</span> })()}
              </div>
              <a href={outputUrl} download={outputName} className={btnClass + ' self-start'}>{outputName}</a>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Shared progress bar ───────────────────────────────────────────────────────
function ProgressBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-[#6b7280] mb-1">
        <span>{label}</span><span>{Math.round(pct * 100)}%</span>
      </div>
      <div className="w-full h-1 bg-[#2a2d3a] rounded-full overflow-hidden">
        <div className="h-full bg-[#c4af64] transition-all duration-150" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
type Tab = 'image' | 'audio' | 'video'

export function MediaCompressor() {
  const [tab, setTab] = useState<Tab>('image')

  function tabClass(t: Tab) {
    return `px-4 py-1.5 rounded text-sm transition-colors ${
      tab === t ? 'bg-[#c4af64] text-[#0f1117] font-medium' : 'bg-[#0f1117] text-[#9ca3af] hover:text-[#e2e4ed] border border-[#2a2d3a]'
    }`
  }

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Media Compressor</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('image')} className={tabClass('image')}>Image</button>
        <button onClick={() => setTab('audio')} className={tabClass('audio')}>Audio</button>
        <button onClick={() => setTab('video')} className={tabClass('video')}>Video</button>
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6">
        {tab === 'image' && <ImageTab />}
        {tab === 'audio' && <AudioTab />}
        {tab === 'video' && <VideoTab />}
      </div>
    </div>
  )
}
