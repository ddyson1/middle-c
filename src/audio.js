// Oscillator synth and metronome click. Sampled piano replaces playNote later (roadmap 3).
let ac, master;
export function audio(){
  if(!ac){ const C=window.AudioContext||window.webkitAudioContext; if(!C) return null; ac=new C();
    const comp=ac.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4;
    master=ac.createGain(); master.gain.value=.55; master.connect(comp); comp.connect(ac.destination); }
  if(ac.state==='suspended') ac.resume(); return ac;
}
export function playNote(m,dur,when,vel){
  const c=audio(); if(!c) return; const f=440*Math.pow(2,(m-69)/12), t=when||c.currentTime; dur=dur||Math.max(.9,2.4-(m-48)*0.025);
  // vel 0..1 from MIDI; on-screen and computer-key presses omit it and play at full level
  const amp=vel==null?1:.2+.8*Math.max(0,Math.min(1,vel));
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(.34*amp,t+.012); g.gain.exponentialRampToValueAtTime(.13*amp,t+.3); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.setValueAtTime(Math.min(6000,f*6),t); lp.frequency.exponentialRampToValueAtTime(Math.max(400,f*1.8),t+dur*.7); lp.connect(g); g.connect(master);
  [[1,.6,'triangle'],[2,.2,'sine'],[3,.05,'sine'],[4,.02,'sine']].forEach(([h,a,type])=>{ const o=c.createOscillator(), og=c.createGain(); o.type=type; o.frequency.value=f*h*(1+(h-1)*0.0007); og.gain.value=a; o.connect(og); og.connect(lp); o.start(t); o.stop(t+dur+.05); });
}
export function click(when,accent){ const c=audio(); if(!c) return; const o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.value=accent?880:659; g.gain.setValueAtTime(0.0001,when); g.gain.exponentialRampToValueAtTime(accent?.16:.1,when+.004); g.gain.exponentialRampToValueAtTime(.0001,when+.09); o.connect(g); g.connect(master); o.start(when); o.stop(when+.1); }
