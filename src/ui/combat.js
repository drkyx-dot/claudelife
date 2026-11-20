"use strict";
/* =====================================================================
   ui/combat.js — modal de combate (arena, golpes, intensidade, log),
   painel de artes marciais, torneios e lista de golpes.
   A lógica fica em systems/combat.js e systems/martial.js.
   ===================================================================== */
function fbar(cur, max, cls, label){
  const v = clamp(cur / Math.max(1, max) * 100);
  return `<div class="fbar ${cls}" title="${label}"><i style="width:${v}%"></i><span>${label} ${Math.max(0, Math.round(cur))}/${Math.round(max)}</span></div>`;
}
function oppAvatar(o){ return o.age >= 60 ? (o.gender === "F" ? "👵" : "👴") : o.gender === "F" ? "👩" : "🧔"; }

function renderFight(hitWho){
  const F = S.fight, o = F.opp, me = fighterStats(), pf = DATA.fightProfiles[F.kind], tour = F.kind === "tournament";
  const per = byId(DATA.personalities, o.personality), w = DATA.weapons[o.weapon];
  const title = tour ? `${byId(DATA.tournaments, F.ctx.tid).emoji} ${byId(DATA.tournaments, F.ctx.tid).name}` : `🥊 ${pf.name}`;
  let h = `<div class="fight ${hitWho ? "hit-" + hitWho : ""}">
    <div class="fight-head"><h3>${esc(title)}</h3>${chip(F.over ? "Fim" : `Round ${F.round + 1}/${FIGHT_MAX_ROUNDS}`, "neutral")}${tour ? chip(`Luta ${F.ctx.idx + 1}/${byId(DATA.tournaments, F.ctx.tid).fights}`, "neutral") : ""}</div>
    <div class="arena">
      <div class="fighter me"><div class="f-av">${avatar()}</div><div class="f-name">${esc(P().first)} <span class="muted s">(você)</span></div>
        ${fbar(F.me.hp, F.me.max, "hp", "❤️")}${fbar(F.me.sta, 100, "sta", "⚡")}
        <div class="f-tags">${chip(`💪 ${Math.round(me.str)}`, "neutral")}${chip(`🎯 ${Math.round(me.skill)}`, "neutral")}${bestArt() ? chip(`${byId(DATA.martialArts, bestArt()).emoji} ${rankName(bestArt())}`, "neutral") : ""}</div></div>
      <div class="vs">VS</div>
      <div class="fighter opp"><div class="f-av">${oppAvatar(o)}</div><div class="f-name">${esc(o.first)}${o.nick ? ` <span class="muted s">"${esc(o.nick)}"</span>` : ""} <span class="muted s">${o.age}a</span></div>
        ${fbar(o.hp, o.maxHp, "hp", "❤️")}
        <div class="f-tags">${chip(`💪 ${o.str}`, "neutral")}${chip(`🎯 ${o.skill}`, "neutral")}${chip(`🩺 ${o.health}`, "neutral")}${per ? chip(`🧠 ${per.name}`, "neutral") : ""}${o.weapon ? chip(w.name, "bad") : ""}${o.art ? chip(byId(DATA.martialArts, o.art).name, "neutral") : ""}</div></div>
    </div>
    <div class="flog">${F.lines.slice(-5).map((l, i, a) => `<div class="${i === a.length - 1 ? "new" : ""}">${esc(say(l))}</div>`).join("")}</div>`;
  if (F.over){
    const icon = F.oppOutcome === "death" ? "☠️" : F.myOutcome === "death" ? "⚰️" : F.result === "win" ? "🏆" : F.result === "fled" ? "🏃" : F.result === "draw" ? "🤝" : "🤕";
    h += `<div class="fight-end"><div class="emoji">${icon}</div><div class="result">${esc(say(F.summary))}</div>
      <div class="choices"><button class="primary" onclick="UI.fightDone()">${F.next ? "Próxima luta →" : "Continuar"}</button></div></div></div>`;
    return h;
  }
  const acts = fightActions(F);
  h += `<div class="seg" role="radiogroup" aria-label="Intensidade">${DATA.intensities.map(I => `<button role="radio" aria-checked="${F.intensity === I.id}" class="${F.intensity === I.id ? "on" : ""}" title="${esc(I.hint)}" onclick="UI.fightIntensity('${I.id}')">${I.name}</button>`).join("")}</div>
    <div class="oddsline">${esc(intensity(F.intensity).hint)}${tour ? " · árbitro presente (letalidade ×0,3)" : ""}</div>
    <div class="moves">${acts.moves.map(mv => {
      const pw = movePower(mv), L = moveLethal(mv), [ll, lc] = lethalLabel(L), dis = F.me.sta < mv.cost;
      return `<button class="mv ${mv.art ? "special" : ""}" ${dis ? "disabled" : ""} onclick="UI.fightAct('${mv.id}')"><b>${mv.art ? byId(DATA.martialArts, mv.art).emoji + " " : ""}${esc(mv.name)}</b>
        <span>${Math.round(moveHit(mv) * 100)}% acerto · ${Math.round(mv.dmg[0] * pw * DMG_SCALE)}–${Math.round(mv.dmg[1] * pw * DMG_SCALE)} dano · ⚡${mv.cost}</span>
        <span>KO ${Math.round(mv.ko * 100)}% · letalidade <b class="${lc}">${ll} (${(L * 100).toFixed(L < 0.1 ? 1 : 0)}%)</b></span></button>`; }).join("")}</div>
    <div class="moves util">
      <button class="mv" onclick="UI.fightAct('defend')"><b>🛡️ Defender</b><span>−50% de dano, +28 de fôlego</span></button>
      ${acts.flee ? `<button class="mv" onclick="UI.fightAct('flee')"><b>🏃 Fugir</b><span>se falhar, apanha</span></button>` : ""}
      <button class="mv" onclick="UI.fightAct('surrender')"><b>🏳️ ${tour ? "Desistir (bater)" : "Render-se"}</b><span>${F.kind === "robbery" ? "entrega o dinheiro" : "encerra sem mortes"}</span></button>
      ${acts.kill ? (() => { const k = killOdds(F); return `<button class="mv kill" onclick="UI.confirm('Desferir um golpe para MATAR ${esc(o.first)}? Homicídio doloso: investigação, testemunhas e pena longa.', ()=>UI.fightAct('kill'))"><b>☠️ Golpe para matar</b><span>${Math.round(k.hit * 100)}% acerto · ${Math.round(k.death * 100)}% de morte</span></button>`; })() : ""}
    </div></div>`;
  return h;
}

