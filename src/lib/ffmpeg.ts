import { FFmpeg } from '@ffmpeg/ffmpeg'

// Singleton shared by the ffmpeg-backed media tools - load once, reuse across exports.
// One stable progress listener dispatches to whichever tool called getFFmpeg last,
// so switching tools rewires the progress bar instead of leaving it on a stale closure.
let _ff: FFmpeg | null = null
let _loaded: FFmpeg | null = null
let _ready: Promise<FFmpeg> | null = null
let _onProgress: (p: number) => void = () => {}

export function isFFmpegLoaded() {
  return _loaded !== null
}

export function getFFmpeg(onProgress: (p: number) => void): Promise<FFmpeg> {
  _onProgress = onProgress
  if (_ready) return _ready
  const ff = new FFmpeg()
  _ff = ff
  ff.on('progress', ({ progress }) => _onProgress(Math.max(0, Math.min(1, progress))))
  _ready = ff.load({
    coreURL: '/ffmpeg/ffmpeg-core.js',
    wasmURL: '/ffmpeg/ffmpeg-core.wasm',
  }).then(() => { _loaded = ff; return ff })
  return _ready
}

export function cancelFFmpeg() { _ff?.terminate(); _ff = null; _loaded = null; _ready = null }

// Error path: drop the instance without terminating.
export function resetFFmpeg() { _ff = null; _loaded = null; _ready = null }
