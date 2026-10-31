import { useState } from 'react'
import { DotMsgParser } from 'dotmsg'
import { FileDropZone } from '../../../../components/FileDropZone'

type ParsedMsg = {
  subject: string | undefined
  senderName: string | undefined
  senderEmail: string | undefined
  to: string | undefined
  cc: string[] | undefined
  bcc: string[] | undefined
  sentDate: string | undefined
  textContent: string | undefined
  htmlContent: string | undefined
  attachments: { name: string; content: Uint8Array }[]
}

export function FileReader() {
  const [parsed, setParsed] = useState<ParsedMsg | null>(null)
  const [error, setError] = useState('')
  const [bodyMode, setBodyMode] = useState<'text' | 'html'>('text')

  async function readFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.msg')) {
      setError('Please select a .msg file.')
      return
    }
    setError('')
    setParsed(null)
    try {
      const buffer = await file.arrayBuffer()
      const parser = new DotMsgParser()
      await parser.parseBuffer(new Uint8Array(buffer))

      const attachments = parser.getAttachments().map((a: { getFilename(): string; getContent(): Uint8Array }) => ({
        name: a.getFilename(),
        content: a.getContent(),
      }))

      const html = parser.getHTMLContent()
      const text = parser.getTextContent()

      setParsed({
        subject: parser.getSubject(),
        senderName: parser.getSenderName(),
        senderEmail: parser.getSenderEmail(),
        to: parser.getTo(),
        cc: parser.getCC(),
        bcc: parser.getBCC(),
        sentDate: parser.getSentDate(),
        textContent: text,
        htmlContent: html,
        attachments,
      })
      setBodyMode(html ? 'html' : 'text')
    } catch {
      setError('Failed to parse .msg file. The file may be corrupt or unsupported.')
    }
  }

  function downloadAttachment(name: string, content: Uint8Array) {
    const blob = new Blob([content.slice(0)])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  function formatDate(raw: string | undefined) {
    if (!raw) return undefined
    try {
      const ts = Number(raw)
      if (!isNaN(ts) && ts > 0) {
        const ms = ts / 1e4 - 11644473600000
        return new Date(ms).toLocaleString()
      }
      return raw
    } catch {
      return raw
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <h1 className="text-xl font-semibold text-forge-text mb-6">File Reader</h1>

      <div className="px-4 py-2.5 rounded-lg bg-forge-surface border border-forge-border text-center">
        <p className="text-sm font-bold text-forge-accent">
          All processing happens entirely in your browser - no files or data are sent to any server.
        </p>
      </div>

      <hr className="border-forge-border" />

      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-forge-dim uppercase tracking-widest font-bold">Supported File Types</p>
        <div className="flex flex-wrap justify-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium border border-forge-border text-forge-text bg-forge-surface">
            .msg - Outlook Email
          </span>
        </div>
      </div>

      <hr className="border-forge-border" />

      <FileDropZone accept=".msg" onFiles={files => readFile(files[0])}>
        <p className="text-sm text-forge-muted">Drop a file here or click to open</p>
      </FileDropZone>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {parsed && (
        <div className="flex flex-col gap-4">

          {/* Header fields */}
          <div className="rounded-lg border border-forge-border overflow-hidden">
            {[
              { label: 'Subject', value: parsed.subject },
              { label: 'From',    value: [parsed.senderName, parsed.senderEmail].filter(Boolean).join(' - ') },
              { label: 'To',      value: parsed.to },
              { label: 'CC',      value: parsed.cc?.join(', ') },
              { label: 'BCC',     value: parsed.bcc?.join(', ') },
              { label: 'Date',    value: formatDate(parsed.sentDate) },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} className="flex gap-3 px-4 py-2.5 border-b border-forge-raise last:border-0">
                <span className="text-xs text-forge-muted uppercase tracking-wider font-medium w-14 shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-forge-text break-all">{value}</span>
              </div>
            ))}
          </div>

          {/* Body */}
          {(parsed.textContent || parsed.htmlContent) && (
            <div className="rounded-lg border border-forge-border overflow-hidden">
              <div className="flex items-center gap-1 px-3 py-2 border-b border-forge-border bg-forge-surface">
                <span className="text-xs text-forge-muted mr-2">Body</span>
                {parsed.textContent && (
                  <button
                    onClick={() => setBodyMode('text')}
                    className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      bodyMode === 'text' ? 'bg-forge-accent/10 text-forge-accent border border-forge-accent/30' : 'text-forge-muted hover:text-forge-text'
                    }`}
                  >
                    Plain text
                  </button>
                )}
                {parsed.htmlContent && (
                  <button
                    onClick={() => setBodyMode('html')}
                    className={`text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      bodyMode === 'html' ? 'bg-forge-accent/10 text-forge-accent border border-forge-accent/30' : 'text-forge-muted hover:text-forge-text'
                    }`}
                  >
                    HTML
                  </button>
                )}
              </div>
              <div className="p-4 max-h-[500px] overflow-auto">
                {bodyMode === 'html' && parsed.htmlContent ? (
                  <iframe
                    srcDoc={parsed.htmlContent}
                    sandbox="allow-same-origin"
                    className="w-full border-0 bg-white rounded"
                    style={{ minHeight: 300 }}
                    onLoad={e => {
                      const doc = (e.target as HTMLIFrameElement).contentDocument
                      if (doc) (e.target as HTMLIFrameElement).style.height = doc.documentElement.scrollHeight + 'px'
                    }}
                  />
                ) : (
                  <pre className="text-sm text-forge-dim whitespace-pre-wrap font-mono leading-relaxed">
                    {parsed.textContent}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Attachments */}
          {parsed.attachments.length > 0 && (
            <div className="rounded-lg border border-forge-border overflow-hidden">
              <div className="px-4 py-2 border-b border-forge-border bg-forge-surface">
                <span className="text-xs text-forge-muted uppercase tracking-wider font-medium">
                  Attachments ({parsed.attachments.length})
                </span>
              </div>
              <div className="flex flex-col divide-y divide-forge-raise">
                {parsed.attachments.map(({ name, content }) => (
                  <div key={name} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-forge-text truncate">{name}</span>
                    <button
                      onClick={() => downloadAttachment(name, content)}
                      className="text-xs text-forge-muted hover:text-forge-accent transition-colors cursor-pointer shrink-0 ml-4"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
