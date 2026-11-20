"use strict";
/* systems/relationships.js */

/* ---------- Relacionamentos ---------- */
function relationshipsYear(){
  const me = P();
  for (const r of S.rels){
    if (!r.alive) continue;
    if (r.unborn){ r.unborn--; if (r.unborn <= 0){ delete r.unborn; r.age = 0; log(`Nasceu meu irmão/irmã: ${r.first}! 👶`, "good"); } continue; }
    r.age++;
    if (r.role === "spouse" && r.money !== undefined){ r.money = Math.round(num(r.money) * (1 + num(S.world?.inflation)) + num(r.income) * 0.12); } // cônjuge também poupa
    // romance exige manutenção; laços de sangue se estabilizam num patamar
    const romantic = ["partner","spouse","fiance"].includes(r.role), blood = ["mother","father","sibling","child"].includes(r.role);
    let decay = romantic ? rfloat(2,6) : blood ? (r.rel > 35 ? rfloat(0,1.5) : -0.8) : rfloat(0.5,3);
    // estresse e vícios desgastam convivência (nexo saúde mental → relações)
    if (me.stress > 65 && (romantic || r.role === "child")) decay += (me.stress - 65) / 10;
    if (S.addictions.alcohol > 50 && (romantic || r.role === "child")) decay += 2;
    r.rel = clamp(r.rel - decay + (r.interacted ? 2 : 0));
    r.interacted = false;
    // morte de NPCs (Gompertz simplificado)
    // mortalidade de NPC; tratamento pago pelo jogador protege por alguns anos (r.cared)
    let q = r.age < 1 ? 0.004 : Math.min(0.6, 0.00006*Math.exp(0.088*r.age));
    if (r.cared > 0){ q *= 0.5; r.cared--; }
    if (chance(q)){ npcDies(r, r.age > 75 ? "causas naturais" : pick(["um acidente","um infarto","uma doença súbita","um AVC"])); continue; }
    if (r.role === "child" && r.age === 18){ log(`${r.first} fez 18 anos e saiu de casa.`, ""); }
    if (r.role === "child" && r.age >= 22 && !r.job) r.job = pick(["Professor","Engenheiro","Vendedor","Designer","Enfermeiro","Músico","Advogado","Autônomo","Programador"]);
    if ((r.role === "partner" || r.role==="fiance") && r.rel < 18 && chance(0.5)){ r.role = "ex"; log(`${r.first} terminou comigo. 💔`, "bad"); addStat("happiness",-12); }
    else if (r.role === "spouse" && r.rel < 12 && chance(0.4)){ divorce(r, true); }
    if (r.role === "friend" && r.rel < 10 && chance(0.4)){ r.role = "acquaintance"; log(`Perdi o contato com ${r.first}.`, ""); }
  }
  // limpar: ex/conhecidos antigos somem da lista para não inchar o save
  S.rels = S.rels.filter(r => !(["ex","acquaintance","coworker"].includes(r.role) && me.age - (r.since||0) > 15));
  if (me.age >= 6 && me.age <= 70 && S.rels.filter(r=>r.role==="friend"&&r.alive).length < 4 && chance(0.3 + (hasTrait("charismatic")?0.2:0) - (hasTrait("shy")?0.15:0))){
    enqueue("ev_approach_friend"); // o jogador decide se aceita a amizade
  }
  if (me.age < 18 && parents().length === 0 && !S.flags.adopted){ S.flags.adopted = true; log("Sem meus pais, fui morar com parentes que me acolheram.", "bad"); }
}

function npcDies(r, cause){
  r.alive = false; r.deathAge = r.age; r.deathYear = year();
  if (r.livesWithMe){ r.livesWithMe = false; S.flags.caregiver = parents().some(p => p.livesWithMe); }
  const close = ["mother","father","spouse","partner","child","sibling","fiance"].includes(r.role);
  log(`${relLabel(r)} ${r.first} faleceu aos ${r.age} anos (${cause}). 🕯️`, "bad");
  if (close) addStat("happiness", -Math.round(10 + r.rel/6));
  if ((r.role === "mother" || r.role === "father") && !r.inheritPaid){
    r.inheritPaid = true;
    const sibs = S.rels.filter(x=>x.role==="sibling"&&x.alive&&!x.unborn).length;
    const pool = priceOf(DATA.classes[P().cls].inherit) * rfloat(0.4, 1.4) * (parents().length ? 0.5 : 1);
    const share = Math.round(pool / (sibs+1) * (r.rel > 30 ? 1 : 0.2));
    if (share > 0){
      if (P().age >= 18){ addMoney(share); log(`Herdei ${fmt(share)} de ${r.first}.`, "good"); }
      else { S.trustFund = num(S.trustFund) + share; log(`Uma herança de ${fmt(share)} ficou guardada até eu completar 18 anos.`, ""); }
    }
  }
  if (r.role === "spouse") { r.role = "late_spouse"; }
  if (r.role === "partner" || r.role === "fiance") r.role = "late_partner";
}

