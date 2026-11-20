"use strict";
/* =====================================================================
   state/state.js — estado global S (fonte única da verdade) e helpers.
   Toda mutação de atributo passa por um helper que clampa/sanitiza.
   ===================================================================== */
const SAVE_KEY = "claudilife.save.v6"; // legado: v7 usa slots (state/persistence.js)
const LEGACY_SAVE_KEYS = ["claudilife.save.v6","claudilife.save.v5","claudilife.save.v4","claudilife.save.v3"];
const SAVE_VERSION = 7;
const PROPERTY_ID_MIGRATION = { townhouse:"sobrado" }; // ids removidos em versões antigas

let S = null; // estado global da vida atual

/* ---------- Defaults: garante todos os campos (vida nova, migração, herdeiro) ---------- */
function ensureState(st = S){
  const p = st.player;
  p.stress     = clamp(num(p.stress, 15));
  p.reputation = clamp(num(p.reputation, 50));
  p.vitality   = clamp(num(p.vitality, 100));
  p.karma      = clamp(num(p.karma, 50));
  st.health = Object.assign({ plan:"none", lastCheckup:-99, sequelae:0, sedentary:0, exercised:false, employerPlan:false }, st.health || {});
  st.addictions = Object.assign({ smoke:0, alcohol:0, gambling:0 }, st.addictions || {});
  if (st.flags && st.flags.smoker && !st.addictions.smoke) st.addictions.smoke = 35; // saves v3
  st.credit = Math.max(300, Math.min(850, Math.round(num(st.credit, 620))));
  st.scheduled = st.scheduled || [];
  st.consequences = st.consequences || [];
  st.actCount = st.actCount || {};
  st.queue = st.queue || []; st.cooldown = st.cooldown || {}; st.flags = st.flags || {};
  st.businesses = st.businesses || []; st.loans = st.loans || []; st.investments = st.investments || {};
  st.illnesses = (st.illnesses || []).map(i => ({ stage:1, diagnosed: !!i.treated, treated:false, tier:null, years:0, ...i }));
  // v5: economia global, submundo, estatísticas de vida, ativos multi-país
  st.world = Object.assign({ phase:"estável", years:0, inflation:0.035, history:[] }, st.world || {});
  st.priceIndex = num(st.priceIndex, 1); st.wageIndex = num(st.wageIndex, st.priceIndex);
  st.dirty = Math.max(0, num(st.dirty)); st.crimeSkill = clamp(num(st.crimeSkill)); st.org = st.org || null;
  st.stats = Object.assign({ earned:0, spent:0, crimes:0, crimesOk:0, arrests:0, jobs:0, propsBought:0, carsBought:0, maxNetWorth:0, countries:[p.country], dirtyEarned:0, laundered:0, fights:0, fightsWon:0, kills:0, escapes:0 }, st.stats || {});
  // v6: artes marciais, combate, fuga e foragido
  st.martial = Object.assign({ arts:{}, enrolled:[], rec:{ w:0, l:0, d:0, ko:0 }, kills:0, banUntil:0, titles:[] }, st.martial || {});
  st.martial.rec = Object.assign({ w:0, l:0, d:0, ko:0 }, st.martial.rec);
  st.martial.enrolled = st.martial.enrolled.filter(id => byId(DATA.martialArts, id));
  st.wanted = st.wanted || null; st.fight = st.fight || null; st.escape = st.escape || null;
  // v7: classe em 9 níveis, identidade, aparência, pets, cibercrime, prisão profunda
  if (p.clsScale !== 9){ p.cls = [0,2,4,6,7][p.cls] ?? 4; p.clsScale = 9; }
  if (!st.identity) st.identity = p.orientation && p.orientation !== "descobrindo"
    ? { other:0, same:0, both:0, none:0, pan:0, steps:0, resolved:true }
    : { other:0, same:0, both:0, none:0, pan:0, steps:0, resolved:false };
  p.orientation = p.orientation || "descobrindo";
  st.look = Object.assign({ tone:"", hair:"natural", face:"none", wardrobe:0, skincare:false, glasses:null, myopia:false, visionTested:false, glassesPenalty:0, lasik:false, procedures:0 }, st.look || {});
  st.pets = st.pets || [];
  if (st.flags.pet){ st.pets.push({ uid:uid(), sp:"dog_srd", name:st.flags.pet.name, age:Math.max(1, p.age - num(st.flags.pet.since, p.age)), bond:70, hunger:0, stress:10, neglect:0, health:90, trained:0, played:false }); delete st.flags.pet; }
  st.cyberSkill = clamp(num(st.cyberSkill)); st.prisonSkills = st.prisonSkills || [];
  st.stats = Object.assign({ cyberOk:0, petsOwned:0, remitted:0, spouseScams:0 }, st.stats);
  if (st.prison){ st.prison.remit = num(st.prison.remit); st.prison.intim = num(st.prison.intim); st.prison.courses = st.prison.courses || {}; st.prison.cat = st.prison.cat || crimeCategory(st.prison.crime); }
  if (st.prison){ st.prison.security = st.prison.security || (st.prison.years >= 12 ? "máxima" : st.prison.years >= 5 ? "média" : "mínima"); st.prison.escAttempts = num(st.prison.escAttempts); st.prison.escBlock = num(st.prison.escBlock); }
  const home = p.country;
  for (const x of st.properties || []){ x.country = x.country || home; x.condition = num(x.condition, 100); if (PROPERTY_ID_MIGRATION[x.id]) x.id = PROPERTY_ID_MIGRATION[x.id]; }
  st.properties = (st.properties || []).filter(x => byId(DATA.properties, x.id));
  for (const x of [...(st.vehicles||[]), ...(st.businesses||[]), ...(st.loans||[])]) x.country = x.country || home;
  for (const L of st.loans || []) L.missed = num(L.missed);
  // NPCs: personalidade, riqueza e histórico (saves antigos ganham valores coerentes)
  const seen = new Set();
  st.rels = (st.rels || []).filter(r => r && r.uid && !seen.has(r.uid) && seen.add(r.uid));
  for (const r of st.rels){ r.personality = r.personality || DATA.personalities[Math.abs(hashStr(r.uid)) % DATA.personalities.length].id; r.wealth = r.wealth ?? 2; r.respect = clamp(num(r.respect, 50)); r.history = r.history || []; }
  return st;
}

