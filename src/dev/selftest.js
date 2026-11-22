"use strict";
/* dev/selftest.js */

function scanBad(o, path="S", out=[]){
  if (out.length > 5) return out;
  if (typeof o === "number" && !isFinite(o)) out.push(path);
  else if (o && typeof o === "object") for (const k in o) scanBad(o[k], path+"."+k, out);
  return out;
}

function selfTest(lives=60){
  const t0 = performance.now(), res = { lives:0, years:0, errors:[], bad:[], ages:[], scores:[], causes:{}, jobs:0, rich:0, prison:0, heirs:0 };
  const randomAction = () => {
    const a = P().age, roll = rand();
    try {
      if (!inPrison() && a >= 12 && rand() < 0.05){ const k = rand(); if (k < 0.4) startGig(pick(DATA.gigs).id); else if (S.gig){ k < 0.6 ? promoteGig() : k < 0.8 ? practiceGig() : setGigPace(rint(0,2)); } }
      if (!inPrison() && a >= 18 && rand() < 0.03){ const k = rand(); if (k < 0.4) buyCollectible(pick(DATA.collectibles).id); else if (k < 0.55 && collection().length) sellCollectible(pick(collection()).uid); else if (k < 0.65 && collection().length) insureCollectible(pick(collection()).uid); else if (k < 0.85) buyWeapon(pick(DATA.armory).id); else applyGunLicense(); }
      // lado sombrio: só pelo caminho gradual (mortes → pergunta → mais mortes)
      if (dark().active && rand() < 0.35) autoHunt();
      if (isAthlete() && rand() < 0.3) extraTraining();
      if (inPrison() && roll < 0.25) startEscape();
      else if (inPrison() && roll < 0.8){ const k = pick(["yard","work","course","course","visit","appeal"]); k === "appeal" ? appealSentence() : prisonAct(k, pick(DATA.prisonCourses).id); }
      else if (a >= 8 && rand() < 0.05){ const k = rand(); if (k < 0.35) adoptPet(0); else if (k < 0.55) buyPet(pick(DATA.petSpecies.filter(s=>s.src==="shop")).id); else if (k < 0.65 && a >= 18) buyPet(pick(DATA.petSpecies.filter(s=>s.src==="exotic")).id); else if ((S.pets||[]).length) petAct(pick(S.pets).uid, pick(["play","play","feed","train","vet","giveaway"])); }
      else if (a >= 10 && rand() < 0.04){ const k = rand(); if (k < 0.3) setStyle(pick(["hair","face"]), pick(DATA.hairStyles).id); else if (k < 0.5) setWardrobe(rint(0,2)); else if (k < 0.6) toggleSkincare(); else if (k < 0.85 && a >= 18) doProcedure(pick(DATA.procedures).id); else if (look().myopia) chance(0.5) ? laserSurgery(chance(0.5)) : setFrame(pick(DATA.frames).id); }
      else if (rand() < 0.04 && S.rels.some(r=>r.role==="friend"&&r.alive)) friendAct(pick(S.rels.filter(r=>r.role==="friend"&&r.alive)).uid, pick(["loan","referral","alibi","support"]));
      else if (spouse() && rand() < 0.03) spouseAct(spouse().uid, pick(["ask","ask","skim","transfer","gold"]), chance(0.3));
      else if (rand() < 0.02 && S.rels.some(r=>r.role==="fiance")) marryWith(S.rels.find(r=>r.role==="fiance").uid, pick(["simple","big"]), pick(Object.keys(REGIMES)));
      else if (a >= 8 && rand() < 0.08){ const d = pick(DATA.martialArts); const M = martial(); M.enrolled.length && chance(0.7) ? trainArt(pick(M.enrolled), chance(0.3)) : enrollArt(d.id); }
      else if (a >= 16 && bestArt() && rand() < 0.03) enterTournament(pick(DATA.tournaments).id, bestArt());
      else if (a >= 14 && rand() < 0.02) provokeStranger();
      else if (a >= 18 && !S.job && roll < 0.5){ const c = pick(DATA.careers); applyJob(c.id); }
      else if (a >= 18 && !S.edu.school && S.edu.level >= 2 && S.edu.level < 4 && roll < 0.6) applyUniversity(pick(DATA.majors).id);
      else if (roll < 0.62) doActivity(pick(ACTIVITIES).id);
      else if (a >= 18 && roll < 0.66) rentHome(pick(DATA.rentals).id);
      else if (a >= 18 && roll < 0.69) buyProperty(pick(DATA.properties).id, chance(0.5));
      else if (a >= 18 && roll < 0.72) buyVehicle(pick(DATA.vehicles).id, chance(0.5));
      else if (a >= 18 && roll < 0.75 && S.money > 0) invest(pick(DATA.investments).id, S.money*0.2);
      else if (a >= 12 && roll < 0.77) commitCrime(pick(DATA.crimes).id);
      else if (a >= 16 && roll < 0.80){ const c = datingCandidates(); if (c) dateCandidate(pick(c)); }
      else if (roll < 0.86 && S.rels.length){ const r = pick(S.rels); interact(r.uid, pick(["talk","time","gift","money","argue","propose","marry","baby","advise"]), "flowers"); }
      else if (a >= 20 && roll < 0.87) openBusiness(pick(DATA.businesses).id);
      else if (a >= 25 && roll < 0.875) emigrate(pick(DATA.countries).id);
      else if (a >= 18 && roll < 0.88) personalLoan(priceOf(2000));
      else if (roll < 0.885 && S.properties.length) sellProperty(pick(S.properties).uid);
      else if (roll < 0.90) medicalCheckup();
      else if (roll < 0.92 && S.illnesses.some(i=>i.diagnosed)){ const il = pick(S.illnesses.filter(i=>i.diagnosed)); treatIllness(il.id, pick(DATA.treatments).id); }
      else if (a >= 18 && roll < 0.925) setHealthPlan(pick(DATA.healthPlans).id);
      else if (roll < 0.935 && Object.values(S.addictions).some(v=>v>0)) chance(0.5) ? quitAddiction(pick(DATA.addictions).id) : rehab();
      else if (a >= 21 && roll < 0.94 && !S.record.length) runForOffice(0);
      else if (a >= 18 && roll < 0.95) buyProperty(pick(DATA.properties).id, false, pick(DATA.countries).id);
      else if (roll < 0.955 && S.properties.length) toggleRentOut(pick(S.properties).uid);
      else if (a >= 18 && roll < 0.96 && !S.org) chance(0.5) ? joinOrg() : foundOrg();
      else if (S.org && isBoss() && roll < 0.97){ chance(0.5) ? recruit(makeCrewCandidate()) : startOp(pick(DATA.orgOps).id); }
      else if (S.dirty > 0 && roll < 0.975) launder(S.dirty);
      else if (roll < 0.98 && S.properties.length) renovate(pick(S.properties).uid);
      else if (a >= 18 && roll < 0.985) applyJob(pick(DATA.careers).id, { bonus: rfloat(-0.1, 0.15) });
    } catch(e){ res.errors.push("ação: " + e.message + " @" + (e.stack||"").split("\n")[1]); }
    try { if (S.fight) autoFight(); if (S.escape) autoEscape(); } catch(e){ res.errors.push("minigame: " + e.message + " @" + (e.stack||"").split("\n")[1]); }
  };
  for (let i=0;i<lives;i++){
    S = null; newLife({ seed: 1000+i });
    let guard = 0;
    while (P().alive && guard++ < 200){
      for (let k=0;k<3;k++) if (P().alive && !S.queue.length) randomAction();
      try { if (P().alive) ageUp(); } catch(e){ res.errors.push("ageUp: " + e.message + " @" + (e.stack||"").split("\n")[1]); break; }
      let g2 = 0;
      while (P().alive && validHead() && g2++ < 10){
        try { const ev = EVENT_MAP[S.queue[0].id]; const n = ev.choices(S.queue[0].ctx).length; resolveEvent(rint(0,n-1)); if (S.fight) autoFight(); if (S.escape) autoEscape(); }
        catch(e){ res.errors.push("evento " + S.queue[0]?.id + ": " + e.message); S.queue.shift(); }
      }
      res.years++;
      const inv = checkInvariants();
      if (inv.length){ res.invariants = (res.invariants||0) + 1; if ((res.invSamples||[]).length < 8) (res.invSamples = res.invSamples||[]).push(`vida ${i} idade ${P().age}: ${inv.join("; ")}`); }
      const bad = scanBad(S);
      if (bad.length){ res.bad.push(`vida ${i} idade ${P().age}: ${bad.join(", ")}`); break; }
      if (S.money < 0) { res.bad.push(`vida ${i}: dinheiro negativo ${S.money}`); }
    }
    if (guard >= 200) res.errors.push("loop: vida " + i + " não terminou");
    if (S.jobHistory.length || S.job) res.jobs++;
    res.diagnosed = (res.diagnosed||0) + S.log.filter(e=>/diagnóstico|detectou|Fiquei doente/.test(e.text)).length;
    res.consequences = (res.consequences||0) + S.consequences.length;
    if (S.jobHistory.some(j=>j.career==="Carreira Política") || career()?.elected) res.politicians = (res.politicians||0)+1;
    res.maxStress = Math.max(res.maxStress||0, Math.round(P().stress));
    res.orgs = (res.orgs||0) + (S.org ? 1 : 0);
    res.intlProps = (res.intlProps||0) + S.properties.filter(p=>p.country!==P().country).length;
    res.emigrated = (res.emigrated||0) + (S.stats.countries.length > 1 ? 1 : 0);
    res.foreclosures = (res.foreclosures||0) + S.log.filter(e=>/LEILÃO|apreensão|PENHORA/.test(e.text)).length;
    res.fights = (res.fights||0) + num(S.stats.fights); res.kills = (res.kills||0) + num(S.stats.kills); res.escapes = (res.escapes||0) + num(S.stats.escapes);
    res.orientations = res.orientations || {}; res.orientations[P().orientation] = (res.orientations[P().orientation]||0) + 1;
    res.classes = res.classes || {}; res.classes[P().cls] = (res.classes[P().cls]||0) + 1;
    res.petsOwned = (res.petsOwned||0) + num(S.stats.petsOwned); res.petAttacks = (res.petAttacks||0) + S.log.filter(e=>/atacou|atacado/.test(e.text)).length;
    res.cyberOk = (res.cyberOk||0) + num(S.stats.cyberOk); res.remitted = (res.remitted||0) + num(S.stats.remitted); res.spouseScams = (res.spouseScams||0) + num(S.stats.spouseScams);
    res.myopia = (res.myopia||0) + (look().myopia ? 1 : 0); res.visionTests = (res.visionTests||0) + (look().visionTested ? 1 : 0);
    res.gigs = (res.gigs||0) + (S.gig ? 1 : 0); res.collectors = (res.collectors||0) + (collection().length ? 1 : 0); res.armed = (res.armed||0) + (arsenal().length ? 1 : 0);
    res.darkKills = (res.darkKills||0) + num(S.dark?.kills); res.darkCaught = (res.darkCaught||0) + (S.dark?.caught ? 1 : 0); res.exAthletes = (res.exAthletes||0) + (S.flags.exAthlete ? 1 : 0);
    res.titles = (res.titles||0) + martial().titles.length; res.blackbelts = (res.blackbelts||0) + (bestMastery() >= 70 ? 1 : 0); res.wanted = (res.wanted||0) + (S.wanted ? 1 : 0);
    if (S.record.length) res.prison++;
    if (S.final && S.final.netWorth > wageOf(1e6)) res.rich++;
    res.lives++; res.ages.push(P().age); res.scores.push(S.final?.score.total ?? 0);
    const cz = String(P().cause).split(",")[0]; res.causes[cz] = (res.causes[cz]||0)+1;
    // testa herdeiro + render de todas as abas
    try {
      const k = S.rels.find(r=>r.role==="child"&&r.alive);
      if (k && i % 5 === 0){ continueAsHeir(k.uid); res.heirs++; for (let y=0;y<5 && P().alive;y++){ ageUp(); while (validHead()) resolveEvent(0); } }
      if (typeof document !== "undefined") for (const tb of ["life","career","assets","rels","health","acts"]){ TAB = tb; render(); }
    } catch(e){ res.errors.push("herdeiro/render: " + e.message + " @" + (e.stack||"").split("\n")[1]); }
  }
  const avg = a => a.reduce((x,y)=>x+y,0)/Math.max(1,a.length);
  res.avgAge = avg(res.ages).toFixed(1); res.avgScore = avg(res.scores).toFixed(1);
  res.ms = Math.round(performance.now()-t0);
  return res;
}

