"use strict";
/* =====================================================================
   ui/modals.js — modal com animação de entrada/saída e troca de
   conteúdo sem "piscar"; eventos narrativos e tela de resultado.
   ===================================================================== */
let MODAL_LOCKED = false;
function modal(html, { locked = false } = {}){
  MODAL_LOCKED = locked;
  const root = $("#modalRoot"), open = root.querySelector(".overlay:not(.closing)");
  if (open){ // já aberto: troca o conteúdo com fade (sequência de eventos)
    const m = open.querySelector(".modal"); m.innerHTML = `<div class="swap">${html}</div>`; m.scrollTop = 0; focusFirst(m); return;
  }
  root.innerHTML = `<div class="overlay" role="dialog" aria-modal="true" onclick="if(event.target===this && !MODAL_LOCKED)UI.close()"><div class="modal">${html}</div></div>`;
  document.documentElement.classList.add("lock");
  focusFirst(root);
}
function focusFirst(el){ if (typeof Device !== "undefined" && Device.coarse()) return; const b = el.querySelector(".choices button, button, input, select"); if (b) setTimeout(()=>b.focus({ preventScroll:true }), 30); }
function closeModal(){
  const o = $("#modalRoot .overlay"); MODAL_LOCKED = false;
  document.documentElement.classList.remove("lock");
  if (!o) return;
  if (REDUCED()){ o.remove(); return; }
  o.classList.add("closing"); setTimeout(()=>{ if (o.isConnected) o.remove(); }, 160);
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && !MODAL_LOCKED) closeModal(); });

function showEvent(){
  const q = validHead();
  if (!q){ closeModal(); saveGame(true); render(); return; }
  const ev = EVENT_MAP[q.id]; let choices, text;
  try { choices = ev.choices(q.ctx); text = ev.text(q.ctx); } catch(e){ console.warn(e); S.queue.shift(); return showEvent(); }
  const left = S.queue.length - 1;
  // abordagem: ficha da pessoa + balão com a fala dela
  const known = q.ctx.uid ? relBy(q.ctx.uid) : null, who = q.ctx.npc || known;
  let speech = ""; try { speech = ev.speech ? ev.speech(q.ctx) : ""; } catch(e){}
  const person = who ? npcCard(who, { revealed: !!q.ctx.revealed, known: !!known }) : "";
  const talk = speech ? bubble(speech, who ? who.first : ev.title, "left", who ? (who.gender==="F"?"👩":"👨") : ev.emoji) : "";
  if (!document.querySelector("#modalRoot .overlay:not(.closing)")) Sound.play("alert"); else Sound.play("bubble");
  modal(`<div class="emoji">${ev.emoji}</div><h3>${esc(ev.title)}</h3>${person}${talk}<p>${esc(say(text))}</p>
    <div class="choices">${choices.map((c,i)=>`<button onclick="UI.choose(${i})">${esc(c.label)}${c.hint?`<small>${esc(c.hint)}</small>`:""}</button>`).join("")}</div>
    ${left ? `<div class="oddsline" style="margin-top:10px">+${left} acontecimento(s) neste ano</div>` : ""}`, { locked:true });
}
/* Resultado de uma escolha com os deltas causados por ela. */
function showResult(res, before){
  const after = takeSnapshot(), chips = [];
  floatDiff(before, after);
  for (const [k,l,inv] of [["health","❤️"],["happiness","😊"],["intelligence","🧠"],["looks","✨"],["stress","😣",true],["rep","💼"]]){
    const d = Math.round(after[k] - before[k]); if (d) chips.push(chip(`${l} ${signed(d)}`, (inv ? d < 0 : d > 0) ? "good" : "bad"));
  }
  const dm = after.money - before.money; if (dm) chips.push(chip(`💰 ${signed(dm, true)}`, dm > 0 ? "good" : "bad"));
  const more = validHead();
  modal(`<div class="result">${esc(res)}</div>${chips.length ? `<div class="chips" style="margin-bottom:14px">${chips.join("")}</div>` : ""}
    <div class="choices"><button class="primary" onclick="UI.next()">${more ? "Próximo acontecimento →" : "Continuar"}</button></div>`, { locked:true });
}
