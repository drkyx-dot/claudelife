"use strict";
/* events/consequences.js — eventos de carreira, política, dinheiro e
   família que dependem de escolhas passadas ou do estado acumulado. */
EVENTS.push(
/* ---------------- Carreira ---------------- */
{ id:"ev_mentor", emoji:"🧑‍🏫", title:"Proposta de mentoria", age:[20,45], weight:()=> S.job && S.job.perf > 55 && !S.flags.mentor ? 1.2 : 0, cd:6,
  text:()=> "Uma diretora experiente se ofereceu para ser sua mentora.",
  choices:()=>[
    { label:"Aceitar (horas extras de estudo)", run:()=>{ S.flags.mentor = true; addStress(4); schedule("mentorPayoff", rint(2,3), {}, "Aceitei uma mentoria: os frutos vêm em alguns anos."); return "Comecei as sessões de mentoria."; } },
    { label:"Agradecer e recusar", run:()=> "Prefiro seguir no meu ritmo." },
  ]},
{ id:"ev_contact_offer", emoji:"📨", title:"Um contato lembrou de você", age:[18,70], weight:0, cond:()=> !!S.job && !career().elected,
  setup:()=>{ const c = career(); return { id:c.id, level: Math.min(S.job.level+1, c.levels.length-1), raise: rfloat(0.15,0.35) }; },
  text:c=> `Um contato do seu networking oferece o cargo de ${byId(DATA.careers,c.id).levels[c.level].t}.`,
  choices:c=>[
    { label:"Aceitar a nova posição", run:()=>{ if (!S.job || S.job.careerId !== c.id) return "A vaga já tinha sido preenchida."; S.job.level = c.level; S.job.levelYears = 0; S.job.salary = Math.round(salaryFor(career(), c.level, 0) * (1 + c.raise*0.3)); addRep(3); return `Assumi como ${career().levels[c.level].t}!` + fx({happiness:10}); } },
    { label:"Ficar onde estou", run:()=> "Mantive a estabilidade." },
  ]},
{ id:"ev_relocate", emoji:"🧳", title:"Promoção em outra cidade", age:[24,58], weight:()=> S.job && S.job.level >= 1 && S.job.perf > 65 && !career().elected ? 1 : 0, cd:6,
  setup:()=>({ city: pick(country().cities.filter(x=>x!==P().city)) }),
  text:c=> `A empresa oferece uma promoção se você se mudar para ${c.city}.`,
  choices:c=>[
    { label:"Aceitar e mudar", hint:"amigos e família ficam longe", run:()=>{ const cr = career(); if (S.job.level < cr.levels.length-1){ S.job.level++; S.job.levelYears = 0; S.job.salary = salaryFor(cr, S.job.level); } P().city = c.city;
        const own = residence(); if (own){ own.residence = false; own.rented = true; S.rental = S.rental || "r_apt"; } /* casa antiga vira renda; aluga na nova cidade */ for (const r of S.rels) if (["friend","mother","father","sibling"].includes(r.role)) r.rel = clamp(r.rel - rint(5,12)); const pt = partner(); if (pt && pt.rel < 50 && chance(0.4)){ pt.role = "ex"; return `Me mudei para ${c.city} — mas ${pt.first} não quis ir junto.` + fx({happiness:-6}); } return `Nova vida em ${c.city} como ${cr.levels[S.job.level].t}!` + fx({happiness:6}); } },
    { label:"Recusar", run:()=>{ S.job.perf = clamp(S.job.perf-5); return "Fiquei perto de quem amo."; } },
  ]},
{ id:"ev_side_gig", emoji:"🧑‍💻", title:"Freelance de fim de semana", age:[20,65], weight:()=> S.job && S.edu.level >= 3 ? 1 : 0, cd:3,
  setup:()=>({ amt: Math.round(S.job.salary * rfloat(0.08, 0.25)) }),
  text:c=> `Um cliente oferece ${fmt(c.amt)} por um projeto nos fins de semana.`,
  choices:c=>[
    { label:"Aceitar", hint:"+dinheiro, +estresse", run:()=>{ addStress(10); return "Entreguei o projeto." + fx({money:c.amt}); } },
    { label:"Recusar e descansar", run:()=>{ addStress(-3); return "Fim de semana é sagrado."; } },
  ]},
/* ---------------- Política ---------------- */
{ id:"ev_election", emoji:"🗳️", title:"Fim de mandato", age:[21,99], weight:0, cond:()=> !!S.job && career().elected,
  text:()=> `Seu mandato como ${career().levels[S.job.level].t} terminou. Chance de reeleição: ${Math.round(oddsElection(S.job.level).p*100)}%.`,
  choices:()=>{
    const lv = S.job.level, c = career(), up = lv + 1 < c.levels.length;
    const out = [{ label:"Tentar a reeleição", hint:`campanha ${fmt(campaignCost(lv))}`, run:()=>{ const r = runForOffice(lv); if (!r.ok){ endJob("Derrota eleitoral"); } return r.msg; } }];
    if (up) out.push({ label:`Disputar ${c.levels[lv+1].t}`, hint:`${Math.round(oddsElection(lv+1).p*100)}% · campanha ${fmt(campaignCost(lv+1))}`, run:()=>{ const r = runForOffice(lv+1); if (!r.ok) endJob("Derrota eleitoral"); return r.msg; } });
    out.push({ label:"Deixar a política", run:()=>{ endJob("Deixou a política"); addRep(3); return "Encerrei minha vida pública."; } });
    return out;
  }},
{ id:"ev_bribe", emoji:"💼", title:"Envelope suspeito", age:[21,99], weight:0, cond:()=> !!S.job && career().elected,
  setup:()=>({ amt: wageOf(rint(20000, 200000) * (S.job.level+1)) }),
  text:c=> `Um empresário oferece ${fmt(c.amt)} para você favorecer a empresa dele.`,
  choices:c=>[
    { label:"Aceitar a propina", hint:"pode voltar para te assombrar", run:()=>{ addMoney(c.amt); P().karma = clamp(P().karma-15); addNoto(10); schedule("corruptionProbe", rint(1,5), { amt:c.amt }, "Aceitei propina — investigações costumam vir anos depois."); return "Guardei o envelope."; } },
    { label:"Recusar e denunciar", run:()=>{ addRep(8); addFame(4); return "Denunciei o esquema. A imprensa me elogiou."; } },
    { label:"Recusar discretamente", run:()=> "Fingi que não vi." },
  ]},
{ id:"ev_corruption_probe", emoji:"🚔", title:"Operação anticorrupção", age:[21,120], weight:0,
  text:c=> `A Polícia Federal investiga a propina de ${fmt(c.amt)} que você aceitou.`,
  choices:c=>[
    { label:"Contratar os melhores advogados", run:()=>{ addMoney(-Math.round(c.amt*0.6)); if (chance(0.55)){ addRep(-10); return "Escapei por tecnicalidade, mas minha imagem ficou manchada."; } endJob("Cassado(a)"); sendToPrison(rint(3,8), "corrupção passiva"); return "Condenado(a) mesmo assim."; } },
    { label:"Delação premiada", run:()=>{ addMoney(-c.amt); endJob("Cassado(a)"); sendToPrison(rint(1,3), "corrupção (delação)"); return "Delatei o esquema e peguei pena reduzida."; } },
  ]},
/* ---------------- Dinheiro ---------------- */
{ id:"ev_collector", emoji:"📞", title:"Cobrança insistente", age:[18,95], weight:()=> S.loans.some(l=>l.name==="Cheque especial") || debtTotal() > Math.max(jobIncome(), priceOf(4000))*2 ? 1.6 : 0, cd:2,
  text:()=> `Credores ligam todo dia. Dívida total: ${fmt(debtTotal())}.`,
  choices:()=>[
    { label:"Renegociar (prazo maior)", hint:"juros menores, crédito cai", run:()=>{ for (const L of S.loans.filter(l=>!l.propertyUid)){ L.rate = Math.max(0.08, L.rate*0.7); L.years = 6; L.payment = Math.round(L.principal*L.rate/(1-Math.pow(1+L.rate,-6))); } addCredit(-20); addStress(-8); return "Parcelas menores, fôlego maior."; } },
    { label:"Vender bens para quitar", run:()=>{ let raised = 0; for (const v of S.vehicles){ raised += Math.round(v.value*0.85); } S.vehicles = []; for (const k in S.investments){ raised += S.investments[k]; } S.investments = {}; addMoney(raised); for (const L of S.loans.filter(l=>!l.propertyUid)){ const pay = Math.min(L.principal, S.money); L.principal -= pay; addMoney(-pay); } S.loans = S.loans.filter(l=>l.principal>0); addStress(-12); addCredit(15); return `Levantei ${fmt(raised)} e paguei o que pude.`; } },
    { label:"Ignorar as ligações", run:()=>{ addStress(10); addCredit(-30); return "O telefone não para." + fx({happiness:-5}); } },
  ]},
/* ---------------- Família ---------------- */
{ id:"ev_cheating", emoji:"💔", title:"Desconfiança", age:[18,85], weight:()=>{ const p = partner(); return p && (p.rel < 40 || P().stress > 70) ? 1.3 : 0; }, cd:4,
  setup:()=>({ uid: partner().uid, name: partner().first }),
  text:c=> `Você encontrou mensagens suspeitas no celular de ${c.name}.`,
  choices:c=>[
    { label:"Confrontar", run:()=>{ const p = relBy(c.uid); if (!p) return "—"; if (chance(0.5)){ p.rel = clamp(p.rel-20); return `${c.name} confessou. A confiança foi abalada.` + fx({happiness:-10}); } p.rel = clamp(p.rel-8); return "Era um mal-entendido, mas a briga deixou marcas." + fx({happiness:-3}); } },
    { label:"Terminar na hora", run:()=>{ const p = relBy(c.uid); if (!p) return "—"; if (p.role === "spouse") divorce(p, false); else { p.role = "ex"; log(`Terminei com ${c.name}.`, "bad"); } return "Não aceito traição." + fx({happiness:-8}); } },
    { label:"Fingir que não viu", run:()=>{ addStress(10); return "Guardei para mim." + fx({happiness:-6}); } },
  ]},
{ id:"ev_child_college", emoji:"🎓", title:"Faculdade do filho(a)", age:[36,90], weight:()=> children().some(k=>k.age===18 && !k.collegeAsked) ? 3 : 0,
  setup:()=>{ const k = children().find(k=>k.age===18 && !k.collegeAsked); return { uid:k.uid, name:k.first, cost: priceOf(9000)*4 }; },
  text:c=> `${c.name} passou na faculdade! Os 4 anos custam ${fmt(c.cost)}.`,
  choices:c=>[
    { label:"Pagar tudo", run:()=>{ const kk = relBy(c.uid); if (kk) kk.collegeAsked = true; addMoney(-c.cost); const k = relBy(c.uid); if (k) k.rel = clamp(k.rel+15); schedule("childGrateful", 4, { uid:c.uid }, `Paguei a faculdade de ${c.name}.`); return `Investi no futuro de ${c.name}.`; } },
    { label:"Pagar metade", run:()=>{ const kk = relBy(c.uid); if (kk) kk.collegeAsked = true; addMoney(-Math.round(c.cost/2)); const k = relBy(c.uid); if (k) k.rel = clamp(k.rel+6); return `${c.name} vai financiar o resto.`; } },
    { label:"Não posso pagar", run:()=>{ const kk = relBy(c.uid); if (kk) kk.collegeAsked = true; const k = relBy(c.uid); if (k) k.rel = clamp(k.rel-6); return `${c.name} vai trabalhar e estudar.`; } },
  ]},
{ id:"ev_ex_return", emoji:"📲", title:"Mensagem do passado", age:[20,80], weight:()=> !partner() && S.rels.some(r=>r.role==="ex" && r.alive) ? 0.9 : 0, cd:5,
  setup:()=>{ const e = pick(S.rels.filter(r=>r.role==="ex" && r.alive)); return { uid:e.uid, name:e.first }; },
  text:c=> `${c.name}, seu/sua ex, mandou: "Penso em você às vezes…"`,
  choices:c=>[
    { label:"Dar uma segunda chance", run:()=>{ const e = relBy(c.uid); if (!e || partner()) return "O momento passou."; e.role = "partner"; e.rel = clamp(Math.max(e.rel, 45)); e.since = P().age; return `Voltamos! Desta vez com mais maturidade.` + fx({happiness:8}); } },
    { label:"Responder com carinho, sem voltar", run:()=> "Encerrei o ciclo em paz." + fx({happiness:2}) },
    { label:"Bloquear", run:()=> "Página virada." },
  ]},
);
