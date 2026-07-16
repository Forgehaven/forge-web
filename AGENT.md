# ForgeHaven — Claude Context

## Always run after making changes
```bash
npm run lint      # must pass: 0 errors, 0 warnings
npm run test:run  # tsc -b && vitest run (typecheck + unit tests)
npm run build     # vite build - must pass: ✓ built
```
The chunk-size warning about ffmpeg/pdf.js is expected and not an error.

## Local dev
```bash
npm run dev       # vite dev server on :5173
```
Set `FORGE_API_URL=http://localhost:5002` in `.env.local` (at `forge-web/.env.local`) to point the Albion MM backend at a local API server.

---

## Stack
- React 19 + TypeScript + Vite + Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- React Router v7 (BrowserRouter), Redux Toolkit (IP geolocation store), SWR (weather/currency)
- `eslint-plugin-react-hooks` v7 — React 19's stricter ruleset (see ESLint patterns below)
- Deployed via GitHub Actions on push to `main` → GitHub Pages, custom domain `forgehaven.io` (CNAME at root)
- FFmpeg packages excluded from Vite `optimizeDeps` (served from `node_modules/@ffmpeg/core/dist/umd/` via `ffmpegCorePlugin` in vite.config.ts; copied to `dist/ffmpeg/` on build)

---

## Design tokens
Defined in `src/index.css` via `@theme`. **Prefer these over raw hex values:**

| Token | Value | Use |
|---|---|---|
| `forge-bg` | `#0f1117` | page background |
| `forge-surface` | `#1a1d27` | card/panel background |
| `forge-border` | `#2a2d3a` | borders, dividers |
| `forge-accent` | `#c4af64` | gold accent, CTAs |
| `forge-text` | `#e2e4ed` | primary text |
| `forge-muted` | `#6b7280` | secondary/label text |

`index.css` also defines shared utility classes: `forge-card`, `forge-label`, `forge-input`, `forge-input-mono`, `forge-btn`, `forge-btn-active`, `forge-result`, `forge-result-value`, `forge-result-label`, `forge-nav-link`, `forge-nav-link-active`, `forge-bottom-bar`.

---

## Routing

| Path | Component | Notes |
|---|---|---|
| `/` | `LandingPage` | forgehaven theme + animations |
| `/tools` | `ToolsLayout` → `ToolsHome` | sidebar shell, world clock widget |
| `/tools/<slug>` | individual tools | see `ToolsLayout.tsx` |
| `/games` | `GamesLayout` → `GamesHome` | sidebar shell, FFXI tools |
| `/games/<slug>` | individual game tools | see `GamesLayout.tsx` |
| `*` outside /tools | `NotFoundLanding` | forgehaven theme |
| `*` inside /tools | `NotFound` | plain tools 404 |

---

## Adding a new tool
1. Create component in `src/forge/tools/<section>/ToolName.tsx`
2. Add `<Route path="slug" element={<ToolName />} />` inside `src/forge/tools/ToolsLayout.tsx` (NOT `App.tsx` — the tools subtree is lazy-loaded from there)
3. Add `{ path: '/tools/slug', label: 'Tool Name' }` to the correct section in the `sections` array in `src/forge/tools/ToolsSidebar.tsx`

### Sidebar sections (in order)
Converters · Text · Media · Lookups · Encoding · Generators · Sysadmin · Network · Crypto

## Adding a new game tool
1. Create component in `src/forge/games/<game>/ToolName.tsx`
2. Add `<Route path="slug" element={<ToolName />} />` inside `src/forge/games/GamesLayout.tsx`
3. Add `{ path: '/games/slug', label: 'Tool Name' }` to the correct section in `src/forge/games/GamesSidebar.tsx`

---

## CSS architecture
- Tools section: Tailwind only
- Landing page / 404: call `useForgehavenStyles()` — injects `src/styles/forgehaven.css` as an inline `<style>` via `useLayoutEffect`, removed cleanly on unmount
- **Never** import `forgehaven.css` as a regular stylesheet — it has global `html/body` resets that conflict with Tailwind
- `forgehaven.css` is **not** in `public/` — it lives in `src/styles/` and is bundled via `?inline` import

