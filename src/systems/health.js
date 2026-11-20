"use strict";
/* =====================================================================
   systems/health.js — saúde, doenças por estágio, check-up, tratamento,
   planos de saúde, vícios, sequelas e morte.

   PRINCÍPIOS DE BALANCEAMENTO (auditoria v4):
   • Check-up NÃO cura nem dá saúde: ele DIAGNOSTICA (com chance
     realista dependente de plano, estágio e tipo de doença). 1×/ano.
   • Recuperação natural tem retorno decrescente com a idade e nunca
     passa do teto = vitalidade (cai com a idade) − sequelas.
   • Doenças evoluem em 4 estágios se não tratadas; detectar cedo é mais
     barato e muito mais eficaz. Crônicas nunca curam: só são controladas.
   • Tratamento custa por ano (cobertura do plano reduz), com eficácia
     que cai com estágio, idade e condição física.
   • Estilo de vida acumula: estresse, vícios, sedentarismo e excesso de
     trabalho aumentam o risco e drenam saúde todo ano.
   ===================================================================== */
const stageName = i => DATA.stages[i.stage].name;
function effectivePlan(){
  const id = S.health.plan !== "none" ? S.health.plan : (S.health.employerPlan ? "basic" : "none");
  return byId(DATA.healthPlans, id);
}
function planPremium(id = S.health.plan){
  const pl = byId(DATA.healthPlans, id); if (!pl || !pl.cost) return 0;
  const chronic = S.illnesses.filter(i => i.diagnosed && byId(DATA.illnesses,i.id).chronic).length;
  return priceOf(pl.cost * (1 + Math.max(0, P().age - 35) * 0.035) * (1 + chronic * 0.25));
}
/* Quanto do custo de saúde o jogador paga (menores: pais cobrem parte). */
function selfPayShare(){
  if (P().age >= 18 || !parents().length) return 1;
  return classOf().uninsured;
}
function treatmentCost(il, tierId = il.tier){
  const d = byId(DATA.illnesses, il.id), t = byId(DATA.treatments, tierId);
  const cov = tierId === "public" ? 0 : effectivePlan().coverage;
  return Math.round(priceOf(d.cost) * DATA.stages[il.stage].cost * t.costMult * (1 - cov) * selfPayShare());
}
function checkupCost(){ return Math.round(priceOf(350) * (1 - effectivePlan().coverage) * selfPayShare()); }

/* Lesão aguda com possível sequela permanente (reduz o teto de saúde). */
function injure(amount, cause, sequelaChance = 0.3){
  addStat("health", -amount);
  if (amount >= 18) emit("hospital"); // ferimento sério = ambulância
  if (amount >= 12 && chance(sequelaChance)){
    const s = Math.round(amount * 0.25);
    S.health.sequelae = num(S.health.sequelae) + s;
    remember(`${cause} deixou sequela permanente (teto de saúde −${s}).`, "bad");
    return ` Sequela permanente: teto de saúde −${s}.`;
  }
  return "";
}

