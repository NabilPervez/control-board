# Sprint plan — Control Board v1

PRD: Notion › Second Brain › Projects › Control Board.

## Sprint 1 (Oct 13, 2026) — P0 + most of P1
| # | Story | Status |
|---|---|---|
| 1 | Brain-dump sort: Can / Can't, edit, delete with Undo | Done |
| 2 | "Let it go" collapsible area, Release, move between lists | Done |
| 3 | "+ Action" turns a Can item into a To Do card (linked) | Done |
| 4 | Kanban To Do → In Progress → Done; tap buttons + desktop drag; stable order | Done |
| 5 | localStorage via safe versioned key (`controlboard:v1`) | Done |
| 6 | PWA: manifest, icons, offline SW, install banner, update toast | Done |
| 7 | Export / import JSON backup | Done |
| 8 | Mobile-first layout, bottom nav, swipeable board | Done |
| P1 | 45-min timer (chime, wake lock), Plan/Do day label, restart cycle, clear Done, theme | Done |

## Definition of Done
- [x] `npm test` passes (store logic: storage, ordering, cycle)
- [x] `npm run build` succeeds, service worker generated
- [x] Works at 390px wide, and 3 columns at ≥ 820px
- [x] Data survives reload; corrupt storage falls back to empty without crashing
- [x] Deletes are undoable; no network calls except Google Fonts
- [ ] Deployed to Netlify from the GitHub repo
- [ ] Installed on phone and used for one Plan + one Do day

## Deviations from PRD
- **Touch drag-and-drop:** not built. On phones, cards move with **Start / Done ✓ / ←** buttons; drag works on desktop. Reason: native HTML drag doesn't work on touch, and a touch-drag library adds weight for little gain at this size.
- **No Tailwind:** plain CSS tokens (Style G). Reason: one small screen set; tokens map 1:1 to the Style Library entry.
- **Crash screen (S5):** deferred to sprint 2.

## Sprint 2 (Oct 13, 2026) — feedback pass
| # | Change | Status |
|---|---|---|
| 1 | 45-min timer on **both** Plan and Do tabs (label shows which block) | Done |
| 2 | "Dump it — sort later": unsorted inbox (`type: 'inbox'`), Enter = dump, sort with Can / Can't | Done |
| 3 | Brown noise while the timer runs (generated in Web Audio, no file/network), on/off toggle remembered | Done |
| 4 | Mobile: kanban shows one column with To Do / Doing / Done tabs; item actions wrap under text; 44px targets; tighter spacing ≤ 480px | Done |

Notes: browsers block autoplay, so if the app reloads mid-block the timer shows **Resume sound**. Storage key unchanged (`controlboard:v1`); old data loads as-is.
