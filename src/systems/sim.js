"use strict";
/* =====================================================================
   systems/sim.js — orquestra o "tick" anual.
   Ordem fixa (cada subsistema lê o que os anteriores produziram):
   envelhecimento/estresse → escola → carreira → negócios → ativos →
   finanças/crédito → relações → saúde → prisão → consequências
   agendadas → marcos → reparo/sanitização → morte → eventos do ano.
   Um snapshot antes/depois gera o "Resumo do ano" exibido na UI.
   ===================================================================== */
function takeSnapshot(){
  const p = P();
  return { ...p.stats, stress:p.stress, rep:p.reputation, fame:p.fame, vitality:p.vitality,
           money:S.money, nw:netWorth(), credit:S.credit };
}
function ageUp(){
  // briga/fuga deixada pela metade (save recarregado): resolve antes de avançar
  if (S.flags.forcedDeath && P().alive){ const c = S.flags.forcedDeath; delete S.flags.forcedDeath; die(c); return true; }
  if (S.fight) autoFight();
  if (S.escape) autoEscape();
  if (!P().alive || S.queue.length) return false;
  const before = S.snap || takeSnapshot();
  const Y = S.yearSummary = { income:0, taxes:0, expenses:0, lines:[] };
  P().age++;
  economyYear(); // inflação, salários e fase do ciclo
  S.activitiesThisYear = 0; S.actCount = {};

  agingYear(); schoolYear(); careerYear(); sportsYear(); gigYear(); martialYear(); businessYear(); assetsYear(); collectYear();
  financeYear(Y); orgYear(); relationshipsYear(); identityYear(); looksYear(); petsYear(); healthYear(); prisonYear(); fugitiveYear(); darkYear();
  consequencesYear(); milestoneYear();
  S.hist = S.hist || { happy:0, health:0, n:0 };
  S.hist.happy += P().stats.happiness; S.hist.health += P().stats.health; S.hist.n++;

  repairState(); sanitize();
  const after = takeSnapshot();
  S.lastYear = { age:P().age, before, after, net: Y.income - Y.expenses };
  S.snap = after;
  let cause = deathCheck();
  if (S.flags.forcedDeath){ cause = S.flags.forcedDeath; delete S.flags.forcedDeath; } // ataque de animal, erro médico…
  if (cause){ die(cause); return true; }
  queueEvents();
  return true;
}
/* Deltas relevantes do último ano (para o cartão "Seu ano"). */
function yearDeltas(){
  const L = S.lastYear; if (!L) return [];
  const keys = [["health","❤️ Saúde"],["happiness","😊 Felicidade"],["intelligence","🧠 Inteligência"],["looks","✨ Aparência"],["stress","😣 Estresse",true],["rep","💼 Reputação"],["credit","🏦 Crédito"]];
  const out = [];
  for (const [k,label,inverse] of keys){ const d = Math.round(num(L.after[k]) - num(L.before[k])); if (d) out.push({ label, d, good: inverse ? d < 0 : d > 0 }); }
  const dn = L.after.nw - L.before.nw; if (dn) out.push({ label:"📊 Patrimônio", d:dn, money:true, good: dn > 0 });
  return out;
}

/* ---------- Marcos ---------- */
function milestoneYear(){
  const a = P().age, nw = netWorth();
  if (a === 18) log("Atingi a maioridade! 🎉", "milestone");
  if (a === 13) log("Virei adolescente.", "");
  if (a === 60) log("Entrei na terceira idade.", "milestone");
  if (a === 100){ achieve("centenarian","Centenário(a)"); }
  if (nw >= wageOf(1e6)) achieve("millionaire", `Patrimônio de ${fmt(nw,true)}`);
  if (nw >= wageOf(1e8)) achieve("magnate","Magnata (patrimônio altíssimo)");
  if (P().fame >= 80) achieve("famous","Celebridade nacional");
  if (P().stats.looks >= 95) achieve("gorgeous","Beleza estonteante");
  if (P().stats.intelligence >= 98) achieve("genius","Gênio reconhecido");
  if (children().length >= 3) achieve("bigfamily","Família grande");
  if (S.credit >= 800) achieve("credit","Crédito excelente");
  if (a >= 80 && P().stats.health >= 60) achieve("healthy80","Chegou aos 80 com saúde");
}
