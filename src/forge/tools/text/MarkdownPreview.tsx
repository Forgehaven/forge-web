import { useState, useEffect, useMemo } from 'react'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs, { HLJS_CSS } from '../../../lib/hljs'

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : undefined
      return language
        ? hljs.highlight(code, { language }).value
        : hljs.highlightAuto(code).value
    },
  })
)

marked.setOptions({ gfm: true, breaks: false })



const SAMPLE = `# Hello, Markdown

**Bold**, *italic*, ~~strikethrough~~, and \`inline code\`.

## Code blocks

\`\`\`typescript
interface User {
  id: number
  name: string
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`
}
\`\`\`

\`\`\`python
def fibonacci(n: int) -> list[int]:
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result
\`\`\`

## Tables

| Name    | Role      | Active |
| ------- | --------- | ------ |
| Alice   | Admin     | ✓      |
| Bob     | Editor    | ✓      |
| Charlie | Viewer    | ✗      |

## Lists

- Item one
- Item two
  - Nested item
  - Another nested

1. First
2. Second
3. Third

> Blockquote text here.

[Link to Forgehaven](https://forgehaven.io)

---

Done.
`

export function MarkdownPreview() {
  const [source, setSource] = useState(SAMPLE)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = HLJS_CSS
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  const html = useMemo(() => marked.parse(source) as string, [source])

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
              [&_del]:line-through [&_del]:text-[#6b7280]
              [&_code]:bg-[#0f1117] [&_code]:text-[#c4af64] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
              [&_pre]:bg-[#0f1117] [&_pre]:border [&_pre]:border-[#2a2d3a] [&_pre]:rounded [&_pre]:p-4 [&_pre]:mb-4 [&_pre]:overflow-x-auto
              [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[#e2e4ed] [&_pre_code]:text-xs
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
              [&_li]:leading-relaxed
              [&_table]:w-full [&_table]:mb-4 [&_table]:border-collapse
              [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:text-[#6b7280] [&_th]:uppercase [&_th]:tracking-wide [&_th]:px-3 [&_th]:py-2 [&_th]:border-b [&_th]:border-[#2a2d3a]
              [&_td]:px-3 [&_td]:py-2 [&_td]:border-b [&_td]:border-[#2a2d3a] [&_td]:text-[#e2e4ed]
              [&_tr:last-child_td]:border-0
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
