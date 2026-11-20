"use strict";
/* =====================================================================
   ui/hub.js — HUB INICIAL (menu principal estilo jogo mobile):
   continuar, vidas salvas (slots), hall dos legados/conquistas, ajustes
   e o CRIADOR DE PERSONAGEM (nome, gênero, país/cidade, tom de pele,
   cabelo, olhos, etnia, traço inicial). Classe social e orientação NÃO
   são escolhidas: a classe é sorteada ao nascer e a orientação é
   descoberta na adolescência.
   ===================================================================== */
let HUB_FORM = null, HUB_VIEW = null;
const flagOf = cid => ({ BR:"🇧🇷", PT:"🇵🇹", US:"🇺🇸", JP:"🇯🇵", DE:"🇩🇪", MX:"🇲🇽", NG:"🇳🇬", IN:"🇮🇳" })[cid] || "🌍";

function showHub(view = "home"){
  const el = $("#hub"); if (!el) return;
  closeModal();
  el.classList.add("on"); document.body.classList.add("hub-open");
  const same = HUB_VIEW === view && el.innerHTML, y = el.scrollTop; // re-render da mesma tela mantém a rolagem
  el.innerHTML = `<div class="hub-inner ${same ? "still" : ""}">${HUB_VIEWS[view] ? HUB_VIEWS[view]() : HUB_VIEWS.home()}</div>`;
  el.scrollTop = same ? y : 0; HUB_VIEW = view;
  if (same) return;
  if (!Device.coarse()){ const f = el.querySelector("button.primary, button"); if (f) setTimeout(() => f.focus({ preventScroll:true }), 30); }
}
function hideHub(){ const el = $("#hub"); if (!el) return; el.classList.remove("on"); el.innerHTML = ""; HUB_VIEW = null; document.body.classList.remove("hub-open"); }
const hubBack = () => `<button class="hub-back" onclick="showHub('home')" aria-label="Voltar">←</button>`;

