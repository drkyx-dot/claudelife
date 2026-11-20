"use strict";
/* =====================================================================
   systems/aging.js — envelhecimento natural, estresse e humor de base.
   Vitalidade = teto biológico de saúde (cai com a idade, nunca volta).
   Estresse = consequência agregada de trabalho, dívidas, família,
   doença, moradia e vícios; afeta saúde, humor, relações e carreira.
   ===================================================================== */

/* Alvo de estresse com explicação (a UI mostra as maiores causas). */
function stressTarget(){
  const p = P(), a = p.age, parts = [];
  const add = (label, v) => { if (v) parts.push([label, v]); };
  add("Base", 15);
  if (S.job) add(["Esforço mínimo","Ritmo normal","Hora extra"][S.job.effort] , [-3, 6, 22][S.job.effort]);
  if (S.job && S.job.level >= 3) add("Cargo de alta responsabilidade", 5);
  if (a >= 18 && a < 65 && !S.job && !S.edu.school && !S.retired && !S.businesses.length && !inPrison()) add("Desemprego", 12);
  const inc = Math.max(jobIncome() + S.businesses.reduce((x,b)=>x+Math.max(0,b.lastProfit),0), priceOf(5000));
  const unsecured = S.loans.filter(l=>!l.propertyUid).reduce((x,l)=>x+l.principal,0) + S.edu.debt;
  const ratio = unsecured / inc;
  if (ratio > 0.5) add("Dívidas", ratio > 3 ? 20 : ratio > 1.5 ? 12 : 6);
  if (S.flags.overdraftYear === a || S.flags.overdraftYear === a-1) add("Conta no vermelho", 8);
  if (inPrison()) add("Prisão", 30);
  const serious = S.illnesses.filter(i => i.diagnosed && byId(DATA.illnesses,i.id).sev >= 8).length;
  if (serious) add("Doença grave", Math.min(20, serious*9));
  if (S.flags.caregiver) add("Cuidando de pai/mãe idoso(a)", 10);
  const babies = children().filter(c=>c.age < 6).length; if (babies) add("Filhos pequenos", Math.min(10, babies*4));
  const pt = partner(); if (pt) add(pt.rel < 30 ? "Relacionamento em crise" : pt.rel > 75 ? "Relacionamento feliz" : "", pt.rel < 30 ? 8 : pt.rel > 75 ? -5 : 0);
  const petLove = (S.pets || []).filter(x => x.bond >= 50).length;
  if (petLove) add("Companhia dos pets", -Math.min(8, 3 + petLove * 2));
  const wildStress = (S.pets || []).filter(x => byId(DATA.petSpecies, x.sp)?.danger >= 0.2 && (x.hunger >= 50 || x.stress >= 60)).length;
  if (wildStress) add("Animal selvagem agitado em casa", 6 * wildStress);
  add(`Estilo de vida ${LIFESTYLES[p.lifestyle].name.toLowerCase()}`, a >= 18 ? LIFESTYLES[p.lifestyle].stress : 0);
  const home = homeInfo(); if (a >= 18) add(home.type === "none" ? "Sem moradia" : "Conforto da moradia", home.type === "none" ? 20 : Math.round((5 - home.comfort)*1.2));
  if (S.edu.school === "uni" || S.edu.school === "grad") add("Faculdade", 6); else if (S.edu.school === "medio") add("Ensino médio", 3);
  if (S.addictions.gambling > 40) add("Jogo compulsivo", 8);
  if (S.retired) add("Aposentadoria", -6);
  if (S.job && career().elected) add("Vida pública", 6);
  let target = parts.reduce((x,[,v])=>x+v, 0);
  if (a < 10) target *= 0.4;
  return { target: clamp(target), parts: parts.filter(([l])=>l && l !== "Base") };
}

function agingYear(){
  const a = P().age, st = P().stats, p = P();
  // ganhos de inteligência com retorno decrescente: quanto mais alto, mais difícil subir
  if (a < 18) addStat("intelligence", rfloat(0.1, 1.2) * (hasTrait("genius")?1.4:1) * (1 - st.intelligence/125));
  if (a > 70) addStat("intelligence", -rfloat(0, 1.2));
  // vitalidade: teto biológico (atleta envelhece mais devagar; vícios aceleram)
  if (a > 28){
    let drop = 0.3 + (a > 50 ? 0.45 : 0) + (a > 70 ? 0.8 : 0) + (a > 85 ? 1.2 : 0);
    drop *= hasTrait("athletic") ? 0.8 : 1;
    drop += S.addictions.smoke/220 + S.addictions.alcohol/260 + (p.stress > 70 ? 0.25 : 0);
    if (S.health.exercised) drop *= 0.8;
    p.vitality = clamp(p.vitality - drop);
  }
  if (a > 35) addStat("looks", (-rfloat(0.2, 1.0) - (a>60 ? 0.8 : 0) - (S.addictions.smoke > 40 ? 0.5 : 0)) * (S.look?.skincare ? 0.5 : 1));
  if (a >= 13 && a <= 17) addStat("looks", rfloat(-3, 4));

  // estresse caminha 40% em direção ao alvo do ano
  const { target } = stressTarget();
  p.stress = clamp(p.stress + (target - p.stress) * 0.4 + rfloat(-3, 3));

  // felicidade regride à linha de base determinada pela vida atual
  const home = homeInfo();
  let base = 50 + home.comfort*1.5 + (a >= 18 ? LIFESTYLES[p.lifestyle].happy : 0);
  const pt = partner(); if (pt) base += (pt.rel - 50) / 6;
  base += parents().reduce((s,x)=> s + (x.rel-50)/25, 0);
  base += children().reduce((s,c)=> s + (c.rel-50)/30, 0);
  if (a >= 18 && a < 65 && !S.job && !S.edu.school && !S.retired && S.businesses.length===0) base -= 8;
  if (home.type === "none" && a >= 18) base -= 15;
  if (home.type === "family" && a > 25) base -= 4;
  if (inPrison()) base -= 25;
  if (p.stress > 50) base -= (p.stress - 50) / 4;
  if (hasTrait("lazy")) base += 3;
  if (hasTrait("anxious")) base -= 4;
  if (S.illnesses.some(i=>i.diagnosed && byId(DATA.illnesses,i.id)?.mood)) base -= 15;
  if (st.health < 30) base -= 8;
  st.happiness = clamp(st.happiness + (base - st.happiness) * 0.25 + rfloat(-3,3));

  p.notoriety = clamp(p.notoriety - 2); // a "ficha" esfria com o tempo
  if (S.job && !career().fame) addFame(-1); else if (!S.job) addFame(-2);
  // reputação regride lentamente a 50 sem emprego (o mercado esquece)
  if (!S.job && a >= 18) p.reputation = clamp(p.reputation + (50 - p.reputation) * 0.1);
}
