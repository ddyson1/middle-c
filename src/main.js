// Entry point: wires up the window-level bits and starts at home.
import { S, P } from './state.js';
import { LESSONS, TUNES } from './data.js';
import { press, release, buildKeys } from './keyboard.js';
import { samplesLoaded } from './audio.js';
import { home, startLesson, nextStep, startPractice, songbook, playSong, targetMidi, cueNext, renderStep } from './engine.js';
import { studio, layout, renderSheet } from './studio.js';
import { initMIDI, midiMessage } from './midi.js';

let rz; window.addEventListener('resize',()=>{ clearTimeout(rz); rz=setTimeout(()=>{ buildKeys(); if(S.view==='studio') renderSheet(); if(S.play){ renderStep(); cueNext(); } },150); });
window.__mc={S,P,LESSONS,TUNES,press,release,startLesson,home,nextStep,startPractice,songbook,playSong,studio,layout,targetMidi,midiMessage,samplesLoaded};
home();
initMIDI();
