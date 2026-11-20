"use strict";
/* systems/events.js */

const STAT_LABEL = { health:"Saúde", happiness:"Felicidade", intelligence:"Inteligência", looks:"Aparência", fame:"Fama", noto:"Notoriedade" };

/* fx aplica efeitos e devolve um sufixo legível "(Saúde +5, Felicidade −3)". */
function fx(o){
  const parts = [];
  for (const k of ["health","happiness","intelligence","looks"]) if (o[k]) { addStat(k, o[k]); parts.push(`${STAT_LABEL[k]} ${o[k]>0?"+":"−"}${Math.abs(Math.round(o[k]))}`); }
  if (o.fame){ addFame(o.fame); parts.push(`Fama ${o.fame>0?"+":"−"}${Math.abs(Math.round(o.fame))}`); }
  if (o.noto){ addNoto(o.noto); }
  if (o.karma){ P().karma = clamp(P().karma + o.karma); }
  if (o.money){ addMoney(o.money); parts.push(`${o.money>0?"+":"−"}${fmt(Math.abs(o.money))}`); }
  return parts.length ? ` (${parts.join(", ")})` : "";
}

const EVENT_MAP = Object.fromEntries(EVENTS.map(e=>[e.id,e]));

function enqueue(id, ctx){
  const ev = EVENT_MAP[id]; if (!ev) return;
  if (S.queue.some(q=>q.id===id)) return;
  try { S.queue.push({ id, ctx: ctx ?? (ev.setup ? ev.setup() : {}) }); } catch(e){ console.warn("setup falhou", id, e); }
}

function eventWeight(ev){
  const a = P().age;
  if (a < ev.age[0] || a > ev.age[1]) return 0;
  if (ev.once && S.cooldown[ev.id] !== undefined) return 0;
  if (ev.cd && S.cooldown[ev.id] !== undefined && a - S.cooldown[ev.id] < ev.cd) return 0;
  if (inPrison() !== !!ev.prison) return 0; // atrás das grades só rolam eventos de prisão (e vice-versa)
  try {
    if (ev.cond && !ev.cond()) return 0;
    return typeof ev.weight === "function" ? ev.weight() : ev.weight;
  } catch(e){ return 0; }
}

/* Sorteia 0–2 eventos/ano, respeitando cooldown (evita repetição). */
function queueEvents(){
  if (P().age < 2) return;
  const n = chance(0.75) ? (chance(0.35) ? 2 : 1) : 0;
  for (let i=0; i<n; i++){
    const ev = weighted(EVENTS, eventWeight);
    if (!ev) break;
    S.cooldown[ev.id] = P().age;
    enqueue(ev.id);
  }
}

/* Resolve a escolha i do primeiro evento da fila. Retorna o texto do resultado. */
function resolveEvent(i){
  const q = S.queue[0]; if (!q) return null;
  const ev = EVENT_MAP[q.id]; let res = "";
  try { const ch = ev.choices(q.ctx)[i]; res = ch.run(q.ctx) || ""; log(`${ev.emoji} ${ev.title}: ${res}`, /−|perdi|demitid|pres|condenad/i.test(res) ? "bad" : "good"); }
  catch(e){ console.error(e); res = "(evento ignorado)"; }
  S.queue.shift();
  sanitize();
  if (S.flags.forcedDeath){ const c = S.flags.forcedDeath; delete S.flags.forcedDeath; die(c); }
  else if (P().stats.health <= 0) die(S.illnesses.some(i=>i.diagnosed && byId(DATA.illnesses,i.id).sev >= 8) ? `complicações de ${byId(DATA.illnesses, S.illnesses.filter(i=>i.diagnosed).sort((a,b)=>b.stage-a.stage)[0].id).name}` : "ferimentos graves");
  return res;
}

/* Descarta eventos da fila que deixaram de fazer sentido (ex.: perdeu o
   emprego por causa de um evento anterior do mesmo ano). Revalida
   cond() de todos e weight() dos sorteáveis. Evita resultados contraditórios. */
function validHead(){
  while (S.queue.length){
    const q = S.queue[0], ev = EVENT_MAP[q.id];
    let ok = !!ev && P().alive;
    try {
      if (ok && ev.cond && !ev.cond(q.ctx)) ok = false; // eventos enfileirados revalidam com o próprio contexto
      if (ok && typeof ev.weight === "function" && !(ev.weight() > 0)) ok = false;
    } catch(e){ ok = false; }
    if (ok && ev.prison && !S.prison) ok = false;
    if (ok) return q;
    S.queue.shift();
  }
  return null;
}
