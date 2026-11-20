"use strict";
/* =====================================================================
   ui/render.js — HUD (atualizado NO LUGAR para animar barras e números),
   abas, rodapé e despacho da view ativa.
   ===================================================================== */
const TABS = [["life","🏠","Vida"],["career","💼","Carreira"],["assets","💰","Bens"],["rels","❤️","Relações"],["health","🩺","Saúde"],["acts","🎯","Ações"]];
const HUD_BARS = [["health","❤️ Saúde"],["happiness","😊 Felicidade"],["intelligence","🧠 Inteligência"],["looks","✨ Aparência"]];
let HUD_PREV = null;

function hudSkeleton(){
  $("#hud").innerHTML = `
    <div class="hudcard">
      <div class="idrow">
        <div class="avatar" data-k="avatar"></div>
        <div class="idtext"><h1 data-k="name"></h1><div class="sub" data-k="sub"></div></div>
        <div class="money"><span data-k="money"></span><small data-k="nw"></small></div>
        <button class="iconbtn" onclick="UI.menu()" aria-label="Menu">☰</button>
      </div>
      <div class="bars">${HUD_BARS.map(([k,l])=>`<div class="bar" data-bar="${k}"><div class="lbl"><span>${l}</span><b data-v></b></div><div class="track"><div class="fill"></div><i class="cap"></i></div><span class="delta"></span></div>`).join("")}</div>
      <div class="substats" data-k="substats"></div>
    </div>
    <nav class="tabs" role="tablist">${TABS.map(([k,ic,l])=>`<button role="tab" data-tab="${k}" onclick="UI.tab('${k}')"><span class="ic">${ic}</span><span>${l}</span></button>`).join("")}</nav>`;
}
function renderHUD(){
  if (!$("#hud .hudcard")) { hudSkeleton(); HUD_PREV = null; }
  const p = P(), c = country(), q = k => $(`#hud [data-k="${k}"]`);
  const now = { ...p.stats, money:S.money, age:p.age };
  q("avatar").textContent = avatar();
  q("name").textContent = `${p.first} ${p.last}`;
  q("sub").textContent = `${p.age} ano${p.age===1?"":"s"} · ${lifeStage()} · ${p.city}, ${c.name}`;
  const mEl = q("money"), mBox = mEl.parentElement;
  animateNumber(mEl, HUD_PREV ? HUD_PREV.money : S.money, S.money, v => fmt(v, true));
  q("nw").textContent = `Patrimônio ${fmt(netWorth(), true)}`;
  if (HUD_PREV && S.money !== HUD_PREV.money){ mBox.classList.remove("up","down"); mBox.classList.add(S.money > HUD_PREV.money ? "up" : "down"); restartClass(mBox, "flash"); clearTimeout(mBox._t); mBox._t = setTimeout(()=>mBox.classList.remove("up","down"), 1200); }
  if (HUD_PREV && p.age !== HUD_PREV.age) restartClass(q("avatar"), "bday");
  for (const [k] of HUD_BARS){
    const el = $(`#hud [data-bar="${k}"]`), v = Math.round(clamp(p.stats[k]));
    el.querySelector("[data-v]").textContent = v + "%";
    const fill = el.querySelector(".fill"); fill.style.width = v + "%"; fill.style.background = barColor(v);
    const cap = el.querySelector(".cap");
    if (k === "health" && healthCap() < 99){ cap.style.display = ""; cap.style.left = healthCap() + "%"; cap.title = `Teto de saúde: ${Math.round(healthCap())}`; } else cap.style.display = "none";
    const d = HUD_PREV ? v - Math.round(HUD_PREV[k]) : 0;
    if (d){ const de = el.querySelector(".delta"); de.textContent = (d>0?"+":"−") + Math.abs(d); de.className = "delta " + (d>0?"up":"down"); restartClass(de, "show"); el.classList.remove("up","down"); restartClass(el, d>0?"up":"down"); }
  }
  const subs = [];
  if (p.age >= 6) subs.push(chip(`😣 Estresse ${Math.round(p.stress)}`, p.stress >= 66 ? "bad" : p.stress >= 40 ? "warn" : "good"));
  if (p.age >= 18) subs.push(chip(`💼 Reputação ${Math.round(p.reputation)}`, "neutral"), chip(`🏦 Crédito ${S.credit}`, S.credit >= 680 ? "good" : S.credit >= 560 ? "neutral" : "bad"));
  if (p.alive) subs.push(chip(`⚡ Energia ${ACT_LIMIT - S.activitiesThisYear}/${ACT_LIMIT}`, "neutral"));
  if (p.fame >= 10) subs.push(chip(`⭐ Fama ${Math.round(p.fame)}`));
  q("substats").innerHTML = subs.join("");
  for (const b of document.querySelectorAll("#hud [data-tab]")){ const on = b.dataset.tab === TAB; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); }
  HUD_PREV = now;
}
function renderFooter(){
  const f = $("#agebar");
  if (!P().alive){ f.innerHTML = `<div class="inner"><button class="big" onclick="UI.newLifeDialog()">✨ Nova vida</button></div>`; return; }
  const pending = S.queue.length;
  f.innerHTML = `<div class="inner"><button class="big" onclick="UI.ageUp()">${pending ? "📩 Responder evento" : "＋ Envelhecer 1 ano"}<small>${pending ? `${pending} decisão(ões) pendente(s)` : `próximo: ${P().age+1} anos · ${year()+1}`}</small></button></div>`;
}
const VIEWS = () => ({ life:viewLife, career:viewCareer, assets:viewAssets, rels:viewRels, health:viewHealth, acts:viewActs });
function render(){
  if (!S) return;
  renderHUD(); renderFooter();
  const v = $("#view");
  v.innerHTML = !P().alive ? viewDeath() : (VIEWS()[TAB] || viewLife)();
  if (TAB_CHANGED && !REDUCED()) restartClass(v, "view-enter");
  TAB_CHANGED = false;
}
