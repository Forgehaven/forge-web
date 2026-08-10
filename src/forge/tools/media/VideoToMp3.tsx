import { useState } from 'react'
import { fetchFile } from '@ffmpeg/util'
import { Select } from '../../../components/Select'
import type { SelectOption } from '../../../components/Select'
import { ProgressBar } from '../../../components/UI'
import { FileDropZone } from '../../../components/FileDropZone'
import { getFFmpeg, cancelFFmpeg, resetFFmpeg, isFFmpegLoaded } from '../../../lib/ffmpeg'

const bitrateOptions: SelectOption[] = [
  { value: '128', label: '128 kbps - standard' },
  { value: '192', label: '192 kbps - high quality' },
  { value: '320', label: '320 kbps - maximum' },
]

export function VideoToMp3() {
  const [file, setFile] = useState<File | null>(null)
  const [bitrate, setBitrate] = useState(192)
  const [ffmpegLoading, setFfmpegLoading] = useState(false)
  const [ffmpegProgress, setFfmpegProgress] = useState(0)
  const [converting, setConverting] = useState(false)
  const [convProgress, setConvProgress] = useState(0)
  const [error, setError] = useState('')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputName, setOutputName] = useState('')
  const [outputSize, setOutputSize] = useState(0)

  function acceptFile(f: File) {
    if (!f.type.startsWith('video/')) { setError('Please select a video file.'); return }
    setError(''); setOutputUrl(null); setFile(f)
    setOutputName(f.name.replace(/\.[^.]+$/, '') + '.mp3')
  }

  async function convert() {
    if (!file || converting || ffmpegLoading) return
    setError(''); setOutputUrl(null); setConvProgress(0)
    const progressHandler = (p: number) => {
      if (!isFFmpegLoaded()) setFfmpegProgress(p); else setConvProgress(p)
    }
    try {
      if (!isFFmpegLoaded()) { setFfmpegLoading(true); setFfmpegProgress(0) }
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
      if (err instanceof Error && err.message === 'called FFmpeg.terminate()') return
      setError(String(err)); resetFFmpeg()
    } finally { setFfmpegLoading(false); setConverting(false) }
  }

  function cancel() { cancelFFmpeg(); setFfmpegLoading(false); setConverting(false); setError('') }

  const isBusy = ffmpegLoading || converting

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Video to MP3</h1>
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-5">

        <FileDropZone accept="video/*" onFiles={files => acceptFile(files[0])}>
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
        </FileDropZone>

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
              <button onClick={convert} disabled={isBusy} className="forge-btn-accent">
                {converting ? 'Extracting…' : ffmpegLoading ? 'Loading FFmpeg…' : 'Extract MP3'}
              </button>
              {isBusy && <button onClick={cancel} className="text-xs text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer">Cancel</button>}
            </div>

            {ffmpegLoading && <ProgressBar label="Loading FFmpeg (~24 MB, cached after first use)…" pct={ffmpegProgress} />}
            {converting && <ProgressBar label="Extracting audio…" pct={convProgress} />}

            {outputUrl && (
              <div className="flex gap-3 items-center border-t border-[#2a2d3a] pt-4">
                <a href={outputUrl} download={outputName} className="forge-btn-accent">Download {outputName}</a>
                <span className="text-xs text-[#6b7280]">{(outputSize / 1024 / 1024).toFixed(2)} MB · all processing is local</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