/* ---------- Helpers de mutação ---------- */
function addStat(k, d){
  const st = S.player.stats;
  if (k === "happiness" && d < 0 && hasTrait("resilient")) d *= 0.65;
  if (k === "happiness" && d < 0 && hasTrait("anxious")) d *= 1.25;
  // saúde nunca ultrapassa o teto de vitalidade (envelhecimento + sequelas)
  const max = k === "health" ? healthCap() : 100;
  st[k] = clamp(num(st[k]) + num(d), 0, d > 0 ? Math.max(max, Math.min(st[k], 100)) : 100);
}
function addFame(d){ S.player.fame = clamp(num(S.player.fame) + d); }
function addNoto(d){ S.player.notoriety = clamp(num(S.player.notoriety) + d); }
function addMoney(d){ S.money = Math.round(num(S.money) + num(d)); }
function addStress(d){
  if (d > 0 && hasTrait("resilient")) d *= 0.75;
  if (d > 0 && hasTrait("anxious")) d *= 1.3;
  S.player.stress = clamp(num(S.player.stress) + num(d));
}
function addRep(d){ S.player.reputation = clamp(num(S.player.reputation) + num(d)); }
function addCredit(d){ S.credit = Math.max(300, Math.min(850, Math.round(num(S.credit,620) + d))); }
/* Teto de saúde: vitalidade (cai com a idade) menos sequelas permanentes. */
function healthCap(){ return clamp(num(S.player.vitality,100) - num(S.health?.sequelae,0), 5, 100); }

const hasTrait = id => S.player.traits.includes(id);
const P = () => S.player;
const year = () => S.player.birthYear + S.player.age;

