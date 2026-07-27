# CLAUDE.md

Interactive Three.js concept model of the Curtis Road Level Crossing Removal
(Munno Para, SA). Everything lives in one self-contained `index.html`.

## Working on it
- No build step. Edit `index.html`, open it in a browser (or `npx serve .`).
- Three.js loads from a CDN via an importmap; there is no bundler and no `node_modules`.
- Syntax-check the inline module before committing:
  `awk '/<script type="module">/{f=1;next} /<\/script>/{f=0} f' index.html | node --check -`

## How it's built (so edits land in the right place)
- **Alignment-driven.** On load the app queries OSM for the real level-crossing
  node and the Curtis Road / Gawler line centrelines, and every element (deck
  chords, ramps, screens, barriers, track, traffic, connectors) follows those
  curves. Straight fallbacks are used offline.
- Key globals near the top of the script: `CONFIG` (site lat/lon, tile zoom),
  `params` (all UI state / defaults), `PLAN_IMG` + `PLAN_REG` (georeferenced DIT
  plan overlay), `PLAN_FEATURES` (roads traced from the plan). The at-grade road
  network is traced against the registered plan, not guessed.
- Bridge spans are straight chords between piers on the curved road path; the
  rail span's midpoint is slid onto the crossing ("push to fit") so piers clear
  the corridor. `spansLeft` / `spansRight` set the arrangement.

## Constraints that are real, not stylistic
- Max precast concrete Super-T span is **42 m**; the per-span sliders cap at the
  buildable maximum per structure type (Super-T 42, steel 75, arch 130).
- The crossing is near-perpendicular (~1.5° rail skew).
- Live data depends on Esri World Imagery tiles and the OSM Overpass API
  (tried across mirrors, cached in `localStorage`). Guard every external call;
  a failure must degrade gracefully and surface on the on-screen status chip,
  never hang or fail silently.

## Testing without live services
This sandbox can't reach Overpass/Esri. To verify rendering, drive `index.html`
with a headless browser (Playwright, Chromium at `/opt/pw-browsers/chromium`),
intercepting the CDN, Overpass and tile requests with local Three.js and mocked
OSM JSON. Instrument via a `window.__dbg()` hook injected before the render loop.
Confirm behaviour on clean data, degenerate OSM ways, and full-offline.

## Git
Develop on `claude/curtis-road-crossing-threejs-0tobpy`; changes are also
fast-forwarded to `main`. Push to both.
