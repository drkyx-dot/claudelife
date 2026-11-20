"use strict";
/* ui/views/rels.js */

/* ---------- Aba Relações ---------- */
function viewRels(){
  const groups = [
    ["👨‍👩‍👧 Família", r => ["mother","father","sibling"].includes(r.role) && r.alive && !r.unborn],
    ["❤️ Amor", r => ["partner","fiance","spouse"].includes(r.role) && r.alive],
    ["🧒 Filhos", r => r.role==="child" && r.alive],
    ["🤝 Amigos", r => r.role==="friend" && r.alive],
    ["💔 Ex", r => r.role==="ex" && r.alive],
    ["🕯️ In memoriam", r => !r.alive],
  ];
  let h = `<div class="card"><div class="chips">${P().age>=16?`<button class="btn primary" onclick="UI.dating()">💘 App de namoro</button>`:""}${P().age>=25?`<button class="btn" onclick="UI.do(adoptChild)">Adotar criança (${fmt(priceOf(3000))})</button>`:""}<span class="s" style="align-self:center">Energia: ${ACT_LIMIT - S.activitiesThisYear}/${ACT_LIMIT}</span></div></div>`;
  for (const [title, f] of groups){
    const list = S.rels.filter(f); if (!list.length) continue;
    h += `<div class="card"><h2>${title}</h2>` + list.map(r=>`<div class="row" style="cursor:pointer" onclick="UI.person('${r.uid}')"><div class="grow"><div class="t">${esc(r.first)} ${esc(r.last)}</div><div class="s">${relLabel(r)} · ${r.alive?`${r.age} anos${r.job?" · "+esc(r.job):""}`:`faleceu aos ${r.deathAge} (${r.deathYear})`}${r.role==="friend"&&r.rel>=60?" · 🤝 pode te ajudar":""}${r.role==="spouse"?` · 💑 ${REGIMES[regime()].name.toLowerCase()}`:""}</div></div>${r.alive?mini(r.rel):""}</div>`).join("") + `</div>`;
  }
  h += `<div class="card"><h2>🏳️‍🌈 Identidade</h2><div class="s">Orientação: <b>${orientationName()}</b>${discovering() ? ` — ${identity().steps} vivência(s) até agora. Ela se define pelas suas escolhas na adolescência.` : ""}</div></div>`;
  h += petsCard();
  return h;
}
