import { useState } from 'react'

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inline(s: string): string {
  return escHtml(s)
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}

function renderMarkdown(md: string): string {
  // Stash code blocks to avoid re-processing
  const stash: string[] = []
  const s = md.replace(/```([\w]*)\n([\s\S]*?)```/g, (_, _lang, code) => {
    const idx = stash.length
    stash.push(`<pre><code>${escHtml(code.trimEnd())}</code></pre>`)
    return `⁠STASH${idx}⁠`
  })

  const blocks: string[] = []
  const lines = s.split('\n')
  let listItems: string[] = []
  let listTag: 'ul' | 'ol' | null = null

  function flushList() {
    if (listItems.length) {
      blocks.push(`<${listTag}>${listItems.join('')}</${listTag}>`)
      listItems = []
      listTag = null
    }
  }

  for (const line of lines) {
    const stashMatch = line.match(/^⁠STASH(\d+)⁠$/)
    if (stashMatch) { flushList(); blocks.push(stash[+stashMatch[1]]); continue }

    if (/^\s*$/.test(line)) { flushList(); continue }

    const h3 = line.match(/^### (.+)/)
    const h2 = line.match(/^## (.+)/)
    const h1 = line.match(/^# (.+)/)
    const ulItem = line.match(/^- (.+)/)
    const olItem = line.match(/^\d+\. (.+)/)
    const bq = line.match(/^> (.+)/)
    const hr = /^---+$/.test(line)

    if (h3) { flushList(); blocks.push(`<h3>${inline(h3[1])}</h3>`) }
    else if (h2) { flushList(); blocks.push(`<h2>${inline(h2[1])}</h2>`) }
    else if (h1) { flushList(); blocks.push(`<h1>${inline(h1[1])}</h1>`) }
    else if (ulItem) {
      if (listTag !== 'ul') { flushList(); listTag = 'ul' }
      listItems.push(`<li>${inline(ulItem[1])}</li>`)
    }
    else if (olItem) {
      if (listTag !== 'ol') { flushList(); listTag = 'ol' }
      listItems.push(`<li>${inline(olItem[1])}</li>`)
    }
    else if (bq) { flushList(); blocks.push(`<blockquote>${inline(bq[1])}</blockquote>`) }
    else if (hr) { flushList(); blocks.push('<hr />') }
    else { flushList(); blocks.push(`<p>${inline(line)}</p>`) }
  }
  flushList()

  return blocks.join('\n')
}

const SAMPLE = `# Hello, Markdown

**Bold** and *italic* and \`inline code\`.

## Lists

- Item one
- Item two
- Item three

1. First
2. Second
3. Third

## Code

\`\`\`
function greet(name) {
  return \`Hello, \${name}!\`
}
\`\`\`

> Blockquote text here.

[Link to Forgehaven](https://forgehaven.io)

---

Done.
`

export function MarkdownPreview() {
  const [source, setSource] = useState(SAMPLE)

  const html = renderMarkdown(source)

  return (
    <div className="pb-6">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Markdown Preview</h1>

      <div className="flex gap-4 h-[70vh]">
        <div className="flex-1 flex flex-col">
          <label className="text-xs text-[#6b7280] mb-1">Source</label>
          <textarea
            className="flex-1 bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] font-mono resize-none"
            value={source}
            onChange={e => setSource(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="flex-1 flex flex-col">
          <label className="text-xs text-[#6b7280] mb-1">Preview</label>
          <div
            className="flex-1 bg-[#1a1d27] border border-[#2a2d3a] rounded px-5 py-4 overflow-y-auto text-[#e2e4ed] text-sm
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-2 [&_h1]:text-[#e2e4ed]
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-[#e2e4ed]
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[#e2e4ed]
              [&_p]:mb-3 [&_p]:leading-relaxed
              [&_strong]:font-bold [&_strong]:text-[#e2e4ed]
              [&_em]:italic
              [&_code]:bg-[#0f1117] [&_code]:text-[#c4af64] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
              [&_pre]:bg-[#0f1117] [&_pre]:border [&_pre]:border-[#2a2d3a] [&_pre]:rounded [&_pre]:p-4 [&_pre]:mb-4 [&_pre]:overflow-x-auto
              [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[#e2e4ed]
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
              [&_li]:leading-relaxed
              [&_blockquote]:border-l-4 [&_blockquote]:border-[#c4af64] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#9ca3af] [&_blockquote]:mb-3
              [&_hr]:border-[#2a2d3a] [&_hr]:my-4
              [&_a]:text-[#c4af64] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:no-underline"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )
}
