// Studio: free play written down as sheet music, with an optional metronome
// rhythm mode. Known simplifications: no beaming, rests on the top staff only,
// notes crossing a barline split with ties.
import { $ } from './utils.js';
import { S } from './state.js';
import { audio, playNote, click } from './audio.js';
import { colors, glyph, noteSVG, systemSVG, KIND, spell, yOf } from './notation.js';
import { setRange, keysEl } from './keyboard.js';
import { view, rulinRow, say, setTop, home } from './engine.js';

const W=S.write;
function nowMs(){ const c=audio(); return c?c.currentTime*1000:performance.now(); }
function eighthMs(){ return 30000/W.tempo; }
export function studio(){
  S.view='studio'; S.token++; S.play=null; S.drill=null; setTop('Studio', null, `<button class="btn ghost" id="homeBtn" type="button">Home</button>`); $('homeBtn').onclick=home;
  view.innerHTML=`<div class="toolbar"><div class="grp"><button class="btn" id="wPlay" type="button">Play back</button><button class="btn ghost" id="wUndo" type="button">Undo</button><button class="btn ghost" id="wClear" type="button">Clear</button><button class="btn ghost" id="wSave" type="button">Save image</button></div>
    <div class="grp"><div class="tempo" id="tempoGrp" hidden><span class="beats" id="beats" aria-hidden="true"><i></i><i></i><i></i><i></i></span><button class="iconbtn" id="tDown" type="button" aria-label="Slower">-</button><span id="tempoVal">${W.tempo} bpm</span><button class="iconbtn" id="tUp" type="button" aria-label="Faster">+</button><button class="btn" id="metroBtn" type="button">Start metronome</button></div>
    <div class="seg" role="group" aria-label="Notation"><button type="button" data-wmode="notes" aria-pressed="${W.mode==='notes'}">Notes only</button><button type="button" data-wmode="rhythm" aria-pressed="${W.mode==='rhythm'}">With rhythm</button></div></div></div>
    <div class="sheet" id="sheetWrap"><div id="sheet"></div></div>
    ${rulinRow('Play anything and it gets written down. Notes from middle C up go on the top staff, lower ones on the bottom.','','neutral')}`;
  setRange(window.innerWidth<700?[60,84]:[48,84]); keysEl.classList.toggle('labels', S.names);
  $('tempoGrp').hidden=W.mode!=='rhythm';
  $('metroBtn').onclick=()=>W.metro?stopMetro():startMetro();
  $('tDown').onclick=()=>{ W.tempo=Math.max(40,W.tempo-10); $('tempoVal').textContent=`${W.tempo} bpm`; };
  $('tUp').onclick=()=>{ W.tempo=Math.min(160,W.tempo+10); $('tempoVal').textContent=`${W.tempo} bpm`; };
  view.querySelectorAll('[data-wmode]').forEach(b=>b.onclick=()=>{ if(W.metro) stopMetro(); W.mode=b.dataset.wmode; view.querySelectorAll('[data-wmode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); $('tempoGrp').hidden=W.mode!=='rhythm'; renderSheet(); });
  $('wUndo').onclick=()=>{ (W.mode==='notes'?W.notes:W.rhythm).pop(); renderSheet(); };
  $('wClear').onclick=()=>{ if(W.metro) stopMetro(); if(W.mode==='notes') W.notes=[]; else W.rhythm=[]; renderSheet(); };
  $('wPlay').onclick=()=>{ const c=audio(); if(!c) return; const t=c.currentTime+.1; if(W.mode==='notes') W.notes.forEach((en,i)=>en.ms.forEach(m=>playNote(m,.9,t+i*.42))); else { const e8=eighthMs()/1000, list=W.rhythm; list.forEach((en,i)=>{ const next=list[i+1]?list[i+1].e:null; let end=en.endE!=null?en.endE:(next!=null?next:en.e+2); if(next!=null) end=Math.min(end,next); en.ms.forEach(m=>playNote(m,Math.max(.25,(end-en.e)*e8+.15),t+en.e*e8)); }); } };
  $('wSave').onclick=saveImage;
  renderSheet();
}
export function writePress(m){
  if(W.mode==='notes'){ const list=W.notes, t=performance.now(), last=list[list.length-1]; const prevTop=last?Math.max(...last.ms):null;
    if(last&&t-last.t<60&&!last.ms.includes(m)){ last.ms.push(m); last.sp.push(spell(m,null)); } else list.push({t,ms:[m],sp:[spell(m,prevTop)]}); renderSheet(); return; }
  if(!W.metro){ say('Start the metronome, then play along. You’ll hear four clicks first.','neutral'); return; }
  const list=W.rhythm, t=nowMs(), last=list[list.length-1]; let e=Math.max(0,Math.round((t-W.t0)/eighthMs()));
  if(last&&t-last.t<60&&!last.ms.includes(m)){ last.ms.push(m); last.sp.push(spell(m,null)); W.held[m]=last; renderSheet(); return; }
  if(last&&e<=last.e) e=last.e+1; const prevTop=last?Math.max(...last.ms):null;
  const entry={t,e,ms:[m],sp:[spell(m,prevTop)],endE:null}; list.push(entry); W.held[m]=entry; renderSheet();
}
export function writeRelease(m){ if(W.mode!=='rhythm') return; const en=W.held[m]; if(!en) return; delete W.held[m]; if(Object.values(W.held).includes(en)) return; en.endE=Math.max(en.e+1,Math.round((nowMs()-W.t0)/eighthMs())); renderSheet(); }
const NOTE_LENS=[8,6,4,3,2,1], REST_LENS=[8,4,2,1], REST_GLYPH={8:'rw',4:'rh',2:'rq',1:'re'};
function splitLen(pos,len,allowed){ const out=[]; while(len>0){ const room=8-(pos%8); let chunk=Math.min(len,room); while(chunk>0){ const L=allowed.find(a=>a<=chunk&&!(a===8&&pos%8!==0)); out.push({pos,len:L}); pos+=L; len-=L; chunk-=L; } } return out; }
export function layout(entries,nowE){ const items=[]; let cursor=0; entries.forEach((en,i)=>{ if(en.e>cursor) splitLen(cursor,en.e-cursor,REST_LENS).forEach(p=>items.push({type:'rest',...p})); const next=entries[i+1]?entries[i+1].e:null; let end=en.endE!=null?en.endE:(next!=null?next:Math.max(en.e+1,nowE)); if(next!=null) end=Math.min(end,next); end=Math.max(end,en.e+1); const parts=splitLen(en.e,end-en.e,NOTE_LENS); parts.forEach((p,j)=>items.push({type:'note',...p,entry:en,tie:j<parts.length-1})); cursor=end; }); const total=Math.max(8,Math.ceil(cursor/8)*8); if(cursor<total) splitLen(cursor,total-cursor,REST_LENS).forEach(p=>items.push({type:'rest',...p})); return {items,bars:total/8}; }
export function renderSheet(){
  const wrap=$('sheetWrap'); if(!wrap) return; const cs=colors(), c=cs.ink; const avail=Math.max(320,wrap.clientWidth-34); let svg='', width=avail;
  if(W.mode==='notes'){ const list=W.notes, step=44; width=Math.max(avail,110+list.length*step+30); let body=''; list.forEach((en,i)=>{ const x=110+i*step, col=i===list.length-1?cs.accent:c; en.ms.forEach((m,j)=>{ const sp=en.sp[j], clef=m>=60?'treble':'bass'; body+=noteSVG({d:sp.d,clef,by:clef==='treble'?100:190,x,c:col,acc:sp.acc,kind:'head'}); }); }); svg=systemSVG(width,c,true)+body; }
  else { const nowE=W.metro?Math.max(0,Math.round((nowMs()-W.t0)/eighthMs())):0; const {items,bars}=layout(W.rhythm,nowE); const barW=8*30+30, x0=110; width=Math.max(avail,x0+bars*barW+20); let body='';
    [80,170].forEach(y=>{ body+=`<text x="78" y="${y}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="26" fill="${c}">4</text><text x="78" y="${y+20}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="26" fill="${c}">4</text>`; });
    for(let b=1;b<=bars;b++){ const bx=x0+b*barW; body+= b<bars?`<line x1="${bx}" x2="${bx}" y1="60" y2="190" stroke="${c}" stroke-width="1.3"/>`:`<line x1="${bx-6}" x2="${bx-6}" y1="60" y2="190" stroke="${c}" stroke-width="1.3"/><line x1="${bx-1}" x2="${bx-1}" y1="60" y2="190" stroke="${c}" stroke-width="4"/>`; }
    const xOf=pos=>x0+Math.floor(pos/8)*barW+22+(pos%8)*30; const lastEntry=W.rhythm[W.rhythm.length-1];
    items.forEach(it=>{ const x=xOf(it.pos); if(it.type==='rest'){ const shift=(it.len===8||it.len===4)?10:0; body+=glyph(REST_GLYPH[it.len],x-6,100-shift,c); return; } const col=it.entry===lastEntry?cs.accent:c;
      it.entry.ms.forEach((m,j)=>{ const sp=it.entry.sp[j], clef=m>=60?'treble':'bass', by=clef==='treble'?100:190; body+=noteSVG({d:sp.d,clef,by,x,c:col,acc:it.pos===it.entry.e?sp.acc:null,kind:KIND[it.len]}); if(it.tie){ const nx=xOf(it.pos+it.len), y=yOf(sp.d,clef,by)+8; body+=`<path d="M${x+5} ${y} Q ${(x+nx)/2} ${y+11} ${nx-5} ${y}" fill="none" stroke="${col}" stroke-width="1.6"/>`; } }); });
    svg=systemSVG(x0+bars*barW+10,c,true)+body; }
  $('sheet').innerHTML=`<svg id="sheetSvg" xmlns="http://www.w3.org/2000/svg" width="${width}" height="230" viewBox="0 0 ${width} 230" role="img" aria-label="Sheet music of what you played">${svg}</svg>`; wrap.scrollLeft=wrap.scrollWidth;
}
let metroTimer=null, nextBeat=0;
function startMetro(){ const c=audio(); if(!c) return; W.rhythm=[]; const beat=60/W.tempo; W.t0=(c.currentTime+.15+4*beat)*1000; W.metro=true; nextBeat=-4; $('metroBtn').textContent='Stop metronome'; $('tDown').disabled=$('tUp').disabled=true; say('Four clicks, then play. Notes snap to the nearest eighth note.','demo');
  clearInterval(metroTimer); metroTimer=setInterval(()=>{ const now=c.currentTime, b=60/W.tempo; while(W.t0/1000+nextBeat*b<now+.12){ const when=W.t0/1000+nextBeat*b; if(when>=now-.01) click(when,((nextBeat%4)+4)%4===0); nextBeat++; } const cur=Math.floor((now-W.t0/1000)/b); document.querySelectorAll('#beats i').forEach((el,i)=>el.classList.toggle('on',((cur%4)+4)%4===i)); },25); renderSheet(); }
export function stopMetro(){ if(!W.metro) return; clearInterval(metroTimer); W.metro=false; Object.keys(W.held).forEach(m=>writeRelease(+m)); const b=$('metroBtn'); if(b){ b.textContent='Start metronome'; $('tDown').disabled=$('tUp').disabled=false; } document.querySelectorAll('#beats i').forEach(el=>el.classList.remove('on')); if(S.view==='studio') renderSheet(); }
// Saving: inside the claude.ai artifact the downloads capability handles it;
// anywhere else (the real site, a local file) a plain anchor download does.
let downloads=null;
if(window.claude&&typeof window.claude.use==='function'){ window.claude.use('downloads').then(d=>{ downloads=d; }).catch(()=>{}); }
async function saveImage(){ const svgEl=$('sheetSvg'); if(!svgEl) return; const w=+svgEl.getAttribute('width'), h=230, scale=2; const bg=getComputedStyle($('sheetWrap')).backgroundColor; const xml=new XMLSerializer().serializeToString(svgEl); const img=new Image();
  img.onload=()=>{ const cv=document.createElement('canvas'); cv.width=(w+40)*scale; cv.height=(h+20)*scale; const ctx=cv.getContext('2d'); ctx.fillStyle=(bg&&bg!=='rgba(0, 0, 0, 0)')?bg:'#ffffff'; ctx.fillRect(0,0,cv.width,cv.height); ctx.scale(scale,scale); ctx.drawImage(img,20,10,w,h); cv.toBlob(async blob=>{
    if(downloads){ try{ await downloads.save({filename:'middle-c-sheet.png',data:blob}); say('Saved.'); }catch(err){ if(err&&err.code!=='declined') say('The image could not be saved here.'); } return; }
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='middle-c-sheet.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000); say('Saved.');
  },'image/png'); };
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml); }
