"use strict";
/* =====================================================================
   systems/modifiers.js — chances contextuais COM explicação.
   Toda probabilidade importante do jogo é montada aqui a partir do
   estado (atributos, histórico, reputação, saúde, dinheiro…), e a UI
   mostra os fatores ao jogador. Isso é o "nexo": a mesma reputação que
   cai numa demissão aparece depois como −8% numa entrevista.

   Odds = { p (0–1), mods: [[rótulo, delta]] }
   ===================================================================== */
function mkOdds(base){
  const o = { base, mods: [] };
  o.add = (label, v) => { if (isFinite(v) && Math.abs(v) >= 0.005) o.mods.push([label, v]); return o; };
  o.done = (lo = 0.03, hi = 0.95) => { o.p = Math.max(lo, Math.min(hi, o.base + o.mods.reduce((a,[,v])=>a+v,0))); return o; };
  return o;
}
/* Texto compacto: "62% · +10 Carismático · −15 Antecedentes" (4 maiores fatores). */
function explainOdds(o, max = 4){
  const top = o.mods.slice().sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0, max);
  return `<b>${Math.round(o.p*100)}%</b>` + top.map(([l,v]) => ` · <span class="${v>0?"good":"bad"}">${v>0?"+":"−"}${Math.round(Math.abs(v)*100)}</span> ${esc(l)}`).join("");
}
const oddsColor = p => p >= 0.6 ? "good" : p >= 0.3 ? "warn" : "bad";

/* ---------- Mercado de trabalho ---------- */
function oddsHire(c){
  const p = P(), E = S.edu, statV = c.talent ? p.talents[c.talent] : p.stats[c.stat];
  let o;
  if (c.exam){ // concurso: prova pesa quase tudo
    o = mkOdds((p.stats.intelligence - 65) / 40).add("Preparo de estudo", (E.perf-60)/400).add("Ansiedade na prova", hasTrait("anxious") ? -0.08 : 0);
  } else if (c.elected){
    return oddsElection(0);
  } else {
    o = mkOdds(0.35)
      .add(c.talent ? "Talento" : `Atributo-chave (${STAT_LABEL[c.stat]})`, Math.max(-0.3, Math.min(0.25, (statV-50)/140)))
      .add("Inteligência vs. exigência", Math.max(-0.25, Math.min(0.15, (p.stats.intelligence - c.minInt)/200)))
      .add("Formação acima do exigido", Math.min(0.09, Math.max(0, E.level - c.edu) * 0.03))
      .add("Superqualificado(a) para a vaga", c.edu <= 2 && E.level >= 4 ? -0.2 : 0)
      .add("Mercado de trabalho local", (country().opp - 1) * 0.12);
  }
  o.add("Ofício aprendido na prisão", prisonHireBonus(c))
   .add("Indicação de amigo", S.flags.referral && S.flags.referral.age === p.age ? S.flags.referral.bonus : 0);
  o.add("Reputação profissional", (p.reputation - 50)/200)
   .add("Carismático", hasTrait("charismatic") ? 0.1 : 0)
   .add("Timidez/ansiedade", (hasTrait("shy") || hasTrait("anxious")) ? -0.08 : 0)
   .add("Notoriedade negativa", -p.notoriety/250)
   .add("Antecedentes criminais", -S.record.length*0.06)
   .add("Tempo desempregado", S.unemployedYears > 3 ? -Math.min(0.15, S.unemployedYears*0.015) : 0)
   .add("Etarismo do mercado", p.age > 50 ? -(p.age-50)/100 : 0)
   .add("Saúde debilitada", p.stats.health < 35 ? -0.1 : 0)
   .add("Estresse aparente", p.stress > 75 ? -0.05 : 0)
   .add("Carta de referência", S.flags.reference ? 0.07 : 0)
   .add(`Economia (${phaseName()})`, phase().hire)
   .add("Vício perceptível", Math.max(S.addictions.alcohol, S.addictions.gambling) > 60 ? -0.1 : 0);
  o.done();
  if (c.fame) o.p = Math.min(o.p, 0.12 + statV/170);
  return o;
}
function oddsPromotion(){
  const J = S.job, c = career(), p = P();
  const statV = c.talent ? p.talents[c.talent] : p.stats[c.stat];
  const o = mkOdds((J.perf - 55)/100)
    .add("Ambicioso", hasTrait("ambitious") ? 0.08 : 0)
    .add("Carismático", hasTrait("charismatic") ? 0.05 : 0)
    .add("Reputação", (p.reputation - 50)/250)
    .add("Mentoria", S.flags.mentor ? 0.1 : 0)
    .add("Hora extra", J.effort === 2 ? 0.04 : 0)
    .add("Estresse alto", p.stress > 70 ? -0.06 : 0)
    .add("Vício", S.addictions.alcohol > 50 ? -0.08 : 0)
    .add(`Economia (${phaseName()})`, phase().hire * 0.8)
    .done(0, 0.8);
  if (c.fame) o.p *= 0.6 * (statV/70);
  return o;
}
function oddsUniversity(m){
  const p = P(), E = S.edu;
  const base = p.stats.intelligence*0.6 + E.perf*0.4 - (hasTrait("anxious")?5:0);
  // nota = base + U(−12, 12) ≥ mínima  →  P = (12 − (mín − base)) / 24
  const pr = Math.max(0, Math.min(1, (12 - (m.minInt - base)) / 24));
  const o = mkOdds(pr).add("Desempenho escolar", 0).done(0, 1);
  o.mods = [["Inteligência", (p.stats.intelligence - m.minInt)/100], ["Desempenho escolar", (E.perf - 60)/100]];
  if (hasTrait("anxious")) o.mods.push(["Ansiedade", -0.05]);
  o.score = base;
  return o;
}
/* Habilidade técnica efetiva para cibercrime (treino + formação). */
function cyberLevel(){ return clamp(num(S.cyberSkill) + (S.edu.degrees.includes("cs") ? 20 : 0) + (S.edu.techs.includes("t_it") ? 8 : 0)); }
function oddsCrime(c){
  const p = P();
  if (c.cyber) return mkOdds(c.success)
    .add("Inteligência", (p.stats.intelligence - 55)/250)
    .add("Habilidade técnica", (cyberLevel() - num(c.skill))/250)
    .add("Cauteloso", hasTrait("cautious") ? 0.04 : 0)
    .add("Polícia de olho em você", -p.notoriety/600)
    .add("Em liberdade condicional", S.parole > 0 ? -0.08 : 0)
    .done(0.03, 0.92);
  return mkOdds(c.success)
    .add("Cauteloso", hasTrait("cautious") ? 0.05 : 0)
    .add("Impulsivo", hasTrait("impulsive") ? -0.06 : 0)
    .add("Em liberdade condicional", S.parole > 0 ? -0.1 : 0)
    .add("Inteligência", (p.stats.intelligence - 50)/500)
    .add("Polícia de olho em você", -p.notoriety/400)
    .add("Policiamento local", (country().crime - 1) * 0.06)
    .add("Saúde/agilidade", (p.stats.health - 60)/600)
    .done(0.02, 0.93);
}
function oddsLoanRate(base){ // juros personalizados pelo score de crédito
  return Math.max(0.03, base + (700 - S.credit) / 1000);
}
function creditLabel(c = S.credit){ return c >= 760 ? "Excelente" : c >= 680 ? "Bom" : c >= 600 ? "Regular" : c >= 520 ? "Ruim" : "Péssimo"; }

