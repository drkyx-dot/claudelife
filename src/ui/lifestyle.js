"use strict";
/* =====================================================================
   ui/lifestyle.js — modais de aparência/visão, pets (abrigo, pet shop,
   mercado exótico e cuidados), painel da penitenciária, casamento com
   regime de bens e ações com amigos/cônjuge.
   ===================================================================== */
function petRow(pt){
  const sp = petSp(pt), risk = attackRisk(pt);
  return `<div class="pet-row"><div class="pet-av">${sp.emoji}</div><div class="grow"><div class="t">${esc(pt.name)} <span class="muted s">${esc(sp.name)} · ${pt.age} ano(s)${pt.temper ? ` · ${esc(pt.temper)}` : ""}</span>${sp.illegal ? ` <span class="tag bad">ilegal</span>` : ""}</div>
    <div class="pet-bars">${bar("💞 Vínculo", pt.bond, "var(--accent)")}${bar("🍖 Fome", pt.hunger, "var(--bad)")}${bar("😾 Estresse", pt.stress, "var(--warn)")}</div>
    <div class="s muted">${sp.size > homeSpace() ? `⚠️ precisa de ${spaceName(sp.size)} · ` : ""}custo ${fmt(priceOf(sp.food + sp.vet), true)}/ano · adestramento ${Math.round(pt.trained*100)}%${risk > 0 ? ` · <b class="${risk > 0.05 ? "bad" : "warn"}">risco de ataque ${(risk*100).toFixed(1)}%/ano</b>` : ""}${pt.neglect ? ` · <b class="bad">${pt.neglect} ano(s) de descuido</b>` : ""}</div>
    <div class="art-btns" style="margin-top:6px"><button class="btn sm" ${pt.played ? "disabled" : ""} onclick="UI.do(()=>petAct('${pt.uid}','play'))">🎾 Brincar</button><button class="btn sm" onclick="UI.do(()=>petAct('${pt.uid}','feed'))">🍖 Ração especial</button>
    <button class="btn sm" onclick="UI.do(()=>petAct('${pt.uid}','train'))">🎓 Adestrar</button><button class="btn sm" onclick="UI.do(()=>petAct('${pt.uid}','vet'))">🩺 Veterinário</button>
    <button class="btn sm danger" onclick="UI.confirm('Doar/entregar ${esc(pt.name)}?', ()=>UI.do(()=>petAct('${pt.uid}','giveaway')))">${sp.illegal ? "🏞️ Santuário" : "🏠 Doar"}</button></div></div></div>`;
}
function petsCard(){
  const pets = S.pets || [];
  return `<div class="card"><h2>🐾 Animais <span class="tag">${pets.length}/${MAX_PETS} · moradia: ${spaceName(homeSpace())}</span></h2>
    ${pets.length ? pets.map(petRow).join("") : `<div class="empty">Nenhum bicho ainda. Que tal adotar?</div>`}
    <div class="choices" style="margin-top:10px"><button onclick="UI.petShop('shelter')">🏠 Abrigo de adoção</button><button onclick="UI.petShop('shop')">🛍️ Pet shop</button>${P().age >= 18 ? `<button onclick="UI.petShop('exotic')">🐅 Mercado exótico<small>ilegal · perigoso</small></button>` : ""}</div></div>`;
}

