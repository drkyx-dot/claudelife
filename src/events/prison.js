"use strict";
/* events/prison.js */

EVENTS.push(
/* Prisão (forçados) */
{ id:"ev_parole", emoji:"🧑‍⚖️", title:"Audiência de condicional", age:[0,120], weight:0, prison:true,
  text:()=> `Você cumpriu ${S.prison.served} ano(s). A junta vai avaliar sua condicional.`,
  choices:()=>[
    { label:"Mostrar arrependimento", run:()=>{ S.prison.paroleAsked = true; if (chance(0.45 + (P().karma-50)/200)){ S.prison = null; S.parole = 3; return "Liberdade condicional concedida! 🔓"; } return "Negada. Volto para a cela." + fx({happiness:-6}); } },
    { label:"Ficar em silêncio", run:()=>{ S.prison.paroleAsked = true; return chance(0.2) ? (S.prison = null, S.parole = 3, "Fui liberado(a) mesmo assim.") : "Negada." + fx({happiness:-4}); } },
  ]},
{ id:"ev_prison_life", emoji:"⛓️", title:"Vida na prisão", age:[0,120], weight:0, prison:true,
  text:()=> "Um dia comum no presídio. O que fazer?",
  choices:()=>[
    { label:"Estudar na biblioteca", run:()=>{ if (S.prison) S.prison.years = Math.max(1, S.prison.years - (chance(0.4)?1:0)); return "Remição de pena pelos estudos." + fx({intelligence:4, karma:4}); } },
    { label:"Malhar no pátio", run:()=> "Fiquei mais forte." + fx({health:5, looks:2}) },
    { label:"🥊 Arrumar briga", hint:"abre o combate; pode render solitária", run:()=>{ startFight("prison", { provoked:true }); return "Encarei o cara mais folgado do pavilhão."; } },
    { label:"🏃 Tentar fugir", hint: escapeBlock() || "minigame de fuga", run:()=>{ const r = startEscape(); return r.msg; } },
  ]}
);
