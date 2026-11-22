"use strict";
/* =====================================================================
   state/state.js — estado global S (fonte única da verdade) e helpers.
   Toda mutação de atributo passa por um helper que clampa/sanitiza.
   ===================================================================== */
const SAVE_KEY = "claudilife.save.v6"; // legado: v7 usa slots (state/persistence.js)
const LEGACY_SAVE_KEYS = ["claudilife.save.v6","claudilife.save.v5","claudilife.save.v4","claudilife.save.v3"];
const SAVE_VERSION = 8;
const PROPERTY_ID_MIGRATION = { townhouse:"sobrado" }; // ids removidos em versões antigas

let S = null; // estado global da vida atual

/* ---------- Formato: força o TIPO certo de cada campo antes de qualquer uso ----------
   Saves antigos, gravados no meio de um erro ou editados podem trazer
   lista como texto, objeto como null etc. Aqui tudo volta ao formato
   esperado; ensureState() depois preenche os valores padrão. */
const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);
const SHAPE = {
  lists:   ["rels","log","achievements","illnesses","properties","vehicles","loans","businesses","scheduled","consequences","queue","record","jobHistory","pets","collection","arsenal","lineage"],
  objects: ["edu","flags","health","world","stats","investments","cooldown","addictions","actCount","martial","look","identity","dark"],
  nullable:["job","prison","org","gig","wanted","fight","escape","hunt","yearSummary","lastYear","final","snap"],
  strings: ["rental","partTime"],
};
function normalizeShape(st){
  for (const k of SHAPE.lists){ st[k] = Array.isArray(st[k]) ? st[k].filter(x => k === "lineage" || k === "achievements" || isObj(x)) : []; }
  for (const k of SHAPE.objects) if (!isObj(st[k])) st[k] = {};
  for (const k of SHAPE.nullable) if (st[k] !== null && st[k] !== undefined && !isObj(st[k])) st[k] = null;
  for (const k of SHAPE.strings) if (st[k] !== null && st[k] !== undefined && typeof st[k] !== "string") st[k] = null;
  const p = st.player; if (!isObj(p.stats)) p.stats = {};
  for (const k of ["health","happiness","intelligence","looks"]) p.stats[k] = clamp(num(p.stats[k], 50));
  if (!isObj(p.talents)) p.talents = {}; for (const k of ["music","acting","sport"]) p.talents[k] = clamp(num(p.talents[k], 30));
  if (!Array.isArray(p.traits)) p.traits = []; p.traits = p.traits.filter(t => byId(DATA.traits, t));
  p.age = Math.max(0, Math.round(num(p.age))); p.alive = p.alive !== false;
  if (!byId(DATA.countries, p.country)) p.country = "BR";
  if (!byId(DATA.countries, p.country).cities.includes(p.city)) p.city = byId(DATA.countries, p.country).cities[0];
  st.money = num(st.money); st.seed = Math.round(num(st.seed, 12345));
  // listas de objetos com campos obrigatórios
  st.rels = st.rels.filter(r => r.uid && typeof r.first === "string").map(r => ({ ...r, age: Math.max(0, Math.round(num(r.age))), rel: clamp(num(r.rel, 50)), alive: r.alive !== false }));
  st.queue = st.queue.filter(q => typeof q.id === "string" && EVENT_MAP && EVENT_MAP[q.id]).map(q => ({ id:q.id, ctx: isObj(q.ctx) ? q.ctx : {} }));
  st.scheduled = st.scheduled.filter(x => typeof x.kind === "string").map(x => ({ ...x, at: num(x.at, p.age + 1), ctx: isObj(x.ctx) ? x.ctx : {} }));
  st.log = st.log.filter(e => typeof e.text === "string");
  for (const k of ["properties","vehicles","businesses","loans","collection","arsenal","pets"]) st[k] = st[k].filter(x => typeof x.id === "string" || k === "loans").map(x => ({ uid: x.uid || uid(), ...x }));
  // nulos que precisam de estrutura interna válida (senão viram null)
  if (st.job && (!byId(DATA.careers, st.job.careerId))) st.job = null;
  if (st.job){ const c = byId(DATA.careers, st.job.careerId); st.job.level = Math.max(0, Math.min(c.levels.length - 1, Math.round(num(st.job.level)))); for (const k of ["levelYears","years","perf","effort","salary"]) st.job[k] = num(st.job[k], k === "perf" ? 55 : k === "effort" ? 1 : 0); }
  if (st.prison){ st.prison.years = Math.max(1, Math.round(num(st.prison.years, 1))); st.prison.served = Math.round(num(st.prison.served)); st.prison.crime = String(st.prison.crime || "crime"); if (!isObj(st.prison.courses)) st.prison.courses = {}; }
  if (st.org && !(Array.isArray(st.org.members) && Array.isArray(st.org.ops))){ st.org.members = Array.isArray(st.org.members) ? st.org.members : []; st.org.ops = Array.isArray(st.org.ops) ? st.org.ops : []; }
  if (st.org){ st.org.rivals = Array.isArray(st.org.rivals) ? st.org.rivals.filter(isObj) : []; st.org.territories = Array.isArray(st.org.territories) ? st.org.territories.filter(t => typeof t === "string") : []; st.org.members = st.org.members.filter(isObj); st.org.ops = st.org.ops.filter(isObj); st.org.name = String(st.org.name || "Organização"); st.org.rank = Math.max(0, Math.min(DATA.orgRanks.length - 1, Math.round(num(st.org.rank)))); }
  if (st.wanted){ for (const k of ["since","remaining","years"]) st.wanted[k] = Math.max(0, Math.round(num(st.wanted[k]))); st.wanted.crime = String(st.wanted.crime || "crime"); }
  if (st.gig && !byId(DATA.gigs, st.gig.id)) st.gig = null;
  if (st.fight && !(DATA.fightProfiles[st.fight.kind] && isObj(st.fight.opp) && isObj(st.fight.me) && isObj(st.fight.ctx) && Array.isArray(st.fight.lines))) st.fight = null;
  if (st.escape && !(Array.isArray(st.escape.stages) && st.escape.stages.length && st.escape.stages.every(x => isObj(x) && Array.isArray(x.grid)) && Array.isArray(st.escape.pos))) st.escape = null;
  if (st.escape && st.escape.mode !== "street" && !st.prison) st.escape = null; // fuga de presídio sem presídio
  if (st.escape && st.escape.mode === "street" && !(isObj(st.escape.pending) && num(st.escape.pending.years) > 0)) st.escape = null;
  if (st.hunt && !isObj(st.hunt.t)) st.hunt = null;
  if (isObj(st.martial)){ if (!isObj(st.martial.arts)) st.martial.arts = {}; if (!Array.isArray(st.martial.enrolled)) st.martial.enrolled = []; if (!Array.isArray(st.martial.titles)) st.martial.titles = []; if (!isObj(st.martial.rec)) st.martial.rec = {}; }
  if (isObj(st.dark) && !Array.isArray(st.dark.victims)) st.dark.victims = [];
  if (isObj(st.world) && !Array.isArray(st.world.history)) st.world.history = [];
  if (isObj(st.stats) && !Array.isArray(st.stats.countries)) st.stats.countries = [p.country];
  if (isObj(st.identity)) for (const k of ["other","same","both","none","pan","steps"]) st.identity[k] = num(st.identity[k]);
  return st;
}

