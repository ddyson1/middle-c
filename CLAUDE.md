# Middle C

A browser game that teaches piano basics through a single lesson path with a virtual instructor, Rulin (modeled on a real piano teacher who has agreed to it; her name, likeness and scripts need her sign-off before anything ships publicly).

## Current state

Source is split into modules under `src/`:
- `src/lessons.json`, `src/tunes.json`: Rulin's scripts, drill lists, tunes. Data, so Rulin can edit lines without touching code. `src/data.js` expands them into runtime shapes (drill item keys, tune event positions; a drill step's `"shuffle": true` mixes its items once per page load).
- `src/engine.js` (lesson flow, drills, play-a-tune, practice, songbook), `src/notation.js`, `src/audio.js`, `src/keyboard.js`, `src/studio.js`, `src/midi.js` (Web MIDI in, with velocity), plus `src/utils.js` (note math, helpers) and `src/state.js` (shared mutable state; kept dependency-light because studio.js reads `S` at module scope).
- `src/themes.css`, `src/page.html` (HTML shell).
- `build.mjs` inlines everything into one self-contained `dist/index.html` (about 87 KB): the published artifact and any static host take that file. No runtime fetches, assets inlined. The bundler is a deliberate naive concatenator: single-line `import`/`export` forms only, unique top-level names across modules, module order fixed in `ORDER`.

`src/glyphs.json` holds the music glyph outlines (clefs, accidentals, rests) extracted from Noto Music (OFL) so notation renders without a web font and exports as an image.

`tests/run.mjs` drives the built `dist/index.html` in headless Chromium: plays all seven lessons as a correct student, exercises the wrong-answer flow, Practice, Songbook and Studio, and fails on any console error. `npm test` builds first; run it after every change.

## Product decisions (do not relitigate without reason)

- One path, not modes. Seven lessons, each: show, drill, play a tune. Echo is a drill type, Write is the Studio sandbox.
- Lessons: 1 Find C then C D E (Hot Cross Buns); 2 F G A B (Ode to Joy); 3 Playing in time (Twinkle); 4 Treble staff (Mary Had a Little Lamb from notation); 5 Sharps and flats (Happy Birthday, B flat); 6 Bass clef, left hand (Hot Cross Buns an octave down); 7 Both hands (Ode to Joy with left-hand downbeats). All tunes public domain.
- Mistakes are corrected by doing: the right key glows until pressed, the item repeats later in the drill, and the note goes on a review list that Practice draws from first. No negative scoring, no timers in lessons.
- Every tune is played three passes: lights and names, notation only, from memory.
- Keyboard always at the bottom; Rulin's line always in the row directly above it. The stage above shows one thing.
- Note names on keys are only shown while a note is being introduced. The Settings toggle affects Songbook and Studio only.
- Clean light is the default theme. Arcade, Primary shapes, Color-coded keys and Chalkboard are optional skins; they change looks only, never rules.
- Rulin is text only: no avatar or placeholder circle in the UI. The avatar idea is parked (the old `RULIN_ART` slots are gone; `expr` args remain on say/rulinRow callers but render nothing). Never generate her face from a photo.

## Copy rules

No em dashes, no exclamation points, no emojis in any product copy. Sentence case. Rulin's lines are short, specific, and never cheer every press. Placeholders use curly braces, like {name}.

## Roadmap

1. Done: module split and build (above).
2. Web MIDI input: done for detection and velocity (`src/midi.js`: notes route through the same press/release path as the on-screen keys; a footer line names the connected device). Still open: judge timing in lesson 3 once input latency is reliable.
3. Sampled piano (short compressed samples every few semitones, inlined) to replace the oscillator synth.
4. Rulin reviews and edits `lessons.json`.
5. Static hosting on a real domain; keep republishing the claude.ai artifact as the preview.

## Known simplifications

- Lesson 3 plays a click but does not judge timing.
- Studio rhythm mode: no beaming, rests on the top staff only, notes crossing a barline are split with ties.
- Chords in Studio stack on a shared x position; accidentals can collide in dense chords.
