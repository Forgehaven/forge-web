import { useState, useRef, useEffect, useCallback } from 'react'
import { FileDropZone } from '../../../components/FileDropZone'
import { formatTime } from '../../../lib/time'

// Lazy-load the IIFE build from /public to avoid Vite module-resolution issues
let _lameReady: Promise<void> | null = null
function ensureLamejs(): Promise<void> {
  if (_lameReady) return _lameReady
  _lameReady = new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((globalThis as any).lamejs) { resolve(); return }
    const s = document.createElement('script')
    s.src = '/lamejs.iife.js'
    s.onload = () => resolve()
    s.onerror = () => { _lameReady = null; reject(new Error('Failed to load MP3 encoder')) }
    document.head.appendChild(s)
  })
  return _lameReady
}

function sliceToMp3(buf: AudioBuffer, startSec: number, endSec: number): Blob {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { Mp3Encoder } = (globalThis as any).lamejs

  const sr = buf.sampleRate
  const ch = buf.numberOfChannels
  const s0 = Math.floor(startSec * sr)
  const s1 = Math.min(Math.floor(endSec * sr), buf.length)
  const n = Math.max(0, s1 - s0)

  const toInt16 = (floatArr: Float32Array, from: number, len: number): Int16Array => {
    const out = new Int16Array(len)
    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, floatArr[from + i]))
      out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    return out
  }

  // Copy Int8Array chunk into a plain ArrayBuffer so Blob accepts it
  const toArrayBuffer = (src: Int8Array): ArrayBuffer => {
    const ab = new ArrayBuffer(src.length)
    new Uint8Array(ab).set(src)
    return ab
  }

  const leftData = buf.getChannelData(0)
  const rightData = ch > 1 ? buf.getChannelData(1) : buf.getChannelData(0)
  const numChannels = ch > 1 ? 2 : 1

  const encoder = new Mp3Encoder(numChannels, sr, 128)
  const chunkSize = 1152
  const chunks: ArrayBuffer[] = []

  for (let i = 0; i < n; i += chunkSize) {
    const len = Math.min(chunkSize, n - i)
    const left = toInt16(leftData, s0 + i, len)
    const right = numChannels > 1 ? toInt16(rightData, s0 + i, len) : left
    const mp3buf: Int8Array = encoder.encodeBuffer(left, right)
    if (mp3buf.length > 0) chunks.push(toArrayBuffer(mp3buf))
  }

  const tail: Int8Array = encoder.flush()
  if (tail.length > 0) chunks.push(toArrayBuffer(tail))

  return new Blob(chunks, { type: 'audio/mp3' })
}

