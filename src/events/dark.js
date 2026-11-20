"use strict";
/* =====================================================================
   events/dark.js — o lado sombrio (sempre pergunta ao jogador) e o
   mercado de colecionáveis.
   ===================================================================== */
EVENTS.push(
{ id:"ev_dark_awakening", emoji:"🌑", title:"Algo mudou em você", age:[18,90], weight:0, cond:()=> !dark().active && !inPrison(),
  speech:()=> "Você não sentiu culpa. Sentiu… calma. Isso deveria te assustar.",
  text:()=> "Depois do que aconteceu, uma voz fria passou a te acompanhar. O que fazer com ela?",
  choices:()=>[
    { label:"⚖️ Canalizar com um código: só quem escapou da justiça", hint:"abre o lado sombrio · impulso, suspeita e pistas", run:()=> awakenDark("code").msg },
    { label:"🩸 Sem código, sem limites", hint:"karma despenca", run:()=> awakenDark("none").msg },
    { label:"🧠 Procurar ajuda e enterrar isso", run:()=>{ addStress(-8); P().karma = clamp(P().karma + 6); return "Comecei terapia. A voz ficou mais baixa."; } },
  ]},
{ id:"ev_dark_urge", emoji:"🌘", title:"O impulso", age:[18,120], weight:0, cond:()=> dark().active && !inPrison(),
  speech:()=> say(pick(["Respira. Ninguém pode perceber.","Já faz tempo demais…","Sorria no trabalho. Só mais um dia."])),
  text:()=> `O impulso está em ${Math.round(dark().urge)}/100. Você mal dorme e anda irritado(a).`,
  choices:()=>[
    { label:"🎯 Planejar uma caçada", hint: huntBlock() || "abre o planejamento", run:()=>{ if (huntBlock()) return `Não dá agora: ${huntBlock().toLowerCase()}.`; S.flags.openHunt = true; return "Comecei a observar possíveis alvos."; } },
    { label:"🥊 Descarregar no treino de luta", run:()=>{ dark().urge = clamp(dark().urge - rint(8, 16)); S.health.exercised = true; return "Socos no saco de pancada até os dedos sangrarem. Ajudou um pouco."; } },
    { label:"🧠 Terapia intensiva", hint: fmt(priceOf(2500)), run:()=>{ const v = priceOf(2500); if (!canAfford(v)) return "Sem dinheiro para terapia."; addMoney(-v); dark().urge = clamp(dark().urge - rint(15, 30)); return "Falei sem falar demais. A pressão aliviou."; } },
  ]},
{ id:"ev_dark_suspicion", emoji:"👀", title:"Perguntas demais", age:[18,120], weight:0, cond:()=> dark().active && !inPrison(),
  setup:()=>{ const close = S.rels.filter(r => r.alive && ["partner","spouse","sibling","friend","mother","father"].includes(r.role)); const r = close.length ? pick(close) : null; return { uid:r?.uid, who: r ? r.first : "Um colega de trabalho" }; },
  speech:c=> say(pick(["Onde você estava aquela noite? Você chegou com a roupa molhada…","Você anda estranho(a). Tá escondendo alguma coisa de mim?","Achei umas coisas esquisitas no porta-malas…"])),
  text:c=> `${c.who} está desconfiando de você. Suspeita policial atual: ${Math.round(dark().heat)}.`,
  choices:c=>[
    { label:"🎭 Mentir com naturalidade", hint:"inteligência e carisma ajudam", run:()=>{ if (chance(0.45 + P().stats.intelligence/300 + (hasTrait("charismatic") ? 0.15 : 0))){ dark().heat = clamp(dark().heat - 5); return `${c.who} acreditou. Por enquanto.`; } dark().heat = clamp(dark().heat + 12); const r = relBy(c.uid); if (r) r.rel = clamp(r.rel - 15); return "A mentira não colou. A desconfiança cresceu."; } },
    { label:"🤫 Confessar só para essa pessoa", hint:"lealdade decide", run:()=>{ const r = relBy(c.uid), per = r && byId(DATA.personalities, r.personality); if (r && per && (per.id === "loyal" || r.rel > 85) && chance(0.6)){ r.rel = clamp(r.rel + 5); remember_npc(r, "Guarda meu segredo mais sombrio"); dark().heat = clamp(dark().heat - 10); return `${r.first} chorou… e prometeu guardar segredo.`; } dark().heat = clamp(dark().heat + 35); if (r) r.rel = 0; return "Foi direto para a polícia."; } },
    { label:"🚪 Me afastar dessa pessoa", run:()=>{ const r = relBy(c.uid); if (r){ r.rel = clamp(r.rel - 25); } addStat("happiness", -5); return "Cortei contato. Mais solidão, menos risco."; } },
  ]},
{ id:"ev_task_force", emoji:"🕵️", title:"Força-tarefa", age:[18,120], weight:0, cond:()=> dark().active && !inPrison(),
  speech:()=> say("A imprensa já chama de \"o caso dos desaparecidos\". A gente vai pegar esse filho da puta."),
  text:()=> `A polícia criou uma força-tarefa. Suspeita: ${Math.round(dark().heat)} · pistas acumuladas: ${dark().clues}.`,
  choices:()=>[
    { label:"🧊 Ficar quieto(a) e viver normal", hint:"impulso sobe, suspeita cai", run:()=>{ dark().heat = clamp(dark().heat - 20); dark().urge = clamp(dark().urge + 15); return "Rotina impecável. Família, trabalho, sorrisos."; } },
    { label:"🧩 Plantar um suspeito", hint:"inteligência · arriscado", run:()=>{ if (chance(0.3 + P().stats.intelligence/250)){ dark().heat = clamp(dark().heat - 45); P().karma = clamp(P().karma - 20); return "A polícia prendeu outra pessoa. O caso foi \"encerrado\"."; } dark().heat = clamp(dark().heat + 25); dark().clues++; return "A armação foi descoberta. Agora eles têm certeza de que alguém está brincando com eles."; } },
    { label:"✈️ Fugir do país", run:()=>{ const from = P().country, d = pick(DATA.countries.filter(x => x.id !== from)); emigrate(d.id, true); dark().heat = clamp(dark().heat - 50); return `Recomecei em ${d.name}. Mas pistas não têm fronteira.`; } },
    { label:"🙋 Me entregar", run:()=>{ const pen = DATA.penal[P().country] || { max:40 }; dark().active = false; P().karma = clamp(P().karma + 10); sendToPrison(Math.max(15, Math.round(pen.max*0.7)), "assassinatos em série (réu confesso)", "máxima"); return "Entrei na delegacia e contei tudo."; } },
  ]},
{ id:"ev_collector_offer", emoji:"🧐", title:"Um colecionador bateu à porta", age:[18,120], weight:0, cond:()=> collection().length > 0,
  setup:()=>{ const c = pick(collection()); return { uid:c.uid, mult: rfloat(1.15, 1.6) }; },
  speech:()=> "Procuro essa peça há anos. Faço uma oferta que você não vai recusar.",
  text:c=>{ const it = collection().find(x => x.uid === c.uid); return it ? `Ele quer ${byId(DATA.collectibles, it.id).name} por ${fmt(fxConv(Math.round(it.value*c.mult), it.country))}.` : "A peça já não está com você."; },
  choices:c=>[
    { label:"🤝 Vender", run:()=>{ const it = collection().find(x => x.uid === c.uid); if (!it) return "A peça já não existe."; const d = byId(DATA.collectibles, it.id); if (it.fake && chance(0.7)) { S.collection = S.collection.filter(x => x !== it); addRep(-8); return "O perito dele viu que era falsa. Fiquei com fama de golpista."; } const v = fxConv(Math.round(it.value*c.mult), it.country); S.collection = S.collection.filter(x => x !== it); addMoney(v); S.stats.earned += v; return `Vendi ${d.name} por ${fmt(v)}.`; } },
    { label:"💬 Pedir mais", run:()=> chance(0.4) ? (c.mult += 0.25, "Ele subiu a oferta… mas pediu um dia para pensar.") : "Ele se ofendeu e foi embora." },
    { label:"✋ Não está à venda", run:()=> "Algumas coisas valem mais que dinheiro." },
  ]},
);
