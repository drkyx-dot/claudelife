"use strict";
/* =====================================================================
   systems/finance.js — fluxo de caixa anual, aluguéis, dívidas, crédito,
   penhora/leilão e investimentos. MODO BRUTO + MULTI-PAÍS.

   • Cada imóvel/veículo/negócio/dívida tem `country`; valores na moeda
     daquele país e convertidos (fxConv) ao entrar/sair do caixa.
   • Parcela que não cabe no caixa NÃO vira cheque especial: vira ATRASO
     (multa + juros de mora, crédito despenca). 2 anos de atraso numa
     dívida com garantia = leilão/apreensão do bem; 3 anos sem garantia
     = penhora judicial.
   • Cheque especial só cobre o rombo do custo de vida (38% a.a.).
   ===================================================================== */
const RATES = { personal:0.34, mortgage:0.115, vehicle:0.22, overdraft:0.38, student:0.06 };
const isAbroad = a => !!a.country && a.country !== P().country;

/* ---------- Ativos: valorização, desgaste, roubo e retorno ---------- */
function assetsYear(){
  const ph = phase();
  for (const p of S.properties){
    const d = byId(DATA.properties, p.id);
    p.value = Math.max(1000, Math.round(p.value * (1 + d.appr + ph.prop + gauss()*0.06)));
    p.condition = clamp(num(p.condition, 100) - rint(2, 5) - (p.rented ? rint(1, 4) : 0));
    if (p.condition < 40) p.value = Math.round(p.value * 0.985); // imóvel malcuidado desvaloriza
  }
  for (const v of S.vehicles.slice()){
    const d = byId(DATA.vehicles, v.id); v.age++;
    v.value = Math.max(Math.round(priceIn(d.price, v.country)*0.04), Math.round(v.value * (1 - d.dep + rfloat(-0.02,0.02))));
    if (!isAbroad(v) && chance(0.012 * d.theft * country(v.country).crime)){
      const paid = Math.round(v.value * 0.7); addMoney(fxConv(paid, v.country));
      S.vehicles = S.vehicles.filter(x=>x!==v); S.loans = S.loans.filter(l=>l.vehicleUid!==v.uid);
      log(`🚨 Roubaram meu ${d.name}! O seguro pagou só ${fmt(fxConv(paid, v.country))}.`, "bad"); addStress(10); addStat("happiness",-8);
    }
  }
  const ret = {};
  for (const [id, amt] of Object.entries(S.investments)){
    const d = byId(DATA.investments, id); if (!d || amt <= 0) { delete S.investments[id]; continue; }
    const r = Math.max(-0.9, d.mu + d.cycle * ph.invest + gauss()*d.sigma);
    S.investments[id] = Math.round(amt * (1+r)); ret[id] = r;
  }
  S.lastReturns = ret;
  if (S.trustFund && P().age >= 18){ addMoney(S.trustFund); log(`Recebi o fundo fiduciário da família: ${fmt(S.trustFund)}.`, "good"); S.trustFund = 0; }
}

/* ---------- Inquilinos: vacância, calote, danos, taxa remota ---------- */
function tenantsYear(add){
  let total = 0;
  const rec = phaseName() === "recessão" || phaseName() === "crise";
  for (const p of S.properties.filter(x=>x.rented)){
    const d = byId(DATA.properties, p.id), where = isAbroad(p) ? ` (${country(p.country).name})` : "";
    if (!p.tenant){
      if (chance(rec ? 0.45 : 0.7)){
        const n = genName(country(p.country), chance(0.5)?"M":"F");
        p.tenant = { name:`${n.first} ${n.last}`, reliability: rint(25, 95), since: P().age, late:0 };
        log(`🔑 Aluguei ${d.name}${where} para ${p.tenant.name}.`, "good");
      } else { add(`Vacância (sem inquilino): ${d.name}${where}`, 0); continue; }
    }
    const t = p.tenant;
    const gross = Math.round(p.value * d.rentYield * (0.55 + 0.45 * num(p.condition,100)/100) * (d.seasonal ? rfloat(0.6, 1.3) : 1));
    if (chance((1 - t.reliability/100) * 0.45 * (rec ? 1.6 : 1))){
      t.late++; log(`😤 ${t.name} deu calote no aluguel de ${d.name}${where}.`, "bad"); addStress(4);
      if (t.late >= 2 || chance(0.35)){
        const cost = fxConv(gross*0.25, p.country); total -= cost; add(`Despejo/advogado: ${d.name}`, -cost);
        log(`Despejei ${t.name}. O imóvel ficou vago.`, "bad"); p.tenant = null;
      }
      continue;
    }
    if (chance(0.08)){ p.condition = clamp(num(p.condition,100) - 15); log(`🔧 ${t.name} danificou ${d.name}${where}. Precisa de reforma.`, "bad"); }
    let net = gross * 0.85;                 // IR sobre aluguel (15%)
    if (isAbroad(p)) net *= 0.9;            // administradora remota (10%)
    const local = fxConv(net, p.country);
    total += local; add(`Aluguel recebido: ${d.name}${where}`, local);
    if (chance(0.12)){ log(`${t.name} desocupou ${d.name}${where}.`, ""); p.tenant = null; }
  }
  return total;
}

