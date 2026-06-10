# Curtis Road Level Crossing Removal — Interactive Concept Model

An interactive Three.js model of the **Curtis Road Level Crossing Removal** project
at Munno Para, South Australia — the $250M (Australian + SA Government, 50:50)
grade separation that will carry Curtis Road over the Gawler passenger rail line
on a new dual-lane road overpass. Major works are due to commence in 2027 with
completion expected in 2030.

The model is built from the publicly available project information and the 2026
concept design release published by the SA Department for Infrastructure and
Transport (DIT), including the new link road to Playford Alive East, the
Charlotte Street–Alawoona Road local connection passing beneath the overpass,
shared-use paths on both sides of Curtis Road, throw screens over the rail
corridor and concrete traffic barriers as shown in the concept renders.

## Running it

Everything lives in a single `index.html` (Three.js is loaded from a CDN).

```bash
# any static server works
npx serve .            # or: python3 -m http.server 8000
```

then open the served URL. Opening `index.html` directly from disk also works in
most browsers. An internet connection is needed for Three.js, the Esri World
Imagery satellite tiles and the OpenStreetMap building footprints (the model
falls back to flat-colour ground and procedural building massing offline).

## Interactivity

**Bridge structure**
- Structure type: precast **concrete Super-T girders**, **steel plate girders**,
  or a steel **network arch** (through type, with crossing hanger network)
- Number of spans (1–6) with an individual length slider per span
- Lanes per direction, rail clearance, and MSE retaining-wall vs earth-embankment
  approaches (5% grades, ramp lengths recalculated live)
- Piers are skewed parallel to the rail line; a pier landing inside the rail
  corridor clear zone is flagged red with a warning

**Screens & barriers (per the concept images)**
- Curved, perforated **throw screens** over the rail corridor (or full length)
- F-type **concrete traffic barriers** between the carriageway and the
  shared-use paths, plus outer pedestrian balustrades

**Site context**
- **Alignment-driven geometry**: the model queries OSM for the level-crossing
  node and the real Curtis Road and Gawler line centrelines — the bridge deck
  (as straight chords between piers), approaches, screens, barriers, track and
  traffic all follow the actual curved alignments
- **Satellite imagery** (Esri World Imagery by default, or any custom XYZ tile
  URL) draped on the ground, georeferenced to the crossing, with fine-tune
  alignment sliders
- **Building envelopes** extruded from OpenStreetMap footprints (procedural
  suburban massing as a fallback), with opacity control
- Electrified double-track Gawler line with overhead wiring masts, Munno Para
  station platforms, an animated 3-car EMU and road traffic over the new bridge
- Preset camera views (overview, western approach, rail corridor, shared-use path)

## Notes

This is an indicative concept visualisation for exploration and discussion —
not an engineering design. Span arrangements, structure depths, clearances and
alignments are parametric approximations; refer to DIT's published concept
design for the actual proposal. Site centre coordinates and rail bearing are
set in `CONFIG` at the top of the script in `index.html`.

Imagery © Esri, Maxar, Earthstar Geographics. Building data © OpenStreetMap
contributors. Project information: Department for Infrastructure and Transport,
South Australia.
