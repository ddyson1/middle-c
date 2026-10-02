// End-to-end check: plays every lesson as a correct student, then exercises the
// correction flow, Practice, Songbook and Studio. Exits non-zero on any failure.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', process.env.MC_FILE || 'dist/index.html');
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 950 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.route('**fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
await page.goto('file://' + file);
await page.waitForTimeout(300);

const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); };

const log = await page.evaluate(async () => {
  const M = window.__mc, S = M.S, sleep = ms => new Promise(r => setTimeout(r, ms));
  const $ = id => document.getElementById(id); const out = [];
  async function doStep() {
    const st = S.step;
    if (st.t === 'show') { $('nextBtn').click(); return; }
    if (st.t === 'drill') {
      while (S.drill && S.view === 'lesson') {
        const D = S.drill, it = D.items[D.idx];
        if (it.t === 'find') { const m = [...document.querySelectorAll('.key')].map(k => +k.dataset.midi).find(x => x % 12 === it.pc); M.press(m); M.release(m); await sleep(320); }
        else if (it.t === 'name') { [...document.querySelectorAll('#opts button')].find(b => +b.dataset.pc === it.m % 12).click(); await sleep(460); }
        else if (it.t === 'read') { const m = M.targetMidi(it); M.press(m); M.release(m); await sleep(320); }
        else if (it.t === 'echo') { while (S.locked) await sleep(50); for (const m of it.seq) { M.press(m); M.release(m); await sleep(30); } await sleep(600); }
        if (S.step !== st) break;
      }
      return;
    }
    if (st.t === 'play') {
      const Pl = S.play, tune = Pl.tune;
      for (let pass = Pl.pass; pass <= Pl.passes; pass++) {
        for (const e of tune.ev) { for (const n of e.notes) M.press(n.m); for (const n of e.notes) M.release(n.m); await sleep(15); }
        await sleep(50);
        if (S.play.pass < S.play.passes) { $('nextPass').click(); await sleep(50); } else { $('finishBtn') && $('finishBtn').click(); await sleep(50); }
      }
      return;
    }
    if (st.t === 'done') { $('homeBtn2').click(); }
  }
  for (let L = 1; L <= M.LESSONS.length; L++) {
    M.startLesson(L); let guard = 0;
    while (S.view === 'lesson' && guard++ < 60) { const before = S.stepIdx; await doStep(); await sleep(60); if (S.view === 'lesson' && S.stepIdx === before && S.step.t !== 'drill') { out.push({ lesson: L, stuck: before }); break; } }
    out.push({ lesson: L, done: !!M.P.done[L], view: S.view });
  }
  return out;
});
for (const r of log) { check(!r.stuck, `lesson ${r.lesson} stuck at step ${r.stuck}`); if (r.done !== undefined) check(r.done && r.view === 'home', `lesson ${r.lesson} did not complete`); }

const wrong = await page.evaluate(async () => {
  const M = window.__mc, S = M.S, sleep = ms => new Promise(r => setTimeout(r, ms));
  M.startLesson(1); document.getElementById('nextBtn').click(); document.getElementById('nextBtn').click();
  M.press(62); const line = document.getElementById('rulinLine').innerText; const glow = document.querySelectorAll('.key.glow').length; const len = S.drill.items.length;
  M.press(60); await sleep(600);
  return { line, glow, grew: S.drill.items.length === len + 1, advanced: S.drill.idx === 1, miss: M.P.misses['find:0'] };
});
check(wrong.line.includes('D'), 'wrong-answer line should name the pressed key');
check(wrong.glow > 0, 'correct key should glow after a miss');
check(wrong.grew && wrong.advanced, 'missed item should repeat later and the drill should advance');
check(wrong.miss >= 1, 'miss should be recorded for review');

const misc = await page.evaluate(async () => {
  const M = window.__mc, S = M.S, sleep = ms => new Promise(r => setTimeout(r, ms));
  M.home(); M.press(72, 0.5); M.release(72); // velocity path (MIDI) must not error
  M.startPractice(); const practice = S.drill.items.length;
  M.songbook(); const songs = document.querySelectorAll('[data-song]').length / 3;
  M.playSong('ode', 2); M.press(64); M.release(64); M.press(60); const songLine = document.getElementById('rulinLine').innerText;
  M.studio(); M.press(60); M.release(60); await sleep(80); M.press(66); M.release(66);
  const notes = S.write.notes.length;
  await sleep(80); M.midiMessage({ data: new Uint8Array([0x90, 64, 90]) }); M.midiMessage({ data: new Uint8Array([0x80, 64, 0]) });
  for (let i = 0; i < 100 && M.samplesLoaded() < 13; i++) await sleep(100);
  return { practice, songs, songLine, notes, midiNotes: S.write.notes.length, svg: !!document.getElementById('sheetSvg'), samples: M.samplesLoaded() };
});
check(misc.practice >= 4, 'practice should assemble items');
check(misc.songs === 7, `songbook should list 7 tunes, got ${misc.songs}`);
check(misc.songLine.includes('E4'), 'song wrong press should name the boxed note');
check(misc.notes === 2 && misc.svg, 'studio should record notes and render the sheet');
check(misc.midiNotes === 3, 'a MIDI note on/off pair should write a note like a key press');
check(misc.samples === 13, `all 13 piano samples should decode, got ${misc.samples}`);

await browser.close();
check(errors.length === 0, 'console errors: ' + errors.join(' | '));
if (failures.length) { console.error('FAIL\n' + failures.map(f => '  - ' + f).join('\n')); process.exit(1); }
console.log('OK: all lessons complete, corrections, practice, songbook and studio verified');
