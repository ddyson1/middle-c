// Oscillator synth and metronome click. Sampled piano replaces playNote later (roadmap 3).
let ac, master;
export function audio(){
  if(!ac){ const C=window.AudioContext||window.webkitAudioContext; if(!C) return null; ac=new C();
    const comp=ac.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4;
    master=ac.createGain(); master.gain.value=.55; master.connect(comp); comp.connect(ac.destination); }
  if(ac.state==='suspended') ac.resume(); return ac;
}
export function playNote(m,dur,when){
  const c=audio(); if(!c) return; const f=440*Math.pow(2,(m-69)/12), t=when||c.currentTime; dur=dur||Math.max(.9,2.4-(m-48)*0.025);
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(.42,t+.006); g.gain.exponentialRampToValueAtTime(.14,t+.28); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.setValueAtTime(Math.min(9000,f*9),t); lp.frequency.exponentialRampToValueAtTime(Math.max(400,f*2.2),t+dur*.7); lp.connect(g); g.connect(master);
  [[1,.6,'triangle'],[2,.22,'sine'],[3,.1,'sine'],[4,.05,'sine']].forEach(([h,a,type])=>{ const o=c.createOscillator(), og=c.createGain(); o.type=type; o.frequency.value=f*h*(1+(h-1)*0.0007); og.gain.value=a; o.connect(og); og.connect(lp); o.start(t); o.stop(t+dur+.05); });
}
export function click(when,accent){ const c=audio(); if(!c) return; const o=c.createOscillator(), g=c.createGain(); o.type='square'; o.frequency.value=accent?1760:1175; g.gain.setValueAtTime(0.0001,when); g.gain.exponentialRampToValueAtTime(accent?.22:.13,when+.002); g.gain.exponentialRampToValueAtTime(.0001,when+.05); o.connect(g); g.connect(master); o.start(when); o.stop(when+.06); }