/* ---------- Log com etiquetas automáticas (usadas pelos filtros/busca) ---------- */
const LOG_TAGS = [
  ["work",   /promovid|demitid|contratad|emprego|cargo|aposent|carreira|layoff|eleit|mandato|💼|📈/i],
  ["money",  /R\$|€|\$|herd|invest|dívid|empréstimo|compr|vend|lucr|falênc|💰|💸|🏠|🚗/i],
  ["love",   /namor|casei|casamento|divórc|noiv|💘|💍|💕|💔|bebê|filh|neto/i],
  ["health", /saúde|doen|diagnost|tratament|hospital|médic|câncer|check-up|vício|cirurg|🏥|🩺|💪|🤒/i],
  ["crime",  /pres[oa]|crime|condenad|polícia|prisão|reformatório|🚓|⛓|🦹|investigaç/i],
  ["school", /escola|faculdade|vestibular|formei|diploma|curso|mestrado|doutor|🎓|🎒/i],
];
function autoTag(text){ return LOG_TAGS.filter(([,re]) => re.test(text)).map(([t]) => t); }
function log(text, kind = "", tags){
  S.log.push({ age:S.player.age, year:year(), text, kind, tags: tags || autoTag(text) });
  if (S.log.length > 4000) S.log.splice(0, S.log.length - 4000); // evita save gigante
}
/* Histórico de consequências: liga uma escolha passada ao efeito presente. */
function remember(text, kind = "info"){
  S.consequences.push({ age:P().age, text, kind });
  if (S.consequences.length > 200) S.consequences.shift();
}
function achieve(id, text){
  if (S.achievements.some(a=>a.id===id)) return;
  S.achievements.push({ id, text, age:S.player.age });
  log("🏆 Conquista: " + text, "milestone"); emit("achievement", text);
}
function lifeStage(age = S.player.age){
  if (age < 3) return "Bebê";
  if (age < 13) return "Infância";
  if (age < 18) return "Adolescência";
  if (age < 30) return "Jovem Adulto";
  if (age < 60) return "Vida Adulta";
  return "Terceira Idade";
}

/* ---------- Patrimônio líquido (derivado, nunca armazenado) ---------- */
function investTotal(){ return Object.values(S.investments).reduce((a,b)=>a+num(b),0); }
/* Tudo convertido para a moeda do país atual (ativos guardam a própria moeda). */
function debtTotal(){ return S.loans.reduce((a,l)=>a+fxConv(l.principal, l.country),0) + num(S.edu.debt); }
function propertiesTotal(){ return S.properties.reduce((a,p)=>a+fxConv(p.value, p.country),0); }
function vehiclesTotal(){ return S.vehicles.reduce((a,v)=>a+fxConv(v.value, v.country),0); }
function businessesTotal(){ return S.businesses.reduce((a,b)=>a+fxConv(b.value, b.country),0); }
function netWorth(){
  return Math.round(num(S.money) + num(S.dirty) + propertiesTotal() + vehiclesTotal() + businessesTotal() + investTotal() - debtTotal());
}

const LIFESTYLES = [
  { name:"Econômico",   mult:0.65, happy:-3, stress:4 },
  { name:"Normal",      mult:1.0,  happy:0,  stress:0 },
  { name:"Confortável", mult:1.7,  happy:3,  stress:-3 },
  { name:"Luxuoso",     mult:3.5,  happy:6,  stress:-5 },
];

const parents = () => S.rels.filter(r => (r.role==="mother"||r.role==="father") && r.alive);
const partner = () => S.rels.find(r => (r.role==="partner"||r.role==="spouse"||r.role==="fiance") && r.alive);
const children = (alive=true) => S.rels.filter(r => r.role==="child" && (!alive || r.alive));
const inPrison = () => !!S.prison;
const classOf = () => DATA.classes[P().cls] || DATA.classes[4];
const clsBand = () => classOf().band; // 0–4: faixa usada pelas fórmulas gerais
function career(){ return S.job ? byId(DATA.careers, S.job.careerId) : null; }
function residence(){ return S.properties.find(p => p.residence); }
function homeInfo(){
  const own = residence();
  if (own){ const d = byId(DATA.properties, own.id); return { type:"own", name:d.name, comfort:d.comfort, status:d.status }; }
  if (S.rental){ const d = byId(DATA.rentals, S.rental); return { type:"rent", name:d.name, comfort:d.comfort, status:d.status, rent:priceOf(d.rent) }; }
  if (inPrison()) return { type:"prison", name:"Cela do presídio", comfort:0, status:0 };
  if (parents().length || P().age < 18) return { type:"family", name:"Casa da família", comfort: classOf().comfort, status: classOf().status };
  return { type:"none", name:"Sem moradia fixa", comfort:0, status:0 };
}
function jobIncome(){
  let inc = 0;
  if (S.job && !inPrison()) inc += S.job.salary;
  if (S.partTime && !inPrison()) inc += wageOf(byId(DATA.partTime, S.partTime).s);
  if (S.retired) inc += S.pension;
  return Math.round(inc);
}
function relBy(uidv){ return S.rels.find(r=>r.uid===uidv); }

