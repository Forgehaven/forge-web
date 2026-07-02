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
  load/save when logged out.
- **Per-tool behavior** (logged in):
  - *SpellTracker*: per-character `{jobLevels, learned}` blob (`spell_tracker`), auto-sync;
    logged in shows the CharacterSelect header, logged out has NO character header at all (the
    old free-text fetch header was removed once accounts landed - local mode is checkboxes +
    localStorage only). Migration banner offers a one-click upload of this browser's data when
    the character's server blob is empty - declining ("No thanks") is remembered per character
    in `forgegames_ffxi_spelltracker_nosync_v1`.
  - *TeleportCost*: the conquest `owners` map is **community-shared** - public `GET /conquest`
    for everyone (even logged out), debounced `PUT` for logged-in edits. The backend blanks it
    weekly at Sunday 14:59:59 UTC. Logged in: CharacterSelect header, nation mapped from the char
    API's 0/1/2 to the tool's 1-4 ids, and the Reset Conquest button is HIDDEN (it would blank the
    shared map for everyone). Logged out: a Home Nation picker (Bastok/Windurst/San d'Oria only -
    Beastmen own outposts but are not pickable; unselected nations grey out) + reset. The old
    free-text fetch header (CharacterHeader component) was deleted app-wide; NationMeta now
    lives in `ffxi/nations.ts`.
  - *ClammingTracker*: **account-wide** `{overrides, exceptions, disabledRec}` blob via
    `/user-data/clamming` (per user, NO character dropdown), **manual save** - a gold flashing
    Save button appears when local state differs from the server baseline. Default AH prices were
    removed from `data/items.ts`; prices are user-entered.
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
    (`ffxi/conquest.ts`, shared with TeleportCost) - stale timestamps read as "not done", never
    cleaned up by writes. Eco-Warrior rotation (all three nations before repeats, one per week)
    restarts in-display once all three are done and stale. Wiki data from horizonffxi.wiki.
- **Shared FFXI helpers**: `ffxi/conquest.ts` (tally clock), `ffxi/nations.ts` (char-API 0-2
  `NationMeta` map; TeleportCost keeps its own 1-4 map with Beastmen), `ffxi/hooks/useCharRank.ts`
  (live nation-rank lookup shown in the character headers).

## Albion Market Manager (AOMM)

### Auth (Discord OAuth)

- **`DISCORD_CLIENT_ID = '1519734763139633354'`** hardcoded in `src/config/apiUrls.ts` (public value, no env var needed)
- **`FORGE_API_URL`** via Vite `define.__API_URL__` - reads `FORGE_API_URL` env var, falls back to `https://api.forgehaven.io`. Set `FORGE_API_URL=http://localhost:5002` in `.env.local` for dev
- **Login is site-wide.** `AuthProvider` is mounted at the app root in `App.tsx` (covers landing / tools / games). `useAuth` + `AuthContext` + types live in `src/auth/authContext.ts`; the provider in `src/auth/AuthProvider.tsx`. A Login button sits in every sidebar footer (above Settings) and opens `src/auth/LoginModal.tsx` (account, per-service guild/role status, logout, login-benefits list + an optional-login note). Login is OPTIONAL - non-login tools/trackers keep working via localStorage; only role-gated services (Albion MM) require it.
- Flow: `login()` (clears any stale `forge_logged_out` flag) → Discord OAuth → `/auth/callback?code=` → POST `{ code }` to backend (backend exchanges against its configured `DISCORD_REDIRECT_URI`) → cookie `forge_session` (HttpOnly, 1h) → redirect back to stored `auth_return_path` → `/auth/me` check on mount
- Logout: POSTs `/auth/logout` (the cookie is HttpOnly - only the backend can delete it), clears user state, sets `localStorage.forge_logged_out = true`, reloads the current page
- 401 handler: `albionFetch` (`src/forge/games/albion/api.ts`) calls `notifyUnauthenticated()` from `src/auth/unauthorized.ts`; `AuthProvider` registers the cleanup handler via `setOnUnauthenticated()`. `albionFetch` also normalizes FastAPI `{detail}` error bodies (e.g. 403 from role guards) into the `{status, message}` envelope
- `AuthCallback` page (`src/pages/AuthCallback.tsx`): route `/auth/callback` mounted in `App.tsx` (not `GamesLayout`). Uses `initiatedRef` to prevent StrictMode double-firing the token exchange
- `user.avatar` is a full CDN URL from the backend - use it verbatim as `img src`, never rebuild it from a hash

