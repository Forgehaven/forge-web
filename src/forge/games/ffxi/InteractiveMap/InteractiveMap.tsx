import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Select, type SelectOption } from '../../../../components/Select'
import { ZoomPan } from '../../../../components/ZoomPan'
import { STORAGE_KEYS } from '../../../../config/storageKeys'
import { MAPS, type MapEntry } from './maps'
import { CONNECTIONS } from './connections'
import { NM_SPAWNS, type NmSpawn } from './nms'
import { EXP_CAMPS, levelLabel, type ExpCamp } from '../ExpCamps/camps'
import sandoriaIcon from '../data/SandoriaIcon.png'
import bastokIcon from '../data/BastokIcon.png'
import windurstIcon from '../data/WindurstIcon.png'
import jeunoIcon from '../data/JeunoIcon.png'

const SK = STORAGE_KEYS.ffxiMap

const MAP_NAME = new Map(MAPS.map(m => [m.id, m.name]))
const zoneBaseOf = (id: string) => id.replace(/_\d+$/, '')
const floorOf = (id: string) => /_(\d+)$/.exec(id)?.[1] ?? ''

const CAMP_SPOTS: Record<string, { camp: ExpCamp; x: number; y: number }[]> = {}
for (const camp of EXP_CAMPS) {
  for (const s of camp.spots) (CAMP_SPOTS[s.mapId] ??= []).push({ camp, x: s.x, y: s.y })
}
const NM_OPTIONS: SelectOption[] = Object.entries(NM_SPAWNS)
  .flatMap(([mapId, spawns]) =>
    [...new Set(spawns.map(s => s.name))].map(name => ({
      value: `${mapId}|${name}`,
      label: `${name} · ${MAP_NAME.get(mapId) ?? mapId}`,
    })))
  .sort((a, b) => a.label.localeCompare(b.label))

const CITY_LINKS = [
  { name: "SAN D'ORIA", id: 'southern_san_doria', color: '#f87171', icon: sandoriaIcon },
  { name: 'BASTOK', id: 'bastok_markets', color: '#60a5fa', icon: bastokIcon },
  { name: 'WINDURST', id: 'windurst_woods', color: '#4ade80', icon: windurstIcon },
  { name: 'JEUNO', id: 'lower_jeuno', color: '#c4af64', icon: jeunoIcon },
]

const QUICK_LINKS = [
  { name: 'HOLLA', id: 'la_theine_plateau' },
  { name: 'DEM', id: 'konschtat_highlands' },
  { name: 'MEA', id: 'tahrongi_canyon' },
  { name: 'ALTEP', id: 'western_altepa_desert' },
  { name: 'YHOAT', id: 'yhoator_jungle' },
  { name: 'VAHZL', id: 'beaucedine_glacier' },
]

function loadPrefs(): { last: string | null; nm: boolean; exp: boolean; legend: boolean } {
  try {
    const p = JSON.parse(localStorage.getItem(SK) ?? '')
    return {
      last: typeof p?.last === 'string' ? p.last : null,
      nm: p?.nm === true,
      exp: p?.exp === true,
      legend: p?.legend !== false,
    }
  } catch { /* fall through */ }
  return { last: null, nm: false, exp: false, legend: true }
}

function savePrefs(patch: Partial<{ last: string; nm: boolean; exp: boolean; legend: boolean }>) {
  const { last, nm, exp, legend } = loadPrefs()
  localStorage.setItem(SK, JSON.stringify({ last, nm, exp, legend, ...patch }))
}

function wikiUrl(page: string) {
  return `https://horizonffxi.wiki/${encodeURIComponent(page.replace(/ /g, '_'))}`
}

function areaOf(s: NmSpawn): number {
  if (s.points && s.points.length >= 3) {
    const xs = s.points.map(p => p[0])
    const ys = s.points.map(p => p[1])
    return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))
  }
  return Math.PI * (s.r ?? 0) ** 2
}