### Conventions
- **No `pb-6` on tool outer divs** — the layout wrapper (`ForgeLayout`) already provides `px-5 py-6 md:px-8 md:py-8` padding around all content. Adding bottom padding on top causes double-spacing and unwanted scroll.
- **Use `100dvh` not `100vh`** — `dvh` accounts for iOS Safari's dynamic toolbar; `100vh` clips content on mobile.
- **`inputMode` on number inputs** — always pair `type="number"` with `inputMode="numeric"` (integers) or `inputMode="decimal"` (floats) so iOS shows the right keyboard.

---

## Shared hooks

| Hook | Purpose |
|---|---|
| `useForgehavenStyles()` | Injects forgehaven theme CSS + body classes. Call in any forgehaven-themed page. |
| `useCityFavourites()` | Pinned cities. Returns `{ favourites, toggle, isFavourite }`. localStorage: `forgetools_city_favourites` |
| `useFavourites()` | Pinned tools (path strings). Returns `{ toggle, isFavourite }`. localStorage: `forgetools_favourites` |
| `useCopy(ms?)` | `{ copy(text), copied }` — clipboard + 1.5s flash |
| `useNow(ms?)` | Returns current `Date`, updates on interval (default 1000ms) |
| `useWeather(lat, lon)` | SWR-backed current weather string, 10-min refresh |
| `useIPInfo()` | Redux-backed `{ data: IPInfo \| null }` from ipapi.co, 5-min TTL cache |

### CityFavourite type
```ts
{ id: number; name: string; country_code: string; country: string;
  admin1?: string; timezone: string; latitude?: number; longitude?: number }
```

### IPInfo type (from Redux store)
```ts
{ ip: string; city: string; country_code: string;
  latitude: number; longitude: number; timezone: string; org: string }
```

---

## Shared libs

### `src/lib/geo.ts`
```ts
GeoResult          // { id, name, country_code, country, admin1?, timezone, latitude, longitude }
flag(cc)           // country code → emoji flag
haversineKm(lat1, lon1, lat2, lon2)   // great-circle distance in km
bearingDeg(lat1, lon1, lat2, lon2)    // rhumb line bearing in degrees
formatDist(km)     // "42 km" / "1,234 km"
```
Geocoding API: `https://geocoding-api.open-meteo.com/v1/search`

### `src/lib/weather.ts`
```ts
CurrentWeather     // { temperature_2m, apparent_temperature, relative_humidity_2m,
                   //   weather_code, wind_speed_10m, wind_direction_10m,
                   //   surface_pressure, uv_index, precipitation, cloud_cover }
WMO                // Record<number, string> — WMO code → description
weatherIcon(code)  // → emoji
weatherDescription(code)
windDir(deg)       // → "N" / "NE" / etc.
fetchCurrentWeather(lat, lon)  // → Promise<CurrentWeather>
```
Weather API: `https://api.open-meteo.com/v1/forecast`

---

## Select component
```ts
import { Select } from '../../components/Select'
import type { SelectOption } from '../../components/Select'
// SelectOption = { value: string; label: string }
// Props: any react-select Props<SelectOption, false> — add isSearchable for long lists
```

---

## Key dependencies
- `@ffmpeg/ffmpeg` + `@ffmpeg/util` + `@ffmpeg/core` — video/audio processing (WASM, served via `ffmpegCorePlugin` in vite.config.ts)
- `pdfjs-dist` — PDF processing (WASM, loaded from `public/`)
- `react-image-crop` — image cropping in ImgEditor
- `sql-formatter` — SQL formatting in TextFormatter
- `bcryptjs` — bcrypt hashing
- `libphonenumber-js` — phone number lookup
- `qrcode` — QR code generation
- `jszip` — ZIP file creation (PDF to EPUB)
- `swr` — data fetching (weather, currency rates)
- `react-select` — dropdown (wrapped by `Select` component)
- `recharts` - charting library (gold price charts: AreaChart, LineChart, ResponsiveContainer)

---

## ESLint patterns (react-hooks v7 is strict)

**`react-hooks/static-components`** — components defined inside other components are an error. Define them at module level and pass props explicitly.

