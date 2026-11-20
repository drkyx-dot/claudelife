"use strict";
/* =====================================================================
   data/collect.js — COLECIONÁVEIS / MUSEU, ARSENAL e alvos do "lado
   sombrio". Só dados.
   Colecionável: price (base), appr = valorização média/ano, vol =
   volatilidade, src: auction (leilão), dealer (antiquário), black
   (mercado negro: barato, pode ser falso ou roubado → apreensão).
   Arma: dmg/acc/lethal/ko viram um GOLPE no combate; discretion
   (0–1, quão silenciosa/discreta), trace (0–1, rastreabilidade
   balística/registro); legal: livre | license (porte) | illegal.
   ===================================================================== */
DATA.collectibles = [
  { id:"coin",      cat:"Numismática",  emoji:"🪙", name:"Moeda de ouro do Império",        price:2500,     appr:0.04,  vol:0.08, src:"dealer" },
  { id:"stamp",     cat:"Filatelia",    emoji:"📮", name:"Selo raro 'Olho de Boi'",          price:9000,     appr:0.045, vol:0.12, src:"auction" },
  { id:"comic",     cat:"Cultura pop",  emoji:"📚", name:"Primeira edição de HQ clássica",   price:18000,    appr:0.06,  vol:0.2,  src:"auction" },
  { id:"vinyl",     cat:"Música",       emoji:"💿", name:"Disco autografado por lenda do rock", price:7000,  appr:0.05,  vol:0.15, src:"dealer" },
  { id:"jersey",    cat:"Esporte",      emoji:"👕", name:"Camisa de final de Copa autografada", price:25000, appr:0.05,  vol:0.18, src:"auction" },
  { id:"watch",     cat:"Relojoaria",   emoji:"⌚", name:"Relógio suíço vintage",            price:45000,    appr:0.055, vol:0.1,  src:"dealer" },
  { id:"fossil",    cat:"Paleontologia",emoji:"🦴", name:"Crânio fóssil de dinossauro",      price:180000,   appr:0.05,  vol:0.15, src:"auction" },
  { id:"sword",     cat:"Antiguidade",  emoji:"⚔️", name:"Espada samurai do séc. XVII",      price:120000,   appr:0.045, vol:0.12, src:"auction" },
  { id:"vase",      cat:"Antiguidade",  emoji:"🏺", name:"Vaso da dinastia Ming",            price:350000,   appr:0.05,  vol:0.2,  src:"auction" },
  { id:"manuscript",cat:"Relíquia",     emoji:"📜", name:"Manuscrito medieval iluminado",    price:520000,   appr:0.055, vol:0.14, src:"auction" },
  { id:"painting",  cat:"Arte",         emoji:"🖼️", name:"Óleo de mestre impressionista",    price:2200000,  appr:0.06,  vol:0.22, src:"auction" },
  { id:"meteorite", cat:"Curiosidade",  emoji:"☄️", name:"Fragmento de meteorito marciano",  price:65000,    appr:0.04,  vol:0.25, src:"dealer" },
  { id:"mummy",     cat:"Relíquia",     emoji:"⚱️", name:"Amuleto egípcio de tumba",         price:40000,    appr:0.07,  vol:0.3,  src:"black" },
  { id:"idol",      cat:"Relíquia",     emoji:"🗿", name:"Ídolo pré-colombiano",             price:90000,    appr:0.07,  vol:0.3,  src:"black" },
  { id:"stolenart", cat:"Arte",         emoji:"🖼️", name:"Quadro 'desaparecido' de museu",   price:600000,   appr:0.08,  vol:0.35, src:"black" },
];
DATA.collectSrc = { auction:"🔨 Casa de leilões", dealer:"🏛️ Antiquário", black:"🕳️ Mercado negro" };

