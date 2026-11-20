"use strict";
/* =====================================================================
   systems/martial.js — artes marciais: matrícula, mensalidade, treino
   (retornos decrescentes + lesão em treino intenso), graduação/faixas,
   golpes desbloqueados por maestria e torneios com cartel.

   Estado: S.martial = { arts:{ id:{ m, years } }, enrolled:[ids],
     rec:{ w, l, d, ko }, kills, banUntil, titles:[] }
   ===================================================================== */
const MAX_ENROLL = 2;

function martial(){
  if (!S.martial) S.martial = { arts:{}, enrolled:[], rec:{ w:0, l:0, d:0, ko:0 }, kills:0, banUntil:0, titles:[] };
  return S.martial;
}
const mastery = id => num(martial().arts[id]?.m);
const bestMastery = () => Math.max(0, ...Object.values(martial().arts).map(a => num(a.m)));
const bestArt = () => { let b = null, v = -1; for (const [id, a] of Object.entries(martial().arts)) if (a.m > v){ v = a.m; b = id; } return b; };
function rankIdx(m){ let i = 0; DATA.rankThresholds.forEach((t, k) => { if (m >= t) i = k; }); return i; }
function rankName(artId){ const a = byId(DATA.martialArts, artId); return a.ranks[rankIdx(mastery(artId))]; }

/* Golpes conhecidos: básicos + desbloqueados por maestria. */
function knownMoves({ tournamentArt } = {}){
  const weapons = tournamentArt || typeof weaponMoves !== "function" ? [] : weaponMoves(); // armas não entram no ringue
  return weapons.concat(DATA.moves.filter(mv => {
    if (!mv.art) return !(tournamentArt && mv.dirty);
    if (tournamentArt && tournamentArt !== "mma" && mv.art !== tournamentArt) return false;
    return mastery(mv.art) >= mv.req;
  }));
}
function nextUnlock(artId){ return DATA.moves.filter(mv => mv.art === artId && mv.req > mastery(artId)).sort((a,b)=>a.req-b.req)[0] || null; }

/* Atributos de luta do personagem (derivados, nunca armazenados). */
function fighterStats(){
  const p = P(), a = p.age, bm = bestMastery();
  const ageMal = a > 45 ? (a - 45) * 0.9 : a < 16 ? (16 - a) * 3 : 0;
  const others = Object.values(martial().arts).reduce((s, x) => s + num(x.m), 0) - bm;
  const skill = clamp(bm * 0.75 + others * 0.12 + num(S.crimeSkill) * 0.1 + (hasTrait("athletic") ? 8 : 0) + num(p.talents?.sport) * 0.08);
  const str = clamp(p.stats.health * 0.55 + bm * 0.3 + (hasTrait("athletic") ? 10 : 0) - ageMal + 8);
  const def = clamp(skill * 0.65 + p.stats.health * 0.2 - ageMal * 0.5);
  const intim = S.prison ? num(S.prison.intim) * 0.15 : 0; // físico ganho no pátio
  return { skill: clamp(skill + intim), str: clamp(str + intim), def, hp: Math.max(15, Math.round(p.stats.health)) };
}

/* ---------- Matrícula e treino ---------- */
function enrollArt(id){
  const d = byId(DATA.martialArts, id), M = martial();
  if (inPrison()) return R(false, "Você está preso(a).");
  if (P().age < d.minAge) return R(false, `Idade mínima: ${d.minAge}.`);
  if (M.enrolled.includes(id)) return R(false, "Você já treina essa modalidade.");
  if (M.enrolled.length >= MAX_ENROLL) return R(false, `Máximo de ${MAX_ENROLL} modalidades ao mesmo tempo.`);
  if (P().stats.health < 25) return R(false, "O professor não aceita alunos com saúde tão baixa.");
  const fee = artFee(id);
  if (adult() && fee > 0 && !canAfford(fee)) return R(false, `Matrícula + 1ª mensalidade: ${fmt(fee)}.`);
  if (adult()) addMoney(-fee);
  M.enrolled.push(id); M.arts[id] = M.arts[id] || { m:0, years:0 };
  log(`${d.emoji} Me matriculei em ${d.name}.`, "");
  return R(true, `Matriculado(a) em ${d.name}. Mensalidade de ${fmt(artFee(id))}.`);
}
function quitArt(id){
  const M = martial(); if (!M.enrolled.includes(id)) return R(false, "Você não treina isso.");
  M.enrolled = M.enrolled.filter(x => x !== id);
  return R(true, `Parei de treinar ${byId(DATA.martialArts, id).name}. A maestria fica, mas enferruja sem treino.`);
}
const artFee = id => priceOf(byId(DATA.martialArts, id).fee);