**`react-hooks/set-state-in-effect`** — synchronous `setState` inside `useEffect` bodies triggers this. When genuinely needed (debounced search reset, geo-init, etc.) suppress with:
```ts
setState(value) // eslint-disable-line react-hooks/set-state-in-effect
```

**`react-hooks/refs`** — reading `ref.current` during render triggers this. When intentional (e.g. scaling calculations):
```ts
// eslint-disable-next-line react-hooks/refs
const scale = ref.current ? ... : 1
```

**`react-hooks/exhaustive-deps`** — missing deps in `useEffect`. Either add the dep or suppress if intentional (e.g. `currencyList.length` instead of full array):
```ts
}, [dep]) // eslint-disable-line react-hooks/exhaustive-deps
```

---

## localStorage keys
| Key | Contents |
|---|---|
| `forgetools_favourites` | `string[]` — pinned tool paths |
| `forgetools_city_favourites` | `CityFavourite[]` — pinned cities |
| `forgetools_collapsed_sections` | `Record<string, boolean>` — collapsed sidebar sections |
| `forge_ip_v2` | Cached IPInfo + timestamp (5-min TTL) |
| `forgegames_ffxi_selectedchar_v1` | Selected registered-character id, shared by all FFXI tools |

(`forgegames_save_prefs_v1` and the `useSavePrefs` hook were removed - logged in now means synced.)

---

## Key shared components

| Component | Purpose |
|---|---|
| `ForgeLayout` | Shared shell for Tools and Games — swipe gesture, sidebar, mobile header, settings modal, content padding. Pass `sidebar`, `settings`, `bottomBar`, `title`, `homePath`, optional `headerExtra`. |
| `ConfirmButton` | Two-step confirm pattern (label → confirm/cancel). Use for destructive actions. |
| `ImportPanel` | Paste-a-code import flow with close button. Pair with `ConfirmButton` for export/import/reset controls. |

---

## Component library goal
Prefer extracting reusable UI into `src/components/`. Folder-per-concern (e.g. `Sidebar/`, `BottomBar/`) when there are 3+ related pieces. Hooks go in `src/hooks/`, not colocated with components.

---

## FFXI account sync

**Offline-first is a hard rule**: every FFXI tool works fully logged-out via localStorage.
Login is only an upgrade (cross-device sync), never a gate.

- **API client**: `forgeFetch<T>(path, init?)` in `src/lib/api.ts` is THE credentialed backend
  wrapper (envelope + 401 hook + `{detail}` normalization). `albionFetch` is now just an alias of
  it. FFXI helpers live in `src/forge/games/ffxi/api.ts`: `listCharacters` / `registerCharacter` /
  `deleteCharacter` / `getCharData` / `putCharData` / `getUserData` / `putUserData` /
  `getConquest` / `putConquest`.
- **Character registry**: users register up to **3** HorizonXI characters (server-enforced;
  HorizonXI account limit) in the account modal's FFXI section (`FfxiCharacters` in
  `LoginModal.tsx`, backed by `useFfxiCharacters`). Tools pick one via
  `ffxi/components/CharacterSelect.tsx`; selection persists in `forgegames_ffxi_selectedchar_v1`
  (`ffxi/selectedChar.ts`).
- **Sync plumbing**: `ffxi/hooks/useSyncedBlob.ts` - loads the server blob when the key
  (char id / tool) appears, debounced auto-save (1s) that flushes on unmount. Pass null
  load/save when logged out. Saves are compare-and-set: each PUT carries the blob's last
  seen `updated_at` (`base_updated_at`); a `conflict` reply means another device wrote
  first - server wins, the returned blob is fed back through `onLoaded` and the local
  write is dropped.
- **localStorage mirror**: while synced, tools keep their localStorage key as a lagged
  copy of the active character's blob (written on load and on every edit), so an offline
  reload or logout shows last-synced data. The old rule "never write localStorage while
  synced" is gone; the local key now holds whichever character was last active. Mirror
  writes are stamped with the owning character id (`..._mirrorchar_v1` keys); the
  migration banner treats local data stamped by another character as not migratable,
  and tools snapshot the pre-sync copy at banner time so Import survives later mirror
  writes.
