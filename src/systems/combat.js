"use strict";
/* =====================================================================
   systems/combat.js — motor de briga por turnos (lógica pura; a UI só
   chama fightAction e lê S.fight).

   Fluxo: startFight(kind, ctx) cria S.fight → o jogador escolhe uma ação
   por turno (golpe, defender, fugir, render-se, golpe para matar) → o
   oponente reage → ao fim, finishFight aplica TODAS as consequências
   (lesões, cartel, polícia, homicídio, vingança, submundo) e grava
   F.summary. A UI fecha com closeFight(), que libera S.fight.

   ---- LETALIDADE (golpe que encerra a luta) ----
     poder  = (0.60 + força·0.60) × (0.85 + maestria·0.50) × intensidade.dmg
     dano   = sorteio(golpe.dmg) × poder × 2.5 (× 1.8 se crítico)
     vuln   = 1 + idade(>45: +0.3 · >60: +0.8 · <16: +0.5) + (100−saúde do alvo)/150
     L      = golpe.lethal × poder × vuln × (crítico ? 2 : 1)
              × intensidade.lethal × (1 − maestria·0.7·intensidade.control)
              × (torneio ? 0.3 : 1)
     sorteio r: r < L → MORTE · r < 2.5L → COMA · r < 6L → LESÃO GRAVE · senão nocaute
   Ou seja: maestria aumenta o poder, mas também o CONTROLE — um faixa-preta
   no modo "Controlado" quase nunca mata; "Com tudo" anula o controle.
   ===================================================================== */
const FIGHT_MAX_ROUNDS = 12;
const DMG_SCALE = 2.5, OPP_DMG_SCALE = 2.3; // brigas decidem em ~4–8 trocas
const intensity = id => byId(DATA.intensities, id) || DATA.intensities[1];

function makeOpponent(kind, ctx){
  const pf = DATA.fightProfiles[kind], c = country();
  if (ctx.uid){ // alguém que você conhece
    const r = relBy(ctx.uid);
    if (r) return { uid:r.uid, first:r.first, last:r.last, gender:r.gender, age:r.age, personality:r.personality,
      str: clamp(rint(...pf.str) - Math.max(0, r.age-50)), skill: rint(...pf.skill), health: rint(55, 95), weapon:0, job:r.job };
  }
  const n = ctx.npc || (() => { const g = kind === "tournament" ? P().gender : (chance(0.8) ? "M" : "F"); const nm = genName(c, g);
    const age = kind === "tournament" ? rint(19, 34) : kind === "prison" ? rint(20, 55) : rint(17, 52);
    return { first:nm.first, last:nm.last, gender:g, age, personality: pick(DATA.personalities).id }; })();
  let skill = rint(...pf.skill), art = null;
  if (kind === "tournament"){ const t = byId(DATA.tournaments, ctx.tid); skill = rint(...t.skill); art = ctx.art; }
  const wIdx = weighted([0,1,2], k => pf.armed[k]);
  return { first:n.first, last:n.last || "", gender:n.gender || "M", age:n.age || rint(18,50), personality:n.personality || "hothead",
    str: rint(...pf.str), skill, health: rint(60, 100), weapon: wIdx, art, nick: n.nick };
}

function startFight(kind, ctx = {}){
  const me = fighterStats(), opp = makeOpponent(kind, ctx);
  opp.maxHp = opp.hp = Math.round(rint(...DATA.fightProfiles[kind].hp) * (0.5 + opp.health/400));
  opp.def = clamp(opp.skill * 0.65 + opp.health * 0.2);
  S.fight = { kind, ctx, opp, me:{ hp:me.hp, max:me.hp, sta:100 }, intensity: kind === "tournament" ? "normal" : "normal",
    round:0, lines:[], over:false, dealt:0, taken:0, result:null, oppOutcome:null, myOutcome:null, summary:"", intentKill:false, defending:false };
  const w = DATA.weapons[opp.weapon];
  S.fight.lines.push(kind === "tournament"
    ? `🔔 ${byId(DATA.tournaments, ctx.tid).name}: ${opp.first} ${opp.last} (${byId(DATA.martialArts, ctx.art).name}, habilidade ${opp.skill}).`
    : `${DATA.fightProfiles[kind].name}: ${opp.first}, ${opp.age} anos${opp.weapon ? `, armado(a) com ${w.name.toLowerCase()}` : ""}.`);
  emit("fightStart");
  return S.fight;
}
const fightOn = () => !!(S && S.fight && !S.fight.over);