/* =====================================================================
   Sonda de balanceamento (abra index.html?balance).
   Compara estilos de vida com as MESMAS sementes e testa o antigo
   exploit de "spam de saúde" num idoso.
   ===================================================================== */
function balanceReport(n = 40){
  const policies = {
    cuidadoso: () => { if (P().age >= 18){ if (S.health.plan === "none") setHealthPlan("premium"); medicalCheckup(); doActivity("gym"); doActivity("walk"); doActivity("meditate");
                       for (const il of S.illnesses.filter(i=>i.diagnosed && !i.treated)) if (treatIllness(il.id, "private").ok === false) treatIllness(il.id, "public"); } },
    negligente: () => {},
    imprudente: () => { if (P().age >= 16){ S.addictions.smoke = Math.max(S.addictions.smoke, 50); S.addictions.alcohol = Math.max(S.addictions.alcohol, 45); } if (S.job) S.job.effort = 2; },
  };
  const out = {};
  for (const [name, policy] of Object.entries(policies)){
    const ages = [], h60 = [], cancer = { got:0, survived:0 };
    for (let i=0;i<n;i++){
      S = null; newLife({ seed: 5000+i, cls: 4 });
      let had = false;
      while (P().alive && P().age < 125){
        if (P().age >= 18 && !S.job && !S.edu.school) applyJob(pick(["cashier","sales","admin","waiter"]));
        policy();
        ageUp(); while (validHead()) resolveEvent(0);
        if (P().age === 60) h60.push(P().stats.health);
        if (S.illnesses.some(x=>x.id==="cancer")) had = true;
      }
      ages.push(P().age); if (had){ cancer.got++; if (!/Câncer/.test(P().cause)) cancer.survived++; }
    }
    const avg = a => (a.reduce((x,y)=>x+y,0)/Math.max(1,a.length)).toFixed(1);
    out[name] = { idadeMedia: avg(ages), saudeAos60: avg(h60), cancer: `${cancer.survived}/${cancer.got} sobreviveram` };
  }
  // exploit: idoso de 75 anos, saúde 30 → todas as ações de saúde possíveis num único ano
  S = null; newLife({ seed: 77, cls: 6 }); P().age = 75; P().vitality = 60; P().stats.health = 30; S.money = priceOf(1e6);
  const h0 = P().stats.health;
  const msgs = [];
  for (let k=0;k<20;k++){ const r = doActivity(pick(["gym","walk","train","meditate"])); if (k < 3) msgs.push(r.msg); medicalCheckup(); }
  out.exploitSpam = { antes: h0, depois: Math.round(P().stats.health), teto: Math.round(healthCap()), primeiras: msgs };
  return out;
}

