// Expands lessons.json and tunes.json into the runtime shapes the engine uses.
// The JSON stays declarative so Rulin can edit lines and drills without touching code.
import LESSON_DATA from './lessons.json' with { type: 'json' };
import TUNE_DATA from './tunes.json' with { type: 'json' };
import { parse, shuffle } from './utils.js';

// tunes.json events are [len, rh, lh]: length in eighths, then space-separated
// note names per hand ("E4", "C4 E4"), null or absent for a silent hand.
export const TUNES={};
Object.entries(TUNE_DATA).forEach(([k,t])=>{ TUNES[k]={...t, ev:t.ev.map(([len,rh,lh])=>({len, rh:rh?rh.split(' '):[], lh:lh?lh.split(' '):[]}))}; });
Object.values(TUNES).forEach(t=>{ let pos=t.pickup?(t.beats*2-t.pickup):0; t.ev.forEach(e=>{ e.pos=pos; pos+=e.len; e.notes=[...e.rh.map(n=>({...parse(n),hand:'rh'})),...e.lh.map(n=>({...parse(n),hand:'lh'}))]; }); t.total=pos; t.twoHands=t.ev.some(e=>e.lh.length)&&t.ev.some(e=>e.rh.length); t.lhOnly=!t.ev.some(e=>e.rh.length); });

// drill items get their review keys here; "shuffle": true on a drill step mixes
// its items once per page load, same as the old inline shuffle() calls.
const findItem=(pc)=>({t:'find',pc,key:'find:'+pc,useFlat:Math.random()<.5});
const nameItem=(m)=>({t:'name',m,key:'name:'+(m%12)});
const readItem=(clef,d,acc)=>({t:'read',clef,d,acc:acc||null,key:'read:'+clef+':'+d+(acc||'')});
const echoItem=(seq)=>({t:'echo',seq,key:'echo'});
const expandItem=it=> it.t==='find'?findItem(it.pc) : it.t==='name'?nameItem(it.m) : it.t==='read'?readItem(it.clef,it.d,it.acc) : echoItem(it.seq);

export const LESSONS=LESSON_DATA.map(L=>({ ...L, steps:L.steps.map(st=>{ if(st.t!=='drill') return st; const items=st.items.map(expandItem); return {...st, items:st.shuffle?shuffle(items):items}; }) }));
