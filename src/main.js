// Entry point: wires up the window-level bits and starts at home.
import { S, P } from './state.js';
import { LESSONS, TUNES } from './data.js';
import { press, release, buildKeys } from './keyboard.js';
import { home, startLesson, nextStep, startPractice, songbook, playSong, setSkin, targetMidi, cueNext } from './engine.js';
import { studio, layout, renderSheet } from './studio.js';

let rz; window.addEventListener('resize',()=>{ clearTimeout(rz); rz=setTimeout(()=>{ buildKeys(); if(S.view==='studio') renderSheet(); if(S.play) cueNext(); },150); });
window.__mc={S,P,LESSONS,TUNES,press,release,startLesson,home,nextStep,startPractice,songbook,playSong,studio,setSkin,layout,targetMidi};
document.body.dataset.skin=S.skin; document.body.style.setProperty('--band-op', S.skin==='candy'?1:0);
home();
