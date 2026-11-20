"use strict";
/* core/rng.js */

/* RNG mulberry32 — a semente fica no estado, então um save recarregado
   continua a mesma sequência aleatória (reprodutível para debug). */
function rand(){
  let t = (S && S.seed !== undefined) ? (S.seed = (S.seed + 0x6D2B79F5) | 0) : (Math.random()*2**32)|0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const chance = p => rand() < p;

const rint = (a,b) => a + Math.floor(rand()*(b-a+1));

const rfloat = (a,b) => a + rand()*(b-a);

const pick = arr => arr[Math.floor(rand()*arr.length)];

const gauss = () => { let u=0,v=0; while(!u) u=rand(); while(!v) v=rand(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };

const uid = () => Math.floor(rand()*1e9).toString(36) + Date.now().toString(36).slice(-3);

function weighted(items, wfn){
  const ws = items.map(i => Math.max(0, num(wfn(i))));
  const tot = ws.reduce((a,b)=>a+b,0);
  if (tot <= 0) return null;
  let r = rand()*tot;
  for (let i=0;i<items.length;i++){ r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length-1];
}
