"use strict";
/* =====================================================================
   state/invariants.js — checagens de consistência de estado.
   checkInvariants() lista violações (usado no selftest e no console:
   `checkInvariants()`); repairState() corrige o que for reparável
   (chamado ao carregar saves e a cada ano).
   ===================================================================== */
const VALID_ROLES = new Set(["mother","father","sibling","partner","fiance","spouse","child","friend","ex","coworker","acquaintance","late_spouse","late_partner"]);

function checkInvariants(st = S){
  const bad = [], p = st.player, push = m => bad.push(m);
  for (const k of ["health","happiness","intelligence","looks"]) if (!(p.stats[k] >= 0 && p.stats[k] <= 100)) push(`stat ${k}=${p.stats[k]}`);
  for (const k of ["stress","reputation","vitality","fame","notoriety"]) if (!(p[k] >= 0 && p[k] <= 100)) push(`${k}=${p[k]}`);
  if (!(st.money >= 0)) push(`money=${st.money}`);
  if (st.job && !byId(DATA.careers, st.job.careerId)) push(`job inválido ${st.job.careerId}`);
  if (st.job && st.prison) push("emprego e prisão ao mesmo tempo");
  if (st.job && st.retired) push("empregado e aposentado");
  if (st.properties.filter(x=>x.residence).length > 1) push("mais de uma residência");
  if (st.rental && st.properties.some(x=>x.residence)) push("aluga e mora em imóvel próprio");
  for (const L of st.loans){ if (L.propertyUid && !st.properties.some(x=>x.uid===L.propertyUid)) push(`hipoteca órfã ${L.name}`); if (!(L.principal >= 0)) push(`dívida negativa ${L.name}`); }
  const romance = st.rels.filter(r => ["partner","fiance","spouse"].includes(r.role) && r.alive);
  if (romance.length > 1) push(`${romance.length} parceiros simultâneos`);
  for (const r of st.rels){
    if (!VALID_ROLES.has(r.role)) push(`papel inválido ${r.role}`);
    if (r.role === "child" && r.alive && r.age >= p.age && p.alive) push(`filho(a) ${r.first} mais velho que o jogador`);
  }
  if (!p.alive && st.queue.length) push("morto com eventos pendentes");
  if (st.edu.school === "uni" && !byId(DATA.majors, st.edu.major)) push("faculdade sem curso válido");
  for (const i of st.illnesses) if (!byId(DATA.illnesses, i.id)) push(`doença inválida ${i.id}`);
  if (st.illnesses.length !== new Set(st.illnesses.map(i=>i.id)).size) push("doença duplicada");
  if (p.stats.health > healthCap() + 0.5) push(`saúde ${p.stats.health} acima do teto ${healthCap()}`);
  return bad;
}

function repairState(st = S){
  // romance: mantém só o vínculo mais forte (cônjuge > noivo > namoro)
  const order = { spouse:3, fiance:2, partner:1 };
  const romance = st.rels.filter(r => order[r.role] && r.alive).sort((a,b)=>order[b.role]-order[a.role] || b.rel-a.rel);
  for (const r of romance.slice(1)) r.role = "ex";
  if (st.job && st.prison) st.job = null;
  if (st.job && st.retired) st.retired = false;
  const res = st.properties.filter(x=>x.residence); for (const x of res.slice(1)) x.residence = false;
  if (st.rental && res.length) st.rental = null;
  st.loans = st.loans.filter(L => !L.propertyUid || st.properties.some(x=>x.uid===L.propertyUid));
  const seen = new Set(); st.illnesses = st.illnesses.filter(i => byId(DATA.illnesses,i.id) && !seen.has(i.id) && seen.add(i.id));
  if (!st.player.alive) st.queue = [];
}
