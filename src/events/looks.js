"use strict";
/* events/looks.js — teste de visão ÚNICO na vida (escola) e vaidade. */
EVENTS.push(
{ id:"ev_vision_test", emoji:"👁️", title:"Teste de visão na escola", age:[6,14], once:true, weight:()=> look().visionTested ? 0 : 3.5,
  setup:()=>({ myopia: chance(0.32), kind: pick(["miopia","astigmatismo","miopia com astigmatismo"]) }),
  speech:c=> c.myopia ? "Lê a última linha pra mim? …Hum. Vamos chamar seus pais." : "Perfeito! Pode voltar pra sala.",
  text:c=> c.myopia ? `A enfermeira da escola detectou ${c.kind}. Você vai precisar de óculos.` : "Teste de visão obrigatório da escola: visão perfeita!",
  choices:c=> c.myopia ? [
    { label:"👓 Armação básica (grátis)", hint:"aparência −4", run:()=>{ look().visionTested = true; look().myopia = true; return setFrame("basic").msg; } },
    { label:"🕶️ Armação moderna", hint:`${fmt(priceOf(400))} · aparência −2`, run:()=>{ look().visionTested = true; look().myopia = true; const r = setFrame("modern"); return r.ok ? r.msg : "A família não pôde pagar. " + setFrame("basic").msg; } },
    { label:"✨ Armação de grife", hint:`${fmt(priceOf(1500))} · aparência −1`, run:()=>{ look().visionTested = true; look().myopia = true; const r = setFrame("designer"); return r.ok ? r.msg : "Grife? Nem pensar, disse minha mãe. " + setFrame("basic").msg; } },
    { label:"🙈 Esconder os óculos e não usar", hint:"dor de cabeça e notas piores", run:()=>{ look().visionTested = true; look().myopia = true; look().glasses = null; return "Ninguém vai me chamar de quatro-olhos. (Mas o quadro ficou embaçado.)"; } },
  ] : [
    { label:"😎 Ótimo!", run:()=>{ look().visionTested = true; return "Enxergo tudo, até a cola do colega."; } },
  ]},
{ id:"ev_glasses_bully", emoji:"🤓", title:"Quatro-olhos", age:[7,15], cd:4, weight:()=> look().glasses && look().glasses !== "contacts" ? 0.8 : 0,
  speech:()=> say("Ô quatro-olhos! Enxerga daí, mané?"),
  text:()=> "Um colega começou a zoar seus óculos no recreio.",
  choices:()=>[
    { label:"😂 Rir junto", run:()=> chance(0.6) ? "A piada perdeu a graça e ele parou." : "Ele continuou. Doeu um pouco." + fx({happiness:-3}) },
    { label:"🗣️ Responder à altura", run:()=> chance(0.5 + P().stats.intelligence/300) ? "A turma toda riu DELE. Fim da zoeira." + fx({happiness:4}) : "Levei a pior na troca de farpas." + fx({happiness:-4}) },
    { label:"👩‍🏫 Contar para a professora", run:()=> "Ele levou advertência." },
  ]},
);