/* ---------- Cálculos expostos à UI (mesma fórmula usada no sorteio) ---------- */
function moveMastery(mv){ return mv.art ? mastery(mv.art) : bestMastery() * 0.3; }
function movePower(mv, F = S.fight){
  const me = fighterStats(), I = intensity(F.intensity);
  return (0.6 + me.str/100*0.6) * (0.85 + moveMastery(mv)/100*0.5) * I.dmg * (F.me.sta < 15 ? 0.7 : 1);
}
function moveHit(mv, F = S.fight){
  const me = fighterStats();
  return clamp((mv.acc + (me.skill - F.opp.def)/160 + moveMastery(mv)/400 - (F.me.sta < 15 ? 0.15 : 0) + (F.opp.hp < F.opp.maxHp*0.3 ? 0.08 : 0)) * 100, 8, 95) / 100;
}
function targetVuln(o){ return 1 + (o.age > 60 ? 0.8 : o.age > 45 ? 0.3 : 0) + (o.age < 16 ? 0.5 : 0) + (100 - o.health)/150; }
function moveLethal(mv, crit = false, F = S.fight){
  const I = intensity(F.intensity), ctrl = 1 - moveMastery(mv)/100*0.7*I.control;
  return Math.min(0.95, mv.lethal * movePower(mv, F) * targetVuln(F.opp) * (crit ? 2 : 1) * I.lethal * ctrl * (F.kind === "tournament" ? 0.3 : 1));
}
function lethalLabel(L){ return L >= 0.25 ? ["extrema","bad"] : L >= 0.08 ? ["alta","bad"] : L >= 0.025 ? ["média","warn"] : ["baixa","good"]; }
/* "Golpe para matar": só fora do ringue e quando o contexto permite. */
function canKill(F = S.fight){
  const k = DATA.fightProfiles[F.kind].kill;
  if (k === "no") return false;
  if (k === "yes") return true;
  return F.opp.hp <= F.opp.maxHp * 0.45; // briga comum / legítima defesa: só com o oponente já caído
}
function killOdds(F = S.fight){
  const me = fighterStats(), down = F.opp.hp <= F.opp.maxHp * 0.4;
  return { hit: clamp((0.42 + me.skill/250 + (down ? 0.3 : 0)) * 100, 10, 95) / 100,
           death: clamp((0.3 + bestMastery()/250 + me.str/400 + (down ? 0.25 : 0)) * targetVuln(F.opp) * 100, 10, 95) / 100 };
}
function fightActions(F = S.fight){
  const tour = F.kind === "tournament";
  const moves = knownMoves(tour ? { tournamentArt: F.ctx.art } : {});
  return { moves, kill: !tour && canKill(F), flee: !tour, surrender: true };
}

/* Brigas iniciadas pelo jogador (você é o agressor). */
function provokeStranger(){
  if (inPrison()) return R(false, "Você está preso(a).");
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  startFight("provoke", {}); return R(true, "Esbarrei de propósito no primeiro marrento que vi.");
}
function provokeRel(u){
  const r = relBy(u); if (!r || !r.alive) return R(false, "Não dá.");
  if (inPrison()) return R(false, "Você está preso(a).");
  if (!spendEnergy()) return R(false, "Sem energia este ano.");
  startFight("provoke", { uid:u }); return R(true, `Parti pra cima de ${r.first}.`);
}

