"use strict";
/* =====================================================================
   systems/underworld.js — submundo e crime organizado.

   • DINHEIRO SUJO (S.dirty): rendimento de crimes graves e da
     organização. Não paga contas nem compra bens: precisa ser LAVADO por
     um negócio de fachada seu (taxa 20%, capacidade limitada pelo
     faturamento, aumenta o "calor" e pode atrair auditoria).
   • ORGANIZAÇÃO (S.org): entrar como Associado(a) e subir na hierarquia
     por respeito, ou fundar a sua (você vira Chefe). O chefe recruta
     capangas (habilidade/lealdade/função), abre operações em
     territórios, paga a "parte" de cada um e administra o CALOR policial.
   • Riscos anuais: batida policial, traição de capanga desleal, guerra
     com organizações rivais. Tudo vira evento que PERGUNTA ao jogador.
   ===================================================================== */
const isBoss = () => !!S.org && S.org.rank === DATA.orgRanks.length - 1;
const orgPower = () => !S.org ? 0 : S.org.members.reduce((a,m)=>a + m.skill*(0.4 + m.loyalty/170), 0) + P().stats.intelligence*0.3 + S.crimeSkill*0.5;
function frontCapacity(){
  return S.businesses.filter(b => byId(DATA.businesses,b.id)?.front && !isAbroad(b)).reduce((a,b)=>a + Math.round(b.revenue*0.5), 0);
}
function makeCrewCandidate(){
  const g = chance(0.75) ? "M" : "F", n = genName(country(), g);
  const skill = rint(15, 85), loyalty = rint(25, 90), pers = pick(DATA.personalities);
  return { uid:uid(), name:`${n.first} ${n.last}`, nick: pick(["Magrão","Baixinho","Neguinho","Gringo","Alemão","Faísca","Doutor","Tubarão","Sombra","Japa","Russo","Pistola"]),
    gender:g, age:rint(19,45), skill, loyalty: clamp(loyalty + num(pers.loyalty)), personality:pers.id, role:pick(DATA.orgRoles),
    cost: priceOf(800 + skill*40), cut: priceOf(1500 + skill*60), since:P().age, history:[] };
}

/* ---------- Entrar, fundar, sair ---------- */
function joinOrg(name){
  if (S.org) return R(false, "Você já faz parte de uma organização.");
  S.org = { name: name || pick(DATA.orgNames), own:false, rank:0, respect:10, heat:5, members:[], ops:[], territories:[],
    rivals: [{ name: pick(DATA.orgNames.filter(x=>x!==name)), power: rint(80, 300), hostility: rint(10,40) }], years:0, remote:false };
  log(`🕶️ Entrei para ${S.org.name} como ${DATA.orgRanks[0].name}.`, "bad", ["crime"]);
  remember(`Entrei no crime organizado (${S.org.name}). Sair não vai ser simples.`, "bad");
  return R(true, `Bem-vindo(a) à ${S.org.name}.`);
}
function foundOrg(name){
  if (S.org) return R(false, "Você já faz parte de uma organização.");
  if (P().age < 18) return R(false, "Idade mínima: 18.");
  if (S.crimeSkill < 30 && P().notoriety < 35) return R(false, "Ninguém te respeita no submundo ainda (habilidade criminal 30 ou notoriedade 35).");
  const cost = priceOf(20000);
  if (S.dirty + S.money < cost) return R(false, `Precisa de ${fmt(cost)} (sujo ou limpo) para armas, ponto e propina.`);
  const fromDirty = Math.min(S.dirty, cost); S.dirty -= fromDirty; addMoney(-(cost - fromDirty));
  S.org = { name: name || `Os ${P().last}`, own:true, rank:DATA.orgRanks.length-1, respect:60, heat:10, members:[makeCrewCandidate(), makeCrewCandidate()],
    ops:[], territories:[pick(DATA.territories)], rivals:[{ name: pick(DATA.orgNames), power: rint(120, 350), hostility: rint(20,50) }], years:0, remote:false };
  log(`👑 Fundei minha própria organização: ${S.org.name}.`, "milestone", ["crime"]); achieve("kingpin", "Fundou uma organização criminosa");
  emit("crime"); return R(true, `${S.org.name} está nas ruas.`);
}
function leaveOrg(){
  if (!S.org) return R(false, "?");
  const name = S.org.name;
  if (!isBoss() && chance(0.35)){ injure(rint(10, 25), "A represália da organização", 0.35); log(`Saí de ${name}, mas me deram um "recado" antes.`, "bad"); }
  else log(`${isBoss() ? "Dissolvi" : "Saí de"} ${name}.`, "milestone");
  addNoto(Math.round(S.org.heat / 3)); S.org = null;
  remember(`Deixei a vida no crime organizado (${name}).`, "good");
  return R(true, "Você está fora.");
}