const HUB_VIEWS = {
  home(){
    const slots = listSlots(), cur = slots.find(s => s.id === (CUR_SLOT || lsGet(CUR_SLOT_KEY))) || slots[0], hall = readHall();
    return `<div class="hub-top">${fsButton("hub-back")}</div><div class="hub-logo"><span class="ld-mark">🧬</span><b>Claudi<span>Life</span></b></div><div class="ld-sub">Simulador de vida</div>
      ${cur ? `<button class="hub-continue" onclick="hubPlay('${cur.id}')"><span class="hc-av">${cur.alive ? avatarFor(cur.age, cur.gender, cur.tone) : "🪦"}</span>
        <span class="hc-txt"><b>${cur.alive ? "▶ Continuar" : "📜 Ver legado"}</b><small>${esc(cur.name)} · ${cur.age} anos · ${flagOf(cur.country)} ${cur.gen > 1 ? `· ${cur.gen}ª geração` : ""}</small></span></button>` : ""}
      <div class="hub-grid">
        <button class="hub-tile accent" onclick="showHub('create')"><span>✨</span><b>Nova vida</b><small>criar personagem</small></button>
        <button class="hub-tile" onclick="hubRandom()"><span>🎲</span><b>Vida aleatória</b><small>tudo sorteado</small></button>
        <button class="hub-tile" onclick="showHub('slots')"><span>📂</span><b>Vidas salvas</b><small>${slots.length}/${MAX_SLOTS} slots</small></button>
        <button class="hub-tile" onclick="showHub('hall')"><span>🏛️</span><b>Hall dos legados</b><small>${hall.lives.length} vida(s) · ${Object.keys(hall.ach).length} conquista(s)</small></button>
        <button class="hub-tile" onclick="showHub('settings')"><span>⚙️</span><b>Ajustes</b><small>som, tema, linguagem</small></button>
        <button class="hub-tile" onclick="document.getElementById('hubimp').click()"><span>⬆️</span><b>Importar</b><small>arquivo .json</small></button>
        <button class="hub-tile" onclick="UI.guide()"><span>📖</span><b>Guia rápido</b><small>como jogar em 5 passos</small></button>
      </div>
      <input type="file" id="hubimp" accept="application/json,.json" hidden onchange="importSave(this.files[0], ok=>{ toast(ok?'Save importado em um slot novo!':'Arquivo inválido.'); if (ok){ hideHub(); render(); } })">
      <div class="hub-foot">💡 ${esc(pick(DATA.tips))}</div>`;
  },
  slots(){
    const slots = listSlots();
    return `${hubBack()}<h2 class="hub-h">📂 Vidas salvas <span class="muted">${slots.length}/${MAX_SLOTS}</span></h2>
      ${slots.length ? slots.map(s => `<div class="hub-slot ${s.id === CUR_SLOT ? "cur" : ""}"><div class="hs-av">${s.alive ? avatarFor(s.age, s.gender, s.tone) : "🪦"}</div>
        <div class="grow"><div class="t">${esc(s.name)} ${s.alive ? "" : `<span class="tag bad">falecido(a)</span>`}</div>
        <div class="s muted">${s.age} anos · ${flagOf(s.country)} · ${esc(DATA.classes[s.cls]?.name || "")}${s.gen > 1 ? ` · ${s.gen}ª geração` : ""}${s.title ? ` · 🏅 ${esc(s.title)}` : ""}</div>
        <div class="s muted">salvo em ${new Date(s.savedAt).toLocaleString("pt-BR", { dateStyle:"short", timeStyle:"short" })}</div></div>
        <div class="hs-btns"><button class="btn sm primary" onclick="hubPlay('${s.id}')">${s.alive ? "Jogar" : "Legado"}</button>
        <button class="btn sm danger" onclick="hubDelete('${s.id}')">Apagar</button></div></div>`).join("") : `<div class="empty">Nenhuma vida salva ainda.</div>`}`;
  },
  hall(){
    const h = readHall(), L = h.lives;
    const best = L.slice().sort((a,b) => b.score - a.score)[0], oldest = L.slice().sort((a,b) => b.age - a.age)[0];
    const ach = Object.entries(h.ach).sort((a,b) => b[1] - a[1]);
    return `${hubBack()}<h2 class="hub-h">🏛️ Hall dos legados</h2>
      <div class="statgrid">${[["🧬 Vidas vividas", L.length],["🏆 Melhor pontuação", best ? `${best.score} · ${esc(best.name)}` : "—"],["⏳ Vida mais longa", oldest ? `${oldest.age} anos · ${esc(oldest.name)}` : "—"],["🎖️ Conquistas únicas", ach.length]]
        .map(([k,v]) => `<div class="kpi"><div class="k">${k}</div><div class="v">${v}</div></div>`).join("")}</div>
      ${ach.length ? `<div class="section-label">Conquistas desbloqueadas</div><div class="chips">${ach.map(([t,n]) => chip(`${esc(t)}${n > 1 ? ` ×${n}` : ""}`, "good")).join("")}</div>` : ""}
      <div class="section-label">Vidas passadas</div>
      ${L.length ? L.map(l => `<div class="hub-slot"><div class="hs-av">${avatarFor(Math.min(l.age, 70), l.gender, l.tone)}</div><div class="grow"><div class="t">${esc(l.name)} <span class="muted s">${l.born}–${l.died}</span></div>
        <div class="s">🏅 ${esc(l.title || "—")} · ${l.score} pts · ${l.ach} conquista(s)</div><div class="s muted">${flagOf(l.country)} ${esc(l.cls || "")} · ${esc(l.cause || "")}</div></div></div>`).join("") : `<div class="empty">Quando um personagem morrer, a história dele fica aqui.</div>`}`;
  },
  settings(){
    return `${hubBack()}<h2 class="hub-h">⚙️ Ajustes</h2><div class="choices">
      <button onclick="Sound.toggle();showHub('settings')">${SETTINGS.sound ? "🔊 Som ligado" : "🔇 Som desligado"}</button>
      <div class="form" style="padding:0 4px"><label>Volume</label><input type="range" min="0" max="1" step="0.05" value="${SETTINGS.volume}" oninput="Sound.setVolume(+this.value)" onchange="Sound.play('click')" style="padding:0"></div>
      <button onclick="UI.theme()">🌓 Alternar tema claro/escuro</button>
      <button onclick="SETTINGS.lang = SETTINGS.lang === 'forte' ? 'leve' : 'forte'; saveSettings(); showHub('settings')">${SETTINGS.lang === "forte" ? "🤬 Linguagem realista (com palavrões)" : "😇 Linguagem leve (filtrada)"}</button></div>`;
  },
  create(){
    const F = HUB_FORM ||= { gender: chance(0.5) ? "M" : "F", country: pick(DATA.countries).id, tone:"", hair: pick(DATA.hair), eyes: pick(DATA.eyes), ethnicity: pick(DATA.ethnicities), trait:"", first:"", last:"", city:"" };
    const c = byId(DATA.countries, F.country);
    if (!c.cities.includes(F.city)) F.city = c.cities[0];
    const pickBtn = (field, label, value) => `<label id="lbl_${field}">${label}</label><button type="button" class="picker" aria-haspopup="listbox" aria-labelledby="lbl_${field}" onclick="hubPick('${field}')"><span>${value}</span><i aria-hidden="true">▾</i></button>`;
    return `${hubBack()}<h2 class="hub-h">✨ Criar personagem</h2>
      <div class="creator-preview"><div class="cp-av">${avatarFor(0, F.gender, F.tone)}</div><div class="cp-arrow">→</div><div class="cp-av cp-big">${avatarFor(28, F.gender, F.tone)}</div>
        <div class="cp-name">${esc(F.first || "Nome")} ${esc(F.last || "Sobrenome")}<small>${flagOf(F.country)} ${esc(F.city)}, ${esc(c.name)}</small></div></div>
      <div class="form">
        <label>Primeiro nome</label><div class="row-in"><input id="h_first" maxlength="30" value="${esc(F.first)}" oninput="HUB_FORM.first=this.value;hubPreview()" placeholder="deixe vazio para sortear"><button class="btn sm" onclick="hubRollName()">🎲</button></div>
        <label>Sobrenome</label><input id="h_last" maxlength="30" value="${esc(F.last)}" oninput="HUB_FORM.last=this.value;hubPreview()" placeholder="deixe vazio para sortear">
        <label>Gênero</label><div class="seg two">${[["M","Masculino"],["F","Feminino"]].map(([k,l]) => `<button class="${F.gender === k ? "on" : ""}" onclick="HUB_FORM.gender='${k}';showHub('create')">${l}</button>`).join("")}</div>
        ${pickBtn("country", "País", `${flagOf(F.country)} ${esc(c.name)}`)}
        ${pickBtn("city", "Cidade", esc(F.city))}
        <label>Tom de pele (avatar)</label><div class="tones">${DATA.skinTones.map(([t,n]) => `<button title="${n}" aria-label="${n}" class="${F.tone === t ? "on" : ""}" onclick="HUB_FORM.tone='${t}';showHub('create')">${avatarFor(28, F.gender, t)}</button>`).join("")}</div>
        ${pickBtn("ethnicity", "Etnia", esc(F.ethnicity))}
        ${pickBtn("hair", "Cabelo", esc(F.hair))}
        ${pickBtn("eyes", "Olhos", esc(F.eyes))}
        <label>Traço de personalidade inicial <span class="muted">(os outros são sorteados)</span></label>
        <div class="traitpick">${[["","🎲 Sortear"], ...DATA.traits.map(t => [t.id, t.name])].map(([id,n]) => `<button class="${F.trait === id ? "on" : ""}" title="${esc(byId(DATA.traits,id)?.desc || "")}" onclick="HUB_FORM.trait='${id}';showHub('create')">${esc(n)}</button>`).join("")}</div>
        ${F.trait ? `<div class="oddsline">${esc(byId(DATA.traits, F.trait).desc)}</div>` : ""}
      </div>
      <div class="hub-locked"><div>🎲 <b>Classe social:</b> sorteada ao nascer, entre 9 níveis — de <i>Miséria Extrema</i> a <i>Herdeiro(a) Bilionário(a)</i>. Ela define o patrimônio dos pais, a moradia, a saúde e a escola.</div>
        <div>🏳️‍🌈 <b>Orientação:</b> em descoberta. Suas escolhas na adolescência vão revelá-la.</div></div>
      <div class="choices" style="margin-top:12px"><button class="primary" onclick="hubStart()">👶 Nascer!</button></div>`;
  },
};
function hubPreview(){ const p = $(".cp-name"); if (!p || !HUB_FORM) return; const c = byId(DATA.countries, HUB_FORM.country); p.innerHTML = `${esc(HUB_FORM.first || "Nome")} ${esc(HUB_FORM.last || "Sobrenome")}<small>${flagOf(HUB_FORM.country)} ${esc(HUB_FORM.city)}, ${esc(c.name)}</small>`; }
function hubRollName(){ const c = byId(DATA.countries, HUB_FORM.country), n = genName(c, HUB_FORM.gender); HUB_FORM.first = n.first; HUB_FORM.last = n.last; showHub("create"); }
function hubStart(){
  if (slotsFull()){ toast(`Você já tem ${MAX_SLOTS} vidas salvas. Apague uma em "Vidas salvas".`); showHub("slots"); return; }
  const F = HUB_FORM; HUB_FORM = null;
  hideHub(); startNewSlot();
  UI.startLife({ first:F.first.trim() || undefined, last:F.last.trim() || undefined, gender:F.gender, country:F.country, city:F.city, tone:F.tone, hair:F.hair, eyes:F.eyes, ethnicity:F.ethnicity, trait:F.trait || undefined, keepLineage:false });
}
function hubRandom(){
  if (slotsFull()){ toast(`Você já tem ${MAX_SLOTS} vidas salvas. Apague uma em "Vidas salvas".`); showHub("slots"); return; }
  hideHub(); startNewSlot(); UI.startLife({ tone: pick(DATA.skinTones)[0] });
}
function hubPlay(id){
  if (!loadGame(id)){ toast("Não foi possível abrir esse save."); return; }
  hideHub(); HUD_PREV = null; TAB = "life"; render(); pageTop();
  if (!P().alive) return;
  if (S.fight) UI.fightOpen(); else if (S.escape) UI.escapeOpen(); else if (S.queue.length) showEvent();
}
function hubDelete(id){
  const s = listSlots().find(x => x.id === id); if (!s) return;
  UI.confirm(`Apagar a vida de ${s.name} para sempre? (O hall dos legados é mantido.)`, () => { deleteSlot(id); if (!CUR_SLOT) S = null; showHub("slots"); });
}

