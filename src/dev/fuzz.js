"use strict";
/* =====================================================================
   dev/fuzz.js — "macaco" de interface (?fuzz=N): joga clicando em botões
   REAIS da tela (modais, abas, ações, hub), avançando anos, e registra
   todo erro — inclusive os que acontecem dentro de onclick, que o
   selftest (que chama as funções direto) não enxerga.
   Também confere, a cada passo, se o estado salvo continua válido.
   ===================================================================== */
function uiFuzz(steps = 1500, seed = 1){
  const errors = [], seen = new Set();
  const onErr = e => { const k = `${e.message} @${(e.filename||"").split("/").pop()}:${e.lineno}`; if (!seen.has(k)){ seen.add(k); errors.push(k + ` (passo ${step}, aba ${TAB}, ${lastClick})`); } };
  addEventListener("error", onErr);
  let step = 0, lastClick = "", lives = 0, years = 0, badSaves = 0;
  const skip = /exportSave|hubimp|importSave|getElementById\('imp'\)|FS\.|location|deleteSlot|hubDelete/;
  const safeStart = Safety.errors.length;
  Device.guard = () => true; // cliques do teste são instantâneos: sem trava de toque duplo
  S = null; newLife({ seed }); hideHub(); render(); lives++;
  for (step = 0; step < steps; step++){
    if (!S){ newLife({ seed: seed + step }); render(); lives++; }
    if (!P().alive){ if (chance(0.5)){ const k = children().find(c => c.alive); if (k){ continueAsHeir(k.uid); render(); continue; } } S = null; newLife({ seed: seed + step }); hideHub(); render(); lives++; continue; }
    const scope = document.querySelector("#modalRoot .overlay:not(.closing)") || (document.querySelector("#hub.on") ? document.querySelector("#hub") : document.querySelector("#app"));
    const btns = [...scope.querySelectorAll("button:not([disabled]), .row.click, .ec.reach")].filter(b => !skip.test(b.getAttribute("onclick") || ""));
    let target = null;
    if (!document.querySelector("#modalRoot .overlay") && !document.querySelector("#hub.on") && chance(0.25)) target = document.querySelector("footer.age .big");
    else if (!document.querySelector("#modalRoot .overlay") && chance(0.12)) target = pick([...document.querySelectorAll("nav.tabs button")]);
    else target = btns.length ? pick(btns) : null;
    if (!target){ closeModal(); hideHub(); render(); continue; }
    lastClick = (target.getAttribute("onclick") || target.textContent || "").trim().slice(0, 60);
    if (/trace/.test(location.search)) console.log(`FUZZ#${step} age=${P().age} tab=${TAB} modal=${!!document.querySelector("#modalRoot .overlay")} → ${lastClick}`);
    const ageBefore = P().age;
    try { target.click(); } catch(e){ onErr({ message:e.message, filename:"click", lineno:0 }); }
    if (S && P().age > ageBefore) years += P().age - ageBefore;
    // fecha telas que ficariam abertas para sempre (ex.: input de arquivo)
    if (step % 40 === 39 && document.querySelector("#modalRoot .overlay") && !MODAL_LOCKED) closeModal();
    if (S && (!validateState(S) || scanBad(S).length)) { badSaves++; if (badSaves < 4) errors.push(`estado inválido no passo ${step}: ${scanBad(S).join(",")}`); }
  }
  removeEventListener("error", onErr);
  // erros que a rede de segurança capturou (e desfez) também contam como falha
  for (const e of Safety.errors.slice(safeStart)) errors.push("capturado: " + e.msg + " | " + e.stack);
  return { passos: steps, vidas: lives, anos: years, erros: errors.slice(0, 25), totalErros: errors.length, estadosInvalidos: badSaves, OK: !errors.length && !badSaves };
}

/* Saves com dados faltando (?unit=corruptTest): apaga um campo ao acaso de
   um save "jogado", passa pelo caminho normal de carregamento (migrate) e
   tenta jogar: desenhar todas as abas, abrir telas e avançar anos. */
