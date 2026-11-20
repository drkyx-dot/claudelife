"use strict";
/* systems/legacy.js */

function die(cause){
  if (!P().alive) return;
  P().alive = false; P().cause = cause; S.queue = []; emit("death");
  log(`☠️ Faleci aos ${P().age} anos. Causa: ${cause}.`, "milestone");
  S.final = { score: lifeScore(), netWorth: netWorth(), year: year(), title: lifeTitle() };
  recordHall(); // histórico entre vidas (hub)
}

function lifeScore(){
  const a = P().age, h = S.hist || { happy:P().stats.happiness, n:1 };
  const avgHappy = h.n ? h.happy/h.n : P().stats.happiness;
  const nwBase = Math.max(1, netWorth() / (country().fx*country().wage*S.priceIndex));
  const topRatio = Math.max(0, ...S.jobHistory.map(j=>{ const c = DATA.careers.find(c=>c.name===j.career); const i = c ? c.levels.findIndex(l=>l.t===j.title) : 0; return c ? (i+1)/c.levels.length : 0; }), S.job ? (S.job.level+1)/career().levels.length : 0);
  const parts = {
    "Longevidade":      Math.min(a,100)/100*20,
    "Felicidade média": avgHappy/100*20,
    "Patrimônio":       clamp((Math.log10(nwBase)-3)/4*20, 0, 20),
    "Educação":         S.edu.level/6*10,
    "Carreira e fama":  topRatio*10 + P().fame/100*5,
    "Família":          Math.min(10, (S.flags.married?4:0) + Math.min(3,children(false).length)*2),
    "Caráter":          (P().karma-50)/50*5 - Math.min(15, S.record.length*3),
  };
  const total = clamp(Object.values(parts).reduce((a,b)=>a+b,0));
  return { total: Math.round(total), parts };
}

function gradeOf(t){ return t>=85?"Lendária":t>=70?"Excelente":t>=55?"Boa":t>=40?"Comum":t>=25?"Difícil":"Trágica"; }

function summarizeLife(s){
  const keep = S; S = s;
  const out = { name:`${P().first} ${P().last}`, born:P().birthYear, died:P().birthYear+P().age, age:P().age, cause:P().cause, netWorth:fmt(netWorth(),true), score:(s.final||{score:{total:0}}).score.total, country:country().name };
  S = keep; return out;
}

/* Continuar como herdeiro: assume um filho vivo na idade atual dele. */
function continueAsHeir(childUid){
  const old = S, kid = old.rels.find(r=>r.uid===childUid); if (!kid) return;
  const kids = old.rels.filter(r=>r.role==="child"&&r.alive);
  const estate = Math.max(0, netWorth());
  const share = heirShare(estate, kid, kids); // testamento + 15% de imposto de herança
  const oldC = old.player.country;
  S = old; // para summarizeLife usar contexto
  newLife({ heir:true, country:oldC, gender:kid.gender, first:kid.first, heirLast:kid.last, birthYear: old.player.birthYear + old.player.age - kid.age, cls: heirClass(estate) });
  S.priceIndex = old.priceIndex; S.wageIndex = old.wageIndex; S.world = old.world; // mesma economia, outra geração
  const me = P(); me.age = kid.age; me.stats.looks = clamp(kid.looks ?? me.stats.looks);
  // reconstrói família: pai/mãe falecido = personagem anterior
  S.rels = S.rels.filter(r=>r.role!=="sibling");
  const dp = S.rels.find(r=>r.role==="mother"||r.role==="father");
  if (dp){ dp.first = old.player.first; dp.last = old.player.last; dp.gender = old.player.gender; dp.role = old.player.gender==="F"?"mother":"father"; dp.alive = false; dp.age = old.player.age; dp.rel = kid.rel; dp.inheritPaid = true; }
  const other = S.rels.find(r=>r!==dp && (r.role==="mother"||r.role==="father"));
  const spouse = old.rels.find(r=>r.role==="spouse"&&r.alive);
  if (other){ if (spouse){ other.first = spouse.first; other.last = spouse.last; other.gender = spouse.gender; other.age = spouse.age; other.role = spouse.gender==="F"?"mother":"father"; } else other.alive = false; }
  for (const k of kids) if (k !== kid) S.rels.push({ ...k, uid:uid(), role:"sibling" });
  for (const r of S.rels) r.age = r.alive ? Math.max(0, r.age) : r.age;
  // educação compatível com a idade
  const E = S.edu, a = me.age;
  if (a >= 6 && a < 15){ E.school = "fund"; E.yearsLeft = 15-a; }
  else if (a >= 15 && a < 18){ E.level = 1; E.school = "medio"; E.yearsLeft = 18-a; }
  else if (a >= 18){ E.level = 2; }
  me.stats.intelligence = clamp(me.stats.intelligence + Math.min(a,18)*1.2);
  if (a >= 18){ addMoney(share); } else S.trustFund = share;
  S.log = [];
  log(`Continuo a história da família como ${me.first} ${me.last}, ${a} anos, após a morte de ${old.player.first}.`, "milestone");
  log(`Herança recebida: ${fmt(share)}${a<18?" (liberada aos 18)":""}.`, "good");
  S.lineage = [...(old.lineage||[]), summarizeLife(old)];
}

