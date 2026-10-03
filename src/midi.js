// Web MIDI input: a connected keyboard plays the app exactly like the on-screen
// keys, with velocity. Notes outside the shown range still sound and still count
// in drills. No timing judgment yet (roadmap: lesson 3, once latency is reliable).
import { $ } from './utils.js';
import { press, release, keycapMode } from './keyboard.js';

export function midiMessage(e){
  const d=e.data; if(!d||d.length<3) return; const cmd=d[0]&0xF0, m=d[1], vel=d[2];
  if(cmd===0x90&&vel>0){ keycapMode(false); press(m, vel/127); }
  else if(cmd===0x80||(cmd===0x90&&vel===0)) release(m);
}
function note(access){
  const names=[...access.inputs.values()].filter(i=>i.state==='connected').map(i=>i.name||'MIDI keyboard');
  const el=$('midinote'); if(!el) return;
  el.hidden=!names.length; el.textContent=names.length?`MIDI keyboard connected: ${names.join(', ')}.`:'';
}
export function initMIDI(){
  if(!navigator.requestMIDIAccess) return;
  navigator.requestMIDIAccess().then(access=>{
    const attach=()=>{ access.inputs.forEach(i=>{ i.onmidimessage=midiMessage; }); note(access); };
    attach(); access.onstatechange=attach;
  }).catch(()=>{});
}
