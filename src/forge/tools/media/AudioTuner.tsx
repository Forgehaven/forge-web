import { useState, useEffect, useRef } from 'react'
import { Select } from '../../../components/Select'
import type { SelectOption } from '../../../components/Select'

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function frequencyToNote(freq: number): { note: string; octave: number; cents: number; midi: number } {
  const midi = 12 * (Math.log2(freq / 440)) + 69
  const midiRounded = Math.round(midi)
  const cents = Math.round((midi - midiRounded) * 100)
  const note = NOTES[midiRounded % 12]
  const octave = Math.floor(midiRounded / 12) - 1
  return { note, octave, cents, midi: midiRounded }
}

function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length
  const rms = Math.sqrt(buf.reduce((sum, v) => sum + v * v, 0) / SIZE)
  if (rms < 0.01) return -1

  let r1 = 0
  let r2 = SIZE - 1
  const threshold = 0.2
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < threshold) { r1 = i; break }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < threshold) { r2 = SIZE - i; break }
  }

  const trimmed = buf.slice(r1, r2)
  const len = trimmed.length

  const correlations = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - i; j++) {
      correlations[i] += trimmed[j] * trimmed[j + i]
    }
  }

  let d = 0
  while (correlations[d] > correlations[d + 1]) d++
  let maxVal = -1
  let maxPos = -1
  for (let i = d; i < len; i++) {
    if (correlations[i] > maxVal) { maxVal = correlations[i]; maxPos = i }
  }
  if (maxPos === -1) return -1

  // Parabolic interpolation for accuracy
  const y1 = correlations[maxPos - 1] ?? 0
  const y2 = correlations[maxPos]
  const y3 = correlations[maxPos + 1] ?? 0
  const refined = maxPos - (y3 - y1) / (2 * (2 * y2 - y1 - y3))
  return sampleRate / refined
}

type DetectedNote = {
  freq: number
  note: string
  octave: number
  cents: number
}

type StringDef = { n: number; label?: string; note: string; octave: number; hz: number }
type Instrument = { name: string; notes: StringDef[] }

const INSTRUMENTS: Instrument[] = [
  {
    name: 'Guitar', notes: [
      { n: 6, note: 'E', octave: 2, hz: 82.4 },
      { n: 5, note: 'A', octave: 2, hz: 110.0 },
      { n: 4, note: 'D', octave: 3, hz: 146.8 },
      { n: 3, note: 'G', octave: 3, hz: 196.0 },
      { n: 2, note: 'B', octave: 3, hz: 246.9 },
      { n: 1, note: 'E', octave: 4, hz: 329.6 },
    ],
  },
  {
    name: 'Bass Guitar', notes: [
      { n: 4, note: 'E', octave: 1, hz: 41.2 },
      { n: 3, note: 'A', octave: 1, hz: 55.0 },
      { n: 2, note: 'D', octave: 2, hz: 73.4 },
      { n: 1, note: 'G', octave: 2, hz: 98.0 },
    ],
  },
  {
    name: 'Cello', notes: [
      { n: 4, note: 'C', octave: 2, hz: 65.4 },
      { n: 3, note: 'G', octave: 2, hz: 98.0 },
      { n: 2, note: 'D', octave: 3, hz: 146.8 },
      { n: 1, note: 'A', octave: 3, hz: 220.0 },
    ],
  },
  {
    name: 'Violin', notes: [
      { n: 4, note: 'G', octave: 3, hz: 196.0 },
      { n: 3, note: 'D', octave: 4, hz: 293.7 },
      { n: 2, note: 'A', octave: 4, hz: 440.0 },
      { n: 1, note: 'E', octave: 5, hz: 659.3 },
    ],
  },
  {
    name: 'Flute', notes: [
      { n: 1, label: 'Low',  note: 'C', octave: 4, hz: 261.6 },
      { n: 2, label: 'A440', note: 'A', octave: 4, hz: 440.0 },
      { n: 3, label: 'Mid',  note: 'C', octave: 5, hz: 523.3 },
      { n: 4, label: 'High', note: 'C', octave: 6, hz: 1046.5 },
    ],
  },
]

