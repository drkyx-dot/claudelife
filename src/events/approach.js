"use strict";
/* =====================================================================
   events/approach.js — ABORDAGENS: alguém vem até você.
   Regra de design: o jogo NUNCA decide pelo jogador. Toda abordagem
   mostra a ficha da pessoa (ctx.npc), um balão de fala (speech) e opções
   explícitas: aceitar / recusar / negociar / investigar / ignorar.
   "Investigar" gasta energia e revela personalidade e situação
   financeira reais — e devolve a mesma proposta para você decidir.
   ===================================================================== */
function approachNPC(role, opts = {}){
  const n = makeNPC(role, country(), { age: Math.max(16, P().age + rint(-8, 8)), ...opts });
  n.job = n.job || npcJobFor(n.age); n.since = P().age;
  return n;
}
/* Opção padrão de investigação: revela a ficha e re-enfileira a proposta. */
function investigateChoice(id){
  return { label:"🔍 Investigar antes de decidir", hint:"gasta 1 de energia: revela personalidade e finanças", run:c=>{
    if (c.revealed) return "Você já sabe tudo que dava para saber.";
    if (!spendEnergy()) return "Sem energia para investigar este ano — decida no escuro.";
    c.revealed = true; const p = byId(DATA.personalities, c.npc.personality);
    S.queue.splice(1, 0, { id, ctx:c });
    return `Pesquisei: ${c.npc.first} é ${p.name.toLowerCase()} (${p.desc.toLowerCase()}) e está ${DATA.wealthLevels[c.npc.wealth].toLowerCase()}.${p.scam ? " Tem histórico de golpes. ⚠️" : ""}`;
  }};
}
const ignoreChoice = (txt = "Ignorar") => ({ label:`🙈 ${txt}`, run:()=> "Deixei pra lá." });

