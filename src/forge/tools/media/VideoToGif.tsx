import { useState, useRef } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { Select } from '../../../components/Select'
import type { SelectOption } from '../../../components/Select'

const fpsOptions: SelectOption[] = [
  { value: '8',  label: '8 fps — smaller file' },
  { value: '10', label: '10 fps — balanced' },
  { value: '15', label: '15 fps — smoother' },
  { value: '20', label: '20 fps — largest file' },
]

const widthOptions: SelectOption[] = [
  { value: '240', label: '240px — tiny' },
  { value: '320', label: '320px — small' },
  { value: '480', label: '480px — medium' },
  { value: '640', label: '640px — large' },
]

const MAX_GIF_DURATION = 20

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m === 0) return `${sec.toFixed(1)}s`
  return `${m}:${sec.toFixed(1).padStart(4, '0')}`
}

let _ffmpeg: FFmpeg | null = null
let _ffmpegReady: Promise<FFmpeg> | null = null

function getFFmpeg(onProgress: (p: number) => void): Promise<FFmpeg> {
  if (_ffmpegReady) return _ffmpegReady
  const ff = new FFmpeg()
  ff.on('progress', ({ progress }) => onProgress(Math.max(0, Math.min(1, progress))))
  _ffmpegReady = ff.load({
    coreURL: '/ffmpeg/ffmpeg-core.js',
    wasmURL: '/ffmpeg/ffmpeg-core.wasm',
  }).then(() => { _ffmpeg = ff; return ff })
  return _ffmpegReady
}