function corruptTest(trials = 160){
  const fails = {}, seenErr = new Set(); let ok = 0;
  const tops = ["player","edu","job","rels","prison","flags","health","world","stats","martial","look","identity","pets","org","properties","vehicles","loans","businesses","investments","scheduled","queue","cooldown","log","achievements","illnesses","addictions","gig","collection","arsenal","dark","wanted","escape","fight","yearSummary","lastYear","hist","lineage"];
  for (let t = 0; t < trials; t++){
    S = null; newLife({ seed: 7700 + t });
    for (let y = 0; y < 10 + (t % 40); y++){ if (!P().alive) break; ageUp(); while (validHead()) resolveEvent(rint(0, EVENT_MAP[S.queue[0].id].choices(S.queue[0].ctx).length - 1)); if (S.fight) autoFight(); if (S.escape) autoEscape(); }
    if (!P().alive) continue;
    // corrompe: remove um campo de topo OU um subcampo, ou troca por null/lixo
    const st = JSON.parse(JSON.stringify(S)), k = pick(tops), mode = t % 3;
    let what = k;
    if (mode === 0) delete st[k];
    else if (mode === 1) st[k] = null;
    else if (st[k] && typeof st[k] === "object" && !Array.isArray(st[k])){ const sub = pick(Object.keys(st[k])); if (sub){ delete st[k][sub]; what = `${k}.${sub}`; } }
    else st[k] = "lixo";
    try {
      if (!validateState(st)) { ok++; continue; }          // o loader recusaria: ok (usa backup)
      S = migrate(st); sanitize();
      for (const tb of ["life","career","assets","rels","health","acts"]){ TAB = tb; render(); }
      UI.menu(); closeModal(); if (S.rels[0]) { UI.person(S.rels[0].uid); closeModal(); }
      for (let y = 0; y < 3 && P().alive; y++){ ageUp(); while (validHead()) resolveEvent(0); if (S.fight) autoFight(); if (S.escape) autoEscape(); }
      render(); ok++;
    } catch(e){
      const key = `${what} (${["apagado","null","lixo/sub"][mode]}): ${e.message}`;
      if (!seenErr.has(key)){ seenErr.add(key); fails[key] = (e.stack || "").split("\n")[1]?.trim(); }
    }
  }
  S = null; closeModal();
  return { tentativas: trials, sobreviveram: ok, falhas: Object.keys(fails).length, detalhes: fails, OK: !Object.keys(fails).length };
}

/* Rede de segurança (?unit=safetyTest): erro no meio de uma ação desfaz
   tudo; save recusa estado quebrado; backup recupera save estragado. */
function safetyTest(){
  const out = {}, slot = CUR_SLOT, np = NO_PERSIST;
  S = null; newLife({ seed: 4321 }); P().age = 30; S.money = 1000;
  const errs0 = Safety.errors.length;
  UI.do(() => { S.money = NaN; S.rels = "quebrado"; throw new Error("erro de teste no meio da ação"); });
  out.rollbackDinheiro = S.money === 1000; out.rollbackRels = Array.isArray(S.rels); out.erroRegistrado = Safety.errors.length > errs0;
  // save: grava um bom, tenta gravar um quebrado
  NO_PERSIST = false; CUR_SLOT = "selftest_safety";
  out.salvouBom = saveGame(true);
  S.money = NaN; out.recusouQuebrado = saveGame(true) === false;
  const stored = JSON.parse(lsGet(SLOT_PREFIX + CUR_SLOT)); out.saveIntacto = stored.state.money === 1000;
  // principal estragado → backup
  S.money = 1000; P().age = 31; saveGame(true);          // gera backup do ano anterior
  lsSet(SLOT_PREFIX + CUR_SLOT, "{ isso não é json");
  S = null; out.recuperouBackup = loadGame(CUR_SLOT) && P().first.length > 0;
  deleteSlot("selftest_safety"); NO_PERSIST = np; CUR_SLOT = slot;
  out.OK = Object.values(out).every(Boolean);
  return out;
}

/* Perseguição policial (?unit=chaseTest): toda dificuldade tem saída;
   render-se, ser pego e fugir dão o desfecho certo. */
