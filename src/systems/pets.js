"use strict";
/* =====================================================================
   systems/pets.js — ANIMAIS: adoção, pet shop, mercado exótico.

   Cada pet: bond (vínculo), hunger (fome), stress, health, trained (0–1),
   neglect (anos SEGUIDOS de descuido), played (interagiu no ano).
   Tick anual: paga ração+veterinário (sem dinheiro → fome +35);
   sem interação → estresse +20 e vínculo −8; espaço inadequado (porte
   maior que a moradia) → estresse +25. Ano com fome ≥ 50 ou estresse ≥ 60
   conta como DESCUIDO.

   RISCO DE ATAQUE (só espécies com danger > 0.05), por ano:
     p = danger × (0.008 + 0.12·anosDeDescuido + fome·0.0015 + estresse·0.001)
         × (1 − vínculo/200) × (1 − treino·0.35)
   Tigre bem cuidado ≈ 0,5%/ano; 2 anos sem comida nem atenção ≈ 25–30%/ano.
   Ataque: pode MATAR o dono (fim de jogo), ferir gravemente ou atacar
   uma visita (processo, prisão possível, animal sacrificado).
   Exóticos são ilegais: fiscalização ambiental pode apreender + multar.
   ===================================================================== */
const MAX_PETS = 6;
const petSp = pt => byId(DATA.petSpecies, pt.sp);
function homeSpace(){
  if (inPrison()) return 0;
  const own = residence();
  if (own){ const k = byId(DATA.properties, own.id)?.kind; return k === "Sítio/Fazenda" || k === "Mansão" ? 2 : k === "Casa" ? 1 : 0; }
  if (S.rental) return /Casa/i.test(byId(DATA.rentals, S.rental)?.name || "") ? 1 : 0;
  if (parents().length || P().age < 18) return clsBand() >= 4 ? 2 : clsBand() >= 2 ? 1 : 0;
  return 0;
}
const spaceName = n => ["apartamento/sem quintal","casa com quintal","sítio, fazenda ou mansão"][n];