/* ---------- Fluxo de caixa anual ---------- */
function financeYear(Y){
  const a = P().age, add = (label, v) => { Y.lines.push([label, Math.round(v)]); };
  let income = 0, expenses = 0;
  const L = S.stats;
  // receitas
  let wage = jobIncome();
  if (S.job && career().volatile && wage) wage = Math.round(wage * rfloat(0.7, 1.3)); // autônomo/comissão
  if (wage){ income += wage; add(S.retired ? "Aposentadoria/salário" : "Salário bruto", wage); }
  const tax = incomeTax(wage); if (tax){ expenses += tax; Y.taxes = tax; add("Imposto de renda", -tax); }
  for (const b of S.businesses){ const v = fxConv(b.lastProfit, b.country); income += v; add(`Lucro: ${b.name}${isAbroad(b)?" (exterior)":""}`, v); }
  for (const p of S.properties){
    const d = byId(DATA.properties, p.id);
    if (d.income){ const r = fxConv(p.value*d.income*(isAbroad(p)?0.85:1), p.country); income += r; add(`Produção: ${d.name}`, r); }
  }
  income += tenantsYear(add);
  if (a >= 8 && a < 18 && parents().length){
    const al = Math.round(priceOf(DATA.classes[P().cls].allowance) * parents()[0].rel/100);
    if (al){ income += al; add("Mesada", al); }
  }
  if (a >= 65) for (const k of children().filter(k=>k.supportsParent && k.rel > 40)){ const h = priceOf(1500); income += h; add(`Ajuda de ${k.first}`, h); }
  // despesas
  if (!inPrison()){
    const home = homeInfo(), kids = children().filter(c=>c.age<18).length;
    if (a >= 18){
      const lm = LIFESTYLES[P().lifestyle].mult * (hasTrait("frugal")?0.85:1) * (hasTrait("spendthrift")?1.25:1);
      const base = home.type === "family" ? 3000 : 10000;   // alimentação, transporte, contas
      const famHelp = S.edu.school && parents().length && a < 26 ? classOf().eduShare : 0;
      const living = Math.round(priceOf(base * lm) * (1 - famHelp));
      expenses += living; add(`Custo de vida (${LIFESTYLES[P().lifestyle].name})`, -living);
      if (kids){ const k = priceOf(5500*kids*Math.max(0.8,lm*0.8)); expenses += k; add(`Despesas com ${kids} filho(s)`, -k); }
    }
    if (home.type === "rent"){ expenses += home.rent; add("Aluguel da moradia", -home.rent); }
  }
  for (const p of S.properties){ const u = fxConv(p.value * byId(DATA.properties,p.id).upkeep, p.country); expenses += u; add(`IPTU/condomínio: ${byId(DATA.properties,p.id).name}${isAbroad(p)?" (exterior)":""}`, -u); }
  for (const v of S.vehicles){
    const d = byId(DATA.vehicles,v.id), base = Math.max(v.value, priceIn(d.price, v.country)*0.25);
    const u = fxConv(base * (d.ins + d.tax) + (isAbroad(v) ? 0 : priceIn(d.fuel, v.country)), v.country);
    expenses += u; add(`Seguro/IPVA/combustível: ${d.name}`, -u);
  }
  const prem = a >= 18 ? planPremium() : 0;
  if (prem){ expenses += prem; add(`Plano de saúde (${effectivePlan().name})`, -prem); }
  const wt = a >= 18 ? wealthTax(netWorth()) : 0;
  if (wt){ expenses += wt; add("Imposto sobre grandes fortunas", -wt); }
  if (S.edu.debt > 0 && !S.edu.school && a >= 18){
    const pay = Math.min(S.edu.debt, Math.round(Math.max(S.edu.debt*0.12, priceOf(800))));
    S.edu.debt = Math.round(S.edu.debt*(1+RATES.student)) - pay; if (S.edu.debt < 1) S.edu.debt = 0;
    expenses += pay; add("Financiamento estudantil", -pay);
  }
  addMoney(income - expenses);
  L.earned += Math.max(0, income); L.spent += Math.max(0, expenses);

  // parcelas: o que não cabe no caixa vira ATRASO (não vai para o cheque especial)
  for (const ln of S.loans){
    const interest = Math.round(ln.principal * ln.rate);
    const due = Math.min(ln.principal + interest, ln.payment), dueLocal = fxConv(due, ln.country);
    if (S.money >= dueLocal){
      addMoney(-dueLocal); ln.principal = Math.max(0, ln.principal + interest - due); ln.missed = 0;
      expenses += dueLocal; add(`Parcela: ${ln.name}`, -dueLocal);
    } else if (ln.name === "Cheque especial"){
      // rotativo: o que não foi pago capitaliza (juros sobre juros), sem execução judicial
      const paidLocal = Math.max(0, S.money); addMoney(-paidLocal);
      ln.principal = Math.round(ln.principal + interest - fxConv(paidLocal, null, ln.country)); addCredit(-15); addStress(5);
      add("Cheque especial (rolando a dívida)", -paidLocal);
    } else {
      const paidLocal = Math.max(0, S.money), paid = fxConv(paidLocal, null, ln.country);
      addMoney(-paidLocal);
      ln.principal = Math.round((ln.principal + interest - paid) * 1.02); // multa de 2%
      ln.missed = num(ln.missed) + 1; addCredit(-45); addStress(8);
      add(`Parcela ATRASADA: ${ln.name}`, -paidLocal);
      log(`⚠️ Não consegui pagar a parcela de "${ln.name}" (${ln.missed}º ano de atraso).`, "bad");
    }
    ln.yearsLeft--;
  }
  S.loans = S.loans.filter(ln => { if (ln.principal <= 0){ log(`Quitei: ${ln.name}. ✅`, "good"); return false; } return true; });
  Y.income = income; Y.expenses = expenses;
  if (S.money < 0 && S.edu.school && parents().length && a < 25 && clsBand() >= 1){
    // estudante morando com a família: os pais cobrem o rombo (sem histórico de crédito ainda)
    const deficit = -S.money; addMoney(deficit); for (const pa of parents()) pa.rel = clamp(pa.rel - 2);
    add("Pais cobriram o rombo do mês", deficit);
  } else if (S.money < 0){
    const deficit = -S.money; addMoney(deficit);
    takeLoan("Cheque especial", deficit, RATES.overdraft, 3, true);
    log(`Fiquei no vermelho e entrei no cheque especial (${fmt(deficit)}). 😬`, "bad");
    addStat("happiness",-5); S.flags.overdraftYear = a;
  }
  foreclosureYear();
  checkBankruptcy();
  creditYear();
  L.maxNetWorth = Math.max(num(L.maxNetWorth), netWorth());
}

