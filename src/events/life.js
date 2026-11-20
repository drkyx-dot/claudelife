"use strict";
/* events/life.js */

EVENTS.push(
/* Fama / Meia-idade / Saúde */
{ id:"ev_reality", emoji:"📺", title:"Convite de reality show", age:[18,60], weight:()=>P().fame>25 || P().stats.looks>85 ? 1 : 0.1, cd:6,
  text:()=> "Uma emissora te convidou para um reality show.",
  choices:()=>[
    { label:"Topar!", run:()=>{ const win = chance(0.15 + P().stats.looks/400 + (hasTrait("charismatic")?0.15:0)); return win ? "VENCI O REALITY! 🏆" + fx({fame:30, money:wageOf(100000), happiness:15}) : "Fui eliminado(a), mas ganhei seguidores." + fx({fame:12, happiness:-2}); } },
    { label:"Recusar", run:()=> "Prefiro minha privacidade." },
  ]},
{ id:"ev_scandal", emoji:"📰", title:"Escândalo nos tabloides", age:[18,90], weight:()=>P().fame>35?1.5:0, cd:4,
  text:()=> "Um site de fofoca publicou uma foto comprometedora sua.",
  choices:()=>[
    { label:"Pedir desculpas publicamente", run:()=> "O público me perdoou." + fx({fame:-4, happiness:-3}) },
    { label:"Processar o site", run:()=> chance(0.5) ? "Ganhei uma indenização!" + fx({money:wageOf(20000), fame:2}) : "O efeito Streisand piorou tudo." + fx({fame:-12, money:-wageOf(5000)}) },
    { label:"Ignorar", run:()=>{ schedule("oldScandal", rint(4,10)); return "A notícia morreu em uma semana... mas a internet não esquece." + fx({fame:-2}); } },
  ]},
{ id:"ev_midlife", emoji:"🏍️", title:"Crise da meia-idade", age:[40,55], weight:1.2, once:true,
  text:()=> "Você sente que a vida está passando rápido demais.",
  choices:()=>[
    { label:"Comprar um carro esportivo", hint:"vai para a garagem", run:()=>{ const v = byId(DATA.vehicles,"sport"); const pr = priceOf(v.price); if (S.money < pr) return "Não tinha dinheiro... só fiquei olhando a vitrine." + fx({happiness:-3}); addMoney(-pr); S.vehicles.push({ uid:uid(), id:v.id, value:pr, age:0 }); return "Vrum vrum! 🏎️" + fx({happiness:12}); } },
    { label:"Mochilão pelo mundo", run:()=> "Vi lugares incríveis." + fx({happiness:15, money:-priceOf(6000)}) },
    { label:"Fazer terapia", run:()=> "Fiz as pazes com a idade." + fx({happiness:8, money:-priceOf(1200)}) },
    { label:"Aceitar e seguir", run:()=> "A vida é assim." },
  ]},
{ id:"ev_checkup", emoji:"🩺", title:"Exame alterado", age:[35,100], weight:1.2, cd:4,
  text:()=> "O exame de rotina deu um resultado estranho.",
  choices:()=>[
    { label:"Fazer check-up completo", hint:"diagnóstico, não cura", run:()=> medicalCheckup().msg },
    { label:"Ignorar", run:()=>{ const u = S.illnesses.find(i=>!i.diagnosed); if (u){ u.stage = Math.min(4, u.stage+1); return "Ignorei o sinal. Algo silencioso continua avançando..."; } return "Nada aconteceu... por enquanto."; } },
  ]},
{ id:"ev_volunteer", emoji:"🙌", title:"Voluntariado", age:[14,85], weight:0.8, cd:5,
  text:()=> "Uma ONG local procura voluntários.",
  choices:()=>[
    { label:"Ajudar no abrigo de animais", run:()=> (addStress(-4), "Muitos cachorros felizes.") + fx({happiness:6, karma:6}) },
    { label:"Dar aulas de reforço", run:()=> (addRep(2), "Ensinar me fez aprender.") + fx({intelligence:3, karma:6}) },
    { label:"Não tenho tempo", run:()=> "Fica para a próxima." },
  ]}
);