export function VideoToGif() {
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [fps, setFps] = useState(10)
  const [width, setWidth] = useState(480)
  const [dropping, setDropping] = useState(false)
  const [ffmpegLoading, setFfmpegLoading] = useState(false)
  const [ffmpegProgress, setFfmpegProgress] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState(0)
  const [error, setError] = useState('')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputName, setOutputName] = useState('')
  const [outputSize, setOutputSize] = useState(0)

  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)      // hidden — fires onLoadedMetadata
  const playerRef = useRef<HTMLVideoElement>(null)     // visible player — used for currentTime

  function acceptFile(f: File) {
    if (!f.type.startsWith('video/')) { setError('Please select a video file.'); return }
    setError('')
    setOutputUrl(null)
    setFile(f)
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoUrl(URL.createObjectURL(f))
    setOutputName(f.name.replace(/\.[^.]+$/, '') + '.gif')
  }

  function onMetadata() {
    const v = videoRef.current
    if (!v) return
    const d = v.duration
    setDuration(d)
    setStart(0)
    setEnd(Math.min(d, MAX_GIF_DURATION))
  }

  const gifDuration = Math.min(end - start, MAX_GIF_DURATION)
  const isCapped = end - start > MAX_GIF_DURATION

  async function generateGif() {
    if (!file || generating || ffmpegLoading) return
    setError('')
    setOutputUrl(null)
    setGenProgress(0)

    const progressHandler = (p: number) => {
      if (!_ffmpeg) setFfmpegProgress(p)
      else setGenProgress(p)
    }

    try {
      if (!_ffmpeg) { setFfmpegLoading(true); setFfmpegProgress(0) }
      const ff = await getFFmpeg(progressHandler)
      setFfmpegLoading(false)
      setGenerating(true)
      ff.on('progress', ({ progress }) => setGenProgress(Math.max(0, Math.min(1, progress))))

      const ext = file.name.match(/\.([^.]+)$/)?.[1] ?? 'mp4'
      const inName = `input.${ext}`

      await ff.writeFile(inName, await fetchFile(file))
      await ff.exec([
        '-ss', start.toFixed(3),
        '-i', inName,
        '-t', gifDuration.toFixed(3),
        '-filter_complex', `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
        '-loop', '0',
        'output.gif',
      ])

      const data = await ff.readFile('output.gif') as Uint8Array
      await ff.deleteFile(inName)
      await ff.deleteFile('output.gif')

      if (outputUrl) URL.revokeObjectURL(outputUrl)
      const blob = new Blob([data as BlobPart], { type: 'image/gif' })
      setOutputUrl(URL.createObjectURL(blob))
      setOutputSize(blob.size)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed. Try a shorter clip or different format.')
      _ffmpegReady = null
      _ffmpeg = null
    } finally {
      setFfmpegLoading(false)
      setGenerating(false)
    }
  }

  const btnClass = "px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full"
  const isBusy = ffmpegLoading || generating

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Video to GIF</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-5">

        <video ref={videoRef} src={videoUrl ?? undefined} onLoadedMetadata={onMetadata} className="hidden" />

        <div
          onDragOver={e => { e.preventDefault(); setDropping(true) }}
          onDragLeave={() => setDropping(false)}
          onDrop={e => { e.preventDefault(); setDropping(false); const f = e.dataTransfer.files[0]; if (f) acceptFile(f) }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dropping ? 'border-[#c4af64] bg-[#c4af64]/5' : 'border-[#2a2d3a] hover:border-[#3a3d4a]'
          }`}
        >
          <input ref={fileRef} type="file" accept="video/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f) }} />
          {file ? (
            <div>
              <p className="text-sm text-[#e2e4ed] font-mono truncate">{file.name}</p>
              <p className="text-xs text-[#6b7280] mt-1">
                {(file.size / 1024 / 1024).toFixed(1)} MB{duration > 0 && ` · ${formatTime(duration)}`}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#6b7280]">Drop a video file here or click to upload</p>
              <p className="text-xs text-[#3a3d4a] mt-1">MP4, WebM, MOV · up to {MAX_GIF_DURATION}s · all processing is local</p>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {file && duration > 0 && (
          <>
            <video
              ref={playerRef}
              src={videoUrl ?? undefined}
              className="w-full rounded bg-black"
              style={{ maxHeight: 240 }}
              controls
            />

            {/* Clip range */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Start (s)</label>
                <input
                  type="number" min={0} max={end - 0.5} step={0.1}
                  value={start.toFixed(1)}
                  onChange={e => setStart(Math.max(0, Math.min(parseFloat(e.target.value) || 0, end - 0.5)))}
                  className={inputClass}
                />
                <button
                  onClick={() => {
                    const t = playerRef.current?.currentTime ?? 0
                    const newStart = Math.max(0, Math.min(t, duration - 0.5))
                    const newEnd = Math.min(duration, newStart + (end - start))
                    setStart(newStart)
                    setEnd(newEnd)
                  }}
                  className="mt-1 text-xs text-[#6b7280] hover:text-[#c4af64] transition-colors cursor-pointer"
                >
                  â† set to current time
                </button>
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">End (s)</label>
                <input
                  type="number" min={start + 0.5} max={duration} step={0.1}
                  value={end.toFixed(1)}
                  onChange={e => setEnd(Math.min(duration, Math.max(parseFloat(e.target.value) || 0, start + 0.5)))}
                  className={inputClass}
                />
                <button
                  onClick={() => { const t = playerRef.current?.currentTime ?? duration; setEnd(Math.min(duration, Math.max(t, start + 0.5))) }}
                  className="mt-1 text-xs text-[#6b7280] hover:text-[#c4af64] transition-colors cursor-pointer"
                >
                  â† set to current time
                </button>
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Duration</label>
                <div className={`rounded px-3 py-2 text-sm border ${isCapped ? 'bg-[#0f1117] border-yellow-500/40 text-yellow-400' : 'bg-[#0f1117] border-[#2a2d3a] text-[#6b7280]'}`}>
                  {isCapped ? `capped at ${MAX_GIF_DURATION}s` : formatTime(end - start)}
                </div>
              </div>
            </div>

            {/* Quality options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Frame rate</label>
                <Select
                  options={fpsOptions}
                  value={fpsOptions.find(o => o.value === String(fps)) ?? null}
                  onChange={opt => opt && setFps(Number(opt.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Width</label>
                <Select
                  options={widthOptions}
                  value={widthOptions.find(o => o.value === String(width)) ?? null}
                  onChange={opt => opt && setWidth(Number(opt.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={generateGif} disabled={isBusy} className={btnClass}>
                {generating ? 'Generating…' : ffmpegLoading ? 'Loading FFmpeg…' : 'Generate GIF'}
              </button>
              <span className="text-xs text-[#6b7280]">{gifDuration.toFixed(1)}s · {fps} fps · {width}px</span>
            </div>

            {ffmpegLoading && (
              <div>
                <div className="flex justify-between text-xs text-[#6b7280] mb-1">
                  <span>Loading FFmpeg (~24 MB, cached after first use)…</span>
                  <span>{Math.round(ffmpegProgress * 100)}%</span>
                </div>
                <div className="w-full h-1 bg-[#2a2d3a] rounded-full overflow-hidden">
                  <div className="h-full bg-[#c4af64] transition-all duration-150" style={{ width: `${ffmpegProgress * 100}%` }} />
                </div>
              </div>
            )}

            {generating && (
              <div>
                <div className="flex justify-between text-xs text-[#6b7280] mb-1">
                  <span>Generating GIF…</span>
                  <span>{Math.round(genProgress * 100)}%</span>
                </div>
                <div className="w-full h-1 bg-[#2a2d3a] rounded-full overflow-hidden">
                  <div className="h-full bg-[#c4af64] transition-all duration-150" style={{ width: `${genProgress * 100}%` }} />
                </div>
              </div>
            )}

            {outputUrl && (
              <div className="flex flex-col gap-3 border-t border-[#2a2d3a] pt-4">
                <img src={outputUrl} alt="Generated GIF" className="w-full rounded" style={{ maxHeight: 300, objectFit: 'contain', background: '#0f1117' }} />
                <div className="flex gap-3 items-center">
                  <a href={outputUrl} download={outputName} className={btnClass}>
                    Download {outputName}
                  </a>
                  <span className="text-xs text-[#6b7280]">{(outputSize / 1024 / 1024).toFixed(2)} MB · all processing is local</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
