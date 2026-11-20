"use strict";
/* =====================================================================
   events/identity.js — vivências da adolescência que moldam a
   orientação sexual (systems/identity.js) e a saída do armário.
   Tudo é escolha do jogador; nada é imposto.
   ===================================================================== */
const otherWord = (plural) => P().gender === "M" ? (plural ? "garotas" : "uma garota") : (plural ? "garotos" : "um garoto");
const sameWord  = (plural) => P().gender === "M" ? (plural ? "garotos" : "um garoto") : (plural ? "garotas" : "uma garota");

EVENTS.push(
{ id:"ev_id_crush", emoji:"💭", title:"Uma paixonite", age:[11,16], once:true, weight:()=> discovering() ? 2.2 : 0,
  text:()=> "Tem alguém da escola que não sai da sua cabeça. Seu coração dispara quando essa pessoa passa.",
  speech:()=> say("Por que eu fico tão nervoso(a) perto dessa pessoa?"),
  choices:()=>[
    { label:`💘 É ${otherWord()} da minha turma`, run:()=>{ leanIdentity({ other:2 }); return "Passei o recreio inteiro tentando puxar assunto."; } },
    { label:`💘 É ${sameWord()} da minha turma`, run:()=>{ leanIdentity({ same:2 }); return "Fiquei confuso(a), mas o sentimento era real."; } },
    { label:"💞 Para ser sincero(a), são duas pessoas — de gêneros diferentes", run:()=>{ leanIdentity({ both:1.5 }); return "O coração não segue regras."; } },
    { label:"😶 Não sinto isso por ninguém. Todo mundo exagera.", run:()=>{ leanIdentity({ none:2 }); return "Prefiro meus jogos e meus amigos."; } },
    { label:"🤐 Prefiro não pensar nisso agora", run:()=> "Guardei para mim." },
  ]},
{ id:"ev_id_dance", emoji:"🪩", title:"A dança lenta", age:[14,19], once:true, weight:()=> discovering() ? 1.8 : 0,
  text:()=> "Na festa de formatura, toca uma música lenta. Duas pessoas te chamam para dançar ao mesmo tempo.",
  choices:()=>[
    { label:`🕺 Dançar com ${otherWord()}`, run:()=>{ leanIdentity({ other:1.5 }); return "Foi bonito. Fiquei com um sorriso bobo a noite toda." + fx({happiness:4}); } },
    { label:`💃 Dançar com ${sameWord()}`, run:()=>{ leanIdentity({ same:1.5 }); return "Algo fez sentido naquele momento." + fx({happiness:4}); } },
    { label:"🌈 Tanto faz quem: o que importa é a pessoa", run:()=>{ leanIdentity({ pan:1.5, both:0.5 }); return "Dancei com as duas e me diverti muito." + fx({happiness:5}); } },
    { label:"🥤 Ficar no canto conversando com amigos", run:()=>{ leanIdentity({ none:1 }); return "Dança lenta não é a minha praia."; } },
  ]},
{ id:"ev_id_reflection", emoji:"📓", title:"Diário à noite", age:[15,21], once:true, weight:()=> discovering() ? 1.6 : 0,
  text:()=> "Você escreve no diário: o que realmente te atrai em alguém?",
  choices:()=>[
    { label:`✍️ Sinto atração por ${otherWord(true)}`, run:()=>{ leanIdentity({ other:2 }); return "Escrever ajudou a organizar a cabeça."; } },
    { label:`✍️ Sinto atração por ${sameWord(true)}`, run:()=>{ leanIdentity({ same:2 }); return "Foi a primeira vez que admiti isso, mesmo que só no papel."; } },
    { label:"✍️ Me atraio por mais de um gênero", run:()=>{ leanIdentity({ both:2 }); return "Nenhuma caixinha me cabe direito."; } },
    { label:"✍️ Me atraio por pessoas, não por gêneros", run:()=>{ leanIdentity({ pan:2.5 }); return "Gênero nunca foi o que me chamou atenção."; } },
    { label:"✍️ Atração física quase não existe para mim", run:()=>{ leanIdentity({ none:2.5 }); return "Gosto de afeto e companhia, mas desejo não é a minha."; } },
  ]},
{ id:"ev_id_invite", emoji:"💌", title:"Um convite", age:[16,22], cd:2, weight:()=> discovering() ? 1.6 : 0,
  setup:()=>{ const g = chance(0.5) ? (P().gender === "M" ? "F" : "M") : P().gender; return { npc: approachNPC("acquaintance", { gender:g, age: Math.max(16, P().age + rint(-2,2)) }), same: g === P().gender }; },
  speech:c=> pick(["Quer tomar um café comigo um dia desses?","Achei você interessante. Topa sair?","Vai ter um show sábado… quer ir comigo?"]),
  text:c=> `${c.npc.first} te convidou para sair.`,
  choices:c=>[
    { label:"😊 Aceitar animado(a)", run:()=>{ leanIdentity(c.same ? { same:2 } : { other:2 }); c.npc.role = "friend"; c.npc.rel = rint(50,70); remember_npc(c.npc, "Primeiro encontro"); S.rels.push(c.npc); return `O encontro com ${c.npc.first} foi ótimo.` + fx({happiness:6}); } },
    { label:"🤔 Topar, mas sem expectativas", run:()=>{ leanIdentity(c.same ? { same:0.8, both:0.4 } : { other:0.8, both:0.4 }); return "Foi legal. Ainda estou entendendo o que senti."; } },
    { label:"🙅 Recusar: não sinto nada por essa pessoa", run:()=>{ leanIdentity(c.same ? { other:0.6 } : { same:0.6 }); return "Agradeci, mas não."; } },
    { label:"😶 Recusar: não sinto vontade de sair com ninguém", run:()=>{ leanIdentity({ none:1.5 }); return "Prefiro ficar na minha."; } },
  ]},
{ id:"ev_identity_conclusion", emoji:"🪞", title:"Me entendendo", age:[16,22], weight:0, cond:()=> discovering(),
  text:()=> "Depois de tantas experiências, você sente que começa a se entender melhor. Qual destas palavras te descreve?",
  speech:()=> say("Não preciso ter pressa… mas acho que finalmente sei quem eu sou."),
  choices:()=>[
    ...orientationCandidates().slice(0, 3).map(o => ({ label:`🏳️‍🌈 ${orientationName(o)}`, hint: o === orientationCandidates()[0] ? "o que mais combina com suas escolhas" : "", run:()=>{ setOrientation(o); return `Sou ${orientationName(o).toLowerCase()}. Dizer isso em voz alta trouxe paz.`; } })),
    { label:"⏳ Ainda estou descobrindo", run:()=> "Sem rótulos por enquanto. Tenho tempo." },
  ]},
{ id:"ev_coming_out", emoji:"🏳️‍🌈", title:"Contar para alguém?", age:[12,99], weight:0, cond:()=> ["homo","bi","pan"].includes(P().orientation) && !S.flags.out,
  text:()=> `Você se entende como ${orientationName().toLowerCase()}. Vai contar para as pessoas próximas?`,
  choices:()=>[
    { label:"👪 Contar para a família", run:()=>{
        S.flags.out = "family"; let good = 0, bad = 0;
        for (const r of parents()){ const per = byId(DATA.personalities, r.personality); const ok = chance(0.55 + r.rel/250 + (per?.id === "calm" || per?.id === "generous" ? 0.15 : 0) - (per?.id === "hothead" ? 0.2 : 0));
          if (ok){ r.rel = clamp(r.rel + 8); remember_npc(r, "Me apoiou quando saí do armário"); good++; } else { r.rel = clamp(r.rel - 25); remember_npc(r, "Reagiu mal quando saí do armário"); bad++; } }
        if (!parents().length) return "Contei para os parentes que me criaram. Recebi um abraço." + fx({happiness:8});
        return bad ? (good ? "Uma parte da família me acolheu; outra virou a cara. Dói." + fx({happiness:-4}) + (addStress(10), "") : "A reação foi dura. Chorei a noite toda." + fx({happiness:-12}) + (addStress(18), ""))
                   : "Me abraçaram e disseram que nada muda. Que alívio!" + fx({happiness:14}) + (addStress(-12), "");
      } },
    { label:"🤝 Contar só para os amigos", run:()=>{ S.flags.out = "friends"; for (const f of S.rels.filter(r=>r.role==="friend"&&r.alive)){ f.rel = clamp(f.rel + (chance(0.85) ? 6 : -15)); } return "Meus amigos foram incríveis (quase todos)." + fx({happiness:8}) + (addStress(-6), ""); } },
    { label:"🔒 Manter em segredo por enquanto", run:()=>{ addStress(8); return "Ainda não é a hora. Cada um tem seu tempo."; } },
  ]},
);
