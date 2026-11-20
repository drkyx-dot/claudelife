"use strict";
/* =====================================================================
   systems/looks.js — APARÊNCIA E VISÃO.
   • Estilo: cabelo, barba/maquiagem (ganho pontual, rende menos se
     repetido no ano), guarda-roupa (custo anual → +aparência/ano até um
     teto) e skincare (custo anual → metade da perda de aparência pela idade).
   • Procedimentos: botox, harmonização, lentes dentais e cirurgia
     plástica premium ou BARATA (erro médico: aparência, saúde e até morte).
   • Visão: teste ÚNICO na escola (S.look.visionTested). Miopia → óculos
     com penalidade de aparência pela armação (básica −4, moderna −2,
     grife −1, lentes de contato 0 com custo anual). Sem correção: dor de
     cabeça e queda no desempenho escolar. Adulto(a) pode fazer cirurgia
     a laser (premium 97% ou clínica barata 80% de sucesso).
   ===================================================================== */
const look = () => S.look;
DATA.hairStyles = [
  { id:"natural",  name:"Natural",                 price:0,    looks:0 },
  { id:"simple",   name:"Corte simples",           price:40,   looks:1 },
  { id:"modern",   name:"Corte moderno",           price:120,  looks:2 },
  { id:"color",    name:"Coloração / luzes",       price:260,  looks:2 },
  { id:"visagism", name:"Visagismo premium",       price:700,  looks:3 },
];
DATA.faceStyles = [
  { id:"none",     name:"Nada",                    price:0,    looks:0 },
  { id:"beard",    name:"Barba desenhada",         price:60,   looks:1 },
  { id:"makeup",   name:"Maquiagem profissional",  price:150,  looks:2 },
  { id:"brows",    name:"Design de sobrancelhas",  price:80,   looks:1 },
];
DATA.wardrobes = [
  { id:0, name:"Básico",       price:0,     perYear:0, cap:0 },
  { id:1, name:"Moderno",      price:2500,  perYear:1, cap:80 },
  { id:2, name:"Grife",        price:12000, perYear:2, cap:92 },
];
DATA.procedures = [
  { id:"botox",   name:"Botox",                          price:1800,  looks:[2,4],  minAge:25, risk:0.01, harm:[2,4] },
  { id:"harmon",  name:"Harmonização facial",            price:6000,  looks:[3,6],  minAge:21, risk:0.06, harm:[4,9] },
  { id:"veneers", name:"Lentes dentais",                 price:12000, looks:[4,6],  minAge:18, risk:0.03, harm:[2,5] },
  { id:"plastic_lux", name:"Cirurgia plástica (clínica premium)",   price:25000, looks:[8,14], minAge:18, risk:0.04, harm:[6,12], surgery:true },
  { id:"plastic_cheap",name:"Cirurgia plástica (clínica barata)",   price:5000,  looks:[7,12], minAge:18, risk:0.25, harm:[10,20], surgery:true, cheap:true },
];
DATA.frames = [
  { id:"basic",    name:"Armação básica do SUS/convênio", price:0,    penalty:4 },
  { id:"modern",   name:"Armação moderna",                price:400,  penalty:2 },
  { id:"designer", name:"Armação de grife",               price:1500, penalty:1 },
  { id:"contacts", name:"Lentes de contato",              price:600,  penalty:0, yearly:true, minAge:13 },
];

/* Paga custo (adulto paga; criança: família paga se puder). */
function payLook(v){
  if (v <= 0) return true;
  if (!adult()){ if (clsBand() >= 1 || v <= priceOf(100)) return true; return false; }
  if (!canAfford(v)) return false; addMoney(-v); return true;
}
function setStyle(kind, id){
  const L = look(), list = kind === "hair" ? DATA.hairStyles : DATA.faceStyles, d = byId(list, id);
  if (!d) return R(false, "?");
  if (P().age < 8) return R(false, "Seus pais escolhem seu cabelo por enquanto.");
  const price = priceOf(d.price); if (!payLook(price)) return R(false, `Custa ${fmt(price)}.`);
  L[kind === "hair" ? "hair" : "face"] = id;
  const key = "style"; const g = sc(d.looks, key); S.actCount[key] = num(S.actCount[key]) + 1;
  if (g) addStat("looks", g);
  return R(true, `Novo visual: ${d.name}.${g ? ` (Aparência +${g})` : ""}`);
}
function setWardrobe(id){
  const d = byId(DATA.wardrobes, id); if (!d) return R(false, "?");
  if (P().age < 14) return R(false, "Ainda é a família que compra suas roupas.");
  look().wardrobe = id;
  return R(true, id ? `Guarda-roupa ${d.name}: ${fmt(priceOf(d.price))}/ano, +${d.perYear} de aparência por ano (até ${d.cap}).` : "Voltei ao básico.");
}
function toggleSkincare(){
  if (P().age < 14) return R(false, "Cedo demais.");
  look().skincare = !look().skincare;
  return R(true, look().skincare ? `Rotina de skincare: ${fmt(priceOf(1500))}/ano, envelhecimento da pele pela metade.` : "Larguei o skincare.");
}
function doProcedure(id){
  const d = byId(DATA.procedures, id); if (!d) return R(false, "?");
  if (P().age < d.minAge) return R(false, `Idade mínima: ${d.minAge}.`);
  if (inPrison()) return R(false, "Você está preso(a).");
  const price = priceOf(d.price); if (!canAfford(price)) return R(false, `Custa ${fmt(price)}.`);
  addMoney(-price); look().procedures++;
  const risk = d.risk * (P().age > 60 ? 2 : 1) * (P().stats.health < 40 ? 1.5 : 1);
  if (chance(risk)){
    const h = rint(...d.harm);
    addStat("looks", -h);
    let msg = `${d.cheap ? "ERRO MÉDICO" : "Complicação"} em ${d.name.toLowerCase()}: aparência −${h}.`;
    if (d.surgery){
      msg += injure(rint(8, 20), `Erro na ${d.name.toLowerCase()}`, 0.5);
      if (d.cheap && chance(0.06)){ S.flags.forcedDeath = "complicações de uma cirurgia plástica em clínica clandestina"; log("☠️ A clínica barata não tinha nem UTI.", "bad"); }
      if (d.cheap) schedule("clinicLawsuit", 1, { price }, "Posso processar a clínica.");
    }
    addStat("happiness", -10); log(`💉 ${msg}`, "bad", ["health"]);
    return R(false, msg);
  }
  const g = rint(...d.looks); addStat("looks", g); addStat("happiness", 5);
  if (d.surgery && chance(0.15)) schedule("plasticRevision", rint(5, 10));
  log(`💉 ${d.name}: aparência +${g}.`, "", ["health"]);
  return R(true, `${d.name} deu certo: aparência +${g}.`);
}

