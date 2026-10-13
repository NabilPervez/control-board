# Control Board

A calm, offline app for one daily habit: sort what's on your mind into **what I can control** and **what I can't**, turn the controllable things into actions, then work them in a **45-minute block**.

Built for the alternating routine: **Plan day** (sort + write actions) → **Do day** (execute) → repeat. Missed a day? Menu → *Restart cycle*. No catch-up.

## Using it
1. **Plan tab** — type a thought, tap *I can control this* or *I can't*. Can't-control items go to *Let it go* (tap *Release* when you've let them go).
2. Tap **+ Action** on anything you can control. It becomes a card in To Do.
3. **Do tab** — hit *Start* on the 45-minute timer, then move cards **To Do → In Progress → Done**.
4. Menu (⋯) → **Export backup** now and then. Everything lives only on this device.

Install it: Android shows an *Install* banner; on iPhone tap Share → *Add to Home Screen*.

## Develop
```bash
npm install
npm run dev     # local server
npm test        # store logic tests
npm run build   # production build to dist/
```
Netlify settings come from `netlify.toml`. Agent notes are in `AGENTS.md`; scope and Definition of Done in `docs/SPRINT.md`.

## Privacy
No account, no analytics, no server. Data is stored in your browser's localStorage under `controlboard:v1`.
