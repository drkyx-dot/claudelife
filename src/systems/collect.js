"use strict";
/* =====================================================================
   systems/collect.js — COLEÇÃO (museu/antiguidades) e ARSENAL.
   Coleção: entra no patrimônio, valoriza/oscila por ano (e com o ciclo
   econômico), seguro anual de 1,5% protege contra roubo; peças do
   mercado negro podem ser falsas ou apreendidas. Empréstimo a museu dá
   reputação, fama e uma taxa.
   Arsenal: armas viram golpes no combate (fora de torneios). Armas de
   fogo registradas exigem PORTE; armas ilegais pesam muito se você for
   preso(a) e armas registradas em seu nome facilitam a perícia.
   ===================================================================== */
const collection = () => (S.collection ||= []);
const arsenal = () => (S.arsenal ||= []);
function collectionTotal(){ return collection().reduce((a, c) => a + fxConv(c.value, c.country), 0); }

function buyCollectible(id){
  const d = byId(DATA.collectibles, id); if (!d) return R(false, "?");
  if (!adult()) return R(false, "Só maiores de idade.");
  if (inPrison()) return R(false, "Você está preso(a).");
  const fee = d.src === "auction" ? 0.12 : d.src === "dealer" ? 0.05 : 0;
  const price = Math.round(priceOf(d.price) * (d.src === "black" ? rfloat(0.45, 0.7) : rfloat(0.92, 1.12)));
  const total = Math.round(price * (1 + fee));
  if (!canAfford(total)) return R(false, `Precisa de ${fmt(total)}${fee ? ` (inclui ${Math.round(fee*100)}% de comissão)` : ""}.`);
  addMoney(-total); S.stats.spent += total;
  const fake = d.src === "black" && chance(0.25);
  collection().push({ uid:uid(), id, value: Math.round(priceOf(d.price) * rfloat(0.9, 1.05)), paid: total, age:P().age, insured:false, country:P().country, fake, hot: d.src === "black" });
  if (d.src === "black"){ addNoto(3); S.crimeSkill = clamp(S.crimeSkill + 1); }
  log(`${d.emoji} Comprei: ${d.name} por ${fmt(total)}.`, "", ["money"]);
  emit("buy");
  if (S.collection.length >= 5) achieve("collector", "Colecionador(a) com 5 peças");
  return R(true, `${d.name} agora é sua! ${d.src === "black" ? "⚠️ Procedência duvidosa." : ""}`);
}
function sellCollectible(u){
  const c = collection().find(x => x.uid === u); if (!c) return R(false, "?");
  const d = byId(DATA.collectibles, c.id);
  if (c.fake){ S.collection = S.collection.filter(x => x !== c); log(`🧐 A avaliação revelou que ${d.name} era FALSIFICAÇÃO. Perdi tudo o que paguei.`, "bad"); return R(false, "Era falso! O avaliador recusou a peça."); }
  const v = Math.round(c.value * (c.hot ? 0.5 : 0.9));                   // leiloeiro leva 10%; peça "quente" vende pela metade
  S.collection = S.collection.filter(x => x !== c); addMoney(fxConv(v, c.country)); S.stats.earned += v;
  log(`${d.emoji} Vendi ${d.name} por ${fmt(fxConv(v, c.country))}.`, "good", ["money"]);
  return R(true, `Vendido por ${fmt(fxConv(v, c.country))}.`);
}
function insureCollectible(u){
  const c = collection().find(x => x.uid === u); if (!c) return R(false, "?");
  if (c.hot) return R(false, "Nenhuma seguradora aceita peça sem procedência.");
  c.insured = !c.insured; return R(true, c.insured ? `Segurado: ${fmt(Math.round(c.value*0.015))}/ano.` : "Seguro cancelado.");
}
function lendToMuseum(u){
  const c = collection().find(x => x.uid === u); if (!c) return R(false, "?");
  if (c.hot) return R(false, "Um museu sério vai checar a procedência… melhor não.");
  if (c.lentAge === P().age) return R(false, "Já emprestada este ano.");
  c.lentAge = P().age; const fee = Math.round(c.value * 0.02);
  addMoney(fxConv(fee, c.country)); addRep(3); addFame(c.value > priceOf(300000) ? 3 : 1);
  return R(true, `Emprestei ao museu: +${fmt(fxConv(fee, c.country))}, reputação e prestígio.`);
}
function collectYear(){
  const Y = S.yearSummary;
  for (const c of [...collection()]){
    const d = byId(DATA.collectibles, c.id);
    c.value = Math.max(1, Math.round(c.value * (1 + d.appr + phase().invest*0.4 + rfloat(-d.vol, d.vol))));
    if (c.insured){ const prem = Math.round(fxConv(c.value * 0.015, c.country)); if (S.money >= prem){ addMoney(-prem); Y.expenses += prem; Y.lines.push([`Seguro: ${d.name}`, -prem]); } else c.insured = false; }
    if (chance(0.025 * country().crime * (c.value > priceOf(100000) ? 1.5 : 1))){
      S.collection = S.collection.filter(x => x !== c);
      if (c.insured){ const pay = fxConv(Math.round(c.value*0.9), c.country); addMoney(pay); log(`🚨 Roubaram ${d.name}. O seguro pagou ${fmt(pay)}.`, "bad"); }
      else log(`🚨 Roubaram ${d.name} (sem seguro). Prejuízo de ${fmt(fxConv(c.value, c.country))}.`, "bad");
      continue;
    }
    if (c.hot && chance(0.06)){ S.collection = S.collection.filter(x => x !== c); addNoto(8); S.record.push({ crime:"receptação de bem cultural", age:P().age, years:0 }); log(`🚔 A Interpol rastreou ${d.name}: peça apreendida e ficha suja por receptação.`, "bad", ["crime"]); }
  }
  if (collection().length && chance(0.12)) enqueue("ev_collector_offer");
}

