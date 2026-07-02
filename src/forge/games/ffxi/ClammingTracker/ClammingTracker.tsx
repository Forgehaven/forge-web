import { useEffect, useMemo, useState } from 'react'
import { ITEMS, type ClammingItemDef } from '../data/items'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { useAuth } from '../../../../auth/authContext'
import { getUserData, putUserData } from '../api'
import { ConfirmButton } from '../../../../components/ConfirmButton'
import { ImportPanel } from '../../../../components/ImportPanel'

const SK = STORAGE_KEYS.ffxiClamming

type PriceOverride = { ah?: number; ahStack?: number }
type ExcState = { on: true; manual?: 'ah' | 'vendor' }

type SavedState = {
  overrides: Record<string, PriceOverride>
  exceptions: Record<string, ExcState>
  disabledRec: Record<string, boolean>
}

function loadState(): SavedState {
  try {
    const raw = localStorage.getItem(SK)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { overrides: {}, exceptions: {}, disabledRec: {}, ...parsed }
    }
  } catch { /* ignore */ }
  return { overrides: {}, exceptions: {}, disabledRec: {} }
}

function ahSingleNet(price: number) {
  return price - Math.floor(price * 0.01) - 1
}

function ahStackNetPerItem(stackPrice: number, stackSize: number) {
  return (stackPrice - Math.floor(stackPrice * 0.005) - 4) / stackSize
}

type BestSell = { where: 'ah' | 'vendor'; mode: 'single' | 'stack' | null; net: number }

function calcBest(item: ClammingItemDef, ah: number, ahStack: number): BestSell {
  const vendor = item.vendorPrice
  const singleNet = ah > 0 ? ahSingleNet(ah) : -Infinity
  const stackNet = (ahStack > 0 && item.stackSize > 0)
    ? ahStackNetPerItem(ahStack, item.stackSize)
    : -Infinity
  const bestAH = Math.max(singleNet, stackNet)
  if (bestAH > vendor) {
    return { where: 'ah', mode: singleNet >= stackNet ? 'single' : 'stack', net: Math.round(bestAH) }
  }
  return { where: 'vendor', mode: null, net: vendor }
}

function effectivePrices(item: ClammingItemDef, overrides: Record<string, PriceOverride>) {
  const o = overrides[item.id]
  return {
    ah: o?.ah ?? 0,
    ahStack: o?.ahStack ?? 0,
  }
}

function getCategory(
  item: ClammingItemDef,
  overrides: Record<string, PriceOverride>,
  exceptions: Record<string, ExcState>,
  disabledRec: Record<string, boolean>,
): 'ah' | 'vendor' | 'exception' {
  const exc = exceptions[item.id]
  if (exc?.on) return exc.manual ?? 'exception'
  if (!disabledRec[item.id]) {
    if (item.devRecommended === 'vendor') return 'vendor'
    if (item.devRecommended === 'ah_single' || item.devRecommended === 'ah_stack') return 'ah'
  }
  const { ah, ahStack } = effectivePrices(item, overrides)
  return calcBest(item, ah, ahStack).where
}

// --- Sub-components ---

const TH  = 'pt-3 pb-1.5 text-left   text-[10px] text-[#6b7280] uppercase tracking-wider font-normal whitespace-nowrap'
const THR = 'pt-3 pb-1.5 text-right  text-[10px] text-[#6b7280] uppercase tracking-wider font-normal whitespace-nowrap'
const THC = 'pt-3 pb-1.5 text-center text-[10px] text-[#6b7280] uppercase tracking-wider font-normal whitespace-nowrap'

type RecVariant = 'ah_single' | 'ah_stack' | 'vendor'

const REC_LABEL: Record<RecVariant, string> = {
  ah_single: 'AH Single',
  ah_stack:  'AH Stack',
  vendor:    'Vendor',
}

function bestToVariant(best: BestSell): RecVariant {
  if (best.where === 'vendor') return 'vendor'
  return best.mode === 'stack' ? 'ah_stack' : 'ah_single'
}