/* ---------- Leilão, apreensão e penhora por calote prolongado ---------- */
function foreclosureYear(){
  for (const ln of S.loans.slice()){
    if (ln.propertyUid && ln.missed >= 2){
      const p = S.properties.find(x=>x.uid===ln.propertyUid); if (!p){ ln.propertyUid = null; continue; }
      const d = byId(DATA.properties, p.id), auction = Math.round(p.value * 0.65);
      const rest = auction - ln.principal; // mesma moeda (a do imóvel)
      S.properties = S.properties.filter(x=>x!==p); S.loans = S.loans.filter(x=>x!==ln);
      if (rest >= 0) addMoney(fxConv(rest, p.country));
      else takeLoan("Saldo devedor pós-leilão", -rest, ln.rate, 6, false, p.country);
      log(`🔨 LEILÃO: o banco tomou ${d.name} e leiloou por ${fmtIn(auction, p.country)} (65% do valor).`, "bad");
      remember(`Perdi ${d.name} em leilão por atrasar o financiamento.`, "bad");
      addCredit(-90); addStress(20); addStat("happiness", -15); emit("loss");
    } else if (ln.vehicleUid && ln.missed >= 2){
      const v = S.vehicles.find(x=>x.uid===ln.vehicleUid); if (!v) { ln.vehicleUid = null; continue; }
      S.vehicles = S.vehicles.filter(x=>x!==v);
      ln.principal = Math.max(0, ln.principal - Math.round(v.value*0.6)); ln.missed = 0; ln.vehicleUid = null;
      log(`🚚 Busca e apreensão: o banco levou meu ${byId(DATA.vehicles,v.id).name}.`, "bad");
      remember("Tive o carro apreendido por falta de pagamento.", "bad"); addCredit(-60); addStress(12);
    } else if (!ln.propertyUid && !ln.vehicleUid && ln.missed >= 3){
      let seized = 0;
      for (const k of Object.keys(S.investments)){ seized += S.investments[k]; delete S.investments[k]; }
      for (const v of S.vehicles.filter(v=>!S.loans.some(l=>l.vehicleUid===v.uid)).slice(0,2)){ seized += fxConv(v.value*0.6, v.country); S.vehicles = S.vehicles.filter(x=>x!==v); }
      const applied = Math.min(fxConv(ln.principal, ln.country), seized);
      ln.principal -= fxConv(applied, null, ln.country); ln.missed = 0; addMoney(seized - applied);
      if (seized){ log(`⚖️ PENHORA judicial: bloquearam ${fmt(seized)} em bens para cobrir "${ln.name}".`, "bad"); remember("Sofri penhora judicial por dívidas não pagas.", "bad"); addCredit(-60); addStress(15); }
    }
  }
  S.loans = S.loans.filter(l => l.principal > 0);
}
/* Score de crédito (300–850): histórico de pagamento → juros e aprovação. */
function creditYear(){
  if (P().age < 18) return;
  const inc = Math.max(jobIncome(), priceOf(3000));
  const unsecured = S.loans.filter(l=>!l.propertyUid).reduce((x,l)=>x+fxConv(l.principal,l.country),0);
  if (S.loans.some(l=>l.missed)) return; // atraso já penalizou
  if (S.flags.overdraftYear === P().age) addCredit(-35);
  else if (unsecured / inc > 2) addCredit(-15);
  else addCredit(S.loans.length ? 12 : 5);
  if (S.edu.debt > inc * 2) addCredit(-8);
}
function takeLoan(name, amount, rate, years, silent, cid){
  amount = Math.round(amount); if (amount <= 0) return null;
  cid = cid || P().country;
  const pmt = Math.round(amount * rate / (1 - Math.pow(1+rate, -years)));
  const ex = silent && S.loans.find(l=>l.name===name && (l.country||P().country)===cid);
  if (ex){ ex.principal += amount; ex.payment = Math.round(ex.principal * rate / (1 - Math.pow(1+rate,-years))); return ex; }
  const L = { uid:uid(), name, principal:amount, rate, years, yearsLeft:years, payment:pmt, country:cid, missed:0 };
  S.loans.push(L); return L;
}
function checkBankruptcy(){
  const income = Math.max(jobIncome(), priceOf(5000));
  const unsecured = S.loans.filter(l=>!l.propertyUid).reduce((a,l)=>a+fxConv(l.principal,l.country),0);
  if (unsecured < income * 3) return;
  log("💥 Dívidas impagáveis: credores executaram meus bens.", "bad");
  let raised = investTotal(); S.investments = {};
  raised += S.vehicles.reduce((a,v)=>a+fxConv(v.value*0.7, v.country),0); S.vehicles = [];
  for (const p of S.properties){ const mort = S.loans.find(l=>l.propertyUid===p.uid); raised += fxConv(p.value*0.75 - (mort?mort.principal:0), p.country); }
  S.loans = S.loans.filter(l=>!l.propertyUid && !l.vehicleUid); S.properties = []; S.rental = S.rental || null;
  addMoney(raised);
  for (const L of S.loans){ const payLocal = Math.min(fxConv(L.principal, L.country), Math.max(0,S.money)); L.principal -= fxConv(payLocal, null, L.country); addMoney(-payLocal); }
  S.loans = S.loans.filter(l=>l.principal>0);
  if (S.loans.length){ log("Declarei falência pessoal. As dívidas restantes foram renegociadas com desconto.", "bad"); for (const L of S.loans){ L.principal = Math.round(L.principal*0.3); L.rate = 0.1; L.years = 8; L.missed = 0; L.payment = Math.round(L.principal*0.1/(1-Math.pow(1.1,-8))); } }
  addStat("happiness",-20); addStress(20); addCredit(-220); S.flags.bankrupt = (S.flags.bankrupt||0)+1; emit("loss");
  remember("A falência destruiu meu crédito: juros altos e financiamentos negados por anos.", "bad");
}

