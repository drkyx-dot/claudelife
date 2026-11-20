"use strict";
/* =====================================================================
   ui/views/death.js — certidão + legado completo: título da vida,
   estatísticas acumuladas, linha do tempo ilustrada por capítulos,
   conquistas, relações marcantes, herdeiros e linhagem.
   ===================================================================== */
function viewDeath(){
  const p = P(), sc = S.final?.score || lifeScore(), kids = S.rels.filter(r=>r.role==="child"&&r.alive), st = S.stats;
  const title = S.final?.title || lifeTitle();
  const sp = S.rels.filter(r=>["spouse","late_spouse"].includes(r.role));
  const best = S.rels.filter(r=>r.role!=="child" && r.rel >= 60).sort((a,b)=>b.rel-a.rel).slice(0,4);
  const worst = S.rels.filter(r=>r.alive && r.rel < 25 && ["mother","father","sibling","child","ex","spouse"].includes(r.role)).slice(0,2);
  let h = `<div class="card cert"><div style="font-size:42px">🕊️</div><h3>Certidão de Óbito</h3>
    <div class="t" style="font-size:22px;font-weight:850">${esc(p.first)} ${esc(p.last)}</div>
    <div class="muted">${p.birthYear} – ${p.birthYear+p.age} · ${esc(p.city)}, ${esc(country().name)}</div>
    <div class="lifetitle">🏅 ${esc(title)}</div>
    <div class="score">${sc.total}</div><div class="muted">Pontuação de vida · <b>${gradeOf(sc.total)}</b></div>
    <dl class="kv"><dt>Idade</dt><dd>${p.age} anos</dd><dt>Causa da morte</dt><dd>${esc(p.cause)}</dd>
      <dt>Patrimônio final</dt><dd>${fmt(S.final?.netWorth ?? netWorth())}</dd><dt>Maior patrimônio</dt><dd>${fmt(st.maxNetWorth)}</dd>
      <dt>Educação</dt><dd>${DATA.eduLevels[S.edu.level]}</dd><dt>Último cargo</dt><dd>${esc(S.jobHistory.length ? S.jobHistory[S.jobHistory.length-1].title : "—")}</dd>
      <dt>Cônjuge(s)</dt><dd>${sp.length ? sp.map(s=>esc(s.first)).join(", ") : "—"}</dd><dt>Filhos</dt><dd>${children(false).length}${S.flags.grandkids?` · ${S.flags.grandkids} neto(s)`:""}</dd></dl></div>`;
  h += `<div class="card"><h2>📊 Estatísticas da vida</h2><div class="statgrid">
    ${[["💵 Total ganho", fmt(st.earned, true)],["💸 Total gasto", fmt(st.spent, true)],["💼 Empregos exercidos", S.jobHistory.length],["📨 Candidaturas", st.jobs],
       ["🏠 Imóveis comprados", st.propsBought],["🚗 Veículos comprados", st.carsBought],["🌎 Países onde morou", st.countries.length],["🦹 Crimes tentados", `${st.crimes} (${st.crimesOk} ok)`],
       ["⛓️ Prisões", st.arrests],["🥊 Brigas / lutas", `${num(st.fights)} (${num(st.fightsWon)} vitórias)`],["🏆 Cartel oficial", `${S.martial?.rec.w||0}V–${S.martial?.rec.l||0}D · ${S.martial?.titles.length||0} título(s)`],
       ["☠️ Mortes causadas", num(st.kills)],["🏃 Fugas da prisão", num(st.escapes)],["🏺 Peças na coleção", (S.collection||[]).length],["🧰 Último autônomo", S.gig ? gigDef(S.gig.id).name : "—"],["🥋 Maior graduação", bestArt() ? `${rankName(bestArt())} (${byId(DATA.martialArts,bestArt()).name})` : "—"],["🧺 Dinheiro lavado", fmt(st.laundered, true)],["⭐ Fama final", Math.round(p.fame)],["🏆 Conquistas", S.achievements.length]]
       .map(([k,v])=>`<div class="kpi"><div class="k">${k}</div><div class="v">${v}</div></div>`).join("")}</div></div>`;
  const ch = lifeChapters();
  if (ch.length) h += `<div class="card"><h2>📖 Linha do tempo ilustrada</h2><div class="chapters">${ch.map(c=>`<div class="chapter" data-ic="${c.ic}"><h4>${c.name} <span class="muted s">${c.range} anos</span></h4>${c.items.map(e=>`<div class="ev">${e.age}a · ${esc(e.text)}</div>`).join("")}</div>`).join("")}</div></div>`;
  h += `<div class="card"><h2>🧮 Composição da pontuação</h2>${Object.entries(sc.parts).map(([k,v])=>`<div class="row"><div class="grow s">${k}</div><b class="${v<0?"bad":""}">${v.toFixed(1)}</b></div>`).join("")}</div>`;
  if (S.achievements.length) h += `<div class="card"><h2>🏆 Conquistas</h2><div class="chips">${S.achievements.map(a=>chip(`${esc(a.text)} · ${a.age}a`)).join("")}</div></div>`;
  if (best.length || worst.length) h += `<div class="card"><h2>💞 Relações marcantes</h2>${best.map(r=>`<div class="row"><div class="grow"><div class="t">${esc(r.first)} ${esc(r.last)}</div><div class="s">${relLabel(r)}${r.history?.length?` · ${esc(r.history[r.history.length-1].text)}`:""}</div></div>${mini(r.rel)}</div>`).join("")}
    ${worst.map(r=>`<div class="row"><div class="grow"><div class="t bad">${esc(r.first)} ${esc(r.last)}</div><div class="s">${relLabel(r)} · relação estremecida</div></div>${mini(r.rel)}</div>`).join("")}</div>`;
  h += `<div class="card"><h2>👪 Continuar o legado</h2>${kids.length ? kids.map(k=>`<div class="row"><div class="grow"><div class="t">${esc(k.first)} ${esc(k.last)}</div><div class="s">${relLabel(k)} · ${k.age} anos · herda ~${fmt(heirShare(Math.max(0,netWorth()), k, kids))}${S.flags.will?.uid===k.uid?" · ⭐ favorecido(a) no testamento":""}</div></div><button class="btn primary" onclick="UI.heir('${k.uid}')">Jogar como</button></div>`).join("") : `<div class="empty">Sem herdeiros vivos.</div>`}
    <div class="row"><button class="btn" onclick="UI.newLifeDialog()">Nova vida</button><button class="btn" onclick="exportSave()">Exportar vida (JSON)</button></div></div>`;
  if (S.lineage?.length) h += `<div class="card"><h2>🌳 Árvore da linhagem</h2>${S.lineage.map(l=>`<div class="row"><div class="grow"><div class="t">${esc(l.name)}</div><div class="s">${l.born}–${l.died} · ${esc(l.cause)} · ${l.netWorth}</div></div><b>${l.score}</b></div>`).join("")}</div>`;
  h += `<div class="card log"><details><summary class="t" style="cursor:pointer">🕰️ Linha do tempo completa (${S.log.length} registros)</summary><div style="margin-top:10px">${(LOGALL=true, renderLog())}</div></details></div>`;
  return h;
}