/* Regressão do bug de emigração (v5): imóveis devem sobreviver à mudança
   de país e continuar pagando aluguel convertido. */
function emigrationTest(){
  S = null; newLife({ seed: 9090, country:"BR", cls:6 });
  P().age = 30; S.edu.level = 4; S.flags.license = true; S.money = priceOf(3e6);
  const r1 = buyProperty("apt2", false); const p = S.properties[0];
  toggleRentOut(p.uid); p.tenant = { name:"Inquilino Teste", reliability:100, since:30, late:0 };
  const brlBefore = p.value, cashBefore = S.money;
  const r2 = emigrate("PT");
  const cashConvertedOk = Math.abs(S.money - fxConv(cashBefore - emigrateCost(byId(DATA.countries,"PT")) * 0, "BR", "PT")) < S.money; // caixa convertido para EUR
  let rentLines = 0;
  for (let y=0; y<4 && P().alive; y++){ ageUp(); while (validHead()) resolveEvent(0); rentLines += S.yearSummary.lines.filter(l=>/Aluguel recebido/.test(l[0])).length; p.tenant = p.tenant || { name:"Inquilino Teste", reliability:100, since:30, late:0 }; }
  const still = S.properties.find(x=>x.uid===p.uid);
  const sold = still ? sellProperty(still.uid) : { ok:false };
  return { comprou: r1.ok, emigrou: r2.ok, paisAtual: P().country, imovelMantido: !!still, imovelPais: still?.country, moedaImovel: still ? country(still.country).currency : null,
           valorBRLantes: brlBefore, valorBRLdepois: still?.value, anosComAluguel: rentLines, vendaRemota: sold.ok, caixaConvertido: cashConvertedOk,
           OK: r1.ok && r2.ok && !!still && still.country === "BR" && rentLines >= 2 && sold.ok };
}