- **Per-tool behavior** (logged in):
  - *SpellTracker*: per-character `{jobLevels, learned}` blob (`spell_tracker`), auto-sync;
    logged in shows the CharacterSelect header, logged out has NO character header at all (the
    old free-text fetch header was removed once accounts landed - local mode is checkboxes +
    localStorage only). Migration banner offers a one-click upload of this browser's data when
    the character's server blob is empty - declining ("No thanks") is remembered per character
    in `forgegames_ffxi_spelltracker_nosync_v1`.
  - *FactionConquest* (formerly TeleportCost; route `ffxi/faction-conquest`, old
    `ffxi/teleport-cost` redirects; localStorage value keeps the old `teleportcost` slug): the
    conquest `owners` map is **community-shared** - public `GET /conquest` for everyone (even
    logged out), debounced `PUT` for logged-in edits. The backend blanks it weekly at Sunday
    14:59:59 UTC. Logged in: CharacterSelect header, nation mapped from the char API's 0/1/2 to
    the tool's 1-4 ids, and the Reset Conquest button is HIDDEN (it would blank the shared map
    for everyone). Logged out: a Home Nation picker (Bastok/Windurst/San d'Oria only - Beastmen
    own outposts but are not pickable; unselected nations grey out) + reset. The old free-text
    fetch header (CharacterHeader component) was deleted app-wide; NationMeta now lives in
    `ffxi/nations.ts`. Standings strip ranks the 3 nations by owned-territory count (ties share
    a place); Signet max = character rank + nation place (era rule), shown when both known.
    Movalpolos and Tu'Lia are conquest regions WITHOUT outposts: owner-toggle-only rows
    (`NO_OUTPOST_REGIONS` in `data/zones.ts`) that feed the standings but show no teleport
    costs. Lumoria/Promyvion have no conquest influence - absent.
  - *ClammingTracker*: **account-wide** `{overrides, exceptions, disabledRec}` blob via
    `/user-data/clamming` (per user, NO character dropdown), **manual save** - a gold flashing
    Save button appears when local state differs from the server baseline. Default AH prices were
    removed from `data/items.ts`; prices are user-entered.
  - *VanaTimers*: no storage, no auth - pure client math in `data/vanaTime.ts` (ported from
    go-vanatime, same epoch as LandSandBoat's `VTIME_BASEDATE`; schedule minutes from
    horizonffxi.wiki pages). Vana clock + day element, SVG moon, tally countdown (reuses
    `conquest.ts`), airship/ferry/Manaclipper/barge departures (flash <3 earth min), RSE
    rotation (pyogenes algorithm), lunar events, day-locked consumables (`DAY_ITEMS`);
    ticks via `useNow(250)`. Weather is a server-side random roll - NOT computable
    client-side; footer links the wiki's Special:WeatherForecast instead. Departure alert
    bells: clicking an unarmed bell opens a cursor-anchored lead picker (1m/2m/5m/15m/1h,
    per-alarm lead - no global lead), armed click disarms; one-shot auto-disarm on fire;
    sound-type bars (soft/normal/loud - NO preview on select; the bell icon is the test
    button), repeat toggle (rings every 3s behind a Dismiss modal), volume slider (master
    gain), all persisted in the same prefs blob (`armed: {key, lead}[]`; legacy string[]
    + alertLead migrates on load); sound is a synthesized Web Audio chime
    (`src/lib/chime.ts`, no assets, no Notification API - AudioContext resumed on gesture).
    Crafting guilds section (`GUILDS`/`guildStatus` in vanaTime.ts): hours + weekly holiday
    per guild (Alchemists' holiday is Lightsday - the wiki page has a copy-paste typo),
    open/closed countdowns, armable "opens" bells. Alert targets beyond departures:
    Full/New Moon, Sunrise/Sunset (`dayNight`, day = 06:00-18:00), Conquest tally, RSE
    week change (+ per-race keys), and `TIMED_ITEMS` (`itemActivations` - day/moon-gated
    items sorted active-first then next-to-activate, notes in InfoTips). `buildAlertTargets`
    Clock ticks via a rAF `TickingClock` (Vana second = 40ms real) with fixed-width digit
    slots (no jitter); weekday shows in-game element icons (`data/elements/*Icon.png`,
    pulled from horizonffxi.wiki like the nation icons). The ALARM ENGINE is NOT in this
    page: `src/components/alarms/AlarmProvider.tsx` is a generic /games-wide notification
    engine (mounted in GamesLayout, sources map prop, keys namespaced `sourceId:name`,
    prefs in `forgegames_alarms_v1` with migration from the old VanaTimers blob); FFXI's
    armable events live in `ffxi/alarms.ts` (`ffxiAlarmTargets`); pages consume via
    `useAlarmSource('ffxi')` + `AlertBell`. Floating top-right widget (collapsible, starts
    collapsed on mobile) lists armed alarms with lead + countdown + disarm.
  - *LockoutTracker* (route `ffxi/lockouts`): per-character `{dynamis: number[], limbus}` blob
    (`lockout_tracker`), auto-sync + localStorage mirror (mirror includes `charName` and is
    read by `ffxi/alarms.ts` so "Dynamis ready"/"Limbus ready" bells ring on any /games page).
    Both lockouts are 72 Earth hours; Dynamis counts from hourglass trade (Horizon also caps
    two entries per conquest tally - shown as n/2), Limbus from Cosmo-Cleanse PURCHASE
    (Horizon 1.1 change).
  - *ExpCamps* (route `ffxi/exp-camps`): filterable EXP camp table (241 rows) generated from
    horizonffxi.wiki/EXP_Camps by `scratch/expcamps-gen.mjs` into `ExpCamps/camps.ts` - do not
    hand-edit rows, rerun the generator (it parses each wiki table's own header row for column
    roles, converts `{{Location Tooltip}}` grid cells to 1024px map space via the measured
    transform `65 + (idx-1)*61.7`, and resolves zone names to map ids with slug fixups; bare
    `(G-6)` refs are trusted only in the Mana/Undead Burn sections). Camp `type` comes from the
    wiki section (standard/sky/merit/manaburn/undeadburn/unverified; alpha+shatter are empty
    upstream). Filters: level (range containment; merit = 75+), type, text search. Zone cells
    Link into the Interactive Map with `state: { flashCamp: id }`. `levelLabel` lives in the
    generated camps.ts and is shared with the map layer. Star column favourites camps
    (`forgegames_ffxi_expcamps_v1` `{favs: id[]}`); favourites pin above the rest through any
    column sort via DataTable's generic `pinned` prop. When logged in, favourites sync to the
    `exp_camps` per-user tool blob (useSyncedBlob + get/putUserData, union merge on load -
    FriendViewer idiom; offline-first, localStorage stays the source of truth). Backend
    allow-list lives in forge-api `src/endpoints/game/ffxi/user_data.py`.
  - *InteractiveMap* (route `ffxi/map`): 319 zone maps as 1024px WebP in `public/ffxi_maps/`
    (~34MB, NOT bundled - static copies, one lazy image per viewed zone). 280 are Remapster's
    hand-redrawn maps (spalose) used per the artist's credit+linkback terms - the page footer
    credit is REQUIRED, keep it. 32 zones missing from the packs (Kazham, Fei'Yin, Movalpolos,
    Altepa, sky, etc.) are filled with horizonffxi.wiki images (Vana'diel Atlas / ffxi-atlas.com
    art, credited in the same footer), converted via
    `ffmpeg -vf "scale=1024:1024:force_original_aspect_ratio=decrease,pad=1024:1024:..."`.
    Index in `InteractiveMap/mapIds.ts` (generated from the directory listing; regenerate if
    maps change) + name beautifier in `maps.ts` (FIXUPS for apostrophes). Viewer is the
    dependency-free `components/ZoomPan.tsx` (wheel zoom to cursor, drag pan, dblclick reset)
    - no Leaflet; markers = positioned divs on the same transform. Non-Horizon content
    (Abyssea/WotG/SoA/Escha/Dynamis-[D]) pruned from the packs. Last-viewed zone persists in
    `forgegames_ffxi_map_v1`; teleport quick-link chips (HOLLA/DEM/MEA/ALTEP/YHOAT/VAHZL) jump
    straight to crystal zones. Clickable exits live in `InteractiveMap/connections.ts`
    (~965 links over 253 zones, 1024px coords), rebuilt by a full-map marker sweep: `mark`
    field = the number/letter badge printed on the map (numbered dungeon entrances route to
    the specific floor owning that number; letter badges pair floors within a zone family).
    Batallia/Eldieme/Purgonorgo blocks are hand-verified seeds - keep them authoritative on
    regeneration. Small one-off additions: use the page's annotate mode (click copies a
    paste-ready entry). Exit trigger positions are NOT in open server data (LSB/ASB keep them
    client-side). Still unlinked: zones with no map anywhere (BC arenas, Mog House residential,
    salvage/assault instances, Qu'Bia Arena, Talacca Cove, Hazhalm, Monarch Linn, Boneyard
    Gully, Lebros). The zone id lives in the URL (`ffxi/map/:zoneId`) so views are shareable;
    bare `/map` redirects to the last-viewed zone. Header chips: city row (Sandy/Bastok/
    Windy/Jeuno, nation colors) + teleport row (HOLLA..VAHZL) + NM toggle. NM spawn areas
    live in `InteractiveMap/nms.ts` (`NM_SPAWNS`: map id -> areas in 1024px space, sourced
    from wiki spawn maps via agent sweeps; ~550 areas over 133 zones; NMs without wiki
    position maps - battlefield/Dynamis/Horizon-custom ones - are intentionally absent).
    Entries with `unmarked: true` (no known position - absent from the wiki spawn image or
    on a floor we don't ship) are legend-only: wiki link + "unmarked" badge, no shape.
    Areas render in one SVG layer: red translucent circle, or polygon when the entry has
    `points: [[x,y],...]`; big areas render first so small camps win clicks; strokes use
    non-scaling-stroke. Click opens the NM's wiki page. A collapsible legend card (top-left
    over the map, `legend` flag in the map storage key) lists the WHOLE zone's NMs across
    every floor (maps grouped by id base, trailing `_N` = floor): rows for NMs on another
    floor get a muted `map N` badge and jump to that floor on first click (flash highlight;
    wiki opens on the next click / when already on the right floor; ctrl/meta/shift-click
    always goes to the wiki), marked rows sort above unmarked, hovering a row
    or a shape highlights via shared state. Annotate mode has point (connection entry) and
    area sub-modes; area clicks trace a live outline, "finish" copies a paste-ready NmSpawn
    with `points` (centroid x/y, r 0). nms.ts is safe to hand-edit: the merge script parses
    the existing file and preserves `points` + locally added entries on regeneration. A second
    header Select ("Search NMs…", aria-label `Search NMs`) searches all NMs globally via the
    module-scope `NM_OPTIONS` index (value `mapId|name`, split at first `|`); picking jumps to
    the zone, forces the NM layer on, and pulse-highlights the shape(s) for 3s (`flashNm`,
    cleared by timeout or map pointerdown). An EXP toggle (green, beside NM, `exp` flag in the
    same storage key) draws EXP camp dots from `ExpCamps/camps.ts` spots (constant-size green
    dots as positioned divs like connection markers - NOT the SVG layer, native svg <title>
    tooltips proved unreliable - with an instant styled group-hover label + aria-label
    `Lv <levels> · <description>`); arriving with
    router state `{ flashCamp: id }` from the EXP Camps table seeds the layer on and pulses
    that camp's dots (`flashCamp`, lazy-init from `useLocation().state` - nav state only
    exists at mount since the table is a separate route). Toggle + last zone persist in
    `forgegames_ffxi_map_v1` `{last, nm}`. ZoomPan takes `contentSize`/`resetKey` to center
    content on load and re-center per zone; its pointer-capture skips `button, a` children.
  - *FriendViewer*: per-user `{names, starred}` blob (`friend_viewer`), auto-sync; server ∪ local
    name merge on load. Job/rank snapshots stay localStorage-only, each stamped with `fetchedAt`;
    an all-zero jobs fetch (friend went `/anon`) keeps the last good snapshot and shows an
    "anon · <date>" tag with the last-fetched time.
  - *KeyItemTracker*: per-character `{collected}` blob (`key_item_tracker`), auto-sync,
    SpellTracker-style shell (category tabs Maps/Gate Crystals/Transportation/Other, search
    spans ALL categories, hide-collected default on, migration banner with
    `forgegames_ffxi_keyitems_nosync_v1`). Data: `data/keyItems.ts`, GENERATED from the
    horizonffxi.wiki MediaWiki API (Category:Key_Items, one call, no pagination) unioned with
    the /Maps page (category tagging misses ~23 maps); name doubles as id + wiki slug.
  - *QuestTracker*: per-character `{eco, highwind}` blob (`quest_tracker`) of completion
    timestamps, auto-sync. Weekly state is DERIVED against `lastConquestReset()`
    (`ffxi/conquest.ts`, shared with FactionConquest) - stale timestamps read as "not done", never
    cleaned up by writes. Eco-Warrior rotation (all three nations before repeats, one per week)
    restarts in-display once all three are done and stale. Wiki data from horizonffxi.wiki.