/* Classe do herdeiro pelo tamanho do espólio (9 níveis). */
function heirClass(estate){
  const th = [2e8, 8e6, 1e6, 4e5, 1.5e5, 5e4, 1e4], i = th.findIndex(t => estate >= wageOf(t));
  return i < 0 ? 1 : 8 - i;
}
/* Título final da vida: a característica mais marcante. */
function lifeTitle(){
  const p = P(), S2 = S.stats, nwB = toBase(netWorth()), f = p.gender === "F";
  const opts = [];
  if (S.org && isBoss()) opts.push([95, f ? "Chefona do Crime" : "Chefão do Crime"]);
  if (S2.arrests >= 3) opts.push([80, "Velho(a) Conhecido(a) da Polícia"]);
  const M = S.martial || { rec:{ w:0 }, titles:[], kills:0 };
  if (M.titles.some(t => t.tid === "cinturao")) opts.push([97, f ? "Campeã Mundial de Lutas" : "Campeão Mundial de Lutas"]);
  else if (M.rec.w >= 10) opts.push([78, "Lenda do Ringue"]);
  if (num(M.kills) >= 3) opts.push([92, f ? "A Temida" : "O Temido"]);
  else if (num(M.kills) >= 1 && p.karma < 30) opts.push([72, "Mãos Sujas de Sangue"]);
  const D = S.dark || {};
  if (num(D.kills) >= 3) opts.push([99, D.caught ? "Serial Killer Capturado(a)" : D.code === "code" ? "O Justiceiro das Sombras" : "Assassino(a) em Série Nunca Descoberto(a)"]);
  if (S.flags.exAthlete && num(S.jobHistory.length) && S.achievements.some(a => a.id === "sporttitle")) opts.push([84, "Lenda do Esporte"]);
  if ((S.collection || []).length >= 6) opts.push([66, "Grande Colecionador(a)"]);
  if (num(S2.escapes) >= 1) opts.push([83, num(S2.escapes) >= 2 ? "Mestre(a) da Fuga" : "Fugitivo(a) Lendário(a)"]);
  if (Object.values(M.arts || {}).some(a => a.m >= 90)) opts.push([74, "Grão-Mestre(a) das Artes Marciais"]);
  if (nwB > 2e7) opts.push([90, f ? "Magnata" : "Magnata"]);
  else if (nwB > 2e6) opts.push([70, "Milionário(a) Self-made"]);
  if (p.fame >= 75) opts.push([85, "Lenda Popular"]);
  if (S.job && career().elected && S.job.level >= 4 || S.jobHistory.some(j=>/Presidente|Governador|Senador/.test(j.title))) opts.push([88, "Figura Histórica da Política"]);
  if (children(false).length >= 4 || num(S.flags.grandkids) >= 4) opts.push([65, f ? "Grande Matriarca" : "Grande Patriarca"]);
  if (p.age >= 95) opts.push([75, "Sobrevivente Centenário(a)"]);
  if (p.age < 30) opts.push([60, "Vida Breve"]);
  if (S.edu.level >= 6) opts.push([60, "Mente Brilhante"]);
  if (p.karma >= 80 && !S.record.length) opts.push([62, "Cidadão(ã) Exemplar"]);
  if (S2.countries.length >= 3) opts.push([55, "Cidadão(ã) do Mundo"]);
  if (S.flags.bankrupt) opts.push([50, "Falido(a) Resiliente"]);
  if (!opts.length) opts.push([10, (S.hist?.happy/Math.max(1,S.hist?.n||1)) > 60 ? "Alma Feliz" : "Vida Comum"]);
  return opts.sort((a,b)=>b[0]-a[0])[0][1];
}
/* Capítulos da vida para a linha do tempo ilustrada do legado. */
function lifeChapters(){
  const stages = [["👶","Infância",0,12],["🧑","Adolescência",13,17],["🎓","Juventude",18,29],["💼","Vida Adulta",30,59],["👴","Terceira Idade",60,200]];
  return stages.map(([ic,name,a,b]) => ({ ic, name, range:`${a}–${Math.min(b, P().age)}`,
    items: S.log.filter(e => e.age >= a && e.age <= b && (e.kind === "milestone" || /🏆|⛓️|💍|👶|🎓|🔨|🗳️|👑|☠️|🏃|🥋|🥇|🏅/.test(e.text))).slice(0, 9) }))
    .filter(ch => ch.items.length && P().age >= parseInt(ch.range));
}

/* Testamento (cartório): define a partilha usada em continueAsHeir. */
function makeWill(mode, uid){
  if (P().age < 18) return R(false, "Menores não fazem testamento.");
  const cost = priceOf(400); if (!canAfford(cost)) return R(false, `O cartório cobra ${fmt(cost)}.`);
  addMoney(-cost); S.flags.will = { mode, uid: uid || null };
  const k = uid ? relBy(uid) : null;
  log(`📜 Registrei testamento: ${mode === "favor" ? `60% para ${k?.first}` : mode === "charity" ? "metade para caridade" : "partilha igual entre os filhos"}.`, "");
  return R(true, "Testamento registrado.");
}
function heirShare(estate, kid, kids){
  const W = S.flags.will, net = estate * 0.85; // 15% imposto de herança
  if (!W || W.mode === "equal" || !kids.length) return Math.round(net / Math.max(1, kids.length));
  if (W.mode === "charity") return Math.round(net * 0.5 / kids.length);
  if (W.mode === "favor") return kid.uid === W.uid ? Math.round(net * (kids.length > 1 ? 0.6 : 1)) : Math.round(net * 0.4 / Math.max(1, kids.length - 1));
  return Math.round(net / kids.length);
}