/* Regressão: continuar como herdeiro (economia, herança, idade coerente). */
function heirTest(){
  S = null; newLife({ seed: 4242, country:"MX", cls:4 });
  P().age = 50; S.money = priceOf(200000);
  const k = makeNPC("child", country(), { age: 20, last: P().last, rel: 80 }); S.rels.push(k);
  const kids = [k]; makeWill("favor", k.uid);
  die("teste"); const expected = heirShare(Math.max(0, netWorth()), k, kids);
  continueAsHeir(k.uid);
  for (let y=0;y<3;y++){ ageUp(); while (validHead()) resolveEvent(0); }
  return { idade: P().age, nome: P().first === k.first, vivo: P().alive, linhagem: S.lineage.length, invariantes: checkInvariants().length, herancaEsperada: expected,
    OK: P().first === k.first && P().age >= 23 && S.lineage.length === 1 && checkInvariants().length === 0 };
}

/* Combate: tabela de letalidade + 150 lutas completas por contexto. */
function combatTest(){
  const res = { letalidade:{}, sims:{} };
  S = null; newLife({ seed: 2727 }); P().age = 28; P().stats.health = 85;
  const cases = [["Soco · leigo · normal","punch",{},"normal"],["Cruzado · boxe 40 · normal","cross",{boxe:40},"normal"],
    ["Chute alto · muay 85 · controlado","headkick",{muaythai:85},"ctrl"],["Chute alto · muay 85 · normal","headkick",{muaythai:85},"normal"],
    ["Chute alto · muay 85 · com tudo","headkick",{muaythai:85},"all"],["Mata-leão · jiu 80 · com tudo","rnc",{jiujitsu:80},"all"]];
  for (const [label, mv, arts, inten] of cases){
    martial().arts = {}; for (const [k,v] of Object.entries(arts)) martial().arts[k] = { m:v, years:5 };
    startFight("street", {}); S.fight.intensity = inten; S.fight.opp.age = 30; S.fight.opp.health = 80;
    const young = moveLethal(byId(DATA.moves, mv)); S.fight.opp.age = 70; S.fight.opp.health = 50; const old = moveLethal(byId(DATA.moves, mv));
    res.letalidade[label] = `alvo 30a: ${(young*100).toFixed(1)}% · alvo 70a doente: ${(old*100).toFixed(1)}%`;
    S.fight = null;
  }
  for (const kind of Object.keys(DATA.fightProfiles)){
    const t = { win:0, lose:0, draw:0, fled:0, surrender:0, mortes:0, morreu:0, erros:0 };
    for (let i=0;i<150;i++){
      try {
        S = null; newLife({ seed: 7000+i }); P().age = 28; P().stats.health = rint(50, 95); martial().arts = { mma:{ m: rint(0,90), years:3 } };
        if (kind === "prison") sendToPrison(5, "teste");
        if (kind === "rival" || kind === "hit"){ S.crimeSkill = 40; S.money += priceOf(1e5); foundOrg(); }
        startFight(kind, kind === "tournament" ? { tid:"amador", art:"mma", idx:0 } : kind === "rival" ? { rival: S.org?.rivals?.[0]?.name } : {});
        let g = 0;
        while (S.fight && !S.fight.over && g++ < 30){ const mv = fightActions().moves.filter(m => S.fight.me.sta >= m.cost); fightAction(mv.length ? pick(mv).id : "defend"); }
        const F = S.fight; t[F.result]++; if (F.oppOutcome === "death") t.mortes++; if (F.myOutcome === "death") t.morreu++;
        closeFight(); if (S.fight) autoFight();
        if (scanBad(S).length || S.money < 0) t.erros++;
      } catch(e){ t.erros++; res.erro = `${kind}: ${e.message} @${(e.stack||"").split("\n")[1]}`; }
    }
    res.sims[kind] = t;
  }
  res.OK = Object.values(res.sims).every(t => !t.erros);
  return res;
}

