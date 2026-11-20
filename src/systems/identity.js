"use strict";
/* =====================================================================
   systems/identity.js — DESCOBERTA GRADUAL DA ORIENTAÇÃO SEXUAL.

   O personagem nasce "Em descoberta". Entre ~11 e 22 anos, eventos
   (paixonite, festa, reflexão, convite para sair) somam inclinações:
     other = atração pelo outro gênero    same = pelo mesmo gênero
     both  = por mais de um gênero        pan  = "gênero não importa"
     none  = pouca ou nenhuma atração
   Com 3+ vivências, o evento "Me entendendo" sugere os rótulos mais
   coerentes com as escolhas e o JOGADOR decide (ou adia). Aos 23, se
   ainda indefinido, a orientação se assenta pelo padrão das escolhas.
   A orientação define o gênero dos pretendentes (partnerGender) e o
   peso de eventos românticos (assexual: bem menos abordagens).
   ===================================================================== */
const identity = () => S.identity || (S.identity = { other:0, same:0, both:0, none:0, pan:0, steps:0, resolved:false });
const orientationName = (o = P().orientation) => DATA.orientations[o] || o;
const discovering = () => P().orientation === "descobrindo";

/* Registra uma vivência. delta: { other, same, both, none, pan } */
function leanIdentity(delta){
  const I = identity(); if (I.resolved) return;
  for (const k of ["other","same","both","none","pan"]) I[k] = num(I[k]) + num(delta[k]);
  I.steps++;
}
/* Ranking de rótulos coerentes com as escolhas (melhor primeiro). */
function orientationCandidates(){
  const I = identity(), o = num(I.other) + num(I.both), s = num(I.same) + num(I.both), n = num(I.none), mx = Math.max(o, s);
  const sc = {
    hetero: o - s*0.9 - n*0.5,
    homo:   s - o*0.9 - n*0.5,
    bi:     Math.min(o, s) * 1.4 + num(I.both) - n*0.5 - Math.abs(o - s)*0.3,
    pan:    Math.min(o, s) + num(I.pan) * 1.6 - n*0.5,
    ace:    n * 1.5 - mx * 0.6,
  };
  return Object.keys(sc).sort((a, b) => sc[b] - sc[a]);
}
function setOrientation(o, how = "escolha"){
  const I = identity();
  P().orientation = o; I.resolved = true; I.age = P().age;
  log(`🏳️‍🌈 Me entendi: ${orientationName(o).toLowerCase()}.`, "milestone");
  remember(`Descobri minha orientação (${orientationName(o).toLowerCase()}) ${how === "auto" ? "com o tempo, sem pressa" : "depois de muita reflexão"}.`, "good");
  addStat("happiness", 6); addStress(-6);
  if (["homo","bi","pan"].includes(o)) enqueue("ev_coming_out");
}
function identityYear(){
  if (!discovering()) return;
  const a = P().age, I = identity();
  if (a >= 23) return setOrientation(orientationCandidates()[0], "auto");
  if (a >= 16 && I.steps >= 3 && !S.queue.some(q => q.id === "ev_identity_conclusion") && chance(0.5)) enqueue("ev_identity_conclusion");
}
