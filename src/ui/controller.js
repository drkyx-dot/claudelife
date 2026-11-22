"use strict";
/* ui/controller.js */

const UI = {
  tab(k){ if (k !== TAB) TAB_CHANGED = true; TAB = k; try{ localStorage.setItem("claudilife.tab", k); }catch(e){} render(); pageTop(true); },
  logFilter(k){ LOGFILTER = k; render(); }, logAll(){ LOGALL = true; render(); },
  /* busca: re-renderiza só a lista (mantém o foco no campo) */
  logSearch(v){ LOGQUERY = v.trim(); clearTimeout(UI._ls); UI._ls = setTimeout(()=>{ const el = $("#logbody"); if (el) el.innerHTML = renderLog(); }, 120); },
  close: closeModal,
  ageUp(){
    if (typeof Device !== "undefined" && !Device.guard(450)) return; // toque duplo não envelhece 2 anos
    if (S.fight) return UI.fightOpen();
    if (S.escape) return UI.escapeOpen();
    if (S.queue.length) return showEvent();
    const before = takeSnapshot();
    ageUp(); LOGALL = false;
    saveGame(true); render();
    Sound.play("year"); floatDiff(before, takeSnapshot());
    if (!P().alive){ closeModal(); pageTop(); toast(`${P().first} faleceu aos ${P().age} anos.`); return; }
    yearBadge();
    if (S.escape){ UI._mgBefore = before; return setTimeout(UI.escapeOpen, REDUCED() ? 0 : 380); } // a polícia chegou durante o ano
    if (S.queue.length) setTimeout(showEvent, REDUCED() ? 0 : 380); // deixa o selo do ano aparecer antes
  },
  choose(i){
    if (typeof Device !== "undefined" && !Device.guard()) return; // 2º toque não cai no próximo evento
    const before = takeSnapshot();
    const res = resolveEvent(i);
    saveGame(true); render();
    // a escolha abriu uma briga ou uma fuga: o minigame assume e depois volta ao fluxo
    if (P().alive && (S.fight || S.escape)){ UI._mgBefore = before; return S.fight ? UI.fightOpen() : UI.escapeOpen(); }
    if (!P().alive){ modal(`<div class="emoji">🕊️</div><h3>${esc(P().first)} morreu</h3><div class="result">${esc(res)}</div><div class="choices"><button class="primary" onclick="UI.close();UI.tab('life')">Ver certidão</button></div>`); return; }
    showResult(res, before);
  },
  next(){ if (typeof Device !== "undefined" && !Device.guard()) return; showEvent(); },
  do(fn){
    const before = takeSnapshot();
    const r = fn();
    if (S.flags.forcedDeath && P().alive){ const c = S.flags.forcedDeath; delete S.flags.forcedDeath; die(c); }
    sanitize(); saveGame(true); render();
    if (P().alive && (S.fight || S.escape)){ UI._mgBefore = before; if (r && r.msg) toast(say(r.msg)); return S.fight ? UI.fightOpen() : UI.escapeOpen(); }
    if (r && r.msg) toast(say(r.msg));
    if (r && r.ok === false){ const v = $("#view"); restartClass(v, "shake"); Sound.play("error"); }
    else floatDiff(before, takeSnapshot());
    if (!P().alive) pageTop();
  },
  confirm(msg, yes){ modal(`<h3>Confirmar</h3><p>${esc(msg)}</p><div class="choices"><button class="primary" onclick="UI._yes()">Sim</button><button onclick="UI.close()">Cancelar</button></div>`); UI._yes = ()=>{ closeModal(); yes(); }; },
  uniDialog(){
    modal(`<h3>🎓 Vestibular</h3><p class="muted">Inteligência ${Math.round(P().stats.intelligence)} · desempenho escolar ${Math.round(S.edu.perf)}. A chance considera ambos.</p><div class="choices">${DATA.majors.filter(m=>!S.edu.degrees.includes(m.id)).map(m=>{ const o = oddsUniversity(m); return `<button onclick="UI.close();UI.do(()=>R(true,applyUniversity('${m.id}')))">${m.name} · ${pct(o.p)}<small>nota mínima ~${m.minInt} · ${m.years} anos · ${fmt(priceOf(m.cost))}/ano</small></button>`; }).join("")}<button onclick="UI.close()">Cancelar</button></div>`);
  },
  techDialog(){
    modal(`<h3>🛠️ Curso técnico</h3><div class="choices">${DATA.techCourses.filter(t=>!S.edu.techs.includes(t.id)).map(t=>{ const why = techEligibility(t); return `<button ${why?"disabled":""} onclick="UI.close();UI.do(()=>{startTech('${t.id}');return R(true,'Matriculado(a)!')})">${t.name}<small>2 anos · ${fmt(priceOf(t.cost))}/ano${why?` · <span class="bad">${why}</span>`:""}</small></button>`; }).join("")}<button onclick="UI.close()">Cancelar</button></div>`);
  },
  buyDialog(kind, id, cid){
    cid = cid || P().country;
    const isProp = kind === "prop", d = isProp ? byId(DATA.properties,id) : byId(DATA.vehicles,id);
    const price = isProp ? priceIn(d.price, cid) : priceOf(d.price), abroad = cid !== P().country;
    const fees = isProp ? Math.round(fxConv(price, cid) * (abroad ? 0.08 : 0.05)) : 0;
    const call = (fin) => isProp ? `buyProperty('${id}',${fin},'${cid}')` : `buyVehicle('${id}',${fin})`;
    modal(`<h3>${esc(d.name)}</h3><p>${fmtAsset(price, cid)}${fees?` + taxas ${fmt(fees)}`:""} · você tem ${fmt(S.money)}</p><div class="choices">
      <button onclick="UI.close();UI.do(()=>${call(false)})">À vista</button>
      ${abroad ? "" : `<button onclick="UI.close();UI.do(()=>${call(true)})">Financiar (${isProp?"30":"25"}% de entrada)<small>${isProp?`30 anos a ${(oddsLoanRate(RATES.mortgage)*100).toFixed(1)}% a.a.`:`5 anos a ${(oddsLoanRate(RATES.vehicle)*100).toFixed(1)}% a.a.`} · seu crédito: ${S.credit} · 2 anos de atraso = ${isProp?"leilão":"apreensão"}</small></button>`}
      <button onclick="UI.close()">Cancelar</button></div>`);
  },
  market(cid){ MARKET_COUNTRY = cid; render(); },
  amountDialog(kind, id){
    const base = kind==="withdraw" ? num(S.investments[id]) : kind==="loan" ? Math.max(priceOf(800), jobIncome()*1.2) : kind==="launder" ? Math.min(S.dirty, Math.max(0, frontCapacity() - num(S.flags.launderedThisYear))) : Math.max(0,S.money);
    const label = { invest:"Aplicar", withdraw:"Resgatar", loan:"Pedir empréstimo", launder:"Lavar dinheiro sujo" }[kind];
    const opts = [0.1,0.25,0.5,1].map(f=>Math.round(base*f)).filter(v=>v>0);
    if (!opts.length){ toast("Sem saldo disponível."); return; }
    modal(`<h3>${label}</h3><p class="muted">Base: ${fmt(base)}</p><div class="choices">${opts.map(v=>`<button onclick="UI.close();UI.do(()=>${kind==="loan"?`personalLoan(${v})`:kind==="launder"?`launder(${v})`:`${kind}('${id}',${v})`})">${fmt(v)}</button>`).join("")}<button onclick="UI.close()">Cancelar</button></div>`);
  },
  person(u){
    const r = relBy(u); if (!r) return;
    if (!r.alive){ modal(`<h3>🕯️ ${esc(r.first)} ${esc(r.last)}</h3><p>${relLabel(r)} · faleceu aos ${r.deathAge} anos.</p><div class="choices"><button onclick="UI.close();UI.do(()=>interact('${u}','visitGrave'))">Visitar o túmulo</button><button onclick="UI.close()">Fechar</button></div>`); return; }
    const acts = [["talk","💬 Conversar"],["time","⏳ Passar tempo (energia)"]];
    if (["mother","father"].includes(r.role) && P().age >= 6) acts.push(["money","💸 Pedir dinheiro"]);
    if (r.role === "child") acts.push(["advise","🧭 Aconselhar"]);
    if (r.role === "partner") acts.push(["propose","💍 Pedir em casamento"]);

    if (["partner","fiance","spouse"].includes(r.role)) acts.push(["baby","👶 Tentar ter um filho"]);
    acts.push(["argue","😤 Discutir"]);
    const fightBtn = ["friend","ex","sibling","acquaintance"].includes(r.role) && r.age >= 12 && P().age >= 12 && !inPrison();
    const b = (fn, l, sub, cls = "") => `<button class="${cls}" onclick="UI.close();UI.do(()=>${fn})">${l}${sub ? `<small>${sub}</small>` : ""}</button>`;
    let special = "";
    if (r.role === "fiance") special += `<button class="primary" onclick="UI.marryDialog('${u}')">💒 Marcar o casamento<small>escolher cerimônia e regime de bens</small></button>`;
    if (r.role === "friend") special += `${label("Pedir ajuda")}` + b(`friendAct('${u}','loan')`, "💸 Pedir dinheiro emprestado", "afeto 60+ · prazo de 3 anos para devolver") + b(`friendAct('${u}','referral')`, "💼 Pedir indicação de emprego", r.job ? `${esc(r.job)} · +chance nas candidaturas do ano` : "precisa estar empregado(a)")
      + b(`friendAct('${u}','alibi')`, "🛡️ Pedir álibi / ajuda em apuros", "afeto 65+ · pode delatar") + b(`friendAct('${u}','support')`, "🫂 Desabafar (apoio emocional)", "+felicidade, −estresse");
    if (r.role === "spouse"){ ensureSpouseMoney(r); const acc = spouseAccessible(r);
      special += `<div class="oddsline">💑 ${REGIMES[regime()].name} · patrimônio de ${esc(r.first)}: ${fmt(r.money)} · acessível a você: <b>${fmt(acc)}</b></div>`
        + b(`spouseAct('${u}','ask')`, "🤝 Pedir dinheiro do casal", "com consentimento")
        + `${label("Ações clandestinas")}` + b(`spouseAct('${u}','skim')`, "🕵️ Desviar dinheiro escondido", "15–35% do acessível · pode ser descoberto anos depois", "danger")
        + (regime() !== "separacao" ? b(`spouseAct('${u}','transfer')`, "📝 Transferir bens para meu nome", "50–80% · procuração falsa (crime)", "danger") : "")
        + `<button class="danger" onclick="UI.confirm('Golpe do baú: limpar ${fmt(Math.round(acc*0.95))} de ${esc(r.first)} e sumir? Processo, vingança e reputação destruída.', ()=>UI.do(()=>spouseAct('${u}','gold',false)))">💼 Golpe do baú: limpar tudo e sumir</button>`
        + `<button class="danger" onclick="UI.confirm('Limpar tudo e FUGIR DO PAÍS? Você perde o emprego e as pessoas daqui.', ()=>UI.do(()=>spouseAct('${u}','gold',true)))">✈️ Golpe do baú + fuga para o exterior</button>`; }
    if (["partner","fiance"].includes(r.role)) acts.push(["breakup","💔 Terminar"]);
    if (r.role === "spouse") acts.push(["breakup","⚖️ Pedir divórcio"]);
    if (r.role === "friend") acts.push(["breakup","🚪 Encerrar amizade"]);
    const hist = (r.history||[]).slice().reverse();
    modal(`<h3>${esc(r.first)} ${esc(r.last)} <span class="tag muted">${relLabel(r)}</span></h3>${npcCard(r, { known:true })}
      <div class="bars" style="margin-top:8px">${bar("❤️ Afeto", r.rel)}${bar("🎖️ Respeito", num(r.respect,50), "var(--info)")}</div>
      ${hist.length ? `<div class="section-label">Histórico com você</div><div class="hist">${hist.map(h=>`<div><b>${h.age}a</b> · ${esc(h.text)}</div>`).join("")}</div>` : ""}
      <div class="choices" style="margin-top:12px">${acts.map(([k,l])=>{ const [kind,extra] = k.split(":"); return `<button onclick="UI.close();UI.do(()=>interact('${u}','${kind}','${extra||""}'))">${l}</button>`; }).join("")}
      ${special}
      <button onclick="UI.gifts('${u}')">🎁 Dar presente</button>
      ${fightBtn ? `<button class="danger" onclick="UI.confirm('Partir pra briga com ${esc(r.first)}? A relação vai desabar — e briga pode acabar mal.', ()=>UI.do(()=>provokeRel('${u}')))">👊 Partir pra briga<small>abre o combate · você é o agressor</small></button>` : ""}
      <button onclick="UI.close()">Fechar</button></div>`);
  },
  gifts(u){ modal(`<h3>🎁 Presente</h3><div class="choices">${DATA.gifts.map(g=>`<button onclick="UI.close();UI.do(()=>interact('${u}','gift','${g.id}'))">${g.name}<small>${fmt(priceOf(g.price))} · +${g.rel} relação</small></button>`).join("")}<button onclick="UI.close()">Cancelar</button></div>`); },
  dating(){
    const c = datingCandidates(); if (!c){ toast("Sem energia este ano."); return; }
    UI._cands = c; render();
    modal(`<h3>💘 Pretendentes</h3><div class="choices">${c.map((p,i)=>`<button onclick="UI.close();UI.do(()=>dateCandidate(UI._cands[${i}]))">${esc(p.first)} ${esc(p.last)}, ${p.age}<small>${p.gender==="F"?"Mulher":"Homem"} · aparência ${p.looks}/100${p.job?" · "+esc(p.job):""}</small></button>`).join("")}<button onclick="UI.close()">Ninguém me agradou</button></div>`);
  },
  heir(u){ showLoading(["Lendo o testamento…","Dividindo a herança…","Uma nova geração começa…"], () => { continueAsHeir(u); HUD_PREV = null; saveGame(true); TAB = "life"; render(); }, () => { pageTop(); toast("Uma nova geração começa."); }); },
  menu(){
    modal(`<h3>☰ Menu</h3><div class="choices">
      <button onclick="saveGame();UI.close()">💾 Salvar agora</button>
      <button onclick="exportSave()">⬇️ Exportar save (JSON)</button>
      <button onclick="document.getElementById('imp').click()">⬆️ Importar save</button>
      ${FS.settingsHTML("UI.menu()")}
      <div class="section-label">🎮 Jogo</div>
      <button onclick="UI.close();UI.guide()">📖 Guia rápido</button>
      <button onclick="saveGame(true);showHub('home')">🏠 Menu principal<small>vidas salvas, hall dos legados, nova vida</small></button>
      <button onclick="UI.beauty('style')">💇 Aparência e visão</button>
      <button onclick="UI.theme()">🌓 Alternar tema</button>
      <button onclick="UI.toggleSound()">${SETTINGS.sound ? "🔊 Som ligado" : "🔇 Som desligado"}<small>efeitos sintetizados (Web Audio)</small></button>
      <div class="form" style="padding:0 4px"><label>Volume</label><input type="range" min="0" max="1" step="0.05" value="${SETTINGS.volume}" oninput="Sound.setVolume(+this.value)" onchange="Sound.play('click')" style="padding:0"></div>
      <button onclick="UI.toggleLang()">${SETTINGS.lang === "forte" ? "🤬 Linguagem realista (com palavrões)" : "😇 Linguagem leve (filtrada)"}<small>toque para alternar</small></button>
      <button onclick="UI.close()">Fechar</button></div>
      <input type="file" id="imp" accept="application/json,.json" hidden onchange="importSave(this.files[0], ok=>{ toast(ok?'Save importado!':'Arquivo inválido.'); UI.close(); render(); })">`);
  },
  theme(){ const r = document.documentElement; const dark = r.dataset.theme ? r.dataset.theme==="dark" : matchMedia("(prefers-color-scheme: dark)").matches; r.dataset.theme = dark ? "light" : "dark"; try{ localStorage.setItem("claudilife.theme", r.dataset.theme); }catch(e){} },
  newLifeDialog(){ showHub("create"); },
  startLife(o){
    closeModal(); if (!CUR_SLOT || (S && !o.heir)) startNewSlot(); // cada vida nova ganha seu slot
    showLoading(BOOT_STEPS,
      () => { newLife(o); HUD_PREV = null; TAB = "life"; LOGALL = false; LOGQUERY = ""; MARKET_COUNTRY = null; saveGame(true); render(); },
      () => { pageTop(); UI.tutorial(); }, { long:true }); // tutorial logo após o carregamento da nova vida
  },
  toggleSound(){ Sound.toggle(); UI.menu(); },
  toggleLang(){ SETTINGS.lang = SETTINGS.lang === "forte" ? "leve" : "forte"; saveSettings(); render(); UI.menu(); },
  /* ---------- Entrevista de emprego: 3 perguntas que alteram a chance ---------- */
  interview(id){
    const c = byId(DATA.careers, id), why = jobEligibility(c);
    if (why){ toast(why); return; }
    if (c.elected || c.exam){ UI.do(()=>applyJob(id)); return; }
    UI._iv = { id, qs: interviewQuestions(), i:0, bonus:0, raise:0 };
    UI.ivStep();
  },
  ivStep(){
    const iv = UI._iv, c = byId(DATA.careers, iv.id), q = iv.qs[iv.i];
    const base = oddsHire(c).p;
    modal(`<div class="emoji">🧑‍💼</div><h3>Entrevista: ${esc(c.levels[0].t)}</h3>
      ${bubble(q.q, "Recrutador(a)", "left", "🧑‍💼")}
      <div class="choices">${q.opts.map((o,k)=>`<button onclick="UI.ivAnswer(${k})">${esc(say(o.t))}</button>`).join("")}</div>
      <div class="oddsline" style="margin-top:10px">Pergunta ${iv.i+1}/${iv.qs.length} · chance atual ${pct(Math.max(0.02, Math.min(0.95, base + iv.bonus)))}</div>`, { locked:true });
  },
  ivAnswer(k){
    const iv = UI._iv, c = byId(DATA.careers, iv.id), o = iv.qs[iv.i].opts[k];
    iv.bonus += num(o.eff(c)); iv.raise += num(o.raise); iv.i++;
    Sound.play("click");
    if (iv.i < iv.qs.length) return UI.ivStep();
    closeModal(); UI.do(()=>applyJob(iv.id, { bonus: iv.bonus, raise: iv.raise }));
  },
  /* ---------- Organização criminosa ---------- */
  org(){
    const O = S.org; if (!O){ toast("Você não faz parte de nenhuma organização."); return; }
    modal(`<h3>🕶️ ${esc(O.name)}</h3><p class="muted">${DATA.orgRanks[O.rank].name} · respeito ${Math.round(O.respect)} · calor policial ${Math.round(O.heat)} · poder ${Math.round(orgPower())}</p>
      ${isBoss() ? `${label(`Capangas (${O.members.length})`)}${O.members.map(m=>`<div class="row click" onclick="UI.orgMember('${m.uid}')"><div class="grow"><div class="t">${esc(m.nick)} <span class="muted s">${esc(m.name)}</span></div><div class="s">${esc(m.role)} · habilidade ${m.skill} · parte ${fmt(m.cut)}/ano</div></div>${mini(m.loyalty)}</div>`).join("") || '<div class="empty">Ninguém. Recrute.</div>'}
      ${label("Operações")}${DATA.orgOps.map(op=>{ const on = O.ops.find(o=>o.id===op.id); return `<div class="row"><div class="grow"><div class="t">${op.name}</div><div class="s">~${fmt(priceOf(op.income), true)}/ano sujo · calor +${op.heat} · ${op.members} capanga(s)${on?` · em ${esc(on.territory)}`:""}</div></div>${on?`<button class="btn sm danger" onclick="UI.do(()=>stopOp('${op.id}'));UI.org()">Parar</button>`:`<button class="btn sm" onclick="UI.do(()=>startOp('${op.id}'));UI.org()">Abrir (${fmt(priceOf(op.income*0.3), true)})</button>`}</div>`; }).join("")}
      ${label(`Territórios: ${O.territories.map(esc).join(", ") || "—"}`)}
      ${label("Rivais")}${O.rivals.map(r=>`<div class="row"><div class="grow"><div class="t">${esc(r.name)}</div><div class="s">poder ${r.power} · hostilidade ${r.hostility}</div></div></div>`).join("")}
      <div class="choices" style="margin-top:12px"><button class="primary" onclick="UI.orgRecruit()">➕ Recrutar capanga</button>` :
      `<div class="oddsline">Suba na hierarquia cumprindo tarefas e cometendo crimes. Próximo cargo: ${DATA.orgRanks[O.rank+1]?.name} (respeito ${DATA.orgRanks[O.rank+1]?.respect}).</div><div class="choices" style="margin-top:12px">`}
      <button onclick="UI.confirm('Sair de ${esc(O.name)}? Pode haver represália.', ()=>UI.do(leaveOrg))">🚪 Sair da organização</button><button onclick="UI.close()">Fechar</button></div>`);
  },
  orgRecruit(){
    UI._crew = [makeCrewCandidate(), makeCrewCandidate(), makeCrewCandidate()];
    modal(`<h3>➕ Candidatos</h3>${UI._crew.map((c,i)=>`${npcCard({ ...c, first:c.name.split(" ")[0], last:c.name.split(" ").slice(1).join(" "), job:c.role }, { revealed:true })}<div class="choices"><button onclick="UI.close();UI.do(()=>recruit(UI._crew[${i}]));UI.org()">Recrutar "${esc(c.nick)}" · ${fmt(c.cost)} + ${fmt(c.cut)}/ano</button></div>`).join("")}<div class="choices" style="margin-top:10px"><button onclick="UI.org()">Voltar</button></div>`);
  },
  orgMember(u){
    const m = S.org?.members.find(x=>x.uid===u); if (!m) return;
    modal(`<h3>${esc(m.nick)}</h3>${npcCard({ ...m, first:m.name, last:"", job:m.role }, { revealed:true })}
      <div class="choices"><button onclick="UI.do(()=>bonusMember('${u}'));UI.orgMember('${u}')">💵 Dar bônus (${fmt(Math.round(m.cut*0.5))} sujo)</button>
      <button class="danger" onclick="UI.do(()=>expel('${u}'));UI.org()">🚪 Expulsar</button><button onclick="UI.org()">Voltar</button></div>`);
  },
};

