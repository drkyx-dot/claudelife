"use strict";
/* systems/justice.js */

/* ---------- Prisão ---------- */
function prisonYear(){
  if (!S.prison) { if (S.parole > 0) S.parole--; return; }
  S.prison.years--; S.prison.served++;
  if (S.prison.escBlock > 0) S.prison.escBlock--;
  addStat("happiness",-6); addStat("health",-2);
  if (S.prison.years <= 0){
    log(`Cumpri minha pena e saí da prisão. 🔓`, "milestone"); S.prison = null; S.parole = 2; return;
  }
  if (S.prison.served >= (S.prison.life ? 15 : 2) && S.prison.years > 1 && !S.prison.paroleAsked) enqueue("ev_parole");
  else if (chance(0.25)) enqueue("ev_prison_life");
  if (chance((0.18 + (S.prison.security === "máxima" ? 0.12 : 0)) * (1 - num(S.prison.intim)/140))) enqueue("ev_prison_fight"); // intimidação afasta encrenca
  else if (!S.prison.escBlock && chance(0.12)) enqueue("ev_escape_plan");
}

/* security: "mínima" | "média" | "máxima" (padrão: pela pena). Foragido(a)
   preso(a) por outro crime soma o restante da pena antiga. */
function sendToPrison(years, crime, security){
  years = Math.max(1, Math.round(years));
  if (S.wanted){ years += num(S.wanted.remaining) + 2; crime += " + fuga anterior"; security = "máxima"; S.wanted = null; }
  years = Math.min(99, years);
  if (S.fight) S.fight.next = null; // torneio não continua atrás das grades
  const illegalGuns = typeof weaponsOnArrest === "function" ? weaponsOnArrest() : 0;
  if (illegalGuns){ years = Math.min(99, years + illegalGuns*2); crime += " + porte ilegal de arma"; }
  endJob("Preso"); S.partTime = null;
  if (S.edu.school && S.edu.school !== "fund" && S.edu.school !== "medio"){ log("Fui expulso(a) do curso.", "bad"); S.edu.school = null; }
  security = security || (years >= 12 ? "máxima" : years >= 5 ? "média" : "mínima");
  S.prison = { years, served:0, crime, security, escAttempts:0, escBlock:0, life: years >= 99, cat: crimeCategory(crime), remit:0, intim:0, courses:{} }; S.record.push({ crime, age:P().age, years }); S.stats.arrests++;
  // dinheiro sujo é apreendido; organização perde força sem você
  if (S.dirty > 0){ log(`A polícia apreendeu ${fmt(S.dirty)} em dinheiro sujo.`, "bad"); S.dirty = 0; }
  if (S.org){ S.org.heat = clamp(S.org.heat - 20); if (!isBoss()) S.org.respect = clamp(S.org.respect + 8); }
  emit("jail");
  S.rental = null;
  log(`Fui condenado(a) a ${years >= 99 ? "PRISÃO PERPÉTUA" : years + " ano(s) de prisão"} por ${crime} (segurança ${security}). ⛓️`, "bad");
  addStat("happiness",-20); addNoto(15); addRep(-20); addStress(15); S.flags.caregiver = false;
  remember(`A condenação por ${crime} vai pesar em entrevistas e eleições (ficha suja).`, "bad");
  const pt = partner(); if (pt && chance(0.45)){ pt.rel = clamp(pt.rel-30); }
}

/* ---------- Crime ---------- */
function commitCrime(id){
  const c = byId(DATA.crimes, id);
  if (P().age < c.minAge) return R(false, `Idade mínima: ${c.minAge}.`);
  if (inPrison()) return R(false, "Você já está preso(a).");
  if (c.minInt && P().stats.intelligence < c.minInt) return R(false, "Você não tem conhecimento para isso.");
  if (c.needsOrg && !S.org) return R(false, "Esse tipo de serviço só rola com uma organização por trás.");
  if (c.cyber) return commitCyber(c);
  if (S.crimeSkill < num(c.skill)) return R(false, `Exige habilidade criminal ${c.skill} (você tem ${Math.round(S.crimeSkill)}).`);
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  let p = oddsCrime(c).p;
  S.stats.crimes++;
  if (hasTrait("honest")) addStat("happiness",-8);
  P().karma = clamp(P().karma - c.noto/3);
  if (chance(p)){
    const g = priceOf(rint(...c.gain)); addNoto(c.noto*0.5);
    S.stats.crimesOk++; S.crimeSkill = clamp(S.crimeSkill + rint(2,4));
    if (S.org) S.org.respect = clamp(S.org.respect + 3);
    if (c.dirty){ S.dirty += g; S.stats.dirtyEarned += g; log(`🦹 Crime (${c.name}) bem-sucedido: ${fmt(g)} em dinheiro sujo.`, "bad"); emit("crime"); return R(true, `Deu certo! ${fmt(g)} em dinheiro SUJO — precisa lavar antes de usar.`); }
    addMoney(g); log(`🦹 Crime (${c.name}) bem-sucedido: ${fmt(g)}.`, "bad"); emit("crime"); return R(true, `Deu certo! Você conseguiu ${fmt(g)}.`);
  }
  addNoto(c.noto); S.crimeSkill = clamp(S.crimeSkill + 1); emit("siren");
  if (P().age < 18){
    if (c.years[1] >= 3){ sendToPrison(1, c.name + " (reformatório)"); return R(false, "Pego(a)! Você foi enviado(a) ao reformatório."); }
    for (const pa of parents()) pa.rel = clamp(pa.rel-15);
    log(`🚓 Fui pego(a) tentando ${c.name.toLowerCase()} e levei uma bronca dos meus pais.`, "bad"); return R(false, "Pego(a)! Seus pais ficaram furiosos.");
  }
  let yrs = rint(...c.years) + (S.record.length ? 1 : 0) + (S.parole>0 ? 2 : 0);
  if (yrs <= 0){ const fine = priceOf(rint(200,2000)); addMoney(-fine); S.record.push({ crime:c.name, age:P().age, years:0 }); log(`🚓 Pego(a) em flagrante (${c.name}). Multa de ${fmt(fine)} e ficha suja.`, "bad"); return R(false, `Pego(a)! Multa de ${fmt(fine)}.`); }
  sendToPrison(yrs, c.name.toLowerCase());
  return R(false, `Pego(a)! Condenado(a) a ${yrs} ano(s).`);
}

