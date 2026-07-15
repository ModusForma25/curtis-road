/* =====================================================================
   Curtis Road LXR — EOI to ACCIONA
   InDesign build script — scaffolds the 10-page A3 document from the
   wireframe (EOI-A3-Wireframes.html).

   HOW TO RUN
   ----------
   Option A — via the indesign-uxp-server MCP:
     call tool `execute_indesign_code` with:
       code                : the entire contents of this file
       dangerousConfirmation: "I understand this executes arbitrary InDesign code"
   Option B — direct: paste into the UXP Developer Tool script console with
     an InDesign document context (the code runs async, `app` in scope).

   WHAT IT BUILDS
   --------------
   - A3 landscape doc (420x297mm), 10 single pages, mm units
   - 12-col / 5mm-gutter column guides + 4.5mm baseline grid on every page
   - CMYK swatches sampled from the wireframe palette (tune to brand)
   - 5 paragraph styles = the 4-size type scale + win-theme eyebrow
   - Per-page placeholder frames snapped to the grid, each labelled with the
     zone it holds (hero renders, diagrams, text columns, panels, QR, folio)

   It builds an ARMATURE, not the finished artwork: flow real copy from
   EOI-A3-Draft-Content.md and place renders from the concept model.
   Frames are tagged via the Script Label (Window > Utilities > Script Label).
   ===================================================================== */

// ---- 0. CONFIG -------------------------------------------------------
var FONT_FAMILY = "Helvetica Neue"; // <- change to your brand face or "Arial" on Windows
var PAGE_W = 420, PAGE_H = 297;
var M_TOP = 15, M_BOT = 18, M_SIDE = 15;
var GUTTER = 5, COLS = 12;

// ---- 1. DOCUMENT -----------------------------------------------------
var doc = app.documents.add();
doc.documentPreferences.properties = {
  pageWidth: PAGE_W, pageHeight: PAGE_H,
  pageOrientation: PageOrientation.LANDSCAPE,
  facingPages: false,
  pagesPerDocument: 10
};
doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.MILLIMETERS;
doc.viewPreferences.verticalMeasurementUnits   = MeasurementUnits.MILLIMETERS;
while (doc.pages.length < 10) { doc.pages.add(); }

// baseline grid
try {
  doc.gridPreferences.baselineDivision = 4.5;
  doc.gridPreferences.baselineStart = M_TOP;
  doc.gridPreferences.baselineGridShown = true;
} catch (e) {}

// ---- 2. GRID MATH ----------------------------------------------------
var L = M_SIDE, T = M_TOP, R = PAGE_W - M_SIDE, B = PAGE_H - M_BOT;
var LIVE_W = R - L;                                   // 390
var COL_W  = (LIVE_W - (COLS - 1) * GUTTER) / COLS;   // 27.9167
var STEP   = COL_W + GUTTER;                          // 32.9167
function X(line){ return L + (line - 1) * STEP; }               // grid line 1..13
function Wd(s, e){ return (e - s) * COL_W + (e - s - 1) * GUTTER; } // span cols s..e (CSS-grid style)

// apply margins + 12 columns to every page (this draws the column guides)
for (var p = 0; p < doc.pages.length; p++) {
  var mp = doc.pages.item(p).marginPreferences;
  mp.top = M_TOP; mp.bottom = M_BOT; mp.left = M_SIDE; mp.right = M_SIDE;
  mp.columnCount = COLS; mp.columnGutter = GUTTER;
}

// ---- 3. COLOUR (CMYK approximations of the wireframe tokens) ----------
function swatch(name, c, m, y, k){
  var col;
  try { col = doc.colors.itemByName(name); col.name; }
  catch (e) {
    col = doc.colors.add();
    col.properties = { name: name, model: ColorModel.PROCESS, space: ColorSpace.CMYK, colorValue: [c, m, y, k] };
  }
  return col;
}
var INK    = swatch("MF Ink",     80, 64, 45, 40);  // deep navy #1E2B38
var WIRE   = swatch("MF Wire",    60, 40, 26, 6);   // blue-grey keyline
var ACCENT = swatch("MF Accent",  12, 78, 92, 3);   // terracotta #C8451A
var TINT   = swatch("MF Tint",    8,  4,  3,  0);   // ≤10% context panel
var REV    = swatch("MF Reverse", 82, 66, 48, 55);  // reversed metrics panel

