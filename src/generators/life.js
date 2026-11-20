"use strict";
/* generators/life.js */

/* Cria um estado inteiro novo. opts permite "Personalizar Nascimento"
   e também "continuar como herdeiro" (inheritFrom). */
function newLife(opts = {}){
  const prev = S;
  S = { seed: (opts.seed ?? (Math.random()*2**31)|0) };
  const c = byId(DATA.countries, opts.country) || pick(DATA.countries);
  const gender = opts.gender || (chance(0.5)?"M":"F");
  const nm = genName(c, gender);
  // classe social: SEMPRE sorteada (opts.cls só existe para herdeiros e testes)
  const clsId = opts.cls ?? weighted(DATA.classes, k => k.weight).id;
  const cls = DATA.classes[clsId];
  const birthYear = opts.birthYear || (prev && opts.heir ? prev.player.birthYear + prev.player.age : 2000 + rint(0,6));

  Object.assign(S, {
    version: SAVE_VERSION, lifeNo: (prev?.lifeNo || 0) + 1,
    lineage: prev && opts.heir ? [...(prev.lineage||[]), summarizeLife(prev)] : (opts.keepLineage && prev ? prev.lineage : []),
    priceIndex: 1, money: 0,
    player: {
      first: opts.first || nm.first, last: opts.last || (opts.heirLast) || nm.last, gender,
      orientation: opts.orientation || "descobrindo", // definida ao longo da adolescência (systems/identity.js)
      country: c.id, city: c.cities.includes(opts.city) ? opts.city : pick(c.cities),
      ethnicity: opts.ethnicity || pick(DATA.ethnicities), eyes: opts.eyes || pick(DATA.eyes), hair: opts.hair || pick(DATA.hair),
      birthYear, age: 0, alive: true, cause: null, cls: clsId, clsScale: 9,
      stats: { health: clamp(rint(70,100) - (cls.band === 0 ? rint(5,15) : 0)), happiness: rint(65,100), intelligence: clamp(rint(15,90)+cls.eduBonus/2), looks: rint(10,95) },
      fame: 0, notoriety: 0, karma: 50,
      traits: opts.traits || rollTraits(opts.trait),
      talents: { music: rint(0,100), acting: rint(0,100), sport: rint(0,100) },
      lifestyle: 1, // 0 econômico,1 normal,2 confortável,3 luxuoso
    },
    edu: { level: 0, school: null, yearsLeft: 0, perf: 60, major: null, degrees: [], techs: [], debt: 0, dropped:false },
    job: null, partTime: null, retired: false, pension: 0, jobHistory: [], unemployedYears: 0,
    businesses: [], properties: [], rental: null, vehicles: [], investments: {}, loans: [],
    rels: [], prison: null, parole: 0, record: [], illnesses: [],
    log: [], achievements: [], flags: {}, cooldown: {}, queue: [], yearSummary: null,
    activitiesThisYear: 0, gymYears: 0, createdAt: Date.now(),
  });
  if (opts.tone !== undefined) S.look = { tone: opts.tone };
  if (opts.orientation) S.identity = { other:0, same:0, both:0, none:0, pan:0, steps:0, resolved:true };
  ensureState(S);
  // predisposição genética: herdada da família, multiplica o risco de certas doenças
  S.health.genetic = DATA.illnesses.filter(d => !["flu","depress"].includes(d.id) && chance(0.12)).map(d => d.id);
  if (hasTrait("genius")) addStat("intelligence", 15);
  if (hasTrait("athletic")) { addStat("health", 8); P().talents.sport = clamp(P().talents.sport + 25); }
  if (hasTrait("creative")) { P().talents.music = clamp(P().talents.music + 15); P().talents.acting = clamp(P().talents.acting + 15); }

  // Pais / responsáveis
  const parentJobs = ["Pedreiro","Professora","Vendedor","Enfermeira","Motorista","Contador","Advogada","Engenheiro","Médica","Empresário","Autônomo","Funcionário Público","Desempregado","Cozinheiro","Diarista"];
  const famLast = P().last;
  const singleParent = chance(clsId <= 1 ? 0.25 : 0.1);
  const mother = makeNPC("mother", c, { gender:"F", age: rint(18,40), last: chance(0.5)?famLast:pick(c.last), job: pick(parentJobs), rel: rint(55,100) });
  S.rels.push(mother);
  if (!singleParent){
    S.rels.push(makeNPC("father", c, { gender:"M", age: mother.age + rint(-3,8), last: famLast, job: pick(parentJobs), rel: rint(45,100) }));
  }
  if (opts.heir && prev){ // herdeiro: o pai/mãe é o personagem anterior (já falecido)
    const p = S.rels[0]; p.first = prev.player.first; p.last = prev.player.last; p.gender = prev.player.gender;
    p.role = prev.player.gender === "F" ? "mother" : "father";
  }
  const nSib = weighted([0,1,2,3], k => [30,40,20,10][k]);
  for (let i=0;i<nSib;i++) S.rels.push(makeNPC("sibling", c, { age: rint(1,12), last: famLast, rel: rint(35,85) }));
  for (const r of S.rels) if (r.role === "sibling" && chance(0.5)) r.age = 0, r.unborn = rint(1,6);

  // Herança direta (continuar como herdeiro)
  if (opts.inheritance) { S.trustFund = Math.round(opts.inheritance); }

  log(`Nasci ${gender==="M"?"menino":"menina"} em ${P().city}, ${c.name}, no ano ${birthYear}. Me chamaram de ${P().first} ${P().last}.`, "milestone");
  log(`Família de ${cls.name}. Moramos em: ${cls.home}.`);
  if (cls.id === 8){ S.trustFund = num(S.trustFund) + priceOf(rint(3e6, 1.2e7)); remember("Nasci com um fundo fiduciário milionário — liberado aos 18 anos.", "good"); }
  if (cls.band === 0) remember(`Nascer em ${cls.name.toLowerCase()} pesa: saúde frágil, escola difícil e pouco acesso a médicos.`, "bad");
  const tnames = P().traits.map(t => byId(DATA.traits,t).name).join(", ");
  log(`Temperamento: ${tnames}.`);
  if (S.health.genetic.length) remember(`Histórico familiar de ${S.health.genetic.map(id=>byId(DATA.illnesses,id).name).join(", ")} — check-ups regulares importam.`, "warn");
  return S;
}
