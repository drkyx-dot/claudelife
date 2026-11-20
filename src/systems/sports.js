"use strict";
/* =====================================================================
   systems/sports.js — VIDA DE ATLETA (carreiras com athlete:true).
   • Contrato (J.contract anos, J.club, J.contractMult no salário). No fim
     do contrato, o jogador escolhe: renovar, transferência para clube
     maior (se estiver bem), proposta do exterior ou ficar livre.
   • Lesões: chance anual pelo risco do esporte, ritmo de treino e idade;
     lesão grave tira a temporada (desempenho despenca).
   • Títulos: chance pela forma; dão bônus em dinheiro, fama e conquistas.
   • Declínio físico depois dos 30 (eSports: 26) e aposentadoria
     esportiva com transição para técnico(a), comentarista ou olheiro(a).
   ===================================================================== */
const isAthlete = () => !!(S.job && career()?.athlete);
const peakEnd = c => c.id === "esports" ? 26 : 30;
const retireAge = c => c.id === "esports" ? 31 : c.id === "fighter" ? 38 : 36;

/* Forma = talento esportivo, saúde, desempenho e (lutas) maestria. */
function athleteForm(){
  const c = career(), p = P(), J = S.job;
  const age = p.age, decline = Math.max(0, age - peakEnd(c)) * 3.5;
  const base = c.id === "esports" ? p.stats.intelligence*0.5 + p.talents.sport*0.1 : p.talents.sport*0.45 + p.stats.health*0.3;
  return clamp(base + J.perf*0.3 + (c.id === "fighter" ? bestMastery()*0.2 : 0) - decline - num(J.injured)*25);
}
function sportsYear(){
  if (!isAthlete()) return;
  const c = career(), J = S.job, p = P();
  J.club = J.club || pick(DATA.clubNames);
  if (J.contract === undefined) J.contract = rint(2, 4);
  J.injured = 0;
  // lesões
  const riskInj = (0.03 + c.risk*0.025) * (J.effort === 2 ? 1.6 : J.effort === 0 ? 0.7 : 1) * (p.age > 30 ? 1.5 : 1) * (p.stats.health < 50 ? 1.4 : 1);
  if (chance(riskInj)){
    const grave = chance(0.3);
    J.injured = grave ? 1 : 0; J.perf = clamp(J.perf - (grave ? 25 : 8));
    const s = injure(grave ? rint(14, 26) : rint(4, 10), grave ? "Uma lesão grave no esporte" : "Uma lesão no esporte", grave ? 0.45 : 0.1);
    log(`🩹 ${grave ? "Lesão grave: fiquei fora da temporada." : "Lesão leve: algumas semanas parado(a)."}${s}`, "bad", ["health","work"]);
    if (grave) emit("hospital");
    if (grave && p.age > 32 && chance(0.25)) return enqueue("ev_sport_retire", { forced:true });
  }
  // títulos
  const form = athleteForm();
  if (!J.injured && chance(clamp((form - 45)/220 + J.level*0.03, 0.01, 0.45))){
    const bonus = Math.round(J.salary * rfloat(0.2, 0.7));
    addMoney(bonus); S.yearSummary.income += bonus; S.stats.earned += bonus; S.yearSummary.lines.push(["🏆 Bônus por título", bonus]);
    J.titles = num(J.titles) + 1; addFame(3 + J.level*2); addRep(3);
    log(`🏆 Fui campeão(ã) com o ${J.club}! Bônus de ${fmt(bonus)}.`, "milestone", ["work"]);
    achieve("sporttitle", "Campeão(ã) no esporte profissional");
    if (J.titles >= 5) achieve("sportlegend", "Cinco títulos no esporte");
  }
  // contrato e aposentadoria
  J.contract--;
  if (p.age >= retireAge(c) || (p.age >= retireAge(c) - 3 && chance(0.25))) enqueue("ev_sport_retire", { forced: p.age >= retireAge(c) + 2 });
  else if (J.contract <= 0) enqueue("ev_sport_contract", sportOffers());
}
/* Gera as propostas de fim de contrato conforme a forma. */
function sportOffers(){
  const form = athleteForm(), J = S.job;
  const others = DATA.clubNames.filter(n => n !== J.club);
  return { form: Math.round(form),
    renew: { mult: Math.max(0.7, num(J.contractMult, 1) * (form > 60 ? rfloat(1.05, 1.25) : rfloat(0.75, 0.95))), years: rint(2, 4) },
    big: form >= 62 ? { club: pick(others), mult: num(J.contractMult, 1) * rfloat(1.4, 2.1), years: rint(3, 5) } : null,
    abroad: form >= 55 ? { club: pick(["FC Bavaria","Lisboa Sporting","Tokyo United","LA Galaxy Stars","Club de México","Lagos Rangers"]), mult: num(J.contractMult, 1) * rfloat(1.8, 3), years: rint(2, 4) } : null };
}
function signContract(club, mult, years){
  const J = S.job; if (!J) return "";
  const moved = club && club !== J.club;
  if (club) J.club = club; J.contractMult = Math.round(mult*100)/100; J.contract = years;
  J.salary = Math.round(salaryFor(career(), J.level, J.levelYears) * J.contractMult);
  log(`✍️ ${moved ? `Transferência para o ${J.club}` : `Renovei com o ${J.club}`}: ${years} ano(s), ${fmt(J.salary)}/ano.`, "milestone", ["work","money"]);
  if (moved) addFame(2);
  return `Contrato assinado: ${fmt(J.salary)}/ano por ${years} ano(s).`;
}
/* Treino extra (ação do jogador): melhora o desempenho, com risco de lesão. */
function extraTraining(){
  if (!isAthlete()) return R(false, "Só para atletas.");
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  const J = S.job; J.perf = clamp(J.perf + rint(4, 9) * dim("sporttrain")); S.actCount.sporttrain = num(S.actCount.sporttrain) + 1;
  P().talents.sport = clamp(P().talents.sport + rint(1, 3)); S.health.exercised = true;
  if (chance(0.06 + career().risk*0.015)) return R(false, "Exagerei no treino e me lesionei." + injure(rint(5, 12), "O treino extra", 0.15));
  return R(true, `Treino extra concluído. Desempenho ${Math.round(J.perf)}.`);
}
/* Transição pós-carreira: contrata direto, sem a fila de requisitos. */
function hireDirect(id, level = 0){
  const c = byId(DATA.careers, id); if (!c) return "";
  if (S.job) endJob("Aposentadoria esportiva");
  S.job = { careerId:id, level, levelYears:0, years:0, perf:60, effort:1, salary: salaryFor(c, level, 0) };
  log(`💼 Comecei nova carreira: ${c.levels[level].t} (${fmt(S.job.salary)}/ano).`, "milestone");
  return `Agora sou ${c.levels[level].t}.`;
}
