// Accuracy audit for the notation data: every event must fit inside its bar,
// every note token must parse, stay inside the tune's keyboard range and keep
// one consistent fingering per pitch, and totals must fill whole bars (a
// pickup tune may end one truncated bar). Exits non-zero on any failure.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const TUNES = JSON.parse(readFileSync(join(root, 'src/tunes.json'), 'utf8'));
const LESSONS = JSON.parse(readFileSync(join(root, 'src/lessons.json'), 'utf8'));
const LETTER_PC = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const bad = [];
const midiOf = (tok) => {
  const m = tok.match(/^([A-G])(b|#)?(\d)(?::([1-5]))?$/);
  if (!m) return null;
  return { midi: (+m[3] + 1) * 12 + LETTER_PC[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0), f: m[4] ? +m[4] : null };
};
for (const [k, t] of Object.entries(TUNES)) {
  if (k.startsWith('_')) continue;
  const barE = t.beats * 2;
  let pos = t.pickup ? barE - t.pickup : 0;
  const fingerOf = {};
  for (const [i, [len, rh, lh]] of t.ev.entries()) {
    if ((pos % barE) + len > barE) bad.push(`${k} ev ${i}: crosses a barline (pos ${pos}, len ${len})`);
    for (const hand of [rh, lh]) {
      if (!hand) continue;
      for (const tok of hand.split(' ')) {
        const n = midiOf(tok);
        if (!n) { bad.push(`${k} ev ${i}: bad token ${tok}`); continue; }
        if (n.midi < t.range[0] || n.midi > t.range[1]) bad.push(`${k} ev ${i}: ${tok} outside range ${t.range}`);
        if (n.f) { if (fingerOf[n.midi] && fingerOf[n.midi] !== n.f) bad.push(`${k} ev ${i}: ${tok} conflicts with finger ${fingerOf[n.midi]}`); fingerOf[n.midi] = n.f; }
      }
    }
    pos += len;
  }
  const rem = pos % barE;
  if (t.pickup ? rem !== barE - t.pickup && rem !== 0 : rem !== 0) bad.push(`${k}: ends mid-bar (total ${pos}, bar ${barE})`);
}
LESSONS.forEach((L, li) => {
  const [lo, hi] = L.range;
  for (const st of L.steps) {
    for (const m of [...(st.glow || []), ...(st.labels || []), ...(st.demo || []), ...Object.keys(st.fingers || {}).map(Number)])
      if (m < lo || m > hi) bad.push(`lesson ${li + 1} "${st.title || st.t}": midi ${m} outside range ${L.range}`);
    for (const it of st.items || []) {
      if (it.t === 'read') { let m = (Math.floor(it.d / 7) + 1) * 12 + [0,2,4,5,7,9,11][it.d % 7]; if (it.acc === 'sharp') m++; if (it.acc === 'flat') m--;
        if (m < lo || m > hi) bad.push(`lesson ${li + 1} read d=${it.d}: midi ${m} outside range`); }
      if (it.t === 'echo') for (const m of it.seq) if (m < lo || m > hi) bad.push(`lesson ${li + 1} echo: midi ${m} outside range`);
    }
    if (st.tune && !TUNES[st.tune]) bad.push(`lesson ${li + 1}: unknown tune ${st.tune}`);
  }
  if (!TUNES[L.tune]) bad.push(`lesson ${li + 1}: unknown tune ${L.tune}`);
});
if (bad.length) { console.error('FAIL\n' + bad.map(b => '  - ' + b).join('\n')); process.exit(1); }
console.log('OK: bars, ranges, tokens and fingerings all check out');
