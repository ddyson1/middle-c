# Middle C

Piano basics as a seven-lesson path with a virtual instructor.

Source lives in `src/` (ES modules plus `lessons.json`, `tunes.json`, `themes.css`).
`node build.mjs` inlines everything into one self-contained `dist/index.html`;
open that file in a browser or put it on any static host.

Tests: `npm install` then `npm test` (builds, then plays the whole app in headless Chromium via Playwright).

Piano sound: Salamander Grand Piano by Alexander Holm, CC BY 3.0, via the
Tone.js audio mirror; trimmed and re-encoded by `tools/build-samples.mjs`
into `src/samples.json`.
