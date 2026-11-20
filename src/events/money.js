"use strict";
/* events/money.js */

EVENTS.push(
/* Dinheiro */
{ id:"ev_tip", emoji:"📈", title:"Dica quente", age:[22,80], weight:()=>S.money>priceOf(2000)?1.3:0, cd:4,
  setup:()=>({ amt: Math.round(S.money*0.25), asset: pick(["uma criptomoeda nova","ações de uma mineradora","uma startup de IA","um fundo imobiliário"]) }),
  text:c=> `Um amigo jura que ${c.asset} vai explodir. Investir ${fmt(c.amt)}?`,
  choices:c=>[
    { label:"Investir tudo isso", hint:"alto risco", run:()=>{ const r = Math.exp(gauss()*0.9) - 1; const g = Math.round(c.amt*r); return (r>0 ? `Deu certo! Lucrei.` : `Perdi dinheiro...`) + fx({money:g, happiness: r>0?8:-8}); } },
    { label:"Investir pouco", run:()=>{ const r = Math.exp(gauss()*0.9) - 1; const g = Math.round(c.amt*0.15*r); return (r>0?"Lucrei um pouco.":"Perdi um pouco.") + fx({money:g}); } },
    { label:"Pesquisar antes", run:()=> chance(0.5) ? "Era golpe! Escapei." + fx({intelligence:2, happiness:3}) : "Pesquisei demais e perdi o timing." },
    { label:"Recusar", run:()=> "Prefiro dormir tranquilo(a)." },
  ]},
{ id:"ev_crash", emoji:"📉", title:"Crash na bolsa", age:[20,99], weight:()=>investTotal()>0?1:0, cd:6,
  text:()=> "O mercado despencou 30% em uma semana. Pânico geral!",
  choices:()=>[
    { label:"Vender tudo", run:()=>{ let tot=0; for (const k of ["index","stocks","crypto"]){ tot += Math.round(num(S.investments[k])*0.7); delete S.investments[k]; } return "Saí do mercado no fundo do poço." + fx({money:tot, happiness:-4}); } },
    { label:"Segurar", run:()=>{ for (const k of ["index","stocks","crypto"]) if (S.investments[k]) S.investments[k] = Math.round(S.investments[k]*0.75); return "Aguentei a queda. Paciência." + fx({happiness:-3}); } },
    { label:"Comprar mais (na baixa)", hint:"usa 20% do caixa", run:()=>{ for (const k of ["index","stocks","crypto"]) if (S.investments[k]) S.investments[k] = Math.round(S.investments[k]*0.75); const b = Math.max(0,Math.round(S.money*0.2)); addMoney(-b); S.investments.index = num(S.investments.index) + Math.round(b*1.25); return "Comprei barato. Visão de longo prazo." + fx({happiness:2}); } },
  ]},
{ id:"ev_friend_loan", emoji:"🤝", title:"Pedido de empréstimo", age:[18,85], weight:()=>S.money>priceOf(1500) && S.rels.some(r=>r.role==="friend"&&r.alive)?1.2:0, cd:5,
  setup:()=>{ const f = pick(S.rels.filter(r=>r.role==="friend"&&r.alive)); return { uid:f.uid, name:f.first, amt: Math.round(Math.min(S.money*0.3, priceOf(rint(500,8000)))) }; },
  text:c=> `${c.name} está apertado(a) e pediu ${fmt(c.amt)} emprestados.`,
  choices:c=>[
    { label:"Emprestar", hint:"o retorno depende da amizade", run:()=>{ const f = relBy(c.uid); addMoney(-c.amt); if (f) f.rel = clamp(f.rel+15); schedule("friendRepay", rint(1,3), { uid:c.uid, name:c.name, amt:c.amt }, `Emprestei ${fmt(c.amt)} para ${c.name}.`); return `Transferi o dinheiro. ${c.name} prometeu devolver.` + fx({karma:5}); } },
    { label:"Dar metade, de presente", run:()=>{ const f = relBy(c.uid); if (f) f.rel = clamp(f.rel+10); return "Ajudei como pude." + fx({money:-Math.round(c.amt/2), karma:6}); } },
    { label:"Negar", run:()=>{ const f = relBy(c.uid); if (f) f.rel = clamp(f.rel-15); return `${c.name} ficou chateado(a).`; } },
  ]},
{ id:"ev_lawsuit", emoji:"⚖️", title:"Processo judicial", age:[25,90], weight:()=>netWorth()>wageOf(300000)?0.8:0, cd:8,
  setup:()=>({ amt: Math.round(netWorth()*rfloat(0.03,0.12)) }),
  text:c=> `Você está sendo processado(a) em ${fmt(c.amt)} por um ex-sócio.`,
  choices:c=>[
    { label:"Fazer acordo (metade)", run:()=> "Encerrei o caso." + fx({money:-Math.round(c.amt/2), happiness:-3}) },
    { label:"Contratar bons advogados", hint:"custa 15%", run:()=>{ addMoney(-Math.round(c.amt*0.15)); return chance(0.6) ? "Ganhei a causa! 🎉" + fx({happiness:6}) : "Perdi a causa." + fx({money:-c.amt, happiness:-8}); } },
    { label:"Ignorar", run:()=> chance(0.2) ? "O caso foi arquivado." : "Condenado(a) à revelia, com multa." + fx({money:-Math.round(c.amt*1.3), happiness:-10}) },
  ]},
{ id:"ev_charity", emoji:"🎗️", title:"Campanha beneficente", age:[20,95], weight:()=>S.money>priceOf(10000)?1:0, cd:5,
  text:()=> "Um hospital infantil lançou uma campanha de doações.",
  choices:()=>[
    { label:"Doar 10% do meu dinheiro", run:()=> "Fiz diferença na vida de muitas crianças." + fx({money:-Math.round(S.money*0.1), happiness:8, karma:12, fame: S.money>wageOf(1e6)?4:0}) },
    { label:"Doar 1%", run:()=> "Contribuí com o que pude." + fx({money:-Math.round(S.money*0.01), happiness:3, karma:4}) },
    { label:"Não doar", run:()=> "Passei batido." },
  ]},
{ id:"ev_inherit_uncle", emoji:"📜", title:"Tio distante", age:[25,80], weight:0.25, once:true,
  setup:()=>({ amt: priceOf(rint(5000, 250000)) }),
  text:c=> `Um tio que você mal conhecia faleceu e deixou ${fmt(c.amt)} para você.`,
  choices:c=>[
    { label:"Aceitar a herança", run:()=> "Que surpresa!" + fx({money:c.amt, happiness:6}) },
    { label:"Doar para os primos", run:()=> "Eles precisavam mais." + fx({karma:10, happiness:4}) },
  ]}
);