- **Shared FFXI helpers**: `ffxi/conquest.ts` (tally clock), `ffxi/nations.ts` (char-API 0-2
  `NationMeta` map; FactionConquest keeps its own 1-4 map with Beastmen), `ffxi/hooks/useCharRank.ts`
  (live nation-rank lookup shown in the character headers).

## Albion - Universal Crafting Tools

The Albion tools are **price-free crafting calculators**: the user enters their own market prices
and the tools compute craft cost, margin, and the recipe tree. There is **no live market feed** -
the old Market Manager (its live-price / ticker WebSockets, Best Value, Guild Data, category
pages, and Market Fixing) was removed; that product now lives at runningdawn.com.

### Folder structure (`src/forge/games/albion/`)
Each visual section is its own folder; everything cross-section sits under `shared/`:
```
albion/
  Splash/         AlbionSplash.tsx + albion-logo.png  (the /games/albion landing)
  ItemIndex/      ItemIndexPage, CraftFilters, craftRows, CraftTable  (search + filter table)
  ItemDetail/     ItemDetailPage  (per-item dashboard: prices, craft tree, margin)
  Favourites/     FavouritesPage  (Item Index scoped to starred items)
  Gold/           GoldPricePage + chartTicks, indicators, recommendation, useGoldPrice
  CraftSettings/  CraftSettingsPanel  (a modal opened from the sidebar, NOT a route)
  shared/
    api.ts        albionFetch - alias of forgeFetch (the credentialed backend wrapper)
    constants.ts  CITIES / QUALITIES / STATION_TYPES / CITY_BONUSES
    ItemIcon.tsx  <ItemIcon> (forge-api proxy + service-worker cached, see below)
    crafting/     craft engine: craftCost, craftEconomics, craftingApi, itemMeta,
                  marketFormat, premium, RecipeTreeCard, types, useAllItems, useItemRecipes
    prices/       userStore.ts - the user's entered prices (localStorage + server sync)
    settings/     craftSettings.ts (per-user prefs store), api.ts (user-blob GET/PUT), sync.ts
```
Rule going forward: a routed page = its own folder; anything imported by 2+ sections lives in
`shared/` (never a loose file at the `albion/` root).

