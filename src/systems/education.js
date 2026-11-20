"use strict";
/* systems/education.js */

/* ---------- Educação ---------- */
function schoolYear(){
  const a = P().age, E = S.edu;
  if (inPrison()) return;
  if (a === 6 && !E.school && E.level === 0){ E.school = "fund"; E.yearsLeft = 9; log("Comecei o Ensino Fundamental.", "milestone"); }
  if (!E.school) return;
  // desempenho escolar puxa em direção à inteligência
  const target = P().stats.intelligence * 0.8 + 15 + (hasTrait("lazy")?-10:0) + (hasTrait("ambitious")?6:0);
  E.perf = clamp(E.perf + (target - E.perf) * 0.3 + rfloat(-6,6));
  addStat("intelligence", (E.school === "uni" || E.school === "grad" ? rfloat(0.5,2) : rfloat(0,1)) * (1 - P().stats.intelligence/125));
  // custo anual de faculdade
  if (E.school === "uni" || E.school === "grad" || E.school === "tech"){
    const cost = E.school==="tech" ? priceOf(byId(DATA.techCourses,E.major)?.cost || 2500) : priceOf((byId(DATA.majors,E.major)?.cost || 8000) * (E.school==="grad"?1.2:1));
    payTuition(cost);
  }
  if (E.perf < 18 && E.school !== "fund" && chance(0.35)){
    log(`Fui reprovado por desempenho e saí do curso (${schoolName()}).`, "bad"); addStat("happiness",-12);
    if (E.school === "medio") E.dropped = true;
    E.school = null; E.yearsLeft = 0; return;
  }
  if (E.perf < 25 && (E.school==="fund"||E.school==="medio") && chance(0.3)){
    log("Repeti de ano na escola. 😓", "bad"); addStat("happiness",-6); return;
  }
  E.yearsLeft--;
  if (E.yearsLeft > 0) return;
  graduate();
}

function payTuition(cost){
  const E = S.edu, cls = P().cls;
  if (E.perf > 88 && chance(0.5)){ S.yearSummary.lines.push(["Bolsa de estudos", 0]); return; }
  const parentShare = parents().length ? classOf().eduShare : 0;
  const self = Math.round(cost * (1-parentShare));
  if (self <= 0) return;
  if (S.money >= self && P().age >= 18){ addMoney(-self); S.yearSummary.expenses += self; S.yearSummary.lines.push(["Mensalidades", -self]); }
  else { E.debt = num(E.debt) + self; S.yearSummary.lines.push(["Financiamento estudantil (dívida)", 0]); }
}

function schoolName(s = S.edu.school){
  return { fund:"Ensino Fundamental", medio:"Ensino Médio", tech:"Curso Técnico", uni:"Graduação", grad:"Pós-graduação", supl:"Supletivo" }[s] || "—";
}

function graduate(){
  const E = S.edu; const s = E.school; E.school = null;
  if (s === "fund"){ E.level = Math.max(E.level,1); log("Concluí o Ensino Fundamental! 🎒", "milestone"); E.school = "medio"; E.yearsLeft = 3; log("Entrei no Ensino Médio.", ""); return; }
  if (s === "medio" || s === "supl"){ E.level = Math.max(E.level,2); log(`Me formei no Ensino Médio com desempenho ${Math.round(E.perf)}/100. 🎓`, "milestone"); addStat("happiness",8); enqueue("ev_after_school"); return; }
  if (s === "tech"){ E.level = Math.max(E.level,3); E.techs.push(E.major); log(`Concluí o ${byId(DATA.techCourses,E.major).name}! 🛠️`, "milestone"); addStat("happiness",6); return; }
  if (s === "uni"){ E.level = Math.max(E.level,4); E.degrees.push(E.major); log(`Colei grau em ${byId(DATA.majors,E.major).name}! 🎓`, "milestone"); addStat("happiness",12); achieve("grad","Diploma universitário"); return; }
  if (s === "grad"){
    const lvl = E.gradLevel || 5; E.level = Math.max(E.level, lvl);
    log(lvl===6 ? "Defendi minha tese — agora sou Doutor(a)! 🧪" : "Concluí o Mestrado! 📚", "milestone");
    addStat("happiness",10); if (lvl===6) achieve("phd","Doutorado concluído");
  }
}

/* ---------- Educação ---------- */
function applyUniversity(majorId){
  const m = byId(DATA.majors, majorId), E = S.edu;
  if (E.level < 2) return "Preciso do Ensino Médio antes.";
  const o = oddsUniversity(m), score = o.score + rfloat(-12,12);
  if (score >= m.minInt){
    E.school = "uni"; E.major = m.id; E.yearsLeft = m.years; E.perf = clamp(E.perf*0.6 + 25);
    log(`Fui aprovado(a) no vestibular de ${m.name}! 🎉`, "milestone"); addStat("happiness",10); addStress(4);
    return `Aprovado(a) em ${m.name}!`;
  }
  log(`Reprovei no vestibular de ${m.name}.`, "bad"); addStat("happiness",-8);
  return `Não passei no vestibular de ${m.name} (nota ${Math.round(score)}, precisava ${m.minInt}).`;
}
function techEligibility(t){
  if (t.minInt && P().stats.intelligence < t.minInt) return `Requer inteligência ${t.minInt}`;
  if (t.minHealth && P().stats.health < t.minHealth) return `Exame médico: saúde ${t.minHealth}`;
  return null;
}
function startTech(id){ const E = S.edu; E.school = "tech"; E.major = id; E.yearsLeft = 2; E.perf = clamp(E.perf*0.5+30); log(`Comecei o ${byId(DATA.techCourses,id).name}.`, "milestone"); }

function startGrad(level){
  const E = S.edu;
  if (E.level < level-1 || E.level < 4) return R(false, "Requisito: diploma anterior.");
  if (P().stats.intelligence < (level===6?70:58)) return R(false, "Inteligência insuficiente para a seleção.");
  E.school = "grad"; E.gradLevel = level; E.yearsLeft = level===6 ? 4 : 2; E.major = E.degrees[E.degrees.length-1];
  log(`Ingressei no ${level===6?"Doutorado":"Mestrado"}.`, "milestone"); return R(true, "Matrícula feita!");
}

function returnToSchool(){
  if (S.edu.level >= 2 || S.edu.school || P().age < 16) return R(false, "Não disponível.");
  S.edu.school = "supl"; S.edu.yearsLeft = S.edu.level >= 1 ? 2 : 3; S.edu.dropped = false;
  if (S.edu.level < 1) S.edu.level = 1;
  log("Me matriculei no supletivo (EJA).", "milestone"); return R(true, "Matriculado(a) no supletivo.");
}

function dropOut(){
  if (!S.edu.school) return R(false, "Você não está estudando.");
  if (S.edu.school === "fund" || (S.edu.school==="medio" && P().age < 16)) return R(false, "Você é jovem demais para largar a escola.");
  const n = schoolName(); if (S.edu.school==="medio") S.edu.dropped = true;
  S.edu.school = null; S.edu.yearsLeft = 0;
  log(`Larguei o(a) ${n}.`, "bad"); return R(true, `Você largou o(a) ${n}.`);
}

function studyHarder(){
  if (!S.edu.school) return R(false, "Você não está estudando.");
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  S.edu.perf = clamp(S.edu.perf + rint(4,10)); addStat("intelligence", rfloat(0.5,2)); addStat("happiness",-1);
  return R(true, "Você estudou com afinco. Desempenho escolar subiu.");
}
