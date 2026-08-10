import { useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'

interface FileDropZoneProps {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  className?: string
  inputRef?: RefObject<HTMLInputElement | null>
  children: ReactNode
}

export function FileDropZone({ onFiles, accept, multiple, className = 'p-8', inputRef, children }: FileDropZoneProps) {
  const localRef = useRef<HTMLInputElement>(null)
  const fileRef = inputRef ?? localRef
  const [dropping, setDropping] = useState(false)

  return (
    <div
      onDragOver={e => { e.preventDefault(); if (e.dataTransfer.types.includes('Files')) setDropping(true) }}
      onDragLeave={() => setDropping(false)}
      onDrop={e => {
        e.preventDefault()
        setDropping(false)
        const files = Array.from(e.dataTransfer.files)
        if (files.length) onFiles(files)
      }}
      onClick={() => fileRef.current?.click()}
      className={`border-2 border-dashed rounded-lg ${className} text-center cursor-pointer transition-colors ${
        dropping ? 'border-[#c4af64] bg-[#c4af64]/5' : 'border-[#2a2d3a] hover:border-[#3a3d4a]'
      }`}
    >
      <input
        ref={fileRef} type="file" accept={accept} multiple={multiple} className="hidden"
        onChange={e => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
      {children}
    </div>
  )
}
