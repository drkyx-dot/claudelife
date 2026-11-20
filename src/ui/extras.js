"use strict";
/* =====================================================================
   ui/extras.js — telas de trabalho autônomo, vida de atleta, coleção,
   arsenal e lado sombrio (caçada em etapas).
   ===================================================================== */
function gigCard(){
  const a = P().age; if (a < 12 || inPrison()) return "";
  const G = S.gig;
  let h = `<div class="card"><h2>🧰 Trabalho autônomo <span class="tag">${S.job ? "como bico, além do emprego" : "renda por conta própria"}</span></h2>`;
  if (G){
    const d = gigDef(G.id);
    h += `<div class="row"><div class="grow"><div class="t">${d.emoji} ${d.name}</div><div class="s">${G.years} ano(s) · renda estimada <b>${fmt(gigIncome())}/ano</b>${d.audience ? ` · ${G.audience.toLocaleString("pt-BR")} ${d.adult ? "assinantes" : "clientes/seguidores"}` : ""} · avaliação ${Math.round(G.rating)}</div>
      ${bar("Habilidade", G.skill, "var(--accent)")}${d.adult ? bar("⚠️ Exposição", G.exposure, "var(--bad)") : ""}</div></div>
      <div class="row"><span class="s">Ritmo:</span>${DATA.gigPace.map(p => `<button class="btn ${G.pace === p.id ? "primary" : ""}" ${S.job && p.id === 2 ? "disabled" : ""} onclick="UI.do(()=>setGigPace(${p.id}))">${p.name}</button>`).join("")}</div>
      <div class="row">${d.audience ? `<button class="btn" onclick="UI.do(promoteGig)">📣 Divulgar</button>` : ""}<button class="btn" onclick="UI.do(practiceGig)">📈 Aperfeiçoar</button><button class="btn danger" onclick="UI.confirm('Parar de trabalhar como ${esc(d.name)}?', ()=>UI.do(()=>stopGig()))">Parar</button></div>
      ${d.adult ? `<div class="oddsline">Exposição alta = chance de vazar para família, parceiro(a) e emprego. ${G.id === "escort" ? `Lei local: <b>${DATA.escortLaw[P().country] || "tolerada"}</b>.` : ""}</div>` : ""}`;
  }
  const cats = [...new Set(DATA.gigs.map(g => g.cat))];
  h += `<details ${G ? "" : "open"}><summary class="t" style="cursor:pointer;margin-top:8px">${G ? "Trocar de atividade" : "Escolher atividade"}</summary>`;
  for (const cat of cats){
    const list = DATA.gigs.filter(g => g.cat === cat && (!g.adult || a >= 18)); if (!list.length) continue;
    h += label(cat) + list.map(g => { const why = gigBlock(g), est = !why ? gigIncome({ id:g.id, years:0, skill:15 + P().stats.intelligence/10, audience: g.audience ? 10 : 0, pace: S.job ? 0 : 1, exposure:0, rating:70 }) : 0;
      return `<div class="row"><div class="grow"><div class="t">${g.emoji} ${g.name}</div><div class="s">${esc(g.desc)}${est ? ` · começa ~${fmt(est, true)}/ano` : ""}</div></div>
        <button class="btn sm ${why ? "" : "primary"}" ${why ? "disabled" : ""} onclick="${g.adult ? `UI.confirm('${esc(g.name)}: conteúdo/atividade adulta, com risco de exposição, estigma${g.danger ? ", ISTs, violência e polícia" : ""}. Continuar?', ()=>UI.do(()=>startGig('${g.id}')))` : `UI.do(()=>startGig('${g.id}'))`}">${why ? esc(why) : "Começar"}</button></div>`; }).join("");
  }
  return h + `</details></div>`;
}
function athleteCard(){
  if (!isAthlete()) return "";
  const J = S.job, c = career();
  return `<div class="card hero"><h2>🏟️ Vida de atleta <span class="tag">${esc(J.club || "—")}</span></h2>
    ${bar("Forma", athleteForm(), "var(--good)")}
    <div class="s">Contrato: ${J.contract ?? "?"} ano(s) restante(s) · salário ×${num(J.contractMult, 1).toFixed(2)} · títulos ${num(J.titles)}${J.injured ? " · <b class='bad'>lesionado(a)</b>" : ""} · aposentadoria típica aos ${retireAge(c)}</div>
    <div class="row"><button class="btn primary" onclick="UI.do(extraTraining)">🏋️ Treino extra</button><span class="s">+desempenho, risco de lesão</span></div></div>`;
}
function collectionCard(){
  if (P().age < 18) return "";
  const C = collection();
  return `<div class="card"><h2>🏺 Coleção <span class="tag">${C.length} peça(s) · ${fmt(collectionTotal(), true)}</span></h2>
    ${C.length ? C.map(c => { const d = byId(DATA.collectibles, c.id), gain = c.value - c.paid;
      return `<div class="row"><div class="grow"><div class="t">${d.emoji} ${d.name}${c.hot ? ' <span class="tag bad">sem procedência</span>' : ""}</div>
        <div class="s">${d.cat} · ${fmtAsset(c.value, c.country)} <span class="${gain >= 0 ? "good" : "bad"}">(${gain >= 0 ? "+" : "−"}${fmt(Math.abs(gain), true)})</span>${c.insured ? " · 🛡️ segurada" : ""}</div></div>
        <div class="art-btns"><button class="btn sm" onclick="UI.do(()=>insureCollectible('${c.uid}'))">${c.insured ? "Cancelar seguro" : "🛡️ Segurar"}</button><button class="btn sm" onclick="UI.do(()=>lendToMuseum('${c.uid}'))">🏛️ Emprestar a museu</button><button class="btn sm" onclick="UI.confirm('Vender ${esc(d.name)}?', ()=>UI.do(()=>sellCollectible('${c.uid}')))">Vender</button></div></div>`; }).join("") : `<div class="empty">Nenhuma peça. Visite a casa de leilões.</div>`}
    <div class="choices" style="margin-top:8px"><button onclick="UI.collectShop()">🔨 Leilões, antiquários e mercado negro</button></div></div>`;
}
function darkPanel(){
  const D = S.dark; if (!D || !D.active) return P().age >= 18 ? `<div class="row"><div class="grow"><div class="t">🌑 Lado sombrio</div><div class="s">Um caminho sem volta: caçar alvos, esconder pistas, viver uma vida dupla.</div></div><button class="btn sm danger" onclick="UI.darkIntro()">Despertar</button></div>` : "";
  const why = huntBlock();
  return `${label(`🌑 Lado sombrio · ${D.code === "code" ? "com código" : "sem código"} · ${D.kills} vítima(s)`)}
    <div class="bars">${bar("Impulso", D.urge, "var(--accent-2)")}${bar("Suspeita policial", D.heat, "var(--bad)")}${bar("Disfarce", darkCover(), "var(--good)")}${bar("Discrição", D.stealth, "var(--info)")}</div>
    <div class="oddsline">Pistas acumuladas: <b>${D.clues}</b>. Com suspeita acima de 85 e pistas, a força-tarefa fecha o cerco.</div>
    <div class="grid2" style="margin-top:8px">
      <button class="action" ${why ? "disabled" : ""} onclick="UI.hunt()"><b>🎯 Caçar</b><span>${why ? esc(why) : "escolher alvo e planejar"}</span></button>
      <button class="action" onclick="UI.do(destroyEvidence)" ${D.clues ? "" : "disabled"}><b>🧹 Sumir com pistas</b><span>energia · pode dar errado</span></button>
      <button class="action" onclick="UI.do(normalLife)"><b>🎭 Vida normal</b><span>−suspeita</span></button>
      <button class="action" onclick="UI.do(repressDark)"><b>🧠 Terapia</b><span>−impulso · ${fmt(priceOf(2500), true)}</span></button></div>`;
}
function armoryRow(d, black){
  const why = weaponBlock(d);
  return `<div class="row"><div class="grow"><div class="t">${d.emoji} ${d.name} ${d.legal === "illegal" ? '<span class="tag bad">ilegal</span>' : d.legal === "license" ? '<span class="tag">exige porte</span>' : ""}</div>
    <div class="s">${fmt(priceOf(d.price))}${black ? "+" : ""} · letalidade ${Math.round(d.lethal*100)} · discrição ${Math.round(d.discretion*100)} · rastreável ${Math.round(d.trace*100)}%</div></div>
    <button class="btn sm" ${why ? "disabled" : ""} onclick="UI.close();UI.do(()=>buyWeapon('${d.id}'))">${why ? esc(why) : "Comprar"}</button></div>`;
}

