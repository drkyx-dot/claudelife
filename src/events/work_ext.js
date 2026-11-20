"use strict";
/* =====================================================================
   events/work_ext.js — eventos do trabalho autônomo (inclusive adulto,
   sem conteúdo explícito) e da carreira esportiva.
   ===================================================================== */
EVENTS.push(
/* ---------- Autônomo ---------- */
{ id:"ev_gig_bigclient", emoji:"💼", title:"Cliente grande", age:[14,99], weight:0, cond:()=>!!S.gig,
  setup:()=>({ amt: Math.round(gigIncome() * rfloat(0.3, 0.8)) + priceOf(500) }),
  speech:()=> "Gostei do seu trabalho. Tenho um projeto grande, mas o prazo é apertado.",
  text:c=> `Um cliente oferece ${fmt(c.amt)} por um trabalho urgente.`,
  choices:c=>[
    { label:"✅ Aceitar e virar noites", hint:"+estresse", run:()=>{ addMoney(c.amt); S.stats.earned += c.amt; addStress(12); S.gig.audience += rint(5, 20); S.gig.rating = clamp(S.gig.rating + 5, 30, 100); return `Entreguei no prazo. +${fmt(c.amt)} e um cliente fiel.`; } },
    { label:"💬 Negociar mais prazo", run:()=> chance(0.6) ? (addMoney(Math.round(c.amt*0.9)), `Fechado com prazo melhor: ${fmt(Math.round(c.amt*0.9))}.`) : "O cliente procurou outra pessoa." },
    { label:"✋ Recusar", run:()=> "Hoje não. Saúde mental em primeiro lugar." + (addStress(-3), "") },
  ]},
{ id:"ev_gig_noshow", emoji:"🧾", title:"Calote de cliente", age:[14,99], weight:0, cond:()=>!!S.gig,
  setup:()=>({ amt: Math.round(gigIncome() * rfloat(0.08, 0.2)) + priceOf(200) }),
  text:c=> `Um cliente sumiu sem pagar ${fmt(c.amt)}.`,
  choices:c=>[
    { label:"⚖️ Cobrar na Justiça (pequenas causas)", run:()=> chance(0.55) ? (addMoney(c.amt), "Ganhei a causa e recebi.") : "Processo arquivado: nunca vi o dinheiro." + fx({happiness:-3}) },
    { label:"📣 Expor o caloteiro nas redes", run:()=>{ S.gig.audience += rint(5, 30); return chance(0.3) ? "Viralizou e ele pagou correndo." + fx({money:c.amt}) : "Ganhei seguidores, mas nada de dinheiro."; } },
    { label:"🙈 Deixar pra lá", run:()=>{ addMoney(-0); addStress(4); return "Prejuízo assumido."; } },
  ]},
{ id:"ev_gig_viral", emoji:"🚀", title:"Viralizou!", age:[12,99], weight:0, cond:()=>!!S.gig,
  text:()=> "Um vídeo seu explodiu. Milhões de visualizações em dois dias.",
  choices:()=>[
    { label:"📈 Aproveitar a onda (publicar todo dia)", run:()=>{ S.gig.audience = Math.round(S.gig.audience * rfloat(1.8, 3.5) + 200); addFame(rint(5, 12)); addStress(8); return "Seguidores choveram."; } },
    { label:"🤝 Fechar contrato com uma marca", run:()=>{ const v = priceOf(rint(3000, 25000)); addMoney(v); addFame(4); return `Patrocínio de ${fmt(v)}.`; } },
  ]},
{ id:"ev_gig_robbery", emoji:"🔫", title:"Corrida perigosa", age:[18,99], weight:0, cond:()=>!!S.gig && !inPrison(),
  speech:()=> say("Perdeu, perdeu! Passa o celular e a chave, porra!"),
  text:()=> "O passageiro anunciou um assalto no meio da corrida.",
  choices:()=>[
    { label:"🙌 Entregar tudo", run:()=>{ const v = Math.min(Math.max(0,S.money), priceOf(rint(300, 1500))); addMoney(-v); addStress(12); return `Levaram ${fmt(v)} e o celular. Fiquei dias sem dirigir.`; } },
    { label:"👊 Reagir", hint:"abre o combate · assaltante armado", run:()=>{ startFight("robbery", { amt: priceOf(800) }); return "Travei o carro e parti pra cima."; } },
  ]},
/* ---------- Adulto (não explícito) ---------- */
{ id:"ev_adult_exposed", emoji:"📱", title:"Exposto(a)", age:[18,99], weight:0, cond:()=> !!S.gig && gigDef(S.gig.id).adult,
  speech:()=> say(pick(["Mano, olha quem eu achei naquele site…","Vazaram umas fotos suas no grupo da família.","Tão compartilhando seu perfil no trabalho."])),
  text:()=> "Seu trabalho adulto vazou para pessoas que você conhece.",
  choices:()=>[
    { label:"💪 Assumir publicamente, sem vergonha", run:()=> adultExposure(true) },
    { label:"🤫 Negar e apagar o que der", run:()=> adultExposure(false) },
    { label:"🚪 Parar com o trabalho adulto", run:()=>{ const r = adultExposure(false, 0.5); stopGig(); return r + " Encerrei o perfil."; } },
  ]},
{ id:"ev_escort_danger", emoji:"⚠️", title:"Cliente perigoso", age:[18,99], weight:0, cond:()=> S.gig?.id === "escort" && !inPrison(),
  speech:()=> say("Você vai fazer o que eu mandar, entendeu?"),
  text:()=> "Um cliente ficou agressivo e se recusa a deixar você ir embora.",
  choices:()=>[
    { label:"🏃 Fugir na primeira chance", run:()=> chance(0.65) ? "Consegui sair e chamei um carro." + (addStress(15), "") : "Ele me segurou antes da porta." + injure(rint(8, 20), "Um cliente violento", 0.3) },
    { label:"🥊 Me defender", hint:"abre o combate", run:()=>{ startFight("robbery", { amt:0 }); return "Não vou apanhar calado(a)."; } },
    { label:"📞 Acionar o botão de pânico / polícia", run:()=>{ const law = DATA.escortLaw[P().country]; if (law === "ilegal" && chance(0.4)){ const fine = priceOf(rint(500, 2000)); addMoney(-Math.min(Math.max(0,S.money), fine)); S.record.push({ crime:"prostituição", age:P().age, years:0 }); return `A polícia veio — e me autuou também. Multa de ${fmt(fine)}.`; } return "A polícia chegou rápido. O cliente foi preso."; } },
  ]},
{ id:"ev_escort_regular", emoji:"💎", title:"Cliente fixo rico", age:[18,99], weight:0, cond:()=> S.gig?.id === "escort",
  setup:()=>({ amt: priceOf(rint(8000, 40000)) }),
  speech:()=> "Quero exclusividade. Pago bem — e com discrição.",
  text:c=> `Um cliente rico oferece ${fmt(c.amt)} por um acordo exclusivo de um ano.`,
  choices:c=>[
    { label:"🤝 Aceitar a exclusividade", run:()=>{ addMoney(c.amt); S.stats.earned += c.amt; S.gig.exposure = clamp(S.gig.exposure - 10); return `Ano mais tranquilo e ${fmt(c.amt)} na conta.`; } },
    { label:"✋ Recusar: prefiro minha independência", run:()=> "Recusei. Ninguém manda em mim." },
  ]},
{ id:"ev_escort_police", emoji:"🚓", title:"Batida policial", age:[18,99], weight:0, cond:()=> S.gig?.id === "escort" && !inPrison(),
  speech:()=> say("Polícia! Documentos, todo mundo!"),
  text:()=> `Neste país (${country().name}), o trabalho sexual é crime. A polícia te abordou.`,
  choices:()=>[
    { label:"💵 Pagar a multa / fiança", run:()=>{ const v = priceOf(rint(800, 3000)); addMoney(-Math.min(Math.max(0,S.money), v)); S.record.push({ crime:"prostituição", age:P().age, years:0 }); addRep(-6); return `Paguei ${fmt(v)}. Fiquei com ficha.`; } },
    { label:"🏃 Fugir", run:()=> chance(0.5) ? "Escapei pela janela do banheiro." : (sendToPrison(1, "prostituição e resistência"), "Fui pego(a). Detido(a) por resistência.") },
  ]},
/* ---------- Esportes ---------- */
{ id:"ev_sport_contract", emoji:"✍️", title:"Fim de contrato", age:[14,60], weight:0, cond:()=> isAthlete(),
  text:c=> `Seu contrato com o ${S.job.club} acabou. Sua forma: ${c.form}/100.`,
  speech:()=> "Temos propostas na mesa. A decisão é sua.",
  choices:c=>[
    { label:`🏠 Renovar com o ${S.job.club}`, hint:`${c.renew.years} anos · salário ×${c.renew.mult.toFixed(2)}`, run:()=> signContract(null, c.renew.mult, c.renew.years) },
    ...(c.big ? [{ label:`🚀 Transferência para o ${c.big.club}`, hint:`clube maior · ×${c.big.mult.toFixed(2)} · ${c.big.years} anos`, run:()=>{ addStat("happiness", 6); return signContract(c.big.club, c.big.mult, c.big.years); } }] : []),
    ...(c.abroad ? [{ label:`✈️ Proposta do exterior: ${c.abroad.club}`, hint:`×${c.abroad.mult.toFixed(2)} · longe da família`, run:()=>{ for (const r of S.rels.filter(x=>["mother","father","partner","spouse"].includes(x.role))) r.rel = clamp(r.rel - 6); addStat("happiness", -3); return signContract(c.abroad.club, c.abroad.mult, c.abroad.years); } }] : []),
    { label:"🆓 Ficar livre no mercado", run:()=>{ S.job.contract = 1; S.job.contractMult = 0.8; return "Vou esperar uma proposta melhor (salário menor enquanto isso)."; } },
  ]},
{ id:"ev_sport_retire", emoji:"👟", title:"Pendurar as chuteiras?", age:[14,80], weight:0, cond:()=> isAthlete(),
  text:c=> c.forced ? "O corpo não aguenta mais o alto nível. É hora de parar." : "Seu corpo dá sinais de cansaço. Os clubes oferecem contratos menores.",
  speech:()=> say("Foi uma carreira linda, mas todo mundo tem seu tempo."),
  choices:c=>[
    ...(c.forced ? [] : [{ label:"💪 Jogar mais uma temporada", run:()=>{ S.job.contract = 1; S.job.contractMult = Math.max(0.5, num(S.job.contractMult,1)*0.75); return "Mais um ano. Pelo amor ao esporte."; } }]),
    { label:"📋 Aposentar e virar técnico(a)", run:()=>{ S.flags.exAthlete = true; achieve("retiredpro", "Aposentadoria do esporte profissional"); return hireDirect("coach", S.job.level >= 2 ? 1 : 0); } },
    { label:"🎙️ Aposentar e virar comentarista", run:()=>{ S.flags.exAthlete = true; return hireDirect("commentator", P().fame > 40 ? 1 : 0); } },
    { label:"🔎 Aposentar e virar olheiro(a)", run:()=>{ S.flags.exAthlete = true; return hireDirect("scout", 0); } },
    { label:"🏖️ Só aposentar", run:()=>{ S.flags.exAthlete = true; endJob("Aposentadoria esportiva"); log("👟 Encerrei minha carreira de atleta.", "milestone"); return "Fim de uma era."; } },
  ]},
);
/* Exposição de trabalho adulto: relações, emprego formal e reputação. */
function adultExposure(owned, mult = 1){
  const p = P(); let msg = [];
  addRep(-12 * mult); addStress(14 * mult);
  if (owned){ addFame(5); S.gig.audience = Math.round(S.gig.audience * 1.4); S.gig.exposure = 0; addStat("happiness", 2); msg.push("Muita gente julgou, mas meus assinantes aumentaram."); }
  else { S.gig.exposure = clamp(S.gig.exposure - 30); msg.push("Apaguei o que pude. O estrago já estava feito."); }
  for (const r of S.rels.filter(x => x.alive && ["mother","father","partner","spouse","fiance","sibling"].includes(x.role))){
    const per = byId(DATA.personalities, r.personality); const ok = per && ["calm","generous","funny"].includes(per.id) && chance(0.6);
    r.rel = clamp(r.rel - (ok ? 3 : rint(12, 30)) * mult); if (!ok) remember_npc(r, "Ficou sabendo do meu trabalho adulto");
  }
  const pt = partner(); if (pt && pt.rel < 30 && chance(0.5)){ if (pt.role === "spouse") divorce(pt, true); else pt.role = "ex"; msg.push(`${pt.first} terminou comigo.`); }
  if (S.job && (career().exam || career().cleanRecord || /Educação|Saúde|Serviço Público|Justiça/.test(career().sector)) && chance(0.5 * mult)){ endJob("Demitido(a) após exposição"); msg.push("Meu emprego formal me demitiu \"por conduta\"."); addStat("happiness", -8); }
  log(`📱 Meu trabalho adulto foi exposto. ${msg.join(" ")}`, "bad");
  return msg.join(" ");
}