### Routes (`src/forge/games/GamesLayout.tsx`), all under `/games/albion/`
- `` (index) - `AlbionSplash`
- `item-index` - `ItemIndexPage`
- `item/:itemId` - `ItemDetailPage`
- `favourites` - `FavouritesPage`
- `gold` - `GoldPricePage`

Craft Settings is a **modal** (sidebar button in `GamesSidebar.tsx`), not a route. Tab titles
live in `src/config/sections.ts` (`Albion - <Page>`).

### Auth (Discord OAuth) - app-wide, optional
- `DISCORD_CLIENT_ID = '1519734763139633354'` hardcoded in `src/config/apiUrls.ts` (public value).
- `FORGE_API_URL` via Vite `define.__API_URL__` (falls back to `https://api.forgehaven.io`; set
  `FORGE_API_URL=http://localhost:5002` in `.env.local` for dev).
- `AuthProvider` at the app root (`App.tsx`); `useAuth` / `AuthContext` in `src/auth/authContext.ts`.
  A Login button in every sidebar footer opens `src/auth/LoginModal.tsx`.
- **Login is OPTIONAL and the Albion tools are NOT role-gated** - they work fully logged out on
  localStorage. Login only adds cross-device sync of your prices + craft settings.
- Flow: `login()` -> Discord OAuth -> `/auth/callback?code=` -> POST `{code}` -> HttpOnly
  `forge_session` cookie (1h) -> redirect to stored `auth_return_path` -> `/auth/me` on mount.
