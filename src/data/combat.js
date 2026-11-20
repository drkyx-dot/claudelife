"use strict";
/* =====================================================================
   data/combat.js — catálogos de luta: modalidades, golpes, torneios,
   perfis de oponente e regras penais por país. Só dados.

   Campos de golpe:
     dmg:[min,max]  dano base          acc     chance base de acerto
     ko             chance de nocaute  lethal  ÍNDICE DE LETALIDADE (0–1)
     cost           fôlego gasto       type    strike | throw | sub
     art/req        modalidade e maestria mínima (0–100) para desbloquear
     dirty          golpe sujo (proibido em torneio)
   ===================================================================== */
DATA.martialArts = [
  { id:"boxe",     name:"Boxe",            emoji:"🥊", fee:90,  wear:3, injury:0.08, minAge:10, desc:"Socos rápidos, esquiva e cardio",
    ranks:["Iniciante","Amador","Pugilista","Competidor","Profissional","Campeão"] },
  { id:"muaythai", name:"Muay Thai",       emoji:"🦵", fee:110, wear:4, injury:0.11, minAge:12, desc:"A arte das oito armas: chutes, joelhos e cotovelos",
    ranks:["Prajied branco","Prajied amarelo","Prajied verde","Prajied azul","Prajied vermelho","Prajied preto"] },
  { id:"jiujitsu", name:"Jiu-Jitsu",       emoji:"🥋", fee:120, wear:3, injury:0.07, minAge:6,  desc:"Chão, alavancas e finalizações",
    ranks:["Faixa branca","Faixa azul","Faixa roxa","Faixa marrom","Faixa preta","Faixa coral"] },
  { id:"karate",   name:"Caratê",          emoji:"🥋", fee:80,  wear:2, injury:0.05, minAge:6,  desc:"Disciplina, distância e golpes precisos",
    ranks:["Faixa branca","Faixa amarela","Faixa laranja","Faixa verde","Faixa marrom","Faixa preta"] },
  { id:"judo",     name:"Judô",            emoji:"🤼", fee:85,  wear:3, injury:0.07, minAge:6,  desc:"Quedas, projeções e estrangulamentos",
    ranks:["Faixa branca","Faixa azul","Faixa amarela","Faixa verde","Faixa marrom","Faixa preta"] },
  { id:"mma",      name:"MMA / Vale-Tudo", emoji:"🩸", fee:160, wear:5, injury:0.14, minAge:16, desc:"Tudo junto: trocação, queda e chão",
    ranks:["Novato","Amador","Lutador","Profissional","Elite","Lenda do octógono"] },
];
/* limites de maestria de cada graduação (6 faixas) */
DATA.rankThresholds = [0, 15, 30, 50, 70, 90];

