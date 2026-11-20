"use strict";
/* events/childhood.js */

EVENTS.push(
/* Infância */
{ id:"ev_toy", emoji:"🧸", title:"Brinquedo novo", age:[2,5], weight:3, once:true,
  text:()=> "Seus pais te levaram numa loja de brinquedos. O que você escolhe?",
  choices:()=>[
    { label:"Blocos de montar", hint:"estimula a mente", run:()=> "Passei horas construindo torres." + fx({intelligence:4, happiness:3}) },
    { label:"Fantasias e bonecos", hint:"imaginação", run:()=>{ P().talents.acting = clamp(P().talents.acting+6); return "Criei mil histórias." + fx({happiness:5}); } },
    { label:"Birra até ganhar tudo", run:()=>{ for (const p of parents()) p.rel = clamp(p.rel-6); return "Fiz um escândalo no corredor. Meus pais ficaram envergonhados." + fx({happiness:2}); } },
  ]},
{ id:"ev_gifted", emoji:"🧠", title:"Criança prodígio", age:[6,10], weight:()=>P().stats.intelligence>78?3:0, once:true,
  text:()=> "A escola sugeriu um programa para alunos superdotados.",
  choices:()=>[
    { label:"Entrar no programa", run:()=>{ S.edu.perf = clamp(S.edu.perf+15); return "As aulas eram desafiadoras e incríveis." + fx({intelligence:8, happiness:-2}); } },
    { label:"Ficar com os amigos", run:()=> "Preferi continuar na minha turma." + fx({happiness:5}) },
  ]},
{ id:"ev_bully", emoji:"😠", title:"Valentão na escola", age:[7,16], weight:2, cd:3, cond:()=>!!S.edu.school,
  setup:()=>({ name: genName(country(), chance(0.5)?"M":"F").first }),
  text:c=> `${c.name} vive te intimidando no recreio. O que você faz?`,
  choices:c=>[
    { label:"Revidar", hint:"depende da saúde", run:()=> chance(P().stats.health/140 + (hasTrait("athletic")?0.2:0)) ? `Dei uma lição em ${c.name}. Ninguém mais mexeu comigo.` + fx({happiness:8, noto:3}) : `Apanhei feio de ${c.name}.` + fx({health:-8, happiness:-8}) },
    { label:"Contar para a coordenação", run:()=> chance(0.6) ? `${c.name} levou suspensão.` + fx({happiness:4}) : `Nada foi feito e ${c.name} piorou.` + fx({happiness:-6}) },
    { label:"Tentar fazer amizade", hint:"carisma ajuda", run:()=>{ if (chance(hasTrait("charismatic")?0.7:0.3)){ const f = makeNPC("friend", country(), { first:c.name, age:P().age, rel:55 }); f.since=P().age; S.rels.push(f); return `Descobri que ${c.name} só precisava de um amigo.` + fx({happiness:6}); } return "Fui ignorado(a) e humilhado(a)." + fx({happiness:-5}); } },
    { label:"Ignorar", run:()=> "Aguentei calado(a)." + fx({happiness:-4}) },
  ]},
{ id:"ev_play", emoji:"🎭", title:"Peça da escola", age:[7,14], weight:2, cd:3, cond:()=>!!S.edu.school,
  text:()=> "Vai ter audição para a peça de fim de ano.",
  choices:()=>[
    { label:"Fazer audição para protagonista", hint:"talento de atuação", run:()=>{ const ok = chance(P().talents.acting/110 + 0.1); P().talents.acting = clamp(P().talents.acting + (ok?6:2)); return ok ? "Fui escolhido(a) como protagonista e arrasei!" + fx({happiness:8, fame:1}) : "Fiquei com um papel de árvore." + fx({happiness:-2}); } },
    { label:"Ajudar nos bastidores", run:()=> "Pintei cenários com a turma." + fx({happiness:4, intelligence:1}) },
    { label:"Não participar", run:()=> "Fiquei na plateia." },
  ]},
{ id:"ev_sport", emoji:"⚽", title:"Time esportivo", age:[8,17], weight:2, cd:4,
  text:()=> "O treinador te convidou para a equipe da escola.",
  choices:()=>[
    { label:"Entrar no time", run:()=>{ P().talents.sport = clamp(P().talents.sport+8); S.flags.sportKid = true; return "Treinos intensos, mas valeu a pena!" + fx({health:6, happiness:4}); } },
    { label:"Priorizar estudos", run:()=>{ S.edu.perf = clamp(S.edu.perf+5); return "Foquei nas provas." + fx({intelligence:2}); } },
  ]},
{ id:"ev_music", emoji:"🎸", title:"Aulas de música", age:[6,16], weight:2, cd:5,
  text:()=> "Você ficou fascinado(a) por um instrumento musical.",
  choices:()=>[
    { label:"Violão", run:()=>{ P().talents.music = clamp(P().talents.music+10); return "Aprendi meus primeiros acordes." + fx({happiness:4}); } },
    { label:"Piano", run:()=>{ P().talents.music = clamp(P().talents.music+9); return "Escalas e mais escalas." + fx({intelligence:2, happiness:2}); } },
    { label:"Bateria", run:()=>{ P().talents.music = clamp(P().talents.music+8); for(const p of parents()) p.rel = clamp(p.rel-3); return "Os vizinhos odiaram. Eu amei." + fx({happiness:6}); } },
    { label:"Deixar pra lá", run:()=> "Música não era pra mim." },
  ]},
{ id:"ev_science", emoji:"🔬", title:"Feira de ciências", age:[9,15], weight:2, cd:3, cond:()=>!!S.edu.school,
  text:()=> "Qual projeto você vai apresentar?",
  choices:()=>[
    { label:"Vulcão de bicarbonato", run:()=> "Clássico, mas funcionou." + fx({happiness:2}) },
    { label:"Robô com sucata", hint:"inteligência", run:()=> chance(P().stats.intelligence/100) ? "Ganhei o 1º lugar! 🥇" + fx({intelligence:5, happiness:8}) : "O robô pegou fogo." + fx({happiness:-3, intelligence:2}) },
    { label:"Pedir ajuda dos pais", run:()=>{ for(const p of parents()) p.rel = clamp(p.rel+5); return "Fizemos juntos, foi divertido." + fx({happiness:4}); } },
  ]},
{ id:"ev_cheat", emoji:"📝", title:"Prova difícil", age:[10,24], weight:2, cd:2, cond:()=>!!S.edu.school,
  text:()=> "Amanhã tem uma prova decisiva e você não estudou nada.",
  choices:()=>[
    { label:"Virar a noite estudando", run:()=>{ S.edu.perf = clamp(S.edu.perf+6); return "Fui bem, mas acabado(a)." + fx({health:-2, intelligence:2}); } },
    { label:"Colar", hint:"arriscado", run:()=>{ if (chance(hasTrait("cautious")?0.45:0.65)){ S.edu.perf = clamp(S.edu.perf+8); S.flags.cheated = (S.flags.cheated||0)+1; if (chance(0.3)) schedule("cheatExposed", rint(2,6), {}, "Colei numa prova — se descobrirem, vai manchar meu histórico."); return "Ninguém percebeu... por enquanto." + fx({karma:-3}); } S.edu.perf = clamp(S.edu.perf-15); return "Fui pego(a) colando! Zero e advertência." + fx({happiness:-8, karma:-3}); } },
    { label:"Aceitar o destino", run:()=>{ S.edu.perf = clamp(S.edu.perf-6); return "Fui mal na prova." + fx({happiness:-3}); } },
  ]},
{ id:"ev_wallet", emoji:"👛", title:"Carteira perdida", age:[8,85], weight:1.5, cd:8,
  setup:()=>({ amt: priceOf(rint(30, 600)) }),
  text:c=> `Você encontrou uma carteira com ${fmt(c.amt)} e um documento.`,
  choices:c=>[
    { label:"Devolver ao dono", run:()=> chance(0.4) ? "O dono me deu uma recompensa!" + fx({happiness:5, karma:6, money:Math.round(c.amt*0.3)}) : "O dono agradeceu emocionado." + fx({happiness:4, karma:6}) },
    { label:"Ficar com o dinheiro", run:()=> "Embolsei a grana." + fx({money:c.amt, karma:-8, happiness:1}) },
    { label:"Entregar na polícia", run:()=> "Fiz minha parte." + fx({karma:4, happiness:2}) },
  ]},
{ id:"ev_pet", emoji:"🐶", title:"Cachorro abandonado", age:[6,80], weight:1.2, cd:10, cond:()=>!(S.pets||[]).length,
  text:()=> "Um vira-lata te seguiu até em casa.",
  choices:()=>[
    { label:"Adotar", run:()=>{ const pet = addPet("dog_srd", { age: rint(1, 5) }); return `Agora tenho um companheiro: ${pet.name}! 🐾` + fx({happiness:10, money: adult() ? -priceOf(150) : 0}); } },
    { label:"Levar a um abrigo", run:()=> "Ele foi bem cuidado no abrigo." + fx({karma:3, happiness:2}) },
    { label:"Ignorar", run:()=> "Fechei o portão." + fx({karma:-2}) },
  ]}
);
