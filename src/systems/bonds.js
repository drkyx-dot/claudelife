"use strict";
/* =====================================================================
   systems/bonds.js — RELAÇÕES COM UTILIDADE, CASAMENTO E GOLPES.

   Amigos (afeto alto) podem: emprestar dinheiro (vira dívida com prazo),
   indicar para vaga (+chance na próxima candidatura do ano), dar álibi
   (reduz a chance de investigações pendentes — e pode delatar) e dar
   apoio emocional.

   Casamento com REGIME DE BENS (S.flags.regime):
     total     → tudo é do casal: acesso a 100% do patrimônio do cônjuge;
                 no divórcio, tudo é dividido ao meio.
     parcial   → só o que foi ganho depois do casamento é comum.
     separacao → cada um com o seu (acesso ~5%: cartão adicional).
   Golpes contra o cônjuge (desviar, transferir bens, golpe do baú):
   quanto mais você tira e quanto mais esperto(a) é o cônjuge, maior a
   chance de descoberta — imediata ou anos depois (S.scheduled).
   ===================================================================== */
const REGIMES = {
  parcial:   { name:"Comunhão parcial de bens",  access:"o que o casal ganhou após o casamento" },
  total:     { name:"Comunhão universal (total)",access:"todo o patrimônio do cônjuge" },
  separacao: { name:"Separação total de bens",   access:"quase nada (cartão adicional)" },
};
const regime = () => S.flags.regime || (S.flags.prenup ? "separacao" : "parcial");
const spouse = () => S.rels.find(r => r.role === "spouse" && r.alive);

function ensureSpouseMoney(r){
  if (!r.money) r.money = wageOf([2000, 15000, 60000, 250000, 2e6][num(r.wealth, 2)] * rfloat(0.5, 1.5));
  if (!r.income) r.income = wageOf(rint(15000, 70000) * (num(r.wealth, 2) + 1) / 3);
  r.money = Math.round(r.money); r.income = Math.round(r.income);
}
/* Quanto do patrimônio do cônjuge o regime deixa você acessar. */
function spouseAccessible(r){
  const reg = regime();
  if (reg === "total") return Math.round(r.money);
  if (reg === "parcial") return Math.round(Math.max(0, r.money - num(r.moneyAtMarriage)) + r.money * 0.05);
  return Math.round(r.money * 0.05);
}

/* ---------- Casamento ---------- */
function marryWith(u, ceremony, reg){
  const r = relBy(u); if (!r || r.role !== "fiance") return R(false, "Vocês não estão noivos.");
  if (!REGIMES[reg]) return R(false, "Regime inválido.");
  const cost = priceOf(ceremony === "big" ? 25000 : 2500);
  ensureSpouseMoney(r);
  // separação total pedida por você: cônjuge rico desconfia; pobre pode se ofender
  if (reg === "separacao" && r.wealth <= 1 && chance(0.25)){ r.rel = clamp(r.rel - 12); remember_npc(r, "Ficou magoado(a) com o pedido de separação de bens"); }
  if (reg === "total" && r.wealth >= 3 && chance(0.5)) return R(false, `${r.first} não aceita comunhão total: o patrimônio da família dele(a) é grande demais. Escolha outro regime.`);
  marry(r, cost, reg === "separacao");
  S.flags.regime = reg; r.moneyAtMarriage = r.money; S.flags.myMoneyAtMarriage = Math.max(0, S.money);
  log(`📄 Regime de bens: ${REGIMES[reg].name}. ${r.first} tem ~${fmt(r.money)} de patrimônio.`, "");
  return R(true, `Casados! 💒 Regime: ${REGIMES[reg].name}.`);
}

