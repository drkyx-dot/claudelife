"use strict";
/* =====================================================================
   systems/speech.js — falas: pensamentos do personagem, comentários de
   NPCs e abordagens. As falas refletem o estado (dinheiro, saúde, crime,
   amor, idade). say() aplica o filtro de linguagem leve se ativado.
   ===================================================================== */
function say(text){
  if (SETTINGS.lang !== "leve") return text;
  let t = text; for (const [re, rep] of DATA.SOFTEN) t = t.replace(re, rep); return t;
}
/* escolha estável dentro do mesmo ano (não muda a cada render) */
function stablePick(arr, salt){ return arr[Math.abs(hashStr(`${S.player.first}${P().age}${salt}`)) % arr.length]; }

function thoughtContext(){
  const p = P(), a = p.age, inc = Math.max(jobIncome(), priceOf(4000));
  if (a < 3) return "baby"; if (a < 13) return "child";
  if (inPrison()) return "prison";
  if (S.wanted) return "wanted";
  const roll = Math.abs(hashStr(`${p.first}${a}ctx`)) % 10; // estável no ano, sem gastar o RNG
  if (num(S.martial?.kills) > 0 && roll < 4) return "guilt";
  if (bestMastery() >= 40 && roll >= 7) return "fighter";
  if (S.loans.some(l=>l.missed) || debtTotal() > inc*2) return "debt";
  if (a >= 18 && S.money < priceOf(600)) return "broke";
  if (p.stress >= 70) return "stressed";
  if (S.illnesses.some(i=>i.diagnosed && byId(DATA.illnesses,i.id).sev >= 8) || p.stats.health < 30) return "sick";
  if (S.org || p.notoriety > 30) return "crime";
  if (a < 18) return "teen";
  if (a >= 18 && a < 65 && !S.job && !S.edu.school && !S.retired) return "unemployed";
  if (netWorth() > wageOf(1e6)) return "rich";
  if (a >= 70) return "old";
  const pt = partner(); if (pt && pt.rel > 65) return "love";
  if (!pt && a >= 25 && chance(0.3)) return "lonely";
  if (S.job && chance(0.5)) return "work";
  return p.stats.happiness > 65 ? "happy" : "work";
}
function currentThought(){ const ctx = thoughtContext(); return say(stablePick(DATA.thoughts[ctx] || DATA.thoughts.happy, ctx)); }

/* Comentário de alguém próximo (balão secundário na aba Vida). */
function npcComment(){
  const pool = [];
  for (const r of S.rels.filter(r=>r.alive && !r.unborn)){
    const key = r.role === "spouse" || r.role === "fiance" ? "partner" : r.role;
    if (DATA.npcLines[key] && !(key === "child" && r.age < 5)) pool.push([r, key]);
  }
  if (S.job && !inPrison()) pool.push([{ first: "Seu chefe", uid:"boss" }, "boss"]);
  if (S.org) pool.push([{ first: S.org.members[0]?.name || "Um capanga", uid:"crew" }, "crew"]);
  if (!pool.length) return null;
  const [r, key] = stablePick(pool, "npc");
  return { who: r.first, uid: r.uid, text: say(stablePick(DATA.npcLines[key], key + r.uid).replace("{me}", P().first)) };
}
function approachLine(kind){ return say(pick(DATA.approachLines[kind] || [""])); }