/* Lugares da cidade e cartório (extensão do controlador). */
Object.assign(UI, {
  place(id){
    const p = PLACES.find(x=>x.id===id), a = P().age, energy = ACT_LIMIT - S.activitiesThisYear;
    const acts = (p.acts||[]).map(i=>byId(ACTIVITIES,i)).filter(x => x && a >= actMinAge(x) && (!x.cond || x.cond()));
    Sound.play("bubble");
    modal(`<div class="emoji">${p.ic}</div><h3>${p.name}</h3><p class="muted">${esc(P().city)} · energia ${energy}/${ACT_LIMIT}</p>
      ${acts.length ? `<div class="grid2">${acts.map(x=>`<button class="action" ${energy<=0?"disabled":""} onclick="UI.close();UI.do(()=>doActivity('${x.id}'))"><b>${x.emoji} ${x.name}</b><span>${x.desc}${x.cost&&adult()?` · ${fmt(priceOf(x.cost))}`:""}</span></button>`).join("")}</div>` : ""}
      <div class="choices" style="margin-top:10px">${(p.ui||[]).map(([l,js])=>`<button onclick="${js}">${l}</button>`).join("")}<button onclick="UI.close()">Sair</button></div>`);
  },
  willDialog(){
    const kids = children();
    modal(`<h3>📜 Testamento</h3><p class="muted">Define como seu patrimônio será dividido entre os filhos (imposto de herança: 15%). Custo ${fmt(priceOf(400))}.</p>
      <div class="choices"><button onclick="UI.close();UI.do(()=>makeWill('equal'))">⚖️ Partilha igual</button>
      ${kids.map(k=>`<button onclick="UI.close();UI.do(()=>makeWill('favor','${k.uid}'))">⭐ Favorecer ${esc(k.first)} (60%)<small>${k.age} anos · afeto ${Math.round(k.rel)}</small></button>`).join("")}
      <button onclick="UI.close();UI.do(()=>makeWill('charity'))">🎗️ Metade para caridade<small>+karma, filhos recebem menos</small></button>
      <button onclick="UI.close()">Cancelar</button></div>`);
  },
});
/* Clique em qualquer botão → som de clique (feedback tátil sonoro). */
document.addEventListener("click", e => { if (e.target.closest("button, .row.click")) Sound.play("click"); }, true);