/* Reabilitação criminal: 5 anos sem crimes + advogado → chance de limpar o antecedente mais antigo. */
function expungeRecord(){
  if (!S.record.length) return R(false, "Sua ficha já está limpa.");
  if (inPrison()) return R(false, "Você está preso(a).");
  const last = Math.max(...S.record.map(r=>r.age));
  if (P().age - last < 5) return R(false, `Precisa de 5 anos sem condenações (faltam ${5 - (P().age - last)}).`);
  const cost = priceOf(3000); if (!canAfford(cost)) return R(false, `Advogado custa ${fmt(cost)}.`);
  addMoney(-cost);
  if (!chance(0.6)){ log("O juiz negou meu pedido de reabilitação criminal.", "bad"); return R(false, "Pedido negado. Tente de novo no próximo ano."); }
  const old = S.record.shift(); addNoto(-10); addRep(5);
  log(`⚖️ Reabilitação criminal concedida: "${old.crime}" saiu da minha ficha.`, "good");
  remember("Consegui limpar um antecedente criminal na Justiça.", "good");
  return R(true, "Ficha limpa (ao menos esse antecedente)!");
}

/* ---------- Cibercrime ----------
   Preparação paga antes (domínios, kits, laranjas). Sucesso → dinheiro
   SUJO; mesmo dando certo, o rastro digital pode levar a polícia até você
   1–3 anos depois (CONSEQ.cyberTrace). Falha → perde a preparação e, às
   vezes, é preso(a) em flagrante (rastreamento imediato). */
function commitCyber(c){
  if (cyberLevel() < num(c.skill)) return R(false, `Exige habilidade técnica ${c.skill} (você tem ${Math.round(cyberLevel())}). Curso de TI, faculdade de computação ou prática.`);
  const prep = priceOf(c.prep);
  if (!canAfford(prep)) return R(false, `A preparação custa ${fmt(prep)}.`);
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  addMoney(-prep); S.stats.crimes++; P().karma = clamp(P().karma - c.noto/4);
  if (hasTrait("honest")) addStat("happiness", -8);
  const trace = c.trace * (1 - cyberLevel()/160);
  if (chance(oddsCrime(c).p)){
    const g = priceOf(rint(...c.gain)); S.dirty += g; S.stats.dirtyEarned += g; S.stats.crimesOk++; S.stats.cyberOk = num(S.stats.cyberOk) + 1;
    S.cyberSkill = clamp(num(S.cyberSkill) + rint(3, 6)); addNoto(c.noto * 0.3);
    if (c.id === "celebhack") addFame(2);
    if (chance(trace)) schedule("cyberTrace", rint(1, 3), { crime:c.name, years:c.years, p: clamp(0.4 + trace) }, "Deixei rastros digitais. Pode voltar para me assombrar.");
    log(`💻 Golpe digital (${c.name}): ${fmt(g)} em dinheiro sujo (preparação: ${fmt(prep)}).`, "bad", ["crime"]); emit("crime");
    return R(true, `Deu certo! ${fmt(g)} em dinheiro SUJO — precisa lavar. Rastro estimado: ${Math.round(trace*100)}%.`);
  }
  S.cyberSkill = clamp(num(S.cyberSkill) + 1);
  if (P().age >= 18 && chance(trace * 1.3)){ addNoto(c.noto); emit("siren"); const y = rint(...c.years); sendToPrison(Math.max(1, y), c.name.toLowerCase()); return R(false, `O banco rastreou o IP na hora. Preso(a) por ${c.name.toLowerCase()}: ${y} ano(s).`); }
  log(`💻 Tentei ${c.name.toLowerCase()} e não rolou. Perdi ${fmt(prep)} de preparação.`, "bad");
  return R(false, `Não deu certo. Perdi os ${fmt(prep)} da preparação.`);
}
Object.assign(CONSEQ, {
  cyberTrace(ctx){
    if (!P().alive) return;
    if (inPrison()){ if (chance(ctx.p * 0.5)){ S.prison.years += rint(...ctx.years); return out(`A perícia digital ligou ${ctx.crime.toLowerCase()} a mim: pena aumentada.`, "bad"); } return; }
    if (!chance(ctx.p)) return out(`O rastro de "${ctx.crime}" esfriou.`, "good");
    enqueue("ev_cyber_probe", ctx); return out(`A polícia de crimes cibernéticos chegou até mim (${ctx.crime}).`, "bad");
  },
});
