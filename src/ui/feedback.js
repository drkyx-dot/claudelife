"use strict";
/* =====================================================================
   ui/feedback.js — tela de carregamento, feedback flutuante (+R$,
   −Saúde, +Fama), balões de fala e ficha de NPC.
   ===================================================================== */

/* ---------- Tela de carregamento estilo jogo mobile ----------
   Barra de progresso + checklist de etapas + porcentagem + dicas que
   giram. `work` roda no meio (gerar vida, carregar save) e a tela some
   em fade com um acorde de "pronto". { long:true } = 4–6 s (abertura do
   jogo e nova vida); padrão ≈1,5 s. NÃO pode ser pulada. Em
   prefers-reduced-motion a tela aparece sem animações (CSS). */
const BOOT_STEPS = ["Inicializando o motor de simulação…","Gerando árvore genealógica…","Sorteando país, cidade e família…","Calculando a economia global…","Carregando academias e submundo…","Treinando os guardas do presídio…","Afinando os efeitos sonoros…","Preparando seu destino…"];
function showLoading(steps, work, done, opts = {}){
  const el = $("#loading");
  if (!el || /selftest|balance|demo|acttest/.test(location.search)){ work && work(); done && done(); return; }
  const tips = DATA.tips.slice().sort(() => Math.random() - 0.5); let tipI = 0;
  el.innerHTML = `<div class="ld-inner">
      <div class="ld-logo"><span class="ld-mark">🧬</span><b>Claudi<span>Life</span></b></div>
      <div class="ld-sub">Simulador de vida</div>
      <div class="ld-bar"><i></i></div>
      <div class="ld-row"><div class="ld-step">${esc(steps[0])}</div><div class="ld-pct">0%</div></div>
      ${opts.long ? `<ol class="ld-list">${steps.map(t => `<li>${esc(t.replace(/…$/, ""))}</li>`).join("")}</ol>` : ""}
      <div class="ld-tip">💡 <b>Dica:</b> <span>${esc(tips[0])}</span></div>
      <div class="ld-skip">${opts.long ? "Preparando a simulação…" : ""}</div></div>`;
  el.classList.remove("out"); el.classList.add("on");
  const bar = el.querySelector(".ld-bar i"), stepEl = el.querySelector(".ld-step"), pctEl = el.querySelector(".ld-pct"), tipEl = el.querySelector(".ld-tip span"), items = el.querySelectorAll(".ld-list li");
  const total = opts.long ? 4300 + Math.random()*1400 : 1300 + Math.random()*500, t0 = performance.now(); // UI: não consome o RNG semeado
  let worked = false, finished = false, lastStep = -1, lastTip = t0;
  const finish = () => {
    if (finished) return; finished = true;
    if (!worked){ worked = true; work && work(); }
    bar.style.width = "100%"; pctEl.textContent = "100%"; items.forEach(li => li.className = "done");
    Sound.play("ready");
    el.classList.add("out");
    setTimeout(()=>{ el.classList.remove("on","out"); el.innerHTML = ""; done && done(); }, 320);
  };
  el.onclick = null; // não pulável: roda até o fim da duração programada
  const tick = now => {
    if (finished) return;
    const k = Math.min(1, (now - t0)/total);
    // progresso "realista": acelera, hesita nas etapas pesadas e termina suave
    const eased = Math.min(1, 1 - Math.pow(1-k, 2.2) + Math.sin(k*Math.PI*3) * 0.015 * (1-k));
    bar.style.width = Math.round(eased*100) + "%"; pctEl.textContent = Math.round(eased*100) + "%";
    const si = Math.min(steps.length-1, Math.floor(k*steps.length));
    if (si !== lastStep){
      lastStep = si; stepEl.textContent = steps[si];
      items.forEach((li, i) => li.className = i < si ? "done" : i === si ? "active" : "");
      if (si > 0) Sound.play("tick");
    }
    if (opts.long && now - lastTip > 1900 && tips.length > 1){ lastTip = now; tipI = (tipI + 1) % tips.length; tipEl.parentElement.classList.remove("swap-in"); void tipEl.offsetWidth; tipEl.textContent = tips[tipI]; tipEl.parentElement.classList.add("swap-in"); }
    if (k > 0.45 && !worked){ worked = true; work && work(); }
    if (k >= 1) return finish();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- Feedback flutuante ---------- */
const FLOAT_KEYS = [["money","💰",true],["health","❤️ Saúde"],["happiness","😊 Felicidade"],["intelligence","🧠 Inteligência"],["looks","✨ Aparência"],["fame","⭐ Fama"],["stress","😣 Estresse",false,true],["rep","💼 Reputação"]];
function floatDiff(before, after){
  if (!before || !after) return;
  const host = $("#floaters"); if (!host) return;
  let i = 0, gained = false, lost = false;
  for (const [k, label, money, inverse] of FLOAT_KEYS){
    const d = Math.round(num(after[k]) - num(before[k])); if (!d) continue;
    const good = inverse ? d < 0 : d > 0;
    if (money){ (d > 0 ? gained = true : lost = true); }
    const f = document.createElement("div");
    f.className = `floater ${good ? "good" : "bad"}`;
    f.textContent = money ? `${d>0?"+":"−"}${fmt(Math.abs(d), true)}` : `${d>0?"+":"−"}${Math.abs(d)} ${label}`;
    f.style.animationDelay = `${i*110}ms`; f.style.left = `${50 + (i%2 ? 1 : -1) * (6 + (i%3)*5)}%`;
    host.appendChild(f); setTimeout(()=>f.remove(), 1900 + i*110); i++;
    if (i >= 5) break;
  }
  if (gained) Sound.play("money"); else if (lost) Sound.play("loss");
}

/* ---------- Balões de fala ---------- */
function bubble(text, who, side = "left", avatar = "💭"){
  return `<div class="bubble-row ${side}"><div class="bubble-av">${avatar}</div><div class="bubble"><div class="bubble-who">${esc(who)}</div>${esc(text)}</div></div>`;
}

/* ---------- Ficha de NPC (abordagens, relações, capangas) ---------- */
function npcCard(n, { revealed = false, known = false } = {}){
  const per = byId(DATA.personalities, n.personality), show = revealed || known;
  const gIcon = n.gender === "F" ? "👩" : "👨";
  return `<div class="npc-card">
    <div class="npc-head"><div class="npc-av">${n.age < 13 ? "🧒" : n.age >= 65 ? (n.gender==="F"?"👵":"👴") : gIcon}</div>
      <div><div class="t">${esc(n.first)} ${esc(n.last||"")}${n.nick?` <span class="muted">"${esc(n.nick)}"</span>`:""}</div>
      <div class="s">${n.age} anos · ${esc(n.job || (n.role && typeof relLabel === "function" ? relLabel(n) : n.role) || "—")}</div></div></div>
    <div class="npc-tags">
      ${chip(show && per ? `🧠 ${per.name}` : "🧠 Personalidade ?", show ? "" : "neutral")}
      ${chip(show ? `💵 ${DATA.wealthLevels[num(n.wealth,2)]}` : "💵 Finanças ?", "neutral")}
      ${n.looks !== undefined ? chip(`✨ Aparência ${Math.round(n.looks)}`, "neutral") : ""}
      ${n.skill !== undefined ? chip(`🎯 Habilidade ${Math.round(n.skill)}`, "neutral") : ""}
      ${n.loyalty !== undefined ? chip(`🤝 Lealdade ${Math.round(n.loyalty)}`, n.loyalty < 35 ? "bad" : "good") : ""}
    </div>
    ${show && per ? `<div class="oddsline">${esc(per.desc)}${per.scam ? ' · <b class="bad">⚠️ sinais de golpe</b>' : ""}</div>` : ""}
  </div>`;
}