/* Divórcio: partilha conforme o regime de bens (systems/bonds.js).
   litigious = briga judicial (custas + indenização por fraude, se houver). */
function divorce(sp, theyAsked, litigious = 0){
  ensureSpouseMoney(sp);
  const reg = regime(), t = divorceSplit(sp);
  sp.role = "ex";
  let extra = "";
  if (litigious){ const fees = priceOf(rint(4000, 15000)), dmg = Math.round(litigious * 1.5); const paid = Math.min(Math.max(0, S.money), fees + dmg); addMoney(-paid); sp.money += Math.max(0, paid - fees); extra = ` Divórcio litigioso: ${fmt(paid)} entre custas e indenização.`; addRep(-8); }
  log(`${theyAsked ? sp.first + " pediu o divórcio" : "Pedi o divórcio de " + sp.first} (${REGIMES[reg].name.toLowerCase()}). ${t > 0 ? `Na partilha, paguei ${fmt(t)}.` : t < 0 ? `Na partilha, recebi ${fmt(-t)}.` : "Ninguém deveu nada na partilha."}${extra} ⚖️`, "bad");
  addStat("happiness", -15); S.flags.prenup = false; S.flags.regime = null; S.flags.divorces = (S.flags.divorces||0)+1;
}

function relLabel(r){
  const g = r.gender === "F";
  return ({ mother:"Mãe", father:"Pai", sibling: g?"Irmã":"Irmão", partner: g?"Namorada":"Namorado", fiance: g?"Noiva":"Noivo",
    spouse: g?"Esposa":"Marido", child: g?"Filha":"Filho", friend: g?"Amiga":"Amigo", ex: g?"Ex-namorada":"Ex-namorado",
    coworker: "Colega", acquaintance:"Conhecido(a)", late_spouse: g?"Esposa (falecida)":"Marido (falecido)", late_partner:"Ex-parceiro(a)" })[r.role] || r.role;
}

function addChild(adopted){
  const pt = partner();
  const c = makeNPC("child", country(), { age:0, last: P().last, rel: rint(70,95) });
  c.since = P().age; c.adopted = !!adopted; c.otherParent = pt ? pt.first : null;
  S.rels.push(c);
  log(`${adopted ? "Adotei" : "Nasceu"} ${c.gender==="F"?"minha filha":"meu filho"} ${c.first}! 👶`, "milestone");
  addStat("happiness", 15); achieve("parent","Tornou-se pai/mãe");
  return c;
}