/* ---------- Tick anual ---------- */
function healthYear(){
  const a = P().age, st = P().stats, Y = S.yearSummary;
  // exercício × sedentarismo (acumulativo)
  if (S.health.exercised) S.health.sedentary = 0; else if (a >= 18) S.health.sedentary++;
  if (S.health.sedentary > 2) addStat("health", -Math.min(2, S.health.sedentary*0.2));
  addictionsYear();
  // contrair doenças
  for (const d of DATA.illnesses){
    if (d.manual || S.illnesses.some(i=>i.id===d.id) || a < (d.minAge||0)) continue; // manual = só por causa específica (ex.: IST)
    let p = d.id === "flu" ? 0.07 : d.id === "depress" ? 0.012 : 0.0025 + Math.max(0, a - d.minAge)*0.00055;
    p *= illnessRisk(d) * (1.5 - st.health/100);
    if (chance(Math.min(0.2, p))){
      const il = { id:d.id, years:0, stage:1, diagnosed: d.symptoms <= 1, treated:false, tier:null };
      S.illnesses.push(il);
      if (il.diagnosed) log(`Fiquei doente: ${d.name}. 🤒`, "bad");
    }
  }
  // evolução, dano, custo e cura
  for (const il of S.illnesses){
    const d = byId(DATA.illnesses, il.id), t = il.treated ? byId(DATA.treatments, il.tier) : null;
    il.years++;
    const prog = il.treated ? d.progress * (il.tier === "public" ? 0.35 : 0.2) : d.progress;
    if (il.years > 1 && il.stage < 4 && chance(prog)){ il.stage++; if (il.diagnosed) log(`${d.name} avançou para o estágio ${stageName(il)}.`, "bad"); }
    if (!il.diagnosed && il.stage >= d.symptoms){ il.diagnosed = true; log(`Os sintomas apareceram: diagnóstico de ${d.name} já em estágio ${stageName(il)}. 🏥`, "bad"); remember(`${d.name} foi descoberto(a) tarde, sem check-up preventivo.`, "bad"); }
    const reduce = il.treated ? (d.chronic ? 0.25 : 0.45) / t.eff : (d.chronic ? 0.55 : 1);
    addStat("health", -d.sev * DATA.stages[il.stage].dmg * reduce * rfloat(0.7, 1.2));
    if (il.stage >= 3) S.health.sequelae = num(S.health.sequelae) + 0.5;
    if (il.treated){
      const cost = treatmentCost(il);
      if (cost){ addMoney(-cost); Y.expenses += cost; Y.lines.push([`Tratamento: ${d.name}`, -cost]); }
      if (!d.chronic && chance(oddsCure(il, il.tier).p)){ il.cured = true; log(`Venci a doença: ${d.name}! 💪`, "good"); if (il.stage >= 3) achieve("survivor","Sobreviveu a uma doença grave"); }
    } else if (!d.chronic){
      const spont = d.sev < 8 && il.stage <= 2 ? d.cure * 0.7 : 0.03;
      if (chance(spont)){ il.cured = true; if (il.diagnosed) log(`Me recuperei de ${d.name} sem tratamento.`, "good"); }
    }
  }
  S.illnesses = S.illnesses.filter(i=>!i.cured);
  // estresse crônico desgasta o corpo
  if (P().stress > 60) addStat("health", -(P().stress - 60) / 12);
  if (S.job && S.job.effort === 2) addStat("health", -1);
  // recuperação natural com retorno decrescente pela idade, limitada pelo teto
  const cap = healthCap(), untreatedSerious = S.illnesses.some(i => !i.treated && byId(DATA.illnesses,i.id).sev >= 8);
  if (st.health < cap){
    const rate = 0.22 * Math.max(0.25, 1 - a/120) * (untreatedSerious ? 0.4 : 1);
    addStat("health", (cap - st.health) * rate);
  }
  if (S.health.exercised) S.gymYears++;
  S.health.exercised = false;
}

function addictionsYear(){
  const A = S.addictions, p = P();
  if (p.stress > 70 && p.age >= 18 && (hasTrait("impulsive") || hasTrait("anxious")) && chance(0.35)) A.alcohol = clamp(A.alcohol + 5);
  for (const d of DATA.addictions){
    const v = A[d.id]; if (!v) continue;
    A[d.id] = clamp(v > 40 ? v + d.grip : v - 2);
    if (d.healthDmg) addStat("health", -A[d.id] * d.healthDmg);
  }
  if (A.alcohol > 40){
    if (S.job) S.job.perf = clamp(S.job.perf - (A.alcohol-40)/4);
    const pt = partner(); if (pt && A.alcohol > 55) pt.rel = clamp(pt.rel - 4);
  }
  if (A.gambling > 50 && S.money > 0){
    const loss = Math.round(S.money * rfloat(0.05, 0.15)); addMoney(-loss);
    S.yearSummary.lines.push(["Perdas com apostas", -loss]); S.yearSummary.expenses += loss;
    log(`🎰 O vício em apostas me custou ${fmt(loss)} este ano.`, "bad");
  }
}

