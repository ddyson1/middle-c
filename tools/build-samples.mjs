// One-shot: fetches Salamander Grand Piano samples (Alexander Holm, CC BY 3.0,
// via the Tone.js mirror), trims each to 3 s mono 22.05 kHz with a fade-out,
// re-encodes at 48 kbps mp3, and writes src/samples.json (base64 by midi note).
// The runtime pitch-shifts at most one semitone from the nearest root.
// Needs ffmpeg with libmp3lame on PATH. Run: node tools/build-samples.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const BASE = 'https://tonejs.github.io/audio/salamander/';
// name on the mirror -> midi number of the recorded pitch
const ROOTS = { C3:48, Ds3:51, Fs3:54, A3:57, C4:60, Ds4:63, Fs4:66, A4:69, C5:72, Ds5:75, Fs5:78, A5:81, C6:84 };
const SECONDS = 3, FADE = 0.6, RATE = 22050, KBPS = 48;

const tmp = mkdtempSync(join(tmpdir(), 'mc-samples-'));
const notes = {};
for (const [name, midi] of Object.entries(ROOTS)) {
  const raw = join(tmp, name + '.raw.mp3'), out = join(tmp, name + '.mp3');
  execFileSync('curl', ['-fsSL', '-o', raw, BASE + name + '.mp3']);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw,
    '-ac', '1', '-ar', String(RATE), '-t', String(SECONDS),
    '-af', `afade=t=out:st=${SECONDS - FADE}:d=${FADE}`,
    '-c:a', 'libmp3lame', '-b:a', KBPS + 'k', out]);
  notes[midi] = readFileSync(out).toString('base64');
  console.log(`${name} (midi ${midi}): ${(notes[midi].length / 1024).toFixed(0)} KB base64`);
}
const json = { credit: 'Salamander Grand Piano by Alexander Holm, CC BY 3.0, via the Tone.js audio mirror; trimmed and re-encoded by tools/build-samples.mjs', notes };
writeFileSync(join(root, 'src/samples.json'), JSON.stringify(json));
console.log(`src/samples.json: ${(JSON.stringify(json).length / 1024).toFixed(0)} KB total`);