export function AudioTuner() {
  const [active, setActive] = useState(false)
  const [selectedInstrument, setSelectedInstrument] = useState('Guitar')
  const [detected, setDetected] = useState<DetectedNote | null>(null)
  const [error, setError] = useState('')

  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef    = useRef<AudioContext | null>(null)
  const rafRef    = useRef(0)

  async function start() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)

      streamRef.current = stream
      ctxRef.current = ctx
      setActive(true)

      const freqBuffer: number[] = []
      let silenceFrames = 0
      const BUFFER_SIZE = 30
      const SILENCE_CLEAR = 60

      function loop() {
        const buf = new Float32Array(analyser.fftSize)
        analyser.getFloatTimeDomainData(buf)
        const freq = autoCorrelate(buf, ctx.sampleRate)

        if (freq > 60 && freq < 1500) {
          silenceFrames = 0
          freqBuffer.push(freq)
          if (freqBuffer.length > BUFFER_SIZE) freqBuffer.shift()
          if (freqBuffer.length >= 5) {
            const sorted = [...freqBuffer].sort((a, b) => a - b)
            const median = sorted[Math.floor(sorted.length / 2)]
            const { note, octave, cents } = frequencyToNote(median)
            setDetected({ freq: median, note, octave, cents })
          }
        } else {
          silenceFrames++
          if (silenceFrames > SILENCE_CLEAR) {
            freqBuffer.length = 0
            setDetected(null)
          }
        }

        rafRef.current = requestAnimationFrame(loop)
      }

      rafRef.current = requestAnimationFrame(loop)
    } catch {
      setError('Microphone access denied. Please allow mic access and try again.')
    }
  }

  function stop() {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    ctxRef.current?.close()
    streamRef.current = null
    ctxRef.current = null
    setActive(false)
    setDetected(null)
  }

  useEffect(() => () => stop(), [])

  const cents = detected?.cents ?? 0
  const inTune = Math.abs(cents) <= 5
  const needleAngle = Math.max(-45, Math.min(45, cents * 0.9))

  const noteColor = inTune ? '#4ade80' : Math.abs(cents) < 20 ? '#c4af64' : '#f87171'

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#e2e4ed]">Audio Tuner</h1>
        <div className="w-36">
          <Select
            options={[...INSTRUMENTS].sort((a, b) => a.name.localeCompare(b.name)).map(i => ({ value: i.name, label: i.name }))}
            value={{ value: selectedInstrument, label: selectedInstrument } as SelectOption}
            onChange={opt => { if (opt) setSelectedInstrument(opt.value) }}
          />
        </div>
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg pt-5 px-5 pb-2 flex flex-col items-center gap-4">

        {/* Note display */}
        <div className="flex flex-col items-center gap-1 h-24 justify-center overflow-hidden">
          {detected ? (
            <>
              <div className="flex items-end gap-1">
                <span className="text-7xl font-bold tabular-nums leading-none" style={{ color: noteColor }}>
                  {detected.note}
                </span>
                <span className="text-2xl text-[#6b7280] mb-1">{detected.octave}</span>
              </div>
              <span className="text-sm text-[#6b7280] tabular-nums">{detected.freq.toFixed(1)} Hz</span>
            </>
          ) : active ? (
            <span className="text-sm text-[#4b5563]">Play a note…</span>
          ) : (
            <span className="text-4xl font-bold text-[#2a2d3a]">-</span>
          )}
        </div>

        {/* Meter */}
        <div className="w-full flex flex-col items-center gap-2">
          <div className="relative w-64 h-2 rounded-full bg-[#0f1117] overflow-visible">
            {/* Zone markers */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 rounded-full bg-[#4ade80]/20" />
            {/* Track */}
            <div className="absolute inset-0 rounded-full bg-[#2a2d3a]" />
            {/* Needle */}
            <div
              className="absolute top-1/2 left-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-transform duration-75"
              style={{
                transform: `translateY(-50%) translateX(calc(-50% + ${needleAngle * 1.28}px))`,
                background: noteColor,
                boxShadow: `0 0 6px ${noteColor}`,
              }}
            />
          </div>
          <div className="flex w-64 justify-between text-[9px] text-[#374151] tabular-nums select-none">
            <span>-50¢</span>
            <span>-25¢</span>
            <span style={{ color: inTune ? '#4ade80' : '#374151' }}>0</span>
            <span>+25¢</span>
            <span>+50¢</span>
          </div>
          <span className={`text-xs tabular-nums ${detected ? 'visible' : 'invisible'}`} style={{ color: noteColor }}>
            {cents === 0 ? 'In tune' : `${cents > 0 ? '+' : ''}${cents}¢`}
          </span>
        </div>

        {/* Button */}
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        <button
          onClick={active ? stop : start}
          className={`px-6 py-2 text-sm rounded border transition-colors cursor-pointer ${
            active
              ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
              : 'border-[#c4af64]/40 text-[#c4af64] hover:bg-[#c4af64]/10'
          }`}
        >
          {active ? 'Stop' : 'Start Tuner'}
        </button>
      </div>

      {/* Reference */}
      {(() => {
        const instrument = INSTRUMENTS.find(i => i.name === selectedInstrument)!
        return (
          <div className="mt-6 flex flex-col gap-3">
            <hr className="border-[#2a2d3a]" />
            <p className="text-xs text-[#6b7280] uppercase tracking-widest font-medium text-center">Tuning Reference</p>

            <div className="rounded-lg border border-[#2a2d3a] overflow-hidden">
              <div className="px-4 py-1.5 bg-[#1a1d27] border-b border-[#2a2d3a] text-center">
                <span className="text-xs text-[#9ca3af] uppercase tracking-widest font-semibold">
                  {instrument.name} <span className="text-[#6b7280] normal-case tracking-normal font-normal">
                    {instrument.notes.every(s => s.label) ? '(key refs)' : `(${instrument.notes.length}-string)`}
                  </span>
                </span>
              </div>
              <div className="grid divide-x divide-[#1e2130]" style={{ gridTemplateColumns: `repeat(${instrument.notes.length}, 1fr)` }}>
                {instrument.notes.map(({ n, label, note, octave, hz }) => (
                  <div key={n} className="flex flex-col items-center py-2.5 gap-1">
                    <span className="text-[10px] text-[#6b7280]">{label ?? `S${n}`}</span>
                    <span className="text-xl font-bold text-[#e2e4ed]">{note}<span className="text-sm text-[#6b7280] ml-0.5">{octave}</span></span>
                    <span className="text-[10px] text-[#6b7280] tabular-nums">{hz} Hz</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