- Logout POSTs `/auth/logout`, sets `localStorage.forge_logged_out`, reloads.
- 401 handler: `albionFetch` (`shared/api.ts`) calls `notifyUnauthenticated()`; `AuthProvider`
  registers the cleanup via `setOnUnauthenticated()`. It also normalizes FastAPI `{detail}` error
  bodies into the `{status, message}` envelope.

### Per-user prices + craft settings (sync)
- **Prices**: `shared/prices/userStore.ts` - the user's entered buy/sell prices, keyed by item.
- **Craft settings**: `shared/settings/craftSettings.ts` - `UserCraftSettings` (premium, focus,
  defaultCity, matSource, craftStrategy, per-city station fees). A localStorage-first store exposed
  via a `useSyncExternalStore` hook (`useUserCraftSettings`).
- **Sync**: `shared/settings/sync.ts` (`useAlbionUserSync`, mounted once in `GamesLayout`) loads the
  server blobs on login and debounced-saves local edits back through `shared/settings/api.ts`
  (`GET/PUT /game/albion/user/{prices|craft-settings}`). Logged out it does nothing.
- The community-shared `GET /game/albion/craft-settings` is read by `craftEconomics.ts` for base
  defaults only; per-user edits never write to it.

### Craft economics (`shared/crafting/craftEconomics.ts`)
- Bonus-aware return rates per item+city via `returnRateFor(id, city, focus)` - `itemEcon(id)`
  classifies the archetype from the UniqueName to a crafting station + specialty city; unmatched
  ids fall back to conservative base rates.