function chaseTest(){
  const out = { porDificuldade:{} }; let solvable = 0;
  S = null; newLife({ seed: 5150 }); P().age = 25;
  for (let d = 0; d <= 7; d++){
    let ok = 0;
    for (let i = 0; i < 6; i++){ const st = genStage(d, 0, 1, chaseParams(d), ["teste"]); if (solveStage(st)) ok++; }
    const P0 = chaseParams(d); out.porDificuldade[d] = `${ok}/6 solucionáveis · grade ${P0.size} · ${P0.guards} policial(is) · ${P0.cams} câmera(s) · folga ${P0.slack}`; solvable += ok;
  }
  const fresh = () => { S = null; newLife({ seed: 5151 }); P().age = 25; };
  // 1) crime leve falha → perseguição fácil
  fresh(); sendToPrison(1, "furto em loja", undefined, { chase:true });
  out.virouPerseguicao = S.escape?.mode === "street" && !S.prison; out.dificuldadeFurto = S.escape?.d;
  abortEscape(); out.rendeuPreso = !!S.prison && S.prison.years === 1; closeEscape();
  // 2) pego → +1 ano
  fresh(); sendToPrison(3, "roubo de carro", undefined, { chase:true }); failEscape("teste"); out.pegoMaisUmAno = S.prison?.years === 4; closeEscape();
  // 3) fugiu → livre (talvez procurado)
  fresh(); sendToPrison(20, "homicídio doloso", "máxima", { chase:true }); out.dificuldadeHomicidio = S.escape?.d; succeedEscape(); out.fugiuLivre = !S.prison; closeEscape();
  // 4) jogando a solução da BFS pela mesma função da interface
  fresh(); sendToPrison(6, "teste", undefined, { chase:true });
  const sol = solveStage(escStage()); for (let j = 1; j < sol.path.length && !S.escape.over; j++){ const [x0,y0] = sol.path[j-1], [x1,y1] = sol.path[j]; escapeMove(x1>x0?"E":x1<x0?"W":y1>y0?"S":y1<y0?"N":"wait"); }
  out.jogadaVenceu = S.escape?.result === "ok"; closeEscape();
  // 5) menor de idade e quem já está preso não entram em perseguição
  fresh(); P().age = 15; sendToPrison(1, "teste", undefined, { chase:true }); out.menorNaoPersegue = !S.escape; S.prison = null;
  out.OK = solvable === 48 && out.virouPerseguicao && out.rendeuPreso && out.pegoMaisUmAno && out.fugiuLivre && out.jogadaVenceu && out.menorNaoPersegue && out.dificuldadeFurto < out.dificuldadeHomicidio;
  return out;
}
/* Caminho gradual do lado sombrio (?unit=darkPathTest). */
function darkPathTest(){
  const out = {};
  S = null; newLife({ seed: 6060 }); P().age = 30;
  S.stats.kills = 2; darkOnKill(); out.semPerguntaCom2 = !S.queue.some(q => q.id === "ev_dark_question");
  S.stats.kills = 3; darkOnKill(); out.perguntaCom3 = S.queue.some(q => q.id === "ev_dark_question");
  S.queue = []; answerDark("no"); S.stats.kills = 4; darkOnKill(); out.naoRepeteLogo = !S.queue.some(q => q.id === "ev_dark_question");
  S.stats.kills = 6; darkOnKill(); out.voltaDepois = S.queue.some(q => q.id === "ev_dark_question");
  S.queue = []; answerDark("yes"); out.aindaInativo = !dark().active;
  S.stats.kills = 7; darkOnKill(); out.semDespertarCom1 = !S.queue.some(q => q.id === "ev_dark_awakening");
  S.stats.kills = 8; darkOnKill(); out.despertarCom2 = S.queue.some(q => q.id === "ev_dark_awakening");
  out.semBotaoDireto = !darkPanel().includes("Despertar");
  out.OK = Object.values(out).every(Boolean);
  return out;
}

/* Idade × país × pais (?unit=ageTest). */
function ageTest(){
  const out = {}, life = (cid, age) => { S = null; newLife({ seed: 3030, country: cid }); P().age = age; S.money = priceOf(50000); return S; };
  life("US", 19); out.eua19NaoBebe = doActivity("party").ok === false; out.eua19NaoAposta = doActivity("casino").ok === false;
  life("BR", 19); out.br19Bebe = doActivity("party").ok === true;
  life("US", 16); out.eua16Dirige = doActivity("license").ok !== false || /Passei|Reprovei/.test(S.log.slice(-1)[0]?.text || "");
  life("BR", 16); out.br16NaoDirige = doActivity("license").ok === false;
  life("PT", 14); out.pt14NaoTrabalha = applyPartTime("pt_babysit").ok === false;
  life("BR", 14); out.br14Trabalha = applyPartTime("pt_babysit").ok === true;
  // menor de idade: hospital e tratamento pagos pelos pais
  life("BR", 12); const m0 = S.money; S.illnesses.push({ id:"flu", years:0, stage:2, diagnosed:true, treated:false, tier:null });
  treatIllness("flu", "private"); medicalCheckup(); out.menorNaoPagaSaude = S.money === m0;
  const bill = payBill(priceOf(5000), "a conta do hospital"); out.menorPaisPagam = S.money === m0 && /pais|família/i.test(bill);
  life("BR", 30); const a0 = S.money; payBill(priceOf(5000), "a conta do hospital"); out.adultoPaga = S.money < a0;
  life("BR", 10); S.player.cls = 0; S.illnesses.push({ id:"flu", years:0, stage:2, diagnosed:true, treated:false, tier:null });
  out.pobreSoPublico = treatIllness("flu", "private").ok === false && treatIllness("flu", "public").ok !== false;
  out.OK = Object.values(out).every(Boolean);
  return out;
}
