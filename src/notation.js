// SVG notation renderer. Glyph outlines come from Noto Music (OFL), extracted to
// glyphs.json so notation renders without a web font and exports as an image.
import G from './glyphs.json' with { type: 'json' };
import { esc, isBlack, octOf, PC_LETTER } from './utils.js';

const BOT={treble:30,bass:18};
export const colors=()=>{ const cs=getComputedStyle(document.body); return {ink:cs.getPropertyValue('--staff-ink').trim()||'#14161C', accent:cs.getPropertyValue('--accent').trim()||'#2F6BFF', good:cs.getPropertyValue('--good-b').trim()||'#1E7A45'}; };
export const glyph=(name,x,y,c)=>`<path d="${G[name]}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(0.04 -0.04)" fill="${c}"/>`;
function staffLines(by,x0,x1,c){ let s=''; for(let i=0;i<5;i++){ const y=by-i*10; s+=`<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="1.3"/>`; } return s; }
export const yOf=(d,clef,by)=>by-(d-BOT[clef])*5;
export function noteSVG(o){
  const {d,clef,by,x,c}=o, b=BOT[clef], y=yOf(d,clef,by); let s='';
  for(let k=b-2;k>=d;k-=2){ const ly=yOf(k,clef,by); s+=`<line x1="${x-12}" x2="${x+12}" y1="${ly}" y2="${ly}" stroke="${c}" stroke-width="1.3"/>`; }
  for(let k=b+10;k<=d;k+=2){ const ly=yOf(k,clef,by); s+=`<line x1="${x-12}" x2="${x+12}" y1="${ly}" y2="${ly}" stroke="${c}" stroke-width="1.3"/>`; }
  if(o.acc) s+=glyph(o.acc,x-25,y,c);
  const kind=o.kind||'head', hollow=kind==='h'||kind==='dh'||kind==='w';
  s+= hollow ? `<ellipse cx="${x}" cy="${y}" rx="${kind==='w'?7.6:6.6}" ry="4.6" fill="none" stroke="${c}" stroke-width="${kind==='w'?2.6:2}" transform="rotate(${kind==='w'?-10:-20} ${x} ${y})"/>` : `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="${c}" transform="rotate(-20 ${x} ${y})"/>`;
  if(kind!=='head'&&kind!=='w'){ const up=o.stemDir?o.stemDir==='up':d<b+4; const sx=up?x+6.4:x-6.4, y2=up?y-34:y+34;
    s+=`<line x1="${sx}" x2="${sx}" y1="${y}" y2="${y2}" stroke="${c}" stroke-width="1.6"/>`;
    if(kind==='e') s+= up?`<path d="M${sx} ${y2} q 1 10 9 14 q 4 5 1 13" fill="none" stroke="${c}" stroke-width="2"/>`:`<path d="M${sx} ${y2} q 1 -10 9 -14 q 4 -5 1 -13" fill="none" stroke="${c}" stroke-width="2"/>`; }
  if(kind==='dq'||kind==='dh'){ const dy=(d-b)%2===0?y-5:y; s+=`<circle cx="${x+13}" cy="${dy}" r="2.2" fill="${c}"/>`; }
  return s;
}
export function systemSVG(width,c,grand,single,x0){
  x0=x0||8; let s='';
  if(grand){ s+=staffLines(100,20,width-10,c)+staffLines(190,20,width-10,c)+`<line x1="20" x2="20" y1="60" y2="190" stroke="${c}" stroke-width="1.6"/><path d="M13 60 q -6 2 -6 14 v 38 q 0 10 -4 13 q 4 3 4 13 v 38 q 0 12 6 14" fill="none" stroke="${c}" stroke-width="2.4"/>`+glyph('gclef',26,100,c)+glyph('fclef',26,190,c); }
  else { s+=staffLines(100,x0,width-8,c)+`<line x1="${x0}" x2="${x0}" y1="60" y2="100" stroke="${c}" stroke-width="1.6"/>`+glyph(single==='treble'?'gclef':'fclef',x0+6,100,c); }
  return s;
}
export const KIND={8:'w',6:'dh',4:'h',3:'dq',2:'q',1:'e'};
export function spell(m,prev){ const pc=m%12, oct=octOf(m); if(!isBlack(pc)) return {d:oct*7+PC_LETTER[pc],acc:null}; if(prev!=null&&m<prev){ const n=m+1; return {d:octOf(n)*7+PC_LETTER[n%12],acc:'flat'}; } const n=m-1; return {d:octOf(n)*7+PC_LETTER[n%12],acc:'sharp'}; }
export function tuneSVG(tune, played, nextIdx, opts){
  // opts: {names, width}
  const cs=colors(), c=cs.ink, barE=tune.beats*2, bars=Math.ceil(tune.total/barE);
  const perRow = opts.width<560 ? 2 : 4, rows=Math.ceil(bars/perRow);
  const grand = tune.twoHands, lhOnly=tune.lhOnly;
  const rowH = grand?250:170, W=Math.max(420,opts.width);
  const left=grand?48:44, barW=(W-left-16)/perRow;
  let s=`<svg viewBox="0 0 ${W} ${rows*rowH}" role="img" aria-label="${esc(tune.title)} notation">`;
  for(let r=0;r<rows;r++){
    const oy=r*rowH;
    let sys='';
    if(grand){ sys=`<g transform="translate(0 ${oy})">${systemSVG(W,c,true)}</g>`; }
    else { sys=`<g transform="translate(0 ${oy})">${systemSVG(W,c,false,lhOnly?'bass':'treble',8)}</g>`; }
    s+=sys;
    if(r===0){ const ys=grand?[100,190]:[100]; ys.forEach(y=>{ s+=`<text x="${left-4}" y="${y-20+oy}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="24" fill="${c}">${tune.beats}</text><text x="${left-4}" y="${y+oy}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="24" fill="${c}">4</text>`; }); }
    for(let b=1;b<=perRow;b++){ const bi=r*perRow+b; if(bi>bars) break; const bx=left+8+b*barW; const yTop=60+oy, yBot=(grand?190:100)+oy;
      s+= bi===bars ? `<line x1="${bx-5}" x2="${bx-5}" y1="${yTop}" y2="${yBot}" stroke="${c}" stroke-width="1.3"/><line x1="${bx-1}" x2="${bx-1}" y1="${yTop}" y2="${yBot}" stroke="${c}" stroke-width="3.5"/>` : `<line x1="${bx}" x2="${bx}" y1="${yTop}" y2="${yBot}" stroke="${c}" stroke-width="1.3"/>`; }
  }
  tune.ev.forEach((e,i)=>{
    const bar=Math.floor(e.pos/barE), r=Math.floor(bar/perRow), bInRow=bar%perRow, oy=r*rowH;
    const x=left+8+bInRow*barW+18+(e.pos%barE)*((barW-30)/barE);
    const col = i<played ? cs.good : i===nextIdx ? cs.accent : c;
    e.notes.forEach(n=>{ const clef = n.hand==='lh'||lhOnly ? 'bass':'treble'; const by=(grand?(clef==='treble'?100:190):100)+oy; s+=noteSVG({d:n.d,clef,by,x,c:col,acc:n.acc,kind:KIND[e.len]}); });
    if(opts.names){ const yy=(grand?190:100)+oy+30; s+=`<text x="${x}" y="${yy}" text-anchor="middle" font-family="${opts.font}" font-weight="700" font-size="14" fill="${col}">${esc(e.notes.map(n=>n.label).join(' '))}</text>`; }
    if(i===nextIdx){ const yTop=42+oy, h=(grand?190:100)+oy+36-yTop; s+=`<rect x="${x-15}" y="${yTop}" width="30" height="${h}" rx="7" fill="none" stroke="${cs.accent}" stroke-width="2"/>`; }
  });
  return s+'</svg>';
}
export function staffSingle(clef,d,acc){ const c=colors().ink; return `<svg viewBox="0 0 260 150" role="img" aria-label="A note on the ${clef} staff">${systemSVG(260,c,false,clef)}${noteSVG({d,clef,by:100,x:170,c,acc,kind:'q'})}</svg>`; }
