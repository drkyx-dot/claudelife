"use strict";
/* =====================================================================
   ui/escape.js — minigame de fuga: grade, cones de visão (agora e no
   próximo turno), direcional na tela + teclado (setas/WASD/espaço).
   Lógica e regras em systems/escape.js.
   ===================================================================== */
const ARROW = { N:"▲", S:"▼", E:"▶", W:"◀" };

function renderEscape(){
  const E = S.escape, st = escStage(), vNow = visionAt(st, E.t), vNext = visionAt(st, E.t + 1);
  const guards = {}, cams = {};
  for (const g of st.guards){ const p = guardAt(g, E.t); guards[p.x + "," + p.y] = p.dir; }
  for (const c of st.cams) cams[c.x + "," + c.y] = camDir(c, E.t);
  let cells = "";
  for (let y = 0; y < st.h; y++) for (let x = 0; x < st.w; x++){
    const k = x + "," + y, ch = st.grid[y][x], me = E.pos[0] === x && E.pos[1] === y;
    const cls = ["ec"]; let ic = "";
    if (!E.over && ch !== "#" && Math.abs(x - E.pos[0]) + Math.abs(y - E.pos[1]) <= 1) cls.push("reach"); // casas tocáveis
    if (ch === "#") cls.push("wall");
    if (ch === "X"){ cls.push("exit"); ic = E.key ? "🚪" : "🔒"; }
    if (ch !== "#" && vNow.has(k)) cls.push("now"); else if (ch !== "#" && vNext.has(k)) cls.push("next");
    if (st.key && !E.key && st.key[0] === x && st.key[1] === y) ic = "🔑";
    if (cams[k]) ic = `<span class="cam">📹<i>${ARROW[cams[k]]}</i></span>`;
    if (guards[k]) ic = `<span class="guard">👮<i>${ARROW[guards[k]]}</i></span>`;
    if (me){ cls.push("me"); ic = E.over && E.result === "fail" ? "🚨" : "🧍"; }
    cells += `<div class="${cls.join(" ")}" data-x="${x}" data-y="${y}">${ic}</div>`;
  }
  const left = st.limit - E.t;
  let h = `<div class="escape ${E.over ? "done " + E.result : ""}">
    <div class="fight-head"><h3>🏃 ${esc(st.name)}</h3>${chip(`Etapa ${E.stage + 1}/${E.stages.length}`, "neutral")}${chip(`Dificuldade ${E.d}/8`, E.d >= 5 ? "bad" : E.d >= 3 ? "warn" : "good")}
      ${chip(`⏱️ ${left} turno(s)`, left <= 3 ? "bad" : "neutral")}${st.key ? chip(E.key ? "🔑 cartão na mão" : "🔑 pegue o cartão", E.key ? "good" : "warn") : ""}</div>
    <div class="esc-board"><div class="escgrid" role="grid" aria-label="Mapa da fuga: toque numa casa vizinha para andar" style="grid-template-columns:repeat(${st.w},1fr)">${cells}</div>
    <div class="esc-side"><div class="esc-legend"><span><i class="lg now"></i>vigiado agora</span><span><i class="lg next"></i>vigiado no próximo turno</span><span>👮 guarda (▲ direção)</span><span>📹 câmera (gira a cada 2 turnos)</span></div>
    <div class="esc-msg" aria-live="polite">${esc(E.lastMsg || "Chegue à saída sem pisar em casas vermelhas ou laranjas.")}</div>`;
  if (E.over){
    h += `</div></div><div class="fight-end"><div class="emoji">${E.result === "ok" ? "🏃‍♂️💨" : "🚨"}</div><div class="result">${esc(E.msg)}</div><div class="choices"><button class="primary" onclick="UI.escapeDone()">Continuar</button></div></div></div>`;
    return h;
  }
  h += `<div class="dpad">
      <span></span><button aria-label="Norte" onclick="UI.escMove('N')">▲</button><span></span>
      <button aria-label="Oeste" onclick="UI.escMove('W')">◀</button><button aria-label="Esperar" class="wait" onclick="UI.escMove('wait')">⏸</button><button aria-label="Leste" onclick="UI.escMove('E')">▶</button>
      <span></span><button aria-label="Sul" onclick="UI.escMove('S')">▼</button><span></span></div>
    <div class="oddsline" style="text-align:center">${Device.coarse() ? "Toque numa casa vizinha ou deslize o dedo na grade · toque em você para esperar" : "Setas/WASD ou clique numa casa vizinha · espaço para esperar"} · melhor rota: ${st.opt} turnos</div>
    ${!E.stage && !E.t ? `<div class="choices" style="margin-top:8px"><button onclick="UI.escAbort()">Desistir e voltar para a cela</button></div>` : ""}</div></div></div>`;
  return h;
}

Object.assign(UI, {
  escapeOpen(){ if (!S.escape) return; modal(renderEscape(), { locked:true }); },
  escMove(d){
    const E = S.escape; if (!E || E.over) return;
    E.lastMsg = escapeMove(d); saveGame(true);
    UI.escapeOpen();
    if (E.over && E.result === "fail"){ const g = $(".escgrid"); if (g) restartClass(g, "shake"); }
  },
  escAbort(){ if (abortEscape()){ closeModal(); toast("Você desistiu da fuga. Fica para outra hora."); saveGame(true); render(); } },
  escapeDone(){
    const before = UI._mgBefore || takeSnapshot(), msg = closeEscape();
    sanitize(); saveGame(true); render(); UI._mgBefore = null;
    showResult(msg, before);
  },
});
document.addEventListener("keydown", e => {
  if (!S || !S.escape || S.escape.over || !document.querySelector("#modalRoot .escgrid")) return;
  const d = { ArrowUp:"N", KeyW:"N", ArrowDown:"S", KeyS:"S", ArrowLeft:"W", KeyA:"W", ArrowRight:"E", KeyD:"E", Space:"wait" }[e.code];
  if (!d) return;
  e.preventDefault(); UI.escMove(d);
});

/* ---------- Toque: tocar numa casa ou deslizar o dedo na grade ---------- */
function escDirToward(x, y){
  const E = S && S.escape; if (!E || E.over) return null;
  const dx = x - E.pos[0], dy = y - E.pos[1];
  if (!dx && !dy) return "wait";
  return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "E" : "W") : (dy > 0 ? "S" : "N"); // um passo na direção tocada
}
let escTouch = null, escSwiped = false;
document.addEventListener("touchstart", e => {
  const g = e.target.closest && e.target.closest(".escgrid"); if (!g || e.touches.length !== 1) return;
  escTouch = { x:e.touches[0].clientX, y:e.touches[0].clientY }; escSwiped = false;
}, { passive:true });
document.addEventListener("touchend", e => {
  if (!escTouch) return;
  const t = e.changedTouches[0], dx = t.clientX - escTouch.x, dy = t.clientY - escTouch.y; escTouch = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; // foi um toque, não um deslize: o click cuida
  escSwiped = true; UI.escMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "E" : "W") : (dy > 0 ? "S" : "N"));
}, { passive:true });
document.addEventListener("click", e => {
  const c = e.target.closest && e.target.closest(".escgrid .ec"); if (!c) return;
  if (escSwiped){ escSwiped = false; return; }
  const d = escDirToward(+c.dataset.x, +c.dataset.y); if (d) UI.escMove(d);
});
