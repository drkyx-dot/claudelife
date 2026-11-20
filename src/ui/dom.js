"use strict";
/* =====================================================================
   ui/dom.js — helpers de DOM, componentes de template e animações.
   Animações são apenas feedback (nunca bloqueiam o jogo) e respeitam
   prefers-reduced-motion.
   ===================================================================== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]);
const barColor = v => v >= 66 ? "var(--good)" : v >= 33 ? "var(--warn)" : "var(--bad)";
const stressColor = v => v >= 66 ? "var(--bad)" : v >= 40 ? "var(--warn)" : "var(--good)";
const REDUCED = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

let TAB = "life", LOGFILTER = "all", LOGALL = false, LOGQUERY = "", TAB_CHANGED = true;
try { TAB = localStorage.getItem("claudilife.tab") || "life"; } catch(e){}

function toast(msg){ const t = $("#toast"); if (!t) return; t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove("show"), 2800); }
/* Avatar: emoji por idade/gênero + tom de pele escolhido no hub. */
function avatarFor(age, gender, tone = ""){ const f = gender === "F"; return (age<3?"👶":age<13?(f?"👧":"👦"):age<18?"🧑":age<60?(f?"👩":"👨"):(f?"👵":"👴")) + (tone || ""); }
function avatar(){ if (!P().alive) return "🪦"; if (inPrison()) return "🧑‍⚖️"; return avatarFor(P().age, P().gender, S.look?.tone); }

/* ---------- componentes ---------- */
function bar(label, v, color, cap){
  v = Math.round(clamp(v));
  return `<div class="bar"><div class="lbl"><span>${label}</span><b>${v}%</b></div><div class="track"><div class="fill" style="width:${v}%;background:${color||barColor(v)}"></div>${cap!==undefined&&cap<100?`<i class="cap" style="left:${cap}%" title="Teto atual"></i>`:""}</div></div>`;
}
function mini(v, color){ v = Math.round(clamp(v)); return `<div class="minibar" title="${v}%"><i style="width:${v}%;background:${color||barColor(v)}"></i></div>`; }
const chip = (text, cls = "") => `<span class="chip ${cls}">${text}</span>`;
const pct = p => `<b class="${oddsColor(p)}">${Math.round(p*100)}%</b>`;
const label = t => `<div class="section-label">${t}</div>`;
const signed = (d, money) => (d > 0 ? "+" : "−") + (money ? fmt(Math.abs(d), true) : Math.abs(d));

/* ---------- animações ---------- */
/* Contador numérico suave (dinheiro no HUD). */
function animateNumber(el, from, to, format, ms = 550){
  if (!el) return;
  if (REDUCED() || from === to || !isFinite(from)){ el.textContent = format(to); return; }
  cancelAnimationFrame(el._raf);
  const t0 = performance.now();
  const step = t => { if (!S || !el.isConnected) return; const k = Math.min(1, (t - t0)/ms), e = 1 - Math.pow(1-k, 3);
    el.textContent = format(Math.round(from + (to - from)*e)); if (k < 1) el._raf = requestAnimationFrame(step); };
  el._raf = requestAnimationFrame(step);
}
/* Reinicia uma classe de animação (remove → reflow → adiciona). */
function restartClass(el, cls){ if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
/* Selo "🎂 33 anos · 2037" ao passar de ano. */
function yearBadge(){
  const b = $("#yearbadge"); if (!b) return;
  b.innerHTML = `<b>🎂 ${P().age} anos</b><span>${year()} · ${lifeStage()}</span>`;
  restartClass(b, "show");
}
