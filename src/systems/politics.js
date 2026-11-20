"use strict";
/* =====================================================================
   systems/politics.js — carreira política por eleições.
   Cargos não vêm por promoção: a cada 4 anos de mandato há eleição.
   A chance depende de fama, reputação, carisma, aparência, dinheiro de
   campanha e ficha. Propinas aceitas agendam investigações futuras.
   ===================================================================== */
const campaignCost = level => priceOf(3000 * Math.pow(2.2, level));

function oddsElection(level){
  const p = P();
  return mkOdds(0.25 - level * 0.05)
    .add("Fama", p.fame/250)
    .add("Reputação", (p.reputation - 50)/180)
    .add("Carismático", hasTrait("charismatic") ? 0.12 : 0)
    .add("Tímido", hasTrait("shy") ? -0.1 : 0)
    .add("Aparência", (p.stats.looks - 50)/400)
    .add("Inteligência (debates)", (p.stats.intelligence - 50)/400)
    .add("Mandato bem avaliado", S.job && career()?.elected ? (S.job.perf - 50)/250 : 0)
    .add("Escândalos (notoriedade)", -p.notoriety/150)
    .add("Antecedentes", -S.record.length * 0.15)
    .add("Idade madura", p.age >= 35 && p.age <= 70 ? 0.04 : p.age < 28 ? -0.06 : 0)
    .done(0.02, 0.85);
}
/* Primeira candidatura (vereador) ou disputa de cargo acima. */
function runForOffice(level){
  const c = byId(DATA.careers, "politician");
  if (P().age < 21) return R(false, "Idade mínima: 21 anos.");
  if (S.record.length) return R(false, "Ficha suja: candidatura impugnada.");
  if (level >= c.levels.length) return R(false, "Você já está no topo.");
  const cost = campaignCost(level);
  if (!canAfford(cost)) return R(false, `Campanha custa ${fmt(cost)}.`);
  addMoney(-cost); addStress(8);
  const o = oddsElection(level);
  if (!chance(o.p)){
    addRep(-2); log(`🗳️ Perdi a eleição para ${c.levels[level].t}.`, "bad"); addStat("happiness", -8);
    return R(false, `Derrota nas urnas (${Math.round(o.p*100)}% de chance).`);
  }
  if (S.job && S.job.careerId !== "politician") endJob("Eleito(a) para cargo público");
  S.partTime = null;
  S.job = { careerId:"politician", level, levelYears:0, years: S.job?.careerId === "politician" ? S.job.years : 0, perf:55, effort:1, salary: salaryFor(c, level, 0) };
  addFame(8 + level*6); addRep(4); addStat("happiness", 12);
  log(`🗳️ Fui eleito(a) ${c.levels[level].t}!`, "milestone");
  if (level === c.levels.length - 1) achieve("president", "Chegou à Presidência");
  return R(true, `Eleito(a) ${c.levels[level].t}!`);
}
/* Chamado em careerYear para políticos: fim de mandato → evento de eleição. */
function politicsYear(){
  const J = S.job;
  if (J.levelYears > 0 && J.levelYears % 4 === 0) enqueue("ev_election");
  if (chance(0.12)) enqueue("ev_bribe");
}