/* Fuga: para cada dificuldade 0–8, gera puzzles e os JOGA com a solução
   da BFS através de escapeMove (a mesma função da UI). Todos devem fugir. */
function escapeTest(perD = 8){
  const res = { porDificuldade:{}, fugas:0, total:0 };
  S = null; newLife({ seed: 3131 }); P().age = 30;
  for (let d = 0; d <= 8; d++){
    let ok = 0, optSum = 0, n = 0;
    for (let i = 0; i < perD; i++){
      sendToPrison(5, "teste"); S.wanted = null;
      const P0 = escapeParams(d), stages = [];
      for (let k = 0; k < P0.stages; k++) stages.push(genStage(d, k, P0.stages));
      S.escape = { d, stages, stage:0, t:0, pos:[...stages[0].start], key:!stages[0].key, over:false };
      let g = 0;
      while (S.escape && !S.escape.over && g++ < 6){
        const st = escStage(), sol = solveStage(st), at = S.escape.stage; if (!sol) break;
        optSum += sol.len; n++;
        for (let j = 1; j < sol.path.length; j++){
          const [x0,y0] = sol.path[j-1], [x1,y1] = sol.path[j];
          escapeMove(x1 > x0 ? "E" : x1 < x0 ? "W" : y1 > y0 ? "S" : y1 < y0 ? "N" : "wait");
          if (S.escape.over || S.escape.stage !== at) break;
        }
      }
      if (S.escape?.result === "ok") ok++;
      closeEscape(); S.wanted = null; S.prison = null;
    }
    const P0 = escapeParams(d);
    res.porDificuldade[d] = `${ok}/${perD} fugas · ${P0.stages} etapa(s) · grade ${P0.size}×${P0.size} · ${P0.guards} guardas · ${P0.cams} câmeras · folga ${P0.slack} · rota ótima média ${(optSum/Math.max(1,n)).toFixed(1)} turnos`;
    res.fugas += ok; res.total += perD;
  }
  res.OK = res.fugas === res.total;
  return res;
}