Object.assign(UI, {
  collectShop(){
    const row = d => `<button class="action" onclick="UI.close();UI.confirm('Comprar ${esc(d.name)}?${d.src === "black" ? " Procedência duvidosa: pode ser falso ou apreendido." : ""}', ()=>UI.do(()=>buyCollectible('${d.id}')))"><b>${d.emoji} ${d.name}</b><span>${d.cat} · ~${fmt(priceOf(d.price), true)} · valoriza ~${Math.round(d.appr*100)}%/ano</span></button>`;
    modal(`<div class="emoji">🔨</div><h3>Leilões e antiquários</h3><p class="muted">Leilão cobra 12% de comissão; antiquário, 5%. O mercado negro sai pela metade — e pode ser falso ou roubado.</p>
      ${Object.entries(DATA.collectSrc).map(([k, l]) => `${label(l)}<div class="grid2">${DATA.collectibles.filter(d => d.src === k).map(row).join("")}</div>`).join("")}
      <div class="choices" style="margin-top:10px"><button onclick="UI.close()">Fechar</button></div>`);
  },
  armory(black){
    const law = DATA.gunLaw[P().country] || { age:25 };
    modal(`<div class="emoji">${black ? "🕳️" : "🔫"}</div><h3>${black ? "Mercado paralelo" : "Loja de armas autorizada"}</h3>
      <p class="muted">${black ? "Sem registro e sem perguntas. Se for pego(a) com isso, a pena aumenta." : `Armas de fogo exigem porte (idade ${law.age}+, ficha limpa, exame psicológico). Seu porte: <b>${S.flags.gunLicense ? "aprovado" : "não tem"}</b>.`}</p>
      ${!black && !S.flags.gunLicense ? `<div class="choices"><button onclick="UI.close();UI.do(applyGunLicense)">🪪 Solicitar porte de arma<small>${fmt(priceOf(law.cost || 2000))} · aprovação ~${Math.round((law.ok || 0.3)*100)}% em ${country().name}</small></button></div>` : ""}
      ${DATA.armory.filter(d => black ? d.legal === "illegal" : d.legal !== "illegal").map(d => armoryRow(d, black)).join("")}
      ${arsenal().length ? `${label("Meu arsenal")}${arsenal().map(w => { const d = byId(DATA.armory, w.id); return `<div class="row"><div class="grow s">${d.emoji} ${d.name}${w.registered ? " · registrada em seu nome" : ""}</div><button class="btn sm" onclick="UI.close();UI.do(()=>discardWeapon('${w.uid}'))">Descartar</button></div>`; }).join("")}` : ""}
      <div class="choices" style="margin-top:10px"><button onclick="UI.close()">Fechar</button></div>`);
  },
  darkIntro(){
    modal(`<div class="emoji">🌑</div><h3>O lado sombrio</h3><p>Você passará a ter <b>impulso</b> (cresce todo ano), <b>suspeita policial</b> e <b>pistas</b>. Uma vida "normal" (emprego, família) é o seu disfarce. Se a força-tarefa juntar provas: pena máxima.</p>
      <div class="choices"><button class="danger" onclick="UI.close();UI.do(()=>awakenDark('code'))">⚖️ Com código: só quem escapou da justiça</button>
      <button class="danger" onclick="UI.close();UI.do(()=>awakenDark('none'))">🩸 Sem código</button><button onclick="UI.close()">Não. Melhor não.</button></div>`);
  },
  hunt(){
    const why = huntBlock(); if (why){ toast(why); return; }
    UI._targets = huntCandidates();
    modal(`<div class="emoji">🎯</div><h3>Escolher o alvo</h3><p class="muted">Código: <b>${dark().code === "code" ? "só culpados" : "nenhum"}</b>. Alvos com motivo pessoal chamam atenção da polícia.</p>
      <div class="choices">${UI._targets.map((t, i) => { const d = byId(DATA.darkTargets, t.tid); return `<button onclick="UI.do(()=>startHunt(UI._targets[${i}]));UI.huntPlan()">${esc(t.first)} ${esc(t.last)}, ${t.age} — ${esc(d.name)}<small>${esc(d.desc)} · risco ${d.risk >= 1.1 ? "alto" : d.risk >= 0.85 ? "médio" : "baixo"}${dark().code === "code" && !d.guilty ? " · <b class='bad'>viola seu código</b>" : ""}</small></button>`; }).join("")}
      <button onclick="UI.close()">Desistir</button></div>`, { locked:true });
  },
  huntPlan(msg = ""){
    const H = S.hunt; if (!H){ closeModal(); return; }
    const opts = [{ id:null, name:"🤜 Mãos nuas (artes marciais)", acc:0.4, discretion:0.6, trace:0.1 }, ...arsenal().map(w => byId(DATA.armory, w.id))];
    modal(`<div class="emoji">🗺️</div><h3>Planejamento: ${esc(H.t.first)} ${esc(H.t.last)}</h3>
      ${msg ? `<div class="result">${esc(msg)}</div>` : ""}
      ${bar("Preparo", H.prep, "var(--accent)")}
      <div class="choices" style="margin-top:8px"><button ${H.studied >= 2 || S.activitiesThisYear >= ACT_LIMIT ? "disabled" : ""} onclick="UI.huntPlan(huntStudy())">👁️ Estudar a rotina do alvo<small>energia · +preparo (máx. 2 vezes)</small></button></div>
      ${label("Abordagem (escolha para executar)")}
      <div class="choices">${opts.map(o => { H.weapon = o.id; const p = huntOdds(H); H.weapon = null; return `<button class="danger" onclick="UI.huntGo(${o.id ? `'${o.id}'` : "null"})">${o.name}<small>sucesso ~${Math.round(p*100)}% · discrição ${Math.round(o.discretion*100)} · rastreável ${Math.round(o.trace*100)}%</small></button>`; }).join("")}
      <button onclick="S.hunt=null;UI.close();toast('Você recuou. Talvez outro dia.')">↩️ Recuar</button></div>`, { locked:true });
  },
  huntGo(w){
    const msg = huntExecute(w);
    if (S.fight){ UI._mgBefore = takeSnapshot(); return UI.fightOpen(); }
    if (!S.hunt || !S.hunt.success){ saveGame(true); render(); modal(`<div class="emoji">💨</div><h3>Deu errado</h3><div class="result">${esc(msg)}</div><div class="choices"><button class="primary" onclick="UI.close()">Continuar</button></div>`); return; }
    modal(`<div class="emoji">🌑</div><h3>Feito</h3><div class="result">${esc(msg)}</div>${label("E agora?")}
      <div class="choices"><button onclick="UI.huntEnd('meticulous')">🧹 Limpar tudo com calma<small>energia · −2 pistas</small></button>
      <button onclick="UI.huntEnd('fast')">🏃 Sair rápido<small>deixa mais rastros</small></button>
      <button onclick="UI.huntEnd('frame')">🧩 Plantar pistas falsas<small>inteligência · pode virar contra você</small></button></div>`, { locked:true });
  },
  huntEnd(mode){ const m = huntCleanup(mode); saveGame(true); render(); modal(`<div class="emoji">🌘</div><div class="result">${esc(m)}</div><div class="choices"><button class="primary" onclick="UI.close()">Voltar à vida normal</button></div>`); },
});
/* Evento "O impulso" pode pedir para abrir a caçada ao continuar. */
{ const _next = UI.next; UI.next = function(){ if (S && S.flags.openHunt){ delete S.flags.openHunt; if (!validHead()) return UI.hunt(); } return _next.apply(this, arguments); }; }