Object.assign(UI, {
  /* ---------- Aparência e visão ---------- */
  beauty(tab = "style"){
    const L = look(), a = P().age, tabs = [["style","💇 Estilo"],["care","👕 Rotina"],["proc","💉 Procedimentos"],["eyes","👁️ Visão"]];
    let body = "";
    if (tab === "style") body = `${label("Cabelo")}<div class="grid2">${DATA.hairStyles.map(h => `<button class="action ${L.hair === h.id ? "sel" : ""}" onclick="UI.do(()=>setStyle('hair','${h.id}'));UI.beauty('style')"><b>${h.name}</b><span>${h.price ? fmt(priceOf(h.price)) : "grátis"}${h.looks ? ` · +${h.looks} aparência` : ""}</span></button>`).join("")}</div>
      ${label("Rosto")}<div class="grid2">${DATA.faceStyles.map(h => `<button class="action ${L.face === h.id ? "sel" : ""}" onclick="UI.do(()=>setStyle('face','${h.id}'));UI.beauty('style')"><b>${h.name}</b><span>${h.price ? fmt(priceOf(h.price)) : "grátis"}${h.looks ? ` · +${h.looks}` : ""}</span></button>`).join("")}</div>
      <div class="oddsline">Repetir mudanças de visual no mesmo ano rende cada vez menos.</div>`;
    if (tab === "care") body = `${label("Guarda-roupa (custo anual)")}<div class="grid2">${DATA.wardrobes.map(w => `<button class="action ${num(L.wardrobe) === w.id ? "sel" : ""}" onclick="UI.do(()=>setWardrobe(${w.id}));UI.beauty('care')"><b>${w.name}</b><span>${w.price ? `${fmt(priceOf(w.price))}/ano · +${w.perYear}/ano até ${w.cap}` : "sem custo"}</span></button>`).join("")}</div>
      ${label("Pele")}<div class="choices"><button onclick="UI.do(toggleSkincare);UI.beauty('care')">${L.skincare ? "✅ Skincare ativo" : "🧴 Começar skincare"}<small>${fmt(priceOf(1500))}/ano · envelhecimento da pele pela metade</small></button></div>`;
    if (tab === "proc") body = `<div class="oddsline">Clínica barata = erro médico frequente (deformação, sequela e até morte). Acima dos 60, o risco dobra.</div>
      <div class="grid2">${DATA.procedures.map(d => `<button class="action" ${a < d.minAge ? "disabled" : ""} onclick="UI.confirm('${esc(d.name)} por ${fmt(priceOf(d.price))}? Risco de complicação ~${Math.round(d.risk*100*(a>60?2:1))}%.', ()=>{ UI.do(()=>doProcedure('${d.id}')); })"><span class="odds ${d.risk > 0.1 ? "bad" : d.risk > 0.04 ? "warn" : "good"}">${Math.round(d.risk*100)}%</span><b>${d.name}</b><span>${fmt(priceOf(d.price))} · +${d.looks[0]}–${d.looks[1]} aparência${a < d.minAge ? ` · idade ${d.minAge}+` : ""}</span></button>`).join("")}</div>`;
    if (tab === "eyes") body = !L.visionTested ? `<div class="empty">O teste de visão acontece uma única vez, na escola.</div>`
      : !L.myopia ? `<div class="empty">👁️ Visão perfeita. Nada a corrigir.</div>`
      : L.lasik ? `<div class="empty">✅ Visão corrigida a laser.</div>`
      : `<p class="muted">Você tem miopia. Óculos: ${L.glasses ? esc(byId(DATA.frames, L.glasses).name) : "<b class='bad'>sem correção (dor de cabeça, notas piores)</b>"} · penalidade atual na aparência −${num(L.glassesPenalty)}.</p>
        ${label("Armações")}<div class="grid2">${DATA.frames.map(f => `<button class="action ${L.glasses === f.id ? "sel" : ""}" onclick="UI.do(()=>setFrame('${f.id}'));UI.beauty('eyes')"><b>${f.name}</b><span>${f.price ? fmt(priceOf(f.price)) + (f.yearly ? "/ano" : "") : "grátis"} · aparência −${f.penalty}${f.minAge ? ` · ${f.minAge}+` : ""}</span></button>`).join("")}</div>
        ${label("Cirurgia a laser (definitiva)")}<div class="choices"><button ${a < 20 ? "disabled" : ""} onclick="UI.close();UI.do(()=>laserSurgery(false))">🏥 Clínica de referência · ${fmt(priceOf(9000))}<small>97% de sucesso · recupera a aparência +1</small></button>
        <button ${a < 20 ? "disabled" : ""} onclick="UI.close();UI.do(()=>laserSurgery(true))">🏚️ Clínica popular · ${fmt(priceOf(3500))}<small>80% de sucesso · risco de olho seco</small></button></div>`;
    modal(`<div class="emoji">${avatar()}</div><h3>Aparência ${Math.round(P().stats.looks)}/100</h3>
      <div class="seg tabs4">${tabs.map(([k,l]) => `<button class="${tab === k ? "on" : ""}" onclick="UI.beauty('${k}')">${l}</button>`).join("")}</div>
      <div style="margin-top:10px">${body}</div><div class="choices" style="margin-top:10px"><button onclick="UI.close()">Fechar</button></div>`);
  },
  /* ---------- Pets ---------- */
  petShop(kind){
    const a = P().age;
    let list = "";
    if (kind === "shelter") list = shelterList().map((x,i) => { const sp = byId(DATA.petSpecies, x.sp); return `<button class="action" onclick="UI.close();UI.do(()=>adoptPet(${i}))"><b>${sp.emoji} ${esc(x.name)}</b><span>${esc(sp.name)} · ${x.age} ano(s) · ${esc(x.temper)} · taxa ${fmt(priceOf(sp.price))}</span></button>`; }).join("") || `<div class="empty">Todos foram adotados este ano. 💛</div>`;
    else list = DATA.petSpecies.filter(s => s.src === kind).map(sp => `<button class="action" ${kind === "exotic" && a < 18 ? "disabled" : ""} onclick="UI.petBuy('${sp.id}')">${sp.danger >= 0.3 ? `<span class="odds bad">perigo</span>` : ""}<b>${sp.emoji} ${sp.name}</b><span>${fmt(priceOf(sp.price))} · ${fmt(priceOf(sp.food + sp.vet), true)}/ano${sp.size ? ` · ${spaceName(sp.size)}` : ""}</span></button>`).join("");
    const head = { shelter:["🏠","Abrigo de adoção","Adotar salva uma vida (+karma). Taxa simbólica."], shop:["🛍️","Pet shop","Animais legais, com nota fiscal."], exotic:["🐅","Mercado exótico (clandestino)","Posse ILEGAL: fiscalização, multa e ficha suja. Bichos grandes exigem espaço, comida cara e atenção — descuido pode ser fatal."] }[kind];
    modal(`<div class="emoji">${head[0]}</div><h3>${head[1]}</h3><p class="muted">${head[2]}</p><div class="grid2">${list}</div><div class="choices" style="margin-top:10px"><button onclick="UI.close()">Fechar</button></div>`);
  },
  petBuy(id){
    const sp = byId(DATA.petSpecies, id);
    modal(`<div class="emoji">${sp.emoji}</div><h3>${sp.name}</h3><p>${fmt(priceOf(sp.price))} · manutenção ${fmt(priceOf(sp.food + sp.vet))}/ano${sp.size ? ` · exige ${spaceName(sp.size)} (você tem: ${spaceName(homeSpace())})` : ""}.</p>
      ${sp.danger >= 0.2 ? `<div class="card alert" style="margin:8px 0"><b>⚠️ Animal selvagem.</b> Sem comida, atenção e espaço por alguns anos, o risco de ataque fica real — inclusive fatal.</div>` : ""}
      <div class="form"><label>Nome</label><input id="petname" maxlength="20" placeholder="${esc(pick(DATA.petNames))}"></div>
      <div class="choices" style="margin-top:10px"><button class="primary" onclick="const n=document.getElementById('petname').value;UI.close();UI.do(()=>buyPet('${id}', n))">Comprar</button><button onclick="UI.close()">Cancelar</button></div>`);
  },
  /* ---------- Penitenciária ---------- */
  prisonCourses(){
    const cat = prisonCat();
    modal(`<div class="emoji">📚</div><h3>Biblioteca e oficinas</h3><p class="muted">Seu crime: <b>${DATA.crimeCats[cat].name}</b>. Cursos alinhados ao seu caso remem mais pena.</p>
      ${DATA.prisonCourses.map(c => { const st = S.prison.courses?.[c.id] || { p:0 }, m = c.mult[cat] || 1, lock = P().stats.intelligence < c.minInt;
        return `<div class="row"><div class="grow"><div class="t">${c.emoji} ${c.name} ${st.done ? chip("concluído", "good") : ""} <span class="tag ${m >= 1.5 ? "good" : m < 1 ? "bad" : ""}">remição ×${m.toFixed(1)}</span></div>
          <div class="s">${esc(c.perk)}${lock ? ` · <b class="bad">exige inteligência ${c.minInt}</b>` : ""}</div>${st.p ? bar("Progresso", st.p, "var(--accent)") : ""}</div>
          <button class="btn sm" ${lock || S.activitiesThisYear >= ACT_LIMIT ? "disabled" : ""} onclick="UI.do(()=>prisonAct('course','${c.id}'));UI.prisonCourses()">Estudar</button></div>`; }).join("")}
      <div class="choices" style="margin-top:10px"><button onclick="UI.close()">Fechar</button></div>`);
  },
  /* ---------- Casamento ---------- */
  marryDialog(u){
    const r = relBy(u); if (!r) return; ensureSpouseMoney(r);
    UI._mc = "simple";
    modal(`<div class="emoji">💒</div><h3>Casar com ${esc(r.first)}</h3><p class="muted">${esc(r.first)} tem ~${fmt(r.money)} de patrimônio (${DATA.wealthLevels[num(r.wealth,2)].toLowerCase()}). Você tem ${fmt(S.money)}.</p>
      ${label("Cerimônia")}<div class="seg two"><button class="on" onclick="UI._mc='simple';this.classList.add('on');this.nextElementSibling.classList.remove('on')">Simples · ${fmt(priceOf(2500))}</button><button onclick="UI._mc='big';this.classList.add('on');this.previousElementSibling.classList.remove('on')">Festão · ${fmt(priceOf(25000))}</button></div>
      ${label("Regime de bens")}<div class="choices">${Object.entries(REGIMES).map(([k,g]) => `<button onclick="UI.close();UI.do(()=>marryWith('${u}', UI._mc, '${k}'))">${g.name}<small>no casamento você acessa: ${g.access}</small></button>`).join("")}<button onclick="UI.close()">Cancelar</button></div>`);
  },
});
