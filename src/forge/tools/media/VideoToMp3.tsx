import { useState, useRef } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { Select } from '../../../components/Select'
import type { SelectOption } from '../../../components/Select'
import { ProgressBar } from '../../../components/UI'

const bitrateOptions: SelectOption[] = [
  { value: '128', label: '128 kbps — standard' },
  { value: '192', label: '192 kbps — high quality' },
  { value: '320', label: '320 kbps — maximum' },
]

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


export function VideoToMp3() {
  const [file, setFile] = useState<File | null>(null)
  const [bitrate, setBitrate] = useState(192)
  const [dropping, setDropping] = useState(false)
  const [ffmpegLoading, setFfmpegLoading] = useState(false)
  const [ffmpegProgress, setFfmpegProgress] = useState(0)
  const [converting, setConverting] = useState(false)
  const [convProgress, setConvProgress] = useState(0)
  const [error, setError] = useState('')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputName, setOutputName] = useState('')
  const [outputSize, setOutputSize] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  function acceptFile(f: File) {
    if (!f.type.startsWith('video/')) { setError('Please select a video file.'); return }
    setError(''); setOutputUrl(null); setFile(f)
    setOutputName(f.name.replace(/\.[^.]+$/, '') + '.mp3')
  }

  async function convert() {
    if (!file || converting || ffmpegLoading) return
    setError(''); setOutputUrl(null); setConvProgress(0)
    const progressHandler = (p: number) => {
      if (!_ffmpeg) setFfmpegProgress(p); else setConvProgress(p)
    }
    try {
      if (!_ffmpeg) { setFfmpegLoading(true); setFfmpegProgress(0) }
      const ff = await getFFmpeg(progressHandler)
      setFfmpegLoading(false); setConverting(true)
      ff.on('progress', ({ progress }) => setConvProgress(Math.max(0, Math.min(1, progress))))
      const ext = file.name.match(/\.([^.]+)$/)?.[1] ?? 'mp4'
      const inName = `input.${ext}`
      await ff.writeFile(inName, await fetchFile(file))
      await ff.exec(['-i', inName, '-vn', '-c:a', 'libmp3lame', '-b:a', `${bitrate}k`, 'output.mp3'])
      const data = await ff.readFile('output.mp3') as Uint8Array
      await ff.deleteFile(inName); await ff.deleteFile('output.mp3')
      if (outputUrl) URL.revokeObjectURL(outputUrl)
      const blob = new Blob([data as BlobPart], { type: 'audio/mp3' })
      setOutputUrl(URL.createObjectURL(blob))
      setOutputSize(blob.size)
    } catch (err) {
      setError(String(err))
      _ffmpegReady = null; _ffmpeg = null
    } finally { setFfmpegLoading(false); setConverting(false) }
  }

  const btnClass = "px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
  const isBusy =ffmpegLoading || converting

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Video to MP3</h1>
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-5">

        <div
          onDragOver={e => { e.preventDefault(); setDropping(true) }}
          onDragLeave={() => setDropping(false)}
          onDrop={e => { e.preventDefault(); setDropping(false); const f = e.dataTransfer.files[0]; if (f) acceptFile(f) }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dropping ? 'border-[#c4af64] bg-[#c4af64]/5' : 'border-[#2a2d3a] hover:border-[#3a3d4a]'}`}
        >
          <input ref={fileRef} type="file" accept="video/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f) }} />
          {file ? (
            <div>
              <p className="text-sm text-[#e2e4ed] font-mono truncate">{file.name}</p>
              <p className="text-xs text-[#6b7280] mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#6b7280]">Drop a video file here or click to upload</p>
              <p className="text-xs text-[#3a3d4a] mt-1">MP4, WebM, MOV, MKV · audio track extracted as MP3 · all processing is local</p>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {file && (
          <>
            <div>
              <label className="block text-xs text-[#6b7280] mb-1">Output quality</label>
              <Select
                options={bitrateOptions}
                value={bitrateOptions.find(o => o.value === String(bitrate)) ?? null}
                onChange={opt => opt && setBitrate(Number(opt.value))}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-3">
              <button onClick={convert} disabled={isBusy} className={btnClass}>
                {converting ? 'Extracting…' : ffmpegLoading ? 'Loading FFmpeg…' : 'Extract MP3'}
              </button>
            </div>

            {ffmpegLoading && <ProgressBar label="Loading FFmpeg (~24 MB, cached after first use)…" pct={ffmpegProgress} />}
            {converting && <ProgressBar label="Extracting audio…" pct={convProgress} />}

            {outputUrl && (
              <div className="flex gap-3 items-center border-t border-[#2a2d3a] pt-4">
                <a href={outputUrl} download={outputName} className={btnClass}>Download {outputName}</a>
                <span className="text-xs text-[#6b7280]">{(outputSize / 1024 / 1024).toFixed(2)} MB · all processing is local</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