/* Treino ativo (gasta energia). Intenso = ganho maior, lesão provável. */
function trainArt(id, intense = false){
  const d = byId(DATA.martialArts, id), M = martial();
  if (!M.enrolled.includes(id)) return R(false, "Matricule-se primeiro.");
  if (inPrison()) return R(false, "Sem academia na cadeia — só o pátio.");
  if (P().stats.health < 20) return R(false, "Saúde baixa demais para treinar.");
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  const key = "art_" + id; S.actCount[key] = num(S.actCount[key]);
  const before = mastery(id), age = P().age;
  const ageF = age < 12 ? 0.7 : age <= 30 ? 1.1 : age <= 45 ? 0.9 : age <= 60 ? 0.65 : 0.4;
  const talent = 1 + num(P().talents?.sport) / 200 + (hasTrait("athletic") ? 0.15 : 0);
  const gain = rint(4, 8) * (intense ? 1.8 : 1) * dim(key) * ageF * talent * (1 - before / 140);
  S.actCount[key]++;
  M.arts[id].m = clamp(before + gain);
  S.health.exercised = true; addStress(-3);
  let extra = "";
  if (chance(d.injury * (intense ? 2.6 : 0.8) * (age > 50 ? 1.6 : 1))){
    extra = ` Lesão no treino.` + injure(rint(intense ? 6 : 3, intense ? 14 : 8), `Lesão treinando ${d.name}`, 0.12);
  } else addStat("health", rint(1, 3) * ageBody());
  return R(true, `Treino ${intense ? "intenso " : ""}de ${d.name}: maestria ${Math.round(before)} → ${Math.round(M.arts[id].m)}.` + unlockNews(id, before) + extra);
}
/* Mensagens de faixa nova / golpe novo ao cruzar limiares. */
function unlockNews(id, before){
  const after = mastery(id), d = byId(DATA.martialArts, id); let msg = "";
  for (const mv of DATA.moves.filter(m => m.art === id && m.req > before && m.req <= after)){
    log(`${d.emoji} Aprendi um golpe novo: ${mv.name}.`, "good"); msg += ` 🆕 Golpe desbloqueado: ${mv.name}!`;
  }
  if (rankIdx(after) > rankIdx(before)){
    const r = d.ranks[rankIdx(after)]; log(`${d.emoji} Graduação em ${d.name}: ${r}.`, "milestone"); msg += ` 🎖️ Nova graduação: ${r}.`;
    if (rankIdx(after) >= 4) achieve("blackbelt_" + id, `${r} em ${d.name}`);
  }
  return msg;
}

/* ---------- Tick anual ---------- */
function martialYear(){
  const M = martial(), Y = S.yearSummary;
  if (inPrison()) return;
  for (const id of [...M.enrolled]){
    const d = byId(DATA.martialArts, id), cost = artFee(id) * 12, a = M.arts[id];
    if (adult()){
      if (S.money < cost){ M.enrolled = M.enrolled.filter(x => x !== id); log(`${d.emoji} Larguei ${d.name}: não dava para pagar a mensalidade.`, "bad"); continue; }
      addMoney(-cost); Y.expenses += cost; Y.lines.push([`Academia: ${d.name}`, -cost]);
    }
    const before = a.m; a.years++;
    a.m = clamp(a.m + rfloat(1.5, 4) * (1 - a.m / 130) * (P().age > 55 ? 0.5 : 1));
    unlockNews(id, before);
    S.health.exercised = true;
    if (chance(d.injury * 0.35)) injure(rint(2, 7), `Lesão treinando ${d.name}`, 0.08);
  }
  // sem treino, a maestria enferruja devagar
  for (const [id, a] of Object.entries(M.arts)) if (!M.enrolled.includes(id) && a.m > 10) a.m = clamp(a.m - 1.2);
}

