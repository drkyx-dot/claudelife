"use strict";
/* =====================================================================
   systems/gigs.js — TRABALHO AUTÔNOMO (freelance, apps, criadores,
   trabalho adulto). Pode ser renda principal ou bico junto do emprego
   (bico + emprego = mais estresse e ritmo máximo "Normal").

   Renda anual = base × Π(atributos) × (0,6 + habilidade/100)
                 × público (clientes/assinantes) × ritmo × país
     • atributo d com peso w: (0,4 + valor/100·1,2)^w  (média ≈ 1)
     • público: 1 + log10(1 + audiência/50), cresce com tempo, fama,
       aparência e marketing; despenca com escândalos.
   Adulto (18+): exposição acumula a cada ano (mais no ritmo intenso e
   com fama); quando "vaza", o jogador decide como reagir. Acompanhante:
   ISTs, clientes violentos (abre combate), polícia onde é ilegal.
   ===================================================================== */
const gigDef = id => byId(DATA.gigs, id);
const gig = () => S.gig;

function gigBlock(d){
  const p = P(), rq = d.req || {};
  const need = Math.max(d.minAge, d.adult ? ageOf("adult") : 0, d.id === "rideshare" ? ageOf("drive") : 0, ageOf("work"));
  if (p.age < need) return `Idade mínima: ${need}`;
  if (inPrison()) return "Você está preso(a)";
  if (rq.car && (!S.vehicles.length || !S.flags.license)) return "Precisa de carro e carteira";
  if (rq.int && p.stats.intelligence < rq.int) return `Inteligência ${rq.int}`;
  if (rq.health && p.stats.health < rq.health) return `Saúde ${rq.health}`;
  if (rq.edu && S.edu.level < rq.edu) return `Requer ${DATA.eduLevels[rq.edu]}`;
  if (S.gig?.id === d.id) return "Você já faz isso";
  return null;
}
function startGig(id){
  const d = gigDef(id), why = gigBlock(d); if (why) return R(false, why);
  if (S.gig) stopGig(true);
  S.gig = { id, years:0, skill: Math.round(15 + P().stats.intelligence/10), audience: d.audience ? rint(2, 15) : 0, pace: S.job ? 0 : 1, exposure:0, lastIncome:0, rating: 70 };
  if (d.adult) remember(`Comecei como ${d.name.toLowerCase()}. Dinheiro, mas também exposição e risco.`, "pending");
  log(`${d.emoji} Comecei a trabalhar por conta própria: ${d.name}.`, "");
  return R(true, `Agora você é ${d.name.toLowerCase()}${S.job ? " (como bico, além do emprego)" : ""}.`);
}
function stopGig(silent){
  const G = S.gig; if (!G) return R(false, "Você não trabalha por conta.");
  const d = gigDef(G.id); S.gig = null;
  if (!silent) log(`${d.emoji} Parei de trabalhar como ${d.name.toLowerCase()} após ${G.years} ano(s).`, "");
  return R(true, `Encerrou: ${d.name}.`);
}
function setGigPace(i){
  const G = S.gig; if (!G) return R(false, "?");
  if (S.job && i === 2) return R(false, "Com emprego fixo, o bico não passa de ritmo Normal.");
  G.pace = i; return R(true, `Ritmo: ${DATA.gigPace[i].name}.`);
}
/* Marketing/divulgação: gasta energia e dinheiro, cresce o público. */
function promoteGig(){
  const G = S.gig; if (!G) return R(false, "?");
  const d = gigDef(G.id); if (!d.audience) return R(false, "Esse trabalho não depende de divulgação.");
  const cost = priceOf(300 + G.years*80); if (!canAfford(cost)) return R(false, `Divulgação custa ${fmt(cost)}.`);
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  addMoney(-cost);
  const g = Math.round((10 + G.audience*0.15) * rfloat(0.6, 1.5) * (0.7 + P().stats.looks/200 + P().fame/150));
  G.audience += g; if (d.adult) G.exposure = clamp(G.exposure + 6);
  return R(true, `Divulgação feita: +${g} ${d.adult ? "assinantes" : "clientes/seguidores"} (${fmt(cost)}).`);
}
function practiceGig(){
  const G = S.gig; if (!G) return R(false, "?");
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  const g = Math.round(rint(4, 9) * dim("gigskill")); S.actCount.gigskill = num(S.actCount.gigskill) + 1;
  G.skill = clamp(G.skill + g); return R(true, `Me aperfeiçoei: habilidade ${Math.round(G.skill)} (+${g}).`);
}

