"use strict";
/* =====================================================================
   events/combat.js — eventos de luta, homicídio, prisão e fuga.
   Toda briga abre o modal de combate (startFight); toda fuga abre o
   minigame (startEscape). Os eventos sempre perguntam ao jogador.
   ===================================================================== */
EVENTS.push(
/* Desafio num bar: alguém quer brigar com você */
{ id:"ev_fight_challenge", emoji:"🍺", title:"Desafio no bar", age:[16,70], weight:()=> (P().notoriety > 20 || bestMastery() > 30 ? 0.9 : 0.4) * country().crime, cd:3, cond:()=>!inPrison(),
  setup:()=>({ npc: approachNPC("acquaintance", { personality: pick(["hothead","hothead","ambitious","schemer"]) }) }),
  speech:()=> say(pick(["Tá olhando o quê, porra? Vamos resolver lá fora.","Ouvi dizer que você é bom de briga. Prova.","Você esbarrou em mim, mané. Vai pedir desculpa ou vai apanhar?"])),
  text:c=> `${c.npc.first}, ${c.npc.age} anos, já bebeu demais e quer briga.`,
  choices:c=>[
    { label:"🥊 Aceitar a briga", hint:"abre o combate", run:()=>{ startFight("street", { npc:c.npc }); return `Fui lá pra fora com ${c.npc.first}.`; } },
    { label:"🗣️ Desarmar com conversa", run:()=> chance(0.5 + (hasTrait("charismatic")?0.2:0)) ? "Paguei uma cerveja e virou papo de boteco." : "Não colou. Saí do bar debaixo de xingamento." + fx({happiness:-3}) },
    investigateChoice("ev_fight_challenge"),
    ignoreChoice("Pagar a conta e ir embora"),
  ]},
/* Promotor de lutas: convite para torneio quando há maestria */
{ id:"ev_tournament_invite", emoji:"📣", title:"Convite para competir", age:[16,45], weight:()=> bestMastery() >= 25 ? 1.1 : 0, cd:2, cond:()=>!inPrison() && !!bestArt(),
  setup:()=>{ const art = bestArt(), m = mastery(art), t = [...DATA.tournaments].reverse().find(t => m >= t.minM) || DATA.tournaments[0];
    return { npc: approachNPC("acquaintance", { job:"Promotor(a) de lutas", personality: pick(["ambitious","greedy","calm"]) }), art, tid:t.id }; },
  speech:c=> `Tenho visto você treinar. Tem vaga no ${byId(DATA.tournaments,c.tid).name}. Topa?`,
  text:c=> { const t = byId(DATA.tournaments,c.tid); return `${t.emoji} ${t.name} · ${t.fights} luta(s) · prêmio até ${fmt(priceOf(t.prize[1]))} · modalidade ${byId(DATA.martialArts,c.art).name}.`; },
  choices:c=>[
    { label:"🥊 Aceitar e lutar", hint: tournamentBlock(byId(DATA.tournaments,c.tid), c.art) || "abre o combate", run:()=>{ const t = byId(DATA.tournaments,c.tid), why = tournamentBlock(t, c.art); if (why) return `Não deu: ${why}.`; if (adult()) addMoney(-priceOf(t.fee)); startFight("tournament", { tid:t.id, art:c.art, idx:0 }); return `Subi no ringue do ${t.name}.`; } },
    investigateChoice("ev_tournament_invite"),
    { label:"✋ Recusar", run:()=> "Ainda não é a minha hora." },
  ]},
/* Vingança da família/aliados de alguém que você matou */
{ id:"ev_revenge", emoji:"🩸", title:"Vingança", age:[12,120], weight:0, cond:()=>!inPrison(),
  speech:c=> say(`Você matou ${c.name}. Achou que ia ficar por isso mesmo, desgraçado(a)?`),
  text:c=> `${c.kin[0].toUpperCase() + c.kin.slice(1)} de ${c.name} te encontrou.`,
  choices:c=>[
    { label:"🥊 Encarar", hint:"abre o combate · eles vêm para matar", run:()=>{ startFight("revenge", { victim:c.name }); return "Não vou correr."; } },
    { label:"💵 Oferecer dinheiro pela paz", hint:`${fmt(priceOf(15000))}`, run:()=>{ const v = priceOf(15000); if (!canAfford(v)) return "Não tinha o dinheiro. Levei uma surra e um aviso." + injure(rint(10,20), "A surra da vingança", 0.3); addMoney(-v); return chance(0.6) ? "Aceitaram. Mas o ódio continua no olhar." : (schedule("victimRevenge", rint(2,4), c), "Pegaram o dinheiro… e prometeram voltar."); } },
    { label:"🏃 Fugir e sumir por um tempo", run:()=>{ addStress(10); schedule("victimRevenge", rint(2,5), c); return "Escapei por hoje. Eles vão continuar procurando."; } },
    { label:"🚓 Pedir proteção à polícia", hint:"eles vão fazer perguntas", run:()=>{ addNoto(5); if (chance(0.3)){ schedule("homicideCase", 1, { name:c.name, label:"homicídio", years:rint(8,15), p:0.5 }); return "A polícia me protegeu — e reabriu o caso da morte."; } return "Botaram uma viatura na porta por umas semanas."; } },
  ]},
/* Investigação de homicídio (consequência agendada) */
{ id:"ev_murder_probe", emoji:"🕵️", title:"Investigação de homicídio", age:[12,120], weight:0, cond:()=>!inPrison(),
  speech:()=> say("A gente sabe que você estava lá. Vai facilitar ou vai complicar?"),
  text:c=> `A Polícia Civil chegou em você pela morte de ${c.name}. Chance atual de condenação: ${Math.round(c.p*100)}%.`,
  choices:c=>[
    { label:"⚖️ Contratar advogado criminalista", hint:`${fmt(priceOf(25000))} · −35% de chance`, run:()=>{ const v = priceOf(25000); if (!canAfford(v)) return "Sem dinheiro para um bom advogado. A defensoria fez o que pôde." + murderTrial(c, 0); addMoney(-v); return "Meu advogado desmontou metade das provas." + murderTrial(c, 0.35); } },
    { label:"🤝 Confessar (pena reduzida)", run:()=>{ const y = Math.max(2, Math.round(c.years*0.6)); P().karma = clamp(P().karma+12); addStress(-10); sendToPrison(y, c.label + " (réu confesso)"); return `Confessei. ${y} anos, mas a consciência ficou um pouco mais leve.`; } },
    { label:"💵 Comprar o silêncio das testemunhas", hint:"dinheiro sujo · pode virar mais um crime", run:()=>{ const v = priceOf(20000); if (S.dirty < v) return "Não tinha dinheiro sujo bastante." + murderTrial(c, 0); S.dirty -= v; if (chance(0.25)){ addNoto(15); return "Uma testemunha gravou a oferta." + murderTrial({ ...c, years:c.years+4 }, -0.2); } return "As testemunhas \"esqueceram\" o que viram." + murderTrial(c, 0.5); } },
    { label:"✈️ Fugir do país antes do indiciamento", run:()=>{ const dest = pick(DATA.countries.filter(x=>x.id!==P().country)); if (chance(0.6)){ const from = P().country; emigrate(dest.id, true); S.wanted = { since:P().age, remaining:c.years, crime:c.label, fakeId:false, country:from, years:0, security:"máxima" }; return `Fugi para ${dest.name}. Tenho mandado de prisão internacional nas costas.`; } sendToPrison(c.years + 3, c.label + " + tentativa de fuga"); return "Fui preso(a) no aeroporto."; } },
    { label:"🙅 Negar tudo", run:()=> "Fiquei calado(a)." + murderTrial(c, 0) },
  ]},
/* Contrato de execução (crime organizado) */
{ id:"ev_hit_contract", emoji:"🎯", title:"Um contrato", age:[18,70], weight:()=> S.org && S.org.rank >= 1 ? 0.7 : 0, cd:3, cond:()=>!!S.org && !inPrison(),
  setup:()=>({ npc: approachNPC("acquaintance", { personality:"schemer", wealth:4 }), target: genName(country(), chance(0.8)?"M":"F"), pay: priceOf(rint(20000, 80000)), cop: chance(0.15) }),
  speech:()=> say("Tem um cara atrapalhando os negócios. Quero ele fora do caminho. Definitivamente."),
  text:c=> `${c.npc.first} oferece ${fmt(c.pay)} (sujo) para eliminar ${c.target.first} ${c.target.last}.`,
  choices:c=>[
    { label:"🎯 Aceitar o serviço", hint:"abre o combate · intenção de matar", run:()=>{ if (c.cop && chance(0.5)){ sendToPrison(rint(8,15), "tentativa de homicídio (flagrante armado)", "máxima"); return "O \"alvo\" era policial disfarçado. Era uma armadilha."; } startFight("hit", { pay:c.pay, npc:{ first:c.target.first, last:c.target.last, age:rint(25,60), personality:pick(DATA.personalities).id } }); return `Esperei ${c.target.first} sair de casa.`; } },
    { label:"🔍 Levantar a ficha do alvo", hint:"gasta 1 de energia", run:()=>{ if (!spendEnergy()) return "Sem energia para investigar."; S.queue.splice(1, 0, { id:"ev_hit_contract", ctx:{ ...c, revealed:true } }); return c.cop ? "⚠️ O alvo tem ligação com a polícia. Cheiro de armadilha." : `${c.target.first} é só um comerciante com dívidas com a gente.`; } },
    { label:"✋ Recusar", hint:"respeito na organização cai", run:()=>{ S.org.respect = clamp(S.org.respect - 6); return say("\"Achei que você tinha estômago. Me enganei.\""); } },
  ]},
/* ---------- Prisão ---------- */
{ id:"ev_prison_fight", emoji:"🔪", title:"Acerto no pátio", age:[0,120], weight:0, prison:true,
  setup:()=>({ npc:{ first: genName(country(),"M").first, last:"", age:rint(20,50), personality: pick(["hothead","schemer","ambitious"]), nick: pick(["Caveira","Tanque","Magrelo","Bigode","Neguinho","Alemão","Gordo","Tatu"]) } }),
  speech:c=> say(pick(["Aqui quem manda sou eu, ô novato. Passa tua marmita.","Você me deve respeito, porra. Vou te ensinar.","Ouvi que você anda falando de mim…"])),
  text:c=> `"${c.npc.nick}" e dois comparsas te cercaram no pátio.`,
  choices:c=>[
    { label:"🥊 Lutar", hint:"abre o combate · pode haver estilete", run:()=>{ startFight("prison", { npc:c.npc, attacked:true }); return "Encostei na parede e levantei a guarda."; } },
    { label:"🧾 Pagar \"proteção\"", hint:`${fmt(priceOf(600))}`, run:()=>{ const v = priceOf(600); if (!canAfford(v)) return "Sem dinheiro. Apanhei." + injure(rint(6,14), "A surra no pátio", 0.2); addMoney(-v); return "Paguei. Por enquanto, me deixam em paz." + fx({happiness:-3}); } },
    { label:"👮 Chamar os agentes", hint:"X-9 tem vida curta", run:()=>{ if (chance(0.4)){ addStress(15); return "Me tiraram do pavilhão… mas agora sou \"o X-9\"." + injure(rint(5,12), "A emboscada contra o X-9", 0.2); } return "Os agentes separaram. Fiquei marcado(a)."; } },
  ]},
{ id:"ev_escape_plan", emoji:"🗝️", title:"Plano de fuga", age:[0,120], weight:0, prison:true,
  setup:()=>({ npc:{ first: genName(country(),"M").first, last:"", age:rint(22,55), personality: pick(["schemer","loyal","calm"]), nick: pick(["Rato","Professor","Toupeira","Chave"]) } }),
  speech:()=> say("Mapeei a ronda dos guardas. Sei onde a câmera falha. Tá dentro?"),
  text:c=> `"${c.npc.nick}" tem um plano: com a ajuda dele, a fuga fica mais fácil (−1 de dificuldade).`,
  choices:c=>[
    { label:"🏃 Topar e fugir agora", hint: escapeBlock() || "minigame de fuga facilitado", run:()=>{ const r = startEscape(1); return r.msg; } },
    { label:"🐀 Delatar o plano à direção", hint:"reduz a pena, vira alvo", run:()=>{ if (S.prison) S.prison.years = Math.max(1, S.prison.years - 1); addStress(10); P().karma = clamp(P().karma - 5); if (chance(0.35)) return "Ganhei 1 ano de redução… e uma facada no banho." + injure(rint(8,18), "A vingança pela delação", 0.3); return "Ganhei 1 ano de redução da pena."; } },
    { label:"✋ Recusar", run:()=> "Prefiro cumprir minha pena em paz." },
  ]},
/* ---------- Foragido(a) ---------- */
{ id:"ev_fugitive", emoji:"🚨", title:"Vida de foragido(a)", age:[0,120], weight:0, cond:()=> !!S.wanted && !inPrison(),
  text:()=> `Você está foragido(a) há ${S.wanted.years} ano(s). Chance de recaptura este ano: ${Math.round(recaptureChance()*100)}%.${S.wanted.fakeId ? " Você usa identidade falsa." : ""}`,
  speech:()=> say("Vi teu rosto na TV, no Linha Direta… cê tem que sumir, mano."),
  choices:()=>[
    { label:"🪪 Comprar identidade falsa", hint:`${fmt(priceOf(9000))} · −55% de chance de recaptura`, run:()=> buyFakeId().msg },
    { label:"✈️ Fugir para outro país (coiote)", hint:`${fmt(priceOf(4000))} · −65% de chance de recaptura`, run:()=>{ const v = priceOf(4000); if (!canAfford(v)) return "Sem dinheiro para o coiote."; addMoney(-v); const dest = pick(DATA.countries.filter(x=>x.id!==P().country)); emigrate(dest.id, true); return `Cruzei a fronteira escondido(a). Agora vivo em ${dest.name}.`; } },
    { label:"🙋 Me entregar", hint:"pena restante + 1 ano", run:()=>{ const W = S.wanted; S.wanted = null; P().karma = clamp(P().karma+8); sendToPrison(W.remaining + 1, `${W.crime} (apresentou-se)`, W.security || "média"); return "Cansei de fugir. Me apresentei à polícia."; } },
    { label:"🤫 Ficar na moita", run:()=>{ addStress(4); return "Mudei o cabelo, troquei de bairro e não saí de casa."; } },
  ]},
);

/* Julgamento: p ajustado pela defesa (bonus reduz a chance de condenação). */
function murderTrial(c, bonus){
  const p = clamp((c.p - bonus) * 100, 3, 97) / 100;
  if (chance(p)){ sendToPrison(c.years, c.label, c.years >= 12 ? "máxima" : "média"); return ` Condenado(a) por ${c.label}: ${c.years >= 99 ? "prisão perpétua" : c.years + " anos"}.`; }
  remember(`O caso da morte de ${c.name} foi arquivado por falta de provas.`, "good");
  return " O juiz arquivou o caso por falta de provas.";
}
