// Shared note math, naming, and small helpers.
export const SHARP=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'], FLAT=['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
export const LETTER_PC=[0,2,4,5,7,9,11], PC_LETTER={0:0,2:1,4:2,5:3,7:4,9:5,11:6}, LETTERS='CDEFGAB';
// muted, engraving-friendly note colors (one fixed hue per letter name)
export const NOTE_COLOR={0:'#C2655C',2:'#C98F55',4:'#C9AE4F',5:'#7FA276',7:'#5F9E95',9:'#6B7FBB',11:'#9573AE'};
export const isBlack=pc=>pc===1||pc===3||pc===6||pc===8||pc===10;
export const octOf=m=>Math.floor(m/12)-1;
export const fullName=m=>isBlack(m%12)?`${SHARP[m%12]}${octOf(m)} / ${FLAT[m%12]}${octOf(m)}`:`${SHARP[m%12]}${octOf(m)}`;
export const shortName=m=>isBlack(m%12)?`${SHARP[m%12]} / ${FLAT[m%12]}`:SHARP[m%12];
export const rand=a=>a[Math.floor(Math.random()*a.length)];
export const shuffle=a=>{a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a;};
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export const $=id=>document.getElementById(id);
export const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
// parse 'Bb4' / 'F#3' / 'E4' -> {m, d, acc}
export function parse(n){
  const letter=n[0], acc=n[1]==='b'?'flat':n[1]==='#'?'sharp':null, oct=+n[n.length-1];
  const li=LETTERS.indexOf(letter); const d=oct*7+li; let m=(oct+1)*12+LETTER_PC[li]; if(acc==='flat') m--; if(acc==='sharp') m++;
  return {m,d,acc,name:letter+(acc==='flat'?'♭':acc==='sharp'?'♯':'')+oct, label:letter+(acc==='flat'?'♭':acc==='sharp'?'♯':'')};
}
export const dOf=(letter,oct)=>oct*7+LETTERS.indexOf(letter);
export const midiOfD=d=>(Math.floor(d/7)+1)*12+LETTER_PC[d%7];
export const store={ get(k,d){ try{ const v=localStorage.getItem('middlec3:'+k); return v==null?d:JSON.parse(v);}catch(e){return d;} }, set(k,v){ try{ localStorage.setItem('middlec3:'+k, JSON.stringify(v)); }catch(e){} } };