/* Identidade: escolhas consistentes levam ao rótulo esperado. */
function identityTest(){
  const out = {}, cases = { hetero:{ other:2 }, homo:{ same:2 }, bi:{ both:2 }, pan:{ pan:2.5, both:0.5 }, ace:{ none:2 } };
  for (const [want, d] of Object.entries(cases)){
    S = null; newLife({ seed: 6100 }); P().age = 17;
    for (let i=0;i<3;i++) leanIdentity(d);
    const top = orientationCandidates()[0]; out[want] = top;
    P().age = 23; identityYear(); out[want + "_auto"] = P().orientation;
  }
  S = null; newLife({ seed: 6200 }); out.inicial = P().orientation; out.genero_descobrindo = partnerGender() ? "ok" : "erro";
  out.OK = Object.keys(cases).every(k => out[k] === k && out[k + "_auto"] === k) && out.inicial === "descobrindo";
  return out;
}
/* Prisão: mesma pena, crimes diferentes → remição contextual diferente. */
function prisonTest(){
  const run = (crime, course) => {
    S = null; newLife({ seed: 6300 }); P().age = 30; P().stats.intelligence = 70;
    sendToPrison(12, crime); const y0 = S.prison.years;
    for (let yr=0; yr<3; yr++){ S.activitiesThisYear = 0; for (let k=0;k<6;k++) prisonAct("course", course); S.prison.years--; }
    return { cat: S.prison.cat, reduzido: y0 - 3 - S.prison.years, dias: Math.round(S.prison.remit*365) };
  };
  const out = { fraude_direito: run("fraude financeira", "law"), homicidio_direito: run("homicídio doloso", "law"), homicidio_terapia: run("homicídio doloso", "therapy"), roubo_oficina: run("roubo de carga", "workshop") };
  S = null; newLife({ seed: 6400 }); P().age = 30; P().stats.intelligence = 80; sendToPrison(10, "estelionato"); S.prison.courses.law = { p:100, done:true };
  out.recurso = appealSentence().msg;
  const tot = r => r.reduzido + r.dias/365;
  out.OK = tot(out.fraude_direito) > tot(out.homicidio_direito) * 1.8 && tot(out.homicidio_terapia) > tot(out.homicidio_direito) * 1.8 && out.fraude_direito.cat === "financial" && out.homicidio_terapia.cat === "violent" && out.roubo_oficina.cat === "property";
  return out;
}
/* Pets: tigre bem cuidado × abandonado — o risco de ataque precisa disparar com o descuido. */
function petTest(n = 200){
  const sim = (care) => {
    let attacks = 0, deaths = 0;
    for (let i=0;i<n;i++){
      S = null; newLife({ seed: 6500+i }); P().age = 30; S.money = care ? priceOf(5e6) : 0;
      buyPetForce("tiger");
      for (let y=0; y<5 && P().alive && S.pets.length; y++){
        if (care){ const pt = S.pets[0]; S.activitiesThisYear = 0; petAct(pt.uid, "play"); }
        S.yearSummary = { income:0, expenses:0, lines:[] }; petsYear();
        if (S.flags.forcedDeath){ deaths++; attacks++; delete S.flags.forcedDeath; break; }
        if (S.log.some(e => /me atacou|atacou uma visita/.test(e.text))){ attacks++; break; }
      }
    }
    return { ataques: attacks, mortesDoDono: deaths, taxa: (attacks/n*100).toFixed(1) + "%" };
  };
  const out = { bemCuidado: sim(true), abandonado: sim(false) };
  out.OK = out.abandonado.ataques > out.bemCuidado.ataques * 4 && out.abandonado.mortesDoDono > 0;
  return out;
}
function buyPetForce(id){ const sp = byId(DATA.petSpecies, id); S.pets = S.pets || []; S.pets.push({ uid:uid(), sp:id, name:"Teste", age:2, bond:25, hunger:0, stress:10, neglect:0, health:90, trained:0, played:false, lifespan:99 }); return sp; }
/* Classes: sorteio respeita os pesos e nenhuma vida escolhe classe. */
function classTest(n = 900){
  const c = {}; for (let i=0;i<n;i++){ S = null; newLife({ seed: 8000+i }); c[P().cls] = (c[P().cls]||0) + 1; }
  const out = { distribuicao: Object.fromEntries(DATA.classes.map(k => [k.name, `${((c[k.id]||0)/n*100).toFixed(1)}% (peso ${k.weight}%)`])) };
  out.OK = DATA.classes.every(k => Math.abs((c[k.id]||0)/n*100 - k.weight) < 4);
  return out;
}
/* Casamento: partilha por regime e golpe do baú. */
function bondsTest(){
  const out = {};
  for (const reg of ["total","parcial","separacao"]){
    S = null; newLife({ seed: 6600 }); P().age = 30; S.money = priceOf(100000);
    const r = makePartner(); r.role = "fiance"; r.wealth = 2; r.money = priceOf(1e6); S.rels.push(r);
    marryWith(r.uid, "simple", reg);
    S.money += priceOf(50000); r.money += priceOf(200000); // o casal enriquece depois do casamento
    const acc = spouseAccessible(r);
    const before = S.money; divorce(r, false); out[reg] = { acessivel: acc, partilha: S.money - before };
  }
  S = null; newLife({ seed: 6700 }); P().age = 30; const r = makePartner(); r.role = "fiance"; r.money = priceOf(5e5); S.rels.push(r); marryWith(r.uid, "simple", "total");
  const m0 = S.money, g = spouseAct(r.uid, "gold", false); out.golpeDoBau = { ok: g.ok, ganho: S.money - m0, papel: r.role, processoAgendado: S.scheduled.some(x => x.kind === "loveScamCase") };
  out.OK = out.total.acessivel > out.parcial.acessivel && out.parcial.acessivel > out.separacao.acessivel && out.separacao.partilha === 0 && out.golpeDoBau.ok && out.golpeDoBau.papel === "ex" && out.golpeDoBau.processoAgendado;
  return out;
}