function addPet(spId, opts = {}){
  const sp = byId(DATA.petSpecies, spId);
  const pt = { uid:uid(), sp:spId, name: opts.name || pick(DATA.petNames), age: num(opts.age, 0), bond: num(opts.bond, 45), hunger:0, stress: num(opts.stress, 10),
    neglect:0, health: num(opts.health, 90), trained: 0, played:false, temper: opts.temper || "dócil", lifespan: rint(...sp.life) };
  (S.pets ||= []).push(pt); S.stats.petsOwned = num(S.stats.petsOwned) + 1;
  log(`${sp.emoji} ${pt.name} (${sp.name.toLowerCase()}) entrou para a família.`, "good");
  return pt;
}
/* Abrigo: 4 bichos gerados por ano (estável no ano). */
function shelterList(){
  if (S.flags.shelterAge !== P().age || !S.flags.shelter){
    S.flags.shelterAge = P().age;
    S.flags.shelter = [0,1,2,3].map(() => { const sp = pick(DATA.petSpecies.filter(s => s.src === "shelter")); return { sp:sp.id, name:pick(DATA.petNames), age:rint(0, 9), temper: pick(["dócil","medroso","brincalhão","ciumento","calmo"]) }; });
  }
  return S.flags.shelter;
}
function canKeep(sp){
  if ((S.pets || []).length >= MAX_PETS) return `Máximo de ${MAX_PETS} animais.`;
  if (inPrison()) return "Você está preso(a).";
  if (sp.src === "exotic" && P().age < 18) return "O mercado exótico só vende para adultos.";
  if (sp.src === "shop" && P().age < 10) return "Peça para seus pais.";
  return null;
}
function adoptPet(i){
  const a = shelterList()[i]; if (!a) return R(false, "Esse já foi adotado.");
  const sp = byId(DATA.petSpecies, a.sp), why = canKeep(sp); if (why) return R(false, why);
  const fee = priceOf(sp.price); if (adult() && !canAfford(fee)) return R(false, `Taxa de adoção: ${fmt(fee)}.`);
  if (adult()) addMoney(-fee);
  S.flags.shelter.splice(i, 1);
  const pt = addPet(sp.id, { name:a.name, age:a.age, temper:a.temper, bond:55 }); P().karma = clamp(P().karma + 4); addStat("happiness", 8);
  return R(true, `Você adotou ${pt.name}! 🐾 (taxa ${fmt(fee)})`);
}
function buyPet(spId, name){
  const sp = byId(DATA.petSpecies, spId); if (!sp || sp.src === "shelter") return R(false, "?");
  const why = canKeep(sp); if (why) return R(false, why);
  const price = priceOf(sp.price); if (!canAfford(price)) return R(false, `Custa ${fmt(price)}.`);
  addMoney(-price);
  if (sp.illegal){ addNoto(4); S.crimeSkill = clamp(S.crimeSkill + 1); if (chance(0.12)){ const fine = priceOf(rint(10000, 40000)); addMoney(-Math.min(Math.max(0,S.money), fine)); S.record.push({ crime:"tráfico de animais silvestres", age:P().age, years:0 }); log(`🚨 Flagrante do Ibama na compra de um(a) ${sp.name.toLowerCase()}: animal apreendido e multa de ${fmt(fine)}.`, "bad", ["crime"]); return R(false, `Era fiscalização! Animal apreendido, multa de ${fmt(fine)} e ficha suja.`); } }
  const pt = addPet(spId, { name: (name || "").trim().slice(0, 20) || undefined, bond: sp.danger > 0.2 ? 25 : 40, temper: sp.danger > 0.2 ? "selvagem" : "dócil" });
  if (sp.danger >= 0.3) remember(`Tenho um(a) ${sp.name.toLowerCase()} em casa. Se faltar comida, atenção ou espaço, isso pode acabar muito mal.`, "pending");
  return R(true, `${sp.emoji} ${pt.name} é seu/sua! ${sp.illegal ? "⚠️ Posse ilegal: cuidado com a fiscalização." : ""}`);
}
function petAct(u, kind){
  const pt = (S.pets || []).find(x => x.uid === u); if (!pt) return R(false, "?");
  const sp = petSp(pt);
  if (inPrison()) return R(false, "Você está preso(a).");
  switch (kind){
    case "play": {
      if (pt.played) return R(false, `Você já brincou com ${pt.name} este ano. (Treinar gasta energia.)`);
      pt.played = true; pt.bond = clamp(pt.bond + rint(6, 12)); pt.stress = clamp(pt.stress - 15); addStress(-3);
      return R(true, `Brincou com ${pt.name}. ${sp.danger >= 0.3 ? "Com cuidado." : "Que farra!"}` + fx({ happiness: 3 }));
    }
    case "feed": {
      const c = priceOf(Math.max(80, sp.food * 0.25)); if (!canAfford(c)) return R(false, `Ração especial: ${fmt(c)}.`);
      addMoney(-c); pt.hunger = clamp(pt.hunger - 40); pt.bond = clamp(pt.bond + 3);
      return R(true, `${pt.name} devorou a ração especial (${fmt(c)}).`);
    }
    case "train": {
      const c = sp.danger >= 0.2 ? priceOf(3000) : priceOf(300);
      if (!canAfford(c)) return R(false, `Adestrador: ${fmt(c)}.`);
      if (!spendEnergy()) return R(false, "Sem energia este ano.");
      addMoney(-c); pt.trained = Math.min(1, pt.trained + (sp.danger >= 0.2 ? 0.2 : 0.35)); pt.bond = clamp(pt.bond + 5); pt.stress = clamp(pt.stress - 8);
      return R(true, `${pt.name} está ${Math.round(pt.trained*100)}% adestrado(a).`);
    }
    case "vet": {
      const c = priceOf(Math.max(150, sp.vet * 0.6)); if (!canAfford(c)) return R(false, `Consulta: ${fmt(c)}.`);
      addMoney(-c); pt.health = clamp(pt.health + 20); pt.stress = clamp(pt.stress - 5);
      return R(true, `${pt.name} foi ao veterinário${sp.illegal ? " (um que não faz perguntas)" : ""}. Saúde ${Math.round(pt.health)}.`);
    }
    case "giveaway": {
      S.pets = S.pets.filter(x => x !== pt); addStat("happiness", -6);
      if (sp.illegal){ P().karma = clamp(P().karma + 6); log(`${sp.emoji} Entreguei ${pt.name} a um santuário de animais. Sem multa por entrega voluntária.`, ""); return R(true, `${pt.name} foi para um santuário.`); }
      log(`${sp.emoji} Doei ${pt.name} para uma família que vai cuidar bem.`, ""); return R(true, `Doei ${pt.name}.`);
    }
  }
  return R(false, "?");
}