/* ---------- Arsenal ---------- */
const hasWeapon = id => arsenal().some(w => w.id === id);
function weaponBlock(d){
  if (P().age < 18) return "Só maiores de idade";
  if (inPrison()) return "Você está preso(a)";
  if (d.legal === "license" && !S.flags.gunLicense) return "Exige porte de arma";
  if (hasWeapon(d.id)) return "Você já tem";
  return null;
}
function buyWeapon(id){
  const d = byId(DATA.armory, id), why = weaponBlock(d); if (why) return R(false, why);
  const price = priceOf(d.price) * (d.legal === "illegal" ? rfloat(1, 1.4) : 1);
  if (!canAfford(price)) return R(false, `Custa ${fmt(price)}.`);
  addMoney(-Math.round(price));
  if (d.legal === "illegal"){ addNoto(4); if (chance(0.08)){ S.record.push({ crime:"porte ilegal de arma", age:P().age, years:0 }); sendToPrison(rint(1, 3), "porte ilegal de arma"); return R(false, "O vendedor era informante. Preso(a) em flagrante."); } }
  arsenal().push({ uid:uid(), id, registered: d.legal === "license" });
  log(`${d.emoji} Comprei: ${d.name}.`, d.legal === "illegal" ? "bad" : "");
  return R(true, `${d.name} adquirida. Ela aparece como golpe nas brigas.`);
}
function discardWeapon(u){ const w = arsenal().find(x => x.uid === u); if (!w) return R(false, "?"); S.arsenal = S.arsenal.filter(x => x !== w); return R(true, `Me desfiz de: ${byId(DATA.armory, w.id).name}.`); }
function applyGunLicense(){
  const law = DATA.gunLaw[P().country] || { age:25, cost:2000, ok:0.3 };
  if (S.flags.gunLicense) return R(false, "Você já tem porte.");
  if (P().age < law.age) return R(false, `Idade mínima no país: ${law.age}.`);
  if (S.record.length) return R(false, "Negado: antecedentes criminais.");
  if (P().stress > 75 || S.illnesses.some(i => i.id === "depress" && i.diagnosed)) return R(false, "Negado no exame psicológico.");
  const cost = priceOf(law.cost); if (!canAfford(cost)) return R(false, `Taxas e cursos: ${fmt(cost)}.`);
  addMoney(-cost);
  if (!chance(law.ok)) return R(false, `Pedido negado pela polícia (aprovação ~${Math.round(law.ok*100)}% em ${country().name}).`);
  S.flags.gunLicense = true; log("🪪 Consegui porte de arma.", ""); return R(true, "Porte aprovado.");
}
/* Golpe de combate gerado a partir de uma arma do arsenal. */
function weaponMoves(){
  return arsenal().map(w => { const d = byId(DATA.armory, w.id); return d && { id:"w_" + d.id, weapon:d.id, name:`${d.emoji} ${d.name}`, dmg:d.dmg, acc:d.acc, ko:d.ko, lethal:d.lethal, cost:d.cost, type:"strike" }; }).filter(Boolean);
}
/* Na prisão (ou ao ser preso), armas ilegais pesam: +anos e apreensão. */
function weaponsOnArrest(){
  const ill = arsenal().filter(w => byId(DATA.armory, w.id).legal === "illegal");
  S.arsenal = arsenal().filter(w => byId(DATA.armory, w.id).legal !== "illegal");
  return ill.length;
}