/* ---------- Defaults: garante todos os campos (vida nova, migração, herdeiro) ---------- */
function ensureState(st = S){
  normalizeShape(st);
  const p = st.player;
  st.edu = Object.assign({ level:0, school:null, yearsLeft:0, perf:60, major:null, degrees:[], techs:[], debt:0, dropped:false }, st.edu);
  if (!Array.isArray(st.edu.degrees)) st.edu.degrees = []; if (!Array.isArray(st.edu.techs)) st.edu.techs = [];
  st.edu.level = Math.max(0, Math.min(6, Math.round(num(st.edu.level)))); st.edu.perf = clamp(num(st.edu.perf, 60)); st.edu.yearsLeft = Math.max(0, num(st.edu.yearsLeft)); st.edu.debt = Math.max(0, num(st.edu.debt));
  p.first = String(p.first || "Sem nome"); p.last = String(p.last || ""); p.gender = p.gender === "F" ? "F" : "M";
  p.birthYear = Math.round(num(p.birthYear, 2000)); p.cls = Math.max(0, Math.min(DATA.classes.length - 1, Math.round(num(p.cls, 4))));
  p.fame = clamp(num(p.fame)); p.notoriety = clamp(num(p.notoriety)); p.lifestyle = Math.max(0, Math.min(3, Math.round(num(p.lifestyle, 1))));
  st.activitiesThisYear = Math.max(0, Math.round(num(st.activitiesThisYear))); st.priceIndex = num(st.priceIndex, 1) || 1;
  st.lifeNo = Math.max(1, Math.round(num(st.lifeNo, 1))); st.parole = Math.max(0, num(st.parole)); st.unemployedYears = Math.max(0, num(st.unemployedYears));
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
  // v8: trabalho autônomo, coleção, arsenal, lado sombrio
  st.gig = st.gig && byId(DATA.gigs, st.gig.id) ? st.gig : null;
  st.collection = (st.collection || []).filter(c => byId(DATA.collectibles, c.id)).map(c => ({ country:home, ...c }));
  st.arsenal = (st.arsenal || []).filter(w => byId(DATA.armory, w.id));
  st.dark = Object.assign({ active:false, code:"code", urge:0, heat:0, clues:0, stealth:10, kills:0, victims:[], hunts:0 }, st.dark || {});
  st.hunt = null;
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
  text = typeof gtxPlayer === "function" ? gtxPlayer(String(text)) : String(text); // "preso(a)" → forma do gênero
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
  return Math.round(num(S.money) + num(S.dirty) + propertiesTotal() + vehiclesTotal() + businessesTotal() + investTotal() + (typeof collectionTotal === "function" ? collectionTotal() : 0) - debtTotal());
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
/* Idade legal no país atual para uma regra (adult, work, drive, drink, gamble). */
function ageOf(rule){ const r = DATA.ageRules[P().country] || DATA.ageRules.BR; return num(r[rule], 18); }
const minor = () => P().age < ageOf("adult");
/* Conta de hospital, multa leve etc.: menor de idade não paga do próprio
   bolso — os pais (ou quem cria) pagam, e isso pesa um pouco na relação. */
function payBill(amount, what){
  amount = Math.round(Math.max(0, num(amount))); if (!amount) return "";
  if (minor()){
    const ps = parents(); for (const pa of ps) pa.rel = clamp(pa.rel - (amount > priceOf(2000) ? 3 : 1));
    log(`${ps.length ? "Meus pais pagaram" : "A família que me cria pagou"} ${what} (${fmt(amount)}).`, "");
    return ` ${ps.length ? "Meus pais pagaram" : "Minha família pagou"} ${what}: ${fmt(amount)}.`;
  }
  addMoney(-amount); return ` ${what[0].toUpperCase() + what.slice(1)}: ${fmt(amount)}.`;
}
/* "Só a partir dos 21 nos Estados Unidos." — explica a regra do país. */
function ageReason(rule){ const a = ageOf(rule), base = DATA.ageRules.BR[rule]; return a !== base ? `Em ${country().name}, só a partir dos ${a} anos.` : `Idade mínima: ${a} anos.`; }
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
  if (S.dark){ S.dark.urge = clamp(S.dark.urge); S.dark.heat = clamp(S.dark.heat); S.dark.stealth = clamp(S.dark.stealth); S.dark.clues = Math.max(0, Math.round(num(S.dark.clues))); }
  if (S.gig){ S.gig.skill = clamp(S.gig.skill); S.gig.exposure = clamp(S.gig.exposure); S.gig.rating = clamp(S.gig.rating, 30, 100); S.gig.audience = Math.max(0, Math.round(num(S.gig.audience))); }
  for (const c of S.collection || []) c.value = Math.max(1, Math.round(num(c.value, 1)));
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
