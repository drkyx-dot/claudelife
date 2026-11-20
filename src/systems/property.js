"use strict";
/* =====================================================================
   systems/property.js — moradia, imóveis multi-país, reformas e veículos.
   Todo imóvel/veículo guarda `country` e valor na moeda daquele país.
   Você pode comprar imóveis em qualquer país (investimento remoto),
   morar apenas nos do país atual, alugar os demais e vender de longe.
   ===================================================================== */
function rentHome(id){
  if (!adult()) return R(false,"Precisa ser maior de idade.");
  if (inPrison()) return R(false,"Você está preso(a).");
  const d = byId(DATA.rentals,id), first = Math.round(priceOf(d.rent)/12*3); // caução de 3 meses
  if (!canAfford(first)) return R(false, `Precisa de ${fmt(first)} para caução (3 meses).`);
  if (S.credit < 450 && !chance(0.4)) return R(false, "A imobiliária recusou: análise de crédito negativa.");
  addMoney(-first); S.rental = id; for (const p of S.properties) p.residence = false;
  log(`Me mudei para: ${d.name}.`, "milestone"); emit("buy"); return R(true, `Bem-vindo(a) ao novo lar!`);
}
function leaveRental(){ if (!S.rental) return R(false,"Sem aluguel."); S.rental = null; log("Devolvi o imóvel alugado.", ""); return R(true, "Contrato encerrado."); }

function buyProperty(id, financed, cid){
  if (!adult()) return R(false,"Precisa ser maior de idade.");
  cid = cid || P().country;
  const d = byId(DATA.properties,id), price = priceIn(d.price, cid), priceLocal = fxConv(price, cid);
  const abroad = cid !== P().country, fees = Math.round(priceLocal * (abroad ? 0.08 : 0.05)); // ITBI/cartório (+câmbio)
  const p = { uid:uid(), id, country:cid, value:price, bought:price, age:P().age, residence:false, rented:false, condition:100, tenant:null };
  if (financed){
    if (abroad) return R(false, "Bancos não financiam imóveis para não residentes.");
    if (S.loans.some(l=>l.missed)) return R(false, "Financiamento negado: há parcelas em atraso.");
    if (S.credit < 580) return R(false, `Financiamento negado: score ${S.credit} (${creditLabel()}). Mínimo 580.`);
    const down = Math.round(price*0.3), rate = oddsLoanRate(RATES.mortgage), years = 30;
    const pmt = Math.round((price-down)*rate/(1-Math.pow(1+rate,-years)));
    if (!canAfford(down + fees)) return R(false, `Entrada (30%) + taxas: ${fmt(down + fees)}.`);
    const renda = Math.max(jobIncome(), S.businesses.reduce((a,b)=>a+Math.max(0,fxConv(b.lastProfit,b.country)),0));
    if (pmt > renda * 0.35) return R(false, `Banco negou: parcela de ${fmt(pmt)}/ano excede 35% da renda.`);
    addMoney(-(down + fees)); S.properties.push(p);
    const loan = takeLoan(`Financiamento: ${d.name}`, price-down, rate, years); loan.propertyUid = p.uid;
    log(`Comprei ${d.name} financiado (${fmt(price)}, juros ${(rate*100).toFixed(1)}% a.a.). 🏠`, "milestone");
  } else {
    if (!canAfford(priceLocal + fees)) return R(false, `Precisa de ${fmt(priceLocal + fees)} (com taxas).`);
    addMoney(-(priceLocal + fees)); S.properties.push(p);
    log(`Comprei ${d.name}${abroad?` em ${country(cid).name}`:""} à vista por ${fmtIn(price, cid)}. 🏠`, "milestone");
  }
  S.stats.propsBought++; achieve("owner","Casa própria"); if (abroad) achieve("intl_owner","Imóvel no exterior");
  emit("buy"); return R(true, "Imóvel comprado!");
}
function moveInto(u){
  const p = S.properties.find(x=>x.uid===u); if (!p) return R(false,"?");
  if (isAbroad(p)) return R(false, `Esse imóvel fica em ${country(p.country).name}. Emigre para morar nele.`);
  if (byId(DATA.properties,p.id).commercial) return R(false, "Imóvel comercial não serve de moradia.");
  for (const q of S.properties) q.residence = false;
  p.residence = true; p.rented = false; p.tenant = null; S.rental = null;
  log(`Me mudei para minha propriedade: ${byId(DATA.properties,p.id).name}.`, ""); return R(true,"Mudança feita!");
}
function toggleRentOut(u){
  const p = S.properties.find(x=>x.uid===u);
  if (!p || p.residence) return R(false,"Não é possível alugar onde você mora.");
  p.rented = !p.rented; if (!p.rented) p.tenant = null;
  return R(true, p.rented ? "Anunciado para aluguel. Um inquilino deve aparecer no próximo ano." : "Imóvel retirado do aluguel.");
}
function renovateCost(p){ return Math.round(p.value * (100 - num(p.condition,100))/100 * 0.18); }
function renovate(u){
  const p = S.properties.find(x=>x.uid===u); if (!p) return R(false,"?");
  if (num(p.condition,100) >= 95) return R(false, "O imóvel já está em ótimo estado.");
  const c = renovateCost(p), local = fxConv(c, p.country) * (isAbroad(p) ? 1.15 : 1);
  if (!canAfford(local)) return R(false, `Reforma custa ${fmt(local)}.`);
  addMoney(-Math.round(local)); p.value = Math.round(p.value * (1 + (100 - p.condition)/100 * 0.12)); p.condition = 100;
  log(`🛠️ Reformei ${byId(DATA.properties,p.id).name}.`, "good"); return R(true, "Reforma concluída: imóvel valorizou.");
}
function sellProperty(u){
  const p = S.properties.find(x=>x.uid===u); if (!p) return R(false,"?");
  const d = byId(DATA.properties,p.id), mort = S.loans.find(l=>l.propertyUid===u);
  const hot = phaseName() === "crise" ? 0.85 : phaseName() === "recessão" ? 0.92 : 1;
  const gross = Math.round(p.value * 0.94 * hot);              // corretagem 6% + liquidez do ciclo
  const gain = Math.max(0, gross - p.bought), cgt = Math.round(gain * 0.15); // imposto sobre ganho de capital
  const net = gross - cgt - (mort ? mort.principal : 0);
  addMoney(fxConv(net, p.country)); S.loans = S.loans.filter(l=>l!==mort); S.properties = S.properties.filter(x=>x!==p);
  log(`Vendi ${d.name}${isAbroad(p)?` (${country(p.country).name})`:""} por ${fmtIn(gross, p.country)}${cgt?`, ganho de capital tributado em ${fmtIn(cgt,p.country)}`:""}.`, net>0?"good":"bad");
  emit("money"); return R(true, `Venda concluída: ${fmt(fxConv(net, p.country))} líquidos.`);
}