// ---- 4. PARAGRAPH STYLES = the 4-size scale + eyebrow -----------------
function pstyle(name, size, lead, opts){
  opts = opts || {};
  var s;
  try { s = doc.paragraphStyles.itemByName(name); s.name; }
  catch (e) { s = doc.paragraphStyles.add(); s.name = name; }
  try { s.appliedFont = FONT_FAMILY; } catch (e2) {}
  try { if (opts.bold) s.fontStyle = "Bold"; else s.fontStyle = "Regular"; } catch (e3) {}
  s.pointSize = size;
  s.leading = lead;
  try { s.fillColor = opts.color || INK; } catch (e4) {}
  if (opts.track) s.tracking = opts.track;
  if (opts.caps)  s.capitalization = Capitalization.ALL_CAPS;
  s.justification = Justification.LEFT_ALIGN;
  return s;
}
var ST_HEAD  = pstyle("EOI Headline",  42, 44, { bold:true,  track:-10 });
var ST_STAND = pstyle("EOI Standfirst",15, 20, {});
var ST_BODY  = pstyle("EOI Body",      9.5,13.5,{});
var ST_CAP   = pstyle("EOI Caption",   7.5,10, { color:WIRE });
var ST_EYEB  = pstyle("EOI Eyebrow",   9,  11, { caps:true, track:160, color:ACCENT });

// ---- 5. FRAME HELPERS ------------------------------------------------
// text frame on the grid: y/h in mm, s/e = grid lines
function txt(pg, style, content, y, h, s, e){
  var f = pg.textFrames.add();
  f.geometricBounds = [y, X(s), y + h, X(s) + Wd(s, e)];
  f.contents = content || "";
  try { f.parentStory.appliedParagraphStyle = style; } catch (e1) {}
  try { f.textFramePreferences.insetSpacing = [0,0,0,0]; } catch (e2) {}
  return f;
}
// placeholder box (render / diagram / panel). kind: 'img'|'dg'|'pn'|'rv'|'qr'
function box(pg, y, h, s, e, kind, label){
  var r = pg.rectangles.add();
  r.geometricBounds = [y, X(s), y + h, X(s) + Wd(s, e)];
  var fill = TINT, stroke = WIRE, capCol = WIRE;
  if (kind === 'rv') { fill = REV; stroke = REV; capCol = TINT; }
  if (kind === 'qr') { fill = TINT; stroke = INK; }
  try { r.fillColor = (kind === 'img' || kind === 'dg') ? TINT : fill; r.fillTint = (kind==='pn')?100:(kind==='img'||kind==='dg')?60:100; } catch (e1) {}
  try { r.strokeColor = stroke; r.strokeWeight = (kind==='qr')?1:0.5; } catch (e2) {}
  r.label = label || "";
  // caption tag inside the box (skip for qr)
  if (kind !== 'qr' && label) {
    var c = pg.textFrames.add();
    c.geometricBounds = [y + 1.5, X(s) + 2, y + 12, X(s) + Wd(s, e) - 2];
    c.contents = label;
    try { c.parentStory.appliedParagraphStyle = ST_CAP; c.parentStory.fillColor = capCol; } catch (e3) {}
  }
  return r;
}
// win-theme eyebrow + folio strip, identical position on every inner page
function furniture(pg, eyebrow, folioRight){
  txt(pg, ST_EYEB, eyebrow, T - 6.5, 5, 1, 13);
  var fL = pg.textFrames.add();
  fL.geometricBounds = [B + 8, L, B + 13, R];
  fL.contents = "MODUS FORMA + TCL  —  CURTIS ROAD LXR EOI\t" + folioRight;
  try {
    fL.parentStory.appliedParagraphStyle = ST_CAP;
    var ts = fL.parentStory.paragraphs.item(0).tabStops;
    var t = ts.add(); t.alignment = TabStopAlignment.RIGHT_ALIGN; t.position = LIVE_W - 1;
  } catch (e) {}
}
function P(i){ return doc.pages.item(i); }