/* ---------- Visão ---------- */
function setFrame(id){
  const L = look(), d = byId(DATA.frames, id); if (!d || !L.myopia || L.lasik) return R(false, "Você não usa óculos.");
  if (d.minAge && P().age < d.minAge) return R(false, `Lentes de contato a partir dos ${d.minAge}.`);
  const price = priceOf(d.price); if (!d.yearly && !payLook(price)) return R(false, `Custa ${fmt(price)}.`);
  const diff = d.penalty - num(L.glassesPenalty);
  addStat("looks", -diff); L.glassesPenalty = d.penalty; L.glasses = id;
  return R(true, `Agora uso: ${d.name}.${diff ? ` (Aparência ${diff > 0 ? "−" : "+"}${Math.abs(diff)})` : ""}`);
}
function laserSurgery(cheap){
  const L = look();
  if (!L.myopia || L.lasik) return R(false, "Sua visão não precisa de correção.");
  if (P().age < 20) return R(false, "O grau só estabiliza depois dos 20 anos.");
  const price = priceOf(cheap ? 3500 : 9000); if (!canAfford(price)) return R(false, `Custa ${fmt(price)}.`);
  addMoney(-price);
  if (!chance(cheap ? 0.8 : 0.97)){
    const msg = "A cirurgia não corrigiu tudo e deixou o olho seco." + injure(rint(3, 8), "A cirurgia ocular", 0.3);
    addStat("looks", -1); log(`👁️ ${msg}`, "bad", ["health"]); return R(false, msg);
  }
  addStat("looks", num(L.glassesPenalty) + 1); L.glassesPenalty = 0; L.glasses = null; L.lasik = true;
  log("👁️ Fiz cirurgia a laser: adeus, óculos!", "milestone", ["health"]); achieve("lasik", "Visão corrigida a laser");
  return R(true, "Visão 100%! Aparência recuperada (+1 bônus).");
}

/* ---------- Tick anual ---------- */
function looksYear(){
  const L = look(), Y = S.yearSummary, a = P().age;
  if (a >= 14){
    const w = DATA.wardrobes[L.wardrobe || 0];
    if (w.price){ const c = priceOf(w.price); if (adult() && S.money < c){ L.wardrobe = 0; log("👕 Cortei o guarda-roupa caro: não cabia no orçamento.", ""); } else { if (adult()){ addMoney(-c); Y.expenses += c; Y.lines.push([`Guarda-roupa ${w.name.toLowerCase()}`, -c]); } if (P().stats.looks < w.cap) addStat("looks", w.perYear); } }
    if (L.skincare){ const c = priceOf(1500); if (adult() && S.money < c) L.skincare = false; else if (adult()){ addMoney(-c); Y.expenses += c; Y.lines.push(["Skincare", -c]); } }
    if (L.glasses === "contacts"){ const c = priceOf(600); if (adult() && S.money < c){ setFrame("basic"); log("👓 Sem dinheiro para lentes: voltei aos óculos básicos.", "bad"); } else if (adult()){ addMoney(-c); Y.expenses += c; Y.lines.push(["Lentes de contato", -c]); } }
  }
  // miopia sem correção: dor de cabeça e notas ruins
  if (L.myopia && !L.glasses && !L.lasik){ if (S.edu.school) S.edu.perf = clamp(S.edu.perf - 4); addStress(3); }
}
CONSEQ.clinicLawsuit = ctx => { if (chance(0.5)){ const v = Math.round(ctx.price * 2); addMoney(v); return out(`Ganhei o processo contra a clínica: ${fmt(v)} de indenização.`, "good"); } return out("A clínica fechou e sumiu. Não recebi nada.", "bad"); };
