"use strict";
/* events/danger.js */

EVENTS.push(
/* Perigos */
{ id:"ev_robbed", emoji:"🔪", title:"Assalto", age:[14,90], weight:()=>0.8*country().crime, cd:5, cond:()=>!inPrison(),
  setup:()=>({ amt: Math.min(Math.max(0,S.money), priceOf(rint(50,800))) }),
  text:()=> "Um assaltante armado te aborda numa rua escura.",
  choices:c=>[
    { label:"Entregar tudo", run:()=> "Levaram meu celular e dinheiro." + fx({money:-c.amt, happiness:-6}) },
    { label:"👊 Reagir", hint:"abre o combate · assaltante armado · legítima defesa", run:()=>{ startFight("robbery", { amt:c.amt }); return "Não vou entregar nada. Parti pra cima."; } },
    { label:"Correr", run:()=> chance(0.6) ? "Escapei!" + fx({health:-1}) : "Tropecei e me alcançaram." + fx({money:-c.amt, health:-6}) },
  ]},
{ id:"ev_accident", emoji:"💥", title:"Acidente de trânsito", age:[18,90], weight:()=>S.vehicles.length ? 0.8*Math.max(...S.vehicles.map(v=>byId(DATA.vehicles,v.id).risk))*(hasTrait("impulsive")?1.4:1)*(hasTrait("cautious")?0.6:1) : 0, cd:3,
  setup:()=>({ vuid: pick(S.vehicles).uid }),
  text:()=> "Você bateu o carro num cruzamento. O outro motorista está furioso.",
  choices:c=>[
    { label:"Acionar o seguro", run:()=>{ const v = S.vehicles.find(x=>x.uid===c.vuid); if (v) v.value = Math.round(v.value*0.85); return "O seguro cobriu, mas o carro desvalorizou." + injure(rint(0,16), "O acidente de trânsito", 0.35) + fx({ money:-priceOf(400)}); } },
    { label:"Fugir do local", hint:"crime", run:()=>{ if (chance(0.4)){ sendToPrison(1, "omissão de socorro"); return "Fui identificado(a) pelas câmeras."; } schedule("hitAndRun", rint(1,4)); return "Escapei... mas a culpa pesa (e câmeras existem)." + fx({karma:-10, happiness:-5}); } },
    { label:"Negociar em dinheiro", run:()=> "Paguei o conserto do outro." + fx({money:-priceOf(rint(500,3000))}) },
  ]},
{ id:"ev_investigation", emoji:"🕵️", title:"Investigação policial", age:[14,90], weight:()=>P().notoriety>25 && !inPrison() ? P().notoriety/20 : 0, cd:3,
  text:()=> "A polícia está investigando você por crimes antigos.",
  choices:()=>[
    { label:"Contratar advogado", hint:"caro", run:()=>{ addMoney(-priceOf(8000)); if (chance(0.65)) { addNoto(-15); return "Meu advogado arquivou o caso."; } sendToPrison(rint(1,4), "crimes antigos"); return "Mesmo assim, fui condenado(a)."; } },
    { label:"Cooperar e confessar", run:()=>{ sendToPrison(rint(1,3), "confissão"); P().karma = clamp(P().karma+10); return "Confessei e peguei pena reduzida."; } },
    { label:"Fugir do país", hint:"muda de país", run:()=>{ if (chance(0.5)){ emigrate(pick(DATA.countries.filter(c=>c.id!==P().country)).id, true); addNoto(-30); return `Fugi para ${country().name}!`; } sendToPrison(rint(3,8), "tentativa de fuga"); return "Fui pego(a) no aeroporto."; } },
  ]}
);
