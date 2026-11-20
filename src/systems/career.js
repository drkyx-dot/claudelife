"use strict";
/* systems/career.js */

function salaryFor(c, level, years=0){
  const base = c.levels[Math.min(level, c.levels.length-1)].s;
  // MODO BRUTO: salários ~15% menores e reajuste por tempo de casa mais lento
  return wageOf(base * 0.85 * (1 + 0.015*Math.min(years,10)) * (0.85 + 0.15*country().opp));
}

/* ---------- Tick anual de carreira ----------
   Desempenho depende de atributo-chave, felicidade, esforço, traços,
   ESTRESSE e SAÚDE; reputação acumula com o desempenho e pesa em
   contratações futuras (systems/modifiers.js). */
function careerYear(){
  S.health.employerPlan = false;
  if (inPrison()) return;
  if (S.partTime && P().age >= 18 && S.job){ S.partTime = null; }
  if (!S.job){
    if (P().age >= 18 && P().age < 65 && !S.edu.school && !S.retired) S.unemployedYears++;
    return;
  }
  const J = S.job, c = career(), p = P();
  J.years++; J.levelYears++;
  S.health.employerPlan = c.edu >= 3 || J.level >= 2; // benefício: plano básico da empresa
  const statV = c.talent ? p.talents[c.talent] : p.stats[c.stat];
  const target = statV*0.5 + p.stats.happiness*0.2 + 20 + (J.effort-1)*15 + (hasTrait("ambitious")?8:0) - (hasTrait("lazy")?10:0)
    - Math.max(0, p.stress - 60)/2 - (p.stats.health < 30 ? 10 : 0);
  J.perf = clamp(J.perf + (target - J.perf)*0.35 + rfloat(-8,8));
  if (J.effort === 2) addStat("happiness",-3);
  if (J.effort === 0) addStat("happiness",2);
  if (J.perf > 75) addRep(2); else if (J.perf < 35) addRep(-2);
  if (c.elected){ // política: sem promoção/demissão; mandato e eleições
    J.salary = salaryFor(c, J.level, J.levelYears); addFame(J.level*2 + rfloat(-2,2)); politicsYear(); return;
  }
  // promoção
  const canPromote = J.level < c.levels.length-1 && !promotionBlocker();
  if (canPromote && J.perf > 62 && chance(oddsPromotion().p)){
    J.level++; J.levelYears = 0; addRep(4);
    log(`Fui promovido(a) a ${c.levels[J.level].t}! 📈`, "good"); addStat("happiness",8); emit("promotion");
    if (J.level === c.levels.length-1) achieve("top_"+c.id, `Topo da carreira: ${c.levels[J.level].t}`);
  }
  J.salary = Math.round(salaryFor(c, J.level, J.levelYears) * num(J.contractMult, 1)); // contratos esportivos multiplicam
  if (c.fame) addFame(J.level * 3 + rfloat(-2,3));
  // atletas: contrato, lesão, títulos e aposentadoria ficam em systems/sports.js
  if (c.athlete){ if (J.perf < 25 && J.contract > 1 && chance(0.35)){ J.contract = 1; J.contractMult = Math.max(0.5, num(J.contractMult, 1) * 0.8); log(`📉 O ${J.club || "clube"} me deixou no banco e cortou meu salário; o contrato não deve ser renovado.`, "bad"); } return; }
  // demissão (mancha a reputação)
  if (J.perf < 28 && chance(0.4)){
    log(`Fui demitido(a) do cargo de ${c.levels[J.level].t} por baixo desempenho. 📦`, "bad");
    endJob("Demitido"); addStat("happiness",-12); addRep(-12); addStress(8); return;
  }
  // layoff aleatório (crise) — não afeta reputação
  if (!c.stable && chance(0.03 * phase().layoff * (J.perf < 50 ? 1.5 : 1))){ log(`A empresa fez cortes (${phaseName()}) e perdi meu emprego de ${c.levels[J.level].t}.`, "bad"); endJob("Layoff"); addStat("happiness",-10); addStress(10); emit("loss"); return; }
  if (chance(0.22)) enqueue(pick(["ev_deadline","ev_credit_thief","ev_lead_project","ev_office_party","ev_strike"]));
  // risco ocupacional com possível sequela
  if (c.risk && chance(0.012*c.risk)){ const d = rint(5, 9*c.risk); const sq = injure(d, "Acidente de trabalho", 0.25); log(`Me machuquei no trabalho (−${d} saúde).${sq}`, "bad"); }
  // fim natural de carreiras físicas/estéticas
  if (c.id === "athlete" && p.age >= 32 && chance((p.age-31)*0.15)){ log("Meu corpo não acompanha mais: encerrei a carreira esportiva. 🏅", "milestone"); endJob("Fim da carreira esportiva"); addRep(5); return; }
  if (c.id === "model" && p.age >= 34 && chance(0.25)){ log("O mercado da moda me deixou de lado pela idade.", "bad"); endJob("Fim da carreira de modelo"); return; }
  if (p.age >= 60 && chance(0.04 + (p.age-60)*0.03)) enqueue("ev_retire_offer");
}