/* ---------- Turno ---------- */
function fightAction(act){
  const F = S.fight; if (!F || F.over) return;
  F.round++; F.defending = false;
  const o = F.opp, L = F.lines; let stunned = false;
  if (act === "defend"){ F.defending = true; F.me.sta = Math.min(100, F.me.sta + 28); L.push("🛡️ Fechei a guarda e recuperei o fôlego."); }
  else if (act === "flee"){
    const p = clamp(0.35 + P().stats.health/300 + (o.hp < o.maxHp*0.5 ? 0.15 : 0) - (o.weapon === 2 ? 0.15 : 0), 0.1, 0.85);
    if (chance(p)){ L.push("🏃 Consegui escapar correndo!"); return endFight("fled"); }
    L.push("🏃 Tentei fugir, mas fui alcançado(a)!");
  }
  else if (act === "surrender"){
    L.push(F.kind === "tournament" ? "🏳️ Bati três vezes. Desisti da luta." : "🏳️ Levantei as mãos e pedi para parar.");
    return endFight("surrender");
  }
  else if (act === "kill"){
    if (!canKill(F)) return;
    const k = killOdds(F); F.me.sta = Math.max(0, F.me.sta - 25);
    if (chance(k.hit)){
      F.intentKill = true;
      const r = rand(); o.hp = 0;
      F.oppOutcome = r < k.death ? "death" : r < k.death + (1-k.death)*0.6 ? "coma" : "grave";
      L.push(F.oppOutcome === "death" ? `☠️ Golpe final. ${o.first} não se levanta mais.` : `☠️ Golpe brutal. ${o.first} ficou ${F.oppOutcome === "coma" ? "em coma" : "gravemente ferido(a)"}, mas sobreviveu.`);
      return endFight("win");
    }
    L.push(`☠️ Tentei acabar com ${o.first}, mas errei — e abri a guarda.`); stunned = true;
  }
  else {
    const mv = byId(DATA.moves, act) || weaponMoves().find(m => m.id === act); if (!mv) return;
    if (mv.weapon) F.usedWeapon = mv.weapon; // perícia: arma registrada em seu nome pesa
    F.me.sta = Math.max(0, F.me.sta - mv.cost);
    if (chance(moveHit(mv))){
      const crit = chance(0.06 + moveMastery(mv)/100*0.12 + mv.ko*0.4);
      const dmg = Math.round(rint(...mv.dmg) * movePower(mv) * DMG_SCALE * (crit ? 1.8 : 1));
      o.hp -= dmg; F.dealt += dmg;
      L.push(`${crit ? "💥 CRÍTICO! " : "👊 "}${mv.name}: ${dmg} de dano.`);
      emit("hit");
      // finalização (chave/estrangulamento) ou nocaute
      const lowK = 1 - Math.max(0, o.hp)/o.maxHp * 0.6;
      if (mv.type === "sub" && o.hp > 0 && chance(mv.ko * lowK * (0.8 + moveMastery(mv)/200))){
        if (F.intensity === "all"){ o.hp = 0; } // não soltou quando o outro bateu
        else { F.oppOutcome = "sub"; L.push(`🤚 ${o.first} bateu! Finalização com ${mv.name}.`); return endFight("win"); }
      }
      if (o.hp > 0 && chance(mv.ko * movePower(mv) * (crit ? 2 : 1) * lowK * 0.6)){ o.hp = 0; L.push(`😵 ${o.first} apagou na hora!`); }
      if (o.hp <= 0){
        const Lt = moveLethal(mv, crit), r = rand();
        F.oppOutcome = r < Lt ? "death" : r < Lt*2.5 ? "coma" : r < Lt*6 ? "grave" : "ko";
        L.push({ death:`☠️ ${o.first} caiu e não respira mais.`, coma:`🚑 ${o.first} entrou em coma.`, grave:`🩸 ${o.first} ficou gravemente ferido(a).`, ko:`💤 Nocaute! ${o.first} está no chão.` }[F.oppOutcome]);
        return endFight("win");
      }
    } else { L.push(`💨 ${mv.name} — errei.`); emit("miss"); }
  }
  oppTurn(F, stunned);
  if (!F.over && F.round >= FIGHT_MAX_ROUNDS){ L.push(F.kind === "tournament" ? "🔔 Fim do tempo regulamentar." : "👮 Gente separou a briga."); endFight("draw"); }
}

