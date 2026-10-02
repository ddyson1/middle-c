// App-wide mutable state and saved progress. Keep this module dependency-light:
// engine, keyboard and studio all import it, including at module-eval time.
import { store } from './utils.js';

export const P = store.get('prog', {done:{}, misses:{}, lastDay:null});
export const saveP=()=>store.set('prog',P);

export const S={ view:'home', skin:store.get('skin','clean'), names:store.get('names',false), octaveShift:0, range:[60,72], token:0,
  lesson:null, stepIdx:0, step:null, drill:null, play:null, practice:null, locked:false,
  write:{mode:'notes', notes:[], rhythm:[], tempo:80, t0:null, metro:false, held:{}} };