function endJob(reason){
  if (!S.job) return;
  const c = career();
  S.jobHistory.push({ career:c.name, title:c.levels[S.job.level].t, from:P().age - S.job.years, to:P().age, reason });
  S.lastSalary = S.job.salary;
  S.job = null;
}

/* ---------- Carreira ---------- */
function jobEligibility(c){
  const E = S.edu, a = P().age, st = P().stats;
  if (a < Math.max(18, c.minAge||0)) return `Idade mínima: ${Math.max(18, c.minAge||0)}`;
  if (inPrison()) return "Você está preso(a)";
  if (S.wanted && !S.wanted.fakeId) return "Foragido(a): qualquer checagem de documentos te entrega";
  if (S.wanted && (c.exam || c.elected || c.cleanRecord)) return "Identidade falsa não passa em concurso/checagem de antecedentes";
  if (E.level < c.edu) return `Requer ${DATA.eduLevels[c.edu]}`;
  if (c.major && !E.degrees.includes(c.major)) return `Requer diploma em ${byId(DATA.majors,c.major).name}`;
  if (c.tech && !E.techs.includes(c.tech)) return `Requer ${byId(DATA.techCourses,c.tech).name}`;
  if (c.cleanRecord && S.record.length) return "Exige ficha limpa";
  if (c.maxStartAge && a > c.maxStartAge) return `Idade máxima para começar: ${c.maxStartAge}`;
  if (c.minHealth && st.health < c.minHealth) return `Exame médico: saúde mínima ${c.minHealth}`;
  if (c.minLooks && st.looks < c.minLooks) return `Aparência mínima ${c.minLooks}`;
  if (c.needsCar && (!S.vehicles.length || !S.flags.license)) return "Requer veículo e habilitação";
  if (S.job && S.job.careerId === c.id) return "Seu emprego atual";
  return null;
}

/* O que impede a próxima promoção (tempo de casa, formação, reputação). */
function promotionBlocker(){
  const J = S.job, c = career(); if (!J || c.elected) return null;
  const next = J.level + 1; if (next >= c.levels.length) return "Topo da carreira";
  const need = 1 + Math.floor(J.level/2) + (c.fame ? 1 : 0);
  if (J.levelYears < need) return `Precisa de ${need} ano(s) no cargo (tem ${J.levelYears})`;
  if (next >= 2 && P().reputation < 45) return "Exige reputação 45+ (networking, desempenho)";
  if (next >= 3 && c.edu >= 4 && S.edu.level < 5 && P().reputation < 65) return "Liderança exige pós-graduação ou reputação 65+";
  if (next >= 3 && c.edu < 4 && S.edu.level < 3 && P().reputation < 60) return "Gestão exige curso técnico/superior ou reputação 60+";
  return null;
}
function interviewQuestions(){ const qs = DATA.interview.slice(); const out = []; while (out.length < 3 && qs.length) out.push(qs.splice(Math.floor(rand()*qs.length),1)[0]); return out; }

