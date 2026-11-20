"use strict";
/* events/teen.js */

EVENTS.push(
/* Adolescência */
{ id:"ev_party", emoji:"🎉", title:"Festa", age:[14,30], weight:2, cd:2,
  text:()=> "Te convidaram para uma festa badalada no sábado.",
  choices:()=>[
    { label:"Ir e beber todas", hint:"impulsivo", run:()=>{ S.addictions.alcohol = clamp(S.addictions.alcohol + 6); if (chance(0.15 + (hasTrait("impulsive")?0.1:0))) { return "Passei mal e fui parar no hospital." + fx({health:-10, happiness:-5, money:-priceOf(200)}); } if (chance(0.3)) { enqueue("ev_approach_date"); return "Melhor noite do ano — e alguém veio puxar papo comigo." + fx({happiness:8}); } return "Melhor noite do ano!" + fx({happiness:8, health:-3}); } },
    { label:"Ir, mas ficar sóbrio(a)", run:()=> "Me diverti e voltei inteiro(a)." + fx({happiness:5}) },
    { label:"Ficar em casa", run:()=> "Maratonei uma série." + fx({happiness:1}) },
  ]},
{ id:"ev_crush", emoji:"💌", title:"Paixão", age:[13,19], weight:()=>partner()?0:2.5, cd:2,
  setup:()=>({ g: partnerGender(), name: genName(country(), partnerGender()).first }),
  text:c=> `Você não para de pensar em ${c.name}, da sua turma.`,
  choices:c=>[
    { label:"Se declarar", hint:"aparência e carisma", run:()=>{ const p = P().stats.looks/130 + (hasTrait("charismatic")?0.2:0) - (hasTrait("shy")?0.15:0); if (chance(p)){ const pt = makePartner([-1,1]); pt.first = c.name; pt.gender = c.g; S.rels.push(pt); return `${c.name} disse SIM! Primeiro namoro. 🥰` + fx({happiness:12}); } return `${c.name} riu na minha cara.` + fx({happiness:-10}); } },
    { label:"Escrever uma carta anônima", run:()=> "Nunca soube se leu..." + fx({happiness:-1}) },
    { label:"Esperar passar", run:()=> "Passou. Eventualmente." },
  ]},
{ id:"ev_peer", emoji:"🚬", title:"Pressão dos amigos", age:[13,19], weight:1.5, cd:3,
  text:()=> "Seus amigos estão fumando escondido e te oferecem.",
  choices:()=>[
    { label:"Aceitar", run:()=>{ if (chance(0.35)){ S.addictions.smoke = clamp(S.addictions.smoke + 38); remember("Comecei a fumar na adolescência.", "bad"); return "Acabei viciado(a) em cigarro."+ fx({health:-3, happiness:2}); } return "Tossi muito e não gostei." + fx({health:-2}); } },
    { label:"Recusar", run:()=> "Mantive minha posição." + fx({happiness:1}) },
    { label:"Convencê-los a parar", hint:"carisma", run:()=> chance(hasTrait("charismatic")?0.6:0.25) ? "Eles me ouviram! Respeito." + fx({karma:4, happiness:4}) : "Me chamaram de careta." + fx({happiness:-3}) },
  ]},
{ id:"ev_parents_fight", emoji:"🏚️", title:"Briga em casa", age:[8,17], weight:()=>parents().length===2?1.4:0, cd:3,
  text:()=> "Seus pais estão brigando feio de novo.",
  choices:()=>[
    { label:"Tentar mediar", run:()=>{ if (chance(0.5)){ for (const p of parents()) p.rel = clamp(p.rel+6); return "Eles se acalmaram e me agradeceram." + fx({happiness:2}); } return "Sobrou pra mim." + fx({happiness:-6}); } },
    { label:"Me trancar no quarto", run:()=> "Fone de ouvido no máximo." + fx({happiness:-3}) },
    { label:"Sair para a casa de um amigo", run:()=> "Respirei um pouco." + fx({happiness:1}) },
  ]},
{ id:"ev_license", emoji:"🚗", title:"Carteira de motorista", age:[18,40], weight:()=>S.flags.license?0:3, cd:2, cond:()=>!inPrison(),
  text:()=> "Chegou a hora de tirar a carteira de motorista.",
  choices:()=>[
    { label:"Estudar e fazer a prova", run:()=>{ addMoney(-priceOf(400)); if (chance(0.55 + P().stats.intelligence/250)){ S.flags.license = true; return "Passei de primeira! 🪪" + fx({happiness:6}); } return "Reprovei na baliza." + fx({happiness:-4}); } },
    { label:"Ir na cara e coragem", run:()=>{ addMoney(-priceOf(400)); if (chance(0.3)){ S.flags.license = true; return "Passei, nem sei como!" + fx({happiness:6}); } return "Bati no cone. Reprovado(a)." + fx({happiness:-5}); } },
    { label:"Deixar para depois", run:()=> "Vou de ônibus mesmo." },
  ]},
{ id:"ev_teen_job", emoji:"🍔", title:"Primeiro trabalho", age:[15,17], weight:()=>S.partTime?0:1.5, cd:2,
  text:()=> "Uma lanchonete do bairro está contratando adolescentes.",
  choices:()=>[
    { label:"Aceitar meio período", run:()=>{ S.partTime = "pt_fastfood"; S.edu.perf = clamp(S.edu.perf-4); return "Comecei a ganhar meu dinheirinho." + fx({happiness:4}); } },
    { label:"Recusar e focar na escola", run:()=>{ S.edu.perf = clamp(S.edu.perf+3); return "Escola em primeiro lugar." ; } },
  ]},
/* Transição para vida adulta (forçado) */
{ id:"ev_after_school", emoji:"🎓", title:"E agora?", age:[15,99], weight:0,
  text:()=> `Terminei o Ensino Médio (desempenho ${Math.round(S.edu.perf)}/100). Qual o próximo passo?`,
  choices:()=>{
    const opts = DATA.majors.slice().sort((a,b)=>a.minInt-b.minInt).filter((m,i)=> i%2===0 || P().stats.intelligence >= m.minInt-10).slice(0,5);
    return [
      ...opts.map(m => ({ label:`Vestibular: ${m.name}`, hint:`exige ~${m.minInt} de inteligência · ${m.years} anos`, run:()=> applyUniversity(m.id) })),
      { label:"Curso técnico", hint:"2 anos, mais barato", run:()=>{ const t = pick(DATA.techCourses.filter(t=>!techEligibility(t))); startTech(t.id); return `Me matriculei em ${t.name}.`; } },
      { label:"Começar a trabalhar", run:()=> "Vou procurar emprego (aba Carreira)." + fx({happiness:2}) },
      { label:"Ano sabático", run:()=> "Tirei um ano para me descobrir." + fx({happiness:8}) },
    ];
  }}
);