function statFactor(d){
  const p = P(); let f = 1;
  for (const [k, w] of Object.entries(d.drivers || {})){
    const v = k === "talent" ? Math.max(p.talents.music, p.talents.acting) : k === "fame" ? p.fame : k === "reputation" ? p.reputation : p.stats[k];
    f *= Math.pow(0.4 + num(v)/100*1.2, w);
  }
  return f;
}
/* Renda estimada (usada no tick e exibida na UI). */
function gigIncome(G = S.gig){
  if (!G) return 0;
  const d = gigDef(G.id), pace = DATA.gigPace[G.pace];
  const aud = d.audience ? 1 + Math.log10(1 + G.audience/50) : 1;
  const mult = (G.id === "dev" || G.id === "design") && (S.edu.degrees.includes("cs") || S.edu.techs.includes("t_it")) ? 1.25 : 1;
  return Math.round(wageOf(d.base) * statFactor(d) * (0.6 + G.skill/100) * aud * pace.income * mult * (0.85 + 0.15*country().opp) * (G.rating/80));
}

function gigYear(){
  const G = S.gig; if (!G) return;
  if (inPrison()){ S.gig = null; return; }
  const d = gigDef(G.id), pace = DATA.gigPace[G.pace], Y = S.yearSummary, p = P();
  G.years++;
  // crescimento natural do público e da habilidade
  if (d.audience){
    const growth = (0.08 + p.stats.looks/900 + p.fame/500 + G.skill/1000) * rfloat(0.6, 1.4) * (G.pace === 0 ? 0.6 : G.pace === 2 ? 1.3 : 1);
    G.audience = Math.round(G.audience * (1 + growth) + rint(2, 12));
    if (d.viral && chance(0.04 + p.stats.looks/2000)) enqueue("ev_gig_viral");
  }
  G.skill = clamp(G.skill + rfloat(1, 4));
  G.rating = clamp(G.rating + rfloat(-6, 6) + (G.skill - 50)/25, 30, 100);
  // renda
  const inc = gigIncome(G); G.lastIncome = inc;
  addMoney(inc); Y.income += inc; S.stats.earned += inc; Y.lines.push([`${d.emoji} ${d.name}`, inc]);
  addStress(d.stress * pace.stress * (S.job ? 1.5 : 1) - 3);
  if (d.id === "streamer" || d.id === "street") addFame(Math.min(4, G.audience/2000) + (d.id === "street" ? 0.3 : 0));
  // riscos específicos
  const r = pace.risk;
  if (G.id === "delivery" && chance(0.05 * r)) log("🛵 Levei um tombo de moto na entrega." + injure(rint(6, 18), "Um acidente de entrega", 0.25), "bad");
  if (G.id === "rideshare" && chance(0.06 * r * country().crime)) enqueue("ev_gig_robbery");
  if (d.audience && !d.adult && chance(0.08)) enqueue(chance(0.5) ? "ev_gig_bigclient" : "ev_gig_noshow");
  if (d.adult){
    G.exposure = clamp(G.exposure + rint(3, 7) * r + p.fame/25);
    addRep(-0.5);
    if (chance(G.exposure/220)) enqueue("ev_adult_exposed");
    if (G.id === "escort") escortRisks(G, r);
  }
}
/* Acompanhante: saúde, violência e polícia. */
function escortRisks(G, r){
  const law = DATA.escortLaw[P().country] || "tolerada";
  if (chance(0.07 * r * (G.pace === 2 ? 1.3 : 1)) && !S.illnesses.some(i => i.id === "ist")){
    S.illnesses.push({ id:"ist", years:0, stage:1, diagnosed:true, treated:false, tier:null });
    log("🦠 Fui diagnosticado(a) com uma IST. Preciso tratar antes que piore.", "bad", ["health"]); emit("hospital");
  }
  if (chance(0.06 * r)) enqueue("ev_escort_danger");
  else if (chance(0.05)) enqueue("ev_escort_regular");
  if (law === "ilegal" && chance(0.08 * r)) enqueue("ev_escort_police");
}
