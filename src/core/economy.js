"use strict";
/* =====================================================================
   core/economy.js — moedas, conversão multi-país e impostos.

   MODELO MULTI-PAÍS (v5): cada ativo/dívida guarda `country` e o valor
   na MOEDA DAQUELE PAÍS. O caixa (S.money) e os investimentos ficam na
   moeda do país onde o jogador mora. Tudo que soma patrimônio ou fluxo
   converte com fxConv(). Assim, emigrar não apaga nem liquida nada:
   imóveis no Brasil continuam no Brasil, rendendo em reais.
   ===================================================================== */
function country(id){ return byId(DATA.countries, id || S.player.country) || DATA.countries[0]; }

const priceOf  = base => Math.round(base * country().fx * country().col  * S.priceIndex);
/* salários seguem S.wageIndex (cresce menos que a inflação no modo bruto) */
const wageIdx  = () => num(S.wageIndex, S.priceIndex);
const wageOf   = base => Math.round(base * country().fx * country().wage * wageIdx());
const toBase   = local => local / (country().fx * country().wage * wageIdx());
/* Preço base num país específico (comprar imóvel no exterior, avaliar ativo remoto). */
const priceIn  = (base, cid) => Math.round(base * country(cid).fx * country(cid).col * S.priceIndex);

/* Converte valor da moeda de `from` para a de `to` (padrão: país atual). */
function fxConv(amount, from, to){
  from = from || S.player.country; to = to || S.player.country;
  if (from === to) return Math.round(num(amount));
  return Math.round(num(amount) / country(from).fx * country(to).fx);
}
/* Valor de um ativo/dívida já convertido para a moeda local. */
const localValue = a => fxConv(a.value ?? a.principal ?? 0, a.country);

function fmtIn(v, cid, compact){
  v = num(v);
  const c = country(cid);
  try {
    return new Intl.NumberFormat(c.locale, { style:"currency", currency:c.currency,
      notation: compact && Math.abs(v) >= 1e6 ? "compact" : "standard",
      maximumFractionDigits: Math.abs(v) >= 1000 || c.currency==="JPY" ? 0 : 2 }).format(v);
  } catch(e){ return c.currency + " " + Math.round(v).toLocaleString(); }
}
const fmt = (v, compact) => fmtIn(v, null, compact);
/* Mostra valor na moeda do ativo e, se estrangeiro, o equivalente local. */
function fmtAsset(v, cid){
  if (!cid || cid === S.player.country) return fmt(v);
  return `${fmtIn(v, cid)} <span class="muted">(≈ ${fmt(fxConv(v, cid), true)})</span>`;
}

/* Imposto de renda progressivo (escala base, independe do país).
   MODO BRUTO: faixas mais pesadas que a v4. */
function incomeTax(local){
  const b = toBase(local); let tax = 0;
  const brackets = [[9000,0],[25000,0.15],[60000,0.25],[150000,0.33],[400000,0.4],[Infinity,0.45]];
  let prev = 0;
  for (const [cap, rate] of brackets){ if (b > prev) tax += (Math.min(b,cap)-prev)*rate; prev = cap; }
  return Math.max(0, Math.round(local * (tax / Math.max(b,1))));
}
/* Imposto sobre grandes fortunas: 0,6% a 1,5% do patrimônio acima de ~1 milhão base. */
function wealthTax(nw){
  const b = toBase(nw), floor = 1e6;
  if (b <= floor) return 0;
  const rate = b > 2e7 ? 0.015 : b > 5e6 ? 0.01 : 0.006;
  return Math.round((nw - wageOf(floor)) * rate);
}
