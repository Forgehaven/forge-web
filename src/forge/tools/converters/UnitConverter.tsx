import { useState } from 'react'
import { Select } from '../../../components/Select'

type Category = 'length' | 'weight' | 'temperature'

const conversions: Record<Category, { label: string; units: string[]; convert: (value: number, from: string, to: string) => number }> = {
  length: {
    label: 'Length',
    units: ['meters', 'kilometers', 'miles', 'feet', 'inches', 'centimeters'],
    convert(value, from, to) {
      const toMeters: Record<string, number> = {
        meters: 1, kilometers: 1000, miles: 1609.344,
        feet: 0.3048, inches: 0.0254, centimeters: 0.01,
      }
      return (value * toMeters[from]) / toMeters[to]
    },
  },
  weight: {
    label: 'Weight',
    units: ['kilograms', 'grams', 'pounds', 'ounces', 'tonnes'],
    convert(value, from, to) {
      const toKg: Record<string, number> = {
        kilograms: 1, grams: 0.001, pounds: 0.453592,
        ounces: 0.0283495, tonnes: 1000,
      }
      return (value * toKg[from]) / toKg[to]
    },
  },
  temperature: {
    label: 'Temperature',
    units: ['celsius', 'fahrenheit', 'kelvin'],
    convert(value, from, to) {
      let celsius = value
      if (from === 'fahrenheit') celsius = (value - 32) * 5 / 9
      if (from === 'kelvin') celsius = value - 273.15
      if (to === 'celsius') return celsius
      if (to === 'fahrenheit') return celsius * 9 / 5 + 32
      return celsius + 273.15
    },
  },
}

export function UnitConverter() {
  const [category, setCategory] = useState<Category>('length')
  const [value, setValue] = useState('')
  const [from, setFrom] = useState('miles')
  const [to, setTo] = useState('kilometers')

  const current = conversions[category]
  const result = value !== '' && !isNaN(Number(value))
    ? current.convert(Number(value), from, to)
    : null

  const categoryDefaults: Record<Category, [string, string]> = {
    length: ['miles', 'kilometers'],
    weight: ['pounds', 'kilograms'],
    temperature: ['fahrenheit', 'celsius'],
  }

  function handleCategoryChange(cat: Category) {
    setCategory(cat)
    const [defaultFrom, defaultTo] = categoryDefaults[cat]
    setFrom(defaultFrom)
    setTo(defaultTo)
    setValue('')
  }

  const inputClass ="bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono"

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Unit Converter</h1>

      <div className="flex gap-2 mb-6">
        {(Object.keys(conversions) as Category[]).map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              category === cat
                ? 'bg-[#c4af64] text-white'
                : 'bg-[#1a1d27] text-[#9ca3af] hover:text-[#e2e4ed] border border-[#2a2d3a]'
            }`}
          >
            {conversions[cat].label}
          </button>
        ))}
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-[#6b7280] mb-1">From</label>
            <Select
              options={current.units.map(u => ({ value: u, label: u }))}
              value={{ value: from, label: from }}
              onChange={opt => opt && setFrom(opt.value)}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-[#6b7280] mb-1">To</label>
            <Select
              options={current.units.map(u => ({ value: u, label: u }))}
              value={{ value: to, label: to }}
              onChange={opt => opt && setTo(opt.value)}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Value</label>
          <input
            className={inputClass}
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Enter value..."
          />
        </div>

        {result !== null && (
          <div className="pt-2 border-t border-[#2a2d3a]">
            <p className="text-xs text-[#6b7280] mb-1">Result</p>
            <p className="text-2xl font-mono text-[#c4af64]">
              {parseFloat(result.toPrecision(8)).toString()}{' '}
              <span className="text-sm text-[#9ca3af]">{to}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
