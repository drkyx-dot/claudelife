"use strict";
/* =====================================================================
   systems/world.js — emigração (CORRIGIDO na v5).
   Antes: emigrar vendia tudo (imóveis sumiam, aluguéis paravam).
   Agora: imóveis, veículos e negócios FICAM no país de origem, com seu
   `country` e moeda; seguem valorizando, gerando aluguel (convertido,
   com taxa de administração remota) e podem ser geridos/vendidos de
   longe. Só o caixa e os investimentos (líquidos) são convertidos.
   ===================================================================== */
const VISA_STRICT = { US:true, JP:true, DE:true };
function visaCheck(to){
  if (!VISA_STRICT[to.id]) return null;
  const qualified = S.edu.level >= 4 || netWorth() > wageOf(150000) || (S.job && S.job.level >= 2) || P().fame >= 50;
  if (qualified) return null;
  return `Visto negado por ${to.name}: exige diploma superior, carreira sólida ou patrimônio comprovado.`;
}
function emigrateCost(to){ return Math.round(priceOf(2500) + fxConv(priceIn(1500, to.id), to.id)); }

function emigrate(cid, fled){
  const from = country(), to = byId(DATA.countries, cid);
  if (!to || to.id === from.id) return R(false, "Destino inválido.");
  if (!fled){
    if (!adult()) return R(false, "Precisa ser maior de idade.");
    if (inPrison()) return R(false, "Você está preso(a).");
    if (S.wanted && !S.wanted.fakeId) return R(false, "Foragido(a) não tira passaporte. Só fugindo (coiote) ou com identidade falsa.");
    const visa = visaCheck(to); if (visa) return R(false, visa);
    const cost = emigrateCost(to); if (!canAfford(cost)) return R(false, `Mudança + visto custam ${fmt(cost)}.`);
    addMoney(-cost);
  }
  const conv = v => fxConv(v, from.id, to.id);
  // só ativos líquidos mudam de moeda
  S.money = conv(S.money);
  for (const id in S.investments) S.investments[id] = conv(S.investments[id]);
  S.edu.debt = conv(S.edu.debt);
  S.pension = conv(S.pension); // pensão portável (acordos previdenciários)
  S.lastSalary = conv(num(S.lastSalary));
  if (S.trustFund) S.trustFund = conv(S.trustFund);
  S.dirty = conv(num(S.dirty));
  // imóveis/veículos/negócios/dívidas ficam onde estão: garante o país de origem gravado
  for (const a of [...S.properties, ...S.vehicles, ...S.businesses, ...S.loans]) a.country = a.country || from.id;
  for (const p of S.properties) if (p.residence){ p.residence = false; log(`🏠 ${byId(DATA.properties,p.id).name} em ${from.name} ficou vago — posso colocá-lo para alugar de longe.`, ""); }
  S.rental = null;
  endJob("Emigrou"); S.partTime = null;
  if (S.org && S.org.rank < DATA.orgRanks.length - 1){ log(`Deixei a organização ${S.org.name} ao sair do país.`, "bad"); S.org = null; }
  else if (S.org) { S.org.remote = true; log(`Vou comandar ${S.org.name} à distância — com menos controle.`, "bad"); }
  // pessoas: parceiro(a) pode ou não vir; amigos ficam
  const pt = partner();
  if (pt){ if (pt.rel >= 55 || chance(0.4)){ pt.history = [...(pt.history||[]), { age:P().age, text:"Mudou de país comigo" }]; log(`${pt.first} veio comigo.`, "good"); } else { pt.role = pt.role === "spouse" ? "spouse" : "ex"; if (pt.role === "ex") log(`${pt.first} não quis largar tudo e terminamos.`, "bad"); } }
  for (const r of S.rels) if (["friend","sibling","mother","father"].includes(r.role) && r.alive) r.rel = clamp(r.rel - rint(4,10));
  P().country = to.id; P().city = pick(to.cities);
  if (!S.stats.countries.includes(to.id)) S.stats.countries.push(to.id);
  const kept = S.properties.length + S.vehicles.length + S.businesses.length;
  log(`${fled?"Fugi":"Me mudei"} para ${P().city}, ${to.name}. ✈️${kept ? ` Mantive ${kept} bem(ns) em ${from.name}, geridos à distância.` : ""}`, "milestone");
  emit("travel");
  return R(true, `Bem-vindo(a) a ${to.name}!`);
}