export function InteractiveMap() {
  const { zoneId } = useParams()
  const navigate = useNavigate()
  // EXP Camps table rows link here with the camp id in router state; it only
  // arrives on mount (the table page is a separate route), so seed state lazily.
  const navFlashCamp = (useLocation().state as { flashCamp?: string } | null)?.flashCamp ?? null
  const [annotate, setAnnotate] = useState(false)
  const [annotateMode, setAnnotateMode] = useState<'point' | 'area'>('point')
  const [tracePoints, setTracePoints] = useState<[number, number][]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [showNms, setShowNms] = useState(() => loadPrefs().nm)
  const [showCamps, setShowCamps] = useState(() => navFlashCamp ? true : loadPrefs().exp)
  const [legendOpen, setLegendOpen] = useState(() => loadPrefs().legend)
  const [hoveredNm, setHoveredNm] = useState<string | null>(null)
  const [flashNm, setFlashNm] = useState<string | null>(null)
  const [flashCamp, setFlashCamp] = useState<string | null>(navFlashCamp)
  const map: MapEntry | null = MAPS.find(m => m.id === zoneId) ?? null
  const connections = map ? CONNECTIONS[map.id] ?? [] : []
  const nmSpawns = map ? NM_SPAWNS[map.id] ?? [] : []
  const campSpots = map ? CAMP_SPOTS[map.id] ?? [] : []
  // Big roamer blobs first, small camps last, so tight areas always win the click.
  const sortedSpawns = nmSpawns.filter(s => !s.unmarked).sort((a, b) => areaOf(b) - areaOf(a))
  // Legend covers the whole zone, not just the current floor: rows for NMs on
  // other floors show a map badge and jump there on first click (wiki on the next).
  const zoneMaps = map
    ? MAPS.filter(m => zoneBaseOf(m.id) === zoneBaseOf(map.id))
        .sort((a, b) => Number(floorOf(a.id)) - Number(floorOf(b.id)))
    : []
  const multiFloor = zoneMaps.length > 1
  const zoneEntries = zoneMaps.flatMap(m => (NM_SPAWNS[m.id] ?? []).map(s => ({ s, mapId: m.id })))
  const legendRows = [...new Map(zoneEntries.map(e => [e.s.name, e.s.page])).entries()]
    .map(([name, page]) => {
      const marked = zoneEntries.filter(e => e.s.name === name && !e.s.unmarked)
      return {
        name,
        page,
        unmarked: marked.length === 0,
        floors: [...new Set(marked.map(e => floorOf(e.mapId)))].filter(Boolean),
        jumpTo: marked.length > 0 && !marked.some(e => e.mapId === map?.id) ? marked[0].mapId : null,
      }
    })
    .sort((a, b) => Number(a.unmarked) - Number(b.unmarked) || a.name.localeCompare(b.name))

  // Bare /map restores the last viewed zone; the id lives in the URL so a
  // view can be bookmarked or shared.
  useEffect(() => {
    if (zoneId) return
    const { last } = loadPrefs()
    if (last) navigate(`/games/ffxi/map/${last}`, { replace: true })
  }, [zoneId, navigate])

  useEffect(() => {
    if (!flashNm) return
    const t = setTimeout(() => setFlashNm(null), 3000)
    return () => clearTimeout(t)
  }, [flashNm])

  useEffect(() => {
    if (!flashCamp) return
    savePrefs({ exp: true })
    const t = setTimeout(() => setFlashCamp(null), 3000)
    return () => clearTimeout(t)
  }, [flashCamp])

  function toggleNms() {
    setShowNms(prev => {
      savePrefs({ nm: !prev })
      return !prev
    })
  }

  function toggleCamps() {
    setShowCamps(prev => {
      savePrefs({ exp: !prev })
      return !prev
    })
  }

  const options = useMemo<SelectOption[]>(
    () => MAPS.map(m => ({ value: m.id, label: m.name })),
    [])

  function setZone(id: string) {
    savePrefs({ last: id })
    navigate(`/games/ffxi/map/${id}`)
  }

  function pick(opt: SelectOption | null) {
    if (!opt) return
    setZone(opt.value)
  }

  function pickNm(opt: SelectOption | null) {
    if (!opt) return
    const cut = opt.value.indexOf('|')
    setShowNms(true)
    savePrefs({ nm: true })
    setFlashNm(opt.value.slice(cut + 1))
    setZone(opt.value.slice(0, cut))
  }

  function onAnnotateClick(x: number, y: number) {
    if (!annotate || !map) return
    if (annotateMode === 'area') {
      setTracePoints(prev => [...prev, [x, y]])
      return
    }
    const snippet = `{ x: ${x}, y: ${y}, to: '', label: '' },`
    void navigator.clipboard?.writeText(snippet)
    setCopied(snippet)
  }

  function finishTrace() {
    if (tracePoints.length < 3) return
    const cx = Math.round(tracePoints.reduce((n, p) => n + p[0], 0) / tracePoints.length)
    const cy = Math.round(tracePoints.reduce((n, p) => n + p[1], 0) / tracePoints.length)
    const pts = tracePoints.map(p => `[${p[0]}, ${p[1]}]`).join(', ')
    const snippet = `{ name: '', page: '', x: ${cx}, y: ${cy}, r: 0, points: [${pts}] },`
    void navigator.clipboard?.writeText(snippet)
    setCopied(snippet)
    setTracePoints([])
  }

  function toggleLegend() {
    setLegendOpen(prev => {
      savePrefs({ legend: !prev })
      return !prev
    })
  }

  return (
    <div className="flex flex-col gap-4 w-full h-full min-h-0">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-[#e2e4ed] tracking-wide">
            Interactive <span className="text-[#c4af64]">Map</span>
          </h1>
          <p className="text-sm text-[#6b7280] mt-0.5">FFXI · Horizon</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {CITY_LINKS.map(c => (
              <button
                key={c.name}
                onClick={() => setZone(c.id)}
                style={{ color: c.color }}
                className="px-2 py-1 rounded border border-[#2a2d3a] bg-[#1a1d27] text-xs font-semibold tracking-wide hover:border-current transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {c.icon && <img src={c.icon} alt="" className="w-3.5 h-3.5 object-contain" />}
                {c.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {QUICK_LINKS.map(q => (
              <button
                key={q.name}
                onClick={() => setZone(q.id)}
                className="px-2 py-1 rounded border border-[#2a2d3a] bg-[#1a1d27] text-xs font-semibold tracking-wide text-[#c4af64] hover:border-[#c4af64] transition-colors cursor-pointer"
              >
                {q.name}
              </button>
            ))}
            <button
              onClick={toggleNms}
              aria-pressed={showNms}
              title="Toggle NM spawn areas"
              className={`px-2 py-1 rounded border text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
                showNms
                  ? 'border-[#ef4444] text-[#ef4444] bg-[#ef4444]/10'
                  : 'border-[#2a2d3a] bg-[#1a1d27] text-[#6b7280] hover:border-[#ef4444] hover:text-[#ef4444]'
              }`}
            >
              NM
            </button>
            <button
              onClick={toggleCamps}
              aria-pressed={showCamps}
              title="Toggle EXP camps"
              className={`px-2 py-1 rounded border text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
                showCamps
                  ? 'border-[#4ade80] text-[#4ade80] bg-[#4ade80]/10'
                  : 'border-[#2a2d3a] bg-[#1a1d27] text-[#6b7280] hover:border-[#4ade80] hover:text-[#4ade80]'
              }`}
            >
              EXP
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Select
            options={options}
            value={options.find(o => o.value === zoneId) ?? null}
            onChange={pick}
            placeholder="Search zones…"
            isSearchable
            menuPosition="fixed"
            classNames={{
              container: () => 'w-64',
              menu: () =>
                'bg-[#1a1d27] border border-[#2a2d3a] rounded-lg mt-1 shadow-xl overflow-hidden w-64',
            }}
            styles={{
              menu: base => ({ ...base, zIndex: 9999 }),
              menuList: () => ({ maxHeight: 380, overflowY: 'auto' }),
            }}
          />
          <Select
            options={NM_OPTIONS}
            value={null}
            onChange={pickNm}
            placeholder="Search NMs…"
            aria-label="Search NMs"
            isSearchable
            menuPosition="fixed"
            classNames={{
              container: () => 'w-72',
              menu: () =>
                'bg-[#1a1d27] border border-[#2a2d3a] rounded-lg mt-1 shadow-xl overflow-hidden w-72',
            }}
            styles={{
              menu: base => ({ ...base, zIndex: 9999 }),
              menuList: () => ({ maxHeight: 380, overflowY: 'auto' }),
            }}
          />
        </div>
      </div>

      <div
        className="relative flex-1 min-h-[420px] rounded-lg border border-[#2a2d3a] bg-[#0b0d13] overflow-hidden"
        onPointerDown={() => { setFlashNm(null); setFlashCamp(null) }}
      >
        {map && showNms && legendRows.length > 0 && (
          <div className="absolute top-2 left-2 z-10 w-52 rounded-lg border border-[#2a2d3a] bg-[#1a1d27]/95 shadow-lg shadow-black/40">
            <button
              onClick={toggleLegend}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-[#9ca3af] hover:text-[#e2e4ed] transition-colors cursor-pointer"
            >
              NMs ({legendRows.length})
              <span className={`transition-transform duration-200 leading-none ${legendOpen ? 'rotate-0' : '-rotate-90'}`}>▾</span>
            </button>
            {legendOpen && (
              <ul className="max-h-64 overflow-y-auto border-t border-[#2a2d3a] py-1">
                {legendRows.map(({ name, page, unmarked, floors, jumpTo }) => (
                  <li key={name}>
                    <a
                      href={wikiUrl(page)}
                      target="_blank"
                      rel="noreferrer"
                      title={jumpTo ? `On map ${floorOf(jumpTo)} · click to jump` : undefined}
                      onClick={e => {
                        if (!jumpTo || e.ctrlKey || e.metaKey || e.shiftKey) return
                        e.preventDefault()
                        setFlashNm(name)
                        setZone(jumpTo)
                      }}
                      onMouseEnter={() => setHoveredNm(name)}
                      onMouseLeave={() => setHoveredNm(null)}
                      className="flex items-center justify-between gap-2 px-3 py-0.5 text-xs text-[#e2e4ed] hover:text-[#ef4444] hover:bg-[#0b0d13]/60 transition-colors"
                    >
                      <span className="truncate">{name}</span>
                      {unmarked
                        ? <span className="shrink-0 text-[10px] text-[#6b7280]">unmarked</span>
                        : multiFloor && floors.length > 0 && (
                          <span className="shrink-0 text-[10px] text-[#6b7280]">map {floors.join('·')}</span>
                        )}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {map ? (
          <ZoomPan onPointClick={onAnnotateClick} contentSize={1024} resetKey={map.id}>
            {scale => (
              <div className="relative">
                <img
                  src={`/ffxi_maps/${map.file}`}
                  alt={map.name}
                  draggable={false}
                  className="max-w-none"
                  width={1024}
                  height={1024}
                />
                {(showNms || (annotate && annotateMode === 'area')) && (
                  <svg
                    viewBox="0 0 1024 1024"
                    width={1024}
                    height={1024}
                    className="absolute inset-0 pointer-events-none"
                    data-testid="nm-layer"
                  >
                    {showNms && sortedSpawns.map(s => {
                      const flash = flashNm === s.name
                      const hot = hoveredNm === s.name || flash
                      const shape = {
                        fill: '#ef4444',
                        fillOpacity: hot ? 0.35 : 0.18,
                        stroke: '#ef4444',
                        strokeOpacity: hot ? 1 : 0.6,
                        strokeWidth: 2,
                        vectorEffect: 'non-scaling-stroke' as const,
                      }
                      return (
                        <a
                          key={`${s.name}-${s.x}-${s.y}`}
                          href={wikiUrl(s.page)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${s.name} (wiki)`}
                          data-highlighted={hot || undefined}
                          className={`pointer-events-auto cursor-pointer${flash ? ' animate-pulse' : ''}`}
                          onMouseEnter={() => setHoveredNm(s.name)}
                          onMouseLeave={() => setHoveredNm(null)}
                        >
                          <title>{s.name}</title>
                          {s.points && s.points.length >= 3
                            ? <polygon points={s.points.map(p => p.join(',')).join(' ')} {...shape} />
                            : <circle cx={s.x} cy={s.y} r={s.r} {...shape} />}
                        </a>
                      )
                    })}
                    {annotate && annotateMode === 'area' && tracePoints.length > 0 && (
                      <g data-testid="trace-preview">
                        <polyline
                          points={tracePoints.map(p => p.join(',')).join(' ')}
                          fill="rgba(196, 175, 100, 0.15)"
                          stroke="#c4af64"
                          strokeWidth={2}
                          vectorEffect="non-scaling-stroke"
                        />
                        {tracePoints.map((p, i) => (
                          <circle key={i} cx={p[0]} cy={p[1]} r={3} fill="#c4af64" vectorEffect="non-scaling-stroke" />
                        ))}
                      </g>
                    )}
                  </svg>
                )}
                {showCamps && campSpots.map(({ camp, x, y }, i) => {
                  const flash = flashCamp === camp.id
                  return (
                    <div
                      key={`${camp.id}-${i}`}
                      aria-label={`Lv ${levelLabel(camp)} · ${camp.description}`}
                      data-highlighted={flash || undefined}
                      className="absolute group hover:z-20"
                      style={{
                        left: x,
                        top: y,
                        transform: `translate(-50%, -50%) scale(${1 / scale})`,
                      }}
                    >
                      {flash && <span className="absolute -inset-1.5 rounded-full bg-[#4ade80]/40 animate-ping" />}
                      <span className="relative block w-3.5 h-3.5 rounded-full bg-[#4ade80] border-2 border-[#0b0d13] shadow-lg shadow-black/60" />
                      <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 w-max max-w-64 whitespace-normal text-center text-[11px] px-1.5 py-0.5 rounded bg-[#1a1d27] border border-[#2a2d3a] text-[#e2e4ed] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <span className="text-[#4ade80] font-semibold">Lv {levelLabel(camp)}</span> · {camp.description}
                      </span>
                    </div>
                  )
                })}
                {connections.map(c => (
                  <button
                    key={`${c.to}-${c.x}-${c.y}`}
                    onClick={e => { e.stopPropagation(); setZone(c.to) }}
                    title={c.label}
                    aria-label={`Go to ${c.label}`}
                    className="absolute cursor-pointer group"
                    style={{
                      left: c.x,
                      top: c.y,
                      transform: `translate(-50%, -50%) scale(${1 / scale})`,
                    }}
                  >
                    <span className="absolute -inset-2 rounded-full bg-[#c4af64]/40 animate-ping" />
                    <span className="map-marker-breathe relative w-6 h-6 rounded-full bg-[#c4af64] border-2 border-[#0b0d13] shadow-lg shadow-black/60 flex items-center justify-center text-[#0b0d13] text-[13px] font-bold leading-none">
                      {c.mark ?? '→'}
                    </span>
                    <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-[11px] px-1.5 py-0.5 rounded bg-[#1a1d27] border border-[#2a2d3a] text-[#e2e4ed] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </ZoomPan>
        ) : (
          <div className="w-full h-full min-h-[420px] flex items-center justify-center text-sm text-[#6b7280]">
            Pick a zone to view its map
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-[#6b7280] flex-wrap">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={annotate}
            onChange={e => { setAnnotate(e.target.checked); setCopied(null); setTracePoints([]) }}
            className="accent-[#c4af64]"
          />
          annotate mode
        </label>
        {annotate && (
          <>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="annotate-mode"
                checked={annotateMode === 'point'}
                onChange={() => { setAnnotateMode('point'); setTracePoints([]) }}
                className="accent-[#c4af64]"
              />
              point (connection entry)
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="annotate-mode"
                checked={annotateMode === 'area'}
                onChange={() => setAnnotateMode('area')}
                className="accent-[#c4af64]"
              />
              area (NM spawn outline)
            </label>
            {annotateMode === 'area' && (
              <>
                <span>{tracePoints.length} pts</span>
                <button
                  onClick={finishTrace}
                  disabled={tracePoints.length < 3}
                  className="px-1.5 py-0.5 rounded border border-[#2a2d3a] bg-[#1a1d27] text-[#c4af64] disabled:opacity-40 enabled:hover:border-[#c4af64] enabled:cursor-pointer transition-colors"
                >
                  finish
                </button>
                <button
                  onClick={() => setTracePoints([])}
                  disabled={tracePoints.length === 0}
                  className="px-1.5 py-0.5 rounded border border-[#2a2d3a] bg-[#1a1d27] disabled:opacity-40 enabled:hover:text-[#e2e4ed] enabled:cursor-pointer transition-colors"
                >
                  clear
                </button>
              </>
            )}
          </>
        )}
        {annotate && copied && (
          <code className="text-[#c4af64] bg-[#1a1d27] border border-[#2a2d3a] rounded px-1.5 py-0.5 max-w-full overflow-x-auto">{copied}</code>
        )}
      </div>

      <p className="text-xs text-[#6b7280]">
        Maps by{' '}
        <a href="https://remapster.com" target="_blank" rel="noreferrer" className="text-[#c4af64] hover:underline">
          spalose · Remapster
        </a>
        {' '}— hand-redrawn HD remakes of the classic maps, used with credit as the artist asks.
        See the{' '}
        <a href="https://remapster.com/2022/05/27/map-pack-1/" target="_blank" rel="noreferrer" className="hover:text-[#c4af64] underline decoration-[#2a2d3a] underline-offset-2">
          pack 1
        </a>
        {' '}and{' '}
        <a href="https://remapster.com/2022/07/26/map-pack-2/" target="_blank" rel="noreferrer" className="hover:text-[#c4af64] underline decoration-[#2a2d3a] underline-offset-2">
          pack 2
        </a>
        {' '}release posts. Zones missing from the packs are filled with maps from the{' '}
        <a href="https://horizonffxi.wiki" target="_blank" rel="noreferrer" className="text-[#c4af64] hover:underline">
          HorizonXI wiki
        </a>
        {' '}(Vana&apos;diel Atlas · ffxi-atlas.com · © SQUARE ENIX).
      </p>
    </div>
  )
}
