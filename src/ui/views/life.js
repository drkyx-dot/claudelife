"use strict";
/* ui/views/life.js — aba Vida: situação atual, resumo do ano,
   consequências (passado → presente), fluxo de caixa e linha do tempo
   com busca e filtros por categoria. */
const LOG_FILTERS = [["all","Tudo"],["milestone","Marcos"],["good","Positivos"],["bad","Negativos"],["work","Trabalho"],["money","Dinheiro"],["love","Amor"],["health","Saúde"],["school","Estudos"],["crime","Crime"]];

function occupation(){ return gtx(occupationRaw()); }
function occupationRaw(){
  const p = P();
  if (inPrison()) return `⛓️ Preso(a) — ${S.prison.life ? "prisão perpétua" : S.prison.years + " ano(s) restantes"} (${esc(S.prison.crime)})`;
  if (S.wanted) return `🚨 Foragido(a) da Justiça${S.wanted.fakeId ? " · identidade falsa" : ""}`;
  if (S.job) return `💼 ${career().levels[S.job.level].t}`;
  if (S.edu.school){ const m = byId(DATA.majors,S.edu.major) || byId(DATA.techCourses,S.edu.major); return `🎒 ${schoolName()}${m && !["fund","medio","supl"].includes(S.edu.school) ? " — " + esc(m.name) : ""}`; }
  if (S.retired) return "🏖️ Aposentado(a)";
  if (S.partTime) return `🧃 ${byId(DATA.partTime,S.partTime).name}`;
  if (S.gig) return `${gigDef(S.gig.id).emoji} ${gigDef(S.gig.id).name} (autônomo)`;
  return p.age < 6 ? "🧸 Curtindo a infância" : "🔎 Sem ocupação";
}
function viewLife(){
  const p = P(), home = homeInfo(), pt = partner();
  const alerts = [];
  if (p.stress >= 75) alerts.push(`😣 Estresse crítico (${Math.round(p.stress)}): saúde, relações e trabalho estão sofrendo. Veja as causas na aba Saúde.`);
  if (S.illnesses.some(i=>i.diagnosed && !i.treated && byId(DATA.illnesses,i.id).sev >= 8)) alerts.push("🏥 Há uma doença grave diagnosticada sem tratamento.");
  if (S.loans.some(l=>l.name==="Cheque especial")) alerts.push("🏦 Você está no cheque especial (38% a.a.): isso derruba seu crédito.");
  for (const l of S.loans.filter(l=>l.missed)) alerts.push(`⚠️ "${esc(l.name)}" está ${l.missed} ano(s) em atraso — ${l.propertyUid ? "o imóvel vai a leilão no 2º ano" : l.vehicleUid ? "o veículo será apreendido no 2º ano" : "penhora judicial no 3º ano"}.`);
  if (phaseName() === "recessão" || phaseName() === "crise") alerts.push(`${phase().emoji} Economia em ${phaseName()}: demissões ×${phase().layoff} e crédito mais difícil.`);
  if (S.org && S.org.heat >= 60) alerts.push(`🚨 Calor policial alto em ${esc(S.org.name)} (${Math.round(S.org.heat)}): batida iminente.`);
  for (const a of DATA.addictions) if (S.addictions[a.id] >= 60) alerts.push(`${a.emoji} ${a.name} em nível grave (${Math.round(S.addictions[a.id])}).`);

  let h = `<div class="card hero"><h2>${occupation()} <span class="tag">${year()}</span></h2>
    <div class="s muted">🏠 ${esc(home.name)} · ${pt ? `${relLabel(pt)}: ${esc(pt.first)}` : "Solteiro(a)"} · ${DATA.eduLevels[S.edu.level]} · ${DATA.classes[p.cls].name}</div>
    <div class="chips" style="margin-top:10px">${p.traits.map(t=>{ const d = byId(DATA.traits,t); return `<span class="chip" title="${esc(d.desc)}">${d.name}</span>`; }).join("")}
    ${S.illnesses.filter(i=>i.diagnosed).map(i=>chip(`🤒 ${byId(DATA.illnesses,i.id).name}${i.treated?" · em tratamento":""}`, i.treated ? "warn" : "bad")).join("")}
    ${(S.pets||[]).map(x => chip(`${byId(DATA.petSpecies, x.sp)?.emoji || "🐾"} ${esc(x.name)}`, "neutral")).join("")}
    ${chip(`🏳️‍🌈 ${orientationName()}`, "neutral")}${look().glasses ? chip("👓 óculos", "neutral") : ""}</div></div>`;
  // balões: pensamento do personagem + comentário de alguém próximo (mudam a cada ano)
  const nc = npcComment();
  h += `<div class="bubbles">${bubble(currentThought(), "Você pensa…", "right", avatar())}${nc ? bubble(nc.text, nc.who, "left", "💬") : ""}</div>`;
  if (inPrison()){
    const sec = byId(DATA.prisonSecurity, S.prison.security) || DATA.prisonSecurity[1], why = escapeBlock();
    h += `<div class="card dark"><h2>⛓️ Presídio <span class="tag">${sec.emoji} ${esc(sec.name)}</span></h2>
      <div class="s">Pena ${S.prison.life ? "perpétua" : `${S.prison.years} ano(s) restantes`} · cumpridos ${S.prison.served} · fugas frustradas ${num(S.prison.escAttempts)} · dificuldade da fuga ${escapeDifficulty()}/8</div>
      <div class="choices" style="margin-top:10px"><button ${why ? "disabled" : ""} onclick="UI.do(()=>startEscape())">🏃 Tentar fugir (minigame)<small>${esc(why || "puzzle tático: guardas, câmeras e limite de turnos")}</small></button>
      <button ${S.activitiesThisYear >= ACT_LIMIT ? "disabled" : ""} onclick="UI.do(()=>{ if (!spendEnergy()) return R(false,'Sem energia.'); startFight('prison',{ provoked:true }); return R(true,'Encarei o mais folgado do pavilhão.'); })">🥊 Arrumar briga no pátio<small>respeito ou solitária · corta a remição do ano pela metade</small></button></div></div>`;
    const off = S.activitiesThisYear >= ACT_LIMIT ? "disabled" : "", cat = prisonCat(), lawDone = S.prison.courses?.law?.done;
    h += `<div class="card"><h2>🏛️ Penitenciária <span class="tag">⚡ ${ACT_LIMIT - S.activitiesThisYear}/${ACT_LIMIT}</span></h2>
      <div class="s">Crime: <b>${DATA.crimeCats[cat].name}</b> · remição acumulada ${Math.round(num(S.prison.remit)*365)} dias · intimidação ${Math.round(num(S.prison.intim))} · anos remidos na vida ${num(S.stats.remitted)}</div>
      ${S.prison.foughtAge === P().age ? `<div class="oddsline bad">Você brigou este ano: a remição está pela metade.</div>` : ""}
      <div class="grid2" style="margin-top:10px">
        <button class="action" ${off} onclick="UI.do(()=>prisonAct('yard'))"><b>🏋️ Pátio</b><span>força e intimidação: menos gente mexe com você</span></button>
        <button class="action" ${off} onclick="UI.do(()=>prisonAct('work'))"><b>🧺 Trabalhar</b><span>pecúlio + remição${cat === "property" ? " (×1,4 no seu caso)" : ""}</span></button>
        <button class="action" onclick="UI.prisonCourses()"><b>📚 Biblioteca e cursos</b><span>remição conforme o seu crime</span></button>
        <button class="action" ${off} onclick="UI.do(()=>prisonAct('visit'))"><b>🫂 Dia de visita</b><span>família, felicidade</span></button>
        <button class="action" ${off || !lawDone || S.prison.appealed ? "disabled" : ""} onclick="UI.do(appealSentence)"><b>⚖️ Recorrer da sentença</b><span>${lawDone ? (S.prison.appealed ? "recurso já julgado" : `chance ~${Math.round(DATA.appealOdds[cat]*100)}% (base)`) : "exige Direito Penal Básico"}</span></button>
      </div></div>`;
  }
  if (S.wanted) h += `<div class="card alert"><h2>🚨 Foragido(a)</h2><div class="s">Há ${S.wanted.years} ano(s) · pena pendente ${S.wanted.remaining} ano(s) · chance de recaptura/ano <b>${Math.round(recaptureChance()*100)}%</b>${S.wanted.fakeId ? " · usando identidade falsa" : ""}</div>
      <div class="choices" style="margin-top:10px">${S.wanted.fakeId ? "" : `<button onclick="UI.do(buyFakeId)">🪪 Comprar identidade falsa (${fmt(priceOf(9000))})</button>`}</div></div>`;
  if (alerts.length) h += `<div class="card alert"><h2>⚠️ Atenção</h2>${alerts.map(a=>`<div class="row"><div class="grow">${a}</div></div>`).join("")}</div>`;

  const deltas = yearDeltas();
  if (S.lastYear && S.lastYear.age === p.age && deltas.length){
    h += `<div class="card"><h2>📅 Seu ano aos ${p.age} <span class="tag ${S.lastYear.net>=0?"good":"bad"}">caixa ${fmt(S.lastYear.net, true)}</span></h2>
      <div class="chips">${deltas.map(d=>chip(`${d.label} ${signed(d.d, d.money)}`, d.good ? "good" : "bad")).join("")}</div></div>`;
  }
  const recent = S.consequences.slice(-5).reverse(), pend = pendingConsequences();
  if (recent.length || pend){
    h += `<div class="card"><h2>🔗 Consequências <span class="tag">${pend ? `${pend} efeito(s) ainda por vir` : ""}</span></h2>
      ${recent.map(c=>`<div class="row"><div class="grow"><div class="s">aos ${c.age} anos</div><div class="${c.kind==="bad"?"bad":c.kind==="good"?"good":""}">${esc(c.text)}</div></div></div>`).join("") || `<div class="empty">Suas escolhas ainda vão repercutir.</div>`}</div>`;
  }
  const Y = S.yearSummary;
  if (Y && Y.lines.length){
    h += `<div class="card"><h2>💵 Fluxo de caixa do último ano <span class="tag ${Y.income-Y.expenses>=0?"good":"bad"}">${fmt(Y.income-Y.expenses)}</span></h2>
      ${Y.lines.filter(([,v])=>v).map(([l,v])=>`<div class="row"><div class="grow s">${esc(l)}</div><div class="${v>=0?"good":"bad"}">${v?fmt(v):"—"}</div></div>`).join("")}</div>`;
  }
  h += `<div class="card log"><h2>🕰️ Linha do tempo <span class="tag">${S.log.length} registros</span></h2>
    <div class="logtools"><input type="search" placeholder="Buscar na vida… (ex.: promovido, Lucas, câncer)" value="${esc(LOGQUERY)}" oninput="UI.logSearch(this.value)" aria-label="Buscar na linha do tempo"></div>
    <div class="filters" style="margin-bottom:10px">${LOG_FILTERS.map(([k,l])=>`<button class="${LOGFILTER===k?"on":""}" onclick="UI.logFilter('${k}')">${l}</button>`).join("")}</div>
    <div id="logbody">${renderLog()}</div></div>`;
  return h;
}
function logMatches(e){
  if (LOGFILTER !== "all"){
    if (["milestone","good","bad"].includes(LOGFILTER)){ if (e.kind !== LOGFILTER) return false; }
    else if (!(e.tags || autoTag(e.text)).includes(LOGFILTER)) return false;
  }
  return !LOGQUERY || e.text.toLowerCase().includes(LOGQUERY.toLowerCase());
}
function highlight(text){
  const t = esc(text); if (!LOGQUERY) return t;
  const q = esc(LOGQUERY).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return t.replace(new RegExp(q, "gi"), m => `<mark>${m}</mark>`);
}
function renderLog(){
  const items = S.log.filter(logMatches);
  const byAge = new Map();
  for (const e of items){ if (!byAge.has(e.age)) byAge.set(e.age, []); byAge.get(e.age).push(e); }
  const ages = [...byAge.keys()].sort((a,b)=>b-a);
  const shown = LOGALL || LOGQUERY ? ages : ages.slice(0, 25);
  if (!shown.length) return `<div class="empty">${LOGQUERY ? "Nenhum registro encontrado." : "Nada por aqui ainda."}</div>`;
  const cur = P().age;
  return shown.map(a => `<div class="yr">${a} anos · ${P().birthYear + a}</div>` + byAge.get(a).map((e,i)=>`<div class="ev ${e.kind}${a===cur?" new":""}"${a===cur?` style="animation-delay:${i*45}ms"`:""}>${highlight(e.text)}</div>`).join("")).join("")
    + (ages.length > shown.length ? `<button class="btn" style="margin-top:12px" onclick="UI.logAll()">Mostrar todos os ${ages.length} anos</button>` : "");
}