EVENTS.push(
{ id:"ev_approach_date", emoji:"💬", title:"Alguém se aproximou", age:[16,85], weight:()=> partner() ? 0.25 : P().orientation === "ace" ? 0.4 : 1.6, cd:2,
  setup:()=>({ npc: approachNPC("partner", { gender: partnerGender(), age: Math.max(16, P().age + rint(-6,6)) }), line: approachLine("date") }),
  speech:c=> c.line,
  text:c=> `${c.npc.first}, ${c.npc.age} anos, puxou papo com você${partner() ? " — e você não está solteiro(a)." : "."}`,
  choices:c=>[
    { label:"💘 Aceitar sair", hint: partner() ? "pode custar seu relacionamento atual" : "", run:()=>{
        const p = 0.55 - (c.npc.looks - P().stats.looks)/150 + (hasTrait("charismatic")?0.12:0);
        if (!chance(clamp(p*100, 10, 90)/100)) return `O encontro foi constrangedor. Não rolou química com ${c.npc.first}.` + fx({happiness:-2});
        const old = partner();
        if (old){ old.rel = clamp(old.rel - 30); remember_npc(old, "Descobriu uma traição"); if (chance(0.55)){ if (old.role==="spouse") divorce(old, true); else { old.role = "ex"; } return `Comecei a sair com ${c.npc.first}… e ${old.first} descobriu. Acabou.` + fx({happiness:-8}); } }
        if (!partner()){ c.npc.role = "partner"; c.npc.rel = rint(55,75); remember_npc(c.npc, "Primeiro encontro"); S.rels.push(c.npc); log(`Comecei a namorar ${c.npc.first} ${c.npc.last}. 💕`, "good"); return `Que noite! Você e ${c.npc.first} estão namorando.` + fx({happiness:10}); }
        return `Saímos escondido. Ninguém soube… por enquanto.` + fx({happiness:4}) + (addStress(8), "");
      } },
    { label:"📱 Pegar o contato, sem compromisso", run:()=>{ c.npc.role = "friend"; c.npc.rel = rint(30,50); remember_npc(c.npc, "Trocamos contato"); S.rels.push(c.npc); return `Agora ${c.npc.first} está nos seus contatos.`; } },
    investigateChoice("ev_approach_date"),
    { label:"✋ Recusar educadamente", run:()=> "Agradeci, mas não." },
  ]},
{ id:"ev_approach_friend", emoji:"🤝", title:"Nova amizade?", age:[6,90], weight:()=> S.rels.filter(r=>r.role==="friend"&&r.alive).length < 5 ? 1.4 : 0.3, cd:1,
  setup:()=>({ npc: approachNPC("friend", { age: Math.max(5, P().age + rint(-3,4)) }), line: approachLine("friend") }),
  speech:c=> P().age < 13 ? "Quer brincar comigo?" : c.line,
  text:c=> `${c.npc.first} quer se aproximar de você.`,
  choices:c=>[
    { label:"😄 Aceitar a amizade", run:()=>{ c.npc.rel = rint(45,70); remember_npc(c.npc, "Viramos amigos"); S.rels.push(c.npc); log(`Fiz amizade com ${c.npc.first} ${c.npc.last}.`, "good"); return `Você e ${c.npc.first} viraram amigos.` + fx({happiness:4}); } },
    investigateChoice("ev_approach_friend"),
    ignoreChoice("Manter distância"),
  ]},
{ id:"ev_crime_invite", emoji:"🕶️", title:"Proposta indecente", age:[15,70], weight:()=> !S.org && !inPrison() && (P().notoriety > 12 || S.money < priceOf(800) || S.crimeSkill > 10) ? 1.2 : 0.15, cd:4,
  setup:()=>({ npc: approachNPC("acquaintance", { personality: pick(["schemer","greedy","ambitious","loyal"]), wealth: rint(2,4) }), org: pick(DATA.orgNames), line: approachLine("crime") }),
  speech:c=> c.line,
  text:c=> `${c.npc.first}, ligado(a) à ${c.org}, quer te recrutar.`,
  choices:c=>[
    { label:"🕶️ Entrar para a organização", hint:"renda suja, calor policial, difícil de sair", run:()=> joinOrg(c.org).msg },
    { label:"💼 Fazer só um serviço", hint:"um contrabando, uma vez só", run:()=>{
        S.stats.crimes++;
        if (chance(0.55 + S.crimeSkill/300)){ const g = priceOf(rint(3000, 15000)); S.dirty += g; S.stats.crimesOk++; S.stats.dirtyEarned += g; S.crimeSkill = clamp(S.crimeSkill+3); addNoto(6); emit("crime"); return `Serviço feito. ${fmt(g)} em dinheiro sujo na mão.`; }
        addNoto(10); emit("siren");
        if (P().age >= 18 && chance(0.6)){ sendToPrison(rint(1,4), "participação em contrabando"); return "Era uma armadilha da polícia. Fui preso(a)."; }
        return "Deu ruim, larguei a carga e saí correndo." + fx({happiness:-5});
      } },
    investigateChoice("ev_crime_invite"),
    { label:"🚔 Denunciar à polícia", hint:"karma, mas pode haver retaliação", run:()=>{ P().karma = clamp(P().karma+10); addRep(3); if (chance(0.25)) return "Denunciei. Dias depois, picharam ameaças no meu muro." + fx({happiness:-6}) + (addStress(12), ""); return "Denunciei. A polícia agradeceu o informe."; } },
    { label:"✋ Recusar", run:()=> `"Tá bom, mané. Se mudar de ideia, sabe onde me achar."` },
  ]},
{ id:"ev_partnership", emoji:"📊", title:"Proposta de sociedade", age:[22,75], weight:()=> S.money > priceOf(30000) ? 1 : 0, cd:5,
  setup:()=>{ const d = pick(DATA.businesses.filter(b=>!b.needs)); return { npc: approachNPC("acquaintance", { wealth: rint(1,3) }), biz: d.id, amt: Math.round(priceOf(d.cost)*0.6), line: approachLine("partner") }; },
  speech:c=> c.line,
  text:c=> `${c.npc.first} quer abrir ${byId(DATA.businesses,c.biz).name.toLowerCase()} e pede ${fmt(c.amt)} por 50% do negócio.`,
  choices:c=>[
    { label:"🤝 Aceitar a sociedade (50%)", run:()=> partnerBusiness(c, 0.5) },
    { label:"💬 Negociar 65% para mim", hint:"pode desistir", run:()=> chance(0.55) ? partnerBusiness(c, 0.65) : `${c.npc.first} achou abusivo e desistiu.` },
    investigateChoice("ev_partnership"),
    { label:"✋ Recusar", run:()=> "Prefiro não misturar amizade e dinheiro." },
  ]},
{ id:"ev_conflict", emoji:"😠", title:"Treta na rua", age:[14,85], weight:1, cd:3,
  setup:()=>({ npc: approachNPC("acquaintance", { personality:"hothead" }), line: approachLine("conflict") }),
  speech:c=> c.line,
  text:c=> `${c.npc.first}, ${c.npc.age} anos, está claramente procurando briga.`,
  choices:c=>[
    { label:"🗣️ Tentar acalmar", run:()=> chance(0.55 + (hasTrait("charismatic")?0.2:0)) ? "No fim, a gente até riu da situação." : "Não adiantou: levei um empurrão e um xingamento." + fx({happiness:-3}) },
    { label:"👊 Partir pra cima", hint:"abre o combate", run:()=>{ startFight("street", { npc:c.npc }); return `Fechei o punho e fui pra cima de ${c.npc.first}.`; } },
    { label:"🚓 Chamar a polícia", run:()=> "A viatura chegou e dispersou a confusão." },
    ignoreChoice("Ignorar e ir embora"),
  ]},
{ id:"ev_job_approach", emoji:"📨", title:"Um recrutador te procurou", age:[20,62], weight:()=> P().reputation > 55 && !inPrison() ? 1 : 0.2, cd:4,
  setup:()=>{ const opts = DATA.careers.filter(c => !jobEligibility(c) && !c.elected); const c = opts.length ? pick(opts) : null; return { npc: approachNPC("acquaintance", { job:"Recrutador(a)" }), career: c?.id, line: approachLine("job") }; },
  cond:()=> true,
  speech:c=> c.line,
  text:c=> c.career ? `Vaga: ${byId(DATA.careers,c.career).levels[0].t} (${fmt(salaryFor(byId(DATA.careers,c.career),0))}/ano).` : "Infelizmente a vaga não combina com seu perfil.",
  choices:c=>[
    { label:"✅ Aceitar entrevista facilitada", hint:"+25% de chance", run:()=> c.career ? applyJob(c.career, { bonus:0.25 }).msg : "Sem vaga." },
    { label:"💰 Negociar salário maior", hint:"+10% salário, chance menor", run:()=> c.career ? applyJob(c.career, { bonus:0.05, raise:0.1 }).msg : "Sem vaga." },
    investigateChoice("ev_job_approach"),
    ignoreChoice("Não tenho interesse"),
  ]},
);
/* Sociedade: cria negócio com participação; sócio interesseiro pode sumir com o dinheiro. */
function partnerBusiness(c, share){
  if (!canAfford(c.amt)) return "Você não tem esse dinheiro disponível.";
  addMoney(-c.amt);
  const d = byId(DATA.businesses, c.biz), p = byId(DATA.personalities, c.npc.personality);
  if (p.scam && chance(p.scam)){ remember(`${c.npc.first} sumiu com ${fmt(c.amt)} do "negócio".`, "bad"); addStress(10); return `${c.npc.first} sumiu com o dinheiro. Era golpe.` + fx({happiness:-10}); }
  S.businesses.push({ uid:uid(), id:d.id, country:P().country, name:`${d.name} ${c.npc.last} & ${P().last}`, value:Math.round(c.amt/share*0.8*share),
    revenue:Math.round(priceOf(d.revenue)*rfloat(0.4,0.8)*share), years:0, lastProfit:0, share, partner:c.npc.first });
  c.npc.role = "friend"; c.npc.rel = 55; remember_npc(c.npc, "Sócio(a) em um negócio"); S.rels.push(c.npc);
  log(`🤝 Abri ${d.name} em sociedade com ${c.npc.first} (${Math.round(share*100)}% meu).`, "milestone");
  return `Sociedade fechada: ${Math.round(share*100)}% de ${d.name}.`;
}