function oppTurn(F, freeHit){
  const o = F.opp, me = fighterStats(), L = F.lines, w = DATA.weapons[o.weapon];
  // oponente machucado e sem sangue no olho pode fugir
  if (F.kind !== "tournament" && o.hp < o.maxHp*0.22 && ["calm","shy","funny","generous"].includes(o.personality) && chance(0.4)){ L.push(`🏃 ${o.first} desistiu e saiu correndo.`); F.oppOutcome = "fled"; return endFight("win"); }
  const hit = clamp(0.5 + (o.skill - me.def)/160 - (F.defending ? 0.3 : 0) + (freeHit ? 0.35 : 0), 0.08, 0.92);
  if (!chance(hit)){ L.push(`↪️ Esquivei ${pick(["do golpe","do ataque","por pouco"])}.`); return; }
  let dmg = rint(4, 10) * OPP_DMG_SCALE * (0.6 + o.str/100*0.7) * (F.kind === "tournament" ? 0.8 + o.skill/150 : 1) * w.mult * (F.defending ? 0.5 : 1) * (freeHit ? 1.5 : 1);
  dmg = Math.round(dmg); F.me.hp -= dmg; F.taken += dmg;
  L.push(`🤕 ${o.first} acertou ${o.weapon ? (o.weapon === 2 ? "um tiro de raspão" : "uma facada") : pick(DATA.oppAttacks)}: −${dmg}.`);
  emit("hurt");
  if (F.me.hp <= 0){
    const Lme = 0.012 * w.lethal * (["prison","rival","revenge","hit"].includes(F.kind) ? 2 : 1) * (P().age > 60 ? 1.8 : 1) * (F.kind === "tournament" ? 0.3 : 1);
    const r = rand();
    F.myOutcome = r < Lme ? "death" : r < Lme*3 ? "coma" : "ko";
    L.push({ death:"⚰️ Tudo ficou escuro…", coma:"🚑 Apaguei e acordei no hospital dias depois.", ko:"😵 Fui nocauteado(a)." }[F.myOutcome]);
    endFight("lose");
  }
}

/* ---------- Fim da luta: consequências ---------- */
function endFight(result){
  const F = S.fight; F.over = true; F.result = result;
  if (F.kind === "tournament") tournamentAfter(F);
  const o = F.opp, name = `${o.first}${o.last ? " " + o.last : ""}`;
  S.stats.fights = num(S.stats.fights) + 1; if (F.result === "win") S.stats.fightsWon = num(S.stats.fightsWon) + 1;
  // lesões do jogador
  const dmgTaken = Math.max(0, F.taken);
  let s = { win:`Venci a briga contra ${name}.`, lose:`Perdi a briga para ${name}.`, draw:`A briga com ${name} terminou empatada.`, fled:"Fugi da briga.", surrender:"Me rendi." }[F.result];
  if (F.kind === "tournament") s = F.result === "win" ? `Vitória sobre ${name}!` : `Derrota para ${name}.`;
  if (dmgTaken > 0) s += injure(Math.round(dmgTaken * 0.4), F.kind === "tournament" ? "Uma luta oficial" : "Uma briga", 0.2);
  if (F.myOutcome === "coma"){ s += injure(rint(18, 30), "O coma após a briga", 0.6); const bill = priceOf(rint(2000, 8000)) * (1 - effectivePlan().coverage); addMoney(-Math.round(bill)); s += ` Conta do hospital: ${fmt(Math.round(bill))}.`; }
  if (F.myOutcome === "death") S.flags.forcedDeath = F.kind === "tournament" ? "lesão cerebral em uma luta oficial" : `ferimentos em uma briga com ${name}`;
  F.summary = s + (F.summary ? " " + F.summary : "");
  (FIGHT_AFTER[F.kind] || (()=>{}))(F);
  if (F.oppOutcome === "death" && F.kind !== "hunt") registerKill(F); // caçadas usam o modelo de suspeita do lado sombrio
  else if (["grave","coma"].includes(F.oppOutcome) && F.kind !== "tournament") assaultCharge(F);
  if (F.kind !== "tournament") log(`🥊 ${F.summary}`, F.result === "win" && F.oppOutcome !== "death" ? "" : "bad");
  emit(F.result === "win" ? "fightWin" : "fightLose");
  sanitize();
}

