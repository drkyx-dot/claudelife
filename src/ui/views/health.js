"use strict";
/* ui/views/health.js — aba Saúde: condição, fatores de risco e causas do
   estresse, check-up, diagnósticos com opções de tratamento (custo e
   chance de cura explicados), plano de saúde e vícios. */
function viewHealth(){
  const p = P(), a = p.age, cap = Math.round(healthCap()), plan = effectivePlan();
  const checked = S.health.lastCheckup === a;
  let h = `<div class="card hero"><h2>🩺 Condição física <span class="tag">${S.health.exercised ? "exercitou-se este ano" : a >= 18 ? `${S.health.sedentary} ano(s) sedentário` : ""}</span></h2>
    <div class="bars" style="margin-top:0">
      ${bar("❤️ Saúde atual", p.stats.health, null, cap)}
      ${bar("🧬 Teto de saúde (vitalidade − sequelas)", cap, "var(--accent)")}
      ${bar("😣 Estresse", p.stress, stressColor(p.stress))}
      ${bar("⏳ Vitalidade biológica", p.vitality, "var(--info)")}
    </div>
    <div class="oddsline" style="margin-top:10px">A saúde se recupera sozinha em direção ao teto, mais devagar com a idade (${Math.round(22*Math.max(0.25,1-a/120))}% da distância/ano). O teto cai com o envelhecimento e lesões graves — nada o restaura.</div>
    <div class="row" style="margin-top:6px"><button class="btn primary" ${checked?"disabled":""} onclick="UI.do(medicalCheckup)">${checked ? "✔ Check-up feito este ano" : `Fazer check-up (${fmt(checkupCost())})`}</button>
      <span class="s">Detecção com ${esc(plan.name.toLowerCase())}: ${Math.round(plan.detect*100)}% da base. Check-up diagnostica — não cura.</span></div></div>`;

  // diagnósticos
  const diag = S.illnesses.filter(i=>i.diagnosed);
  h += `<div class="card"><h2>🧾 Diagnósticos <span class="tag">${diag.length ? "" : "nenhum conhecido"}</span></h2>`;
  if (!diag.length) h += `<div class="empty">Nenhuma condição diagnosticada.${a >= 35 ? " Doenças silenciosas podem existir — check-ups anuais detectam cedo." : ""}</div>`;
  for (const il of diag){
    const d = byId(DATA.illnesses, il.id), st = DATA.stages[il.stage];
    h += `<div class="row"><div class="grow"><div class="t">${d.name} ${chip(`estágio ${st.name}`, il.stage >= 3 ? "bad" : il.stage === 2 ? "warn" : "neutral")} ${d.chronic ? chip("crônica","neutral") : ""}</div>
      <div class="s">${il.treated ? `Em tratamento: ${byId(DATA.treatments,il.tier).name} · ${fmt(treatmentCost(il))}/ano` : "Sem tratamento — tende a avançar"} · dano ~${Math.round(d.sev*st.dmg*(il.treated ? (d.chronic?0.25:0.45) : 1))}/ano</div></div>
      ${il.treated ? `<button class="btn sm danger" onclick="UI.do(()=>stopTreatment('${il.id}'))">Interromper</button>` : ""}</div>`;
    h += `<div class="grid2" style="margin:2px 0 8px">${DATA.treatments.filter(t=>!t.minStage || il.stage >= t.minStage).map(t=>{
        const o = d.chronic ? null : oddsCure(il, t.id), on = il.treated && il.tier === t.id;
        return `<button class="action" ${on?"disabled":""} onclick="UI.do(()=>treatIllness('${il.id}','${t.id}'))"><b>${on?"✔ ":""}${t.name}</b><span>${fmt(treatmentCost(il, t.id))}/ano · ${d.chronic ? "controla o avanço" : `cura ~${Math.round(o.p*100)}%/ano`}${t.risk>0.05?" · risco de complicação":""}</span></button>`; }).join("")}</div>`;
  }
  h += `</div>`;

  // fatores de risco + estresse
  const risks = riskProfile(), sT = stressTarget();
  h += `<div class="card"><h2>📉 Fatores de risco</h2>${risks.length ? risks.map(r=>`<div class="row"><div class="grow"><div class="t">${esc(r.k)}</div><div class="s">${esc(r.txt)}</div></div>${mini(r.v*100, `var(--${r.level})`)}</div>`).join("") : `<div class="empty">Nenhum fator de risco relevante. Continue assim!</div>`}
    ${label(`Para onde seu estresse caminha: ${Math.round(sT.target)}`)}
    <div class="chips" style="margin-top:6px">${sT.parts.sort((x,y)=>Math.abs(y[1])-Math.abs(x[1])).slice(0,8).map(([l,v])=>chip(`${esc(l)} ${v>0?"+":"−"}${Math.abs(Math.round(v))}`, v > 0 ? "bad" : "good")).join("") || `<span class="muted s">Sem pressões relevantes.</span>`}</div></div>`;

  // plano de saúde
  if (a >= 18){
    h += `<div class="card"><h2>📋 Plano de saúde <span class="tag">${S.health.employerPlan && S.health.plan==="none" ? "básico pago pela empresa" : ""}</span></h2>
      ${DATA.healthPlans.map(pl=>`<div class="row"><div class="grow"><div class="t">${pl.name}</div><div class="s">${pl.cost ? `${fmt(planPremium(pl.id))}/ano · cobre ${Math.round(pl.coverage*100)}% dos tratamentos particulares` : "Você paga tudo do bolso"} · detecção ${Math.round(pl.detect*100)}%</div></div>
      <button class="btn ${S.health.plan===pl.id?"primary":""}" ${S.health.plan===pl.id?"disabled":""} onclick="UI.do(()=>setHealthPlan('${pl.id}'))">${S.health.plan===pl.id?"Atual":"Escolher"}</button></div>`).join("")}
      <div class="oddsline">A mensalidade sobe com a idade e com doenças crônicas preexistentes.</div></div>`;
  }
  // vícios
  const adds = DATA.addictions.filter(d => S.addictions[d.id] > 0);
  if (adds.length || a >= 13){
    h += `<div class="card"><h2>🚭 Hábitos e vícios</h2>${adds.length ? adds.map(d=>`<div class="row"><div class="grow"><div class="t">${d.emoji} ${d.name}</div><div class="s">${d.desc} · ${S.addictions[d.id] > 40 ? "auto-reforçando a cada ano" : "sob controle relativo"}</div></div>${mini(S.addictions[d.id], stressColor(S.addictions[d.id]))}<button class="btn sm" onclick="UI.do(()=>quitAddiction('${d.id}'))">Tentar parar</button></div>`).join("")
      + `<div class="row"><button class="btn" onclick="UI.do(rehab)">🏥 Clínica de reabilitação</button><span class="s">Reduz todos os vícios fortemente; custa caro.</span></div>` : `<div class="empty">Nenhum vício. 🙌</div>`}</div>`;
  }
  return h;
}