/* Divórcio conforme o regime (substitui a regra antiga de 50% do caixa). */
function divorceSplit(sp){
  const reg = regime(), mine = Math.max(0, S.money), theirs = Math.max(0, num(sp.money));
  let myShare = 0, theirShare = 0;
  if (reg === "total"){ myShare = mine; theirShare = theirs; }
  else if (reg === "parcial"){ myShare = Math.max(0, mine - num(S.flags.myMoneyAtMarriage)); theirShare = Math.max(0, theirs - num(sp.moneyAtMarriage)); }
  const transfer = Math.round((myShare - theirShare) / 2); // > 0: eu pago; < 0: eu recebo
  addMoney(-transfer); sp.money = Math.max(0, theirs + transfer);
  return transfer;
}

/* ---------- Ações com o cônjuge ---------- */
function spouseAct(u, kind, flee){
  const r = relBy(u); if (!r || r.role !== "spouse" || !r.alive) return R(false, "Só com o cônjuge.");
  if (inPrison()) return R(false, "Você está preso(a).");
  ensureSpouseMoney(r);
  const acc = spouseAccessible(r), int = P().stats.intelligence, per = byId(DATA.personalities, r.personality) || {};
  const sharp = (per.id === "schemer" || per.id === "gossip" ? 0.12 : 0) + (per.id === "calm" ? -0.05 : 0);
  switch (kind){
    case "ask": {
      if (r.askedMoney === P().age) return R(false, "Você já pediu este ano.");
      r.askedMoney = P().age;
      if (regime() === "separacao" && !chance(0.3)) return R(false, `${r.first}: "Separação de bens, lembra? Cada um com o seu."`);
      if (!chance(r.rel/110 + (per.id === "generous" ? 0.2 : 0))){ r.rel = clamp(r.rel - 4); return R(false, `${r.first} achou que não era hora.`); }
      const v = Math.round(acc * rfloat(0.1, 0.3)); if (v <= 0) return R(false, "Não há patrimônio comum para usar.");
      r.money -= v; addMoney(v); r.rel = clamp(r.rel - 2);
      log(`💑 ${r.first} topou usar ${fmt(v)} do patrimônio do casal comigo.`, "");
      return R(true, `${r.first} liberou ${fmt(v)} da conta do casal.`);
    }
    case "skim": {
      const v = Math.round(acc * rfloat(0.15, 0.35)); if (v < priceOf(200)) return R(false, "Não tem quase nada acessível para desviar.");
      r.money -= v; addMoney(v); P().karma = clamp(P().karma - 8); S.stats.spouseScams++;
      const p = clamp((0.2 + v / Math.max(1, r.money + v) * 0.8 + sharp - (int - 50)/400) * 100, 5, 95) / 100;
      if (chance(p * 0.4)) return R(false, fraudCaught(r, v, "desvio"));
      schedule("spouseFraudFound", rint(1, 3), { uid:r.uid, amt:v, p, kind:"desvio" });
      return R(true, `Desviei ${fmt(v)} da conta conjunta para uma conta só minha. ${r.first} ainda não percebeu…`);
    }
    case "transfer": {
      if (regime() === "separacao") return R(false, "Na separação total não há bens comuns para transferir.");
      const v = Math.round(acc * rfloat(0.5, 0.8)); if (v < priceOf(1000)) return R(false, "Pouco patrimônio comum.");
      r.money -= v; addMoney(v); P().karma = clamp(P().karma - 15); S.stats.spouseScams++; addNoto(5);
      const p = clamp((0.45 + sharp - (int - 50)/300) * 100, 10, 95) / 100;
      if (chance(p * 0.5)) return R(false, fraudCaught(r, v, "transferência fraudulenta de bens"));
      schedule("spouseFraudFound", rint(1, 2), { uid:r.uid, amt:v, p, kind:"transferência fraudulenta de bens" });
      return R(true, `Com uma procuração "ajeitada", passei ${fmt(v)} em bens para o meu nome.`);
    }
    case "gold": {
      const v = Math.round(acc * 0.95); if (v < priceOf(1000)) return R(false, "Não há o que levar.");
      r.money -= v; addMoney(v); P().karma = clamp(P().karma - 30); S.stats.spouseScams++; addNoto(12);
      r.role = "ex"; r.rel = 0; r.respect = 0; remember_npc(r, "Foi vítima do meu golpe do baú");
      addStat("happiness", 4); addStress(15); achieve("goldigger", "Golpe do baú");
      log(`💼 GOLPE DO BAÚ: limpei ${fmt(v)} de ${r.first} e sumi${flee ? " do país" : ""}.`, "bad", ["crime","money"]);
      let dest = "";
      if (flee){ const from = P().country, d = pick(DATA.countries.filter(x => x.id !== from)); emigrate(d.id, true); dest = ` Agora vivo em ${d.name}.`; }
      schedule("loveScamCase", rint(1, 2), { uid:r.uid, name:`${r.first} ${r.last}`, amt:v, p: flee ? 0.25 : 0.6 }, `${r.first} foi à polícia por causa do golpe.`);
      if (chance(0.5)) schedule("scamRevenge", rint(2, 5), { uid:r.uid, name:r.first }, `${r.first} jurou vingança.`);
      return R(true, `Levei ${fmt(v)} e desapareci da vida de ${r.first}.${dest}`);
    }
  }
  return R(false, "?");
}
/* Golpe descoberto na hora: o cônjuge decide o que fazer. */
function fraudCaught(r, amt, kind){
  r.rel = clamp(r.rel - 60); r.respect = clamp(num(r.respect) - 40); addRep(-10);
  remember_npc(r, `Descobriu meu ${kind}`);
  log(`🚨 ${r.first} descobriu meu ${kind} de ${fmt(amt)}.`, "bad", ["love","crime"]);
  enqueue("ev_fraud_discovered", { uid:r.uid, amt, kind });
  return `${r.first} viu o extrato na hora. Ferrou.`;
}