DATA.moves = [
  // ---- básicos (qualquer pessoa) ----
  { id:"punch",   name:"Soco",                 dmg:[4,9],   acc:0.62, ko:0.03, lethal:0.010, cost:8,  type:"strike" },
  { id:"kick",    name:"Chute",                dmg:[5,11],  acc:0.52, ko:0.04, lethal:0.010, cost:12, type:"strike" },
  { id:"grab",    name:"Agarrar e derrubar",   dmg:[3,8],   acc:0.55, ko:0.02, lethal:0.012, cost:12, type:"throw" },
  { id:"headbutt",name:"Cabeçada",             dmg:[6,13],  acc:0.45, ko:0.07, lethal:0.020, cost:14, type:"strike", dirty:true },
  // ---- Boxe ----
  { id:"jab",     art:"boxe", req:10, name:"Jab Rápido",           dmg:[5,9],   acc:0.78, ko:0.03, lethal:0.006, cost:6,  type:"strike" },
  { id:"cross",   art:"boxe", req:30, name:"Cruzado de Direita",   dmg:[9,16],  acc:0.64, ko:0.12, lethal:0.025, cost:12, type:"strike" },
  { id:"uppercut",art:"boxe", req:55, name:"Upper no Queixo",      dmg:[11,19], acc:0.58, ko:0.20, lethal:0.035, cost:14, type:"strike" },
  { id:"combo123",art:"boxe", req:78, name:"Combinação 1-2-3",     dmg:[15,25], acc:0.62, ko:0.24, lethal:0.040, cost:20, type:"strike" },
  // ---- Muay Thai ----
  { id:"lowkick", art:"muaythai", req:10, name:"Chute Baixo na Coxa",     dmg:[6,11],  acc:0.70, ko:0.03, lethal:0.006, cost:9,  type:"strike" },
  { id:"knee",    art:"muaythai", req:35, name:"Joelhada no Clinch",      dmg:[10,18], acc:0.62, ko:0.14, lethal:0.035, cost:14, type:"strike" },
  { id:"elbow",   art:"muaythai", req:60, name:"Cotovelada Giratória",    dmg:[13,22], acc:0.55, ko:0.24, lethal:0.060, cost:16, type:"strike" },
  { id:"headkick",art:"muaythai", req:80, name:"Chute Alto na Têmpora",   dmg:[16,28], acc:0.50, ko:0.34, lethal:0.085, cost:20, type:"strike" },
  // ---- Jiu-Jitsu ----
  { id:"takedown",art:"jiujitsu", req:10, name:"Queda e Montada",         dmg:[4,8],   acc:0.68, ko:0.02, lethal:0.004, cost:10, type:"throw" },
  { id:"armbar",  art:"jiujitsu", req:35, name:"Chave de Braço",          dmg:[10,16], acc:0.58, ko:0.22, lethal:0.006, cost:14, type:"sub" },
  { id:"triangle",art:"jiujitsu", req:55, name:"Triângulo",               dmg:[11,18], acc:0.56, ko:0.28, lethal:0.030, cost:16, type:"sub" },
  { id:"rnc",     art:"jiujitsu", req:72, name:"Mata-Leão",               dmg:[14,22], acc:0.55, ko:0.40, lethal:0.070, cost:18, type:"sub" },
  // ---- Caratê ----
  { id:"gyaku",   art:"karate", req:10, name:"Soco Reverso (Gyaku-zuki)",  dmg:[6,10],  acc:0.72, ko:0.04, lethal:0.008, cost:8,  type:"strike" },
  { id:"maegeri", art:"karate", req:30, name:"Chute Frontal (Mae-geri)",   dmg:[8,14],  acc:0.64, ko:0.08, lethal:0.015, cost:11, type:"strike" },
  { id:"uramawashi",art:"karate",req:60,name:"Chute Giratório (Ura-mawashi)",dmg:[13,23],acc:0.50, ko:0.26, lethal:0.055, cost:17, type:"strike" },
  { id:"shuto",   art:"karate", req:85, name:"Mão-Faca na Garganta (Shuto)",dmg:[15,24],acc:0.55, ko:0.30, lethal:0.120, cost:18, type:"strike" },
  // ---- Judô ----
  { id:"ogoshi",  art:"judo", req:15, name:"Queda de Quadril (O-goshi)",  dmg:[7,12],  acc:0.66, ko:0.06, lethal:0.015, cost:11, type:"throw" },
  { id:"seoi",    art:"judo", req:40, name:"Projeção de Ombro (Seoi-nage)",dmg:[10,18], acc:0.60, ko:0.14, lethal:0.040, cost:14, type:"throw" },
  { id:"hadaka",  art:"judo", req:62, name:"Estrangulamento (Hadaka-jime)",dmg:[12,20], acc:0.56, ko:0.34, lethal:0.060, cost:16, type:"sub" },
  { id:"uchimata",art:"judo", req:80, name:"Projeção Explosiva (Uchi-mata)",dmg:[16,26],acc:0.54, ko:0.30, lethal:0.075, cost:19, type:"throw" },
  // ---- MMA ----
  { id:"gnp",     art:"mma", req:25, name:"Ground and Pound",           dmg:[10,18], acc:0.62, ko:0.16, lethal:0.045, cost:15, type:"strike" },
  { id:"superman",art:"mma", req:45, name:"Superman Punch",             dmg:[12,20], acc:0.56, ko:0.20, lethal:0.035, cost:15, type:"strike" },
  { id:"guillotine",art:"mma",req:62,name:"Guilhotina",                 dmg:[12,20], acc:0.55, ko:0.34, lethal:0.065, cost:17, type:"sub" },
  { id:"slam",    art:"mma", req:82, name:"Bate-Estaca (Slam)",         dmg:[17,29], acc:0.50, ko:0.32, lethal:0.110, cost:21, type:"throw" },
];