/* ---------- Torneios ---------- */
function tournamentBlock(t, artId){
  const M = martial();
  if (inPrison()) return "Você está preso(a)";
  if (P().age < 16) return "Idade mínima: 16";
  if (P().age > 48 && t.id !== "amador") return "Velho(a) demais para o circuito";
  if (num(M.banUntil) > P().age) return `Suspenso(a) até os ${M.banUntil} anos`;
  if (!artId || mastery(artId) < t.minM) return `Maestria ${t.minM} exigida`;
  if (t.minWins && M.rec.w < t.minWins) return `Cartel mínimo: ${t.minWins} vitórias`;
  if (P().stats.health < 45) return "Exame médico: saúde mínima 45";
  if (adult() && !canAfford(priceOf(t.fee))) return `Inscrição: ${fmt(priceOf(t.fee))}`;
  return null;
}
function enterTournament(tid, artId){
  const t = byId(DATA.tournaments, tid), why = tournamentBlock(t, artId);
  if (why) return R(false, why);
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  if (adult()) addMoney(-priceOf(t.fee));
  startFight("tournament", { tid, art: artId, idx: 0 });
  return R(true, `${t.emoji} Inscrito(a) em ${t.name}. Luta 1 de ${t.fights}!`);
}
/* Chamado ao fim de cada luta de torneio (com a luta já resolvida). */
function tournamentAfter(F){
  const t = byId(DATA.tournaments, F.ctx.tid), M = martial(), won = F.result === "win";
  if (F.result === "draw"){ // decisão dos juízes por pontos
    const mine = F.dealt, theirs = F.taken;
    F.result = mine >= theirs ? "win" : "lose";
    F.lines.push(`⚖️ Decisão dos juízes: ${F.result === "win" ? "vitória" : "derrota"} por pontos (${Math.round(mine)} × ${Math.round(theirs)}).`);
  }
  const win = F.result === "win";
  if (win){ M.rec.w++; if (["ko","grave","coma","death","sub"].includes(F.oppOutcome)) M.rec.ko++; }
  else M.rec.l++;
  if (!win){
    F.summary += ` Fui eliminado(a) em ${t.name}.`; addStat("happiness", -4);
    log(`${t.emoji} Perdi em ${t.name} (cartel ${M.rec.w}-${M.rec.l}).`, "bad");
    return;
  }
  if (F.ctx.idx + 1 < t.fights){ F.next = { ...F.ctx, idx: F.ctx.idx + 1 }; F.summary += ` Avancei para a luta ${F.ctx.idx + 2} de ${t.fights}.`; return; }
  const prize = priceOf(rint(...t.prize));
  addMoney(prize); S.stats.earned += prize; addFame(t.fame); addRep(t.rep); addStat("happiness", 10);
  if (S.org) S.org.respect = clamp(S.org.respect + 4);
  M.titles.push({ tid:t.id, age:P().age, art:F.ctx.art });
  log(`${t.emoji} CAMPEÃO(Ã) de ${t.name}! Prêmio de ${fmt(prize)} (cartel ${M.rec.w}-${M.rec.l}, ${M.rec.ko} nocautes).`, "milestone");
  if (t.id === "cinturao") achieve("worldbelt", "Campeão(ã) mundial de lutas");
  if (t.id === "pro") achieve("profighter", "Vitória em evento profissional de luta");
  F.summary += ` 🏆 Campeão(ã)! Prêmio: ${fmt(prize)}.`;
}
