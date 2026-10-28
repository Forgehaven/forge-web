import { useState } from 'react'
import { ConfirmButton } from '../../../../components/ConfirmButton'
import { useAuth } from '../../../../auth/authContext'
import { emptyBuild, withPurchases } from '../engine'
import type { BuildStore, SaveKind } from '../hooks/useBuildStore'

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
  local: { icon: <DeviceIcon />, title: 'Saved on this device', color: 'text-[#9ca3af]' },
  server: { icon: <CloudIcon />, title: 'Saved to your Discord account', color: 'text-sky-300' },
}

const shortDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '')

export function BuildBar({ store }: { store: BuildStore }) {
  const { setBuild, current, saves, dirty, busy, conflict, error, isAuthenticated } = store
  const { login } = useAuth()
  const target = current?.kind ?? (isAuthenticated ? 'server' : 'local')
  // Switching away from unsaved edits asks first.
  const [pending, setPending] = useState<(() => void) | null>(null)
  const guard = (action: () => void) => (dirty ? setPending(() => action) : action())

  return (
    <div className="forge-card !p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          className={`forge-btn-accent flex items-center gap-1.5 ${dirty ? 'animate-pulse' : ''}`}
          disabled={busy || !dirty}
          onClick={() => store.save()}
          title={KIND[target].title}
        >
          {KIND[target].icon}
          {dirty ? 'Save' : 'Saved'}
        </button>
        <button className="forge-btn !py-2 cursor-pointer disabled:opacity-40" disabled={busy} onClick={() => guard(store.startNew)}>New</button>
        {current && (
          <button className="text-xs text-[#6b7280] hover:text-[#e2e4ed] cursor-pointer ml-auto" onClick={store.detach}>
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
        <p className="text-[11px] text-[#6b7280] leading-snug">
          Saves stay on this device.{' '}
          <button className="text-[#c4af64] hover:underline cursor-pointer" onClick={login}>Log in</button>{' '}
          to keep builds in your Discord account and open them anywhere.
        </p>
      )}

      {saves.length > 0 && (
        <ul className="flex flex-col max-h-48 overflow-y-auto -mx-1">
          {saves.map(s => {
            const active = current?.kind === s.kind && current.id === s.id
            return (
              <li key={`${s.kind}:${s.id}`} className={`group flex items-center gap-2 rounded px-1 ${active ? 'bg-[#c4af64]/10' : 'hover:bg-[#2a2d3a]/50'}`}>
                <button
                  className="flex-1 min-w-0 flex items-center gap-2 py-1 text-left cursor-pointer"
                  disabled={busy}
                  onClick={() => !active && guard(() => store.open(s.kind, s.id))}
                  title={KIND[s.kind].title}
                >
                  <span className={KIND[s.kind].color}>{KIND[s.kind].icon}</span>
                  <span className={`text-sm truncate ${active ? 'text-[#c4af64]' : 'text-[#e2e4ed]'}`}>{s.name}</span>
                  <span className="ml-auto text-[10px] text-[#6b7280] whitespace-nowrap">{shortDate(s.updatedAt)}</span>
                </button>
                <ConfirmButton
                  label="×"
                  confirmPrompt="Delete?"
                  className="text-[#4b5563] hover:text-red-400 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                  onConfirm={() => store.remove(s.kind, s.id)}
                />
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#2a2d3a] pt-2">
        <ConfirmButton
          label="Clear skills"
          confirmPrompt="Remove all purchases?"
          onConfirm={() => setBuild(b => ({ ...withPurchases(b, []), spells: {} }))}
        />
        <span className="ml-auto">
          <ConfirmButton
            label="Reset everything"
            confirmPrompt="Clear the whole character?"
            onConfirm={() => setBuild(b => emptyBuild(b.startMonth))}
          />
        </span>
      </div>

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