/* Efeitos específicos por contexto. */
const FIGHT_AFTER = {
  street(F){ if (F.result === "win"){ addNoto(3); addStat("happiness", 3); F.summary += " A adrenalina demorou a passar."; } else if (F.result === "lose") addStat("happiness", -4); else if (F.result === "surrender") addStat("happiness", -3); },
  provoke(F){
    P().karma = clamp(P().karma - 5); addNoto(4);
    const r = F.ctx.uid && relBy(F.ctx.uid);
    if (r){ r.rel = clamp(r.rel - 40); r.respect = clamp(num(r.respect) + (F.result === "win" ? 5 : -10)); remember_npc(r, F.result === "win" ? "Apanhou de você numa briga" : "Brigou com você e venceu"); if (r.role === "friend" && r.rel < 15){ r.role = "acquaintance"; F.summary += ` ${r.first} cortou relações.`; } }
  },
  robbery(F){
    if (F.result === "win"){ addFame(2); addStat("happiness", 6); F.summary += " Desarmei o assaltante e ainda virei notícia."; }
    else if (F.result !== "fled"){ addMoney(-num(F.ctx.amt)); F.summary += ` Levaram ${fmt(num(F.ctx.amt))}.`; }
  },
  prison(F){
    if (!S.prison) return;
    S.prison.foughtAge = P().age; // briga no ano corta a remição pela metade
    if (F.result === "win") S.prison.intim = clamp(num(S.prison.intim) + 6);
    if (F.result === "win"){ addNoto(4); addStat("happiness", 2); F.summary += " Ganhei respeito no pavilhão."; }
    else if (F.result === "lose" || F.result === "surrender"){ addStat("happiness", -5); F.summary += " Agora sou alvo fácil no pavilhão."; }
    if (F.ctx.provoked && chance(0.35)){ S.prison.years++; F.summary += " A direção me mandou para a solitária: +1 ano."; }
  },
  rival(F){
    if (!S.org) return;
    const rv = S.org.rivals.find(r => r.name === F.ctx.rival);
    S.org.heat = clamp(S.org.heat + 12);
    if (F.result === "win"){ S.org.respect = clamp(S.org.respect + 12); if (rv){ rv.power = Math.round(rv.power * (F.oppOutcome === "death" ? 0.25 : 0.6)); rv.hostility = F.oppOutcome === "death" ? 90 : 40; }
      if (F.oppOutcome === "death" || F.oppOutcome === "coma"){ const t = DATA.territories.find(t => !S.org.territories.includes(t)); if (t){ S.org.territories.push(t); F.summary += ` Tomamos ${t}.`; } } }
    else { S.org.respect = clamp(S.org.respect - 15); if (S.org.territories.length > 1){ S.org.territories.pop(); F.summary += " Perdemos território."; } }
  },
  hit(F){
    if (F.oppOutcome === "death"){ const pay = num(F.ctx.pay); S.dirty += pay; S.stats.dirtyEarned += pay; S.crimeSkill = clamp(S.crimeSkill + 6); F.summary += ` Contrato cumprido: ${fmt(pay)} em dinheiro sujo.`; if (S.org) S.org.respect = clamp(S.org.respect + 15); }
    else { if (S.org){ S.org.respect = clamp(S.org.respect - 10); S.org.heat = clamp(S.org.heat + 15); } F.summary += " O alvo sobreviveu: sem pagamento, e agora ele sabe quem você é."; if (F.result === "win" && F.oppOutcome !== "fled") schedule("victimRevenge", rint(1, 3), { name:`${F.opp.first} ${F.opp.last}`, kin:"o próprio alvo" }, "O alvo do contrato sobreviveu e quer vingança."); }
  },
  revenge(F){ if (F.result === "win") F.summary += " Encerrei essa história — por enquanto."; else addStat("happiness", -6); },
  tournament(F){ if (F.oppOutcome === "death") martial().banUntil = P().age + 2; },
  hunt(F){ huntFightAfter(F); },
};

/* Lesão grave / coma fora do ringue: lesão corporal grave. */
function assaultCharge(F){
  if (F.kind === "prison"){ if (S.prison) S.prison.years += 2; F.summary += " Lesão grave na cadeia: +2 anos de pena."; return; }
  const selfDef = F.kind === "robbery" && F.intensity !== "all" && !F.intentKill;
  addNoto(8); P().karma = clamp(P().karma - (selfDef ? 2 : 10));
  if (selfDef){ F.summary += " A polícia registrou como legítima defesa."; return; }
  if (P().age >= 18 && chance(0.3 + (F.kind === "street" ? 0.1 : 0))){
    const y = rint(1, 4); sendToPrison(y, "lesão corporal grave"); F.summary += ` Fui preso(a) por lesão corporal grave (${y} ano(s)).`;
  } else F.summary += " Ninguém me denunciou… ainda.";
}

