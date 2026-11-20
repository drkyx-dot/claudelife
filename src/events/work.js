"use strict";
/* events/work.js */

EVENTS.push(
/* Carreira */
{ id:"ev_headhunter", emoji:"📞", title:"Proposta de concorrente", age:[22,62], weight:()=>S.job && S.job.perf>55 ? 1.5 : 0, cd:4,
  setup:()=>({ raise: rfloat(0.12,0.35) }),
  text:c=> `Um headhunter oferece um cargo similar com salário ${Math.round(c.raise*100)}% maior.`,
  choices:c=>[
    { label:"Aceitar a proposta", run:()=>{ S.job.salary = Math.round(S.job.salary*(1+c.raise)); S.job.levelYears=0; S.job.perf = 55; return "Troquei de empresa!" + fx({happiness:6}); } },
    { label:"Usar para negociar", hint:"pode irritar o chefe", run:()=>{ if (chance(0.55)){ S.job.salary = Math.round(S.job.salary*(1+c.raise*0.6)); return "Meu chefe cobriu parte da oferta." + fx({happiness:5}); } S.job.perf = clamp(S.job.perf-15); return "O chefe não gostou da chantagem." + fx({happiness:-4}); } },
    { label:"Recusar", run:()=>{ S.job.perf = clamp(S.job.perf+4); return "Lealdade tem seu valor."; } },
  ]},
{ id:"ev_boss", emoji:"👔", title:"Chefe abusivo", age:[18,65], weight:()=>S.job?1.2:0, cd:4,
  text:()=> "Seu chefe gritou com você na frente de todos.",
  choices:()=>[
    { label:"Confrontar na hora", run:()=> chance(0.35) ? "Ele recuou e pediu desculpas." + fx({happiness:6}) : (endJob("Demitido"), "Fui demitido(a) por insubordinação." + fx({happiness:-10})) },
    { label:"Denunciar ao RH", run:()=> chance(0.5) ? "O chefe foi advertido." + fx({happiness:5}) : (S.job.perf = clamp(S.job.perf-10), "Viraram as costas pra mim." + fx({happiness:-5})) },
    { label:"Engolir seco", run:()=>{ addStress(8); return "Respirei fundo." + fx({happiness:-6}); } },
    { label:"Pedir demissão", run:()=> (endJob("Pediu demissão"), "Saí de cabeça erguida." + fx({happiness:3})) },
  ]},
{ id:"ev_bonus", emoji:"💰", title:"Bônus de desempenho", age:[18,70], weight:()=>S.job && S.job.perf>75 ? 2 : 0, cd:2,
  setup:()=>({ amt: Math.round(S.job.salary * rfloat(0.08, 0.4)) }),
  text:c=> `Você recebeu um bônus de ${fmt(c.amt)}! O que fazer?`,
  choices:c=>[
    { label:"Investir em fundo de índice", run:()=>{ S.investments.index = num(S.investments.index) + c.amt; return "Dinheiro trabalhando por mim." + fx({happiness:3}); } },
    { label:"Torrar em uma viagem", run:()=> "Viagem inesquecível!" + fx({happiness:12}) },
    { label:"Guardar na conta", run:()=> "Reserva de emergência reforçada." + fx({money:c.amt}) },
  ]},
{ id:"ev_burnout", emoji:"🔥", title:"Esgotamento", age:[20,65], weight:()=>S.job && (S.job.effort===2 || hasTrait("anxious")) ? 2 : (S.job?0.3:0), cd:5,
  text:()=> "Você está exausto(a), dormindo mal e irritado(a).",
  choices:()=>[
    { label:"Tirar férias", run:()=>{ S.job.effort = 1; addStress(-22); return "Desliguei de tudo por um mês." + fx({happiness:10, money:-priceOf(1500)}); } },
    { label:"Fazer terapia", run:()=>{ addStress(-15); return "Aprendi a colocar limites." + fx({happiness:8, money:-priceOf(1000)}); } },
    { label:"Continuar firme", run:()=>{ S.job.perf = clamp(S.job.perf+5); addStress(12); if (P().age > 40 && chance(0.15)){ const h = S.illnesses.find(i=>i.id==="hypert"); if (!h) S.illnesses.push({ id:"hypert", years:0, stage:1, diagnosed:false, treated:false, tier:null }); } return "Aguentando no osso." + fx({health:-5, happiness:-8}); } },
  ]},
{ id:"ev_coworker", emoji:"☕", title:"Clima no escritório", age:[20,55], weight:()=>S.job && !partner()?1.2:0, cd:4,
  setup:()=>({ name: genName(country(), partnerGender()).first }),
  text:c=> `${c.name}, do seu setor, te chamou para um café depois do expediente.`,
  choices:c=>[
    { label:"Aceitar o convite", run:()=>{ if (chance(0.55)){ const p = makePartner([-5,5]); p.first = c.name; S.rels.push(p); return `Rolou um clima e começamos a namorar.` + fx({happiness:10}); } return "Foi só um café mesmo." + fx({happiness:2}); } },
    { label:"Manter o profissionalismo", run:()=> "Melhor não misturar." },
  ]},
{ id:"ev_retire_offer", emoji:"🏖️", title:"Aposentadoria", age:[55,99], weight:0,
  text:()=> "O RH ofereceu um plano de aposentadoria.",
  choices:()=>[
    { label:"Me aposentar", run:()=>{ retire(); return "Aposentado(a)! Hora de curtir."; } },
    { label:"Continuar trabalhando", run:()=> "Ainda tenho lenha pra queimar." },
  ]}
);
