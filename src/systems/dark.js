"use strict";
/* =====================================================================
   systems/dark.js — O "LADO SOMBRIO" (arco de assassino em série).
   Mecânica abstrata de jogo, sem instruções do mundo real.

   Estado S.dark: active, code ("code" = só culpados | "none"), urge
   (impulso 0–100), heat (suspeita policial 0–100), clues (pistas
   acumuladas), stealth (perícia em não deixar rastros), kills, victims.
   • Impulso sobe todo ano; alto demais → crise (estresse, felicidade,
     evento pedindo decisão).
   • Caçada em etapas (S.hunt): alvo → estudar a rotina (preparo) →
     abordagem (arma do arsenal ou mãos nuas) → execução → limpeza.
       sucesso = 0,35 + preparo/200 + discrição/250 + maestria/400
                 + precisão da arma·0,2 − risco do alvo·0,15
       pistas  = rastreabilidade da arma·2 + (1 − preparo/100) + acaso
                 − limpeza;  suspeita += 6 + pistas·9 (+15 se havia motivo)
                 − disfarce/6   (e a suspeita cai 5 + disfarce/8 por ano)
   • DISFARCE: emprego, parceiro(a), filhos e vida estável escondem.
   • Suspeita alta → colegas/família desconfiam, força-tarefa e, com
     pistas suficientes, prisão perpétua/pena máxima.
   ===================================================================== */
const dark = () => (S.dark ||= { active:false, code:"code", urge:0, heat:0, clues:0, stealth:10, kills:0, victims:[], hunts:0 });
function darkCover(){
  const kids = children().filter(c => c.age < 18).length;
  return clamp(20 + (S.job ? 25 : 0) + (partner() ? 15 : 0) + kids*5 + (S.edu.school ? 10 : 0) - (S.org ? 10 : 0) - P().notoriety/3 - (P().stress > 70 ? 10 : 0));
}
function awakenDark(code){
  const D = dark(); if (D.active) return R(false, "Já desperto.");
  if (P().age < 18) return R(false, "—");
  D.active = true; D.code = code; D.urge = 35;
  log(`🌑 Algo sombrio despertou em mim. ${code === "code" ? "Vou seguir um código: só quem merece." : "Sem regras."}`, "bad", ["crime"]);
  remember("Escolhi alimentar o lado sombrio. Cada passo agora tem consequência.", "pending");
  return R(true, code === "code" ? "O código está definido: só culpados." : "Sem código. Sem limites.");
}
function repressDark(){
  const D = dark(); if (!D.active) return R(false, "—");
  const cost = priceOf(2500); if (!canAfford(cost)) return R(false, `Terapia intensiva: ${fmt(cost)}.`);
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  addMoney(-cost); D.urge = clamp(D.urge - rint(15, 30)); addStress(-6);
  return R(true, `Sessões intensas de terapia. Impulso ${Math.round(D.urge)}.`);
}
function normalLife(){
  const D = dark(); if (!D.active) return R(false, "—");
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  D.heat = clamp(D.heat - rint(4, 9)); addStat("happiness", 2);
  return R(true, `Churrasco com colegas, sorriso no rosto. Ninguém desconfia de nada. Suspeita ${Math.round(D.heat)}.`);
}
function destroyEvidence(){
  const D = dark(); if (!D.active || !D.clues) return R(false, "Não há nada para destruir.");
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  if (chance(0.55 + D.stealth/250)){ D.clues = Math.max(0, D.clues - 1); D.stealth = clamp(D.stealth + 3); return R(true, `Uma pista a menos. Restam ${D.clues}.`); }
  D.heat = clamp(D.heat + 8); return R(false, "Alguém me viu mexendo onde não devia. Suspeita subiu.");
}

