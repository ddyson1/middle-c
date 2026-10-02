// Lesson flow: home, show steps, drills, play-a-tune passes, practice, songbook.
import { SHARP, FLAT, isBlack, fullName, shortName, rand, shuffle, sleep, $, NOTE_COLOR, midiOfD, store } from './utils.js';
import { S, P, saveP } from './state.js';
import { LESSONS, TUNES } from './data.js';
import { audio, playNote, click, setSampled } from './audio.js';
import { tuneSVG, staffSingle } from './notation.js';
import { setRange, keysEl, keyEls, mark, unmarkAll, label } from './keyboard.js';
import { studio, renderSheet, stopMetro } from './studio.js';

const doneCount=()=>Object.keys(P.done).filter(k=>P.done[k]).length;
const nextLesson=()=>{ for(let i=1;i<=LESSONS.length;i++) if(!P.done[i]) return i; return null; };

// ---------- rendering helpers ----------
export const view=$('view');
// Rulin is text only. expr is kept on the callers for a possible future avatar, but nothing renders it.
export function rulinRow(line, acts, expr){ return `<div class="rulin" id="rulin"><p id="rulinLine">${line}</p><div class="acts" id="rulinActs">${acts||''}</div></div>`; }
export function say(line, expr, acts){ const p=$('rulinLine'); if(p) p.innerHTML=line; const a=$('rulinActs'); if(a&&acts!=null) a.innerHTML=acts; }
export function setTop(sub, prog, actions){ $('instrument').hidden = ['home','settings','songbook'].includes(S.view); $('subtitle').textContent=sub||''; $('progress').hidden=!prog; if(prog){ $('progBar').style.width=(prog[0]*100/prog[1])+'%'; $('progText').textContent=`Step ${prog[0]} of ${prog[1]}`; } $('topActions').innerHTML=actions||''; }
function skinSelect(){ return `<select id="skinSel" aria-label="Theme">${['clean:Clean light','arcade:Arcade','primary:Primary shapes','candy:Color-coded keys','chalk:Chalkboard'].map(o=>{const [v,l]=o.split(':'); return `<option value="${v}"${v===S.skin?' selected':''}>${l}</option>`;}).join('')}</select>`; }