/* ---------- Ações financeiras ---------- */
function invest(id, amount){ amount = Math.round(amount); if (amount <= 0 || !canAfford(amount)) return R(false,"Valor inválido."); if (!adult()) return R(false,"Precisa ser maior de idade."); addMoney(-amount); S.investments[id] = num(S.investments[id]) + amount; log(`Investi ${fmt(amount)} em ${byId(DATA.investments,id).name}.`, ""); return R(true,"Aplicação realizada."); }
function withdraw(id, amount){ const cur = num(S.investments[id]); amount = Math.min(cur, Math.round(amount)); if (amount<=0) return R(false,"Nada a resgatar."); S.investments[id] = cur - amount; addMoney(amount); if (!S.investments[id]) delete S.investments[id]; return R(true, `Resgatado ${fmt(amount)}.`); }
function personalLoan(amount){
  if (!adult()) return R(false,"Precisa ser maior de idade.");
  if (S.loans.some(l=>l.missed)) return R(false, "Crédito negado: você tem parcelas em atraso.");
  const cap = Math.max(priceOf(800), jobIncome()*1.2) - S.loans.filter(l=>!l.propertyUid).reduce((a,l)=>a+fxConv(l.principal,l.country),0);
  if (amount > cap) return R(false, `Limite disponível: ${fmt(Math.max(0,cap))}.`);
  if (S.credit < 480) return R(false, `Crédito negado: score ${S.credit} (${creditLabel()}).`);
  takeLoan("Empréstimo pessoal", amount, oddsLoanRate(RATES.personal), 5); addMoney(amount);
  log(`Peguei um empréstimo de ${fmt(amount)}.`, ""); return R(true, "Empréstimo liberado.");
}
function payOffLoan(u){ const L = S.loans.find(l=>l.uid===u); if (!L) return R(false,"?"); const local = fxConv(L.principal, L.country); if (!canAfford(local)) return R(false, `Precisa de ${fmt(local)}.`); addMoney(-local); S.loans = S.loans.filter(x=>x!==L); addCredit(10); log(`Quitei antecipadamente: ${L.name}.`, "good"); return R(true,"Dívida quitada!"); }
function payStudentDebt(){ const d = S.edu.debt; if (!d) return R(false,"Sem dívida."); const pay = Math.min(d, Math.max(0,S.money)); if (!pay) return R(false,"Sem dinheiro."); addMoney(-pay); S.edu.debt -= pay; return R(true, `Pago ${fmt(pay)} do financiamento estudantil.`); }
function setLifestyle(i){ if (!adult()) return R(false,"Seus pais decidem isso."); P().lifestyle = i; return R(true, `Estilo de vida: ${LIFESTYLES[i].name}.`); }
