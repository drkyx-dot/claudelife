"use strict";
/* generators/people.js */

function genName(c, gender){ return { first: pick(c.first[gender==="M"?"m":"f"]), last: pick(c.last) }; }

function makeNPC(role, c, opts={}){
  const gender = opts.gender || (chance(0.5)?"M":"F");
  const n = genName(c, gender);
  return {
    uid: uid(), role, gender,
    first: opts.first || n.first, last: opts.last || n.last,
    age: num(opts.age, 0), rel: clamp(num(opts.rel, rint(40,80))), alive: true,
    job: opts.job || null, looks: clamp(opts.looks ?? rint(20,95)), since: S ? S.player.age : 0,
    money: num(opts.money, 0), craziness: rint(0,100), generous: rint(0,100),
    personality: opts.personality || pick(DATA.personalities).id,
    wealth: opts.wealth ?? weighted([0,1,2,3,4], k => [12,30,35,17,6][k]),
    respect: clamp(num(opts.respect, rint(35,70))),
    history: [],
  };
}
/* Registra uma interação no histórico do NPC (exibido na ficha da pessoa). */
function remember_npc(r, text){
  if (!r) return; r.history = r.history || [];
  r.history.push({ age: P().age, text }); if (r.history.length > 25) r.history.shift();
}
const personalityOf = r => byId(DATA.personalities, r.personality) || DATA.personalities[5];
/* Ocupação legível por idade (NPCs sem carreira simulada). */
function npcJobFor(age){
  if (age < 6) return null; if (age < 18) return "Estudante"; if (age >= 67) return "Aposentado(a)";
  return pick(["Professor(a)","Engenheiro(a)","Vendedor(a)","Designer","Enfermeiro(a)","Advogado(a)","Autônomo(a)","Programador(a)","Motorista","Cozinheiro(a)","Comerciante","Bancário(a)","Desempregado(a)","Policial","Corretor(a)"]);
}

function rollTraits(first){
  const out = byId(DATA.traits, first) ? [first] : []; // traço inicial escolhido no hub
  const pool = DATA.traits.filter(t => t.id !== first);
  const n = rint(2,3);
  while (out.length < n && pool.length){
    const t = pool.splice(Math.floor(rand()*pool.length),1)[0];
    if (out.some(o => o === t.opp || byId(DATA.traits,o)?.opp === t.id)) continue;
    out.push(t.id);
  }
  return out;
}

/* Gênero do(a) pretendente conforme a orientação. "Em descoberta" segue as
   inclinações já mostradas nas escolhas (systems/identity.js). */
function partnerGender(){
  const o = P().orientation, g = P().gender, other = g==="M"?"F":"M";
  if (o === "hetero") return other;
  if (o === "homo") return g;
  if (o === "descobrindo"){ const I = S.identity || {}; const so = num(I.other) + 1, ss = num(I.same) + 1; return chance(so/(so+ss)) ? other : g; }
  return chance(0.5) ? "M" : "F";
}

function makePartner(ageDelta=[-4,4], rel=[55,80]){
  const p = makeNPC("partner", country(), { gender: partnerGender(), age: Math.max(14, P().age + rint(...ageDelta)), rel: rint(...rel) });
  p.since = P().age; p.job = P().age >= 20 ? pick(["Professor(a)","Engenheiro(a)","Vendedor(a)","Designer","Enfermeiro(a)","Advogado(a)","Autônomo(a)","Programador(a)","Chef","Arquiteto(a)"]) : null;
  p.money = wageOf(rint(0, 60000) * (P().age/30));
  return p;
}
