"use strict";
/* ui/views/career.js */

/* ---------- Aba Carreira ---------- */
function viewCareer(){
  const E = S.edu, a = P().age;
  let h = `<div class="card"><h2>🎓 Educação <span class="tag">${DATA.eduLevels[E.level]}</span></h2>`;
  if (E.school) h += `<div class="row"><div class="grow"><div class="t">${schoolName()}${E.major && !["fund","medio","supl"].includes(E.school) ? " — " + esc((byId(DATA.majors,E.major)||byId(DATA.techCourses,E.major)).name) : ""}</div><div class="s">${E.yearsLeft} ano(s) restante(s) · desempenho</div></div>${mini(E.perf)}</div>
    <div class="row"><button class="btn" onclick="UI.do(studyHarder)">📖 Estudar mais</button><button class="btn danger" onclick="UI.confirm('Largar os estudos?', ()=>UI.do(dropOut))">Largar</button></div>`;
  else h += `<div class="empty">${a < 6 ? "Ainda não está na escola." : "Não está estudando no momento."}</div>`;
  if (E.degrees.length || E.techs.length) h += `<div class="chips" style="margin:6px 0">${E.degrees.map(d=>`<span class="chip">🎓 ${byId(DATA.majors,d).name}</span>`).join("")}${E.techs.map(t=>`<span class="chip neutral">🛠️ ${byId(DATA.techCourses,t).name}</span>`).join("")}</div>`;
  if (!E.school && a >= 16 && !inPrison()){
    const btns = [];
    if (E.level < 2) btns.push(`<button class="btn" onclick="UI.do(returnToSchool)">Supletivo (EJA)</button>`);
    if (E.level >= 2) btns.push(`<button class="btn primary" onclick="UI.uniDialog()">Prestar vestibular</button>`, `<button class="btn" onclick="UI.techDialog()">Curso técnico</button>`);
    if (E.level >= 4 && E.level < 5) btns.push(`<button class="btn" onclick="UI.do(()=>startGrad(5))">Mestrado</button>`);
    if (E.level >= 5 && E.level < 6) btns.push(`<button class="btn" onclick="UI.do(()=>startGrad(6))">Doutorado</button>`);
    if (btns.length) h += `<div class="chips" style="margin-top:8px">${btns.join("")}</div>`;
  }
  if (E.debt) h += `<div class="row"><div class="grow s">Financiamento estudantil: <b class="bad">${fmt(E.debt)}</b></div><button class="btn" onclick="UI.do(payStudentDebt)">Pagar</button></div>`;
  h += `</div>`;

  // Emprego atual
  h += `<div class="card"><h2>💼 Trabalho</h2>`;
  if (S.job){
    const c = career(), J = S.job;
    h += `<div class="row"><div class="grow"><div class="t">${c.levels[J.level].t}</div><div class="s">${c.sector} · ${fmt(J.salary)}/ano · ${J.years} ano(s) na carreira · nível ${J.level+1}/${c.levels.length}</div></div>${mini(J.perf)}</div>
      ${c.elected ? `<div class="oddsline">Mandato: ${4 - (J.levelYears % 4)} ano(s) até a próxima eleição · reeleição ${explainOdds(oddsElection(J.level))}</div>` : J.level < c.levels.length-1 ? `<div class="oddsline">Promoção este ano: ${promotionBlocker() ? `<b class="warn">bloqueada — ${esc(promotionBlocker())}</b>` : J.perf > 62 ? explainOdds(oddsPromotion()) : "<b>exige desempenho > 62</b>"}</div>` : ""}
      <div class="row"><span class="s">Esforço:</span>${["Mínimo","Normal","Hora extra"].map((l,i)=>`<button class="btn ${J.effort===i?"primary":""}" onclick="UI.do(()=>setEffort(${i}))">${l}</button>`).join("")}</div>
      <div class="row"><button class="btn" onclick="UI.do(askRaise)">Pedir aumento</button><button class="btn danger" onclick="UI.confirm('Pedir demissão?', ()=>UI.do(quitJob))">Pedir demissão</button>${a>=55?`<button class="btn" onclick="UI.do(retire)">Aposentar</button>`:""}</div>`;
  } else if (S.partTime) h += `<div class="row"><div class="grow"><div class="t">${byId(DATA.partTime,S.partTime).name}</div><div class="s">Meio período · ${fmt(wageOf(byId(DATA.partTime,S.partTime).s))}/ano</div></div><button class="btn danger" onclick="UI.do(quitJob)">Sair</button></div>`;
  else if (S.retired) h += `<div class="empty">Aposentado(a) · pensão de ${fmt(S.pension)}/ano</div>`;
  else h += `<div class="empty">Desempregado(a).</div>`;
  h += `</div>`;

  if (a >= 14 && !S.job && !inPrison()){
    h += `<div class="card"><h2>🧃 Meio período</h2>${DATA.partTime.map(j=>`<div class="row"><div class="grow"><div class="t">${j.name}</div><div class="s">${fmt(wageOf(j.s))}/ano · ${j.minAge}+ anos</div></div><button class="btn" ${a<Math.max(j.minAge, ageOf("work"))||S.partTime===j.id?"disabled":""} onclick="UI.do(()=>applyPartTime('${j.id}'))">Candidatar</button></div>`).join("")}</div>`;
  }
  h += athleteCard() + gigCard();
  if (a >= 18 && !inPrison()){
    // vagas: elegíveis primeiro, com chance explicada; indisponíveis recolhidas com o motivo
    const elig = DATA.careers.filter(c => !jobEligibility(c)), not = DATA.careers.filter(c => jobEligibility(c));
    const jobRow = c => { const why = jobEligibility(c), o = why ? null : oddsHire(c);
      return `<div class="row"><div class="grow"><div class="t">${c.levels[0].t} <span class="muted s">· ${c.sector} · ${c.tier}${c.stable?" · estável":""}${c.volatile?" · renda variável":""}</span></div><div class="s">${fmt(salaryFor(c,0))}/ano · topo: ${c.levels[c.levels.length-1].t}${why?` · <span class="bad">${why}</span>`:""}</div>${o?`<div class="oddsline">Chance: ${explainOdds(o)}</div>`:""}</div>
        <button class="btn ${o && o.p >= 0.5 ? "primary" : ""}" ${why?"disabled":""} onclick="UI.interview('${c.id}')">${c.elected ? `Candidatar-se (${fmt(campaignCost(0))})` : c.exam ? "Prestar concurso" : "Entrevista"}</button></div>`; };
    h += `<div class="card"><h2>📋 Vagas disponíveis <span class="tag">${elig.length} de ${DATA.careers.length}</span></h2>${elig.length ? elig.sort((x,y)=>oddsHire(y).p - oddsHire(x).p).map(jobRow).join("") : `<div class="empty">Nenhuma vaga compatível com seu perfil agora.</div>`}
      <details style="margin-top:10px"><summary class="s" style="cursor:pointer">Ver ${not.length} vagas indisponíveis e o que falta</summary>${not.map(jobRow).join("")}</details></div>`;
    h += `<div class="card"><h2>🏪 Empreendedorismo</h2>` + (S.businesses.length ? S.businesses.map(b=>`<div class="row"><div class="grow"><div class="t">${esc(b.name)}</div><div class="s">Faturamento ${fmt(b.revenue)} · lucro ${fmt(b.lastProfit)} · valor ${fmt(b.value)}</div></div><button class="btn" onclick="UI.confirm('Vender ${esc(b.name)}?', ()=>UI.do(()=>sellBusiness('${b.uid}')))">Vender</button></div>`).join("") : "")
      + DATA.businesses.map(d=>`<div class="row"><div class="grow"><div class="t">${d.name}</div><div class="s">Investimento ${fmt(priceOf(d.cost))}${d.needs?` · requer ${byId(DATA.majors,d.needs).name}`:""} · risco ${d.vol>0.5?"alto":d.vol>0.25?"médio":"baixo"}</div></div><button class="btn" onclick="UI.do(()=>openBusiness('${d.id}'))">Abrir</button></div>`).join("") + `</div>`;
  }
  if (S.jobHistory.length) h += `<div class="card"><h2>📜 Histórico profissional</h2>${S.jobHistory.slice().reverse().map(j=>`<div class="row"><div class="grow"><div class="t">${esc(j.title)}</div><div class="s">${esc(j.career)} · dos ${j.from} aos ${j.to} anos · ${esc(j.reason)}</div></div></div>`).join("")}</div>`;
  return h;
}
