import { useState } from 'react'
import { Select } from '../../../components/Select'
import type { SelectOption } from '../../../components/Select'

const languages: SelectOption[] = [
  { value: 'af', label: 'Afrikaans' },
  { value: 'sq', label: 'Albanian' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hy', label: 'Armenian' },
  { value: 'az', label: 'Azerbaijani' },
  { value: 'eu', label: 'Basque' },
  { value: 'bn', label: 'Bengali' },
  { value: 'bs', label: 'Bosnian' },
  { value: 'bg', label: 'Bulgarian' },
  { value: 'my', label: 'Burmese' },
  { value: 'ca', label: 'Catalan' },
  { value: 'zh', label: 'Chinese (Simplified)' },
  { value: 'zh-TW', label: 'Chinese (Traditional)' },
  { value: 'hr', label: 'Croatian' },
  { value: 'cs', label: 'Czech' },
  { value: 'da', label: 'Danish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'en', label: 'English' },
  { value: 'eo', label: 'Esperanto' },
  { value: 'et', label: 'Estonian' },
  { value: 'fi', label: 'Finnish' },
  { value: 'fr', label: 'French' },
  { value: 'gl', label: 'Galician' },
  { value: 'ka', label: 'Georgian' },
  { value: 'de', label: 'German' },
  { value: 'el', label: 'Greek' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'ht', label: 'Haitian Creole' },
  { value: 'he', label: 'Hebrew' },
  { value: 'hi', label: 'Hindi' },
  { value: 'hu', label: 'Hungarian' },
  { value: 'is', label: 'Icelandic' },
  { value: 'id', label: 'Indonesian' },
  { value: 'ga', label: 'Irish Gaelic' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'kn', label: 'Kannada' },
  { value: 'kk', label: 'Kazakh' },
  { value: 'km', label: 'Khmer' },
  { value: 'ko', label: 'Korean' },
  { value: 'ku', label: 'Kurdish' },
  { value: 'la', label: 'Latin' },
  { value: 'lv', label: 'Latvian' },
  { value: 'lt', label: 'Lithuanian' },
  { value: 'mk', label: 'Macedonian' },
  { value: 'mg', label: 'Malagasy' },
  { value: 'ms', label: 'Malay' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'mt', label: 'Maltese' },
  { value: 'mi', label: 'Maori' },
  { value: 'mr', label: 'Marathi' },
  { value: 'mn', label: 'Mongolian' },
  { value: 'ne', label: 'Nepali' },
  { value: 'no', label: 'Norwegian' },
  { value: 'fa', label: 'Persian' },
  { value: 'pl', label: 'Polish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'ro', label: 'Romanian' },
  { value: 'ru', label: 'Russian' },
  { value: 'gd', label: 'Scots Gaelic' },
  { value: 'sr', label: 'Serbian' },
  { value: 'si', label: 'Sinhala' },
  { value: 'sk', label: 'Slovak' },
  { value: 'sl', label: 'Slovenian' },
  { value: 'es', label: 'Spanish' },
  { value: 'sw', label: 'Swahili' },
  { value: 'sv', label: 'Swedish' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'th', label: 'Thai' },
  { value: 'tr', label: 'Turkish' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'ur', label: 'Urdu' },
  { value: 'uz', label: 'Uzbek' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'cy', label: 'Welsh' },
  { value: 'yo', label: 'Yoruba' },
  { value: 'zu', label: 'Zulu' },
]

const fromOptions: SelectOption[] = [
  { value: 'autodetect', label: 'Auto-detect' },
  ...languages,
]

export function TextTranslate() {
  const [text, setText] = useState('')
  const [from, setFrom] = useState('autodetect')
  const [to, setTo] = useState('en')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quotaFinished, setQuotaFinished] = useState(false)

  function swap() {
    if (from === 'autodetect') return
    setFrom(to)
    setTo(from)
    setText(result)
    setResult(text)
  }

  async function translate() {
    const trimmed = text.trim()
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
    if (!trimmed) return
    setLoading(true)
    setError('')
    setQuotaFinished(false)

    const langpair = `${from}|${to}`
    const params = new URLSearchParams({ q: trimmed, langpair })
    if (email.trim()) params.set('de', email.trim())

    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?${params}`)
      const json = await res.json()

      if (json.quotaFinished) {
        setQuotaFinished(true)
        setError('')
        setResult('')
        return
      }

      if (json.responseStatus !== 200) {
        setError(json.responseDetails ?? 'Translation failed.')
        setResult('')
        return
      }

      setResult(json.responseData.translatedText ?? '')
    } catch {
      setError('Request failed - check your connection.')
      setResult('')
    } finally {
      setLoading(false)
    }
  }

  async function copyResult() {
    if (!result) return
    await navigator.clipboard.writeText(result)
  }

  const inputClass = 'bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] font-mono'
  const canSwap = from !== 'autodetect'

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Text Translate</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">

        {/* Language selectors */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#6b7280] mb-1">From</p>
            <Select
              options={fromOptions}
              value={fromOptions.find(o => o.value === from) ?? null}
              onChange={opt => opt && setFrom(opt.value)}
              isSearchable
              className="w-full"
            />
          </div>
          <button
            onClick={swap}
            disabled={!canSwap}
            title={!canSwap ? 'Select a source language to swap' : 'Swap languages'}
            className="mt-5 px-2.5 py-2 text-sm rounded border border-[#2a2d3a] text-[#6b7280] hover:text-[#e2e4ed] hover:border-[#3a3d4a] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            ⇄
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#6b7280] mb-1">To</p>
            <Select
              options={languages}
              value={languages.find(o => o.value === to) ?? null}
              onChange={opt => opt && setTo(opt.value)}
              isSearchable
              className="w-full"
            />
          </div>
        </div>

        {/* Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-[#6b7280]">Text</label>
            <span className="text-xs text-[#3a3d4a]">{text.length} chars</span>
          </div>
          <textarea
            className={`${inputClass} w-full resize-y min-h-[120px]`}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) translate() }}
            placeholder="Enter text to translate…"
          />
          <p className="text-xs text-[#3a3d4a] mt-1">Ctrl+Enter to translate</p>
        </div>

        <button
          onClick={translate}
          disabled={loading || !text.trim()}
          className="px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed self-start"
        >
          {loading ? 'Translating…' : 'Translate'}
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {quotaFinished && (
          <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-4">
            <p className="text-sm text-yellow-400 font-medium mb-1">Daily limit reached</p>
            <p className="text-xs text-[#9ca3af]">
              MyMemory allows 1,000 words/day without an email address. Enter your email below to increase this to 10,000 words/day - it's free and just used for quota tracking.
            </p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-[#6b7280]">Translation</p>
              <button
                onClick={copyResult}
                className="text-xs text-[#6b7280] hover:text-[#c4af64] transition-colors cursor-pointer"
              >
                Copy
              </button>
            </div>
            <div className="bg-[#0f1117] rounded-lg p-4 text-sm text-[#e2e4ed] leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
          </div>
        )}

        {/* Email for higher quota */}
        <div className="border-t border-[#2a2d3a] pt-4">
          <label className="block text-xs text-[#6b7280] mb-1">
            Email <span className="text-[#3a3d4a]">- optional, increases limit to 10,000 words/day</span>
          </label>
          <input
            type="email"
            className={`${inputClass} w-full`}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <p className="text-xs text-[#6b7280]">
          Powered by <span className="text-[#9ca3af]">MyMemory</span> · free tier is 1,000 words/day without email, 10,000/day with · no API key required
        </p>

      </div>
    </div>
  )
}
