"use strict";
/* data/assets.js — imóveis, aluguéis, veículos, investimentos, negócios, presentes.
   Valores BASE (convertidos por país com priceIn/priceOf).
   Imóvel: upkeep = manutenção + condomínio + IPTU (% do valor/ano),
           rentYield = aluguel bruto anual como % do valor, appr = valorização média.
   Veículo: dep = depreciação/ano, ins = seguro+revisão (% valor), tax = IPVA (% valor),
           fuel = combustível base/ano, risk = acidente, theft = risco de roubo. */
DATA.properties = [
  { id:"kitnet",    kind:"Apartamento", name:"Quitinete",                         price:60000,    upkeep:0.028, rentYield:0.065, comfort:2,  status:0,  appr:0.03 },
  { id:"studio",    kind:"Apartamento", name:"Studio compacto",                   price:90000,    upkeep:0.026, rentYield:0.06,  comfort:3,  status:1,  appr:0.03 },
  { id:"apt_simple",kind:"Apartamento", name:"Apartamento simples (2 quartos)",   price:140000,   upkeep:0.024, rentYield:0.055, comfort:4,  status:2,  appr:0.03 },
  { id:"apt2",      kind:"Apartamento", name:"Apartamento 2 quartos reformado",   price:190000,   upkeep:0.022, rentYield:0.052, comfort:5,  status:3,  appr:0.035 },
  { id:"apt3",      kind:"Apartamento", name:"Apartamento 3 quartos c/ vista",    price:330000,   upkeep:0.022, rentYield:0.048, comfort:6,  status:4,  appr:0.035 },
  { id:"apt_lux",   kind:"Apartamento", name:"Apartamento de luxo",               price:750000,   upkeep:0.025, rentYield:0.042, comfort:8,  status:6,  appr:0.038 },
  { id:"house_hood",kind:"Casa",        name:"Casa de bairro",                    price:160000,   upkeep:0.018, rentYield:0.055, comfort:5,  status:2,  appr:0.028 },
  { id:"house",     kind:"Casa",        name:"Casa térrea com quintal",           price:230000,   upkeep:0.018, rentYield:0.05,  comfort:6,  status:3,  appr:0.03 },
  { id:"sobrado",   kind:"Casa",        name:"Sobrado",                           price:310000,   upkeep:0.02,  rentYield:0.048, comfort:7,  status:4,  appr:0.032 },
  { id:"condo_house",kind:"Casa",       name:"Casa em condomínio fechado",        price:560000,   upkeep:0.024, rentYield:0.045, comfort:8,  status:6,  appr:0.035 },
  { id:"beach",     kind:"Casa",        name:"Casa de praia",                     price:680000,   upkeep:0.03,  rentYield:0.06,  comfort:8,  status:6,  appr:0.034, seasonal:true },
  { id:"penthouse", kind:"Cobertura",   name:"Cobertura duplex",                  price:1150000,  upkeep:0.026, rentYield:0.04,  comfort:9,  status:8,  appr:0.04 },
  { id:"chacara",   kind:"Sítio/Fazenda",name:"Chácara de fim de semana",         price:280000,   upkeep:0.016, rentYield:0.04,  comfort:6,  status:3,  appr:0.025, income:0.008 },
  { id:"farm",      kind:"Sítio/Fazenda",name:"Sítio com pomar",                  price:390000,   upkeep:0.016, rentYield:0.035, comfort:6,  status:4,  appr:0.025, income:0.02 },
  { id:"ranch",     kind:"Sítio/Fazenda",name:"Fazenda produtiva",                price:2600000,  upkeep:0.02,  rentYield:0.03,  comfort:7,  status:7,  appr:0.03,  income:0.04 },
  { id:"mansion",   kind:"Mansão",      name:"Mansão com piscina",                price:3300000,  upkeep:0.032, rentYield:0.035, comfort:10, status:9,  appr:0.035 },
  { id:"estate",    kind:"Mansão",      name:"Palacete histórico",                price:9500000,  upkeep:0.032, rentYield:0.03,  comfort:10, status:10, appr:0.04 },
  { id:"island",    kind:"Mansão",      name:"Ilha particular com mansão",        price:26000000, upkeep:0.04,  rentYield:0.05,  comfort:10, status:10, appr:0.035, seasonal:true },
  { id:"office",    kind:"Comercial",   name:"Sala comercial",                    price:210000,   upkeep:0.025, rentYield:0.075, comfort:0,  status:1,  appr:0.025, commercial:true },
  { id:"shop",      kind:"Comercial",   name:"Loja de rua",                       price:420000,   upkeep:0.025, rentYield:0.08,  comfort:0,  status:2,  appr:0.028, commercial:true },
  { id:"building",  kind:"Comercial",   name:"Prédio residencial (12 unidades)",  price:4200000,  upkeep:0.03,  rentYield:0.07,  comfort:0,  status:5,  appr:0.03,  commercial:true, units:12 },
];
DATA.rentals = [
  { id:"r_room",    name:"Quarto em república",            rent:4200,  comfort:2, status:0 },
  { id:"r_kitnet",  name:"Quitinete alugada",              rent:6500,  comfort:3, status:1 },
  { id:"r_studio",  name:"Studio alugado",                 rent:8800,  comfort:4, status:1 },
  { id:"r_apt",     name:"Apartamento alugado",            rent:14500, comfort:5, status:3 },
  { id:"r_house",   name:"Casa alugada",                   rent:19500, comfort:6, status:4 },
  { id:"r_condo",   name:"Casa em condomínio alugada",     rent:32000, comfort:8, status:6 },
  { id:"r_lux",     name:"Apartamento de alto padrão alugado", rent:46000, comfort:8, status:7 },
  { id:"r_penthouse",name:"Cobertura alugada",             rent:85000, comfort:9, status:8 },
];
DATA.vehicles = [
  { id:"bike",     kind:"Moto",       name:"Moto popular 160cc",        price:3600,    dep:0.12, ins:0.09, tax:0.02,  fuel:700,   risk:2.2, theft:1.8, style:1,  speed:4 },
  { id:"custom",   kind:"Moto",       name:"Moto custom 883",           price:14000,   dep:0.10, ins:0.08, tax:0.03,  fuel:900,   risk:2.0, theft:1.4, style:5,  speed:6 },
  { id:"bigbike",  kind:"Moto",       name:"Moto esportiva 1000cc",     price:19000,   dep:0.12, ins:0.10, tax:0.03,  fuel:1100,  risk:3.0, theft:1.6, style:6,  speed:9 },
  { id:"used",     kind:"Usado",      name:"Carro usado (12 anos)",     price:4500,    dep:0.09, ins:0.15, tax:0.01,  fuel:1500,  risk:1.4, theft:1.0, style:0,  speed:3 },
  { id:"compact",  kind:"Popular",    name:"Hatch popular 1.0",         price:15000,   dep:0.13, ins:0.07, tax:0.03,  fuel:1300,  risk:1.0, theft:1.3, style:1,  speed:3 },
  { id:"sedan",    kind:"Sedã",       name:"Sedã médio",                price:30000,   dep:0.12, ins:0.06, tax:0.03,  fuel:1600,  risk:0.9, theft:1.2, style:3,  speed:5 },
  { id:"pickup",   kind:"Picape",     name:"Picape cabine dupla diesel",price:58000,   dep:0.10, ins:0.06, tax:0.03,  fuel:2400,  risk:0.9, theft:1.5, style:4,  speed:5 },
  { id:"suv",      kind:"SUV",        name:"SUV familiar",              price:45000,   dep:0.12, ins:0.06, tax:0.03,  fuel:2000,  risk:0.8, theft:1.4, style:4,  speed:5 },
  { id:"suv_lux",  kind:"SUV",        name:"SUV de luxo",               price:110000,  dep:0.14, ins:0.06, tax:0.035, fuel:2600,  risk:0.8, theft:1.7, style:7,  speed:7 },
  { id:"ev",       kind:"Sedã",       name:"Elétrico premium",          price:65000,   dep:0.15, ins:0.05, tax:0.01,  fuel:500,   risk:0.8, theft:0.9, style:6,  speed:7 },
  { id:"sport",    kind:"Esportivo",  name:"Coupé esportivo",           price:98000,   dep:0.14, ins:0.08, tax:0.04,  fuel:2800,  risk:1.8, theft:1.6, style:7,  speed:9 },
  { id:"lux",      kind:"Luxo",       name:"Sedã de luxo alemão",       price:125000,  dep:0.15, ins:0.06, tax:0.04,  fuel:2500,  risk:0.8, theft:1.5, style:8,  speed:7 },
  { id:"armored",  kind:"Blindado",   name:"SUV blindado nível III-A",  price:160000,  dep:0.13, ins:0.05, tax:0.04,  fuel:3200,  risk:0.9, theft:0.3, style:7,  speed:5, armored:true },
  { id:"hyper",    kind:"Supercarro", name:"Superesportivo italiano",   price:390000,  dep:0.10, ins:0.06, tax:0.04,  fuel:4500,  risk:2.0, theft:1.2, style:10, speed:10 },
  { id:"hyper2",   kind:"Supercarro", name:"Hipercarro de edição limitada", price:2400000, dep:0.02, ins:0.04, tax:0.04, fuel:6000, risk:2.2, theft:0.8, style:10, speed:10 },
  { id:"motorhome",kind:"Especial",   name:"Motorhome",                 price:120000,  dep:0.08, ins:0.05, tax:0.03,  fuel:5000,  risk:1.0, theft:0.6, style:5,  speed:3 },
  { id:"boat",     kind:"Especial",   name:"Lancha 32 pés",             price:280000,  dep:0.09, ins:0.07, tax:0.02,  fuel:9000,  risk:0.6, theft:0.5, style:8,  speed:6, noLicense:true },
  { id:"heli",     kind:"Especial",   name:"Helicóptero executivo",     price:2800000, dep:0.07, ins:0.06, tax:0.01,  fuel:80000, risk:1.2, theft:0.1, style:10, speed:10, noLicense:true },
  { id:"jet",      kind:"Especial",   name:"Jatinho particular",        price:9000000, dep:0.06, ins:0.05, tax:0.01,  fuel:300000,risk:0.6, theft:0.05,style:10, speed:10, noLicense:true },
];
/* Investimentos: retorno e volatilidade; o ciclo econômico (systems/economy.js) desloca o retorno. */
DATA.investments = [
  { id:"savings", name:"Poupança / Renda Fixa",   mu:0.035, sigma:0.005, cycle:0.2 },
  { id:"bonds",   name:"Títulos do Governo",       mu:0.05,  sigma:0.03,  cycle:0.3 },
  { id:"reit",    name:"Fundos Imobiliários",      mu:0.065, sigma:0.12,  cycle:0.8 },
  { id:"gold",    name:"Ouro",                     mu:0.03,  sigma:0.14,  cycle:-0.6 },
  { id:"index",   name:"Fundo de Índice (ações)",  mu:0.07,  sigma:0.18,  cycle:1.0 },
  { id:"stocks",  name:"Ações individuais",        mu:0.075, sigma:0.32,  cycle:1.3 },
  { id:"crypto",  name:"Criptomoedas",             mu:0.08,  sigma:0.8,   cycle:1.5 },
];
/* Negócios. front = pode servir de fachada para lavagem (systems/underworld.js). */
DATA.businesses = [
  { id:"food",    name:"Food truck",            cost:25000,  revenue:60000,   vol:0.35, front:false },
  { id:"carwash", name:"Lava-jato",             cost:30000,  revenue:70000,   vol:0.25, front:true },
  { id:"store",   name:"Loja de roupas",        cost:60000,  revenue:140000,  vol:0.30, front:false },
  { id:"cafe",    name:"Cafeteria",             cost:80000,  revenue:170000,  vol:0.30, front:true },
  { id:"gym",     name:"Academia de bairro",    cost:120000, revenue:220000,  vol:0.28, front:true },
  { id:"agency",  name:"Agência digital",       cost:40000,  revenue:150000,  vol:0.45, front:false },
  { id:"nightclub",name:"Casa noturna",         cost:220000, revenue:420000,  vol:0.40, front:true },
  { id:"exchange",name:"Casa de câmbio",        cost:180000, revenue:300000,  vol:0.30, front:true, needs:"fin" },
  { id:"construction",name:"Construtora",       cost:500000, revenue:1200000, vol:0.35, front:true, needs:"eng" },
  { id:"startup", name:"Startup de tecnologia", cost:150000, revenue:200000,  vol:0.90, needs:"cs" },
  { id:"clinic",  name:"Clínica médica",        cost:300000, revenue:650000,  vol:0.20, needs:"med" },
];
DATA.gifts = [
  { id:"flowers",  name:"Flores",            price:40,    rel:4 },
  { id:"book",     name:"Livro",             price:30,    rel:3 },
  { id:"perfume",  name:"Perfume",           price:120,   rel:6 },
  { id:"watch",    name:"Relógio",           price:600,   rel:10 },
  { id:"jewel",    name:"Joia",              price:3000,  rel:16 },
  { id:"trip",     name:"Viagem surpresa",   price:6000,  rel:22 },
];