DATA.armory = [
  { id:"kitchen",  emoji:"🔪", name:"Faca de cozinha",          price:60,    legal:"livre",   dmg:[10,18], acc:0.62, ko:0.08, lethal:0.09, discretion:0.8, trace:0.15, cost:9 },
  { id:"bat",      emoji:"🏏", name:"Taco de beisebol",         price:180,   legal:"livre",   dmg:[12,22], acc:0.58, ko:0.2,  lethal:0.07, discretion:0.4, trace:0.1,  cost:12 },
  { id:"tactical", emoji:"🗡️", name:"Faca tática",              price:450,   legal:"livre",   dmg:[13,22], acc:0.64, ko:0.1,  lethal:0.13, discretion:0.85,trace:0.2,  cost:9 },
  { id:"knuckles", emoji:"🥊", name:"Soco-inglês",              price:120,   legal:"illegal", dmg:[9,16],  acc:0.68, ko:0.18, lethal:0.04, discretion:0.9, trace:0.05, cost:8 },
  { id:"crossbow", emoji:"🏹", name:"Besta",                    price:1400,  legal:"livre",   dmg:[18,30], acc:0.5,  ko:0.15, lethal:0.22, discretion:0.75,trace:0.3,  cost:16 },
  { id:"pistol",   emoji:"🔫", name:"Pistola (registrada)",     price:4500,  legal:"license", dmg:[22,38], acc:0.6,  ko:0.25, lethal:0.35, discretion:0.2, trace:0.85, cost:6 },
  { id:"shotgun",  emoji:"🔫", name:"Espingarda de caça",       price:6000,  legal:"license", dmg:[28,45], acc:0.55, ko:0.35, lethal:0.42, discretion:0.1, trace:0.7,  cost:10 },
  { id:"ghostgun", emoji:"🔫", name:"Pistola sem numeração",    price:9000,  legal:"illegal", dmg:[22,38], acc:0.58, ko:0.25, lethal:0.35, discretion:0.3, trace:0.25, cost:6 },
  { id:"rifle",    emoji:"🪖", name:"Fuzil (contrabando)",      price:30000, legal:"illegal", dmg:[34,55], acc:0.6,  ko:0.4,  lethal:0.55, discretion:0.05,trace:0.5,  cost:12 },
  { id:"suppressor",emoji:"🔇",name:"Pistola com supressor",   price:22000, legal:"illegal", dmg:[20,34], acc:0.6,  ko:0.22, lethal:0.33, discretion:0.75,trace:0.35, cost:6 },
];
/* Porte de arma: dificuldade por país (idade mínima, custo base, chance de aprovação). */
DATA.gunLaw = { US:{ age:21, cost:300, ok:0.9 }, BR:{ age:25, cost:2500, ok:0.45 }, MX:{ age:21, cost:1500, ok:0.35 }, PT:{ age:21, cost:1200, ok:0.4 },
  DE:{ age:21, cost:2000, ok:0.3 }, NG:{ age:25, cost:1500, ok:0.25 }, IN:{ age:21, cost:1000, ok:0.3 }, JP:{ age:25, cost:5000, ok:0.05 } };

/* Perfis de alvo do "lado sombrio" (o código define quem é aceitável). */
DATA.darkTargets = [
  { id:"abuser",   guilty:true,  name:"Agressor que saiu impune",       risk:0.8, desc:"Absolvido por falha no processo; a vítima ainda tem medo." },
  { id:"dealer",   guilty:true,  name:"Traficante que vende para crianças", risk:1.1, desc:"Protegido por seguranças armados." },
  { id:"killer",   guilty:true,  name:"Assassino solto por tecnicalidade", risk:1.3, desc:"Perigoso, atento e imprevisível." },
  { id:"corrupt",  guilty:true,  name:"Empresário que matou funcionários por negligência", risk:0.9, desc:"Rico, com seguranças e advogados." },
  { id:"stranger", guilty:false, name:"Desconhecido aleatório",          risk:0.6, desc:"Ninguém que mereça. Só um alvo fácil." },
  { id:"rival",    guilty:false, name:"Alguém que te humilhou",          risk:0.9, desc:"Pessoal demais: a polícia sempre olha primeiro para quem tinha motivo." },
];
/* Caçada que deu errado vira combate: o alvo luta pela vida. */
DATA.fightProfiles.hunt = { name:"Caçada", str:[30,70], skill:[10,50], hp:[60,95], armed:[0.6,0.25,0.15], kill:"yes" };
