# AGENTS.md — Control Board

Local-first PWA for the ADHD "control vs can't control" routine. Read `docs/SPRINT.md` first.

## Stack
Vite + React 19, plain CSS tokens (Style G · Tactile Sanctuary), vite-plugin-pwa (generateSW, prompt update), Vitest. Deploy: Netlify (`netlify.toml`), build `npm run build`, publish `dist`.

## Layout
- `src/store.js` — all state logic as pure functions + safe localStorage. Add logic here, with a test in `src/store.test.js`.
- `src/App.jsx` — UI: Plan tab, Do tab (kanban + timer), menu (backup, theme, restart cycle), install/update banners.
- `src/index.css` — tokens in `:root`, dark via `prefers-color-scheme` and `[data-theme]`.

## Rules
- Never break the storage key `controlboard:v1`. If the shape changes, bump to v2 and migrate in `migrate()`.
- No accounts, analytics or network calls. Data stays on device.
- Tap targets ≥ 44px. Every destructive action gets an Undo toast.
- Run `npm test && npm run build` before every commit.
