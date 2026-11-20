"use strict";
/* =====================================================================
   ui/views/assets.js — aba Bens: economia global, finanças, moradia,
   imóveis POR PAÍS (inquilinos, estado, reforma, venda remota),
   mercado imobiliário de qualquer país, garagem, investimentos, dívidas,
   dinheiro sujo e emigração.
   ===================================================================== */
const FLAGS = { BR:"🇧🇷", PT:"🇵🇹", US:"🇺🇸", JP:"🇯🇵", DE:"🇩🇪", MX:"🇲🇽", NG:"🇳🇬", IN:"🇮🇳" };
const flag = cid => `<span class="flag">${FLAGS[cid] || "🌐"}</span>`;
let MARKET_COUNTRY = null;

function propertyRow(p){
  const d = byId(DATA.properties,p.id), m = S.loans.find(l=>l.propertyUid===p.uid), abroad = isAbroad(p), cond = Math.round(num(p.condition,100));
  const status = p.residence ? chip("🏡 Moradia","good") : p.rented ? (p.tenant ? chip(`🔑 ${esc(p.tenant.name)} · confiab. ${p.tenant.reliability}`,"neutral") : chip("📢 Anunciado, vago","warn")) : chip("Vazio","neutral");
  const estRent = Math.round(p.value * d.rentYield * 0.85 * (abroad ? 0.9 : 1));
  return `<div class="row"><div class="grow"><div class="t">${flag(p.country)}${d.name}</div>
      <div class="s">${d.kind} · ${fmtAsset(p.value, p.country)} (pago ${fmtIn(p.bought, p.country)})${m?` · deve ${fmtIn(m.principal, p.country)}${m.missed?` <b class="bad">· ${m.missed} ano(s) em atraso!</b>`:""}`:""}</div>
      <div class="chips" style="margin-top:4px">${status}${chip(`🔧 Estado ${cond}%`, cond < 50 ? "bad" : cond < 75 ? "warn" : "good")}${p.rented ? chip(`≈ ${fmtIn(estRent, p.country)}/ano líquido`, "neutral") : ""}</div></div>
    <div class="chips">
      ${!p.residence && !abroad && !d.commercial ? `<button class="btn sm" onclick="UI.do(()=>moveInto('${p.uid}'))">Morar</button>` : ""}
      ${!p.residence ? `<button class="btn sm" onclick="UI.do(()=>toggleRentOut('${p.uid}'))">${p.rented?"Tirar do aluguel":"Alugar"}</button>` : ""}
      ${cond < 95 ? `<button class="btn sm" onclick="UI.do(()=>renovate('${p.uid}'))">Reformar (${fmt(fxConv(renovateCost(p), p.country)*(abroad?1.15:1), true)})</button>` : ""}
      <button class="btn sm danger" onclick="UI.confirm('Vender ${esc(d.name)}? Corretagem 6% + 15% sobre o lucro.', ()=>UI.do(()=>sellProperty('${p.uid}')))">Vender</button></div></div>`;
}
function viewAssets(){
  const a = P().age, home = homeInfo(), ph = phase(), W = S.world;
  let h = `<div class="card hero"><h2>🌎 Economia <span class="phase ${phaseName()}">${ph.emoji} ${phaseName()}</span></h2>
    <div class="kpis">
      <div class="kpi"><div class="k">Inflação (ano)</div><div class="v ${W.inflation > 0.06 ? "bad" : ""}">${(W.inflation*100).toFixed(1)}%</div></div>
      <div class="kpi"><div class="k">Custo de vida acumulado</div><div class="v">×${S.priceIndex.toFixed(2)}</div></div>
      <div class="kpi"><div class="k">Salários acumulados</div><div class="v">×${wageIdx().toFixed(2)}</div></div>
      <div class="kpi"><div class="k">Poder de compra</div><div class="v ${wageIdx()/S.priceIndex < 0.9 ? "bad" : ""}">${Math.round(wageIdx()/S.priceIndex*100)}%</div></div>
    </div>
    <div class="oddsline" style="margin-top:8px">Fase atual: demissões ×${ph.layoff}, contratações ${ph.hire>=0?"+":""}${Math.round(ph.hire*100)}%, imóveis ${ph.prop>=0?"+":""}${Math.round(ph.prop*100)}%/ano. Salários repõem só parte da inflação.</div></div>`;
  h += `<div class="card"><h2>💰 Finanças</h2>
    <div class="kpis">
      <div class="kpi"><div class="k">Conta corrente</div><div class="v">${fmt(S.money)}</div></div>
      <div class="kpi"><div class="k">Investimentos</div><div class="v">${fmt(investTotal())}</div></div>
      <div class="kpi"><div class="k">Imóveis</div><div class="v">${fmt(propertiesTotal(), true)}</div></div>
      <div class="kpi"><div class="k">Veículos · Negócios</div><div class="v">${fmt(vehiclesTotal(), true)} · ${fmt(businessesTotal(), true)}</div></div>
      <div class="kpi"><div class="k">Dívidas</div><div class="v bad">${fmt(debtTotal(), true)}</div></div>
      <div class="kpi"><div class="k">Patrimônio líquido</div><div class="v">${fmt(netWorth(), true)}</div></div>
    </div>
    ${a>=18?`<div class="row" style="margin-top:6px"><div class="grow"><div class="t">🏦 Score de crédito: ${S.credit} · ${creditLabel()}</div><div class="oddsline">Pessoal ${(oddsLoanRate(RATES.personal)*100).toFixed(1)}% · imóvel ${(oddsLoanRate(RATES.mortgage)*100).toFixed(1)}% · veículo ${(oddsLoanRate(RATES.vehicle)*100).toFixed(1)}% a.a. Atrasos → leilão/apreensão em 2 anos, penhora em 3.</div></div>${mini((S.credit-300)/5.5)}</div>
      <div class="row"><span class="s">Estilo de vida:</span>${LIFESTYLES.map((l,i)=>`<button class="btn sm ${P().lifestyle===i?"primary":""}" onclick="UI.do(()=>setLifestyle(${i}))">${l.name}</button>`).join("")}</div>`:""}</div>`;
  if (S.dirty > 0 || S.org){
    const cap = Math.max(0, frontCapacity() - num(S.flags.launderedThisYear));
    h += `<div class="card dark"><h2>🧺 Dinheiro sujo <span class="tag">${fmt(S.dirty)}</span></h2>
      <div class="oddsline">Não paga contas nem compra bens. Lave pelos negócios de fachada (taxa 20%). Capacidade restante este ano: <b>${fmt(cap)}</b>.</div>
      <div class="row"><button class="btn" ${!S.dirty||!cap?"disabled":""} onclick="UI.amountDialog('launder')">Lavar dinheiro</button><span class="s">Fachadas: ${S.businesses.filter(b=>byId(DATA.businesses,b.id).front).map(b=>esc(b.name)).join(", ") || "nenhuma (abra um lava-jato, academia, casa noturna…)"}</span></div></div>`;
  }
  if (a < 18) return h + `<div class="card"><div class="empty">Imóveis, veículos, investimentos e empréstimos ficam disponíveis aos 18 anos.</div></div>`;

  // moradia
  h += `<div class="card"><h2>🏠 Moradia <span class="tag">${esc(home.name)}</span></h2>`;
  if (S.rental) h += `<div class="row"><div class="grow"><div class="t">${byId(DATA.rentals,S.rental).name}</div><div class="s">Aluguel ${fmt(priceOf(byId(DATA.rentals,S.rental).rent))}/ano</div></div><button class="btn sm" onclick="UI.do(leaveRental)">Sair</button></div>`;
  h += `<details><summary class="s" style="cursor:pointer;margin-top:6px">Ver ${DATA.rentals.length} opções de aluguel em ${esc(P().city)} (caução: 3 meses)</summary>${DATA.rentals.map(r=>`<div class="row"><div class="grow"><div class="t">${r.name}</div><div class="s">${fmt(priceOf(r.rent))}/ano · conforto ${r.comfort}/10</div></div><button class="btn sm" ${S.rental===r.id?"disabled":""} onclick="UI.do(()=>rentHome('${r.id}'))">Alugar</button></div>`).join("")}</details></div>`;

  // imóveis por país
  const byCountry = {}; for (const p of S.properties) (byCountry[p.country] = byCountry[p.country] || []).push(p);
  h += `<div class="card"><h2>🏘️ Meus imóveis <span class="tag">${S.properties.length} · ${Object.keys(byCountry).length} país(es)</span></h2>`;
  h += S.properties.length ? Object.entries(byCountry).map(([cid, list]) => `${label(`${flag(cid)} ${country(cid).name}${cid!==P().country?" · gestão remota (−10% aluguel, reformas +15%)":""}`)}${list.map(propertyRow).join("")}`).join("") : `<div class="empty">Você não possui imóveis.</div>`;
  const mc = MARKET_COUNTRY || P().country;
  h += `${label("Mercado imobiliário")}<div class="chips" style="margin:6px 0">${DATA.countries.map(c=>`<button class="btn sm ${c.id===mc?"primary":""}" onclick="UI.market('${c.id}')">${flag(c.id)}${c.name}</button>`).join("")}</div>
    <div class="oddsline">${mc!==P().country?"Compra remota: só à vista, taxas de 8% (ITBI + câmbio). Rende aluguel convertido para sua moeda.":"ITBI/cartório 5%. Financiamento: 30% de entrada, parcela até 35% da renda."}</div>
    <details ${MARKET_COUNTRY?"open":""}><summary class="s" style="cursor:pointer;margin-top:6px">Ver ${DATA.properties.length} imóveis à venda em ${country(mc).name}</summary>
    ${DATA.properties.map(d=>{ const pr = priceIn(d.price, mc); return `<div class="row"><div class="grow"><div class="t">${d.name}</div><div class="s">${d.kind} · ${fmtAsset(pr, mc)} · aluguel bruto ~${(d.rentYield*100).toFixed(1)}%/ano · custos ${(d.upkeep*100).toFixed(1)}%/ano${d.comfort?` · conforto ${d.comfort}`:" · comercial"}</div></div><button class="btn sm" onclick="UI.buyDialog('prop','${d.id}','${mc}')">Comprar</button></div>`; }).join("")}</details></div>`;

  // garagem
  h += `<div class="card"><h2>🚗 Garagem ${S.flags.license?"":'<span class="tag bad">sem habilitação</span>'}</h2>`;
  h += S.vehicles.length ? S.vehicles.map(v=>{ const d = byId(DATA.vehicles,v.id), L = S.loans.find(l=>l.vehicleUid===v.uid); return `<div class="row"><div class="grow"><div class="t">${flag(v.country)}${d.name}</div><div class="s">${d.kind} · ${v.age} ano(s) · vale ${fmtAsset(v.value, v.country)}${L?` · financiado${L.missed?` <b class="bad">(${L.missed} atraso)</b>`:""}`:""}${isAbroad(v)?" · parado no exterior":""}</div></div>
    ${isAbroad(v)?`<button class="btn sm" onclick="UI.do(()=>shipVehicle('${v.uid}'))">Importar</button>`:""}<button class="btn sm" onclick="UI.do(()=>sellVehicle('${v.uid}'))">Vender</button></div>`; }).join("") : `<div class="empty">Garagem vazia.</div>`;
  const kinds = [...new Set(DATA.vehicles.map(d=>d.kind))];
  h += `<details><summary class="s" style="cursor:pointer;margin-top:6px">Concessionária: ${DATA.vehicles.length} modelos (${kinds.join(", ")})</summary>${kinds.map(k=>`${label(k)}${DATA.vehicles.filter(d=>d.kind===k).map(d=>`<div class="row"><div class="grow"><div class="t">${d.name}${d.armored?" 🛡️":""}</div><div class="s">${fmt(priceOf(d.price))} · seguro+IPVA ~${fmt(priceOf(d.price)*(d.ins+d.tax), true)}/ano · combustível ~${fmt(priceOf(d.fuel), true)}/ano · roubo ${d.theft>=1.5?"alto":d.theft>=0.8?"médio":"baixo"} · estilo ${d.style}/10</div></div><button class="btn sm" onclick="UI.buyDialog('car','${d.id}')">Comprar</button></div>`).join("")}`).join("")}</details></div>`;

  // investimentos
  h += `<div class="card"><h2>📈 Investimentos</h2>` + DATA.investments.map(d=>{ const amt = num(S.investments[d.id]); const r = S.lastReturns?.[d.id];
    return `<div class="row"><div class="grow"><div class="t">${d.name}</div><div class="s">Saldo ${fmt(amt)}${r!==undefined?` · último ano <span class="${r>=0?"good":"bad"}">${(r*100).toFixed(1)}%</span>`:""} · risco ${d.sigma>0.5?"extremo":d.sigma>0.2?"alto":d.sigma>0.05?"médio":"baixo"}${d.cycle<0?" · protege em crises":""}</div></div><button class="btn sm" onclick="UI.amountDialog('invest','${d.id}')">Aplicar</button>${amt?`<button class="btn sm" onclick="UI.amountDialog('withdraw','${d.id}')">Resgatar</button>`:""}</div>`; }).join("") + `</div>`;
  // dívidas
  h += `<div class="card"><h2>🏦 Dívidas e crédito</h2>` + (S.loans.length ? S.loans.map(L=>`<div class="row"><div class="grow"><div class="t">${flag(L.country)}${esc(L.name)}${L.missed?` ${chip(`${L.missed} ano(s) em atraso`,"bad")}`:""}</div><div class="s">Saldo ${fmtAsset(L.principal, L.country)} · juros ${(L.rate*100).toFixed(1)}% a.a. · parcela ${fmtIn(L.payment, L.country)}/ano</div></div><button class="btn sm" onclick="UI.do(()=>payOffLoan('${L.uid}'))">Quitar</button></div>`).join("") : `<div class="empty">Nenhuma dívida ativa.</div>`)
    + `<div class="row"><button class="btn" onclick="UI.amountDialog('loan')">Pedir empréstimo pessoal (${(oddsLoanRate(RATES.personal)*100).toFixed(1)}% a.a.)</button></div></div>`;
  // emigração
  h += `<div class="card"><h2>✈️ Emigrar</h2><div class="oddsline" style="margin-bottom:8px">Seus imóveis, veículos e negócios FICAM onde estão e continuam rendendo (gestão remota). Caixa e investimentos são convertidos pelo câmbio. EUA, Japão e Alemanha exigem visto.</div>
    <div class="chips">${DATA.countries.filter(c=>c.id!==P().country).map(c=>{ const v = visaCheck(c); return `<button class="btn sm" ${v?`title="${esc(v)}"`:""} onclick="UI.confirm('Mudar para ${c.name}? Custo ${fmt(emigrateCost(c))}. ${v?esc(v):"Visto OK."}', ()=>UI.do(()=>emigrate('${c.id}')))">${flag(c.id)}${c.name}${v?" 🛂":""}</button>`; }).join("")}</div></div>`;
  return h;
}
