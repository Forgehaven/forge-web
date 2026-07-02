import { useState, useRef, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import JSZip from 'jszip'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

function escXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function extractPages(
  file: File,
  onProgress: (n: number, total: number) => void
): Promise<{ texts: string[]; pdfTitle: string; pdfAuthor: string }> {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const numPages = pdf.numPages

  let pdfTitle = ''
  let pdfAuthor = ''
  try {
    const meta = await pdf.getMetadata()
    const info = meta.info as Record<string, string>
    pdfTitle = info.Title ?? ''
    pdfAuthor = info.Author ?? ''
  } catch { /* metadata optional */ }

  const texts: string[] = []
  for (let i = 1; i <= numPages; i++) {
    onProgress(i, numPages)
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    let text = ''
    let lastY: number | null = null
    for (const item of content.items) {
      if ('str' in item) {
        const ty = (item as { transform: number[] }).transform[5]
        if (lastY !== null && Math.abs(ty - lastY) > 2) text += '\n'
        text += item.str
        if ((item as { hasEOL?: boolean }).hasEOL) text += '\n'
        lastY = ty
      }
    }
    texts.push(text.trim())
  }

  return { texts, pdfTitle, pdfAuthor }
}

async function buildEpub(
  title: string,
  author: string,
  pageTexts: string[]
): Promise<Blob> {
  const PAGES_PER_CHAPTER = 10

  // Group pages into chapters of up to PAGES_PER_CHAPTER
  type Chapter = { title: string; pages: string[] }
  const chapters: Chapter[] = []
  for (let i = 0; i < pageTexts.length; i += PAGES_PER_CHAPTER) {
    const slice = pageTexts.slice(i, i + PAGES_PER_CHAPTER)
    const from = i + 1
    const to = Math.min(i + PAGES_PER_CHAPTER, pageTexts.length)
    chapters.push({
      title: pageTexts.length <= PAGES_PER_CHAPTER
        ? title
        : `Pages ${from}–${to}`,
      pages: slice,
    })
  }

  const zip = new JSZip()
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  zip.folder('META-INF')!.file('container.xml',
    `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`)

  const oebps = zip.folder('OEBPS')!
  const modified = new Date().toISOString().replace(/\.\d{3}/, '')

  oebps.file('content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">urn:pdf-epub:${Date.now()}</dc:identifier>
    <dc:title>${escXml(title)}</dc:title>
    <dc:creator>${escXml(author || 'Unknown')}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${chapters.map((_, i) => `<item id="ch${i + 1}" href="ch${i + 1}.xhtml" media-type="application/xhtml+xml"/>`).join('\n    ')}
  </manifest>
  <spine>
    ${chapters.map((_, i) => `<itemref idref="ch${i + 1}"/>`).join('\n    ')}
  </spine>
</package>`)

  oebps.file('nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><meta charset="UTF-8"/><title>Contents</title></head>
<body>
  <nav epub:type="toc">
    <h1>Contents</h1>
    <ol>${chapters.map((ch, i) => `<li><a href="ch${i + 1}.xhtml">${escXml(ch.title)}</a></li>`).join('')}</ol>
  </nav>
</body>
</html>`)

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i]
    const body = ch.pages
      .flatMap((pageText, pi) => {
        const paras = pageText
          .split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0)
          .map(l => `  <p>${escXml(l)}</p>`)
        if (pi > 0) paras.unshift('  <hr/>')
        return paras
      })
      .join('\n')

    oebps.file(`ch${i + 1}.xhtml`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="UTF-8"/><title>${escXml(ch.title)}</title></head>
<body>
  <h2>${escXml(ch.title)}</h2>
${body || '  <p><em>(no text on this page)</em></p>'}
</body>
</html>`)
  }

  return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip', compression: 'DEFLATE' })
}

export function PdfToEpub() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [progress, setProgress] = useState(0)
  const [pageCount, setPageCount] = useState(0)
  const [status, setStatus] = useState<'idle' | 'converting' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [epubUrl, setEpubUrl] = useState<string | null>(null)
  const [epubName, setEpubName] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full"
  const btnClass = "px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"

  function acceptFile(f: File) {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file.')
      return
    }
    setFile(f)
    setStatus('idle')
    setEpubUrl(null)
    setError('')
    setProgress(0)
    setPageCount(0)
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ''))
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) acceptFile(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) acceptFile(f)
  }, [title]) // eslint-disable-line react-hooks/exhaustive-deps

  async function convert() {
    if (!file) return
    setStatus('converting')
    setError('')
    setProgress(0)
    if (epubUrl) URL.revokeObjectURL(epubUrl)
    setEpubUrl(null)

    try {
      const { texts, pdfTitle, pdfAuthor } = await extractPages(file, (n, total) => {
        setPageCount(total)
        setProgress(n / total)
      })

      const resolvedTitle = title || pdfTitle || file.name.replace(/\.pdf$/i, '') || 'Untitled'
      const resolvedAuthor = author || pdfAuthor || ''

      const blob = await buildEpub(resolvedTitle, resolvedAuthor, texts)
      const url = URL.createObjectURL(blob)
      const name = resolvedTitle.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'output'
      setEpubUrl(url)
      setEpubName(`${name}.epub`)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed.')
      setStatus('error')
    }
  }

  const progressPct = Math.round(progress * 100)

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">PDF to EPUB</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">

        {/* drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragging ? 'border-[#c4af64] bg-[#c4af64]/5' : 'border-[#2a2d3a] hover:border-[#3a3d4a]'
          }`}
        >
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={onFileInput} />
          {file ? (
            <div>
              <p className="text-sm text-[#e2e4ed] font-mono truncate">{file.name}</p>
              <p className="text-xs text-[#6b7280] mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
                {pageCount > 0 && ` · ${pageCount} pages`}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#6b7280]">Drop a PDF here or click to upload</p>
              <p className="text-xs text-[#3a3d4a] mt-1">All processing happens locally in your browser</p>
            </div>
          )}
        </div>

        {/* metadata */}
        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Title</label>
          <input
            className={inputClass}
            placeholder="Book title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs text-[#6b7280] mb-1">Author <span className="text-[#3a3d4a]">(optional)</span></label>
          <input
            className={inputClass}
            placeholder="Author name"
            value={author}
            onChange={e => setAuthor(e.target.value)}
          />
        </div>

        {/* progress */}
        {status === 'converting' && (
          <div>
            <div className="flex justify-between text-xs text-[#6b7280] mb-1">
              <span>Extracting text…</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#2a2d3a] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c4af64] transition-all duration-150"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* actions */}
        <div className="flex gap-3">
          <button
            onClick={convert}
            disabled={!file || status === 'converting'}
            className={btnClass}
          >
            {status === 'converting' ? 'Converting…' : 'Convert to EPUB'}
          </button>

          {status === 'done' && epubUrl && (
            <a
              href={epubUrl}
              download={epubName}
              className={btnClass}
            >
              Download {epubName}
            </a>
          )}
        </div>

        {status === 'done' && (
          <p className="text-xs text-[#6b7280]">
            Done - {pageCount} pages converted, grouped into chapters of 10.
          </p>
        )}
      </div>
    </div>
  )
}
