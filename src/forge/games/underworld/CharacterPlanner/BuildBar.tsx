import { useState } from 'react'
import { ConfirmButton } from '../../../../components/ConfirmButton'
import { useAuth } from '../../../../auth/authContext'
import { BUILD_STATUSES, emptyBuild, type BuildStatus } from '../engine'
import { toggleProps } from '../../../../lib/toggleProps'
import type { BuildStore, SaveEntry, SaveKind } from '../hooks/useBuildStore'

function DeviceIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="2" y="3" width="12" height="8" rx="1" />
      <path d="M1 13.5h14" strokeLinecap="round" />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M4.5 12.5h7a3 3 0 0 0 .4-5.97A4 4 0 0 0 4.2 7.6 2.5 2.5 0 0 0 4.5 12.5Z" strokeLinejoin="round" />
    </svg>
  )
}

const KIND: Record<SaveKind, { icon: React.ReactNode; title: string; color: string }> = {
  local: { icon: <DeviceIcon />, title: 'Saved on this device', color: 'text-forge-dim' },
  server: { icon: <CloudIcon />, title: 'Saved to your Forgehaven account (Discord login)', color: 'text-sky-300' },
}

const shortDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '')

export function BuildBar({ store }: { store: BuildStore }) {
  const { setBuild, current, saves, dirty, online, busy, conflict, error, isAuthenticated } = store
  const { login } = useAuth()
  const target = current?.kind ?? (isAuthenticated ? 'server' : 'local')
  // Switching away from unsaved edits asks first.
  const [pending, setPending] = useState<(() => void) | null>(null)
  const guard = (action: () => void) => (dirty ? setPending(() => action) : action())
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null)
  const [open, setOpen] = useState(false)
  // A build dropped among the favourites (or the rest) joins that group.
  const move = (from: number, to: number) => {
    setDrag(null)
    if (from === to) return
    const list = [...saves]
    const [item] = list.splice(from, 1)
    list.splice(to, 0, { ...item, favourite: saves[to].favourite })
    store.arrange(list)
  }
  const star = (e: SaveEntry) => store.arrange(saves.map(s => (s === e ? { ...s, favourite: !s.favourite } : s)))
  // A saved build autosaves, so its button is mostly a status.
  const status = !current ? 'Save'
    : conflict ? 'Conflict'
    : !dirty ? 'Saved'
    : current.kind === 'server' && !online ? 'Offline'
    : error ? 'Retry save'
    : 'Saving…'

  return (
    <div className="forge-card !p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm cursor-pointer" {...toggleProps(open, () => setOpen(o => !o))}>
        <span className={`text-xs text-forge-muted transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
        <span className="font-semibold text-forge-text">Saves</span>
        <span className={`ml-auto flex items-center gap-1.5 text-xs ${current ? KIND[current.kind].color : 'text-amber-300'}`} title={current ? KIND[current.kind].title : undefined}>
          {current ? <>{KIND[current.kind].icon}{current.kind === 'server' ? 'Account' : 'This device'}</> : 'Not saved'}
          {current && <span className={conflict || error ? 'text-red-400' : 'text-forge-muted'}>· {status}</span>}
        </span>
      </div>

      {open && <>
      <div className="flex items-center gap-2">
        <button
          className={`forge-btn-accent flex items-center gap-1.5 ${!current && dirty ? 'animate-pulse' : ''}`}
          disabled={busy || !dirty || conflict}
          onClick={() => store.save()}
          title={status === 'Offline' ? 'Saves when you are back online' : current ? `${KIND[target].title}. Changes save automatically.` : KIND[target].title}
        >
          {KIND[target].icon}
          {status}
        </button>
        <button className="forge-btn !py-2 cursor-pointer disabled:opacity-40" disabled={busy} onClick={() => guard(store.startNew)}>New</button>
        <button
          className="forge-btn !py-2 cursor-pointer disabled:opacity-40"
          disabled={!store.canUndo}
          onClick={store.undo}
          title="Undo (Ctrl+Z)"
        >Undo</button>
        {current && (
          <button className="text-xs text-forge-muted hover:text-forge-text cursor-pointer ml-auto" onClick={store.detach}>
            Save as copy
          </button>
        )}
      </div>

      {pending && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
          Unsaved changes will be lost.
          <button className="underline cursor-pointer" onClick={() => { pending(); setPending(null) }}>Discard and continue</button>
          <button className="underline cursor-pointer" onClick={() => setPending(null)}>Cancel</button>
        </div>
      )}

      {current?.kind === 'local' && isAuthenticated && (
        <button className="self-start flex items-center gap-1.5 text-xs text-sky-300 hover:underline cursor-pointer" onClick={store.moveToAccount} disabled={busy}>
          <CloudIcon /> Move this build to your account
        </button>
      )}
      {!isAuthenticated && (
        <p className="text-[11px] text-forge-muted leading-snug">
          Saves stay on this device.{' '}
          <button className="text-forge-accent hover:underline cursor-pointer" onClick={login}>Log in</button>{' '}
          to keep plans in your Forgehaven account and open them anywhere.
        </p>
      )}

      {saves.length > 0 && (
        <ul className="flex flex-col max-h-48 overflow-y-auto -mx-1">
          {saves.map((s, i) => {
            const active = current?.kind === s.kind && current.id === s.id
            const edge = drag && drag.over === i && drag.from !== i ? (drag.from < i ? 'border-b' : 'border-t') + ' border-forge-accent' : ''
            return (
              <li
                key={`${s.kind}:${s.id}`}
                draggable
                onDragStart={() => setDrag({ from: i, over: i })}
                onDragOver={e => { e.preventDefault(); if (drag && drag.over !== i) setDrag({ ...drag, over: i }) }}
                onDrop={e => { e.preventDefault(); if (drag) move(drag.from, i) }}
                onDragEnd={() => setDrag(null)}
                className={`group flex items-center gap-2 rounded px-1 cursor-grab active:cursor-grabbing ${active ? 'bg-forge-accent/10' : 'hover:bg-forge-border/50'} ${edge} ${drag?.from === i ? 'opacity-40' : ''} ${s.favourite && !saves[i + 1]?.favourite && saves[i + 1] ? 'mb-1' : ''}`}
              >
                <button
                  aria-label={`${s.favourite ? 'Unfavourite' : 'Favourite'} ${s.name}`}
                  aria-pressed={s.favourite}
                  className={`cursor-pointer leading-none ${s.favourite ? 'text-forge-accent' : 'text-forge-faint opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-forge-accent'}`}
                  onClick={() => star(s)}
                >{s.favourite ? '★' : '☆'}</button>
                <button
                  className="flex-1 min-w-0 flex items-center gap-2 py-1 text-left cursor-pointer"
                  disabled={busy}
                  onClick={() => !active && guard(() => store.open(s.kind, s.id))}
                  title={KIND[s.kind].title}
                >
                  <span className={KIND[s.kind].color}>{KIND[s.kind].icon}</span>
                  <span className={`text-sm truncate ${active ? 'text-forge-accent' : s.status === 'retired' ? 'text-forge-muted' : 'text-forge-text'}`}>{s.name}</span>
                  {s.status === 'complete' && <span className="text-[10px] text-emerald-300" title="Plan complete">✓ complete</span>}
                  {s.status === 'retired' && <span className="text-[10px] text-forge-muted">retired</span>}
                  <span className="ml-auto text-[10px] text-forge-muted whitespace-nowrap">{shortDate(s.updatedAt)}</span>
                </button>
                <ConfirmButton
                  label="×"
                  confirmPrompt="Delete?"
                  className="text-forge-faint hover:text-red-400 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                  onConfirm={() => store.remove(s.kind, s.id)}
                />
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex items-center gap-2 border-t border-forge-border pt-2">
        {current && (
          <label className="flex items-center gap-2 text-xs text-forge-dim">
            Status
            <select className="forge-input !w-auto !py-1 text-xs" value={store.build.status ?? 'planning'} onChange={e => setBuild(b => ({ ...b, status: e.target.value as BuildStatus }))}>
              {BUILD_STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </label>
        )}
        {(store.build.status ?? 'planning') === 'planning' && <span className="ml-auto"><ConfirmButton
          label="Reset this character"
          confirmPrompt="Reset this current character?"
          onConfirm={() => setBuild(b => emptyBuild(b.startMonth))}
        /></span>}
      </div>
      </>}

      {conflict && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-amber-300">
          This build was saved from another device since you opened it.
          <button className="underline cursor-pointer" onClick={() => store.save(true)}>Overwrite with mine</button>
          <button className="underline cursor-pointer" onClick={() => current && store.open(current.kind, current.id)}>Load theirs</button>
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
