import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { Collapsible } from '../components/Collapsible'
import { ConfirmButton } from '../components/ConfirmButton'
import { useAuth, type AuthUser } from './authContext'
import { useFfxiCharacters } from '../forge/games/ffxi/hooks/useFfxiCharacters'
import { API_URLS } from '../config/apiUrls'
import ffxiLogo from '../forge/games/ffxi/ffxi-logo.png'
import albionLogo from '../forge/games/albion/Splash/albion-logo.png'

// 'running_dawn' -> 'Running Dawn', 'albion_guild' -> 'Albion Guild'
function titleCase(slug: string): string {
  return slug
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, isAuthenticated, login, logout } = useAuth()

  return (
    <Modal open={open} onClose={onClose} title="Account">
      <div className="px-5 py-4">
        {isAuthenticated && user ? (
          <div className="space-y-4">
            {/* Account */}
            <div className="flex items-center gap-3">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#e2e4ed] truncate">{user.username}</p>
                <p className="text-xs text-[#6b7280] truncate">{user.discord_id}</p>
              </div>
              <button
                onClick={() => logout()}
                className="text-xs px-3 py-1.5 rounded font-semibold text-white bg-red-600/80 hover:bg-red-600 transition-colors cursor-pointer shrink-0"
              >
                Logout
              </button>
            </div>

            {/* Tools */}
            <div className="border-t border-[#2a2d3a] pt-3 space-y-1">
              <p className="text-xs text-[#6b7280] uppercase tracking-widest">Tools</p>
              <p className="text-xs text-[#9ca3af] leading-relaxed">
                Nothing you do in Tools is stored on our servers. Everything runs locally in your browser.
                If that ever changes, it'll be clearly flagged and almost certainly optional.
              </p>
            </div>

            {/* Games */}
            <div className="border-t border-[#2a2d3a] pt-3 space-y-1">
              <p className="text-xs text-[#6b7280] uppercase tracking-widest">Games</p>
              <GamesSection user={user} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm text-[#e2e4ed]">Sign in to unlock:</p>
              <ul className="text-xs text-[#9ca3af] space-y-1 list-disc list-inside">
                <li>
                  Save &amp; sync your <span className="text-[#e2e4ed]">/games</span> trackers across devices:
                  FFXI Spell Tracker, Faction Conquest, Clamming Tracker, and more (today they live only in this browser).
                </li>
                <li>Share entries with your guild, like the week's Faction Conquest map everyone can reference.</li>
                <li>Access role-gated services like the Albion Market Manager.</li>
              </ul>
            </div>
            <button
              onClick={() => login()}
              className="w-full py-2 rounded text-sm font-semibold text-white bg-[#5865F2] hover:bg-[#4752c4] transition-colors cursor-pointer"
            >
              Login with Discord
            </button>
            <p className="text-xs text-[#6b7280] leading-relaxed border-t border-[#2a2d3a] pt-3">
              Login is optional. Tools and trackers work locally in your browser; only services like the
              Albion Market Manager require login.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}

// Per-game subsections. Adding an entry here auto-expands it when on its route - no extra wiring.
function GamesSection({ user }: { user: AuthUser }) {
  const { pathname } = useLocation()
  const sections = [
    { key: 'ffxi', label: 'FFXI Horizon', icon: ffxiLogo, prefix: '/games/ffxi', body: <FfxiCharacters /> },
    { key: 'albion', label: 'Albion Online', icon: albionLogo, prefix: '/games/albion', body: <AlbionAccess user={user} /> },
  ]
  return (
    <>
      {sections.map(s => (
        <Collapsible
          key={s.key}
          defaultOpen={pathname.startsWith(s.prefix)}
          title={
            <span className="flex items-center gap-2">
              <img src={s.icon} alt="" className="h-4 w-5 object-contain shrink-0" />
              {s.label}
            </span>
          }
        >
          <div className="pl-7">{s.body}</div>
        </Collapsible>
      ))}
    </>
  )
}

function FfxiCharacters() {
  const { characters, loading, error, register, remove } = useFfxiCharacters()
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)

  async function add() {
    const trimmed = name.trim()
    if (!trimmed || adding) return
    setAdding(true)
    try {
      const ok = await register(trimmed)
      if (ok) setName('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-2 pb-1">
      <p className="text-xs text-[#9ca3af] leading-relaxed">
        Register your HorizonXI characters (up to 3) to sync your FFXI tool data across devices.
        The tools keep working without an account, saved in this browser only.
      </p>

      {loading && <p className="text-xs text-[#6b7280]">Loading characters…</p>}

      <div className="space-y-1">
        {characters.map(c => (
          <div key={c.id} className="flex items-center gap-2">
            {c.avatar && (
              <img
                src={`${API_URLS.horizonXiAvatarBase}/${c.avatar}.webp`}
                alt=""
                className="w-6 h-6 object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <span className="text-sm text-[#e2e4ed] flex-1 truncate">{c.name}</span>
            <ConfirmButton
              label="Remove"
              confirmPrompt="Delete saved data?"
              onConfirm={() => remove(c.id)}
              className="text-xs text-[#6b7280] hover:text-red-400"
            />
          </div>
        ))}
      </div>

      {characters.length < 3 && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add() }}
            placeholder="Character name"
            className="px-2 py-1 text-xs rounded border bg-[#0f1117] text-[#e2e4ed] border-[#2a2d3a] hover:border-[#3a4060] focus:border-[#4a5070] focus:outline-none flex-1 min-w-0"
          />
          <button
            onClick={add}
            disabled={!name.trim() || adding}
            className="text-xs px-3 py-1 rounded border border-[#2a2d3a] text-[#6b7280] hover:text-[#e2e4ed] hover:border-[#3a4060] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0"
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function AccessChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded ${ok ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}
    >
      {ok ? '✓' : '✗'} {label}
    </span>
  )
}

// One row per guild the backend reports on: membership chip + a chip per named role.
function AlbionAccess({ user }: { user: AuthUser }) {
  const guilds = Object.entries(user.guilds)
  return (
    <div className="pb-1 space-y-2">
      <p className="text-sm text-[#e2e4ed]">Market Manager access</p>
      {guilds.length === 0 && (
        <p className="text-xs text-[#9ca3af]">No guild status yet. Try logging in again.</p>
      )}
      {guilds.map(([slug, status]) => (
        <div key={slug} className="space-y-1">
          <p className="text-xs text-[#6b7280]">{titleCase(slug)}</p>
          <div className="flex flex-wrap gap-2">
            <AccessChip ok={status.is_member} label="Member" />
            {Object.entries(status.roles).map(([role, ok]) => (
              <AccessChip key={role} ok={ok} label={`${titleCase(role)} role`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
