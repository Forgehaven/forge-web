import { useCopy } from '../../hooks/useCopy'
import { useState, useMemo } from 'react'
import { format as formatSQL } from 'sql-formatter'
import { Select } from '../../components/Select'

type Lang = 'json' | 'sql'
type JsonMode = 'pretty' | 'minify'
type SqlDialect = 'sql' | 'mysql' | 'postgresql' | 'sqlite' | 'bigquery'

const DIALECTS: { value: SqlDialect; label: string }[] = [
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql',      label: 'MySQL' },
  { value: 'sqlite',     label: 'SQLite' },
  { value: 'bigquery',   label: 'BigQuery' },
  { value: 'sql',        label: 'Standard SQL' },
]

export function TextFormatter() {
  const { copy, copied } = useCopy()
  const [lang, setLang] = useState<Lang>('json')
  const [input, setInput] = useState('')
  const [jsonMode, setJsonMode] = useState<JsonMode>('pretty')
  const [dialect, setDialect] = useState<SqlDialect>('postgresql')

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono resize-none"

  const { output, error } = useMemo<{ output: string; error: string }>(() => {
    if (!input.trim()) return { output: '', error: '' }

    if (lang === 'json') {
      try {
        const parsed = JSON.parse(input)
        return {
          output: jsonMode === 'pretty' ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed),
          error: '',
        }
      } catch (e) {
        return { output: '', error: (e as Error).message }
      }
    }

    if (lang === 'sql') {
      try {
        return {
          output: formatSQL(input, { language: dialect, tabWidth: 2, keywordCase: 'upper' }),
          error: '',
        }
      } catch (e) {
        return { output: '', error: (e as Error).message }
      }
    }

    return { output: '', error: '' }
  }, [input, lang, jsonMode, dialect])

  function tabClass(active: boolean) {
    return `px-3 py-1.5 rounded text-sm transition-colors ${
      active ? 'bg-[#c4af64] text-[#0f1117] font-medium' : 'bg-[#1a1d27] text-[#9ca3af] hover:text-[#e2e4ed] border border-[#2a2d3a]'
    }`
  }

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Text Formatter</h1>

      {/* Language selector */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setLang('json')} className={tabClass(lang === 'json')}>JSON</button>
        <button onClick={() => setLang('sql')} className={tabClass(lang === 'sql')}>SQL</button>
      </div>

      {/* Sub-options */}
      <div className="flex gap-2 mb-6">
        {lang === 'json' && (
          <>
            <button onClick={() => setJsonMode('pretty')} className={tabClass(jsonMode === 'pretty')}>Pretty</button>
            <button onClick={() => setJsonMode('minify')} className={tabClass(jsonMode === 'minify')}>Minify</button>
          </>
        )}
        {lang === 'sql' && (
          <Select
            options={DIALECTS.map(d => ({ value: d.value, label: d.label }))}
            value={{ value: dialect, label: DIALECTS.find(d => d.value === dialect)?.label ?? dialect }}
            onChange={opt => opt && setDialect(opt.value as SqlDialect)}
          />
        )}
      </div>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs text-[#6b7280] mb-1">
            {lang === 'json' ? 'JSON Input' : 'SQL Input'}
          </label>
          <textarea
            className={inputClass}
            rows={8}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={lang === 'json' ? '{"key": "value"}' : 'select * from users where id = 1'}
          />
        </div>

        {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

        {output && (
          <div className="pt-2 border-t border-[#2a2d3a]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-[#6b7280]">Output</p>
              <button onClick={() => copy(output)} className="text-xs text-[#c4af64] hover:text-[#e2e4ed] transition-colors cursor-pointer">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="font-mono text-sm text-[#c4af64] whitespace-pre-wrap break-all">{output}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
