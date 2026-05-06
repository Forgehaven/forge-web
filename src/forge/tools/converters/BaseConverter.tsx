import { useState } from 'react'

type Base = 'binary' | 'octal' | 'decimal' | 'hex'

const baseMap: Record<Base, { label: string; radix: number; prefix: string; placeholder: string }> = {
  binary:  { label: 'Binary',      radix: 2,  prefix: '0b', placeholder: '1010' },
  octal:   { label: 'Octal',       radix: 8,  prefix: '0o', placeholder: '12' },
  decimal: { label: 'Decimal',     radix: 10, prefix: '',   placeholder: '42' },
  hex:     { label: 'Hexadecimal', radix: 16, prefix: '0x', placeholder: 'FF' },
}

export function BaseConverter() {
  const [values, setValues] = useState<Record<Base, string>>({ binary: '', octal: '', decimal: '', hex: '' })

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono"

  function handleChange(base: Base, raw: string) {
    const { radix } = baseMap[base]
    const trimmed = raw.trim()
    if (!trimmed) {
      setValues({ binary: '', octal: '', decimal: '', hex: '' })
      return
    }
    const n = parseInt(trimmed, radix)
    if (isNaN(n) || n < 0) {
      setValues(prev => ({ ...prev, [base]: raw }))
      return
    }
    setValues({
      binary:  n.toString(2),
      octal:   n.toString(8),
      decimal: n.toString(10),
      hex:     n.toString(16).toUpperCase(),
    })
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Base Converter</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        {(Object.keys(baseMap) as Base[]).map(base => {
          const { label, prefix, placeholder } = baseMap[base]
          return (
            <div key={base}>
              <label className="block text-xs text-[#6b7280] mb-1">
                {label} {prefix && <span className="text-[#c4af64]">({prefix})</span>}
              </label>
              <input
                className={inputClass}
                value={values[base]}
                onChange={e => handleChange(base, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