/* Intensidade escolhida pelo jogador: multiplica o dano e a letalidade.
   "control" diz quanto da maestria vira CONTROLE da força (dosar o golpe). */
DATA.intensities = [
  { id:"ctrl",   name:"🎯 Controlado", dmg:0.75, lethal:0.25, control:1.0, hint:"menos dano, a maestria dosa a força" },
  { id:"normal", name:"⚖️ Normal",     dmg:1.00, lethal:1.00, control:0.7, hint:"equilíbrio" },
  { id:"all",    name:"💢 Com tudo",   dmg:1.35, lethal:2.20, control:0,   hint:"máximo dano, risco real de matar" },
];

/* Torneios: participação exige maestria mínima na modalidade escolhida. */
DATA.tournaments = [
  { id:"amador",   name:"Campeonato Amador Municipal",   emoji:"🏅", minM:10, fee:150, prize:[1500,4000],    fame:2,  rep:2, fights:2, skill:[15,40] },
  { id:"estadual", name:"Copa Estadual / Regional",      emoji:"🥈", minM:35, fee:500, prize:[8000,20000],   fame:5,  rep:4, fights:3, skill:[35,60] },
  { id:"pro",      name:"Evento Profissional (card)",    emoji:"🥇", minM:60, fee:0,   prize:[40000,120000], fame:12, rep:6, fights:1, skill:[55,80], minWins:3 },
  { id:"cinturao", name:"Disputa de Cinturão Mundial",   emoji:"🏆", minM:80, fee:0,   prize:[300000,900000],fame:25, rep:10,fights:1, skill:[75,95], minWins:8 },
];

/* Perfis de oponente por contexto de briga. */
DATA.fightProfiles = {
  street:     { name:"Briga de rua",        str:[30,70], skill:[5,45],  hp:[60,100], armed:[0.85,0.12,0.03], kill:"low"  },
  provoke:    { name:"Briga provocada",     str:[30,70], skill:[5,45],  hp:[60,100], armed:[0.9,0.08,0.02],  kill:"low"  },
  robbery:    { name:"Assalto (legítima defesa)", str:[40,70], skill:[15,45], hp:[60,95], armed:[0,0.6,0.4], kill:"self" },
  prison:     { name:"Briga na prisão",     str:[50,85], skill:[25,60], hp:[70,100], armed:[0.6,0.4,0],      kill:"yes"  },
  rival:      { name:"Acerto de contas entre facções", str:[45,80], skill:[35,75], hp:[75,100], armed:[0.3,0.3,0.4], kill:"yes" },
  hit:        { name:"Contrato de execução",str:[25,60], skill:[5,40],  hp:[55,95],  armed:[0.6,0.2,0.2],     kill:"yes"  },
  revenge:    { name:"Vingança",            str:[40,75], skill:[15,55], hp:[65,100], armed:[0.4,0.35,0.25],  kill:"yes"  },
  tournament: { name:"Luta oficial",        str:[40,85], skill:[15,95], hp:[85,100], armed:[1,0,0],          kill:"no"   },
};
DATA.weapons = [ { id:null, name:"Desarmado", mult:1, lethal:1 }, { id:"knife", name:"🔪 Faca", mult:1.8, lethal:5 }, { id:"gun", name:"🔫 Arma de fogo", mult:2.6, lethal:9 } ];
DATA.oppAttacks = ["um soco no rosto","um chute nas costelas","uma joelhada","um gancho","um empurrão contra a parede","um tapa forte","uma cotovelada","um chute baixo"];

/* Penas por homicídio (anos). life = existe prisão perpétua no país. */
DATA.penal = {
  BR:{ max:40, life:false }, PT:{ max:25, life:false }, US:{ max:60, life:true }, JP:{ max:30, life:true },
  DE:{ max:30, life:true },  MX:{ max:60, life:false }, NG:{ max:40, life:true }, IN:{ max:40, life:true },
};
DATA.prisonSecurity = [
  { id:"mínima", name:"Segurança mínima (semiaberto)", emoji:"🟢" },
  { id:"média",  name:"Segurança média",               emoji:"🟠" },
  { id:"máxima", name:"Segurança máxima",              emoji:"🔴" },
];
/* Nomes das etapas do minigame de fuga. */
DATA.escapeStages = ["Bloco de celas", "Pátio e corredores", "Muralha externa"];
