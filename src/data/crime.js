"use strict";
/* data/crime.js — crimes individuais e dados do crime organizado.
   Crime: success (chance base), gain (base), years (pena), noto (notoriedade),
   skill (habilidade criminal mínima), minInt, dirty (true → vai para o
   "dinheiro sujo", que precisa ser lavado), needsOrg (só membro de organização). */
DATA.crimes = [
  { id:"shoplift",   cat:"Pequenos delitos", name:"Furtar em loja",               minAge:10, success:0.72, gain:[40,500],        years:[0,1],  noto:4,  skill:0 },
  { id:"pickpocket", cat:"Pequenos delitos", name:"Bater carteira",               minAge:12, success:0.6,  gain:[20,800],        years:[0,2],  noto:5,  skill:0 },
  { id:"phone",      cat:"Pequenos delitos", name:"Roubar celular na rua",        minAge:14, success:0.55, gain:[150,900],       years:[1,3],  noto:7,  skill:5 },
  { id:"fraud",      cat:"Golpes",           name:"Fraude financeira corporativa",minAge:21, success:0.5,  gain:[20000,250000],  years:[4,12], noto:20, skill:25, minInt:62, dirty:true },
  { id:"smuggle",    cat:"Contrabando",      name:"Contrabando de eletrônicos",   minAge:18, success:0.55, gain:[5000,30000],    years:[2,5],  noto:10, skill:15, dirty:true },
  { id:"cartheft",   cat:"Roubos",           name:"Roubar um carro",              minAge:16, success:0.45, gain:[3000,15000],    years:[2,5],  noto:12, skill:10, dirty:true },
  { id:"burglary",   cat:"Roubos",           name:"Assaltar uma residência",      minAge:16, success:0.48, gain:[1000,25000],    years:[3,8],  noto:15, skill:10 },
  { id:"cargo",      cat:"Roubos",           name:"Roubo de carga",               minAge:18, success:0.38, gain:[30000,180000],  years:[5,12], noto:22, skill:35, dirty:true, needsOrg:true },
  { id:"extortion",  cat:"Crime organizado", name:"Extorquir comerciante",        minAge:18, success:0.5,  gain:[5000,40000],    years:[3,9],  noto:18, skill:25, dirty:true, needsOrg:true },
  /* Golpes digitais / engenharia social: usam a HABILIDADE TÉCNICA (S.cyberSkill),
     exigem preparação paga (prep), deixam rastro (trace = chance de a polícia
     chegar até você meses depois) e rendem dinheiro sujo. */
  { id:"phishing",   cat:"Golpes digitais", cyber:true, name:"Phishing bancário",                minAge:16, success:0.6,  gain:[1500,12000],    years:[1,4],  noto:6,  skill:0,  minInt:42, prep:300,   trace:0.22, dirty:true },
  { id:"pixclone",   cat:"Golpes digitais", cyber:true, name:"Clonagem de cartão / Pix",         minAge:17, success:0.52, gain:[5000,40000],    years:[2,6],  noto:10, skill:10, minInt:50, prep:1500,  trace:0.3,  dirty:true },
  { id:"fakesupport",cat:"Golpes digitais", cyber:true, name:"Falso suporte técnico",            minAge:18, success:0.55, gain:[3000,30000],    years:[1,5],  noto:8,  skill:15, minInt:48, prep:800,   trace:0.28, dirty:true },
  { id:"celebhack",  cat:"Golpes digitais", cyber:true, name:"Invasão de contas de celebridades",minAge:18, success:0.4,  gain:[20000,300000],  years:[3,8],  noto:22, skill:40, minInt:65, prep:5000,  trace:0.42, dirty:true },
  { id:"pyramid",    cat:"Golpes digitais", cyber:true, name:"Pirâmide / esquema cripto falso",  minAge:20, success:0.45, gain:[80000,900000],  years:[4,12], noto:28, skill:30, minInt:60, prep:15000, trace:0.5,  dirty:true },
  { id:"ransomware", cat:"Golpes digitais", cyber:true, name:"Ransomware em empresas",           minAge:20, success:0.35, gain:[150000,2000000],years:[6,15], noto:30, skill:50, minInt:70, prep:25000, trace:0.35, dirty:true },
  { id:"bank",       cat:"Roubos",           name:"Assaltar um banco",            minAge:18, success:0.18, gain:[80000,900000],  years:[10,25],noto:40, skill:45, dirty:true },
];

/* Hierarquia de uma organização (de baixo para cima). share = fatia do lucro da org. */
DATA.orgRanks = [
  { name:"Associado(a)",  share:0.03, respect:0 },
  { name:"Soldado",       share:0.06, respect:20 },
  { name:"Gerente",       share:0.12, respect:45 },
  { name:"Braço-direito", share:0.22, respect:70 },
  { name:"Chefe",         share:1.0,  respect:90 },
];
/* Operações clandestinas: renda base/ano (suja), calor policial/ano e capangas mínimos. */
DATA.orgOps = [
  { id:"piracy",    name:"Pirataria e falsificados",        income:30000,  heat:3,  members:1 },
  { id:"gambling",  name:"Banca de jogo ilegal",            income:45000,  heat:4,  members:2 },
  { id:"loansharking",name:"Agiotagem",                     income:65000,  heat:6,  members:2 },
  { id:"protection",name:"\"Proteção\" de comércio local",  income:85000,  heat:10, members:3 },
  { id:"chopshop",  name:"Desmanche de veículos",           income:95000,  heat:9,  members:3 },
  { id:"smuggling", name:"Rota de contrabando",             income:160000, heat:12, members:4 },
  { id:"casino",    name:"Cassino clandestino",             income:210000, heat:14, members:5 },
];
DATA.territories = ["Centro","Zona Norte","Zona Leste","Porto","Baixada","Distrito Industrial","Orla","Morro Alto","Vila Nova","Zona Sul"];
DATA.orgNames = ["Família Moretti","Os Corvos","Sindicato do Porto","Irmandade da Serra","Clã Kuroda","Cartel do Litoral","Os Lobos","Facção do Centro"];
DATA.orgRoles = ["Motorista","Contador","Executor","Olheiro","Negociador","Hacker","Atirador"];
