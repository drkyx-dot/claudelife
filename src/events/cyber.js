"use strict";
/* events/cyber.js — investigação de crimes cibernéticos e convites hackers. */
EVENTS.push(
{ id:"ev_cyber_probe", emoji:"🖥️", title:"Delegacia de crimes cibernéticos", age:[14,120], weight:0, cond:()=>!inPrison(),
  speech:()=> say("A gente rastreou as transações até o seu CPF. Quer explicar?"),
  text:c=> `A polícia investiga você por ${c.crime.toLowerCase()}. Chance de condenação: ${Math.round(c.p*100)}%.`,
  choices:c=>[
    { label:"🧹 Apagar os rastros (inteligência)", hint:"perícia contra perícia", run:()=>{ if (chance(0.2 + cyberLevel()/200 + P().stats.intelligence/400)){ S.cyberSkill = clamp(S.cyberSkill + 4); return "Formatei, criptografei e sumi com os logs. O inquérito travou."; } return "A perícia recuperou o HD." + cyberTrial(c, -0.1); } },
    { label:"⚖️ Advogado especializado", hint:fmt(priceOf(15000)), run:()=>{ const v = priceOf(15000); if (!canAfford(v)) return "Sem dinheiro para um bom advogado." + cyberTrial(c, 0); addMoney(-v); return "A defesa questionou a cadeia de custódia das provas." + cyberTrial(c, 0.3); } },
    { label:"🤝 Delação premiada", hint:"pena menor, ficha suja", run:()=>{ const y = Math.max(1, Math.round(rint(...c.years) * 0.4)); P().karma = clamp(P().karma + 5); sendToPrison(y, `${c.crime.toLowerCase()} (delação)`); return `Entreguei o esquema. ${y} ano(s).`; } },
    { label:"✈️ Fugir do país", run:()=>{ const from = P().country, d = pick(DATA.countries.filter(x=>x.id!==from)); emigrate(d.id, true); S.wanted = S.wanted || { since:P().age, remaining:rint(...c.years), crime:c.crime.toLowerCase(), fakeId:false, country:from, years:0, security:"média" }; return `Fugi para ${d.name} antes do mandado.`; } },
  ]},
{ id:"ev_hacker_crew", emoji:"🕶️", title:"Convite de um grupo hacker", age:[16,50], cd:5, weight:()=> cyberLevel() >= 25 && !inPrison() ? 0.6 : 0,
  setup:()=>({ npc: approachNPC("acquaintance", { personality: pick(["schemer","ambitious","shy"]), job:"Hacker" }) }),
  speech:()=> say("Vi teu trabalho. Tamo montando uma operação grande. Topa?"),
  text:()=> "Um grupo anônimo quer você numa operação de ransomware.",
  choices:c=>[
    { label:"💻 Entrar (treino intensivo)", run:()=>{ S.cyberSkill = clamp(S.cyberSkill + 10); addNoto(5); return "Aprendi mais em um mês do que em anos sozinho(a)."; } },
    investigateChoice("ev_hacker_crew"),
    { label:"🚓 Denunciar à polícia", run:()=>{ P().karma = clamp(P().karma + 8); return "Mandei as provas para a polícia anonimamente."; } },
    ignoreChoice("Recusar"),
  ]},
);
function cyberTrial(c, bonus){
  if (chance(clamp((c.p - bonus) * 100, 5, 95) / 100)){ const y = rint(...c.years); sendToPrison(y, c.crime.toLowerCase()); return ` Condenado(a): ${y} ano(s).`; }
  return " Absolvido(a) por falta de provas.";
}
