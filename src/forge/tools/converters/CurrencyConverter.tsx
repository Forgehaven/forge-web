import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Select } from '../../../components/Select'
import { API_URLS, POLL_INTERVALS } from '../../../config/apiUrls'

const CDN = API_URLS.currencyCdn

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function CurrencyConverter() {
  const [amount, setAmount] = useState('1')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('CAD')

  const { data: currenciesRaw } = useSWR<Record<string, string>>(
    `${CDN}/currencies.json`,
    fetcher
  )

  const { data: geoData } = useSWR(
    `${API_URLS.ipGeo}/json/`,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  )

  const { data: rateData, isLoading, error } = useSWR(
    `${CDN}/currencies/${from.toLowerCase()}.json`,
    fetcher,
    { refreshInterval: POLL_INTERVALS.currency }
  )

  const currencyList: [string, string][] = currenciesRaw
    ? Object.entries(currenciesRaw)
        .filter(([, name]) => name && name.trim())
        .map(([code, name]): [string, string] => [code.toUpperCase(), name])
        .sort(([a], [b]) => a.localeCompare(b))
    : []

  useEffect(() => {
    if (!geoData?.currency || !currencyList.length) return
    const code = (geoData.currency as string).toUpperCase()
    if (code !== 'CAD' && currencyList.some(([c]) => c === code)) {
      setFrom(code) // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [geoData, currencyList.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const rate: number | undefined = from === to
    ? 1
    : rateData?.[from.toLowerCase()]?.[to.toLowerCase()]

  const parsed = parseFloat(amount)
  const result = rate !== undefined && !isNaN(parsed) ? parsed * rate : null

  function swap() {
    setFrom(to)
    setTo(from)
  }

  const currencyOptions = currencyList.map(([code, name]) => ({
    value: code,
    label: `${code} — ${name}`,
  }))

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Currency Converter</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-5">

        <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] gap-3 md:items-end">
          <div>
            <label className="block text-xs text-[#6b7280] mb-1">From</label>
            <Select
              options={currencyOptions}
              value={currencyOptions.find(o => o.value === from) ?? null}
              onChange={opt => opt && setFrom(opt.value)}
              isSearchable
              className="w-full"
            />
          </div>
          <button
            onClick={swap}
            className="self-center md:self-auto px-3 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer"
          >
            <span className="md:hidden">↕</span>
            <span className="hidden md:inline">⇄</span>
          </button>
          <div>
            <label className="block text-xs text-[#6b7280] mb-1">To</label>
            <Select
              options={currencyOptions}
              value={currencyOptions.find(o => o.value === to) ?? null}
              onChange={opt => opt && setTo(opt.value)}
              isSearchable
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min={0}
            step="any"
            className="bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono"
          />
        </div>

        {error && <p className="text-xs text-red-400">Could not fetch exchange rates.</p>}

        {result !== null && (
          <div className="bg-[#0f1117] rounded-lg px-5 py-4 flex flex-col gap-1">
            <p className="text-xs text-[#6b7280]">{amount} {from} =</p>
            <p className="text-3xl font-mono font-semibold text-[#c4af64]">
              {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              <span className="text-lg ml-2 text-[#9ca3af]">{to}</span>
            </p>
            {rate !== undefined && from !== to && (
              <p className="text-xs text-[#6b7280] mt-1">
                1 {from} = {rate.toFixed(6)} {to}
                {rateData?.date && ` · rates from ${rateData.date}`}
              </p>
            )}
          </div>
        )}

        {isLoading && !rateData && (
          <p className="text-xs text-[#6b7280]">Fetching exchange rates…</p>
        )}

      </div>
    </div>
  )
}
