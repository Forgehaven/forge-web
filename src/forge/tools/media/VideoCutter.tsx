import { useState, useRef, useEffect, useCallback } from 'react'
import { fetchFile } from '@ffmpeg/util'
import { FileDropZone } from '../../../components/FileDropZone'
import { getFFmpeg, cancelFFmpeg, resetFFmpeg, isFFmpegLoaded } from '../../../lib/ffmpeg'
import { formatTime } from '../../../lib/time'

export function VideoCutter() {
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [ffmpegLoading, setFfmpegLoading] = useState(false)
  const [ffmpegProgress, setFfmpegProgress] = useState(0)
  const [cutting, setCutting] = useState(false)
  const [cutProgress, setCutProgress] = useState(0)
  const [error, setError] = useState('')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputName, setOutputName] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)

  // Stable refs for drag closures
  const trimStartRef = useRef(0)
  const trimEndRef = useRef(0)
  const durationRef = useRef(0)

  useEffect(() => { trimStartRef.current = trimStart }, [trimStart])
  useEffect(() => { trimEndRef.current = trimEnd }, [trimEnd])
  useEffect(() => { durationRef.current = duration }, [duration])

  // RAF playhead loop
  useEffect(() => {
    if (!isPlaying) return
    const tick = () => {
      const v = videoRef.current
      if (!v) return
      setCurrentTime(v.currentTime)
      if (v.currentTime >= trimEndRef.current) {
        v.pause()
        setIsPlaying(false)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying])

  function acceptFile(f: File) {
    if (!f.type.startsWith('video/')) {
      setError('Please select a video file.')
      return
    }
    setError('')
    setOutputUrl(null)
    setIsPlaying(false)
    cancelAnimationFrame(rafRef.current)
    setFile(f)
    setCurrentTime(0)
    setTrimStart(0)
    trimStartRef.current = 0

    if (videoUrl) URL.revokeObjectURL(videoUrl)
    const url = URL.createObjectURL(f)
    setVideoUrl(url)
    setOutputName(f.name.replace(/\.[^.]+$/, '') + '-cut.mp4')
  }

  function onMetadata() {
    const v = videoRef.current
    if (!v) return
    const d = v.duration
    setDuration(d)
    durationRef.current = d
    setTrimEnd(d)
    trimEndRef.current = d
  }

  function togglePlay() {
    const v = videoRef.current
    if (!v || !duration) return
    if (isPlaying) {
      v.pause()
      setIsPlaying(false)
    } else {
      if (v.currentTime < trimStartRef.current || v.currentTime >= trimEndRef.current) {
        v.currentTime = trimStartRef.current
      }
      v.play()
      setIsPlaying(true)
    }
  }

  function seekTo(t: number) {
    const v = videoRef.current
    if (!v) return
    v.currentTime = t
    setCurrentTime(t)
  }

  const onTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current || !durationRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const dur = durationRef.current
    const sRel = trimStartRef.current / dur
    const eRel = trimEndRef.current / dur
    const thresh = 10 / rect.width

    const dS = Math.abs(relX - sRel)
    const dE = Math.abs(relX - eRel)

    let handle: 'start' | 'end' | null = null
    if (dS < thresh && dS <= dE) handle = 'start'
    else if (dE < thresh) handle = 'end'
    else {
      seekTo(Math.max(trimStartRef.current, Math.min(relX * dur, trimEndRef.current)))
      return
    }

    e.preventDefault()

    const move = (me: MouseEvent) => {
      if (!timelineRef.current) return
      const r = timelineRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(me.clientX - r.left, r.width))
      const t = (x / r.width) * durationRef.current
      if (handle === 'start') {
        const v = Math.max(0, Math.min(t, trimEndRef.current - 0.1))
        trimStartRef.current = v
        setTrimStart(v)
      } else {
        const v = Math.min(durationRef.current, Math.max(t, trimStartRef.current + 0.1))
        trimEndRef.current = v
        setTrimEnd(v)
      }
    }

    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [])

  async function exportCut() {
    if (!file || cutting || ffmpegLoading) return
    setError('')
    setOutputUrl(null)
    setCutProgress(0)

    const progressHandler = (p: number) => {
      if (!isFFmpegLoaded()) setFfmpegProgress(p)
      else setCutProgress(p)
    }

    try {
      // Load FFmpeg if not already loaded
      if (!isFFmpegLoaded()) {
        setFfmpegLoading(true)
        setFfmpegProgress(0)
      }
      const ff = await getFFmpeg(progressHandler)
      setFfmpegLoading(false)
      setCutting(true)

      ff.on('progress', ({ progress }) => setCutProgress(Math.max(0, Math.min(1, progress))))

      const ext = file.name.match(/\.([^.]+)$/)?.[1] ?? 'mp4'
      const inName = `input.${ext}`
      const outName = `output.mp4`

      await ff.writeFile(inName, await fetchFile(file))
      await ff.exec([
        '-i', inName,
        '-ss', trimStart.toFixed(3),
        '-to', trimEnd.toFixed(3),
        '-c', 'copy',
        '-avoid_negative_ts', 'make_zero',
        outName,
      ])

      const data = await ff.readFile(outName) as Uint8Array
      await ff.deleteFile(inName)
      await ff.deleteFile(outName)

      if (outputUrl) URL.revokeObjectURL(outputUrl)
      const blob = new Blob([data as BlobPart], { type: 'video/mp4' })
      setOutputUrl(URL.createObjectURL(blob))
    } catch (err) {
      if (err instanceof Error && err.message === 'called FFmpeg.terminate()') return
      setError(String(err)); resetFFmpeg()
    } finally {
      setFfmpegLoading(false)
      setCutting(false)
    }
  }

  function cancel() { cancelFFmpeg(); setFfmpegLoading(false); setCutting(false); setError('') }

  const startPct = duration > 0 ? (trimStart / duration) * 100 : 0
  const endPct = duration > 0 ? (trimEnd / duration) * 100 : 100
  const currentPct = duration > 0 ? (currentTime / duration) * 100 : 0
  const isBusy = ffmpegLoading || cutting

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Video Cutter</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-5">

        {/* Hidden video element */}
        <video
          ref={videoRef}
          src={videoUrl ?? undefined}
          onLoadedMetadata={onMetadata}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />

        {/* Drop zone */}
        <FileDropZone accept="video/*" onFiles={files => acceptFile(files[0])}>
          {file ? (
            <div>
              <p className="text-sm text-[#e2e4ed] font-mono truncate">{file.name}</p>
              <p className="text-xs text-[#6b7280] mt-1">
                {(file.size / 1024 / 1024).toFixed(1)} MB
                {duration > 0 && ` · ${formatTime(duration)}`}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#6b7280]">Drop a video file here or click to upload</p>
              <p className="text-xs text-[#3a3d4a] mt-1">MP4, WebM, MOV, MKV, AVI · all processing is local</p>
              <p className="text-xs text-[#3a3d4a] mt-2">
                Need to download from YouTube first?{' '}
                <a href="https://github.com/alexta69/metube" target="_blank" rel="noopener noreferrer" className="text-[#6b7280] hover:text-[#9ca3af] underline transition-colors">MeTube</a>
                {' '}is a self-hostable downloader.
              </p>
            </div>
          )}
        </FileDropZone>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {file && duration > 0 && (
          <>
            {/* Video preview */}
            <video
              src={videoUrl ?? undefined}
              className="w-full rounded bg-black"
              style={{ maxHeight: 280 }}
              onClick={togglePlay}
              onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Timeline */}
            <div
              ref={timelineRef}
              className="relative h-10 rounded overflow-hidden cursor-crosshair select-none bg-[#0f1117]"
              onMouseDown={onTimelineMouseDown}
            >
              {/* Unselected dimmed regions */}
              <div className="absolute inset-y-0 left-0 bg-[#0f1117]/80" style={{ width: `${startPct}%` }} />
              <div className="absolute inset-y-0 right-0 bg-[#0f1117]/80" style={{ width: `${100 - endPct}%` }} />

              {/* Selected region */}
              <div
                className="absolute inset-y-0 bg-[#c4af64]/20 border-y border-[#c4af64]/30"
                style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
              />

              {/* Tick marks every 10% */}
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="absolute top-0 bottom-0 w-px bg-[#2a2d3a]" style={{ left: `${(i + 1) * 10}%` }} />
              ))}

              {/* Playhead */}
              <div className="absolute inset-y-0 w-px bg-white/50 pointer-events-none" style={{ left: `${currentPct}%` }} />

              {/* Start handle */}
              <div className="absolute top-0 bottom-0 w-px bg-[#c4af64] pointer-events-none" style={{ left: `${startPct}%` }} />
              <div className="absolute top-0 w-3 h-5 bg-[#c4af64] rounded-b cursor-ew-resize" style={{ left: `${startPct}%`, transform: 'translateX(-50%)' }} />

              {/* End handle */}
              <div className="absolute top-0 bottom-0 w-px bg-[#c4af64] pointer-events-none" style={{ left: `${endPct}%` }} />
              <div className="absolute top-0 w-3 h-5 bg-[#c4af64] rounded-b cursor-ew-resize" style={{ left: `${endPct}%`, transform: 'translateX(-50%)' }} />
            </div>

            {/* Time inputs */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Start (s)</label>
                <input
                  type="number" inputMode="decimal" min={0} max={trimEnd - 0.1} step={0.1}
                  value={trimStart.toFixed(2)}
                  onChange={e => {
                    const v = Math.max(0, Math.min(parseFloat(e.target.value) || 0, trimEndRef.current - 0.1))
                    trimStartRef.current = v
                    setTrimStart(v)
                  }}
                  className="forge-input"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">End (s)</label>
                <input
                  type="number" inputMode="decimal" min={trimStart + 0.1} max={duration} step={0.1}
                  value={trimEnd.toFixed(2)}
                  onChange={e => {
                    const v = Math.min(durationRef.current, Math.max(parseFloat(e.target.value) || 0, trimStartRef.current + 0.1))
                    trimEndRef.current = v
                    setTrimEnd(v)
                  }}
                  className="forge-input"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Selection</label>
                <div className="bg-[#0f1117] border border-[#2a2d3a] text-[#6b7280] rounded px-3 py-2 text-sm">
                  {formatTime(trimEnd - trimStart)}
                </div>
              </div>
            </div>

            {/* Playback + cut */}
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={togglePlay} className="forge-btn-accent">
                {isPlaying ? '⏸ Pause' : '▶ Play selection'}
              </button>
              <span className="text-xs text-[#6b7280] font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button onClick={exportCut} disabled={isBusy} className="forge-btn-accent ml-auto">
                {cutting ? 'Cutting…' : ffmpegLoading ? 'Loading FFmpeg…' : 'Cut & Export MP4'}
              </button>
              {isBusy && <button onClick={cancel} className="text-xs text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer">Cancel</button>}
            </div>

            {/* FFmpeg load progress */}
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

            {/* Cut progress */}
            {cutting && (
              <div>
                <div className="flex justify-between text-xs text-[#6b7280] mb-1">
                  <span>Cutting…</span>
                  <span>{Math.round(cutProgress * 100)}%</span>
                </div>
                <div className="w-full h-1 bg-[#2a2d3a] rounded-full overflow-hidden">
                  <div className="h-full bg-[#c4af64] transition-all duration-150" style={{ width: `${cutProgress * 100}%` }} />
                </div>
              </div>
            )}

            {/* Download */}
            {outputUrl && (
              <div className="flex gap-3 items-center border-t border-[#2a2d3a] pt-4">
                <a href={outputUrl} download={outputName} className="forge-btn-accent">
                  Download {outputName}
                </a>
                <span className="text-xs text-[#6b7280]">
                  {formatTime(trimEnd - trimStart)} · all processing is local
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
