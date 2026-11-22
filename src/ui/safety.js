"use strict";
/* =====================================================================
   ui/safety.js — REDE DE SEGURANÇA contra travamento e save corrompido.

   1. Transação por ação: toda função de UI (clique) guarda um retrato do
      estado antes. Se der erro no meio, o estado VOLTA ao retrato — nada
      fica pela metade — e o jogador segue jogando.
   2. Erros fora das ações (handlers soltos, timers) caem no tratador
      global: se o estado ficou inválido, volta ao último estado bom.
   3. Save só grava estado que passa na checagem; o save anterior fica
      como backup (.bak) e é usado se o principal estiver estragado.
   4. Telas protegidas: se uma aba falhar ao desenhar, aparece um aviso
      com botão de volta, nunca uma tela vazia.
   O painel vermelho de erro só aparece com ?debug.
   ===================================================================== */
const Safety = (() => {
  let lastGood = null, depth = 0, recovering = false;
  const errors = [];
  const DEBUG = /debug/.test(location.search);
  function badNumbers(o, out = [], path = "S", d = 0){
    if (out.length > 3 || d > 7) return out;
    if (typeof o === "number" && !isFinite(o)) out.push(path);
    else if (o && typeof o === "object") for (const k in o) badNumbers(o[k], out, path + "." + k, d + 1);
    return out;
  }
  const sane = st => validateState(st) && Array.isArray(st.rels) && Array.isArray(st.log) && !badNumbers(st).length;
  function snapshot(){ try { if (S && sane(S)) lastGood = JSON.stringify(S); } catch(e){} }
  function report(e, where){
    const msg = `${where}: ${e && e.message || e}`;
    errors.push({ msg, stack: (e && e.stack || "").split("\n").slice(0, 3).join(" | "), t: Date.now() });
    if (errors.length > 30) errors.shift();
    console.error("[ClaudiLife]", msg, e);
    if (DEBUG) showDebug(msg + "\n" + (e && e.stack || ""));
  }
  function showDebug(text){
    const d = document.createElement("pre");
    d.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:999;background:#b00020;color:#fff;padding:10px;font:12px monospace;white-space:pre-wrap;border-radius:8px;max-height:40vh;overflow:auto";
    d.textContent = text; d.onclick = () => d.remove(); document.body.appendChild(d);
  }
  /* Volta para o último estado bom e redesenha. */
  function restore(reason){
    if (recovering) return; recovering = true;
    try {
      if (lastGood){ S = JSON.parse(lastGood); ensureState(S); sanitize(); }
      else if (S){ ensureState(S); sanitize(); }
      document.documentElement.classList.remove("lock");
      try { closeModal(); } catch(e){ const r = document.getElementById("modalRoot"); if (r) r.innerHTML = ""; }
      if (S) render();
      toast(reason || "Algo deu errado nessa ação. Voltei o jogo para logo antes dela.");
    } catch(e){ report(e, "restaurar"); }
    recovering = false;
  }
  /* Executa uma ação como transação. */
  function run(label, fn, self, args){
    if (depth > 0) return fn.apply(self, args); // ação dentro de ação: a de fora já protege
    depth++; snapshot();
    try { const r = fn.apply(self, args); depth--; return r; }
    catch(e){ depth--; report(e, label); restore(); return undefined; }
  }
  /* Protege todas as funções do objeto UI (cliques) de uma vez. */
  function wrapUI(){
    for (const k of Object.keys(UI)){
      const f = UI[k]; if (typeof f !== "function" || f.__safe) continue;
      const w = function(...a){ return run("UI." + k, f, this, a); }; w.__safe = true; UI[k] = w;
    }
  }
  /* Erros fora das transações (handlers inline, timers, promessas). */
  function onUncaught(e){
    report(e.error || e.reason || e, "global");
    if (!S) return;
    if (!sane(S)) restore("Um erro deixou o jogo inconsistente. Voltei para o último ponto seguro.");
    else { try { render(); } catch(_){} toast("Algo deu errado, mas seu jogo está salvo e seguro."); }
  }
  addEventListener("error", onUncaught);
  addEventListener("unhandledrejection", onUncaught);
  return { run, wrapUI, report, restore, snapshot, sane, badNumbers, errors, DEBUG };
})();

/* ---------- Save à prova de estado quebrado, com backup ---------- */
{
  const rawSave = saveGame;
  saveGame = function(silent){
    if (NO_PERSIST || !S) return false;
    if (!Safety.sane(S)){
      // nunca "conserta" zerando valores e grava por cima: recusa e volta ao último estado bom
      Safety.report(new Error("estado inválido: " + (Safety.badNumbers(S).join(",") || "estrutura")), "saveGame");
      Safety.restore("Detectei um valor inválido e voltei para o último ponto seguro. Nada foi perdido.");
      return false;
    }
    try { // o save atual vira backup antes de ser substituído (1 por slot, renovado a cada ano de jogo)
      const key = SLOT_PREFIX + CUR_SLOT, prev = CUR_SLOT && lsGet(key);
      if (prev && lsGet(key + ".bakAge") !== String(P().age)){ lsSet(key + ".bak", prev); lsSet(key + ".bakAge", String(P().age)); }
    } catch(e){}
    const ok = rawSave(silent);
    if (!ok){ // armazenamento cheio: encurta a linha do tempo e tenta de novo
      try { if (S.log.length > 1200){ S.log = S.log.slice(-1200); return rawSave(silent); } } catch(e){}
    }
    return ok;
  };
  const rawLoad = loadGame;
  loadGame = function(slotId){
    try { if (rawLoad(slotId)) return true; } catch(e){ Safety.report(e, "loadGame"); }
    // principal estragado: tenta o backup
    const id = slotId || lsGet(CUR_SLOT_KEY) || listSlots()[0]?.id; if (!id) return false;
    try {
      const o = JSON.parse(lsGet(SLOT_PREFIX + id + ".bak") || "null");
      if (o && validateState(o.state)){ S = migrate(o.state); sanitize(); CUR_SLOT = id; toast("O save estava danificado. Recuperei o backup do ano anterior."); return true; }
    } catch(e){ Safety.report(e, "loadGame.bak"); }
    return false;
  };
  const rawDelete = deleteSlot;
  deleteSlot = function(id){ rawDelete(id); lsDel(SLOT_PREFIX + id + ".bak"); lsDel(SLOT_PREFIX + id + ".bakAge"); };
}

/* ---------- Telas protegidas ---------- */
{
  const rawRender = render;
  render = function(){
    try { rawRender(); }
    catch(e){
      Safety.report(e, "render:" + TAB);
      const v = $("#view");
      if (v) v.innerHTML = `<div class="card alert"><h2>⚠️ Esta tela não abriu</h2><p>Seu jogo continua salvo. Tente outra aba.</p><div class="choices"><button onclick="TAB='life';render()">Voltar para Vida</button></div></div>`;
    }
  };
}
Safety.wrapUI();