// ---- 6. PAGES --------------------------------------------------------

/* -- 01 COVER -- */
(function(){ var pg = P(0);
  box(pg, 0, PAGE_H, 1, 13, 'img', "HERO RENDER — concept model, dusk undercroft/greenway · FULL BLEED (add 3mm)");
  box(pg, 199, 74, 1, 8, 'pn', "TITLE BLOCK ON SCRIM");
  txt(pg, ST_EYEB, "CURTIS ROAD LEVEL CROSSING REMOVAL · EOI TO ACCIONA", 205, 6, 1, 8);
  txt(pg, ST_HEAD, "From level crossing to community landmark.", 214, 40, 1, 8);
  txt(pg, ST_CAP,  "MODUS FORMA + TCL — hard infrastructure + soft landscape, one team.", 258, 8, 1, 8);
  box(pg, 259, 20, 10, 13, 'pn', "DATE · PREPARED FOR ACCIONA");
})();

/* -- 02 READING THE SITE -- */
(function(){ var pg = P(1); furniture(pg, "UNDERSTANDING · KEY PROJECT ISSUES", "UNDERSTANDING · 02");
  box(pg, 15, 264, 1, 4, 'pn', "CONTEXT RAIL — why this project, why now: GROWTH & HOMES · PUBLIC VALUE · DIT/ODASA STANDARDS");
  txt(pg, ST_HEAD,  "We already know this site — and this structure.", 15, 30, 4, 13);
  txt(pg, ST_STAND, "[Standfirst — not a typical landscape brief; a bigger job than moving traffic.]", 46, 17, 4, 10);
  box(pg, 68, 131, 4, 13, 'dg', "ANNOTATED SITE ANALYSIS PLAN — aerial base from model + redline annotations");
  txt(pg, ST_BODY, "[Issues 1–2 — undercroft; severance vs connection]", 204, 75, 4, 7);
  txt(pg, ST_BODY, "[Issues 3–4 — heat & exposure; water & biodiversity]", 204, 75, 7, 10);
  txt(pg, ST_BODY, "[Issue 5 — carbon in the concrete]", 204, 42, 10, 13);
  box(pg, 254, 25, 10, 11, 'qr', "QR");
  txt(pg, ST_CAP, "Explore the live concept model →", 254, 25, 11, 13);
})();

/* -- 03 DESIGN RESPONSE -- */
(function(){ var pg = P(2); furniture(pg, "LEFT-OVER TO LANDMARK · OUR DESIGN RESPONSE", "DESIGN RESPONSE · 03");
  txt(pg, ST_HEAD,  "Four moves that turn the structure into a place.", 15, 22, 1, 8);
  txt(pg, ST_STAND, "[We design both sides of every interface — soffit, screens, embankment, floor.]", 15, 20, 8, 13);
  var moves = [
    [1, 4, "1 — THE ROOM UNDER THE BRIDGE"],
    [4, 7, "2 — THE GREENWAY SPINE"],
    [7,10, "3 — DESIGN-TO-REDUCE"],
    [10,13,"4 — REGENERATE THE PLAINS"]
  ];
  for (var i=0;i<moves.length;i++){
    box(pg, 54, 62, moves[i][0], moves[i][1], 'img', "MOVE " + (i+1) + " — sketch over model still");
    txt(pg, ST_EYEB, moves[i][2], 118, 5, moves[i][0], moves[i][1]);
    txt(pg, ST_BODY, "[move copy]", 123, 34, moves[i][0], moves[i][1]);
  }
  box(pg, 163, 96, 1, 13, 'dg', "LONG SECTION THROUGH UNDERCROFT — MF (soffit/screens/piers) + TCL (floor/planting/play), two label registers");
})();