/* Painel de artes marciais (aba Ações e Academia de Lutas). */
function martialPanel(){
  const M = martial(), a = P().age, energy = ACT_LIMIT - S.activitiesThisYear;
  let h = `<div class="chips" style="margin-bottom:8px">${chip(`🥊 Cartel ${M.rec.w}V–${M.rec.l}D · ${M.rec.ko} nocautes`, "neutral")}${M.titles.length ? chip(`🏆 ${M.titles.length} título(s)`, "good") : ""}${M.kills ? chip(`☠️ ${M.kills} morte(s)`, "bad") : ""}${num(M.banUntil) > a ? chip(`🚫 suspenso(a) até ${M.banUntil} anos`, "bad") : ""}</div>`;
  for (const d of DATA.martialArts){
    const m = mastery(d.id), on = M.enrolled.includes(d.id), nx = nextUnlock(d.id), locked = a < d.minAge;
    if (locked && !m) continue;
    h += `<div class="row art"><div class="grow"><div class="t">${d.emoji} ${d.name} ${on ? chip("treinando", "good") : ""} <span class="muted s">${m ? d.ranks[rankIdx(m)] : ""}</span></div>
      <div class="s">${esc(d.desc)} · ${fmt(artFee(d.id))}/mês${nx ? ` · próximo golpe: <b>${esc(nx.name)}</b> (${nx.req})` : " · todos os golpes aprendidos"}</div>
      ${m ? bar("Maestria", m, "var(--accent)") : ""}</div>
      <div class="art-btns">${on ? `<button class="btn sm" ${energy <= 0 ? "disabled" : ""} onclick="UI.do(()=>trainArt('${d.id}'))">Treinar</button><button class="btn sm" ${energy <= 0 ? "disabled" : ""} onclick="UI.do(()=>trainArt('${d.id}',true))">Intenso</button><button class="btn sm" onclick="UI.do(()=>quitArt('${d.id}'))">Sair</button>`
        : `<button class="btn sm primary" ${inPrison() ? "disabled" : ""} onclick="UI.do(()=>enrollArt('${d.id}'))">Matricular</button>`}</div></div>`;
  }
  h += `<div class="choices" style="margin-top:10px"><button onclick="UI.tournaments()">🏆 Torneios e campeonatos</button><button onclick="UI.moveList()">📜 Golpes que eu sei (${knownMoves().length})</button>
    ${a >= 14 && !inPrison() ? `<button ${energy <= 0 ? "disabled" : ""} onclick="UI.do(provokeStranger)">👊 Procurar briga na rua<small>você é o agressor: karma e polícia</small></button>` : ""}</div>`;
  return h;
}
Object.assign(UI, {
  fightOpen(hitWho){ if (!S.fight) return; modal(renderFight(hitWho), { locked:true }); },
  fightIntensity(id){ if (!S.fight) return; S.fight.intensity = id; UI.fightOpen(); },
  fightAct(a){
    const F = S.fight; if (!F || F.over) return;
    if (typeof Device !== "undefined" && !Device.guard(220)) return;
    const hp0 = F.opp.hp, me0 = F.me.hp;
    fightAction(a); saveGame(true);
    if (!S.fight) return UI.fightDone();
    const who = F.me.hp < me0 ? "me" : F.opp.hp < hp0 ? "opp" : "";
    UI.fightOpen(who);
  },
  fightDone(){
    if (typeof Device !== "undefined" && !Device.guard()) return;
    const before = UI._mgBefore || takeSnapshot();
    const res = closeFight(); sanitize(); saveGame(true); render();
    if (!P().alive){ modal(`<div class="emoji">🕊️</div><h3>Fim da jornada</h3><div class="result">${esc(res || "")}</div><div class="choices"><button class="primary" onclick="UI.close();UI.tab('life')">Ver certidão</button></div>`); return; }
    if (S.fight) return UI.fightOpen(); // próxima luta do torneio
    UI._mgBefore = null; showResult(res || "A luta acabou.", before);
  },
  martial(){ modal(`<div class="emoji">🥋</div><h3>Academia de Lutas</h3><p class="muted">Energia ${ACT_LIMIT - S.activitiesThisYear}/${ACT_LIMIT} · até ${MAX_ENROLL} modalidades ao mesmo tempo. Treino intenso rende quase o dobro, mas machuca.</p>${martialPanel()}<div class="choices" style="margin-top:8px"><button onclick="UI.close()">Sair</button></div>`); },
  tournaments(){
    const arts = Object.keys(martial().arts).filter(id => mastery(id) > 0);
    modal(`<div class="emoji">🏆</div><h3>Torneios</h3><p class="muted">Cartel ${martial().rec.w}V–${martial().rec.l}D. Cada luta é jogada no modal de combate; empate vai para os juízes.</p>
      ${DATA.tournaments.map(t => `<div class="card flat"><div class="t">${t.emoji} ${t.name}</div><div class="s muted">${t.fights} luta(s) · maestria ${t.minM}+${t.minWins ? ` · ${t.minWins}+ vitórias` : ""} · inscrição ${t.fee ? fmt(priceOf(t.fee)) : "grátis"} · prêmio ${fmt(priceOf(t.prize[0]), true)}–${fmt(priceOf(t.prize[1]), true)} · fama +${t.fame}</div>
        <div class="choices" style="margin-top:6px">${arts.length ? arts.map(id => { const why = tournamentBlock(t, id), d = byId(DATA.martialArts, id); return `<button ${why ? "disabled" : ""} onclick="UI.close();UI.do(()=>enterTournament('${t.id}','${id}'))">${d.emoji} Lutar de ${d.name} (${Math.round(mastery(id))})${why ? `<small class="bad">${esc(why)}</small>` : ""}</button>`; }).join("") : `<div class="empty">Treine alguma modalidade primeiro.</div>`}</div></div>`).join("")}
      <div class="choices"><button onclick="UI.close()">Fechar</button></div>`);
  },
  moveList(){
    const ms = knownMoves();
    modal(`<h3>📜 Golpes conhecidos</h3><div class="oddsline">Letalidade base = índice do golpe. A letalidade real depende de força, maestria, intensidade e da vulnerabilidade do alvo.</div>
      ${ms.map(mv => `<div class="row"><div class="grow"><div class="t">${mv.art ? byId(DATA.martialArts, mv.art).emoji : "👊"} ${esc(mv.name)}${mv.dirty ? ` <span class="tag bad">sujo</span>` : ""}</div><div class="s">dano ${mv.dmg[0]}–${mv.dmg[1]} · acerto ${Math.round(mv.acc * 100)}% · KO ${Math.round(mv.ko * 100)}% · letalidade ${(mv.lethal * 100).toFixed(1)} · ${({ strike:"golpe", throw:"projeção", sub:"finalização" })[mv.type]}</div></div></div>`).join("")}
      ${DATA.moves.filter(mv => mv.art && !ms.includes(mv)).length ? `<div class="section-label">Ainda bloqueados</div>${DATA.moves.filter(mv => mv.art && !ms.includes(mv)).map(mv => `<div class="row"><div class="grow s muted">🔒 ${esc(mv.name)} — ${byId(DATA.martialArts, mv.art).name} ${mv.req}</div></div>`).join("")}` : ""}
      <div class="choices" style="margin-top:10px"><button onclick="UI.close()">Fechar</button></div>`);
  },
});