/* ---------- Ações de saúde (UI) ---------- */
function medicalCheckup(){
  if (inPrison()) return R(false, "O atendimento médico da prisão é limitado.");
  if (S.health.lastCheckup === P().age) return R(false, "Você já fez check-up este ano.");
  const cost = checkupCost();
  if (cost && P().age >= 18 && !canAfford(cost)) return R(false, `O check-up custa ${fmt(cost)}.`);
  addMoney(-cost); S.health.lastCheckup = P().age;
  const plan = effectivePlan(), found = [];
  for (const il of S.illnesses.filter(i => !i.diagnosed)){
    const d = byId(DATA.illnesses, il.id);
    if (chance(Math.min(0.98, d.detect * plan.detect * (il.stage >= 2 ? 1.15 : 1)))){ il.diagnosed = true; found.push(`${d.name} (${stageName(il)})`); }
  }
  const msg = found.length ? `Check-up detectou: ${found.join(", ")}. Trate na aba Saúde.` : "Check-up sem achados. Isso não garante que esteja tudo bem — a detecção não é perfeita.";
  log(`🩺 ${msg}`, found.length ? "bad" : "good");
  if (found.length) remember(`Check-up preventivo encontrou ${found.join(", ")} cedo.`, "good");
  return R(true, msg);
}
function treatIllness(id, tierId){
  const il = S.illnesses.find(i => i.id === id), t = byId(DATA.treatments, tierId);
  if (!il || !il.diagnosed) return R(false, "Doença não diagnosticada.");
  if (t.minStage && il.stage < t.minStage) return R(false, `Disponível apenas a partir do estágio ${DATA.stages[t.minStage].name}.`);
  const d = byId(DATA.illnesses, id), cost = treatmentCost(il, tierId);
  if (tierId !== "public" && !canAfford(cost)) return R(false, `Precisa de ${fmt(cost)} para o primeiro ano.`);
  il.treated = true; il.tier = tierId; emit("hospital");
  let extra = "";
  if (chance(t.risk)) extra = " Houve complicações." + injure(15, `Complicação no tratamento de ${d.name}`, 0.5);
  log(`Comecei tratamento (${t.name}) para ${d.name}${d.chronic ? " — controle contínuo" : ""}.${extra}`, extra ? "bad" : "");
  return R(true, `Tratamento iniciado: ${fmt(cost)}/ano.${extra}`);
}
function stopTreatment(id){ const il = S.illnesses.find(i=>i.id===id); if (!il) return R(false,"?"); il.treated = false; il.tier = null; log(`Interrompi o tratamento de ${byId(DATA.illnesses,id).name}.`, "bad"); return R(true, "Tratamento interrompido."); }
function setHealthPlan(id){
  if (P().age < 18) return R(false, "Menores usam o plano dos pais.");
  S.health.plan = id; const pl = byId(DATA.healthPlans, id);
  log(id === "none" ? "Cancelei meu plano de saúde." : `Contratei: ${pl.name} (${fmt(planPremium(id))}/ano).`, "");
  return R(true, id === "none" ? "Plano cancelado." : `${pl.name} ativo.`);
}
function quitAddiction(id){
  const A = S.addictions, d = byId(DATA.addictions, id);
  if (!A[id]) return R(false, "Você não tem esse vício.");
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  const p = 0.28 + (hasTrait("resilient")?0.15:0) + (hasTrait("impulsive")?-0.1:0) - A[id]/250 + (P().stress < 40 ? 0.08 : -0.05);
  if (chance(Math.max(0.05, p))){
    A[id] = clamp(A[id] - rint(25, 45)); addStat("happiness", -5); addStress(5);
    if (id === "smoke" && A[id] === 0) schedule("quitBenefit", 3);
    log(`Lutei contra ${d.name.toLowerCase()} e consegui reduzir. 💪`, "good");
    return R(true, `Progresso contra ${d.name.toLowerCase()}! Abstinência é dura (−5 felicidade).`);
  }
  A[id] = clamp(A[id] + 3); addStat("happiness", -3);
  log(`Tentei largar ${d.name.toLowerCase()} e recaí.`, "bad");
  return R(false, "Recaída. Tentar de novo (ou reabilitação) ajuda.");
}
function rehab(){
  if (P().age < 16) return R(false, "Indisponível.");
  if (!Object.values(S.addictions).some(v => v >= 20)) return R(false, "Você não precisa de reabilitação.");
  if (S.flags.rehabYear === P().age) return R(false, "Você já passou pela clínica este ano.");
  const cost = Math.round(priceOf(6000) * (1 - effectivePlan().coverage*0.5));
  if (!canAfford(cost)) return R(false, `A clínica custa ${fmt(cost)}.`);
  addMoney(-cost); S.flags.rehabYear = P().age;
  for (const k in S.addictions) S.addictions[k] = clamp(S.addictions[k] * rfloat(0.3, 0.6));
  addStress(-10); addStat("happiness", -3);
  if (S.job) S.job.perf = clamp(S.job.perf - 8);
  log("Passei um período numa clínica de reabilitação. 🏥", "milestone"); remember("Encarei a reabilitação — os vícios perderam força.", "good");
  return R(true, "Reabilitação concluída: vícios reduzidos drasticamente.");
}

/* ---------- Morte ---------- */
function deathCheck(){
  const a = P().age, h = P().stats.health;
  if (h <= 0){
    const worst = S.illnesses.slice().sort((x,y)=>y.stage-x.stage)[0];
    return worst ? byId(DATA.illnesses, worst.id).name : "falência múltipla de órgãos";
  }
  const hf = Math.max(0.35, 1 + (60 - h)/22);
  let q = Math.min(0.9, (a < 1 ? 0.003 : 0.00004*Math.exp(0.092*a)) * hf);
  const terminal = S.illnesses.find(i => i.stage === 4 && !byId(DATA.illnesses,i.id).chronic);
  if (terminal) q = Math.min(0.95, q + (terminal.treated ? 0.12 : 0.28));
  if (chance(q)){
    if (terminal) return byId(DATA.illnesses, terminal.id).name;
    const serious = S.illnesses.filter(i=>byId(DATA.illnesses,i.id).sev>=8);
    if (serious.length && chance(0.6)) return byId(DATA.illnesses, pick(serious).id).name;
    return a > 70 ? pick(["causas naturais, enquanto dormia","insuficiência cardíaca","um AVC","velhice"]) : pick(["um acidente doméstico","um infarto súbito","um aneurisma","um AVC"]);
  }
  if (a >= 120) return "velhice extrema";
  return null;
}