/* ---------- Veículos ---------- */
function buyVehicle(id, financed){
  if (!adult()) return R(false,"Precisa ser maior de idade.");
  const d = byId(DATA.vehicles,id), price = priceOf(d.price);
  if (!d.noLicense && !S.flags.license) return R(false,"Você precisa de carteira de motorista (Ações → Autoescola).");
  const v = { uid:uid(), id, country:P().country, value:price, age:0 };
  if (financed){
    if (S.loans.some(l=>l.missed)) return R(false, "Financiamento negado: há parcelas em atraso.");
    if (S.credit < 540) return R(false, `Financiamento negado: score ${S.credit}.`);
    const down = Math.round(price*0.25); if (!canAfford(down)) return R(false, `Entrada de ${fmt(down)}.`);
    addMoney(-down); const L = takeLoan(`Financiamento: ${d.name}`, price-down, oddsLoanRate(RATES.vehicle), 5); L.vehicleUid = v.uid;
  } else { if (!canAfford(price)) return R(false, `Precisa de ${fmt(price)}.`); addMoney(-price); }
  S.vehicles.push(v); addStat("happiness", 3 + d.style); S.stats.carsBought++;
  if (d.style >= 8) addFame(1);
  log(`Comprei ${d.name}${financed?" financiado":""}. 🚗`, "milestone"); emit("buy");
  return R(true, `${d.name} na garagem!`);
}
function sellVehicle(u){
  const v = S.vehicles.find(x=>x.uid===u); if (!v) return R(false,"?");
  const L = S.loans.find(l=>l.vehicleUid===u), val = Math.round(v.value*0.88) - (L ? L.principal : 0);
  addMoney(fxConv(val, v.country)); S.vehicles = S.vehicles.filter(x=>x!==v); if (L) S.loans = S.loans.filter(x=>x!==L);
  log(`Vendi ${byId(DATA.vehicles,v.id).name} por ${fmtIn(Math.round(v.value*0.88), v.country)}.`, ""); emit("money");
  return R(true, `Vendido: ${fmt(fxConv(val, v.country))} líquidos.`);
}
/* Traz um veículo que ficou no país antigo (frete internacional + impostos de importação). */
function shipVehicle(u){
  const v = S.vehicles.find(x=>x.uid===u); if (!v || !isAbroad(v)) return R(false, "Veículo já está aqui.");
  const cost = Math.round(fxConv(v.value, v.country) * 0.35);
  if (!canAfford(cost)) return R(false, `Frete + importação custam ${fmt(cost)}.`);
  addMoney(-cost); v.value = fxConv(v.value, v.country); v.country = P().country;
  log(`🚢 Importei meu ${byId(DATA.vehicles,v.id).name} para ${country().name}.`, ""); return R(true, "Veículo chegou!");
}