/* Probabilidade anual de ataque (exposta à UI). */
function attackRisk(pt){
  const sp = petSp(pt); if (!sp || sp.danger <= 0.05) return 0;
  return Math.min(0.9, sp.danger * (0.008 + 0.12*pt.neglect + pt.hunger*0.0015 + pt.stress*0.001) * (1 - pt.bond/200) * (1 - pt.trained*0.35));
}
function petsYear(){
  const pets = S.pets || []; if (!pets.length) return;
  const Y = S.yearSummary, space = homeSpace();
  for (const pt of [...pets]){
    const sp = petSp(pt); pt.age++;
    if (inPrison()){
      if (sp.illegal){ S.pets = S.pets.filter(x => x !== pt); log(`${sp.emoji} Sem mim, ${pt.name} foi apreendido(a) pelo Ibama.`, "bad"); continue; }
      pt.bond = clamp(pt.bond - 6); pt.played = false; continue; // família cuida dos domésticos
    }
    // custos: ração + veterinário
    const cost = priceOf(sp.food + sp.vet);
    if (!adult() && !sp.illegal){ pt.hunger = clamp(pt.hunger - 30); } // família banca os pets da criança
    else if (S.money >= cost){ addMoney(-cost); Y.expenses += cost; Y.lines.push([`${sp.emoji} ${pt.name}: ração e veterinário`, -cost]); pt.hunger = clamp(pt.hunger - 40); pt.health = clamp(pt.health + 3); }
    else { pt.hunger = clamp(pt.hunger + 35); pt.health = clamp(pt.health - 8); }
    if (!pt.played){ pt.stress = clamp(pt.stress + 20); pt.bond = clamp(pt.bond - 8); } else pt.stress = clamp(pt.stress - 10);
    if (sp.size > space) pt.stress = clamp(pt.stress + 25);
    pt.neglect = pt.hunger >= 50 || pt.stress >= 60 ? pt.neglect + 1 : 0;
    pt.played = false;
    if (pt.bond >= 60) addStat("happiness", 2);
    // fiscalização ambiental
    if (sp.illegal && chance(0.05 + P().notoriety/1000)){
      const fine = priceOf(rint(15000, 60000)); addMoney(-Math.min(Math.max(0,S.money), fine)); S.pets = S.pets.filter(x => x !== pt);
      S.record.push({ crime:"posse ilegal de animal silvestre", age:P().age, years:0 }); addNoto(6);
      log(`🚨 Denúncia anônima: o Ibama apreendeu ${pt.name} (${sp.name.toLowerCase()}). Multa de ${fmt(fine)}.`, "bad", ["crime"]);
      continue;
    }
    // ataque
    if (chance(attackRisk(pt))){ petAttack(pt, sp); if (!P().alive || S.flags.forcedDeath) return; continue; }
    // velhice / doença
    if (pt.age >= pt.lifespan || pt.health <= 0 || (pt.age >= pt.lifespan - 2 && chance(0.3))){
      S.pets = S.pets.filter(x => x !== pt); addStat("happiness", -Math.round(4 + pt.bond/8));
      log(`🕯️ ${pt.name}, meu/minha ${sp.name.toLowerCase()}, morreu aos ${pt.age} anos.`, "bad");
      if (pt.bond >= 70) remember(`Perder ${pt.name} doeu como perder alguém da família.`, "bad");
    }
  }
}
function petAttack(pt, sp){
  const r = rand(), pDeath = clamp((0.12 + sp.danger*0.35 + pt.neglect*0.08) * 100, 5, 75) / 100;
  S.pets = S.pets.filter(x => x !== pt);
  if (r < pDeath){
    S.flags.forcedDeath = `ataque do próprio ${sp.name.toLowerCase()} (${pt.name})`;
    addFame(15);
    log(`📰 TRAGÉDIA: ${P().first} ${P().last} foi atacado(a) e morto(a) pelo ${sp.name.toLowerCase()} que criava em casa, ${pt.name}. Vizinhos dizem que o animal "não comia havia dias".`, "bad");
    return;
  }
  if (r < pDeath + (1 - pDeath) * 0.55){
    const s = injure(rint(28, 48), `O ataque de ${pt.name}`, 0.7);
    addStress(25); addStat("happiness", -18); addFame(6);
    log(`🩸 ${pt.name} (${sp.name.toLowerCase()}) me atacou. Sobrevivi por pouco; o animal foi sacrificado.${s}`, "bad", ["health"]);
    return;
  }
  const fine = priceOf(rint(30000, 120000)); addMoney(-Math.min(Math.max(0,S.money), fine)); addFame(8); addRep(-12);
  log(`🚑 ${pt.name} (${sp.name.toLowerCase()}) atacou uma visita. Indenização de ${fmt(fine)} e o animal foi sacrificado.`, "bad", ["crime"]);
  if (chance(0.3) && adult()) sendToPrison(rint(1, 3), "lesão corporal culposa (ataque de animal)");
}
