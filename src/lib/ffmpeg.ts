import { FFmpeg } from '@ffmpeg/ffmpeg'

// Singleton shared by the ffmpeg-backed media tools - load once, reuse across exports.
let _ff: FFmpeg | null = null
let _loaded: FFmpeg | null = null
let _ready: Promise<FFmpeg> | null = null

export function isFFmpegLoaded() {
  return _loaded !== null
}

export function getFFmpeg(onProgress: (p: number) => void): Promise<FFmpeg> {
  if (_ready) return _ready
  const ff = new FFmpeg()
  _ff = ff
  ff.on('progress', ({ progress }) => onProgress(Math.max(0, Math.min(1, progress))))
  _ready = ff.load({
    coreURL: '/ffmpeg/ffmpeg-core.js',
    wasmURL: '/ffmpeg/ffmpeg-core.wasm',
  }).then(() => { _loaded = ff; return ff })
  return _ready
}

export function cancelFFmpeg() { _ff?.terminate(); _ff = null; _loaded = null; _ready = null }

// Error path: drop the instance without terminating.
export function resetFFmpeg() { _ff = null; _loaded = null; _ready = null }