export function AudioCutter() {
  const [file, setFile] = useState<File | null>(null)
  const [audioBuf, setAudioBuf] = useState<AudioBuffer | null>(null)
  const [duration, setDuration] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDecoding, setIsDecoding] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputName, setOutputName] = useState('')

  const actxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const playStartAudioTimeRef = useRef(0)
  const playStartPositionRef = useRef(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const waveRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)

  // Stable refs for closures - avoids stale state in event handlers
  const audioBufRef = useRef<AudioBuffer | null>(null)
  const trimStartRef = useRef(0)
  const trimEndRef = useRef(0)
  const currentTimeRef = useRef(0)
  const durationRef = useRef(0)

  const redraw = useCallback(() => {
    const buf = audioBufRef.current
    const canvas = canvasRef.current
    if (!buf || !canvas) return
    const { width, height } = canvas
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, width, height)

    const data = buf.getChannelData(0)
    const step = Math.max(1, Math.floor(data.length / width))
    const dur = buf.duration
    const mid = height / 2

    for (let x = 0; x < width; x++) {
      const i0 = x * step
      let mn = 0, mx = 0
      for (let j = 0; j < step; j++) {
        const val = data[i0 + j] ?? 0
        if (val < mn) mn = val
        if (val > mx) mx = val
      }
      const t = (x / width) * dur
      const inTrim = t >= trimStartRef.current && t <= trimEndRef.current
      ctx.fillStyle = inTrim ? '#c4af64' : '#2a2d3a'
      const top = mid - mx * mid * 0.9
      const h = Math.max(1, (mx - mn) * mid * 0.9)
      ctx.fillRect(x, top, 1, h)
    }

    if (dur > 0) {
      const px = (currentTimeRef.current / dur) * width
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(px, 0)
      ctx.lineTo(px, height)
      ctx.stroke()
    }
  }, [])

  useEffect(() => {
    return () => {
      stopSource()
      actxRef.current?.close()
    }
  }, [])

  useEffect(() => {
    audioBufRef.current = audioBuf
    trimStartRef.current = trimStart
    trimEndRef.current = trimEnd
    currentTimeRef.current = currentTime
    durationRef.current = duration
    redraw()
  }, [audioBuf, trimStart, trimEnd, currentTime, duration, redraw])

  useEffect(() => {
    if (!isPlaying) return
    const tick = () => {
      const actx = actxRef.current
      if (!actx || !sourceRef.current) return
      const elapsed = actx.currentTime - playStartAudioTimeRef.current
      const current = Math.min(playStartPositionRef.current + elapsed, trimEndRef.current)
      currentTimeRef.current = current
      setCurrentTime(current)
      if (current >= trimEndRef.current) {
        setIsPlaying(false)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying])

  function stopSource() {
    try { sourceRef.current?.stop(0) } catch { /* already stopped */ }
    sourceRef.current = null
  }

  async function acceptFile(f: File) {
    setError('')
    setOutputUrl(null)
    setIsPlaying(false)
    cancelAnimationFrame(rafRef.current)
    stopSource()
    setFile(f)

    setIsDecoding(true)
    try {
      const actx = new AudioContext()
      const decoded = await actx.decodeAudioData(await f.arrayBuffer())
      await actx.close()

      audioBufRef.current = decoded
      trimStartRef.current = 0
      trimEndRef.current = decoded.duration
      durationRef.current = decoded.duration
      currentTimeRef.current = 0

      setAudioBuf(decoded)
      setDuration(decoded.duration)
      setTrimStart(0)
      setTrimEnd(decoded.duration)
      setCurrentTime(0)
      setOutputName(f.name.replace(/\.[^.]+$/, '') + '-cut.mp3')
    } catch {
      setError('Could not decode this audio file. Try MP3, WAV, or OGG.')
    }
    setIsDecoding(false)
  }

  function togglePlay() {
    if (!audioBuf) return
    if (isPlaying) {
      const actx = actxRef.current
      if (actx) {
        const elapsed = actx.currentTime - playStartAudioTimeRef.current
        const pos = Math.min(playStartPositionRef.current + elapsed, trimEndRef.current)
        currentTimeRef.current = pos
        setCurrentTime(pos)
      }
      stopSource()
      setIsPlaying(false)
      return
    }

    let from = currentTimeRef.current
    if (from < trimStartRef.current || from >= trimEndRef.current) from = trimStartRef.current

    if (!actxRef.current) actxRef.current = new AudioContext()
    const actx = actxRef.current

    const doPlay = () => {
      stopSource()
      const source = actx.createBufferSource()
      source.buffer = audioBufRef.current!
      source.connect(actx.destination)
      source.start(0, from, trimEndRef.current - from)
      source.onended = () => {
        if (sourceRef.current === source) {
          sourceRef.current = null
          setIsPlaying(false)
          currentTimeRef.current = trimEndRef.current
          setCurrentTime(trimEndRef.current)
        }
      }
      sourceRef.current = source
      playStartAudioTimeRef.current = actx.currentTime
      playStartPositionRef.current = from
      setIsPlaying(true)
    }

    if (actx.state === 'suspended') {
      actx.resume().then(doPlay)
    } else {
      doPlay()
    }
  }

  function onWaveMouseDown(e: React.MouseEvent) {
    if (!audioBuf || !waveRef.current) return
    const rect = waveRef.current.getBoundingClientRect()
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
      const t = relX * dur
      if (t >= trimStartRef.current && t <= trimEndRef.current) {
        currentTimeRef.current = t
        setCurrentTime(t)
        redraw()
      }
      return
    }

    e.preventDefault()

    const move = (me: MouseEvent) => {
      if (!waveRef.current) return
      const r = waveRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(me.clientX - r.left, r.width))
      const t = (x / r.width) * durationRef.current
      if (handle === 'start') {
        const v = Math.max(0, Math.min(t, trimEndRef.current - 0.05))
        trimStartRef.current = v
        setTrimStart(v)
      } else {
        const v = Math.min(durationRef.current, Math.max(t, trimStartRef.current + 0.05))
        trimEndRef.current = v
        setTrimEnd(v)
      }
      redraw()
    }

    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  function exportCut() {
    if (!audioBuf || isExporting) return
    if (outputUrl) URL.revokeObjectURL(outputUrl)
    setIsExporting(true)
    setError('')
    ensureLamejs()
      .then(() => {
        const blob = sliceToMp3(audioBuf!, trimStart, trimEnd)
        setOutputUrl(URL.createObjectURL(blob))
      })
      .catch(() => setError('Failed to load MP3 encoder. Check your connection and try again.'))
      .finally(() => setIsExporting(false))
  }

  const startPct = duration > 0 ? (trimStart / duration) * 100 : 0
  const endPct = duration > 0 ? (trimEnd / duration) * 100 : 100

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Audio Cutter</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-5">

        {/* Drop zone */}
        <FileDropZone accept="audio/*" onFiles={files => acceptFile(files[0])}>
          {file ? (
            <div>
              <p className="text-sm text-[#e2e4ed] font-mono truncate">{file.name}</p>
              <p className="text-xs text-[#6b7280] mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
                {duration > 0 && ` · ${formatTime(duration)}`}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#6b7280]">Drop an audio file here or click to upload</p>
              <p className="text-xs text-[#3a3d4a] mt-1">MP3, WAV, OGG, FLAC, M4A, AAC · all processing is local</p>
              <p className="text-xs text-[#3a3d4a] mt-2">
                Need to download from YouTube first?{' '}
                <a href="https://github.com/alexta69/metube" target="_blank" rel="noopener noreferrer" className="text-[#6b7280] hover:text-[#9ca3af] underline transition-colors">MeTube</a>
                {' '}is a self-hostable downloader.
              </p>
            </div>
          )}
        </FileDropZone>

        {isDecoding && <p className="text-xs text-[#6b7280]">Decoding audio…</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}

        {audioBuf && (
          <>
            {/* Waveform with draggable trim handles */}
            <div
              ref={waveRef}
              className="relative rounded overflow-hidden cursor-crosshair select-none bg-[#0f1117]"
              style={{ height: 80 }}
              onMouseDown={onWaveMouseDown}
            >
              <canvas ref={canvasRef} width={1200} height={80} className="w-full h-full block" />

              <div className="absolute top-0 bottom-0 w-px bg-[#c4af64] pointer-events-none" style={{ left: `${startPct}%` }} />
              <div className="absolute top-0 w-3 h-4 bg-[#c4af64] rounded-b cursor-ew-resize" style={{ left: `${startPct}%`, transform: 'translateX(-50%)' }} />

              <div className="absolute top-0 bottom-0 w-px bg-[#c4af64] pointer-events-none" style={{ left: `${endPct}%` }} />
              <div className="absolute top-0 w-3 h-4 bg-[#c4af64] rounded-b cursor-ew-resize" style={{ left: `${endPct}%`, transform: 'translateX(-50%)' }} />
            </div>

            {/* Timestamp inputs */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Start (s)</label>
                <input
                  type="number" inputMode="decimal" min={0} max={trimEnd - 0.05} step={0.01}
                  value={trimStart.toFixed(2)}
                  onChange={e => {
                    const v = Math.max(0, Math.min(parseFloat(e.target.value) || 0, trimEndRef.current - 0.05))
                    trimStartRef.current = v
                    setTrimStart(v)
                    redraw()
                  }}
                  className="forge-input"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">End (s)</label>
                <input
                  type="number" inputMode="decimal" min={trimStart + 0.05} max={duration} step={0.01}
                  value={trimEnd.toFixed(2)}
                  onChange={e => {
                    const v = Math.min(durationRef.current, Math.max(parseFloat(e.target.value) || 0, trimStartRef.current + 0.05))
                    trimEndRef.current = v
                    setTrimEnd(v)
                    redraw()
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
              <button onClick={exportCut} disabled={isExporting} className="forge-btn-accent ml-auto">
                {isExporting ? 'Exporting…' : 'Cut & Export MP3'}
              </button>
            </div>

            {/* Download */}
            {outputUrl && (
              <div className="flex gap-3 items-center border-t border-[#2a2d3a] pt-4">
                <a href={outputUrl} download={outputName} className="forge-btn-accent">
                  Download {outputName}
                </a>
              </div>
            )}
            {outputUrl && (
              <p className="text-xs text-[#6b7280]">
                {formatTime(trimEnd - trimStart)} exported as MP3 128kbps · all processing is local
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