// ---------- home ----------
function dueCount(){ return Object.values(P.misses).filter(v=>v>0).length; }
function unlockedTunes(){ return LESSONS.filter((L,i)=>P.done[i+1]).map(L=>L.tune); }
export function home(){
  S.view='home'; S.token++; S.play=null; S.drill=null; stopMetro();
  setTop('', null, `<button class="btn ghost" id="settingsBtn" type="button">Settings</button>`);
  const nx=nextLesson(), dc=doneCount();
  let greet;
  if(dc===0) greet=`Hi, I’m Rulin. We’ll start by finding one key, C, and by the end of today you’ll play a tune with three notes. About five minutes.`;
  else if(nx) greet=`Welcome back. Today: ${LESSONS[nx-1].name}, ending with ${TUNES[LESSONS[nx-1].tune].title}. About five minutes.`;
  else greet=`You’ve finished the path. Keep the notes fresh in Practice, play through the Songbook, or try anything in the Studio.`;
  const due=dueCount();
  const sub = dc>0 && nx ? `Last time: ${LESSONS[nx-2].name}.${due?` ${due} ${due===1?'note is':'notes are'} due for review.`:''}` : '';
  const rows=LESSONS.map((L,i)=>{ const n=i+1, done=!!P.done[n], isNext=n===nx, locked=!done&&!isNext;
    return `<li class="${isNext?'next':locked?'locked':''}"><span class="mark ${done?'done':isNext?'next':''}">${done?'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>':n}</span><span><span class="t">${L.name}</span><span class="s">${done?`Done. Unlocked: ${TUNES[L.tune].title}`:isNext?`Up next. Ends with ${TUNES[L.tune].title}`:`Ends with ${TUNES[L.tune].title}`}</span></span>${done?`<button class="btn ghost" data-redo="${n}" type="button" style="margin-left:auto">Redo</button>`:''}</li>`; }).join('');
  view.innerHTML=`
  <div class="card hero"><div class="lead"><p>${greet}</p>${sub?`<p class="muted small" style="margin-top:8px;font-size:15px">${sub}</p>`:''}</div>${nx?`<button class="btn big" id="startBtn" type="button">${dc?'Continue with lesson '+nx:'Start lesson 1'}</button>`:''}</div>
  <div class="cols">
    <section class="card path"><h2 style="margin:0 10px 8px">Your path</h2><ol>${rows}</ol></section>
    <div class="side">
      <button class="card" id="practiceBtn" type="button"${dc?'':' disabled'}><b>Practice</b><span>${dc?(due?`${due} ${due===1?'note':'notes'} you missed, plus a quick mix of what you know. About two minutes.`:'A quick mix of everything so far. About two minutes.'):'Opens after your first lesson.'}</span></button>
      <button class="card" id="songbookBtn" type="button"${dc?'':' disabled'}><b>Songbook</b><span>${dc?`${dc} ${dc===1?'tune':'tunes'} unlocked. Play with or without help.`:'Tunes you finish a lesson with land here.'}</span></button>
      <button class="card" id="studioBtn" type="button"><b>Studio</b><span>Play anything and watch it written as sheet music.</span></button>
    </div>
  </div>`;
  if(nx) $('startBtn').onclick=()=>startLesson(nx);
  view.querySelectorAll('[data-redo]').forEach(b=>b.onclick=()=>startLesson(+b.dataset.redo));
  $('practiceBtn').onclick=startPractice; $('songbookBtn').onclick=songbook; $('studioBtn').onclick=studio;
  $('settingsBtn').onclick=settings;
  setRange([60,72]); keysEl.classList.toggle('labels', S.names);
}
let sampledOn=true; // session-only A/B knob, not saved
function settings(){
  S.view='settings'; setTop('Settings', null, `<button class="btn ghost" id="homeBtn" type="button">Home</button>`); $('homeBtn').onclick=home;
  view.innerHTML=`<div class="card settings">
    <label>Theme ${skinSelect()}</label>
    <label>Note names on keys in Songbook and Studio <input type="checkbox" id="namesChk"${S.names?' checked':''}></label>
    <label>Sampled piano, uncheck to hear the old synth <input type="checkbox" id="sampChk"${sampledOn?' checked':''}></label>
    <label>Start the path over <button class="btn ghost" id="resetBtn" type="button">Reset progress</button></label>
    <p class="muted small" style="margin:0">Lessons never show note names on the keys after they have been taught, so the names have to stick on their own.</p>
    <p class="muted small" style="margin:0">Piano sound: Salamander Grand Piano by Alexander Holm, CC BY 3.0.</p>
  </div>`;
  $('skinSel').onchange=e=>setSkin(e.target.value);
  $('namesChk').onchange=e=>{ S.names=e.target.checked; store.set('names',S.names); keysEl.classList.toggle('labels',S.names); };
  $('sampChk').onchange=e=>{ sampledOn=e.target.checked; setSampled(sampledOn); playNote(60,.9); };
  $('resetBtn').onclick=()=>{ if(confirm('Clear all lesson progress and review items?')){ P.done={}; P.misses={}; saveP(); home(); } };
}
export function setSkin(s){ S.skin=s; document.body.dataset.skin=s; store.set('skin',s); document.body.style.setProperty('--band-op', s==='candy'?1:0); if(S.view==='lesson'||S.view==='practice'||S.view==='song') renderStep(); if(S.view==='studio') renderSheet(); }