/* ---------- Gestão (chefe) ---------- */
function recruit(c){
  if (!isBoss()) return R(false, "Só o chefe recruta.");
  if (S.org.members.length >= 14) return R(false, "Organização grande demais para controlar.");
  if (S.dirty + S.money < c.cost) return R(false, `Recrutar custa ${fmt(c.cost)}.`);
  const d = Math.min(S.dirty, c.cost); S.dirty -= d; addMoney(-(c.cost - d));
  S.org.members.push(c); S.org.heat = clamp(S.org.heat + 2);
  log(`🕶️ Recrutei ${c.name} ("${c.nick}") como ${c.role}.`, "", ["crime"]); return R(true, `${c.nick} está dentro.`);
}
function expel(muid){
  const m = S.org?.members.find(x=>x.uid===muid); if (!m) return R(false,"?");
  S.org.members = S.org.members.filter(x=>x!==m);
  for (const x of S.org.members) x.loyalty = clamp(x.loyalty - 3);
  if (m.loyalty < 40 || chance(personalityOfMember(m).snitch || 0.1)){ S.org.heat = clamp(S.org.heat + 15); log(`${m.nick} saiu falando demais. A polícia ficou sabendo de coisas.`, "bad", ["crime"]); }
  else log(`Expulsei ${m.nick} da organização.`, "", ["crime"]);
  return R(true, "Membro expulso.");
}
const personalityOfMember = m => byId(DATA.personalities, m.personality) || {};
function bonusMember(muid){
  const m = S.org?.members.find(x=>x.uid===muid); if (!m) return R(false,"?");
  const v = Math.round(m.cut * 0.5); if (S.dirty < v) return R(false, `Bônus de ${fmt(v)} (dinheiro sujo).`);
  S.dirty -= v; m.loyalty = clamp(m.loyalty + rint(8, 15)); m.history.push({ age:P().age, text:"Recebeu bônus" });
  return R(true, `${m.nick} ficou mais leal.`);
}
function startOp(opId, territory){
  if (!isBoss()) return R(false, "Só o chefe abre operações.");
  const op = byId(DATA.orgOps, opId);
  if (S.org.ops.some(o=>o.id===opId)) return R(false, "Essa operação já está rodando.");
  const busy = S.org.ops.reduce((a,o)=>a+byId(DATA.orgOps,o.id).members,0);
  if (S.org.members.length - busy < op.members) return R(false, `Precisa de ${op.members} capangas livres.`);
  const setup = priceOf(op.income * 0.3);
  if (S.dirty + S.money < setup) return R(false, `Montar a operação custa ${fmt(setup)}.`);
  const d = Math.min(S.dirty, setup); S.dirty -= d; addMoney(-(setup - d));
  territory = territory || pick(S.org.territories.length ? S.org.territories : DATA.territories);
  if (!S.org.territories.includes(territory)) S.org.territories.push(territory);
  S.org.ops.push({ id:opId, territory, years:0 });
  log(`💼 Abri a operação "${op.name}" em ${territory}.`, "bad", ["crime"]); return R(true, "Operação em andamento.");
}
function stopOp(opId){ if (!S.org) return R(false,"?"); S.org.ops = S.org.ops.filter(o=>o.id!==opId); return R(true, "Operação encerrada."); }
/* Lavagem: converte sujo em limpo através de negócios de fachada. */
function launder(amount){
  const cap = frontCapacity() - num(S.flags.launderedThisYear);
  if (cap <= 0) return R(false, "Sem negócio de fachada (lava-jato, casa noturna, academia…) ou capacidade esgotada este ano.");
  amount = Math.min(Math.round(amount), S.dirty, cap);
  if (amount <= 0) return R(false, "Nada para lavar.");
  S.dirty -= amount; const clean = Math.round(amount * 0.8); addMoney(clean);
  S.flags.launderedThisYear = num(S.flags.launderedThisYear) + amount; S.stats.laundered += amount;
  if (S.org) S.org.heat = clamp(S.org.heat + amount / Math.max(1, frontCapacity()) * 6);
  addNoto(2);
  if (S.stats.laundered > wageOf(400000) && chance(0.15)) enqueue("ev_tax_audit");
  log(`🧺 Lavei ${fmt(amount)} pelos meus negócios: ${fmt(clean)} limpos (taxa de 20%).`, "", ["crime","money"]);
  return R(true, `${fmt(clean)} agora são dinheiro limpo.`);
}