### Auth types (`src/auth/authContext.ts`)
```ts
interface GuildStatus { is_member: boolean; roles: Record<string, boolean> }
interface AuthUser {
  id: string; discord_id: string; username: string;
  avatar: string | null;
  guilds: Record<string, GuildStatus>;   // keyed by slug: running_dawn, forgehaven
}
interface AuthContextType {
  user: AuthUser | null; loading: boolean; isAuthenticated: boolean;
  login: () => void; logout: () => Promise<void>; clearAuth: () => void;
}
const MM_GUILD = 'running_dawn'
function mmAccess(user: AuthUser | null): { member: boolean; role: boolean }
```
`mmAccess()` is the ONLY place that encodes the MM guild slug + `albion_guild` role name. Always gate through it, never poke `user.guilds` directly in components.

### Auth gating convention
- **Guild Data** - requires `isAuthenticated` and `mmAccess(user)` → `{ member: true, role: true }`
- **Gold Price, Favourites, Best Value, all category pages** - require `isAuthenticated` only
- Denied users still get the MM sidebar but without Guild Data link. The shared footer Login button turns red on Albion MM pages when logged in but `mmAccess` is missing member or role
- `LoginModal` renders a generic per-guild access list from `user.guilds` (membership chip + a chip per named role, slugs Title-Cased)

### Layout Override pattern
MM pages swap the default Games sidebar/bottom bar with MM-specific ones at runtime:

```tsx
const { setSidebar, setBottomBar } = useLayoutOverride()
useEffect(() => {
  if (isAuthenticated) {
    setSidebar(MarketManagerSidebar)
    setBottomBar(MarketManagerBottomBar)
  } else {
    setSidebar(null); setBottomBar(null)
  }
  return () => { setSidebar(null); setBottomBar(null) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isAuthenticated])
```

`LayoutOverrideProvider` wraps the routes in `GamesLayout.tsx`. `ForgeLayout` reads `useLayoutOverrideValue()` to pick which sidebar/bottom bar to render. Default sidebar/bottom bar show for non-MM routes.

### API client (`src/forge/games/albion/api.ts`)
```ts
albionFetch(path, options?)  // wraps fetch(), auto-attaches FORGE_API_URL prefix,
                             // triggers 401 cleanup (logout + cookie delete) on 401
```
Use for all Albion API calls. Never call `fetch()` directly against the backend.

### Date utility (`src/utils/date.ts`)
```ts
utcDate(ts: string): Date  // appends 'Z' if missing, then new Date(ts + 'Z')
```
Gold timestamps come from the backend as UTC strings without `Z` suffix. Always parse with `utcDate()` before displaying.

### File structure (`src/forge/games/albion/MarketManager/`)

```
MarketManager/
  index.tsx                     ← re-exports MarketManager
  MarketManager.tsx             ← splash page, sets sidebar/bottom bar
  MarketManagerSidebar.tsx      ← full nav: top links + Market Fixing + sections generated from marketCategories.ts;
                                 collapse state persisted via useSidebarCollapse(STORAGE_KEYS.albionMMCollapsed)
  MarketManagerBottomBar.tsx    ← <BottomBar><TickerTape /></BottomBar>
  TickerTape.tsx                ← marquee ticker (shows a Q{n} quality tag per entry)
  useTickerWS.ts                ← WebSocket hook for ticker data
  usePricesWS.ts                ← WebSocket hook for the live price feed (see Live prices below)
  chartTicks.ts                 ← shared x-axis tick generator (gold + item detail charts)
  marketCategories.ts           ← single source of truth for category sections/slugs (routes, sidebar, titles)
  CategoryPage.tsx              ← REAL config-driven table page for every category slug
  CollapsibleSection.tsx        ← collapsible sidebar section; uncontrolled or controlled (open + onToggle)
  PlaceholderPage.tsx           ← centered title + "coming soon" (Market Fixing pages still use it)
  FavouritesPage.tsx            ← favourites table (localStorage) via useEnrichedRows
  BestValuePage.tsx             ← REAL top-50 craft-and-resell returns (server-computed)
  GuildData/  Gold/             (as before; GoldPricePage imports chartTicks from ../chartTicks)
  MarketFixing/                 ← 4 placeholder pages (still out of scope)
  ItemIndex/                    ← search page + ALL shared item-table machinery:
    ItemIndexPage, ItemTable, ItemFilters, PercentField, itemColumns (buildItemColumns),
    CraftBreakdownCell, craftCost.ts (analyzeCraft/profit/shoppingList/collectRecipeIds),
    itemMeta.ts (parseTier/parseEnchant/withTier/withEnchant), types.ts,
    albionItemsApi.ts (searchItems/fetchCategoryItems/fetchItemPrices/fetchItemHistory/
    fetchBestValue/fetchRecipes), useItemSearch, useCategoryItems, useItemPrices
    (+ useLiveItemPrices), useItemRecipes, useEnrichedRows
  ItemDetail/                   ← ItemDetailPanel (self-contained), ItemDetailPage, ComparePage,
    useItemHistory, useItemName
```

