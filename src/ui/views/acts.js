"use strict";
/* =====================================================================
   ui/views/acts.js — aba Ações: LUGARES da cidade (cada um agrupa ações
   reais), atividades com rendimento decrescente, talentos, crimes por
   categoria (com habilidade exigida) e o submundo.
   ===================================================================== */
const PLACES = [
  { id:"gym",      ic:"🏋️", name:"Academia",            acts:["gym","train","walk"] },
  { id:"dojo",     ic:"🥋", name:"Academia de Lutas",   ui:[["🥋 Modalidades e treinos","UI.close();UI.martial()"],["🏆 Torneios","UI.close();UI.tournaments()"],["📜 Meus golpes","UI.close();UI.moveList()"]], minAge:6 },
  { id:"hospital", ic:"🏥", name:"Hospital / Clínica",  acts:["therapy"], ui:[["🩺 Check-up e tratamentos","UI.close();UI.tab('health')"],["👁️ Oftalmologista","UI.close();UI.beauty('eyes')"]] },
  { id:"salon",    ic:"💇", name:"Salão & Estética",    ui:[["💇 Cabelo e estilo","UI.close();UI.beauty('style')"],["💉 Procedimentos e cirurgias","UI.close();UI.beauty('proc')"],["👕 Guarda-roupa e skincare","UI.close();UI.beauty('care')"]], minAge:8 },
  { id:"pets",     ic:"🐾", name:"Pet Shop & Abrigo",   ui:[["🏠 Abrigo de adoção","UI.close();UI.petShop('shelter')"],["🛍️ Pet shop","UI.close();UI.petShop('shop')"],["🐅 Mercado exótico (clandestino)","UI.close();UI.petShop('exotic')"]], minAge:6 },
  { id:"uni",      ic:"🎓", name:"Universidade",        acts:["course","read"], ui:[["Vestibular","UI.close();UI.uniDialog()"],["Curso técnico","UI.close();UI.techDialog()"]], minAge:16 },
  { id:"library",  ic:"📚", name:"Biblioteca",          acts:["read","meditate"] },
  { id:"bank",     ic:"🏦", name:"Banco / Corretora",   ui:[["Investimentos, crédito e dívidas","UI.close();UI.tab('assets')"]], minAge:18 },
  { id:"notary",   ic:"📜", name:"Cartório",            ui:[["Fazer testamento","UI.close();UI.willDialog()"]], minAge:18 },
  { id:"dealer",   ic:"🚘", name:"Concessionária",      ui:[["Ver garagem e modelos","UI.close();UI.tab('assets')"]], acts:["license"], minAge:18 },
  { id:"realty",   ic:"🏘️", name:"Imobiliária",         ui:[["Comprar/alugar imóveis (qualquer país)","UI.close();UI.tab('assets')"]], minAge:18 },
  { id:"court",    ic:"⚖️", name:"Delegacia / Tribunal",ui:[["Pedir reabilitação criminal (limpar ficha)","UI.close();UI.do(expungeRecord)"]], minAge:18 },
  { id:"night",    ic:"🎰", name:"Cassino / Clube noturno", acts:["casino","party","lottery"], minAge:18 },
  { id:"airport",  ic:"✈️", name:"Aeroporto",           acts:["vacation"], ui:[["Emigrar para outro país","UI.close();UI.tab('assets')"]], minAge:18 },
  { id:"mall",     ic:"🛍️", name:"Shopping",            acts:["shopping","social","hobby"], minAge:10 },
  { id:"ngo",      ic:"🙌", name:"ONG / Comunidade",    acts:["volunteer","networking"] },
];
function viewActs(){
  const a = P().age, energy = ACT_LIMIT - S.activitiesThisYear;
  let h = `<div class="card hero"><h2>🗺️ ${esc(P().city)} <span class="tag">⚡ ${energy}/${ACT_LIMIT} de energia</span></h2>
    <div class="grid2">${PLACES.filter(p => a >= (p.minAge||0)).map(p=>`<button class="action" onclick="UI.place('${p.id}')"><b>${p.ic} ${p.name}</b><span>${[...(p.acts||[]).map(id=>byId(ACTIVITIES,id)?.name).filter(Boolean), ...(p.ui||[]).map(u=>u[0])].slice(0,3).join(" · ")}</span></button>`).join("")}</div></div>`;
  const list = ACTIVITIES.filter(x => a >= x.minAge && (!x.cond || x.cond()));
  h += `<div class="card"><h2>🎯 Todas as atividades</h2><div class="oddsline" style="margin:-4px 0 10px">Repetir a mesma atividade no ano rende cada vez menos. Diversifique.</div>
    <div class="grid2">${list.map(x=>actButton(x, energy)).join("")}</div></div>`;
  h += `<div class="card"><h2>🎨 Talentos</h2>${bar("🎵 Música", P().talents.music, "var(--accent)")}${bar("🎭 Atuação", P().talents.acting, "var(--accent)")}${bar("🏅 Esporte", P().talents.sport, "var(--accent)")}
    <div class="oddsline" style="margin-top:8px">Talentos abrem carreiras artísticas e esportivas. Fama ${Math.round(P().fame)}/100.</div></div>`;
  if (a >= 6) h += `<div class="card"><h2>🥋 Artes marciais <span class="tag">${bestArt() ? `${byId(DATA.martialArts,bestArt()).name}: ${rankName(bestArt())}` : "sem graduação"}</span></h2>${martialPanel()}</div>`;
  if (a >= 10) h += crimeCard(energy);
  return h;
}
function actButton(x, energy){
  const a = P().age, n = num(S.actCount[x.id]), eff = Math.round(dim(x.id)*100);
  return `<button class="action" ${energy<=0?"disabled":""} onclick="UI.do(()=>doActivity('${x.id}'))">${n?`<span class="odds ${eff>=60?"warn":"bad"}">${eff}%</span>`:""}<b>${x.emoji} ${x.name}</b><span>${x.desc}${x.cost&&a>=18?` · ${fmt(priceOf(x.cost))}`:""}</span></button>`;
}
function crimeCard(energy){
  const a = P().age, O = S.org;
  let h = `<div class="card dark"><h2>🦹 Submundo <span class="tag">habilidade ${Math.round(S.crimeSkill)} · técnica ${Math.round(cyberLevel())} · notoriedade ${Math.round(P().notoriety)} · ${S.record.length ? `${S.record.length} antecedente(s)` : "ficha limpa"}</span></h2>`;
  if (a >= 18){
    h += O ? `<div class="row click" onclick="UI.org()"><div class="grow"><div class="t">🕶️ ${esc(O.name)} · ${DATA.orgRanks[O.rank].name}</div><div class="s">respeito ${Math.round(O.respect)} · calor ${Math.round(O.heat)}${isBoss()?` · ${O.members.length} capangas · ${O.ops.length} operações`:""} · sujo ${fmt(S.dirty)}</div></div><button class="btn sm">Gerenciar</button></div>`
      : `<div class="row"><div class="grow"><div class="t">Organização criminosa</div><div class="s">Funde a sua (habilidade 30 ou notoriedade 35, ${fmt(priceOf(20000))}) ou aguarde um convite.</div></div><button class="btn sm" onclick="UI.do(()=>foundOrg())">👑 Fundar</button></div>`;
  }
  h += `<div class="oddsline" style="margin:6px 0 10px">Crimes graves rendem dinheiro SUJO (precisa lavar). Antecedentes fecham concursos e derrubam reputação.</div>`;
  const cats = [...new Set(DATA.crimes.map(c=>c.cat))];
  for (const cat of cats){
    const cs = DATA.crimes.filter(c=>c.cat===cat && a >= c.minAge); if (!cs.length) continue;
    h += `${label(cat)}<div class="grid2">${cs.map(c=>{ const o = oddsCrime(c), lock = c.cyber && cyberLevel() < num(c.skill) ? `técnica ${c.skill}` : !c.cyber && S.crimeSkill < num(c.skill) ? `habilidade ${c.skill}` : c.needsOrg && !S.org ? "precisa de organização" : c.minInt && P().stats.intelligence < c.minInt ? `inteligência ${c.minInt}` : "";
      return `<button class="action" ${energy<=0||lock?"disabled":""} onclick="UI.confirm('Tentar: ${c.name}? Chance real: ${Math.round(o.p*100)}%. Pena até ${c.years[1]} anos.', ()=>UI.do(()=>commitCrime('${c.id}')))"><span class="odds ${oddsColor(o.p)}">${Math.round(o.p*100)}%</span><b>${c.name}</b><span>${lock ? `🔒 ${lock}` : `${c.cyber ? `prep. ${fmt(priceOf(c.prep), true)} · rastro ${Math.round(c.trace*100)}% · ` : c.dirty ? "💸 sujo · " : ""}pena até ${c.years[1]}a`}</span></button>`; }).join("")}</div>`;
  }
  return h + `</div>`;
}