- Premium sales tax (4%/8%) via `salesTaxRate`; flat station fees per 100 nutrition via
  `userStationFee`. `craftCost.ts` takes a `ReturnRateOf` callable so bonus rates hit exactly their
  specialty craft lines.

### Item Detail (`ItemDetail/ItemDetailPage.tsx`)
Per-item dashboard: tier (T1-T8) + enchant (.0-.4) variant switchers that rewrite the item id
(`shared/crafting/itemMeta.ts`), a per-quality price strip (resources have no quality -
`isResource()`), a Gold-style history chart, and the **Crafting Tree card**
(`shared/crafting/RecipeTreeCard.tsx`) with per-node buy / craft / upgrade / transmute modes and an
aggregated shopping list. Acquisition per node is `min(buy, craft, upgrade)`.

### Item icons (`src/utils/albionIcons.ts` + `shared/ItemIcon.tsx`)
`itemIconUrl(uniqueName, size, quality?)` builds `{forgeAPI}/game/albion/icon/{id}` (forge-api
proxy, 7-day immutable cache). The icon service worker (`public/icon-sw.js`, registered in
`main.tsx`) pins each icon in the Cache API (cache-first, `albion-icons-v1`, 4000-entry cap). The
proxy is same-origin so responses are non-opaque for the SW. `<ItemIcon uniqueName size quality? />`
is `loading="lazy" decoding="async" crossOrigin="anonymous"`. Table icons omit `quality` on purpose
(a quality-filter flip must not re-download every icon).

### Recipes are fetched in batch
`fetchRecipes` (`shared/crafting/craftingApi.ts`) chunks ids 50-per-request against
`GET /game/albion/recipes/{ids}`. `useItemRecipes`' module cache dedupes across pages.

### DataTable (`src/components/DataTable.tsx`)
Generic sortable table with sticky headers, footer, and the row index passed to `render` as the
second arg:
```tsx
<DataTable columns={[
  { key: 'name', label: 'Name', render: (row, i) => <span>{row.name}</span> },
]} data={items} />
```
`fill` prop: the table scrolls inside itself (`max-h-full overflow-auto` container + `sticky top-0`
header cells); the parent must bound the height (page div `h-full flex flex-col gap-4`, table
wrapped in `flex-1 min-h-0`).