/* ---------- Sanitização: blindagem contra NaN e estados inválidos ---------- */
function sanitize(){
  const p = P(), st = p.stats;
  for (const k of ["health","happiness","intelligence","looks"]) st[k] = clamp(st[k]);
  st.health = Math.min(st.health, Math.max(healthCap(), 0));
  for (const k of ["fame","notoriety","stress","reputation","vitality","karma"]) p[k] = clamp(p[k]);
  for (const k in S.addictions) S.addictions[k] = clamp(S.addictions[k]);
  S.credit = Math.max(300, Math.min(850, Math.round(num(S.credit, 620))));
  S.health.sequelae = clamp(S.health.sequelae, 0, 80);
  S.money = Math.round(num(S.money)); S.priceIndex = num(S.priceIndex, 1);
  // saldo nunca fica negativo: o rombo vira cheque especial (dívida rastreada, derruba o crédito)
  if (S.money < 0){
    const d = -S.money; S.money = 0;
    const student = S.edu.school && parents().length && p.age < 25 && clsBand() >= 1;
    if (p.age >= 18 && !student){ takeLoan("Cheque especial", d, RATES.overdraft, 3, true); S.flags.overdraftYear = p.age; }
    else for (const pa of parents()) pa.rel = clamp(pa.rel - 2);
  }
  S.edu.debt = Math.max(0, Math.round(num(S.edu.debt))); S.edu.perf = clamp(S.edu.perf);
  S.dirty = Math.max(0, Math.round(num(S.dirty))); S.crimeSkill = clamp(S.crimeSkill);
  if (S.martial) for (const a of Object.values(S.martial.arts)) a.m = clamp(num(a.m));
  for (const pt of S.pets || []){ for (const k of ["bond","hunger","stress","health"]) pt[k] = clamp(num(pt[k])); pt.trained = Math.max(0, Math.min(1, num(pt.trained))); }
  S.cyberSkill = clamp(num(S.cyberSkill));
  if (S.prison){ S.prison.intim = clamp(num(S.prison.intim)); S.prison.remit = Math.max(0, num(S.prison.remit)); }
  p.age = Math.max(0, Math.round(num(p.age)));
  if (S.org){ S.org.heat = clamp(S.org.heat); S.org.respect = clamp(S.org.respect); for (const m of S.org.members) { m.loyalty = clamp(m.loyalty); m.skill = clamp(m.skill); } }
  for (const x of S.properties) x.value = Math.max(0, Math.round(num(x.value)));
  for (const v of S.vehicles) v.value = Math.max(0, Math.round(num(v.value)));
  for (const k in S.investments) S.investments[k] = Math.max(0, Math.round(num(S.investments[k])));
  for (const L of S.loans){ L.principal = Math.max(0, Math.round(num(L.principal))); L.payment = Math.max(1, Math.round(num(L.payment,1))); }
  for (const r of S.rels){ r.rel = clamp(r.rel); r.age = Math.max(0, Math.round(num(r.age))); }
  for (const i of S.illnesses) i.stage = Math.max(1, Math.min(4, Math.round(num(i.stage,1))));
  if (S.job){ S.job.perf = clamp(S.job.perf); S.job.salary = Math.max(0, Math.round(num(S.job.salary))); }
  for (const b of S.businesses){ b.value = Math.max(0, Math.round(num(b.value))); b.revenue = Math.max(0, Math.round(num(b.revenue))); b.lastProfit = Math.round(num(b.lastProfit)); }
}