/* ---------- HOMICÍDIO: investigação, testemunhas, pena, trauma, vingança ---------- */
function registerKill(F){
  const o = F.opp, name = `${o.first}${o.last ? " " + o.last : ""}`, M = martial();
  const intentional = F.intentKill || F.kind === "hit";
  const selfDefense = ["robbery","revenge"].includes(F.kind) || (F.kind === "prison" && F.ctx.attacked);
  const excess = F.intensity === "all";
  M.kills++; S.stats.kills = num(S.stats.kills) + 1;
  // impacto psicológico (matar sem querer pesa mais)
  addStat("happiness", -(intentional ? 14 : 26)); addStress(intentional ? 18 : 30); P().karma = clamp(P().karma - (intentional ? 35 : selfDefense ? 10 : 20));
  remember(`Matei ${name}${intentional ? "" : " sem querer"}. Isso nunca vai sair da minha cabeça.`, "bad");
  log(`☠️ ${name}, ${o.age} anos, morreu após ${F.kind === "tournament" ? "a luta" : "a briga"} comigo.`, "bad", ["crime"]);
  // submundo: reputação temida
  addNoto(intentional ? 35 : 18);
  if (S.org) S.org.respect = clamp(S.org.respect + (intentional ? 20 : 10));
  if (M.kills >= 3) achieve("feared", "Temido(a) no submundo");
  // vítima conhecida
  const r = o.uid && relBy(o.uid);
  if (r){ r.alive = false; r.deathAge = r.age; for (const x of S.rels) if (x.alive && x !== r) x.rel = clamp(x.rel - 12); const pt = partner(); if (pt && chance(0.5)){ pt.rel = clamp(pt.rel - 40); } }
  // ringue: quase sempre acidente esportivo
  if (F.kind === "tournament"){
    F.next = null; M.banUntil = P().age + 2; addFame(-4);
    if (chance(0.25)){ const y = rint(1, 4); sendToPrison(y, "homicídio culposo em luta", "mínima"); F.summary += ` A perícia apontou negligência: ${y} ano(s) por homicídio culposo.`; }
    else F.summary += " A perícia concluiu: acidente esportivo. Fui suspenso(a) por 2 anos e não durmo direito desde então.";
    return;
  }
  // tipificação e pena
  const pen = DATA.penal[P().country] || { max:40, life:false };
  let label, years;
  if (intentional){ label = "homicídio qualificado"; years = rint(20, pen.max); if (pen.life && chance(0.4)) years = 99; }
  else if (selfDefense && !excess){ label = "legítima defesa"; years = 0; }
  else if (selfDefense){ label = "excesso de legítima defesa"; years = rint(2, 6); }
  else if (excess){ label = "homicídio doloso"; years = rint(12, Math.min(25, pen.max)); }
  else { label = "lesão corporal seguida de morte"; years = rint(4, 12); }
  const wit = { street:rint(1,6), provoke:rint(1,5), robbery:rint(0,3), prison:rint(2,8), rival:rint(0,3), hit:rint(0,2), revenge:rint(0,4) }[F.kind] ?? 2;
  const gun = F.usedWeapon && arsenal().find(w => w.id === F.usedWeapon), gunTrace = gun ? byId(DATA.armory, gun.id).trace * (gun.registered ? 0.35 : 0.12) : 0;
  const pCaught = clamp((0.2 + wit*0.1 + gunTrace + (S.record.length ? 0.1 : 0) - num(S.crimeSkill)/300 - (S.org ? orgPower()/500 : 0) + (F.kind === "prison" ? 0.6 : 0)) * 100, 5, 95) / 100;
  F.summary += ` ${wit ? `${wit} testemunha(s) viram tudo.` : "Ninguém viu."}`;
  if (F.kind === "prison" && S.prison){
    if (years > 0 && chance(pCaught)){ S.prison.years = Math.min(99, S.prison.years + years); S.prison.security = "máxima"; S.record.push({ crime:label, age:P().age, years }); F.summary += ` Condenado(a) por ${label}: +${years >= 99 ? "perpétua" : years + " anos"}. Transferido(a) para segurança máxima.`; }
    else F.summary += " Ninguém abriu a boca. No pavilhão, agora todo mundo me teme.";
  }
  else if (years === 0){
    if (chance(0.85)){ F.summary += " O inquérito concluiu legítima defesa. Não fui indiciado(a)."; log("⚖️ Morte registrada como legítima defesa.", ""); }
    else { const y = rint(1, 3); sendToPrison(y, "excesso de legítima defesa"); F.summary += ` O júri viu excesso: ${y} ano(s).`; }
  }
  else if (P().age >= 12 && chance(pCaught * 0.55)){
    sendToPrison(years, label, years >= 12 ? "máxima" : "média");
    F.summary += ` Fui preso(a) em flagrante por ${label}: ${years >= 99 ? "PRISÃO PERPÉTUA" : years + " anos"}.`;
  } else {
    schedule("homicideCase", rint(1, 3), { name, label, years, p: pCaught }, `A polícia investiga a morte de ${name}.`);
    F.summary += " Saí antes da polícia chegar. Mas a investigação vai começar.";
  }
  if (S.dark && !S.dark.active && P().age >= 18 && chance(0.4)) enqueue("ev_dark_awakening");
  // família / aliados da vítima
  if (chance(F.kind === "rival" ? 0.8 : 0.45)) schedule("victimRevenge", rint(1, 5), { name, kin: F.kind === "rival" ? "a facção dele" : pick(["o irmão","o primo","o filho","a irmã","o melhor amigo"]) }, `A família de ${name} não vai esquecer.`);
}