/* ---------- Saúde ---------- */
/* Multiplicador de risco de contrair uma doença (1 = população média). */
function illnessRisk(d){
  const p = P(), A = S.addictions, r = d.risk || {};
  const f = {
    smoke: A.smoke/100, alcohol: A.alcohol/100,
    stress: Math.max(0, p.stress - 40)/60,
    sedentary: Math.min(1, S.health.sedentary/8),
    age: Math.max(0, p.age - (d.minAge||0))/40,
    lux: p.lifestyle === 3 ? 1 : 0,
  };
  let m = 1; for (const k in r) m += r[k] * (f[k]||0);
  if ((S.health.genetic||[]).includes(d.id)) m *= 1.8;
  if (hasTrait("athletic")) m *= 0.85;
  return m;
}
/* Chance anual de cura de uma doença com um dado tier de tratamento. */
function oddsCure(ill, tierId){
  const d = byId(DATA.illnesses, ill.id), st = DATA.stages[ill.stage], t = byId(DATA.treatments, tierId), p = P();
  if (d.chronic) return { p:0, mods:[["Crônica: só controle", 0]] };
  const age = 1 - Math.max(0, p.age - 50) * 0.012;
  const body = 0.6 + p.stats.health/250;
  const pr = Math.max(0.01, Math.min(0.97, d.cure * st.cure * t.eff * age * body));
  return { p: pr, mods: [[`Estágio ${st.name}`, st.cure - 1], [t.name, t.eff - 1], ["Idade", age - 1], ["Condição física", body - 1]] };
}
/* Fatores de risco atuais para exibição na aba Saúde. */
function riskProfile(){
  const p = P(), A = S.addictions, out = [];
  const lvl = v => v >= 0.66 ? "bad" : v >= 0.33 ? "warn" : "good";
  if (p.age >= 45) out.push({ k:"Idade", v:Math.min(1,(p.age-45)/40), txt:`${p.age} anos: risco cardíaco e de câncer crescente` });
  if (p.stress >= 45) out.push({ k:"Estresse", v:(p.stress-40)/60, txt:`Estresse ${Math.round(p.stress)}: pressão, coração, depressão` });
  for (const a of DATA.addictions) if (A[a.id] >= 10) out.push({ k:a.name, v:A[a.id]/100, txt:`${a.emoji} ${Math.round(A[a.id])}/100 — ${a.desc}` });
  if (S.health.sedentary >= 3 && p.age >= 20) out.push({ k:"Sedentarismo", v:Math.min(1,S.health.sedentary/8), txt:`${S.health.sedentary} ano(s) sem exercício` });
  if ((S.health.genetic||[]).length) out.push({ k:"Genética", v:0.4, txt:`Histórico familiar: ${S.health.genetic.map(id=>byId(DATA.illnesses,id).name).join(", ")}` });
  if (S.health.sequelae > 0) out.push({ k:"Sequelas", v:Math.min(1,S.health.sequelae/30), txt:`Teto de saúde reduzido em ${Math.round(S.health.sequelae)} por lesões antigas` });
  if (S.job && S.job.effort === 2) out.push({ k:"Excesso de trabalho", v:0.5, txt:"Hora extra constante desgasta corpo e mente" });
  return out.map(x => ({ ...x, level: lvl(x.v) }));
}