### Routes (all in `src/forge/games/GamesLayout.tsx`)

All under `/games/albion/market-manager/`:
- `gold` - `GoldPricePage`
- `item-index` - `ItemIndexPage`
- `guild-data` - `GuildDataPage`
- `favourites` - `FavouritesPage`
- `best-value` - `BestValuePage`
- `item/:itemId?quality=&city=` - `ItemDetailPage` (shareable per-item dashboard)
- `compare?a=&qa=&b=&qb=&city=` - `ComparePage` (two ItemDetailPanels side by side, desktop only)
- `market-fixing/x-city-arbitrage`, `velocity-flip`, `route-risk-reward`, `bm-volume-predict` (placeholders)
- every category slug in `marketCategories.ts` → `<CategoryPage slug>` (routes generated in a loop; adding
  a category is a one-line edit in `marketCategories.ts`)

### Tab titles (`src/config/sections.ts`)
Every route listed above maps to `'AOMM - <Page Name>'`. Title is set via inline script in `vite.config.ts` `headScripts()` plugin. The full path prefix must match exactly.

### Gold Price page (`src/forge/games/albion/MarketManager/Gold/GoldPricePage.tsx`)

- Fetches from `GET /game/albion/gold/stats` via `useGoldPrice` hook (5-min polling)
- Returns pre-computed payload: `current`, `history` (oldest-first), `summary`, `indicators`
- No client-side calculations - all stats from backend
- `history` array is oldest-first. `history.slice(-period).reverse()` for newest-first chart display
- Charts use **Recharts** (v3.9.0): `AreaChart` for price + SMA(7)/SMA(25) lines, `LineChart` for RSI(14) sub-panel
- Timestamps are UTC without `Z` suffix. Parsed via `utcDate()` helper (`src/utils/date.ts`) that appends `Z`
- Displayed in user's local timezone
- X-axis ticks: 24H view shows `HH:mm` at 6hr intervals, 7D view shows `Mon DD` at local midnight. Computed via `chartTicks()` function
- RSI tooltip shows date + time
- Period toggle: 24H / 7D
- Collapsible Recent Prices `DataTable`
- Help modal with glossary of market terms

### Guild Data page (`src/forge/games/albion/MarketManager/GuildData/GuildRoster.tsx`)

- Total Fame = PvE + Gathering.All + Crafting + KillFame
- Double-sorted by LastLogin day (desc) then Total Fame (desc). Pre-sorted outside `DataTable`, no column sort triangle initially
- "Latest API snapshot" notice with timestamp
- `#` row numbering column (dark muted, no header, `w-8 text-center`)
- Zone filter: PvE/Gathering/Crafting columns show selected zone data. Non-applicable zones show `-`

### Ticker (`src/forge/games/albion/MarketManager/TickerTape.tsx` + `useTickerWS.ts`)