/* ---------- Seletor próprio (substitui <select>) ----------
   A lista nativa do <select> é desenhada pelo navegador/sistema e, em
   webviews (pré-visualização de editor, apps embutidos), costuma abrir
   fora do lugar. Esta lista é HTML da página: abre como folha inferior no
   celular e como caixa central no desktop, com a opção atual marcada. */
const HUB_PICKS = {
  country:   { title:"País",   opts: () => DATA.countries.map(x => [x.id, `${flagOf(x.id)} ${x.name}`]) },
  city:      { title:"Cidade", opts: () => byId(DATA.countries, HUB_FORM.country).cities.map(x => [x, x]) },
  ethnicity: { title:"Etnia",  opts: () => DATA.ethnicities.map(x => [x, x]) },
  hair:      { title:"Cabelo", opts: () => DATA.hair.map(x => [x, x]) },
  eyes:      { title:"Olhos",  opts: () => DATA.eyes.map(x => [x, x]) },
};
function hubPick(field){
  const P0 = HUB_PICKS[field]; if (!P0 || !HUB_FORM) return;
  const cur = HUB_FORM[field];
  modal(`<h3>${P0.title}</h3><div class="choices picklist" role="listbox" aria-label="${P0.title}">${P0.opts().map(([v, l]) =>
    `<button role="option" aria-selected="${v === cur}" class="${v === cur ? "sel" : ""}" onclick="hubPicked('${field}', this.dataset.v)" data-v="${esc(v)}">${esc(l)}${v === cur ? '<b aria-hidden="true">✓</b>' : ""}</button>`).join("")}
    </div><div class="choices" style="margin-top:10px"><button onclick="UI.close()">Cancelar</button></div>`);
  const sel = document.querySelector("#modalRoot .picklist .sel"); if (sel) sel.scrollIntoView({ block:"center" });
}
function hubPicked(field, v){
  HUB_FORM[field] = v;
  if (field === "country"){ const c = byId(DATA.countries, v); if (!c.cities.includes(HUB_FORM.city)) HUB_FORM.city = c.cities[0]; }
  closeModal(); showHub("create");
}
