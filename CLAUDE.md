# ForgeHaven — Claude Context

## Always run after making changes
```bash
npm run lint   # must pass: 0 errors, 0 warnings
npm run build  # must pass: ✓ built
```
The chunk-size warning about ffmpeg/pdf.js is expected and not an error.

---

## Stack
- React 19 + TypeScript + Vite + Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- React Router v7 (BrowserRouter), Redux Toolkit (IP geolocation store), SWR (weather/currency)
- `eslint-plugin-react-hooks` v7 — React 19's stricter ruleset (see ESLint patterns below)
- Deployed via GitHub Actions on push to `main` → GitHub Pages, custom domain `forgehaven.io` (CNAME at root)
- FFmpeg packages excluded from Vite `optimizeDeps` (loaded from `public/ffmpeg/`)

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
- `@ffmpeg/ffmpeg` + `@ffmpeg/util` + `@ffmpeg/core-st` — video/audio processing (WASM, loaded from `public/ffmpeg/`)
- `pdfjs-dist` — PDF processing (WASM, loaded from `public/`)
- `react-image-crop` — image cropping in ImgEditor
- `sql-formatter` — SQL formatting in TextFormatter
- `bcryptjs` — bcrypt hashing
- `libphonenumber-js` — phone number lookup
- `qrcode` — QR code generation
- `jszip` — ZIP file creation (PDF to EPUB)
- `swr` — data fetching (weather, currency rates)
- `react-select` — dropdown (wrapped by `Select` component)

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
| `forge_ip_v1` | Cached IPInfo + timestamp (5-min TTL) |

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
