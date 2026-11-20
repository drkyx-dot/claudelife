"use strict";
/* events/health.js — eventos de saúde, vícios e estresse.
   Todos são condicionados ao estado (doença oculta, vício, estresse),
   para nunca aparecerem "soltos". */
EVENTS.push(
{ id:"ev_symptoms", emoji:"🫀", title:"Sinal do corpo", age:[25,110], weight:()=> S.illnesses.some(i=>!i.diagnosed && byId(DATA.illnesses,i.id).sev >= 8) ? 2.2 : 0, cd:2,
  setup:()=>({ sym: pick(["uma dor no peito ao subir escadas","um cansaço que não passa","uma tosse persistente","uma perda de peso sem explicação"]) }),
  text:c=> `Há semanas você sente ${c.sym}.`,
  choices:()=>[
    { label:"Marcar consulta e exames", hint:"diagnóstico precoce muda tudo", run:()=>{ const u = S.illnesses.filter(i=>!i.diagnosed && byId(DATA.illnesses,i.id).sev>=8); for (const i of u) i.diagnosed = true; addMoney(-checkupCost()); remember(`Investiguei sintomas cedo: ${u.map(i=>byId(DATA.illnesses,i.id).name).join(", ")}.`, "good"); return `Diagnóstico: ${u.map(i=>`${byId(DATA.illnesses,i.id).name} (${stageName(i)})`).join(", ")}. Trate na aba Saúde.`; } },
    { label:"Esperar passar", run:()=>{ for (const i of S.illnesses.filter(i=>!i.diagnosed)) if (chance(0.5)) i.stage = Math.min(4, i.stage+1); addStress(4); return "Fingi que não era nada."; } },
  ]},
{ id:"ev_plan_offer", emoji:"📋", title:"Corretor de plano de saúde", age:[22,64], weight:()=> effectivePlan().id === "none" && S.money > planPremium("basic") ? 1 : 0, cd:6,
  text:()=> `Um corretor oferece o plano básico por ${fmt(planPremium("basic"))}/ano (cobre ~55% dos tratamentos).`,
  choices:()=>[
    { label:"Contratar o básico", run:()=> setHealthPlan("basic").msg },
    { label:"Quero o premium", hint:"cobre ~85%, detecção melhor", run:()=> setHealthPlan("premium").msg },
    { label:"Não, obrigado", run:()=> "Vou arriscar sem plano." },
  ]},
{ id:"ev_drunk_drive", emoji:"🍻", title:"Fim de festa", age:[18,80], weight:()=> S.addictions.alcohol > 30 && S.vehicles.length && S.flags.license ? 1.6 : 0, cd:3,
  text:()=> "Você bebeu bastante e seu carro está no estacionamento.",
  choices:()=>[
    { label:"Chamar um táxi", run:()=> "Voltei em segurança." + fx({money:-priceOf(40)}) },
    { label:"Dirigir assim mesmo", hint:"muito arriscado", run:()=>{
        if (chance(0.25)){ const sq = injure(rint(10,30), "O acidente dirigindo bêbado", 0.5); if (chance(0.5)){ sendToPrison(rint(1,3), "dirigir embriagado e causar acidente"); return "Bati o carro e fui preso(a)." + sq; } return "Bati o carro voltando para casa." + sq; }
        if (chance(0.2)){ addCredit(-10); addNoto(8); return "Parei numa blitz: multa pesada e carteira suspensa." + fx({money:-priceOf(1500)}) + (S.flags.license = false, ""); }
        return "Cheguei em casa... por sorte."; } },
  ]},
{ id:"ev_gambling", emoji:"🎲", title:"Espiral das apostas", age:[18,95], weight:()=> S.addictions.gambling > 45 ? 2.5 : 0, cd:2,
  text:()=> "Você perdeu muito esta semana e sente que precisa recuperar.",
  choices:()=>[
    { label:"Apostar tudo para recuperar", run:()=>{ const bet = Math.round(S.money*0.4); S.addictions.gambling = clamp(S.addictions.gambling+8); if (chance(0.3)) return "Recuperei... e fiquei ainda mais preso(a) ao jogo." + fx({money:bet}); addStress(10); return "Perdi quase tudo." + fx({money:-bet, happiness:-12}); } },
    { label:"Pedir ajuda (grupo de apoio)", run:()=>{ S.addictions.gambling = clamp(S.addictions.gambling - rint(15,30)); remember("Procurei ajuda para o vício em apostas.", "good"); return "O grupo de apoio me ajudou a respirar." + fx({happiness:3}); } },
    { label:"Bloquear meus cartões", run:()=>{ S.addictions.gambling = clamp(S.addictions.gambling - 10); return "Cortei o acesso ao dinheiro fácil." ; } },
  ]},
{ id:"ev_breakdown", emoji:"😵", title:"No limite", age:[16,90], weight:()=> P().stress > 80 ? 3 : 0, cd:2,
  text:()=> "Você teve uma crise de ansiedade no meio do dia. O corpo está cobrando.",
  choices:()=>[
    { label:"Tirar um período sabático", hint:"sem salário por um tempo", run:()=>{ addStress(-30); if (S.job){ addMoney(-Math.round(S.job.salary*0.3)); S.job.perf = clamp(S.job.perf-10); } return "Parei para cuidar de mim." + fx({happiness:8}); } },
    { label:"Começar terapia", run:()=>{ addStress(-18); return "Estou aprendendo a lidar." + fx({money:-priceOf(1200), happiness:4}); } },
    { label:"Ignorar e seguir", run:()=>{ addStress(5); return "Engoli o choro." + fx({happiness:-6}) + injure(6, "O colapso nervoso", 0.1); } },
  ]},
{ id:"ev_parent_move", emoji:"👵", title:"Pai/Mãe precisa de cuidados", age:[30,80], weight:()=> parents().some(p=>p.age>=78 && !p.livesWithMe) && P().age >= 30 ? 1.3 : 0, cd:6,
  setup:()=>{ const p = pick(parents().filter(p=>p.age>=78 && !p.livesWithMe)); return { uid:p.uid, name:p.first, home: priceOf(9000) }; },
  text:c=> `${c.name} não consegue mais morar sozinho(a).`,
  choices:c=>[
    { label:"Trazer para morar comigo", hint:"estresse, mas laço forte", run:()=>{ const p = relBy(c.uid); if (p){ p.livesWithMe = true; p.rel = clamp(p.rel+20); p.cared = (p.cared||0)+4; } S.flags.caregiver = true; return `${c.name} veio morar comigo.` + fx({happiness:2}); } },
    { label:"Pagar uma casa de repouso", hint:"/ano até o fim", run:()=>{ const p = relBy(c.uid); if (p){ p.rel = clamp(p.rel+5); p.cared = (p.cared||0)+2; } return `Encontrei um bom lugar para ${c.name}.` + fx({money:-c.home}); } },
    { label:"Deixar com meus irmãos", run:()=>{ const p = relBy(c.uid); if (p) p.rel = clamp(p.rel-15); return "Senti o peso da culpa." + fx({happiness:-5}); } },
  ]},
{ id:"ev_sport_injury", emoji:"🦵", title:"Lesão em campo", age:[16,40], weight:()=> S.job?.careerId === "athlete" ? 1.8 : 0, cd:2,
  text:()=> "Você rompeu um ligamento em plena temporada.",
  choices:()=>[
    { label:"Cirurgia e recuperação completa", hint:"perde a temporada", run:()=>{ S.job.perf = clamp(S.job.perf-15); return "Voltei mais devagar, mas inteiro(a)." + fx({money:-priceOf(3000)}) + injure(8, "A lesão esportiva", 0.15); } },
    { label:"Infiltração e jogar a final", hint:"risco de sequela", run:()=>{ addFame(6); return "Jogamos a final!" + injure(18, "Jogar lesionado(a)", 0.7); } },
  ]},
);
