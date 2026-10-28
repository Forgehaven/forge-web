// Rules text: blank lines split paragraphs, single newlines split lines, and a
// short leading "Label:" or "Label (Level N):" on a line is emphasised.
const LABEL = /^([A-Z][^.:!?"\n]{0,60}):\s/

function Line({ text }: { text: string }) {
  const m = text.match(LABEL)
  if (!m) return <>{text}</>
  return <><span className="font-medium text-[#e2e4ed]">{m[1]}:</span> {text.slice(m[0].length)}</>
}

export function Prose({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i}>
          {para.split('\n').map((line, j) => (
            <span key={j} className={j ? 'block mt-0.5' : undefined}><Line text={line} /></span>
          ))}
        </p>
      ))}
    </div>
  )
}