/* -- 04 DESIGNED TO REGENERATE -- */
(function(){ var pg = P(3); furniture(pg, "DESIGNED TO REGENERATE · SUSTAINABILITY", "DESIGNED TO REGENERATE · 04");
  txt(pg, ST_HEAD, "Sustainability we can measure — against your concept.", 15, 30, 1, 9);
  box(pg, 53, 113, 1, 9, 'dg', "SYSTEM DIAGRAM — overpass as catchment: runoff → treatment → irrigation → canopy/habitat (one closed loop)");
  txt(pg, ST_EYEB, "DECARBONISE THE STRUCTURE — MF",  171, 5, 1, 5); txt(pg, ST_BODY, "[copy]", 176, 44, 1, 5);
  txt(pg, ST_EYEB, "REGENERATE THE LANDSCAPE — TCL", 171, 5, 5, 9); txt(pg, ST_BODY, "[copy]", 176, 44, 5, 9);
  txt(pg, ST_EYEB, "CLOSE THE LOOP ON WATER — BOTH",  220, 5, 1, 5); txt(pg, ST_BODY, "[copy]", 225, 44, 1, 5);
  txt(pg, ST_EYEB, "SOCIAL LEGACY — BOTH",             220, 5, 5, 9); txt(pg, ST_BODY, "[copy]", 225, 44, 5, 9);
  box(pg, 15, 264, 9, 13, 'rv', "MEASURED VS THE CONCEPT DESIGN — KRA-ready: carbon↓ tonnes↓ canopy↑ habitat↑ species↑ stormwater↑");
})();

/* -- 05 CAPABILITY -- */
(function(){ var pg = P(4); furniture(pg, "RELEVANT EXPERIENCE", "CAPABILITY · 05");
  box(pg, 15, 264, 1, 4, 'pn', "INTRO RAIL — 'chosen for this project, not a portfolio'; every caption leads with relevance");
  box(pg, 15, 129.5, 4, 10, 'img', "HERO TILE — TORRENS TO DARLINGTON · MF design architect, with Karl Telfer · LEAD");
  box(pg, 15, 129.5, 10,13, 'img', "TILE — MF LXR / grade separation · 'lessons we'd adapt for Curtis Road'");
  box(pg, 149.5,129.5,4, 7, 'img', "TILE — TCL greenway / linear park");
  box(pg, 149.5,129.5,7,10, 'img', "TILE — TCL play / community space");
  box(pg, 149.5,129.5,10,13,'img', "TILE — TCL SA Country-led (w/ Karl Telfer)");
})();

/* -- 06 RELATIONSHIPS -- */
(function(){ var pg = P(5); furniture(pg, "TRUSTED RELATIONSHIPS · CLIENT & STAKEHOLDER", "RELATIONSHIPS · 06");
  txt(pg, ST_HEAD,  "We de-risk your stakeholders.", 15, 22, 1, 7);
  txt(pg, ST_STAND, "[DIT, ODASA, Playford, Kaurna, rail, community — we hold the relationships.]", 15, 20, 7, 13);
  box(pg, 56, 223, 1, 7, 'dg', "RADIAL STAKEHOLDER MAP — site at centre; line weight = relationship depth");
  txt(pg, ST_EYEB, "A TEAM PHYSICALLY IN ADELAIDE", 56, 5, 7, 10);  txt(pg, ST_BODY, "[copy]", 61, 80, 7, 10);
  txt(pg, ST_EYEB, "SA DELIVERY — T2D, DESIGN ARCHITECT", 145, 5, 7, 10); txt(pg, ST_BODY, "[copy]", 150, 89, 7, 10);
  box(pg, 56, 108, 10, 13, 'pn', "ODASA — WE KNOW THE REVIEWERS (accent keyline; the one highlight)");
  txt(pg, ST_EYEB, "KARL TELFER — SHARED KAURNA RELATIONSHIP", 168, 5, 10, 13); txt(pg, ST_BODY, "[copy]", 173, 66, 10, 13);
  box(pg, 239, 40, 7, 13, 'pn', "CALLOUT — WORKING WITH ACCIONA (Req.6), outlined/honest");
})();