/* Auditoria de layout (?audit): em cada aba e nos modais principais,
   lista elementos que estouram a largura da tela, alvos de toque
   pequenos em controles e campos que causariam zoom no iOS. */
function layoutAudit(){
  const W = document.documentElement.clientWidth, out = { largura: W, telas:{}, alvosPequenos:[], camposZoom:[] };
  const check = name => {
    const bad = [];
    for (const el of document.querySelectorAll("#app *, #modalRoot *, #hub *")){
      const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).position === "fixed") continue;
      if (r.right > W + 1 || r.left < -1) bad.push(`${el.parentElement?.className || el.parentElement?.tagName} > ${el.tagName.toLowerCase()}.${[...el.classList].join(".")} "${(el.textContent||"").trim().slice(0,18)}" (${Math.round(r.left)}→${Math.round(r.right)})`);
    }
    out.telas[name] = { rolagemHorizontal: document.documentElement.scrollWidth > W + 1, estouros: bad.slice(0, 4) };
    if (matchMedia("(pointer:coarse)").matches || /coarse/.test(location.search)) for (const b of document.querySelectorAll("#modalRoot button, #app button, #hub button")){
      const r = b.getBoundingClientRect(); if (r.width && (r.height < 40 || r.width < 40) && out.alvosPequenos.length < 20) out.alvosPequenos.push(`${name}: "${b.textContent.trim().slice(0,24)}" ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
    for (const i of document.querySelectorAll("input:not([type=range]):not([type=file]), select")){ const fs = parseFloat(getComputedStyle(i).fontSize); if (fs < 16 && out.camposZoom.length < 5) out.camposZoom.push(`${name}: ${i.id || i.tagName} ${fs}px`); }
  };
  newLife({ seed: 31, country:"BR", cls: 4 });
  for (let y=0; y<26 && P().alive; y++){ if (P().age === 18) applyUniversity("cs"); ageUp(); while (validHead()) resolveEvent(0); }
  martial().arts.muaythai = { m:70, years:4 }; martial().enrolled = ["muaythai"]; S.money += priceOf(4e5); adoptPet(0); buyPet("tiger");
  for (const tb of ["life","career","assets","rels","health","acts"]){ TAB = tb; render(); check("aba " + tb); }
  TAB = "life"; render();
  startFight("street", {}); UI.fightOpen(); check("briga"); S.fight = null; closeModal(); document.querySelector("#modalRoot").innerHTML = "";
  UI.beauty("proc"); check("estética"); document.querySelector("#modalRoot").innerHTML = "";
  UI.menu(); check("menu"); document.querySelector("#modalRoot").innerHTML = "";
  sendToPrison(6, "teste"); startEscape(); render(); UI.escapeOpen(); check("fuga"); S.escape = null; document.querySelector("#modalRoot").innerHTML = "";
  render(); check("prisão (aba vida)");
  showHub("home"); check("hub"); showHub("create"); check("criador"); showHub("hall"); check("hall"); hideHub();
  out.OK = Object.values(out.telas).every(t => !t.rolagemHorizontal && !t.estouros.length) && !out.camposZoom.length && !out.alvosPequenos.length;
  return out;
}

/* Bot de caçada (selftest): percorre as etapas como a UI. */
function autoHunt(){
  if (huntBlock()) return;
  startHunt(pick(huntCandidates()));
  if (chance(0.6)) huntStudy();
  const w = arsenal().length && chance(0.5) ? pick(arsenal()).id : null;
  huntExecute(w);
  if (S.fight) autoFight();
  else if (S.hunt && S.hunt.success) huntCleanup(pick(["meticulous","fast","frame"]));
  S.hunt = null;
}
/* Autônomo: renda de 1º ano por atividade e riscos do trabalho adulto. */
function gigTest(){
  const out = { rendaInicial:{} };
  for (const g of DATA.gigs){
    S = null; newLife({ seed: 9100, country:"BR", cls:4 }); P().age = 26; P().stats.looks = 70; P().stats.intelligence = 70; P().stats.health = 80; S.edu.level = 4; S.flags.license = true; S.vehicles.push({ uid:uid(), id:DATA.vehicles[0].id, value:1000, country:"BR" });
    const r = startGig(g.id); if (!r.ok){ out.rendaInicial[g.id] = "bloqueado: " + r.msg; continue; }
    S.yearSummary = { income:0, taxes:0, expenses:0, lines:[] }; gigYear(); out.rendaInicial[g.id] = fmt(S.gig.lastIncome, true);
  }
  let exposed = 0, ist = 0;
  for (let i=0;i<40;i++){
    S = null; newLife({ seed: 9200+i }); P().age = 22; P().stats.looks = 80; startGig(i % 2 ? "adult" : "escort"); setGigPace(2);
    for (let y=0;y<8 && P().alive;y++){ S.yearSummary = { income:0, taxes:0, expenses:0, lines:[] }; gigYear(); }
    if (S.queue.some(q => q.id === "ev_adult_exposed")) exposed++; if (S.illnesses.some(x => x.id === "ist")) ist++;
  }
  out.exposicaoEm8Anos = `${exposed}/40`; out.istAcompanhante = `${ist}/20`;
  out.OK = DATA.gigs.every(g => typeof out.rendaInicial[g.id] === "string") && exposed > 5 && ist > 0;
  return out;
}
/* Esporte: carreira de futebol dos 18 aos 40 — contratos, títulos, aposentadoria. */
function sportsTest(n = 20){
  let retired = 0, titles = 0, contracts = 0, coaches = 0, injuries = 0;
  for (let i=0;i<n;i++){
    S = null; newLife({ seed: 9300+i }); P().age = 18; P().talents.sport = 80; P().stats.health = 90;
    hireDirect("football", 0);
    for (let y=0;y<24 && P().alive;y++){
      ageUp();
      while (validHead()){ const q = S.queue[0]; const n2 = EVENT_MAP[q.id].choices(q.ctx).length; resolveEvent(q.id === "ev_sport_retire" ? Math.min(1, n2-1) : q.id === "ev_sport_contract" ? n2 > 2 ? 1 : 0 : 0); if (S.fight) autoFight(); if (S.escape) autoEscape(); }
      if (S.log.some(e => /Transferência|Renovei/.test(e.text) && e.age === P().age)) contracts++;
    }
    if (S.flags.exAthlete) retired++; if (S.job?.careerId === "coach" || S.jobHistory.some(j => /Técnico|Auxiliar técnico/.test(j.title))) coaches++;
    titles += S.log.filter(e => /campe(ão|ã) com o/.test(e.text)).length; injuries += S.log.filter(e => /Lesão/.test(e.text)).length;
  }
  const out = { carreiras:n, aposentados:retired, viraramTecnico:coaches, assinaturasDeContrato:contracts, titulos:titles, lesoes:injuries };
  out.OK = retired >= n*0.6 && contracts > n && titles > 0 && injuries > 0;
  return out;
}
/* Lado sombrio: suspeita cresce com pistas, disfarce reduz, força-tarefa pode prender. */
function darkTest(n = 40){
  const run = withCover => {
    let heat = 0, caught = 0, kills = 0;
    for (let i=0;i<n;i++){
      S = null; newLife({ seed: 9400+i }); P().age = 25; awakenDark("code");
      if (withCover){ hireDirect("cashier", 0); const r = makePartner(); r.role = "spouse"; S.rels.push(r); }
      for (let y=0;y<10 && P().alive && !inPrison();y++){ S.activitiesThisYear = 0; autoHunt(); ageUp(); while (validHead()){ resolveEvent(0); if (S.fight) autoFight(); if (S.escape) autoEscape(); } }
      heat += dark().heat; kills += dark().kills; if (dark().caught || S.record.some(r => /série/.test(r.crime))) caught++;
    }
    return { suspeitaMedia: Math.round(heat/n), vitimasMedia: (kills/n).toFixed(1), presos: `${caught}/${n}`, presosN: caught, suspeitaPorVitima: +(heat/Math.max(1, kills)).toFixed(1) };
  };
  const out = { comDisfarce: run(true), semDisfarce: run(false) };
  // disfarce = menos prisões e menos suspeita por vítima (quem é preso para de caçar, então a média bruta engana)
  out.OK = out.comDisfarce.presosN < out.semDisfarce.presosN && out.comDisfarce.suspeitaPorVitima < out.semDisfarce.suspeitaPorVitima && parseFloat(out.comDisfarce.vitimasMedia) > 0;
  return out;
}