// ---------- lesson engine ----------
export function startLesson(n){
  audio(); S.view='lesson'; S.lesson=n; S.stepIdx=0; S.token++;
  const L=LESSONS[n-1]; setRange(L.range); keysEl.classList.remove('labels');
  runStep();
}
function exitBtn(){ return `<button class="btn ghost" id="exitBtn" type="button">Exit lesson</button>`; }
function runStep(){
  const L=LESSONS[S.lesson-1]; S.step=L.steps[S.stepIdx]; S.token++; S.drill=null; S.play=null; S.locked=false;
  unmarkAll('glow'); unmarkAll('next'); unmarkAll('labeled');
  setTop(`Lesson ${S.lesson}: ${L.name}`, [S.stepIdx+1, L.steps.length], exitBtn()); $('exitBtn').onclick=home;
  renderStep();
}
export function nextStep(){ const L=LESSONS[S.lesson-1]; if(S.stepIdx<L.steps.length-1){ S.stepIdx++; runStep(); } else home(); }
function renderStep(){
  const st=S.step; if(!st) return;
  if(st.t==='show') renderShow(st);
  else if(st.t==='drill') renderDrill();
  else if(st.t==='play') renderPlay();
  else if(st.t==='done') renderDone(st);
}
function renderShow(st){
  let visual='';
  if(st.staff) visual=`<div class="single" id="showStaff">${staffSingle(st.staff.clef,st.staff.d,st.staff.acc)}</div>`;
  if(st.grandDemo){ const t=TUNES.odeBoth; visual=`<div class="staffbox">${tuneSVG(t,0,-1,{names:false,width:Math.min(900,view.clientWidth-60),font:'Figtree, sans-serif'})}</div>`; }
  if(st.demoTune){ const t=TUNES[st.demoTune]; visual=`<div class="staffbox">${tuneSVG(t,0,-1,{names:true,width:Math.min(900,view.clientWidth-60),font:'Figtree, sans-serif'})}</div>`; }
  view.innerHTML=`<div class="card stage ${visual?'':''}"><div class="center"><h1>${st.title}</h1><p>${st.text}</p></div>${visual}</div>${rulinRow(st.line, `${(st.demo||st.demoRead||st.demoTune||st.demoClick)?'<button class="btn ghost" id="showMe" type="button">Show me</button>':''}<button class="btn" id="nextBtn" type="button">Got it, next</button>`, st.expr||'neutral')}`;
  (st.glow||[]).forEach(m=>mark(m,'glow')); label(st.labels||[], true);
  const demo=async()=>{
    const tok=S.token; const c=audio(); if(!c) return;
    if(st.demoClick){ const t=c.currentTime+.1; for(let i=0;i<8;i++) click(t+i*.6, i%4===0); }
    if(st.demoTune){ const t=TUNES[st.demoTune], e8=.3, t0=c.currentTime+.15; if(st.click!==false) for(let b=0;b<8;b++) click(t0+b*e8*2, b%4===0);
      for(const [i,e] of t.ev.slice(0,st.demoUpTo||t.ev.length).entries()){ e.notes.forEach(n=>playNote(n.m, e.len*e8+.1, t0+e.pos*e8)); }
      for(const [i,e] of t.ev.slice(0,st.demoUpTo||t.ev.length).entries()){ await sleep(i===0?150:0); if(tok!==S.token) return; const wait=(t0+e.pos*e8-c.currentTime)*1000; if(wait>0) await sleep(wait); if(tok!==S.token) return; e.notes.forEach(n=>mark(n.m,'lit',e.len*e8*1000*.8)); } return; }
    if(st.demoRead){ const clef=st.clefDemo||'treble'; for(const d of st.demoRead){ if(tok!==S.token) return; const m=midiOfD(d); $('showStaff').innerHTML=staffSingle(clef,d); playNote(m,.8); mark(m,'lit',450); await sleep(600); } return; }
    for(const m of (st.demo||[])){ if(tok!==S.token) return; playNote(m,.8); mark(m,'lit',450); await sleep(560); }
  };
  if($('showMe')) $('showMe').onclick=demo;
  $('nextBtn').onclick=nextStep;
  if(st.demo||st.demoRead) setTimeout(()=>{ if(S.step===st) demo(); }, 500);
}
// ---------- drills ----------
function renderDrill(){
  const st=S.step;
  if(!S.drill){ S.drill={items:st.items.map(i=>({...i})), idx:0, missed:false, extraAdded:{}, resultsFor: st.key||null}; }
  const D=S.drill, it=D.items[D.idx];
  const dots=D.items.map((_,i)=>`<span class="${i<D.idx?'on':i===D.idx?'cur':''}"></span>`).join('');
  let stageHTML='';
  if(it.t==='find'){ const nmx = isBlack(it.pc) ? (it.useFlat?FLAT[it.pc]:SHARP[it.pc]) : SHARP[it.pc]; it.shown=nmx;
    stageHTML=`<div class="bigprompt"><div class="bigletter${nmx.length>1?' two':''}" aria-hidden="true" style="${S.skin==='candy'&&!isBlack(it.pc)?'color:'+NOTE_COLOR[it.pc]:''}">${nmx}</div><div><p class="instr">Press ${nmx}</p><div class="dots" aria-label="Item ${D.idx+1} of ${D.items.length}">${dots}</div></div></div>`; }
  else if(it.t==='name'){ const pool=(S.lesson?LESSONS[S.lesson-1].steps.filter(s=>s.t==='drill').flatMap(s=>s.items):[]).filter(x=>x.t==='name').map(x=>x.m%12); const set=[...new Set([it.m%12,...pool,0,2,4,5,7,9,11])].filter(pc=>!isBlack(pc)); const opts=shuffle([it.m%12,...shuffle(set.filter(pc=>pc!==it.m%12)).slice(0,3)]); it.opts=opts;
    stageHTML=`<div><p class="instr">Which key is lit?</p><div class="opts" id="opts">${opts.map(pc=>`<button type="button" data-pc="${pc}">${SHARP[pc]}</button>`).join('')}</div><div class="dots">${dots}</div></div>`; }
  else if(it.t==='read'){ stageHTML=`<div class="bigprompt"><div class="single">${staffSingle(it.clef,it.d,it.acc)}</div><div><p class="instr">Which key is this?</p><p class="muted" style="margin:6px 0 0">Octave counts.</p><div class="dots">${dots}</div></div></div>`; }
  else if(it.t==='echo'){ stageHTML=`<div><p class="instr" id="echoText">Listen</p><div class="dots" id="echoDots">${it.seq.map(()=>'<span></span>').join('')}</div><div class="dots">${dots}</div></div>`; }
  view.innerHTML=`<div class="card stage" id="stageCard">${stageHTML}</div>${rulinRow(st.line,'',S.lesson?'neutral':'neutral')}`;
  unmarkAll('glow'); unmarkAll('next'); unmarkAll('labeled'); S.locked=false;
  if(it.t==='name'){ mark(it.m,'next'); $('opts').querySelectorAll('button').forEach(b=>b.onclick=()=>nameAnswer(+b.dataset.pc)); }
  if(it.t==='echo') echoPlay(it);
}
export function targetMidi(it){ if(it.t==='read'){ let m=midiOfD(it.d); if(it.acc==='sharp') m++; if(it.acc==='flat') m--; return m; } return null; }
function recordMiss(it,miss){ if(!it.key||it.key==='echo') return; P.misses[it.key]=Math.max(0,(P.misses[it.key]||0)+(miss?1:-1)); saveP(); }
function advanceDrill(){
  const D=S.drill; recordMiss(D.items[D.idx], D.missed);
  if(D.missed && !D.extraAdded[D.items[D.idx].key]){ D.extraAdded[D.items[D.idx].key]=true; D.items.splice(Math.min(D.items.length, D.idx+3), 0, {...D.items[D.idx]}); }
  D.missed=false; D.idx++;
  if(D.idx>=D.items.length){ if(S.view==='practice') practiceDone(); else nextStep(); } else renderDrill();
}
function wrongShake(){ const c=$('stageCard'); if(!c) return; c.classList.remove('wrong'); void c.offsetWidth; c.classList.add('wrong'); }
export function stepPress(m){
  if(S.play) return playPress(m);
  const D=S.drill; if(!D) return; const it=D.items[D.idx];
  if(it.t==='name') return;
  if(it.t==='echo'){ return echoPress(it,m); }
  const ok = it.t==='find' ? m%12===it.pc : m===targetMidi(it);
  if(ok){ mark(m,'good',260); unmarkAll('glow'); say(D.missed?'There it is. On we go.':rand(['Yes.','Good.','That’s it.','Right.']), 'happy'); setTimeout(()=>{ if(S.drill===D) advanceDrill(); }, D.missed?500:260); return; }
  // wrong: correct by doing
  D.missed=true; mark(m,'bad',450); wrongShake();
  const targets = it.t==='find' ? Object.keys(keyEls).map(Number).filter(x=>x%12===it.pc) : [targetMidi(it)];
  targets.forEach(t=>mark(t,'glow'));
  let msg;
  if(it.t==='find'){ msg=`That’s ${shortName(m)}. ${HINT(it.pc)} It’s lit now. Press it and we’ll keep going.`; }
  else { const t=targetMidi(it); msg = m%12===t%12 ? `Right letter, wrong octave. ${fullName(t)}${t===60?' is middle C, the key with the dot':''} is lit. Press it.` : `That’s ${fullName(m)}. This note is ${fullName(t)}${t===60?', middle C':''}. It’s lit. Press it.`; }
  say(msg,'think');
}
export function HINT(pc){ return {0:'C is the white key just left of the two black keys.',2:'D sits between the two black keys.',4:'E is just right of the two black keys.',5:'F is just left of the three black keys.',7:'G is between the first and second of the three black keys.',9:'A is between the second and third of the three black keys.',11:'B is just right of the three black keys.',1:'C sharp and D flat share the first black key of the two.',3:'D sharp and E flat share the second black key of the two.',6:'F sharp and G flat share the first black key of the three.',8:'G sharp and A flat share the middle black key of the three.',10:'A sharp and B flat share the last black key of the three.'}[pc]; }
function nameAnswer(pc){
  const D=S.drill, it=D.items[D.idx]; const btns=[...$('opts').querySelectorAll('button')];
  if(pc===it.m%12){ btns.forEach(b=>{ if(+b.dataset.pc===pc) b.classList.add('good'); b.disabled=true; }); say(D.missed?'That’s the one.':rand(['Yes.','Good.','Right.']),'happy'); setTimeout(()=>{ if(S.drill===D) advanceDrill(); },400); }
  else { D.missed=true; wrongShake(); btns.forEach(b=>{ if(+b.dataset.pc===pc){ b.classList.add('bad'); b.disabled=true; } if(+b.dataset.pc===it.m%12) b.classList.add('glow'); }); say(`Not ${SHARP[pc]}. ${HINT(it.m%12)} Pick it.`,'think'); }
}
async function echoPlay(it){
  const tok=S.token; S.locked=true; it.idx=0; const txt=$('echoText'); if(txt) txt.textContent='Listen';
  await sleep(500); for(const m of it.seq){ if(tok!==S.token) return; playNote(m,.8); mark(m,'lit',380); await sleep(520); }
  if(tok!==S.token) return; S.locked=false; if($('echoText')) $('echoText').textContent='Your turn';
}
function echoPress(it,m){
  if(S.locked) return; const want=it.seq[it.idx];
  if(m===want){ mark(m,'good',220); it.idx++; const ds=$('echoDots'); if(ds) ds.children[it.idx-1].classList.add('on'); if(it.idx===it.seq.length){ say('Good ear.','happy'); setTimeout(()=>{ if(S.drill) advanceDrill(); },500); } }
  else { S.drill.missed=true; mark(m,'bad',400); wrongShake(); say(`That was ${shortName(m)}. Listen once more and try again.`,'think'); it.idx=0; const ds=$('echoDots'); if(ds) [...ds.children].forEach(x=>x.classList.remove('on')); setTimeout(()=>{ if(S.drill) echoPlay(it); },700); }
}
// ---------- play a tune ----------
function renderPlay(){
  const st=S.step, tune=TUNES[st.tune||S.songTune];
  if(!S.play) S.play={tune, pass:1, passes:st.passes||3, idx:0, held:new Set(), got:new Set(), click:!!st.click, misses:0};
  const Pl=S.play; const passNames=st.passNames||['Pass 1: lights and names','Pass 2: notation only','Pass 3: from memory'];
  const showStaff = Pl.pass<3, lights = Pl.pass===1, names = Pl.pass===1;
  const pills=Array.from({length:Pl.passes},(_,i)=>`<span class="pill${i+1===Pl.pass?' on':''}">${passNames[i]||'Pass '+(i+1)}</span>`).join('');
  const width=Math.min(1000, Math.max(360, view.clientWidth-60));
  const staff = showStaff ? `<div class="staffbox">${tuneSVG(tune, Pl.idx, Pl.idx, {names, width, font:'Figtree, sans-serif'})}</div>` : `<div class="center"><p class="instr">${tune.title}, from memory</p><p>${Pl.idx} of ${tune.ev.length} notes played</p></div>`;
  view.innerHTML=`<div class="card stage" id="stageCard" style="padding:20px 24px 14px"><div class="tunehead"><b>${tune.title}</b><div class="pills">${pills}</div></div>${staff}</div>${rulinRow(st.line, `<button class="btn ghost" id="hearBtn" type="button">Hear it first</button>${Pl.click?`<button class="btn ghost" id="clickBtn" type="button" aria-pressed="true">Click on</button>`:''}`,'neutral')}`;
  $('hearBtn').onclick=()=>hearTune(tune);
  if($('clickBtn')) $('clickBtn').onclick=()=>{ Pl.clickOn=!Pl.clickOn; $('clickBtn').setAttribute('aria-pressed',String(Pl.clickOn)); $('clickBtn').textContent=Pl.clickOn?'Click on':'Click off'; if(Pl.clickOn) startClick(tune); else stopClick(); };
  if(Pl.click && Pl.clickOn!==false){ Pl.clickOn=true; startClick(tune); }
  cueNext();
}
let clickTimer=null;
function startClick(tune){ const c=audio(); if(!c) return; stopClick(); const beat=.6; let t0=c.currentTime+.1, b=0; clickTimer=setInterval(()=>{ while(t0+b*beat < c.currentTime+.15){ click(t0+b*beat, b%tune.beats===0); b++; } },40); }
function stopClick(){ clearInterval(clickTimer); clickTimer=null; }
export function cueNext(){
  const Pl=S.play; unmarkAll('next'); unmarkAll('labeled'); if(!Pl) return;
  const e=Pl.tune.ev[Pl.idx]; if(!e) return;
  if(Pl.pass===1){ e.notes.forEach(n=>{ mark(n.m,'next'); label([n.m],true); }); }
}
function playPress(m){
  const Pl=S.play; if(!Pl || Pl.finished) return; const e=Pl.tune.ev[Pl.idx]; if(!e) return;
  const want=e.notes.map(n=>n.m);
  if(want.includes(m)){
    Pl.got.add(m); mark(m,'good',240);
    if(want.every(x=>Pl.got.has(x))){ Pl.got=new Set(); Pl.idx++; if(Pl.idx>=Pl.tune.ev.length) return passDone(); if(Pl.pass<3){ const box=view.querySelector('.staffbox'); if(box) box.innerHTML=tuneSVG(Pl.tune,Pl.idx,Pl.idx,{names:Pl.pass===1,width:Math.min(1000,Math.max(360,view.clientWidth-60)),font:'Figtree, sans-serif'}); } else { const p=view.querySelector('.center p:last-child'); if(p) p.textContent=`${Pl.idx} of ${Pl.tune.ev.length} notes played`; } cueNext(); }
    else say(`Now add ${want.filter(x=>!Pl.got.has(x)).map(fullName).join(' and ')} with the other hand.`,'neutral');
  } else {
    Pl.misses++; mark(m,'bad',380); wrongShake();
    const names=e.notes.map(n=>fullName(n.m)).join(' and ');
    if(Pl.pass===1) say(`That’s ${shortName(m)}. The lit key is ${names}.`,'think');
    else if(Pl.pass===2){ say(`That’s ${shortName(m)}. Look at the boxed note: ${names}. ${HINT(e.notes[0].m%12)}`,'think'); }
    else { say(`That’s ${shortName(m)}. It should be ${names}. ${HINT(e.notes[0].m%12)}`,'think'); e.notes.forEach(n=>mark(n.m,'glow',900)); }
    if(S.lesson) e.notes.forEach(n=>{ if(!isBlack(n.m%12)) recordMiss({key:'find:'+(n.m%12)},true); });
  }
}
function passDone(){
  const Pl=S.play; Pl.finished=true; stopClick(); unmarkAll('next'); unmarkAll('labeled');
  if(Pl.pass<Pl.passes){ const nxt=Pl.pass+1; const msg = nxt===2 ? 'All the way through. Now the same tune with just the notation: the box shows where you are.' : 'Now from memory. No staff, no lights. I’ll help if you get stuck.';
    say(msg,'happy',`<button class="btn" id="nextPass" type="button">Pass ${nxt}</button><button class="btn ghost" id="againPass" type="button">Same pass again</button>`);
    $('nextPass').onclick=()=>{ Pl.pass=nxt; Pl.idx=0; Pl.finished=false; Pl.got=new Set(); renderPlay(); };
    $('againPass').onclick=()=>{ Pl.idx=0; Pl.finished=false; Pl.got=new Set(); renderPlay(); };
  } else {
    if(S.view==='song'){ say(`${Pl.tune.title}, done. ${Pl.misses?`${Pl.misses} slip${Pl.misses===1?'':'s'} along the way.`:'Clean run.'}`,'happy',`<button class="btn" id="againTune" type="button">Play again</button><button class="btn ghost" id="backSong" type="button">Songbook</button>`); $('againTune').onclick=()=>{ S.play=null; renderPlay(); }; $('backSong').onclick=songbook; return; }
    say(`That’s ${Pl.tune.title} from memory.${Pl.misses?` ${Pl.misses} slip${Pl.misses===1?'':'s'}, which is normal.`:' Clean.'}`,'happy',`<button class="btn" id="finishBtn" type="button">Finish lesson</button>`);
    $('finishBtn').onclick=nextStep;
  }
}
function hearTune(tune){ const c=audio(); if(!c) return; const e8=.3, t0=c.currentTime+.15, tok=S.token; tune.ev.forEach(e=>e.notes.forEach(n=>playNote(n.m,e.len*e8+.1,t0+e.pos*e8))); tune.ev.forEach(e=>{ setTimeout(()=>{ if(tok===S.token) e.notes.forEach(n=>mark(n.m,'lit',e.len*e8*800)); }, (t0+e.pos*e8-c.currentTime)*1000); }); }
// ---------- done ----------
function renderDone(st){
  const L=LESSONS[S.lesson-1]; P.done[S.lesson]=true; saveP();
  const missedNames=[...new Set(Object.keys(P.misses).filter(k=>P.misses[k]>0&&k.startsWith('find:')).map(k=>SHARP[+k.split(':')[1]]))].join(', ');
  const taught={1:'C, D, E',2:'F, G, A, B',3:'Quarter and half notes',4:'Treble staff, C to G',5:'Sharps and flats',6:'Bass staff',7:'Both hands'}[S.lesson];
  setTop(`Lesson ${S.lesson}: ${L.name}`, [L.steps.length,L.steps.length], exitBtn()); $('exitBtn').onclick=home;
  view.innerHTML=`<div class="cols"><section class="card" style="flex:1 1 420px"><h1>Lesson ${S.lesson} done</h1><p style="margin:14px 0 0;font-size:18px">${L.name}, including ${TUNES[L.tune].title} all the way through.</p>
    <div class="summary"><div><span>Learned</span><b>${taught}</b></div><div><span>Review next time</span><b>${missedNames||'Nothing yet'}</b></div><div><span>Unlocked</span><b>${TUNES[L.tune].title}</b></div></div>
    <div class="grp" style="margin-top:26px"><button class="btn big" id="homeBtn2" type="button">Back home</button><button class="btn ghost" id="playAgain" type="button">Play ${TUNES[L.tune].title} again</button></div></section>
    <section class="card" style="flex:1 1 300px"><p style="margin:0;font-size:19px">${st.line}</p></section></div>`;
  $('homeBtn2').onclick=home; $('playAgain').onclick=()=>playSong(L.tune);
}
// ---------- practice ----------
export function startPractice(){
  audio(); const doneL=LESSONS.filter((L,i)=>P.done[i+1]);
  const pool=doneL.flatMap(L=>L.steps.filter(s=>s.t==='drill').flatMap(s=>s.items)).filter(i=>i.t!=='echo');
  if(!pool.length) return;
  const due=Object.keys(P.misses).filter(k=>P.misses[k]>0);
  const dueItems=due.map(k=>pool.find(i=>i.key===k)).filter(Boolean);
  const rest=shuffle(pool.filter(i=>!due.includes(i.key)));
  const items=shuffle(dueItems.slice(0,6)).concat(rest.slice(0, Math.max(4, 10-Math.min(6,dueItems.length))));
  const lo=Math.min(...doneL.map(L=>L.range[0])), hi=Math.max(...doneL.map(L=>L.range[1]));
  S.view='practice'; S.lesson=null; S.token++; S.play=null; setRange([lo, Math.min(hi, lo+24)]); keysEl.classList.remove('labels');
  S.step={t:'drill', items, line: due.length?`A quick review. The notes you missed come first.`:`A quick mix of what you know.`};
  S.drill=null; setTop('Practice', [1,1], `<button class="btn ghost" id="exitBtn" type="button">Home</button>`); $('exitBtn').onclick=home; $('progress').hidden=true;
  renderDrill();
}
function practiceDone(){ view.innerHTML=`<div class="card stage"><div class="center"><h1>Practice done</h1><p>${dueCount()?`${dueCount()} ${dueCount()===1?'note':'notes'} still on the review list.`:'Nothing left on the review list.'}</p></div></div>${rulinRow('Short and regular beats long and rare. See you tomorrow.','<button class="btn" id="homeBtn3" type="button">Back home</button>','happy')}`; S.drill=null; $('homeBtn3').onclick=home; }
// ---------- songbook ----------
export function songbook(){
  S.view='songbook'; S.play=null; S.token++; stopClick(); setTop('Songbook', null, `<button class="btn ghost" id="homeBtn" type="button">Home</button>`); $('homeBtn').onclick=home;
  const tunes=unlockedTunes();
  view.innerHTML=`<div class="card"><div class="songs">${tunes.map(k=>`<div class="row"><div><b>${TUNES[k].title}</b><div class="muted small">${TUNES[k].twoHands?'Two hands':TUNES[k].lhOnly?'Left hand':'Right hand'}, ${Math.ceil(TUNES[k].total/(TUNES[k].beats*2))} bars</div></div><div class="grp"><button class="btn ghost" data-song="${k}" data-pass="1" type="button">With lights</button><button class="btn ghost" data-song="${k}" data-pass="2" type="button">Notation</button><button class="btn" data-song="${k}" data-pass="3" type="button">From memory</button></div></div>`).join('')||'<p class="muted">Finish a lesson to unlock its tune.</p>'}</div>`;
  view.querySelectorAll('[data-song]').forEach(b=>b.onclick=()=>playSong(b.dataset.song,+b.dataset.pass));
  keysEl.classList.toggle('labels', S.names);
}
export function playSong(k,pass){
  audio(); const t=TUNES[k]; S.view='song'; S.lesson=null; S.token++; setRange(t.range); keysEl.classList.toggle('labels', S.names);
  S.step={t:'play', tune:k, passes:3, click:true, line:`${t.title}. ${pass===1?'The next key lights up.':pass===2?'Follow the box on the staff.':'From memory. Press Hear it first if you want a reminder.'}`};
  S.play={tune:t, pass:pass||1, passes:pass||1, idx:0, held:new Set(), got:new Set(), click:true, misses:0}; if(pass>1) S.play.passes=pass;
  setTop('Songbook', null, `<button class="btn ghost" id="exitBtn" type="button">Songbook</button>`); $('exitBtn').onclick=songbook;
  renderPlay();
}