function applyJob(id, iv = {}){
  const c = byId(DATA.careers, id), why = jobEligibility(c);
  if (why) return R(false, why);
  if (c.elected) return runForOffice(0);
  const o = oddsHire(c);
  if (iv.bonus) o.p = Math.max(0.02, Math.min(0.95, o.p + iv.bonus));
  S.stats.jobs++;
  if (!chance(o.p)){ log(`Fui rejeitado(a) na entrevista para ${c.levels[0].t}.`, "bad"); addStat("happiness",-3); return R(false, `A empresa escolheu outro candidato (${Math.round(o.p*100)}% de chance). 😕`); }
  if (S.job) endJob("Mudou de emprego");
  S.partTime = null;
  const startLevel = (c.edu >= 4 && S.edu.level >= 5 && c.levels.length > 2) ? 1 : 0;
  S.job = { careerId:id, level:startLevel, levelYears:0, years:0, perf:55, effort:1, salary: Math.round(salaryFor(c, startLevel, 0) * (1 + num(iv.raise))) };
  S.unemployedYears = 0; S.retired = false; S.flags.reference = false;
  log(`Fui contratado(a) como ${c.levels[startLevel].t} (${fmt(S.job.salary)}/ano). 💼`, "milestone"); addStat("happiness",8);
  return R(true, `Contratado(a) como ${c.levels[startLevel].t}!`);
}

function applyPartTime(id){
  const j = byId(DATA.partTime, id);
  if (P().age < j.minAge) return R(false, `Idade mínima ${j.minAge}.`);
  if (j.minInt && P().stats.intelligence < j.minInt) return R(false, "Inteligência insuficiente.");
  if (S.job) return R(false, "Você já tem emprego em tempo integral.");
  if (inPrison()) return R(false, "Você está preso(a).");
  S.partTime = id; log(`Comecei a trabalhar meio período como ${j.name}.`, ""); return R(true, `Agora você é ${j.name}.`);
}

function quitJob(){ if (!S.job && !S.partTime) return R(false,"Sem emprego."); if (S.job){ const t = career().levels[S.job.level].t; endJob("Pediu demissão"); log(`Pedi demissão do cargo de ${t}.`, ""); } else { S.partTime = null; log("Saí do trabalho de meio período.", ""); } return R(true, "Você saiu do emprego."); }

function setEffort(e){ if (!S.job) return R(false,"Sem emprego."); S.job.effort = e; return R(true, ["Modo econômico de energia ativado.","Ritmo normal.","Hora extra todo dia!"][e]); }

function askRaise(){
  if (!S.job) return R(false,"Sem emprego.");
  if (career().elected) return R(false, "Salário de cargo público é fixado em lei.");
  if (S.flags.raiseAsked === P().age) return R(false, "Você já pediu aumento este ano.");
  S.flags.raiseAsked = P().age;
  if (chance((S.job.perf-40)/100)){ const r = rfloat(0.04,0.12); S.job.salary = Math.round(S.job.salary*(1+r)); log(`Consegui um aumento de ${Math.round(r*100)}%.`, "good"); return R(true, `Aumento de ${Math.round(r*100)}%! 🎉`); }
  S.job.perf = clamp(S.job.perf-5); log("Pedi aumento e ouvi um 'não'.", "bad"); return R(false, "Pedido negado.");
}

function retire(){
  if (P().age < 55) return R(false, "Idade mínima: 55 anos.");
  const base = S.job ? S.job.salary : num(S.lastSalary, wageOf(10000));
  const yrs = S.jobHistory.reduce((a,j)=>a+(j.to-j.from),0) + (S.job?S.job.years:0);
  S.pension = Math.max(wageOf(7000), Math.round(base * Math.min(0.8, 0.25 + yrs*0.015)));
  endJob("Aposentou-se"); S.retired = true; S.partTime = null;
  log(`Me aposentei com pensão de ${fmt(S.pension)}/ano. 🏖️`, "milestone"); addStat("happiness",10);
  return R(true, "Aposentado(a)!");
}