/* -- 07 TEAM -- */
(function(){ var pg = P(6); furniture(pg, "ONE INTEGRATED TEAM", "TEAM · 07");
  box(pg, 15, 264, 1, 4, 'pn', "RAIL — leadership logic + 'roles at the interface' + note: CVs separate");
  box(pg, 15, 200, 4, 13, 'dg', "INTEGRATED ORG CHART — Design Manager [NAME]; MF stream + TCL stream; Karl Telfer ACROSS both; steering cttee above, subs below");
  box(pg, 220, 59, 4, 13, 'pn', "KEY PEOPLE — 8 portraits @ 24x28mm, uniform crop");
})();

/* -- 08 TEAMING -- */
(function(){ var pg = P(7); furniture(pg, "STRONGEST TEAMING · CAPABILITY & LIMITATIONS", "TEAMING · 08");
  txt(pg, ST_HEAD, "Where we don’t do it in-house, we’ve already partnered.", 15, 22, 1, 9);
  box(pg, 49, 190, 1, 9, 'dg', "CAPABILITY-COVERAGE MATRIX — 11 disciplines x MF/TCL/SUB/HOW-CLOSED; dot=capability, text in last col");
  box(pg, 49, 92, 9, 13, 'pn', "CALLOUT — digital/parametric in-house: 'the concept model is ours' + still");
  box(pg, 147, 92, 9, 13, 'pn', "CALLOUT — interstate, solved: TCL Adelaide office + MF permanent ADL staff");
  txt(pg, ST_BODY, "[Candour line — engineering sits with ACCIONA / named sub; we design to integrate.]", 244, 30, 1, 9);
})();

/* -- 09 WHY US -- */
(function(){ var pg = P(8); furniture(pg, "WORKING WITH ACCIONA · BUILT FOR YOUR DELIVERY MODEL", "WHY US · 09");
  txt(pg, ST_HEAD,  "A team built for your delivery model.", 15, 24, 1, 8);
  txt(pg, ST_STAND, "[Incentivised design rewards early, buildable, integrated, carbon-reducing decisions.]", 15, 20, 8, 13);
  box(pg, 55, 170, 1, 8, 'img', "MODEL STILL — interface view + inset QR · 'test spans/screens/sightlines live in the 30-min session'");
  var claims = ["WE MOVE YOUR KRAs","WE DELIVER EARLY & INTEGRATED","WE HELP YOU WIN THE HEAD CONTRACT","A LOCAL TEAM, A LIVE TOOL"];
  for (var i=0;i<4;i++){ var y=55+i*43; txt(pg, ST_EYEB, claims[i], y, 5, 8, 13); txt(pg, ST_BODY, "[proof copy]", y+5, 33, 8, 13); }
  box(pg, 235, 44, 1, 5, 'pn', "THEME 1"); box(pg, 235, 44, 5, 9, 'pn', "THEME 2"); box(pg, 235, 44, 9, 13, 'pn', "THEME 3");
})();

/* -- 10 BACK COVER -- */
(function(){ var pg = P(9);
  box(pg, 0, PAGE_H, 1, 13, 'img', "CLOSING RENDER — greenway arrival, dusk, figures · FULL BLEED (add 3mm)");
  box(pg, 237, 42, 1, 7, 'pn', "FROM LEVEL CROSSING TO COMMUNITY LANDMARK");
  txt(pg, ST_STAND, "We’d welcome the 30-minute presentation.", 243, 12, 1, 7);
  box(pg, 237, 42, 8, 13, 'pn', "CONTACTS — MF + TCL, logos small, baseline-aligned");
})();

// ---- 7. DONE ---------------------------------------------------------
try { app.activeWindow.zoomPercentage = 40; } catch (e) {}
return { success: true, message: "Built 10-page A3 EOI scaffold: grid, baseline, 5 paragraph styles, 5 swatches, labelled frames. Flow copy from EOI-A3-Draft-Content.md and place renders.", pages: doc.pages.length };