/* Fecha a luta (UI chama após o jogador ler o resumo). Torneio pode encadear. */
function closeFight(){
  const F = S.fight; if (!F) return null;
  const out = F.summary; S.fight = null;
  if (F.next && P().alive && !inPrison()) startFight("tournament", F.next);
  else if (S.flags.forcedDeath){ const c = S.flags.forcedDeath; delete S.flags.forcedDeath; die(c); }
  return out;
}
/* Resolução automática (selftest, save recarregado no meio da briga, bots). */
function autoFight(maxSteps = 40){
  let g = 0;
  while (S.fight && g++ < maxSteps){
    const F = S.fight;
    if (F.over){ closeFight(); continue; }
    const acts = fightActions(F), mv = acts.moves.length ? pick(acts.moves) : null;
    F.intensity = pick(DATA.intensities).id;
    if (F.me.hp < F.me.max*0.25 && acts.flee && chance(0.5)) fightAction("flee");
    else if (acts.kill && chance(0.15)) fightAction("kill");
    else if (F.me.sta < 15 || !mv) fightAction("defend");
    else fightAction(mv.id);
  }
  if (S.fight){ S.fight.over = true; closeFight(); }
}

/* Consequências agendadas de mortes (registradas em CONSEQ). */
Object.assign(CONSEQ, {
  homicideCase(ctx){
    if (!P().alive) return;
    if (inPrison()){ if (chance(ctx.p * 0.5)){ S.prison.years = Math.min(99, S.prison.years + ctx.years); S.record.push({ crime:ctx.label, age:P().age, years:ctx.years }); return out(`Fui condenado(a) também pela morte de ${ctx.name}: +${ctx.years} anos.`, "bad"); } return; }
    if (!chance(0.35 + ctx.p * 0.6)) return out(`A investigação da morte de ${ctx.name} não chegou até mim.`, "good");
    enqueue("ev_murder_probe", ctx);
    return out(`A polícia chegou até mim pela morte de ${ctx.name}.`, "bad");
  },
  victimRevenge(ctx){
    if (!P().alive) return;
    if (inPrison()){ enqueue("ev_prison_fight"); return out(`Gente ligada a ${ctx.name} chegou ao meu pavilhão.`, "bad"); }
    enqueue("ev_revenge", ctx);
    return out(`${ctx.kin[0].toUpperCase() + ctx.kin.slice(1)} de ${ctx.name} veio atrás de mim.`, "bad");
  },
});