/* ---------- Tick anual ---------- */
function orgYear(){
  S.flags.launderedThisYear = 0;
  const O = S.org; if (!O) return;
  O.years++;
  const crisis = phaseName() === "crise" || phaseName() === "recessão" ? 1.15 : 1;
  if (!isBoss()){
    // membro: ganha uma fatia, acumula respeito, pode ser promovido
    const base = priceOf(25000 * (O.rank + 1)) * DATA.orgRanks[O.rank].share * 8 * crisis;
    const cut = Math.round(base * rfloat(0.6, 1.4)); S.dirty += cut; S.stats.dirtyEarned += cut;
    O.respect = clamp(O.respect + rint(2, 6) + S.crimeSkill/25);
    addNoto(2); addStress(4);
    const next = DATA.orgRanks[O.rank + 1];
    if (next && O.respect >= next.respect && chance(0.45)){
      O.rank++; log(`🕶️ Subi na hierarquia de ${O.name}: agora sou ${next.name}.`, "milestone", ["crime"]); emit("promotion");
      if (isBoss()){ O.own = true; O.members = [makeCrewCandidate(), makeCrewCandidate(), makeCrewCandidate()]; O.ops = [{ id:"gambling", territory:pick(DATA.territories), years:0 }]; O.territories = [O.ops[0].territory]; log(`👑 O antigo chefe caiu. Assumi o comando de ${O.name}.`, "milestone"); achieve("kingpin","Chefe do crime organizado"); }
    }
    if (chance(0.25)) enqueue("ev_org_task");
    if (chance(0.04 + P().notoriety/600)) enqueue("ev_police_raid");
    return;
  }
  // chefe: receita das operações, folha dos capangas, calor, riscos
  const avgSkill = O.members.length ? O.members.reduce((a,m)=>a+m.skill,0)/O.members.length : 30;
  let gross = 0;
  for (const o of O.ops){ const d = byId(DATA.orgOps, o.id); o.years++; gross += priceOf(d.income) * (0.6 + avgSkill/140) * crisis * (O.remote ? 0.7 : 1) * rfloat(0.7, 1.3); O.heat += d.heat; }
  const payroll = O.members.reduce((a,m)=>a+m.cut,0);
  const net = Math.round(gross - payroll);
  S.dirty = Math.max(0, S.dirty + net); if (net > 0) S.stats.dirtyEarned += net;
  if (net < 0) for (const m of O.members) m.loyalty = clamp(m.loyalty - 10); // atraso na "parte" = revolta
  log(`🕶️ ${O.name}: ${fmt(Math.round(gross))} em operações, ${fmt(payroll)} para a equipe${net<0?" (rombo! a equipe ficou sem a parte)":""}.`, net<0?"bad":"", ["crime"]);
  O.heat = clamp(O.heat - 8 + O.members.length*0.5 + (O.remote ? 4 : 0));
  for (const m of O.members){ m.age++; m.loyalty = clamp(m.loyalty - rint(1,4) + (net > 0 ? 1 : 0)); m.skill = clamp(m.skill + rint(0,2)); }
  addStress(6 + O.ops.length*2); addNoto(O.ops.length);
  for (const r of O.rivals){ r.power = Math.round(r.power * rfloat(0.95, 1.15)); r.hostility = clamp(r.hostility + rint(-3, 8) + O.territories.length); }
  // riscos (cada um é um evento que pergunta ao jogador)
  if (chance(Math.max(0, (O.heat - 25) / 110))) enqueue("ev_police_raid");
  const traitor = O.members.find(m => m.loyalty < 30 && chance(0.25 + (personalityOfMember(m).snitch || 0)));
  if (traitor) enqueue("ev_betrayal", { uid:traitor.uid, nick:traitor.nick, name:traitor.name });
  const rival = O.rivals.find(r => r.hostility > 45 && chance(r.hostility/200));
  if (rival) enqueue("ev_rival_war", { name: rival.name, power: rival.power });
  if (O.ops.length && chance(0.15)) enqueue("ev_expansion");
}
