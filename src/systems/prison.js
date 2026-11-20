"use strict";
/* =====================================================================
   systems/prison.js — VIDA NA PRISÃO: pátio (força + intimidação),
   trabalho, cursos/oficinas, recurso judicial e visitas.

   REMIÇÃO CONTEXTUAL: cada sessão de estudo/trabalho acumula
     base (estudo 0,07 · trabalho 0,06 ano) × mult[curso][tipo do crime]
     × comportamento (0,5 se brigou no ano)
   em S.prison.remit; a cada 1,0 acumulado, a pena cai 1 ano.
   Ex.: preso por fraude estudando Direito Penal remite ~2,2× mais que
   alguém preso por homicídio no mesmo curso; para este, Terapia rende
   2,3×. O tipo do crime é detectado por crimeCategory(texto da pena).
   ===================================================================== */
function crimeCategory(crime){
  const t = String(crime || "");
  for (const k of ["financial","violent","property","drugs"]) if (DATA.crimeCats[k].re.test(t)) return k;
  return "other";
}
const prisonCat = () => S.prison?.cat || crimeCategory(S.prison?.crime);
function prisonCourse(id){ return (S.prison.courses ||= {})[id] ||= { p:0, done:false }; }

/* Converte remição acumulada em anos de pena a menos. */
function applyRemit(amount, why){
  const pr = S.prison; pr.remit = num(pr.remit) + amount;
  let cut = 0;
  while (pr.remit >= 1 && pr.years > 1){ pr.remit -= 1; pr.years--; cut++; }
  if (cut){ S.stats.remitted = num(S.stats.remitted) + cut; log(`📉 Remição de pena (${why}): −${cut} ano(s). Restam ${pr.years}.`, "good", ["crime"]); }
  return cut ? ` 📉 Pena reduzida em ${cut} ano(s)!` : ` (+${Math.round(amount*365)} dias de remição acumulados)`;
}
const behaviorMult = () => S.prison.foughtAge === P().age ? 0.5 : 1;

function prisonAct(kind, id){
  const pr = S.prison; if (!pr) return R(false, "Você não está preso(a).");
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  const cat = prisonCat();
  switch (kind){
    case "yard": {
      const g = rint(4, 9); pr.intim = clamp(num(pr.intim) + g); S.health.exercised = true; addStress(-3);
      return R(true, `Malhei no pátio. Intimidação ${Math.round(pr.intim)} (+${g}).` + fx({ health: rint(1,3), looks: chance(0.3) ? 1 : 0 }));
    }
    case "work": {
      const pay = priceOf(rint(60, 160)); addMoney(pay);
      const job = pick(["na cozinha","na lavanderia","na oficina de costura","na manutenção","na horta"]);
      return R(true, `Trabalhei ${job} e juntei ${fmt(pay)} de pecúlio.` + applyRemit(DATA.prisonRemit.work * (cat === "property" ? 1.4 : 1) * behaviorMult(), "trabalho"));
    }
    case "course": {
      const c = byId(DATA.prisonCourses, id); if (!c) return R(false, "?");
      if (P().stats.intelligence < c.minInt){ S.activitiesThisYear--; return R(false, `Exige inteligência ${c.minInt}. Faça Leitura e Redação antes.`); }
      const st = prisonCourse(id);
      const g = Math.round(rint(18, 30) * (0.7 + P().stats.intelligence/180));
      const was = st.done; st.p = Math.min(100, st.p + g);
      let msg = `${c.emoji} ${c.name}: ${st.done ? "revisão" : `progresso ${st.p}%`}.`;
      if (!was && st.p >= 100){ st.done = true; msg += " 🎓 Concluído! " + coursePerk(c); }
      const mult = c.mult[cat] || 1;
      msg += applyRemit(DATA.prisonRemit.study * mult * behaviorMult(), `${c.name}${mult > 1.3 ? ", alinhado ao meu caso" : ""}`);
      if (id === "literacy") addStat("intelligence", 1);
      return R(true, msg);
    }
    case "visit": {
      const fam = S.rels.filter(r => r.alive && ["mother","father","spouse","partner","child","sibling"].includes(r.role));
      if (!fam.length){ S.activitiesThisYear--; return R(false, "Ninguém vem me visitar."); }
      const v = pick(fam); v.rel = clamp(v.rel + 6); addStress(-6);
      return R(true, `${v.first} veio me visitar. Chorei no abraço.` + fx({ happiness: rint(5, 10) }));
    }
  }
  return R(false, "?");
}
function coursePerk(c){
  if (!S.prisonSkills.includes(c.id)) S.prisonSkills.push(c.id);
  log(`🎓 Concluí o curso de ${c.name} na prisão.`, "milestone");
  switch (c.id){
    case "it": S.cyberSkill = clamp(S.cyberSkill + 15); return "Agora sei programar de verdade.";
    case "therapy": addStress(-15); for (const k in S.addictions) S.addictions[k] = clamp(S.addictions[k] - 20); P().karma = clamp(P().karma + 8); return "Aprendi a lidar com a raiva e com os vícios.";
    case "finance": addCredit(30); return "Entendi finalmente juros, orçamento e crédito.";
    case "literacy": addStat("intelligence", 4); return "Ler virou meu refúgio.";
    case "law": return "Agora entendo meu processo — e posso recorrer.";
    default: return "Aprendi um ofício.";
  }
}
/* Recurso/revisão criminal: exige Direito Penal concluído; 1 por pena. */
function appealSentence(){
  const pr = S.prison; if (!pr) return R(false, "Você não está preso(a).");
  if (!prisonCourse("law").done) return R(false, "Conclua Direito Penal Básico para montar o recurso.");
  if (pr.appealed) return R(false, "Seu recurso já foi julgado nesta pena.");
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  pr.appealed = true;
  const cat = prisonCat(), p = clamp((DATA.appealOdds[cat] + (P().stats.intelligence - 50)/250 + (prisonCourse("therapy").done ? 0.05 : 0)) * 100, 5, 85) / 100;
  if (!chance(p)) return R(false, `Recurso negado (chance era ${Math.round(p*100)}%). Pelo menos aprendi como o tribunal pensa.`);
  const cut = Math.max(1, Math.round(pr.years * rfloat(0.2, 0.4)));
  pr.years = Math.max(0, pr.years - cut);
  log(`⚖️ Ganhei o recurso: pena reduzida em ${cut} ano(s).`, "milestone", ["crime"]);
  if (pr.years <= 0){ S.prison = null; S.parole = 2; log("🔓 Fui solto(a) pelo recurso!", "milestone"); return R(true, `RECURSO ACEITO! Pena extinta — estou livre! 🔓`); }
  return R(true, `Recurso aceito! −${cut} ano(s) de pena (restam ${pr.years}).`);
}
/* Bônus de contratação por ofícios aprendidos na cadeia (usado em oddsHire). */
function prisonHireBonus(c){
  const sk = S.prisonSkills || [];
  let b = 0;
  if (sk.includes("it") && /Tecnologia|TI|Dados/i.test(c.sector)) b += 0.1;
  if (sk.includes("workshop") && (c.tier === "operacional" || c.edu <= 1)) b += 0.1;
  if (sk.includes("law") && /Justiça/i.test(c.sector)) b += 0.05;
  return b;
}