/* ---------- Relacionamentos: interações ---------- */
function interact(u, kind, extra){
  const r = relBy(u); if (!r || !r.alive) return R(false, "Pessoa indisponível.");
  if (inPrison() && !["talk"].includes(kind)) return R(false, "Da prisão só dá para conversar por carta.");
  const name = r.first; r.interacted = true;
  switch(kind){
    case "talk": { const d = rint(1,7) + (hasTrait("charismatic")?2:0); r.rel = clamp(r.rel+d); return R(true, `Conversei com ${name}. (+${d} relação)`); }
    case "time": { if (!spendEnergy()) return R(false,"Sem energia este ano."); const d = rint(5,12); r.rel = clamp(r.rel+d); addStat("happiness",3); addStress(-3); log(`Passei um tempo de qualidade com ${name}.`, ""); return R(true, `Momentos ótimos com ${name}. (+${d})`); }
    case "gift": { const g = byId(DATA.gifts, extra), pr = priceOf(g.price); if (!canAfford(pr)) return R(false, `Custa ${fmt(pr)}.`); addMoney(-pr); r.rel = clamp(r.rel+g.rel); log(`Dei ${g.name.toLowerCase()} para ${name}.`, ""); return R(true, `${name} amou o presente! (+${g.rel})`); }
    case "money": {
      if (r.askedMoney === P().age) return R(false, "Você já pediu este ano.");
      r.askedMoney = P().age;
      const cls = clsBand(), p = r.rel/140 + r.generous/300 + cls*0.05;
      if (chance(p)){ const v = priceOf(rint(20, 400) * Math.pow(3,cls)); addMoney(v); r.rel = clamp(r.rel-3); log(`${name} me deu ${fmt(v)}.`, "good"); return R(true, `${name} te deu ${fmt(v)}!`); }
      r.rel = clamp(r.rel-6); return R(false, `${name} disse não.`);
    }
    case "argue": { r.rel = clamp(r.rel - rint(6,15)); addStat("happiness",-2); log(`Discuti com ${name}.`, "bad"); return R(true, `Vocês brigaram. Relação abalada.`); }
    case "advise": { const d = rint(2,9); r.rel = clamp(r.rel+d); return R(true, `${name} ouviu seus conselhos. (+${d})`); }
    case "propose": {
      if (r.role !== "partner") return R(false,"?");
      if (!adult()) return R(false, "Vocês são jovens demais.");
      if (chance(r.rel/110 - 0.1)){ r.role = "fiance"; log(`Pedi ${name} em casamento e ouvi SIM! 💍`, "milestone"); addStat("happiness",12); return R(true, `${name} aceitou! Vocês estão noivos.`); }
      r.rel = clamp(r.rel-15); log(`Pedi ${name} em casamento e levei um não.`, "bad"); addStat("happiness",-10); return R(false, `${name} recusou...`);
    }
    case "marry": { if (r.role !== "fiance") return R(false,"?"); return marryWith(u, extra === "big" ? "big" : "simple", REGIMES[extra] ? extra : extra === "prenup" ? "separacao" : "parcial"); }
    case "baby": {
      if (!["partner","spouse","fiance"].includes(r.role)) return R(false,"?");
      if (!adult()) return R(false,"Jovem demais.");
      const ages = [P().age, r.age], femaleAge = P().gender==="F" ? P().age : (r.gender==="F" ? r.age : 30);
      if (P().gender === r.gender) return R(false, "Vocês podem adotar (botão Adotar).");
      if (femaleAge > 47) return R(false, "A idade não permite mais uma gravidez.");
      if (r.rel < 40) return R(false, `${name} não quer ter filhos agora.`);
      if (chance(0.55 - (femaleAge-30)*0.02)){ addChild(false); return R(true, "Vocês terão um bebê! 👶"); }
      return R(false, "Não aconteceu desta vez.");
    }
    case "breakup": {
      if (r.role === "spouse"){ divorce(r, false); return R(true, "Divórcio concluído."); }
      if (r.role === "partner" || r.role === "fiance"){ r.role = "ex"; log(`Terminei com ${name}.`, "bad"); addStat("happiness",-6); return R(true, "Vocês terminaram."); }
      if (r.role === "friend"){ r.role = "acquaintance"; return R(true, "Amizade encerrada."); }
      return R(false,"?");
    }
    case "visitGrave": { addStat("happiness",2); return R(true, `Levei flores ao túmulo de ${name}. 🌹`); }
  }
  return R(false,"?");
}

function marry(r, cost, prenup){
  if (!r) return; addMoney(-Math.min(Math.max(0,S.money), cost));
  r.role = "spouse"; r.rel = clamp(r.rel+10); r.marriedAt = P().age; S.flags.prenup = !!prenup; S.flags.married = (S.flags.married||0)+1;
  log(`Casei com ${r.first} ${r.last}! 💒`, "milestone"); achieve("married","Casou-se");
  if (P().gender === "F" && chance(0.3) && r.gender==="M") {} // sobrenome mantido por simplicidade
}

/* Gera 3 pretendentes para o app de namoro. */
function datingCandidates(){
  if (!spendEnergy()) return null;
  const cands = [0,1,2].map(()=>{ const p = makePartner([-6,6], [35,65]); p.looks = rint(15,98); return p; });
  return cands;
}

function dateCandidate(p){
  const diff = p.looks - P().stats.looks;
  const chanceYes = clamp(0.6 - diff/100 + (hasTrait("charismatic")?0.15:0) - (hasTrait("shy")?0.1:0) + P().fame/300 + (netWorth() > wageOf(1e6) ? 0.1 : 0), 5, 95)/100;
  if (!chance(chanceYes)){ log(`${p.first} recusou um encontro comigo.`, "bad"); addStat("happiness",-3); return R(false, `${p.first} não quis sair com você.`); }
  const old = partner(); if (old){ old.role = "ex"; log(`Terminei com ${old.first} para ficar com ${p.first}.`, "bad"); }
  p.role = "partner"; p.since = P().age; S.rels.push(p);
  log(`Comecei a namorar ${p.first} ${p.last}. 💕`, "good"); addStat("happiness",8); return R(true, `Você e ${p.first} estão namorando!`);
}

function adoptChild(){
  if (P().age < 25) return R(false, "Idade mínima para adoção: 25.");
  const cost = priceOf(3000); if (!canAfford(cost)) return R(false, `Custa ${fmt(cost)}.`);
  if (S.record.length) return R(false, "Processo negado por antecedentes criminais.");
  addMoney(-cost); const c = addChild(true); c.age = rint(0,6); return R(true, `Você adotou ${c.first}!`);
}
