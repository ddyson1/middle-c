# Middle C

A browser game that teaches piano basics through a single lesson path with a virtual instructor, Rulin (modeled on a real piano teacher). She signed off on her name and scripts on 2026-10-02, so public hosting is cleared; any future use of her likeness would still need her approval.

## Current state

Source is split into modules under `src/`:
- `src/lessons.json`, `src/tunes.json`: Rulin's scripts, drill lists, tunes. Data, so Rulin can edit lines without touching code. `src/data.js` expands them into runtime shapes (drill item keys, tune event positions; a drill step's `"shuffle": true` mixes its items once per page load).
- `src/engine.js` (lesson flow, drills, play-a-tune, practice, songbook), `src/notation.js`, `src/audio.js`, `src/keyboard.js`, `src/studio.js`, `src/midi.js` (Web MIDI in, with velocity), plus `src/utils.js` (note math, helpers) and `src/state.js` (shared mutable state; kept dependency-light because studio.js reads `S` at module scope).
- `src/themes.css`, `src/page.html` (HTML shell).
- `src/samples.json`: 13 piano samples (C3 to C6, every minor third, 3 s mono mp3 as base64), from the Salamander Grand Piano by Alexander Holm, CC BY 3.0; regenerate with `tools/build-samples.mjs` (needs ffmpeg). `src/audio.js` plays the nearest sample pitch-shifted at most one semitone, with the old oscillator synth as fallback until the samples decode. Attribution shows in Settings.
- `build.mjs` inlines everything into one self-contained `dist/index.html` (about 400 KB, mostly samples): the published artifact and any static host take that file. No runtime fetches, assets inlined. The bundler is a deliberate naive concatenator: single-line `import`/`export` forms only, unique top-level names across modules, module order fixed in `ORDER`.

`src/glyphs.json` holds the music glyph outlines (clefs, accidentals, rests) extracted from Noto Music (OFL) so notation renders without a web font and exports as an image.

`tests/run.mjs` drives the built `dist/index.html` in headless Chromium: plays all seven lessons as a correct student, exercises the wrong-answer flow, Practice, Songbook and Studio, and fails on any console error. `npm test` first audits the lesson and tune data (`tools/check-tunes.mjs`: bar math, note tokens, ranges, fingering consistency), then builds, then runs the browser suite; run it after every change.

## Product decisions (do not relitigate without reason)

- One path, not modes. Seven lessons, each: show, drill, play a tune. Echo is a drill type, Write is the Studio sandbox.
- Lessons: 1 Find C then C D E (Hot Cross Buns); 2 F G A B (Ode to Joy); 3 Playing in time (Twinkle); 4 Treble staff (Mary Had a Little Lamb from notation); 5 Sharps and flats (Happy Birthday, B flat); 6 Bass clef, left hand (Hot Cross Buns an octave down); 7 Both hands (Ode to Joy with left-hand downbeats). All tunes public domain.
- Mistakes are corrected by doing: the right key glows until pressed, the item repeats later in the drill, and the note goes on a review list that Practice draws from first. No negative scoring, no timers in lessons.
- Every tune is played three passes: lights and names, notation only, from memory.
- Keyboard always at the bottom; the instruction line always in the row directly above it. The stage above shows one thing.
- One theme: engraved, like a printed score (picked from round five of the Middle C directions canvas, 2026-10-02). Score-white paper, near-black ink, one marine accent, EB Garamond body with Cormorant Garamond display. Dark mode is a night rehearsal: cool charcoal, light ink, the keys stay ivory. Devin rejected sepia and warm cream grounds; do not add skins.
- The interface is one calm column per screen: no grids of boxed cards (Devin: "no bento"), hairline dividers over borders. Controls are typography, small caps and underlines, never filled buttons; the only filled shapes on screen are the piano and the staff. Home is a table of contents with roman numerals and leader dots.
- Note names on keys are only shown while a note is being introduced. The Settings toggle affects Songbook and Studio only.
- Key colors are a learning aid, not a skin: each letter name keeps a fixed color band (NOTE_COLOR, a muted engraving-friendly palette), shown in lessons 1 to 3 and in Practice until lesson 4 is done; Songbook and Studio follow a Settings toggle. Like note names, colors fade out once staff reading starts.
- Finger numbers: lesson 1 teaches thumb 1 to pinky 5 with the right hand resting on C to G; lesson 6 shows the left-hand mirror. During pass 1 of a tune the cued key wears a badge with its finger. Fingerings live in `tunes.json` as `E4:3` tokens; the C-position tunes are drafted, twinkle and birthday are left for Rulin because they shift hand position.
- Rulin's persona is parked (2026-10-02): instruction copy is plain and neutral, her name appears nowhere in the UI for now, and there is no avatar. `lessons.json` keeps the `line` fields as the voice channel for when it returns. Never generate her face from a photo.

## Copy rules

No em dashes, no exclamation points, no emojis in any product copy. Sentence case. Instruction lines are short, specific, and never cheer every press. Placeholders use curly braces, like {name}.

## Roadmap

1. Done: module split and build (above).
2. Web MIDI input: done for detection and velocity (`src/midi.js`: notes route through the same press/release path as the on-screen keys; a footer line names the connected device). Still open: judge timing in lesson 3 once input latency is reliable.
3. Done: sampled piano (see Current state). The synth remains only as a decode fallback.
4. In progress: Rulin reviews and edits `lessons.json` and the fingerings in `tunes.json`. `LESSONS-GUIDE.md` is her plain-language guide; the deploy workflow runs the data audit first, so a bad edit fails the deploy and the live site keeps the previous version. Twinkle and Happy Birthday fingerings are deliberately hers to author.
5. Hosted on GitHub Pages at https://devindyson.com/middle-c/ (`.github/workflows/pages.yml` builds and deploys on every push to main; the account's custom domain covers it). Keep republishing the claude.ai artifact as the preview.

## Known simplifications

- Lesson 3 plays a click but does not judge timing.
- Studio rhythm mode: no beaming, rests on the top staff only, notes crossing a barline are split with ties.
- Chords in Studio stack on a shared x position; accidentals can collide in dense chords.
