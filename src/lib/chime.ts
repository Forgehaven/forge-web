// Synthesized notification chime - no audio assets. The context must be
// created/resumed during a user gesture (browser autoplay policy); after a
// reload a one-time pointerdown listener re-arms it for persisted alarms.
let ctx: AudioContext | null = null
let gestureHooked = false

export function ensureAudio() {
  if (typeof AudioContext === 'undefined') return
  try {
    ctx = ctx ?? new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch { /* audio unavailable */ }
}

export function hookAudioGesture() {
  if (gestureHooked || typeof window === 'undefined') return
  gestureHooked = true
  window.addEventListener('pointerdown', () => ensureAudio(), { once: true })
}

export type ChimeLevel = 'soft' | 'normal' | 'loud'

// Master output volume. Slider fraction 0..1 maps to a 0..4 gain multiplier
// (25% = the original full volume); the top half clips on purpose - loud.
let volume = 1

export function setChimeVolume(v: number) {
  volume = Math.max(0, Math.min(1, v)) * 4
}

function note(freq: number, at: number, durMs: number, peak: number, wave: OscillatorType) {
  const gainPeak = peak * volume
  if (gainPeak <= 0) return
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = wave
  osc.frequency.value = freq
  const t = ctx.currentTime + at
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(gainPeak, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, t + durMs / 1000)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + durMs / 1000 + 0.02)
}

// soft: mellow sine arpeggio (PlayOnline-style mood, original notes - the real
// theme is an SE composition). normal: two-note ding x2. loud: obnoxious
// square-wave alarm x4.
const PATTERNS: Record<ChimeLevel, () => void> = {
  soft: () => {
    const arp = [369.99, 466.16, 554.37, 739.99, 554.37]
    arp.forEach((f, i) => note(f, i * 0.22, 500, 0.1, 'sine'))
  },
  normal: () => {
    for (const offset of [0, 0.5]) {
      note(880, offset, 140, 0.25, 'triangle')
      note(1174.66, offset + 0.16, 200, 0.25, 'triangle')
    }
  },
  loud: () => {
    for (let i = 0; i < 4; i++) {
      const offset = i * 0.35
      note(1568, offset, 150, 0.5, 'square')
      note(2093, offset + 0.15, 150, 0.5, 'square')
    }
  },
}

export function playChime(level: ChimeLevel = 'normal') {
  if (typeof AudioContext === 'undefined') return
  try {
    ensureAudio()
    if (!ctx) return
    const play = PATTERNS[level] ?? PATTERNS.normal
    if (ctx.state === 'running') play()
    else void ctx.resume().then(play).catch(() => { /* blocked until a gesture */ })
  } catch { /* audio unavailable */ }
}
