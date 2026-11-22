"use strict";
/* =====================================================================
   events/class.js — infância e juventude marcadas pela CLASSE SOCIAL
   sorteada ao nascer (9 níveis em DATA.classes).
   ===================================================================== */
const clsId = () => P().cls;
EVENTS.push(
{ id:"ev_hunger", emoji:"🍞", title:"Geladeira vazia", age:[3,14], cd:3, weight:()=> clsId() <= 1 ? 1.6 : 0,
  text:()=> "Faltou comida em casa este mês. Seus pais estão fazendo o impossível.",
  speech:()=> say("Filho(a), hoje tem só arroz… amanhã a gente dá um jeito."),
  choices:()=>[
    { label:"🥣 Comer só na merenda da escola", run:()=>{ S.edu.perf = clamp(S.edu.perf + 2); return "A merenda virou a refeição do dia." + fx({health:-3}); } },
    { label:"🙏 Pedir ajuda aos vizinhos", run:()=> chance(0.65) ? "Uma vizinha trouxe uma cesta básica. Nunca vou esquecer." + fx({happiness:3}) : "Ninguém tinha muito para dividir." + fx({health:-4, happiness:-3}) },
    { label:"🧺 Pegar fruta da feira escondido", hint:"pequeno delito", run:()=>{ if (chance(0.3)){ for (const p of parents()) p.rel = clamp(p.rel - 5); return "O feirante me pegou e contou para minha mãe." + fx({happiness:-4}); } S.crimeSkill = clamp(S.crimeSkill + 1); return "Ninguém viu. A fome falou mais alto."; } },
  ]},
{ id:"ev_child_labor", emoji:"🧃", title:"Ajudar em casa", age:[10,15], cd:3, weight:()=> clsId() <= 2 ? 1.3 : 0,
  text:()=> "As contas não fecham. Um conhecido oferece um bico de vendedor no sinal depois da aula.",
  choices:()=>[
    { label:"💪 Trabalhar para ajudar a família", run:()=>{ const v = priceOf(rint(300, 900)); addMoney(v); S.edu.perf = clamp(S.edu.perf - 8); for (const p of parents()) p.rel = clamp(p.rel + 5); return `Juntei ${fmt(v)} e dei quase tudo em casa. A escola sofreu.` + fx({health:-2}); } },
    { label:"📚 Focar nos estudos", run:()=>{ S.edu.perf = clamp(S.edu.perf + 5); return "Estudar é a minha chance de mudar de vida." + fx({intelligence:2}); } },
  ]},
{ id:"ev_social_aid", emoji:"🏛️", title:"Programa social", age:[4,12], once:true, weight:()=> clsId() <= 1 ? 2 : 0,
  text:()=> "Sua família entrou num programa de transferência de renda, que exige frequência escolar.",
  choices:()=>[
    { label:"✅ Ótimo: escola todo dia", run:()=>{ S.edu.perf = clamp(S.edu.perf + 6); return "Com o auxílio, voltei a ter material escolar." + fx({happiness:4, health:3}); } },
  ]},
{ id:"ev_private_tutor", emoji:"👩‍🏫", title:"Professor particular", age:[8,16], cd:4, weight:()=> clsId() >= 5 ? 1.2 : 0,
  text:()=> "Seus pais contrataram aulas particulares para garantir boas notas.",
  choices:()=>[
    { label:"📖 Levar a sério", run:()=>{ S.edu.perf = clamp(S.edu.perf + 10); return "Minhas notas dispararam." + fx({intelligence:3}); } },
    { label:"🎮 Enrolar o professor", run:()=>{ S.edu.perf = clamp(S.edu.perf - 3); return "Passei as aulas no celular. Meus pais pagaram por nada." + fx({happiness:2}); } },
  ]},
{ id:"ev_trip_abroad", emoji:"🗽", title:"Férias no exterior", age:[6,17], cd:3, weight:()=> clsId() >= 6 ? 1.2 : clsId() === 5 ? 0.4 : 0,
  setup:()=>({ dest: pick(["Nova York","Paris","Disney","Tóquio","Londres","Suíça"]) }),
  text:c=> `A família vai passar as férias em ${c.dest}.`,
  choices:c=>[
    { label:"✈️ Aproveitar cada segundo", run:()=> `Voltei de ${c.dest} com mil histórias.` + fx({happiness:10, intelligence:2}) },
    { label:"🗣️ Aproveitar para praticar o idioma", run:()=>{ S.edu.perf = clamp(S.edu.perf + 4); return "Voltei arranhando outra língua." + fx({intelligence:4}); } },
  ]},
{ id:"ev_paparazzi", emoji:"📸", title:"Herdeiro(a) nos tabloides", age:[12,30], cd:3, weight:()=> clsId() === 8 ? 1.5 : clsId() === 7 ? 0.4 : 0,
  text:()=> "Fotógrafos te flagraram numa festa. Seu sobrenome vende manchete.",
  speech:()=> say("Ei, herdeiro(a)! Um sorriso pra capa!"),
  choices:()=>[
    { label:"😎 Posar e virar notícia", run:()=> "Saí em três sites de fofoca." + fx({fame:6, happiness:3}) },
    { label:"🕶️ Fugir dos flashes", run:()=>{ addStress(4); return "Escapei pela porta dos fundos."; } },
    { label:"🤬 Partir pra cima do fotógrafo", hint:"escândalo", run:()=>{ addFame(8); addRep(-6); addNoto(4); return say("\"Herdeiro(a) agride fotógrafo\": virei meme nacional, porra."); } },
  ]},
{ id:"ev_family_business", emoji:"🏢", title:"O império da família", age:[18,26], once:true, weight:()=> clsId() >= 7 && !S.job ? 2 : 0,
  text:()=> "Seus pais querem você numa diretoria da empresa da família.",
  choices:()=>[
    { label:"👔 Aceitar a cadeira na diretoria", run:()=>{ const v = priceOf(rint(60000, 140000)); addMoney(v); addRep(6); return `Recebi ${fmt(v)} em bônus de "boas-vindas". Os funcionários me olham torto.`; } },
    { label:"🚀 Recusar e seguir meu caminho", run:()=>{ for (const p of parents()) p.rel = clamp(p.rel - 6); return "Quero provar que consigo sozinho(a)." + fx({happiness:4}); } },
  ]},
{ id:"ev_kidnap_attempt", emoji:"🚐", title:"Tentativa de sequestro", age:[8,40], cd:8, weight:()=> clsId() >= 7 ? 0.5 * country().crime : 0, cond:()=>!inPrison(),
  text:()=> "Uma van parou do seu lado. Homens encapuzados tentaram te puxar para dentro.",
  choices:()=>[
    { label:"🥊 Reagir", hint:"abre o combate", run:()=>{ startFight("robbery", { amt: priceOf(5000) }); return "Gritei e parti pra cima."; } },
    { label:"🏃 Correr para a segurança", run:()=> chance(0.6) ? "O segurança da família apareceu a tempo." + fx({happiness:-5}) + (addStress(15), "") : "Me pegaram. Fiquei 3 dias no cativeiro até pagarem o resgate." + (minor() ? payBill(priceOf(200000), "o resgate") : fx({money:-Math.min(Math.max(0,S.money), priceOf(200000))})) + fx({happiness:-20}) + (addStress(30), "") },
  ]},
);
