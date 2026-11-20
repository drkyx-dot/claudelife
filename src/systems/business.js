"use strict";
/* systems/business.js */

/* ---------- Negócios ---------- */
function businessYear(){
  for (const b of S.businesses){
    const d = byId(DATA.businesses, b.id); b.years++;
    const skill = (P().stats.intelligence + (hasTrait("creative")?15:0) + (hasTrait("ambitious")?10:0)) / 100;
    // crescimento com REVERSÃO À MÉDIA: o mercado comporta um faturamento-alvo
    // (base × talento de gestão). Longe do alvo, o crescimento desacelera — sem bola de neve infinita.
    const target = priceIn(d.revenue, b.country) * num(b.share,1) * (0.8 + skill*2.5);
    const pull = -0.3 * Math.log(Math.max(1, b.revenue) / Math.max(1, target));
    const growth = Math.exp(gauss()*d.vol*0.5 + pull);
    b.revenue = Math.round(Math.max(0, b.revenue * growth));
    // fase econômica pesa no faturamento; à distância a gestão rende menos
    b.revenue = Math.round(b.revenue * (1 + phase().invest*0.6) * (isAbroad(b) ? 0.95 : 1));
    const profit = Math.round(b.revenue * rfloat(0.04, 0.24) * (skill+0.4) - priceIn(d.cost, b.country)*0.08*num(b.share,1));
    b.lastProfit = profit;
    b.value = Math.max(0, Math.round(b.revenue * rfloat(0.6, 1.6)));
    if (b.revenue < priceIn(d.revenue, b.country) * 0.15 * num(b.share,1)){ b.bankrupt = true; }
  }
  for (const b of S.businesses.filter(b=>b.bankrupt)){ log(`Meu negócio "${b.name}" faliu. 💸`, "bad"); addStat("happiness",-15); }
  S.businesses = S.businesses.filter(b=>!b.bankrupt);
  if (S.businesses.some(b=>b.value > wageOf(5e6))) achieve("tycoon","Empresário de sucesso");
}

/* ---------- Empreendedorismo ---------- */
function openBusiness(id){
  const d = byId(DATA.businesses, id), cost = priceOf(d.cost);
  if (!adult()) return R(false, "Precisa ser maior de idade.");
  if (d.needs && !S.edu.degrees.includes(d.needs)) return R(false, `Requer diploma em ${byId(DATA.majors,d.needs).name}.`);
  if (!canAfford(cost)) return R(false, `Precisa de ${fmt(cost)}.`);
  addMoney(-cost);
  const b = { uid:uid(), id, country:P().country, share:1, name:`${d.name} ${P().last}`, value:Math.round(cost*0.8), revenue:Math.round(priceOf(d.revenue)*rfloat(0.4,0.8)), years:0, lastProfit:0 };
  S.businesses.push(b); log(`Abri meu próprio negócio: ${b.name}! 🏪`, "milestone"); achieve("founder","Empreendedor(a)");
  return R(true, `${b.name} inaugurado!`);
}

function sellBusiness(u){ const b = S.businesses.find(x=>x.uid===u); if (!b) return R(false,"?"); const v = fxConv(Math.round(b.value*0.9), b.country); addMoney(v); S.businesses = S.businesses.filter(x=>x!==b); log(`Vendi ${b.name} por ${fmt(v)}.`, "good"); emit("money"); return R(true, `Vendido por ${fmt(v)}.`); }
