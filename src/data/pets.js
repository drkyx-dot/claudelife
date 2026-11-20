"use strict";
/* =====================================================================
   data/pets.js — espécies. src: shelter (abrigo) | shop | exotic (clandestino).
   price/fee em moeda base; food/vet = custo ANUAL; life = expectativa de vida;
   size: 0 pequeno · 1 precisa de quintal · 2 precisa de terreno grande;
   danger: 0–1 (agressividade/letalidade potencial); illegal: posse proibida.
   ===================================================================== */
DATA.petSpecies = [
  { id:"dog_srd",  name:"Cachorro vira-lata", emoji:"🐕", src:"shelter", price:150,   food:700,   vet:400,  life:[11,16], size:0, danger:0 },
  { id:"cat_srd",  name:"Gato sem raça",      emoji:"🐈", src:"shelter", price:120,   food:500,   vet:300,  life:[12,18], size:0, danger:0 },
  { id:"rabbit",   name:"Coelho",             emoji:"🐇", src:"shelter", price:60,    food:300,   vet:200,  life:[7,11],  size:0, danger:0 },
  { id:"labrador", name:"Labrador",           emoji:"🦮", src:"shop",    price:4000,  food:1100,  vet:700,  life:[10,13], size:1, danger:0 },
  { id:"bulldog",  name:"Buldogue francês",   emoji:"🐶", src:"shop",    price:7000,  food:900,   vet:1400, life:[9,12],  size:0, danger:0 },
  { id:"pitbull",  name:"Pitbull",            emoji:"🐕‍🦺", src:"shop",   price:2500,  food:1000,  vet:600,  life:[11,14], size:1, danger:0.06 },
  { id:"persian",  name:"Gato persa",         emoji:"🐈", src:"shop",    price:3500,  food:700,   vet:800,  life:[12,17], size:0, danger:0 },
  { id:"parrot",   name:"Papagaio",           emoji:"🦜", src:"shop",    price:3000,  food:400,   vet:300,  life:[40,60], size:0, danger:0 },
  { id:"canary",   name:"Canário",            emoji:"🐤", src:"shop",    price:150,   food:100,   vet:80,   life:[8,12],  size:0, danger:0 },
  { id:"turtle",   name:"Tartaruga",          emoji:"🐢", src:"shop",    price:500,   food:150,   vet:100,  life:[40,70], size:0, danger:0 },
  { id:"iguana",   name:"Iguana",             emoji:"🦎", src:"shop",    price:1200,  food:300,   vet:300,  life:[12,20], size:0, danger:0 },
  { id:"cornsnake",name:"Cobra-do-milho",     emoji:"🐍", src:"shop",    price:1500,  food:250,   vet:250,  life:[15,20], size:0, danger:0.01 },
  { id:"monkey",   name:"Macaco-prego",       emoji:"🐒", src:"exotic",  price:15000, food:2500,  vet:2000, life:[25,40], size:1, danger:0.12, illegal:true },
  { id:"wolf",     name:"Lobo",               emoji:"🐺", src:"exotic",  price:35000, food:6000,  vet:3000, life:[10,14], size:2, danger:0.38, illegal:true },
  { id:"python",   name:"Píton gigante",      emoji:"🐍", src:"exotic",  price:25000, food:3000,  vet:2500, life:[20,30], size:1, danger:0.3,  illegal:true },
  { id:"caiman",   name:"Jacaré",             emoji:"🐊", src:"exotic",  price:30000, food:5000,  vet:3500, life:[30,50], size:2, danger:0.42, illegal:true },
  { id:"panther",  name:"Pantera",            emoji:"🐆", src:"exotic",  price:160000,food:22000, vet:9000, life:[12,18], size:2, danger:0.62, illegal:true },
  { id:"bear",     name:"Urso",               emoji:"🐻", src:"exotic",  price:150000,food:26000, vet:9000, life:[20,30], size:2, danger:0.6,  illegal:true },
  { id:"tiger",    name:"Tigre",              emoji:"🐅", src:"exotic",  price:180000,food:30000, vet:11000,life:[15,20], size:2, danger:0.7,  illegal:true },
];
DATA.petNames = ["Bolt","Pipoca","Thor","Mel","Paçoca","Luna","Bidu","Nina","Rex","Fumaça","Kiara","Zeus","Simba","Amora","Tufão","Nala","Chico","Mingau","Shiva","Dante"];