- WebSocket connects to `{API_URLS.forgeAPI}/game/albion/ws/ticker` (protocol swapped to ws:// or wss:// automatically)
- 500ms initial delay to avoid page-load HMR race
- Exponential reconnect backoff: `Math.min(2000 * 2^attempts, 30000)`
- Items stored in `Record<string, TickerItem>` (plain object map) keyed by `item_id_city_quality`
- Two message types: `ticker_snapshot` (full replace) and `ticker_update` (merge)
- `TickerItem`: `{ item_id, name, tier, city, quality, price, change, change_pct }`
- Display: CSS marquee (`@keyframes marquee`, `--animate-marquee` in `src/index.css`). Dynamic duration computed via `useLayoutEffect`: `animationDuration = scrollWidth / 2 / 100` (targets 100px/s visual speed)
- Items shown in backend arrival order (no sort). Backend controls which/how many items
- Item names shortened: strips `"'s "` prefix (e.g. "Adept's Bag" → "Bag")
- Each entry shows a muted `Q{n}` quality tag after the tier (poller polls qualities 1-5)
- Empty state: shows "waiting for ticker data" with animated typing dots (up to 8, resetting)

### Category pages (`CategoryPage.tsx`)
- One component behind every `marketCategories.ts` slug. Items from `GET /game/albion/items/by-category/{slug}`
  via `useCategoryItems` (module-scope cache per slug - membership is static)
- Client-side name filter over the loaded list (no server round-trip) + `ItemFilters`
  (tier/enchant/quality/location) + Return%/Tax% `PercentField`s
- Table pipeline identical to Item Index: `useEnrichedRows` → `buildItemColumns` → `ItemTable`;
  item names link to the detail route

### Craft cost columns (`itemColumns.tsx` / `craftCost.ts`)
- Two columns when `showCraft`: **Craft (base)** = `fullBuy` (top-level mats at market, no
  sub-crafting) and **Craft (optimized)** = `optimal` with the hover breakdown
- Breakdowns show BOTH lists (base materials + optimized materials); every material line is
  `{count}× {tierLabel(id)} {name}` - names ride the recipe payload (server-annotated), tier
  labels via `tierLabel()` in itemMeta.ts. Detail header prefers `recipe.name` over the
  search-based `useItemName` fallback
- `craftCost.ts` acquisition is three-way per node: `min(buy, craft, upgrade)`. `upgrade` =
  transmute from the enchant level below (RecipeNode.upgrade: `{ from, materials }`, materials
  are runes/souls/relics at market, NOT return-rate adjusted). Breakdown modes: buy (gray),
  craft (blue), upgrade (purple)
- RecipeNode also carries `silver` (flat crafting fee - resource transmutes) and `amount`
  (batch size - potions craft 5, meals 10); craft cost = `(silver + Σ children) / amount`
- `shoppingList(node, priceOf, rr)` walks the optimal path and returns the market buys for ONE
  unit (+ total silver fees); the detail page multiplies by quantity and ceils

### Item Detail + Compare (`ItemDetail/`)
- `ItemDetailPanel` is fully self-contained (props: itemId/quality/city/onItemId/onQuality) -
  rendered one-up by `ItemDetailPage` (URL-driven) and two-up by `ComparePage`
- Variant switchers: tier T1-T8 + enchant .0-.4 rewrite the item id via `withTier`/`withEnchant`
  (`itemMeta.ts`; resources use the `_LEVELn@n` form, gear plain `@n`)
- Per-quality price strip (5 clickable cards = current sell per quality; click selects the
  quality the stat cards use)
- History chart: `GET /prices/history/{id}?qualities=1,2,3,4,5` via `useItemHistory` (5-min
  poll), Recharts LineChart with ONE LINE PER QUALITY, periods 24H/7D (time-scale 1) and 30D
  (time-scale 24); window anchored to the newest data point, not the wall clock
- **Crafting Tree card** (`RecipeTreeCard.tsx`, bottom of the panel - it owns the qty state and
  replaced the old standalone Shopping List card): nested flowchart of the recipe with
  per-node counts (return-rate amortized, ceil for display), icons, and mode badges (buy gray /
  craft blue / upgrade purple / **transmute orange** - a recipe with a flat silver fee is the
  transmutator, recognized via `isTransmute`, and NEVER expanded in full-tree mode). Toggle
  **Optimized** (expands only nodes where craft/transmute/upgrade beats buying; buy leaves
  collapse with market subtotals) vs **Full tree** (refines every refinable node down to raw).
  To the right: the **aggregated shopping list** - duplicates across branches summed - from
  `shoppingList` (optimized) or `shoppingListFullCraft` (full; transmutes stay buys), scaled by
  qty with silver fees + grand total. Uses `bestMode()` (exported from craftCost.ts)

### Best Value page (`BestValuePage.tsx`)
- `GET /game/albion/best-value?premium=` via `fetchBestValue(loadPremium())` - no filters on the
  page; rows are (item, city) pairs across EVERY city, top 50 overall by return %, with a City
  column and `rowKey = item_id|city` (same item can appear once per city)
- ALL math server-side: sales tax from the premium flag (4%/8%), flat station fees + bonus-aware
  return rates from the shared craft settings/constants; mats priced at Normal quality per city
- Refetches on every `price_changes` WS frame (cheap - server result is in-memory)

### Craft Settings page (`CraftSettingsPage.tsx` + `premium.ts`)
- Sidebar link below Best Value. Banner: station fees are GLOBAL (shared blob via
  `GET/PUT /game/albion/craft-settings`, FFXI-conquest pattern) so the guild keeps them current
- Station-fee grid: rows = `STATION_TYPES` (constants.ts: forge/hunters_lodge/mages_tower/
  toolmaker/alchemists_lab/cook/refining), columns = cities, FLAT silver per craft
- City bonus table is static display data (`CITY_BONUSES` in constants.ts) with the fixed
  return rates in the headers: refining specialty 36.7%, crafting specialty 24.8%, base 15.2%
- "I have premium" (gold crown SVG) + "I craft with focus" toggles are PER-USER (localStorage
  `STORAGE_KEYS.albionPremium`/`albionFocus` via `premium.ts`) - premium drives Best Value's
  4%/8% sales tax, focus the focus return rates (43.5/53.9/47.9 vs 15.2/36.7/24.8). Return
  rates derive from production bonuses via `return = 1 − 1/(1 + bonus)` (the in-game "+40%"
  is the bonus stat; the return rate the station tooltip shows is the converted value)
- City order everywhere (constants.ts CITIES): 5 royal bonus cities, then Caerleon, then Brecilien

### Live prices (`usePricesWS.ts` + `useLiveItemPrices`)
- `WS {forgeAPI}/game/albion/ws/prices`: connect frame is `{type:'hello'}` (no snapshot), then
  `price_changes` frames `{changes:[{item_id, city, quality, old_price, new_price, ...}]}` after
  every poller cycle. Same 500ms-delay + exponential-backoff shape as useTickerWS
- `useLiveItemPrices` (in `useItemPrices.ts`) = `useItemPrices` + WS: merges changed sell
  prices instantly (optimistic) and bumps a refetch so buy prices catch up. `useEnrichedRows`
  uses it, so Category pages, Item Index, Favourites, and detail panels all tick live

### Item icons (`src/utils/albionIcons.ts`)
```ts
itemIconUrl(uniqueName: string, size = 64, quality?: number): string
```
Constructs URL: `https://render.albiononline.com/v1/item/{UniqueName}.png?size={size}&quality={quality}`

Component in `src/forge/games/albion/ItemIcon.tsx`:
```tsx
<ItemIcon uniqueName="T4_OFF_SHIELD" size={24} />
// Renders <img> loading=lazy with srcset-size doubled for sharpness
```

### Adding a new MM page
1. Create page component in appropriate section folder (or PlaceholderPage for stubs)
2. If it's a real page, follow `PlaceholderPage.tsx` pattern: `useAuth()` + `useLayoutOverride()` to set sidebar/bottom bar
3. Import and add `<Route>` in `src/forge/games/GamesLayout.tsx`
4. Add entry in `src/config/sections.ts` for tab title
5. Add `<MMNavLink>` in `src/forge/games/albion/MarketManager/MarketManagerSidebar.tsx` (under the right `CollapsibleSection` or as a top-level link)

### DataTable (`src/components/DataTable.tsx`)
Generic sortable table with sticky headers, footer, row class, index passed to `render` as second arg:
```tsx
<DataTable columns={[
  { key: 'name', label: 'Name', render: (row, i) => <span>{row.name}</span> },
]} data={items} />
```