/* ---------- Amigos com utilidade ---------- */
function friendAct(u, kind){
  const r = relBy(u); if (!r || !r.alive || r.role !== "friend") return R(false, "Só com amigos.");
  const per = byId(DATA.personalities, r.personality) || {};
  switch (kind){
    case "loan": {
      if (inPrison()) return R(false, "Você está preso(a).");
      if (r.rel < 60) return R(false, `Vocês não são próximos o bastante (afeto ${Math.round(r.rel)}/60).`);
      if (r.loanAge && P().age - r.loanAge < 3) return R(false, `Você já pediu a ${r.first} recentemente.`);
      r.loanAge = P().age;
      if (!chance(clamp((r.rel/110 + r.generous/400 + (per.id === "generous" ? 0.15 : 0) - 0.15) * 100, 5, 95) / 100)){ r.rel = clamp(r.rel - 5); return R(false, `${r.first}: "Tô apertado(a) também, desculpa."`); }
      const v = Math.round(priceOf([400, 1500, 5000, 15000, 60000][num(r.wealth, 2)] * rfloat(0.6, 1.2)));
      addMoney(v); remember_npc(r, `Me emprestou ${fmt(v)}`);
      schedule("friendLoanDue", 3, { uid:r.uid, amt:v, name:r.first }, `Devo ${fmt(v)} a ${r.first} (prazo: 3 anos).`);
      return R(true, `${r.first} te emprestou ${fmt(v)}. Prazo: 3 anos.`);
    }
    case "referral": {
      if (r.rel < 55) return R(false, `Afeto insuficiente (${Math.round(r.rel)}/55).`);
      if (!r.job) return R(false, `${r.first} não está empregado(a).`);
      if (S.flags.referral?.age === P().age) return R(false, "Você já tem uma indicação este ano.");
      const bonus = Math.round((0.1 + num(r.wealth, 2) * 0.03 + r.rel/1000) * 100) / 100;
      S.flags.referral = { name:r.first, bonus, age:P().age };
      return R(true, `${r.first} vai te indicar: +${Math.round(bonus*100)}% de chance nas candidaturas deste ano.`);
    }
    case "alibi": {
      const pending = S.scheduled.filter(x => ["homicideCase","hitAndRun","cyberTrace","loveScamCase","spouseFraudFound"].includes(x.kind));
      if (!pending.length && P().notoriety < 20) return R(false, "Você não está encrencado(a): não precisa de álibi.");
      if (r.rel < 65) return R(false, `${r.first} não arrisca tanto por você (afeto ${Math.round(r.rel)}/65).`);
      if (r.alibiAge === P().age) return R(false, "Já pedido este ano.");
      r.alibiAge = P().age;
      if (!chance(r.rel/120 + (per.id === "loyal" ? 0.2 : 0))){ r.rel = clamp(r.rel - 10); return R(false, `${r.first}: "Mentir pra polícia? Tá maluco(a)?"`); }
      if (per.snitch && chance(per.snitch * 1.5)){ addNoto(12); r.rel = clamp(r.rel - 20); log(`🐀 ${r.first} topou o álibi… e contou tudo para a polícia.`, "bad"); return R(false, `${r.first} concordou — e depois abriu o bico. A polícia ficou mais desconfiada.`); }
      for (const x of pending) if (x.ctx && typeof x.ctx.p === "number") x.ctx.p *= 0.55;
      addNoto(-10); r.rel = clamp(r.rel - 3); remember_npc(r, "Me deu um álibi");
      return R(true, `${r.first} vai jurar que estava com você. As investigações perderam força.`);
    }
    case "support": {
      if (r.supportAge === P().age) return R(false, `${r.first} já te ouviu este ano.`);
      if (r.rel < 45) return R(false, "Vocês não têm essa intimidade.");
      r.supportAge = P().age; r.rel = clamp(r.rel + 3); addStress(-rint(6, 12));
      return R(true, `Desabafei com ${r.first} a noite inteira.` + fx({ happiness: rint(5, 10) }));
    }
  }
  return R(false, "?");
}

