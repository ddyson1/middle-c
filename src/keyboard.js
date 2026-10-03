// On-screen keyboard: builds keys for the current range, handles pointer and
// computer-key input, and routes presses to the lesson engine or the studio.
import { $, isBlack, fullName, SHARP, FLAT, NOTE_COLOR } from './utils.js';
import { S } from './state.js';
import { playNote } from './audio.js';
import { stepPress, colorsOn } from './engine.js';
import { writePress, writeRelease } from './studio.js';

export let keyEls={};
let builtRange='';
export const keysEl=$('keys');
export function setRange(r){ S.range=r; buildKeys(); }
export function buildKeys(){
  let [lo,hi]=S.range; if(window.innerWidth<700 && hi-lo>24){ lo=Math.max(lo, hi-24); }
  builtRange=lo+'-'+hi; keysEl.innerHTML=''; keyEls={};
  const whites=[]; for(let m=lo;m<=hi;m++) if(!isBlack(m%12)) whites.push(m); const n=whites.length;
  const mk=(m,cls)=>{ const b=document.createElement('button'); b.type='button'; b.className='key '+cls; b.dataset.midi=m; b.tabIndex=-1; b.setAttribute('aria-label', fullName(m)+(m===60?', middle C':'')); const pc=m%12;
    b.innerHTML=(m===60?'<span class="dot"></span>':'')+`<span class="lab">${isBlack(pc)?`${SHARP[pc]}<br>${FLAT[pc]}`:SHARP[pc]}</span>`+`<span class="fing"></span>`+(cls==='w'?`<span class="band" style="background:${NOTE_COLOR[pc]}"></span>`:''); keyEls[m]=b; return b; };
  whites.forEach((m,i)=>{ const b=mk(m,'w'); b.style.left=`calc(${i} * 100% / ${n} + var(--key-gap) / 2)`; b.style.width=`calc(100% / ${n} - var(--key-gap))`; keysEl.appendChild(b); });
  for(let m=lo;m<=hi;m++) if(isBlack(m%12)){ const i=whites.indexOf(m-1); const b=mk(m,'b'); b.style.left=`calc(${i+1} * 100% / ${n} - 100% / ${n} * 0.31)`; b.style.width=`calc(100% / ${n} * 0.62)`; keysEl.appendChild(b); }
  if(keyEls[lo]) keyEls[lo].tabIndex=0;
  S.octaveShift=0; keysEl.classList.toggle('labels', S.names && S.view!=='lesson' && S.view!=='practice'); keysEl.classList.toggle('colors', colorsOn());
  $('mapnote').textContent=`Keys shown: ${fullName(lo)} to ${fullName(hi)}. The dot marks middle C.`;
}
export function mark(m,cls,ms){ const el=keyEls[m]; if(!el) return; el.classList.add(cls); if(ms) setTimeout(()=>el.classList.remove(cls),ms); }
export function unmarkAll(cls){ Object.values(keyEls).forEach(el=>el.classList.remove(cls)); }
export function label(ms,on){ ms.forEach(m=>{ const el=keyEls[m]; if(el) el.classList.toggle('labeled', on); }); }
export function fing(m,f){ const el=keyEls[m]; if(el) el.querySelector('.fing').textContent=f; }
export function clearFings(){ Object.values(keyEls).forEach(el=>{ el.querySelector('.fing').textContent=''; }); }
function down(m,on){ const el=keyEls[m]; if(el) el.classList.toggle('down',on); }
const activePointers={};
keysEl.addEventListener('pointerdown',e=>{ const k=e.target.closest('.key'); if(!k) return; e.preventDefault(); const m=+k.dataset.midi; activePointers[e.pointerId]=m; press(m); });
const endPointer=e=>{ const m=activePointers[e.pointerId]; if(m!=null){ delete activePointers[e.pointerId]; release(m); } };
window.addEventListener('pointerup',endPointer); window.addEventListener('pointercancel',endPointer);
keysEl.addEventListener('keydown',e=>{ const k=e.target.closest('.key'); if(!k) return; if(e.key==='Enter'||e.key===' '){ e.preventDefault(); if(!e.repeat) press(+k.dataset.midi); } });
keysEl.addEventListener('keyup',e=>{ const k=e.target.closest('.key'); if(!k) return; if(e.key==='Enter'||e.key===' ') release(+k.dataset.midi); });
const KEYMAP={a:0,w:1,s:2,e:3,d:4,f:5,t:6,g:7,y:8,h:9,u:10,j:11,k:12,o:13,l:14,p:15,';':16,"'":17}; const heldKeys={};
document.addEventListener('keydown',e=>{ if(e.metaKey||e.ctrlKey||e.altKey) return; if(e.target.matches&&e.target.matches('select, input, textarea, button')) return;
  const key=e.key.toLowerCase(); const [lo,hi]=builtRange.split('-').map(Number);
  if(key==='z'||key==='x'){ if(e.repeat) return; const max=Math.floor((hi-lo)/12); S.octaveShift=Math.max(0,Math.min(max,S.octaveShift+(key==='x'?1:-1))); return; }
  if(key in KEYMAP){ e.preventDefault(); if(e.repeat) return; const m=lo+12*S.octaveShift+KEYMAP[key]; if(m>=lo&&m<=hi){ heldKeys[key]=m; press(m); } } });
document.addEventListener('keyup',e=>{ const key=e.key.toLowerCase(); if(heldKeys[key]!=null){ release(heldKeys[key]); delete heldKeys[key]; } });

export function press(m,vel){ playNote(m,null,null,vel); down(m,true); if(S.view==='lesson'||S.view==='practice'||S.view==='song') stepPress(m); else if(S.view==='studio') writePress(m); }
export function release(m){ down(m,false); if(S.view==='studio') writeRelease(m); if(S.play) S.play.held.delete(m); }
