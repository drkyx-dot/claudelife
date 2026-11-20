"use strict";
/* systems/activities.js */

const ACT_LIMIT = 6; // "energia" por ano para atividades pessoais

const R = (ok, msg) => ({ ok, msg });

function spendEnergy(){ if (S.activitiesThisYear >= ACT_LIMIT) return false; S.activitiesThisYear++; return true; }

function canAfford(v){ return S.money >= v; }

const adult = () => P().age >= 18;

/* ---------- Atividades pessoais ----------
   Retornos decrescentes: a n-ésima repetição da mesma atividade no ano
   rende 1/(1 + 0.7·n). Atividades físicas rendem menos com a idade.
   Nenhuma atividade cura doença — isso é papel do sistema de saúde. */
const dim = id => 1 / (1 + 0.7 * num(S.actCount[id]));
const ageBody = () => P().age > 60 ? 0.6 : P().age > 45 ? 0.8 : 1;
const sc = (v, id) => Math.max(v > 0 ? 1 : 0, Math.round(v * dim(id)));
const ACTIVITIES = [
  { id:"gym", name:"Academia", emoji:"🏋️", minAge:12, cost:300, desc:"Saúde, aparência, −estresse", run:()=>{
      S.health.exercised = true; let extra = "";
      if (P().age > 55 && chance(0.04)) extra = " Torci o joelho." + injure(rint(5,9), "Lesão na academia", 0.15);
      addStress(-sc(3,"gym"));
      return "Treinei pesado." + fx({ health: sc(rint(2,5)*ageBody(),"gym"), looks: sc(rint(0,2),"gym") }) + extra; } },
  { id:"read", name:"Ler livros", emoji:"📚", minAge:5, cost:0, desc:"+Inteligência", run:()=> "Devorei vários livros." + fx({ intelligence: sc(rint(1,3)*(1-P().stats.intelligence/125),"read") }) },
  { id:"course", name:"Curso online", emoji:"💻", minAge:16, cost:200, desc:"Inteligência; desempenho no trabalho", run:()=>{ if (S.job) S.job.perf = clamp(S.job.perf + sc(5,"course")); return "Concluí um curso de especialização." + fx({ intelligence: sc(rint(1,3),"course") }); } },
  { id:"meditate", name:"Meditar", emoji:"🧘", minAge:10, cost:0, desc:"−Estresse, +Felicidade", run:()=>{ addStress(-sc(rint(5,10),"meditate")); return "Encontrei paz interior." + fx({ happiness: sc(rint(2,5),"meditate") }); } },
  { id:"walk", name:"Caminhar no parque", emoji:"🌳", minAge:4, cost:0, desc:"Exercício leve", run:()=>{ if (P().age >= 60) S.health.exercised = true; addStress(-2); return "Ar fresco faz bem." + fx({ health: sc(rint(1,2),"walk"), happiness: 1 }); } },
  { id:"hobby", name:"Hobby criativo", emoji:"🪴", minAge:8, cost:80, desc:"−Estresse, +Felicidade", run:()=>{ addStress(-sc(5,"hobby")); return pick(["Cuidei do jardim.","Cozinhei algo novo.","Pintei um quadro.","Montei um quebra-cabeça enorme."]) + fx({ happiness: sc(rint(3,6),"hobby") }); } },
  { id:"party", name:"Balada", emoji:"🪩", minAge:16, cost:150, desc:"Diversão; risco de beber demais", run:()=>{
      if (chance(0.35)) S.addictions.alcohol = clamp(S.addictions.alcohol + rint(2,6));
      if (chance(0.25)){ enqueue("ev_approach_date"); return "Alguém ficou me olhando a noite toda… 👀" + fx({happiness:4}); }
      return "Dancei até amanhecer." + fx({ happiness: sc(rint(3,8),"party"), health:-rint(0,2) }); } },
  { id:"networking", name:"Networking", emoji:"🤝", minAge:20, cost:250, desc:"+Reputação; contatos futuros", cond:()=>!!S.job || S.edu.school==="uni", run:()=>{
      addRep(sc(rint(2,4),"networking")); addStress(2);
      if (chance(0.15)) schedule("contactOffer", rint(1,2), {}, "Um contato de networking pode render uma proposta.");
      return "Troquei cartões com gente influente."; } },
  { id:"vacation", name:"Viajar de férias", emoji:"✈️", minAge:18, cost:3500, desc:"++Felicidade, −−Estresse", run:()=>{ addStress(-sc(15,"vacation")); return `Viagem para ${pick(["a praia","as montanhas","Paris","Tóquio","Buenos Aires","o Caribe","Lisboa"])}!` + fx({ happiness: sc(rint(8,15),"vacation") }); } },
  { id:"therapy", name:"Terapia", emoji:"🛋️", minAge:10, cost:900, desc:"−Estresse; trata depressão", run:()=>{
      addStress(-sc(rint(8,14),"therapy"));
      const d = S.illnesses.find(i=>i.id==="depress" && i.diagnosed);
      if (d && !d.treated){ d.treated = true; d.tier = "private"; return "Comecei acompanhamento para a depressão." + fx({happiness:5}); }
      if (S.illnesses.some(i=>i.id==="depress" && !i.diagnosed)){ const u = S.illnesses.find(i=>i.id==="depress"); u.diagnosed = true; return "A terapeuta identificou um quadro de depressão." ; }
      return "Boas sessões." + fx({ happiness: sc(rint(3,7),"therapy") }); } },
  { id:"music", name:"Praticar música", emoji:"🎹", minAge:6, cost:100, desc:"+Talento musical", run:()=>{ P().talents.music = clamp(P().talents.music + sc(rint(2,6),"music")); return "Horas de ensaio." + fx({happiness:2}); } },
  { id:"acting", name:"Aulas de teatro", emoji:"🎭", minAge:6, cost:150, desc:"+Talento de atuação", run:()=>{ P().talents.acting = clamp(P().talents.acting + sc(rint(2,6),"acting")); return "Improvisos e monólogos." + fx({happiness:2}); } },
  { id:"train", name:"Treinar esporte", emoji:"🏃", minAge:6, cost:100, desc:"+Talento esportivo, exercício", run:()=>{ P().talents.sport = clamp(P().talents.sport + sc(rint(2,6),"train")); S.health.exercised = true; return "Treino puxado." + fx({health: sc(rint(1,3)*ageBody(),"train")}); } },
  { id:"license", name:"Autoescola", emoji:"🪪", minAge:18, cost:400, desc:"Tirar a carteira", cond:()=>!S.flags.license, run:()=>{ if (chance(0.5 + P().stats.intelligence/250)){ S.flags.license = true; return "Passei na prova de direção! 🪪" + fx({happiness:6}); } return "Reprovei no exame de direção." + fx({happiness:-3}); } },
  { id:"lottery", name:"Loteria", emoji:"🎟️", minAge:18, cost:10, desc:"Chance minúscula", run:()=>{ S.addictions.gambling = clamp(S.addictions.gambling + 1); const r = rand(); if (r < 0.0004){ const w = wageOf(rint(2e6,4e7)); achieve("lottery","Ganhou na loteria"); return "GANHEI NA LOTERIA!!! 🤑" + fx({money:w, happiness:30}); } if (r < 0.03) return "Acertei a quadra." + fx({money:priceOf(rint(50,800))}); return "Não foi dessa vez."; } },
  { id:"casino", name:"Cassino", emoji:"🎰", minAge:18, cost:0, desc:"Aposte 10% do caixa (vicia)", run:()=>{ S.addictions.gambling = clamp(S.addictions.gambling + rint(3,6)); const bet = Math.max(0, Math.round(S.money*0.1)); if (!bet) return "Sem dinheiro para apostar."; return chance(0.46) ? "A sorte sorriu!" + fx({money:bet, happiness:6}) : "A casa sempre vence." + fx({money:-bet, happiness:-4}); } },
  { id:"volunteer", name:"Voluntariado", emoji:"🙌", minAge:12, cost:0, desc:"+Karma, +Reputação", run:()=>{ addRep(1); if (!S.flags.volRef && chance(0.25)){ S.flags.volRef = true; schedule("volunteerReference", rint(1,3)); } return "Ajudei quem precisava." + fx({happiness: sc(4,"volunteer"), karma:5}); } },
  { id:"shopping", name:"Fazer compras", emoji:"🛍️", minAge:10, cost:400, desc:"+Felicidade passageira, −estresse", run:()=>{ addStress(-sc(4,"shopping")); if (hasTrait("spendthrift")) addStat("happiness", 2); return pick(["Comprei roupas novas.","Gastei mais do que devia no shopping.","Achei uma promoção imperdível (ou nem tanto)."]) + fx({ happiness: sc(rint(2,5),"shopping") }); } },
  { id:"social", name:"Postar nas redes", emoji:"📱", minAge:13, cost:0, desc:"+Fama (talvez)", run:()=>{ const viral = chance((0.04 + P().stats.looks/1000 + P().fame/400) * dim("social")); return viral ? "Meu post viralizou! 🔥" + fx({fame:rint(5,15), happiness:6}) : "Algumas curtidas." + fx({fame:rand()<0.5?1:0}); } },
];

function doActivity(id){
  const a = byId(ACTIVITIES, id);
  if (P().age < a.minAge) return R(false, `Idade mínima: ${a.minAge}.`);
  if (inPrison()) return R(false, "Você está preso(a).");
  if (a.cond && !a.cond()) return R(false, "Indisponível.");
  const cost = priceOf(a.cost);
  if (cost && P().age >= 18 && !canAfford(cost)) return R(false, `Custa ${fmt(cost)}.`);
  if (!spendEnergy()) return R(false, "Você está exausto(a). Espere o próximo ano.");
  if (cost && P().age >= 18) addMoney(-cost);
  const msg = a.run(); S.actCount[id] = num(S.actCount[id]) + 1;
  log(`${a.emoji} ${a.name}: ${msg}`, ""); sanitize();
  if (P().stats.health <= 0) die("complicações de saúde");
  return R(true, msg);
}