/* ---------- Caçada ---------- */
function huntCandidates(){
  const D = dark(), pool = D.code === "code" ? DATA.darkTargets.filter(t => t.guilty).concat([pick(DATA.darkTargets.filter(t => !t.guilty))]) : DATA.darkTargets;
  return [0,1,2].map(() => { const t = pick(pool), g = chance(0.8) ? "M" : "F", n = genName(country(), g); return { tid:t.id, first:n.first, last:n.last, gender:g, age:rint(22, 60) }; });
}
function huntBlock(){
  const D = dark();
  if (!D.active) return "Lado sombrio inativo";
  if (inPrison()) return "Você está preso(a)";
  if (D.lastHunt === P().age) return "Só uma caçada por ano";
  if (S.activitiesThisYear >= ACT_LIMIT) return "Sem energia este ano";
  return null;
}
function startHunt(target){
  const why = huntBlock(); if (why) return R(false, why);
  spendEnergy(); dark().lastHunt = P().age; dark().hunts++;
  S.hunt = { t: target, prep: 0, studied: 0, weapon: null, step: "plan" };
  return R(true, `Alvo escolhido: ${target.first} ${target.last}.`);
}
function huntStudy(){
  const H = S.hunt; if (!H || H.step !== "plan") return "";
  if (H.studied >= 2) return "Você já sabe tudo que dava para saber.";
  if (!spendEnergy()){ return "Sem energia para observar mais."; }
  H.studied++; H.prep = Math.min(100, H.prep + rint(25, 40));
  return `Observei a rotina do alvo por semanas. Preparo ${H.prep}%.`;
}
function huntOdds(H = S.hunt){
  const t = byId(DATA.darkTargets, H.t.tid), w = H.weapon ? byId(DATA.armory, H.weapon) : null, D = dark();
  return clamp((0.35 + H.prep/200 + D.stealth/250 + bestMastery()/400 + (w ? w.acc*0.2 : 0.08) - t.risk*0.15) * 100, 5, 92) / 100;
}
function huntExecute(weaponId){
  const H = S.hunt; if (!H) return "";
  H.weapon = weaponId || null; H.step = "done";
  const t = byId(DATA.darkTargets, H.t.tid), D = dark();
  if (chance(huntOdds(H))){ H.success = true; H.step = "cleanup"; return `${H.t.first} ${H.t.last} não vai mais fazer mal a ninguém.`; }
  // falhou: o alvo reage (combate) ou escapa
  D.heat = clamp(D.heat + 15); D.clues++;
  if (chance(0.6)){
    startFight("hunt", { npc:{ first:H.t.first, last:H.t.last, age:H.t.age, gender:H.t.gender, personality:"hothead" }, target:H.t });
    S.hunt = null; return "O alvo percebeu e reagiu!";
  }
  S.hunt = null; return `${H.t.first} escapou e viu meu rosto. A suspeita aumentou.`;
}
/* Limpeza: decide quantas pistas ficam. mode: meticulous | fast | frame */
function huntCleanup(mode){
  const H = S.hunt; if (!H || !H.success) return "";
  S.hunt = null;
  return darkKill(H.t, H.weapon, H.prep, mode);
}
function darkKill(target, weaponId, prep, mode = "fast"){
  const D = dark(), t = byId(DATA.darkTargets, target.tid), w = weaponId ? byId(DATA.armory, weaponId) : { trace:0.1, discretion:0.6 };
  let clues = Math.max(0, Math.round(w.trace*2 + (1 - prep/100) + rfloat(-0.6, 1.2)));
  let msg = "";
  if (mode === "meticulous"){ if (spendEnergy()){ clues = Math.max(0, clues - 2); D.stealth = clamp(D.stealth + 5); msg = " Limpei tudo com calma."; } else { msg = " Sem energia para limpar direito."; } }
  else if (mode === "frame"){
    if (chance(0.35 + P().stats.intelligence/300)){ D.heat = clamp(D.heat - 20); msg = " Plantei pistas que apontam para outra pessoa."; P().karma = clamp(P().karma - 10); }
    else { clues += 2; msg = " A pista falsa foi mal plantada — e aponta para mim."; }
  } else msg = " Saí rápido. Deve ter ficado algo para trás.";
  D.clues += clues; D.kills++; D.stealth = clamp(D.stealth + 2);
  S.stats.kills = num(S.stats.kills) + 1; martial().kills++;
  D.heat = clamp(D.heat + 6 + clues*9 + (t.id === "rival" ? 15 : 0) - darkCover()/6);
  D.victims.push({ name:`${target.first} ${target.last}`, type:t.name, age:P().age });
  // psicologia: o código importa
  if (t.guilty || D.code === "none"){ D.urge = clamp(D.urge - rint(45, 65)); addStress(-8); if (D.code === "none") P().karma = clamp(P().karma - 25); }
  else { D.urge = clamp(D.urge - 30); addStat("happiness", -20); addStress(20); P().karma = clamp(P().karma - 30); remember(`Quebrei meu próprio código com ${target.first}. Não sou quem eu achava que era.`, "bad"); msg += " Quebrei meu código. Isso me consome."; }
  log(`🌑 ${target.first} ${target.last} (${t.name.toLowerCase()}) desapareceu.`, "bad", ["crime"]);
  if (D.kills >= 3) achieve("darkpassenger", "Passageiro sombrio");
  if (D.heat >= 60) enqueue("ev_task_force");
  return `Feito.${msg} Pistas deixadas: ${clues}. Suspeita policial: ${Math.round(D.heat)}.`;
}
/* Resultado de uma caçada que virou briga (combate kind "hunt"). */
function huntFightAfter(F){
  const D = dark();
  F.ctx.target = F.ctx.target || { tid:"stranger", first:F.opp.first, last:F.opp.last, age:F.opp.age, gender:F.opp.gender }; // briga de caçada sem alvo planejado
  if (F.oppOutcome === "death"){ F.summary += " " + darkKill(F.ctx.target, F.usedWeapon, 0, "fast"); return; }
  D.heat = clamp(D.heat + (F.result === "win" ? 12 : 25)); D.clues++;
  F.summary += F.result === "win" ? " O alvo sobreviveu e vai falar com a polícia." : " Fugi ferido(a). Deixei sangue e rastros.";
}

/* ---------- Tick anual ---------- */
function darkYear(){
  const D = S.dark; if (!D || !D.active || !P().alive) return;
  if (inPrison()){ D.urge = clamp(D.urge + 5); return; }
  D.urge = clamp(D.urge + rint(10, 18) * (D.code === "code" ? 0.85 : 1));
  D.heat = clamp(D.heat - (5 + darkCover()/8));
  if (D.urge >= 70){ addStress(10); addStat("happiness", -6); enqueue("ev_dark_urge"); }
  if (D.heat >= 45 && chance(0.35)) enqueue("ev_dark_suspicion");
  if (D.heat >= 85 && D.clues >= 3 && chance(0.25 + D.clues*0.06)){
    log("🚨 A força-tarefa juntou as pistas. Fui preso(a) por assassinatos em série.", "bad", ["crime"]);
    const pen = DATA.penal[P().country] || { max:40, life:false };
    sendToPrison(pen.life ? 99 : pen.max, "assassinatos em série", "máxima");
    D.heat = 30; D.caught = true; addFame(30); addNoto(50);
  }
}
