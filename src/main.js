"use strict";
/* main.js */

(function boot(){
  try { const t = localStorage.getItem("claudilife.theme"); if (t) document.documentElement.dataset.theme = t; } catch(e){}
  if (/selftest|balance|unit=|demo=|acttest|audit/.test(location.search)) NO_PERSIST = true; // testes nunca tocam nos saves reais
  if (/selftest/.test(location.search)){
    Sound.mute(true);
    const r = selfTest(60); r.emigration = emigrationTest(); r.heir = heirTest(); r.combat = combatTest(); r.escape = escapeTest();
    r.v7 = { identity: identityTest().OK, prison: prisonTest().OK, pets: petTest(120).OK, classes: classTest(600).OK, bonds: bondsTest().OK, gigs: gigTest().OK, sports: sportsTest().OK, dark: darkTest(30).OK }; S = null;
    document.body.innerHTML = `<pre id="selftest" style="white-space:pre-wrap;padding:16px;font:13px monospace">${esc(JSON.stringify({ ...r, ages: r.ages.join(","), scores: undefined, errors: r.errors.slice(0,15), bad: r.bad.slice(0,10), errorCount:r.errors.length, badCount:r.bad.length }, null, 1))}</pre>`;
    document.title = "SELFTEST " + (r.errors.length||r.bad.length||r.invariants||!r.emigration.OK||!r.heir.OK||!r.combat.OK||!r.escape.OK||Object.values(r.v7).some(x=>!x) ? "FAIL" : "OK");
    document.body.insertAdjacentHTML("afterbegin", `<h1 id="verdict" style="font:700 22px monospace;padding:12px 16px;margin:0">${document.title} · v7 ${esc(JSON.stringify(r.v7))} · emig ${r.emigration.OK} · herdeiro ${r.heir.OK} · combate ${r.combat.OK} · fuga ${r.escape.OK} · invariantes ${r.invariants||0}</h1>`);
    return;
  }
  const unit = location.search.match(/unit=(\w+)/); // dev: ?unit=combatTest | escapeTest | emigrationTest | heirTest
  if (unit && /Test$/.test(unit[1]) && typeof window[unit[1]] === "function"){
    Sound.mute(true); const t0 = performance.now(); const r = window[unit[1]](); r.ms = Math.round(performance.now() - t0); S = null;
    document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:12px;font:12px monospace">${esc(JSON.stringify(r, null, 1))}</pre>`;
    document.body.insertAdjacentHTML("afterbegin", `<h1 style="font:700 18px monospace;padding:10px 12px;margin:0">${unit[1]} ${r.OK ? "OK" : "FAIL"}${r.erro ? " · " + esc(r.erro) : ""}</h1>`);
    document.title = unit[1] + (r.OK ? " OK" : " FAIL"); return;
  }
  if (/audit/.test(location.search)){ // dev: ?audit — estouros de largura e alvos de toque
    Sound.mute(true); const r = layoutAudit(); document.documentElement.classList.remove("lock");
    document.body.insertAdjacentHTML("beforeend", `<pre id="audit" style="position:fixed;inset:0;z-index:999;background:#fff;color:#000;margin:0;white-space:pre-wrap;font:11px monospace;padding:8px;overflow:auto">${esc(`AUDIT ${r.OK ? "OK" : "FAIL"} · ${r.largura}px · telas: ${Object.keys(r.telas).length}\n` + JSON.stringify({ comProblema: Object.fromEntries(Object.entries(r.telas).filter(([,t]) => t.rolagemHorizontal || t.estouros.length)), alvosPequenos: r.alvosPequenos, camposZoom: r.camposZoom }, null, 1))}</pre>`);
    document.title = "AUDIT " + (r.OK ? "OK" : "FAIL"); return;
  }
  if (/acttest/.test(location.search)){ // dev: verifica atividades de saúde num idoso
    newLife({ seed: 77, cls: 6 }); P().age = 75; P().vitality = 60; P().stats.health = 30; S.money = priceOf(1e6);
    const out = []; for (const id of ["gym","walk","train","meditate","gym","gym"]){ const r = doActivity(id); out.push(`${id}: ${r.ok} · ${r.msg} · saúde=${Math.round(P().stats.health)} · teto=${Math.round(healthCap())}`); }
    document.body.innerHTML = `<pre style="white-space:pre-wrap;font:12px monospace;padding:12px">${esc(out.join("\n"))}</pre>`; return;
  }
  if (/balance/.test(location.search)){
    const r = balanceReport(); S = null;
    document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:16px;font:13px monospace">${esc(JSON.stringify(r, null, 1))}</pre>`;
    return;
  }
  const demo = location.search.match(/demo=(\d+)/); // ferramenta de dev: ?demo=30&tab=career
  if (demo){
    newLife({ seed: 42, country: "BR", cls: 4 });
    for (let y=0; y<Number(demo[1]) && P().alive; y++){
      if (P().age === 18) applyUniversity("cs");
      if (P().age >= 23 && !S.job && !S.edu.school) applyJob("dev");
      if (P().age === 25) rentHome("r_apt");
      if (P().age >= 30 && P().age % 3 === 0) medicalCheckup();
      if (/intl/.test(location.search) && P().age === 31){ S.money += priceOf(2e6); buyProperty("apt3", false, "PT"); toggleRentOut(S.properties[S.properties.length-1].uid); buyProperty("kitnet", false); toggleRentOut(S.properties[S.properties.length-1].uid); }
      if (/org/.test(location.search) && P().age === 32){ S.crimeSkill = 40; S.money += priceOf(1e5); foundOrg(); recruit(makeCrewCandidate()); startOp("gambling"); }
      ageUp(); while (validHead()) resolveEvent(0);
    }
    const dump = location.search.match(/dump=([^&]+)/);
    if (dump){ const re = new RegExp(decodeURIComponent(dump[1]), "i"); document.body.innerHTML = `<pre style="white-space:pre-wrap;font:12px monospace;padding:12px">${esc(S.log.filter(e=>re.test(e.text)).map(e=>`${e.age}: ${e.text}`).join("\n"))}\n\ncredit=${S.credit}</pre>`; return; }
    const tb = location.search.match(/tab=(\w+)/); if (tb) TAB = tb[1];
    render();
    const ev = location.search.match(/ev=(\w+)/); if (ev){ enqueue(ev[1]); showEvent(); }
    const fk = location.search.match(/fight=(\w+)/); // ?demo=25&fight=street&art=muaythai:85&steps=3
    if (fk){ const ar = location.search.match(/art=(\w+):(\d+)/); if (ar){ martial().arts[ar[1]] = { m:+ar[2], years:5 }; martial().enrolled = [ar[1]]; }
      startFight(fk[1], fk[1] === "tournament" ? { tid:"amador", art: ar ? ar[1] : "boxe", idx:0 } : {});
      const st = +(location.search.match(/steps=(\d+)/)||[0,0])[1]; for (let i=0;i<st && !S.fight.over;i++){ const mv = fightActions().moves; fightAction(mv[mv.length-1].id); }
      render(); UI.fightOpen(); }
    const ui = location.search.match(/ui=(\w+)/); // ?demo=30&ui=hub|create|slots|hall|pick|beauty|pets|prison|spouse
    if (ui){ const k = ui[1];
      if (k === "pets"){ S.money += priceOf(5e5); adoptPet(0); buyPet("tiger"); S.pets[1].hunger = 70; S.pets[1].neglect = 2; S.pets[1].stress = 75; TAB = "rels"; render(); }
      if (k === "prison"){ sendToPrison(8, "fraude financeira corporativa"); S.prison.courses.law = { p:60, done:false }; S.prison.remit = 0.4; render(); window.scrollTo(0, 0); }
      if (k === "spouse"){ const r = makePartner(); r.role = "fiance"; r.wealth = 3; S.rels.push(r); marryWith(r.uid, "simple", "total"); TAB = "rels"; render(); UI.person(r.uid); }
      if (k === "beauty"){ look().visionTested = true; look().myopia = true; setFrame("modern"); render(); UI.beauty("eyes"); }
      if (["hub","create","slots","hall"].includes(k)) showHub(k === "hub" ? "home" : k);
      if (k === "pick"){ showHub("create"); hubPick("country"); }
      if (k === "gig"){ startGig("streamer"); S.gig.audience = 3400; TAB = "career"; render(); }
      if (k === "dark"){ S.money += priceOf(1e5); buyWeapon("tactical"); awakenDark("code"); dark().urge = 64; dark().heat = 38; dark().clues = 2; TAB = "acts"; render(); }
      if (k === "hunt"){ awakenDark("code"); UI.hunt(); }
      if (k === "tut"){ UI._tut = { i:2, mandatory:true }; UI.tutStep(); }
      if (k === "collect"){ S.money += priceOf(2e6); buyCollectible("fossil"); buyCollectible("watch"); buyCollectible("idol"); TAB = "assets"; render(); }
    }
    const es = location.search.match(/escape=(\d+)/); // ?demo=25&escape=4&moves=2
    if (es){ sendToPrison(6, "demonstração"); S.prison.security = ["mínima","média","máxima"][Math.min(2, Math.floor(+es[1]/2))]; S.prison.escAttempts = +es[1] % 2; startEscape();
      const mv = +(location.search.match(/moves=(\d+)/)||[0,0])[1]; const sol = solveStage(escStage()); for (let j=1;j<=mv && j<sol.path.length;j++){ const [x0,y0]=sol.path[j-1],[x1,y1]=sol.path[j]; S.escape.lastMsg = escapeMove(x1>x0?"E":x1<x0?"W":y1>y0?"S":y1<y0?"N":"wait"); }
      render(); UI.escapeOpen(); }
    return;
  }
  // abertura: carregamento longo (4–6 s) → hub (menu principal)
  showLoading(BOOT_STEPS, () => { migrateLegacySave(); }, () => showHub("home"), { long:true });
})();
