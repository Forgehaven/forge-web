import { useState, useEffect, useMemo, useRef } from 'react'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import hljs, { HLJS_CSS } from '../../../lib/hljs'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  parseTagValue: true,
  parseAttributeValue: true,
  trimValues: true,
  cdataPropName: '__cdata',
  isArray: (_name: string, _jpath: unknown, isLeaf: boolean, isAttribute: boolean) => !isLeaf && !isAttribute,
})

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: true,
})

function xmlToJson(xml: string): string {
  return JSON.stringify(parser.parse(xml), null, 2)
}

function jsonToXml(json: string): string {
  return (builder.build(JSON.parse(json)) as string).trim()
}

function validateXml(s: string): string {
  if (!s.trim()) return ''
  const doc = new DOMParser().parseFromString(s, 'text/xml')
  const err = doc.querySelector('parsererror')
  return err ? (err.textContent?.split('\n')[0] ?? 'Invalid XML') : ''
}

function validateJson(s: string): string {
  if (!s.trim()) return ''
  try { JSON.parse(s); return '' }
  catch (e) { return e instanceof Error ? e.message : 'Invalid JSON' }
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function HighlightedEditor({
  value, onChange, language, error,
}: {
  value: string
  onChange: (v: string) => void
  language: 'xml' | 'json'
  error: string
}) {
  const preRef = useRef<HTMLPreElement>(null)
  const lineNumRef = useRef<HTMLPreElement>(null)

  const highlighted = useMemo(() => {
    if (!value) return ''
    try {
      return hljs.highlight(value, { language }).value
    } catch {
      return escHtml(value)
    }
  }, [value, language])

  function syncScroll(e: React.UIEvent<HTMLTextAreaElement>) {
    const top = e.currentTarget.scrollTop
    const left = e.currentTarget.scrollLeft
    if (preRef.current) { preRef.current.scrollTop = top; preRef.current.scrollLeft = left }
    if (lineNumRef.current) { lineNumRef.current.scrollTop = top }
  }

  const isEmpty = !value.trim()
  const isValid = !error

  const lineCount = value ? value.split('\n').length : 1
  const lineNums = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')

  return (
    <div className="flex-1 min-h-0 flex flex-col min-w-0">
      <div className="flex items-center justify-between mb-1 h-5 shrink-0">
        <label className="text-xs text-[#6b7280] uppercase tracking-wide">{language}</label>
        {!isEmpty && (
          isValid
            ? <span className="text-xs text-green-500">✓ valid</span>
            : <span className="text-xs text-red-400 truncate max-w-[60%]" title={error}>✗ {error}</span>
        )}
      </div>
      <div className="relative min-h-0 flex-1 bg-[#0f1117] border border-[#2a2d3a] rounded overflow-hidden focus-within:border-[#c4af64] transition-colors">
        {/* line numbers */}
        <pre
          ref={lineNumRef}
          aria-hidden
          className="absolute top-0 left-0 bottom-0 overflow-hidden m-0 py-3 pl-3 pr-2 text-xs font-mono leading-5 pointer-events-none select-none text-right border-r border-[#2a2d3a]"
          style={{ whiteSpace: 'pre', minWidth: '2.5rem', color: '#3a3d4a' }}
        >
          {lineNums}
        </pre>
        {/* highlighted code */}
        <pre
          ref={preRef}
          aria-hidden
          className="absolute inset-0 overflow-hidden m-0 py-3 pr-3 text-xs font-mono leading-5 pointer-events-none select-none"
          style={{ whiteSpace: 'pre', tabSize: 2, paddingLeft: '3rem' }}
        >
          <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted + '\n' }} />
        </pre>
        {/* invisible textarea captures input */}
        <textarea
          className="absolute inset-0 w-full h-full bg-transparent resize-none py-3 pr-3 text-xs font-mono leading-5 z-10 focus:outline-none"
          style={{ color: 'transparent', caretColor: '#e2e4ed', whiteSpace: 'pre', tabSize: 2, paddingLeft: '3rem' }}
          value={value}
          onChange={e => onChange(e.target.value)}
          onScroll={syncScroll}
          spellCheck={false}
        />
      </div>
    </div>
  )
}

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price>12.99</price>
  </book>
  <book category="non-fiction">
    <title>Sapiens</title>
    <author>Yuval Noah Harari</author>
    <year>2011</year>
    <price>15.99</price>
  </book>
</bookstore>`

export function XmlJsonConverter() {
  const [xml, setXml] = useState(SAMPLE_XML)
  const [json, setJson] = useState(() => { try { return xmlToJson(SAMPLE_XML) } catch { return '' } })
  const [xmlConvertErr, setXmlConvertErr] = useState('')
  const [jsonConvertErr, setJsonConvertErr] = useState('')

  const xmlErr = useMemo(() => validateXml(xml), [xml])
  const jsonErr = useMemo(() => validateJson(json), [json])

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = HLJS_CSS
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  function convertToJson() {
    try {
      setJson(xmlToJson(xml))
      setXmlConvertErr('')
    } catch (e) {
      setXmlConvertErr(e instanceof Error ? e.message : 'Conversion failed')
    }
  }

  function convertToXml() {
    try {
      setXml(jsonToXml(json))
      setJsonConvertErr('')
    } catch (e) {
      setJsonConvertErr(e instanceof Error ? e.message : 'Conversion failed')
    }
  }

  return (
    <div className="pb-6 h-full flex flex-col">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-4">XML ↔ JSON</h1>

      <div className="flex flex-col md:flex-row gap-4 md:h-[70vh]">
        <div className="min-w-0 min-h-0 flex flex-col gap-2 h-[40vh] md:flex-1 md:h-auto">
          <HighlightedEditor value={xml} onChange={v => { setXml(v); setXmlConvertErr('') }} language="xml" error={xmlErr} />
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={convertToJson}
              disabled={!!xmlErr}
              className="text-xs px-3 py-1.5 rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Convert to JSON →
            </button>
            {xmlConvertErr && <span className="text-xs text-red-400">{xmlConvertErr}</span>}
          </div>
        </div>

        <div className="min-w-0 min-h-0 flex flex-col gap-2 h-[40vh] md:flex-1 md:h-auto">
          <HighlightedEditor value={json} onChange={v => { setJson(v); setJsonConvertErr('') }} language="json" error={jsonErr} />
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={convertToXml}
              disabled={!!jsonErr}
              className="text-xs px-3 py-1.5 rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Convert to XML
            </button>
            {jsonConvertErr && <span className="text-xs text-red-400">{jsonConvertErr}</span>}
          </div>
        </div>
      </div>

      <p className="text-xs text-[#3a3d4a] mt-3">
        XML attributes are represented as <code className="text-[#6b7280]">@_attributeName</code> in JSON. Repeated sibling elements become arrays.
      </p>
    </div>
  )
}