function RecBadge({ variant, dim }: { variant: RecVariant; dim?: boolean }) {
  const textClass = variant === 'vendor'
    ? 'text-[#4ade80]'
    : variant === 'ah_single'
      ? 'text-[#60a5fa]'
      : 'text-[#a78bfa]'

  if (dim) {
    return <span className={`text-[10px] whitespace-nowrap ${textClass}`}>{REC_LABEL[variant]}</span>
  }

  const borderBg = variant === 'vendor'
    ? 'border-[#166534]/60 bg-[#166534]/10'
    : variant === 'ah_single'
      ? 'border-[#1e3a5f] bg-[#1e3a5f]/20'
      : 'border-[#2e1f5e] bg-[#2e1f5e]/20'

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap ${textClass} ${borderBg}`}>
      {REC_LABEL[variant]}
    </span>
  )
}

type PriceInputProps = {
  value: number
  onChange: (v: number) => void
  highlight?: boolean
}

function PriceInput({ value, onChange, highlight }: PriceInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value || ''}
      onChange={e => {
        const digits = e.target.value.replace(/\D/g, '')
        onChange(digits ? parseInt(digits, 10) : 0)
      }}
      placeholder="-"
      className={[
        'w-20 px-1.5 py-0.5 text-right text-xs rounded border bg-[#0f1117]',
        'focus:outline-none',
        highlight
          ? 'text-[#c4af64] border-[#c4af64]/50 focus:border-[#c4af64]'
          : 'text-[#9ca3af] border-[#2a2d3a] hover:border-[#3a4060] focus:border-[#4a5070]',
      ].join(' ')}
    />
  )
}

type ExceptionFlagProps = { isManual: boolean; onClick: () => void }
function ExceptionFlag({ isManual, onClick }: ExceptionFlagProps) {
  return (
    <button
      onClick={onClick}
      title={isManual ? 'Return to exception' : 'Mark as exception'}
      className={`text-sm leading-none cursor-pointer transition-colors px-1 rounded ${
        isManual ? 'text-[#c4af64] hover:text-[#e2e4ed]' : 'text-[#2a2d3a] hover:text-[#6b7280]'
      }`}
    >
      ⚑
    </button>
  )
}

type ItemRowProps = {
  item: ClammingItemDef
  ah: number
  ahStack: number
  isManual: boolean
  isRecDisabled: boolean
  onAHChange: (v: number) => void
  onAHStackChange: (v: number) => void
  onSendToException: () => void
  onToggleRec: () => void
}

function ItemRow({
  item, ah, ahStack, isManual, isRecDisabled,
  onAHChange, onAHStackChange, onSendToException, onToggleRec,
}: ItemRowProps) {
  const best = calcBest(item, ah, ahStack)
  const noStack = item.stackSize === 0

  const recVariant: RecVariant = (item.devRecommended && !isRecDisabled)
    ? item.devRecommended
    : bestToVariant(best)

  return (
    <tr className="border-b border-[#1a1d27] last:border-0 hover:bg-[#1a1d27]/50 transition-colors">
      <td className="py-1 pl-4 pr-3 text-sm text-[#e2e4ed] whitespace-nowrap">
        {item.name}
        {isManual && <span className="ml-1.5 text-[10px] text-[#c4af64]/60 uppercase tracking-wider">exc</span>}
      </td>
      <td className="py-1 pr-3 text-center">
        <RecBadge variant={recVariant} />
      </td>
      <td className="py-1 pr-3 text-xs text-[#6b7280] text-right tabular-nums">
        {item.vendorPrice.toLocaleString()}
      </td>
      <td className="py-1 pr-2 text-right">
        <PriceInput value={ah} onChange={onAHChange} highlight={best.mode === 'single'} />
      </td>
      <td className="py-1 pr-3 text-right">
        {noStack
          ? <span className="text-xs text-[#374151] inline-block w-20 text-right" title="Item is not stackable on AH">-</span>
          : <PriceInput value={ahStack} onChange={onAHStackChange} highlight={best.mode === 'stack'} />
        }
      </td>
      <td className="py-1 pr-3 text-center">
        <RecBadge variant={bestToVariant(best)} dim />
      </td>
      <td className="py-1 pr-3 text-xs tabular-nums text-right">
        {best.where === 'ah'
          ? <span className="text-[#c4af64]">{best.net.toLocaleString()}</span>
          : <span className="text-[#6b7280]">{item.vendorPrice.toLocaleString()}</span>
        }
      </td>
      <td className="py-1 pr-2">
        <ExceptionFlag isManual={isManual} onClick={onSendToException} />
      </td>
      <td className="py-1 pr-4">
        {item.devRecommended && (
          <label
            className="flex items-center gap-1.5 cursor-pointer"
            title={isRecDisabled
              ? 'Dev recommendation disabled - using fee math'
              : `Dev recommended: ${REC_LABEL[item.devRecommended]} - check to use fee math instead`
            }
          >
            <span className={`text-xs font-bold leading-none select-none ${isRecDisabled ? 'text-[#374151]' : 'text-red-400'}`}>!</span>
            <input
              type="checkbox"
              checked={isRecDisabled}
              onChange={onToggleRec}
              className="w-3 h-3 cursor-pointer accent-[#6b7280]"
            />
          </label>
        )}
      </td>
    </tr>
  )
}

type ExceptionRowProps = {
  item: ClammingItemDef
  draggingId: string | null
  onDragStart: () => void
  onDragEnd: () => void
  onMoveToAH: () => void
  onMoveToVendor: () => void
  onRemove: () => void
}

function ExceptionRow({ item, draggingId, onDragStart, onDragEnd, onMoveToAH, onMoveToVendor, onRemove }: ExceptionRowProps) {
  const isDragging = draggingId === item.id
  return (
    <tr
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`border-b border-[#1a1d27] last:border-0 transition-colors cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40' : 'hover:bg-[#1a1d27]/50'
      }`}
    >
      <td className="py-1 pl-4 pr-3 text-sm text-[#e2e4ed] whitespace-nowrap">
        <span className="mr-2 text-[#2a2d3a] select-none text-xs">⠿</span>
        {item.name}
      </td>
      <td className="py-1 pr-3 text-xs text-[#6b7280] text-right tabular-nums">{item.vendorPrice.toLocaleString()}</td>
      <td className="py-1 pr-2">
        <button
          onClick={onMoveToAH}
          className="text-[10px] px-2 py-0.5 rounded border border-[#1e3a5f] text-[#60a5fa] hover:bg-[#1e3a5f]/40 transition-colors cursor-pointer whitespace-nowrap"
        >
          → AH
        </button>
      </td>
      <td className="py-1 pr-3">
        <button
          onClick={onMoveToVendor}
          className="text-[10px] px-2 py-0.5 rounded border border-[#166534]/60 text-[#4ade80] hover:bg-[#166534]/20 transition-colors cursor-pointer whitespace-nowrap"
        >
          → Vendor
        </button>
      </td>
      <td className="py-1 pr-4">
        <button
          onClick={onRemove}
          title="Return to auto-sort"
          className="text-xs text-[#2a2d3a] hover:text-[#6b7280] cursor-pointer transition-colors px-1"
        >
          ✕
        </button>
      </td>
    </tr>
  )
}

type DroppableSectionProps = {
  label: string
  count: number
  isDragTarget: boolean
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragLeave: () => void
  children: React.ReactNode
}

function DroppableSection({ label, count, isDragTarget, onDragOver, onDrop, onDragLeave, children }: DroppableSectionProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      className={`rounded-lg border transition-colors overflow-hidden ${
        isDragTarget ? 'border-[#c4af64]/60 bg-[#c4af64]/5' : 'border-[#2a2d3a]'
      }`}
    >
      <div className={`flex items-center gap-2 px-4 py-2 border-b ${
        isDragTarget ? 'border-[#c4af64]/30' : 'border-[#2a2d3a]'
      }`}>
        <span className="text-xs text-[#6b7280] uppercase tracking-widest font-medium">{label}</span>
        <span className="text-xs text-[#374151]">{count}</span>
        {isDragTarget && <span className="ml-auto text-xs text-[#c4af64]">Drop here</span>}
      </div>
      {children}
    </div>
  )
}

// HXICLAM export - maps HXICLAM item names to our item IDs (null = we don't track it, export 0)
const HXICLAM_MAP: Record<string, string | null> = {
  'bibiki slug':                          'bibiki-slug',
  'bibiki urchin':                        'bibiki-urchin',
  'broken willow fishing rod':            null,
  'clump of pamtam kelp':                 'pamtam-kelp',
  'coral fragment':                       'coral-fragment',
  'crab shell':                           'crab-shell',
  'elm log':                              'elm-log',
  'elshimo coconut':                      null,
  'goblin mask':                          null,
  'handful of fish scales':               'fish-scales',
  'handful of high-quality pugil scales': 'hq-pugil-scales',
  'handful of pugil scales':              'pugil-scales',
  'high-quality crab shell':              'hq-crab-shell',
  'hobgoblin pie':                        'hobgoblin-pie',
  'igneous rock':                         null,
  'jacknife':                             'jacknife',
  'lacquer tree log':                     'lacquer-tree-log',
  'loaf of hobgoblin bread':              'hobgoblin-bread',
  'maple log':                            'maple-log',
  'nebimonite':                           'nebimonite',
  'pamamas':                              null,
  'pamtam kelp':                          'pamtam-kelp',
  'pebble':                               'pebble',
  'petrified log':                        'petrified-log',
  'piece of oxblood':                     'oxblood',
  'rock salt':                            null,
  'sack of white sand':                   'white-sand',
  'seashell':                             'seashell',
  'shall shell':                          'shall-shell',
  'suit of goblin armor':                 null,
  'suit of goblin mail':                  null,
  'titanictus shell':                     'titanictus-shell',
  'tropical clam':                        'tropical-clam',
  'turtle shell':                         'turtle-shell',
  'uragnite shell':                       'uragnite-shell',
  'vongola clam':                         'vongola-clam',
}

// Returns the raw listing price HXICLAM expects (not net-after-fees)
function hxiclamPrice(item: ClammingItemDef, ah: number, ahStack: number, disabledRec: Record<string, boolean>): number {
  const rec = item.devRecommended && !disabledRec[item.id] ? item.devRecommended : null
  if (rec === 'vendor')   return item.vendorPrice
  if (rec === 'ah_single') return ah
  if (rec === 'ah_stack')  return item.stackSize > 0 ? Math.round(ahStack / item.stackSize) : ah
  const best = calcBest(item, ah, ahStack)
  if (best.where === 'vendor') return item.vendorPrice
  if (best.mode === 'single')  return ah
  return item.stackSize > 0 ? Math.round(ahStack / item.stackSize) : ah
}

// Shared column widths - keeps both tables pixel-identical
const itemTableCols = (
  <colgroup>
    <col />                        {/* Item - fills remaining width */}
    <col className="w-28" />       {/* Recommendation */}
    <col className="w-20" />       {/* Vendor */}
    <col className="w-20" />       {/* AH/each */}
    <col className="w-24" />       {/* AH Stack */}
    <col className="w-[5.5rem]" /> {/* Mode */}
    <col className="w-20" />       {/* Net/item */}
    <col className="w-8" />        {/* ⚑ */}
    <col className="w-16" />       {/* Override */}
  </colgroup>
)

const itemTableHead = (
  <thead>
    <tr className="border-b border-[#1e2130]">
      <th className={`${TH} pl-4 pr-3`}>Item</th>
      <th className="pt-3 pb-1.5 pr-3" />
      <th className={`${THR} pr-3`}>Vendor</th>
      <th className={`${THR} pr-2`}>AH/each</th>
      <th className={`${THR} pr-3`}>AH Stack</th>
      <th className={`${THC} pr-3`}>Mode</th>
      <th className={`${THR} pr-3`}>Net/item</th>
      <th className="pt-3 pb-1.5 pr-2" />
      <th className="pt-3 pb-1.5 pr-4" />
    </tr>
  </thead>
)

// --- Main component ---

export function ClammingTracker() {
  const [saved, setSaved] = useState<SavedState>(loadState)
  // stableOverrides lags 2s behind price changes - drives section placement
  const [stableOverrides, setStableOverrides] = useState<Record<string, PriceOverride>>(() => loadState().overrides)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragTarget, setDragTarget] = useState<'ah' | 'vendor' | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedHXI, setCopiedHXI] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const { isAuthenticated } = useAuth()
  // Server baseline for the account; null = not synced. Prices are saved
  // manually (the flashing Save button), unlike the auto-synced tools.
  const [serverBlob, setServerBlob] = useState<SavedState | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setServerBlob(null) // eslint-disable-line react-hooks/set-state-in-effect
      return
    }
    let cancelled = false
    getUserData<Partial<SavedState>>('clamming').then(res => {
      if (cancelled || res.status !== 'ok') return
      const data = res.payload.data
      if (data && Object.keys(data).length > 0) {
        const next: SavedState = { overrides: {}, exceptions: {}, disabledRec: {}, ...data }
        setSaved(next)
        setStableOverrides(next.overrides)
        setServerBlob(next)
      } else {
        // No server data yet: keep the local view; it shows as unsaved so the
        // first Save uploads this browser's prices to the account.
        setServerBlob({ overrides: {}, exceptions: {}, disabledRec: {} })
      }
    }).catch(() => { /* offline - stay on local */ })
    return () => { cancelled = true }
  }, [isAuthenticated])

  const dirty = useMemo(
    () => serverBlob !== null && JSON.stringify(saved) !== JSON.stringify(serverBlob),
    [saved, serverBlob],
  )

  async function saveToServer() {
    if (!isAuthenticated || !dirty || saving) return
    setSaving(true)
    try {
      const res = await putUserData('clamming', saved)
      if (res.status === 'ok') setServerBlob(saved)
    } finally {
      setSaving(false)
    }
  }

  // Debounce category recalculation 2s after last price change.
  // Effect cleanup cancels the pending timer on each keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setStableOverrides(saved.overrides), 2000)
    return () => clearTimeout(timer)
  }, [saved.overrides])

  function setPrice(id: string, field: 'ah' | 'ahStack', value: number) {
    setSaved(prev => {
      const next: SavedState = {
        ...prev,
        overrides: { ...prev.overrides, [id]: { ...prev.overrides[id], [field]: value } },
      }
      localStorage.setItem(SK, JSON.stringify(next))
      return next
    })
  }

  function sendToException(id: string) {
    setSaved(prev => {
      const next: SavedState = { ...prev, exceptions: { ...prev.exceptions, [id]: { on: true } } }
      localStorage.setItem(SK, JSON.stringify(next))
      return next
    })
  }

  function moveException(id: string, to: 'ah' | 'vendor') {
    setSaved(prev => {
      const next: SavedState = { ...prev, exceptions: { ...prev.exceptions, [id]: { on: true, manual: to } } }
      localStorage.setItem(SK, JSON.stringify(next))
      return next
    })
  }

  function removeException(id: string) {
    setSaved(prev => {
      const exceptions = Object.fromEntries(Object.entries(prev.exceptions).filter(([k]) => k !== id))
      const next: SavedState = { ...prev, exceptions }
      localStorage.setItem(SK, JSON.stringify(next))
      return next
    })
  }

  function toggleDisabledRec(id: string) {
    setSaved(prev => {
      const disabledRec = { ...prev.disabledRec, [id]: !prev.disabledRec[id] }
      const next: SavedState = { ...prev, disabledRec }
      localStorage.setItem(SK, JSON.stringify(next))
      return next
    })
  }

  function resetAll() {
    const empty: SavedState = { overrides: {}, exceptions: {}, disabledRec: {} }
    setSaved(empty)
    setStableOverrides({})
    localStorage.setItem(SK, JSON.stringify(empty))
  }

  function exportHXICLAM() {
    const byId = Object.fromEntries(ITEMS.map(i => [i.id, i]))
    const lines = Object.entries(HXICLAM_MAP).map(([hxiName, itemId]) => {
      if (!itemId) return `${hxiName}:0`
      const item = byId[itemId]
      if (!item) return `${hxiName}:0`
      const { ah, ahStack } = effectivePrices(item, saved.overrides)
      return `${hxiName}:${hxiclamPrice(item, ah, ahStack, saved.disabledRec)}`
    })
    navigator.clipboard.writeText(lines.join('\n'))
    setCopiedHXI(true)
    setTimeout(() => setCopiedHXI(false), 1500)
  }

  function exportState() {
    const code = btoa(JSON.stringify(saved))
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function importState(code: string): boolean {
    try {
      const parsed = JSON.parse(atob(code))
      const next: SavedState = { overrides: {}, exceptions: {}, disabledRec: {}, ...parsed }
      setSaved(next)
      setStableOverrides(next.overrides)
      localStorage.setItem(SK, JSON.stringify(next))
      return true
    } catch {
      return false
    }
  }

  // Section placement uses stableOverrides + live exceptions + live disabledRec
  const { ahItems, vendorItems, exceptionItems } = useMemo(() => {
    const ahItems: ClammingItemDef[] = []
    const vendorItems: ClammingItemDef[] = []
    const exceptionItems: ClammingItemDef[] = []
    for (const item of ITEMS) {
      const cat = getCategory(item, stableOverrides, saved.exceptions, saved.disabledRec)
      if (cat === 'ah') ahItems.push(item)
      else if (cat === 'vendor') vendorItems.push(item)
      else exceptionItems.push(item)
    }
    const alpha = (a: ClammingItemDef, b: ClammingItemDef) => a.name.localeCompare(b.name)
    ahItems.sort(alpha)
    vendorItems.sort(alpha)
    exceptionItems.sort(alpha)
    return { ahItems, vendorItems, exceptionItems }
  }, [stableOverrides, saved.exceptions, saved.disabledRec])

  function renderItemRows(items: ClammingItemDef[]) {
    return items.map(item => {
      const { ah, ahStack } = effectivePrices(item, saved.overrides)
      return (
        <ItemRow
          key={item.id}
          item={item}
          ah={ah}
          ahStack={ahStack}
          isManual={!!saved.exceptions[item.id]?.manual}
          isRecDisabled={!!saved.disabledRec[item.id]}
          onAHChange={v => setPrice(item.id, 'ah', v)}
          onAHStackChange={v => setPrice(item.id, 'ahStack', v)}
          onSendToException={() => sendToException(item.id)}
          onToggleRec={() => toggleDisabledRec(item.id)}
        />
      )
    })
  }

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
            Clamming <span className="text-[#c4af64]">Tracker</span>
          </h1>
          <p className="text-sm text-[#6b7280] mt-0.5">FFXI · Horizon - Purgonorgo Isle</p>
        </div>
        <div className="flex items-center gap-3 mt-1 shrink-0">
          <button
            onClick={exportHXICLAM}
            className="text-xs px-2.5 py-1 rounded border border-[#c4af64]/40 text-[#c4af64] hover:bg-[#c4af64]/10 transition-colors cursor-pointer whitespace-nowrap"
          >
            {copiedHXI ? 'Copied!' : 'Export for HXICLAM'}
          </button>
          <span className="text-[#2a2d3a]">|</span>
          <button
            onClick={exportState}
            className="text-xs text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer"
          >
            {copied ? 'Copied!' : 'Export'}
          </button>
          <button
            onClick={() => setImportOpen(v => !v)}
            className="text-xs text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer"
          >
            Import
          </button>
          <span className="text-[#2a2d3a]">|</span>
          <ConfirmButton label="Reset all" confirmPrompt="Reset all?" onConfirm={resetAll} />
        </div>
      </div>

      {/* Account sync: prices save to the account with the manual Save button */}
      {isAuthenticated && (
        <div className="flex items-center justify-end">
          <button
            onClick={saveToServer}
            disabled={!dirty || saving}
            className={`text-xs px-4 py-1.5 rounded font-semibold transition-colors shrink-0 ${
              dirty
                ? 'bg-[#c4af64] text-[#0f1117] hover:bg-[#d4bf74] animate-pulse cursor-pointer'
                : 'border border-[#2a2d3a] text-[#374151] cursor-default'
            }`}
          >
            {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
          </button>
        </div>
      )}

      {importOpen && (
        <ImportPanel
          description="Paste an export code to load saved prices and settings from another source."
          onImport={importState}
          onClose={() => setImportOpen(false)}
        />
      )}

      {/* Exception Section - shown first so unsorted items are obvious */}
      {exceptionItems.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-500/20">
            <span className="text-xs text-amber-400 uppercase tracking-widest font-medium">Needs Sorting</span>
            <span className="text-xs text-amber-500/60">{exceptionItems.length}</span>
            <span className="ml-auto text-[10px] text-[#374151]">Drag to a section or use the buttons</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2130]">
                  <th className={`${TH} pl-4 pr-3`}>Item</th>
                  <th className={`${THR} pr-3`}>Vendor</th>
                  <th className="pt-3 pb-1.5 pr-2" colSpan={2} />
                  <th className="pt-3 pb-1.5 pr-4 w-6" />
                </tr>
              </thead>
              <tbody>
                {exceptionItems.map(item => (
                  <ExceptionRow
                    key={item.id}
                    item={item}
                    draggingId={draggingId}
                    onDragStart={() => setDraggingId(item.id)}
                    onDragEnd={() => { setDraggingId(null); setDragTarget(null) }}
                    onMoveToAH={() => moveException(item.id, 'ah')}
                    onMoveToVendor={() => moveException(item.id, 'vendor')}
                    onRemove={() => removeException(item.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AH Section */}
      <DroppableSection
        label="AH"
        count={ahItems.length}
        isDragTarget={dragTarget === 'ah'}
        onDragOver={e => { e.preventDefault(); setDragTarget('ah') }}
        onDrop={() => { if (draggingId) { moveException(draggingId, 'ah'); setDraggingId(null) } setDragTarget(null) }}
        onDragLeave={() => setDragTarget(null)}
      >
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            {itemTableCols}
            {itemTableHead}
            <tbody>
              {ahItems.length === 0
                ? <tr><td colSpan={9} className="py-4 pl-4 text-sm text-[#374151]">No items</td></tr>
                : renderItemRows(ahItems)
              }
            </tbody>
          </table>
        </div>
      </DroppableSection>

      {/* Vendor Section */}
      <DroppableSection
        label="Vendor"
        count={vendorItems.length}
        isDragTarget={dragTarget === 'vendor'}
        onDragOver={e => { e.preventDefault(); setDragTarget('vendor') }}
        onDrop={() => { if (draggingId) { moveException(draggingId, 'vendor'); setDraggingId(null) } setDragTarget(null) }}
        onDragLeave={() => setDragTarget(null)}
      >
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            {itemTableCols}
            {itemTableHead}
            <tbody>{renderItemRows(vendorItems)}</tbody>
          </table>
        </div>
      </DroppableSection>
    </div>
  )
}
