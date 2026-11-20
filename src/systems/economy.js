"use strict";
/* =====================================================================
   systems/economy.js — ciclo econômico global (MODO BRUTO).
   Fases com transição de Markov. Cada fase altera inflação, demissões,
   contratações, retorno de investimentos e preço de imóveis.
   Salários (S.wageIndex) repõem só parte da inflação + produtividade:
   anos bons recuperam poder de compra, recessões e crises o corroem.
   ===================================================================== */
const PHASES = {
  "expansão": { emoji:"📈", layoff:0.6, hire:0.06,  invest:0.05,  prop:0.02,  infl:0.035,wage:0.95, prod:0.012, next:{ "expansão":0.55, "estável":0.35, "recessão":0.10 } },
  "estável":  { emoji:"➖", layoff:1.0, hire:0,     invest:0,     prop:0,     infl:0.03, wage:0.85, prod:0.008, next:{ "expansão":0.29, "estável":0.56, "recessão":0.13, "crise":0.02 } },
  "recessão": { emoji:"📉", layoff:2.5, hire:-0.1,  invest:-0.12, prop:-0.04, infl:0.045,wage:0.6,  prod:0,  next:{ "estável":0.40, "recessão":0.40, "crise":0.15, "expansão":0.05 } },
  "crise":    { emoji:"🔥", layoff:4.0, hire:-0.18, invest:-0.28, prop:-0.09, infl:0.08, wage:0.45, prod:-0.01, next:{ "recessão":0.55, "crise":0.25, "estável":0.20 } },
};
function phase(){ return PHASES[S.world?.phase] || PHASES["estável"]; }
function phaseName(){ return S.world?.phase || "estável"; }

function economyYear(){
  const W = S.world;
  const nextP = weighted(Object.keys(phase().next), k => phase().next[k]);
  W.years = nextP === W.phase ? W.years + 1 : 1;
  if (nextP !== W.phase){
    const news = {
      "expansão": "📰 Economia em expansão: empresas contratando e bolsa em alta.",
      "estável":  "📰 A economia se estabilizou.",
      "recessão": "📰 RECESSÃO: o PIB encolheu, demissões em massa e crédito mais caro.",
      "crise":    "📰 CRISE ECONÔMICA: quebradeira geral, desemprego disparou e o dinheiro perde valor.",
    }[nextP];
    log(news, nextP === "recessão" || nextP === "crise" ? "bad" : "good", ["money"]);
    emit("economy", nextP);
  }
  W.phase = nextP;
  // inflação do país = fase global + ruído + instabilidade local (países com mais crime/instabilidade oscilam mais)
  const local = (country().crime - 1) * 0.01;
  W.inflation = Math.max(0, phase().infl + local + rfloat(-0.012, 0.012));
  S.priceIndex = num(S.priceIndex, 1) * (1 + W.inflation);
  // salários: repõem parte da inflação + ganho de produtividade (bons anos recuperam, crises corroem)
  S.wageIndex  = num(S.wageIndex, S.priceIndex) * (1 + W.inflation * phase().wage + phase().prod);
  W.history.push({ age:P().age, phase:nextP, infl:W.inflation });
  if (W.history.length > 130) W.history.shift();
}