/* ---------- Consequências agendadas ---------- */
Object.assign(CONSEQ, {
  friendLoanDue(ctx){
    const f = relBy(ctx.uid); if (!f || !f.alive) return out(`A dívida com ${ctx.name} morreu com ele(a).`, "info");
    if (S.money >= ctx.amt && !inPrison()){ addMoney(-ctx.amt); f.rel = clamp(f.rel + 6); f.respect = clamp(num(f.respect) + 10); return out(`Paguei os ${fmt(ctx.amt)} que devia a ${ctx.name}.`, "good"); }
    f.rel = clamp(f.rel - 35); f.respect = clamp(num(f.respect) - 30); remember_npc(f, "Levou calote meu");
    return out(`Dei calote em ${ctx.name} (${fmt(ctx.amt)}). A amizade azedou.`, "bad");
  },
  spouseFraudFound(ctx){
    const r = relBy(ctx.uid); if (!r || !r.alive) return;
    if (!chance(ctx.p)) return out(`Meu ${ctx.kind} nunca foi descoberto.`, "info");
    if (r.role !== "spouse"){ schedule("loveScamCase", 1, { uid:r.uid, name:`${r.first} ${r.last}`, amt:ctx.amt, p:0.4 }); return out(`${r.first} descobriu meu antigo ${ctx.kind} e procurou um advogado.`, "bad"); }
    return out(fraudCaught(r, ctx.amt, ctx.kind), "bad");
  },
  loveScamCase(ctx){
    if (inPrison() || !chance(ctx.p)) return out(`O processo de ${ctx.name} contra mim não foi adiante.`, "good");
    enqueue("ev_scam_lawsuit", ctx); return out(`${ctx.name} me processou por estelionato.`, "bad");
  },
  scamRevenge(ctx){ if (!inPrison()) enqueue("ev_scam_revenge", ctx); },
});
