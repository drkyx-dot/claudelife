"use strict";
/* events/relationships.js */

EVENTS.push(
/* Relacionamentos */
{ id:"ev_proposal", emoji:"💍", title:"Pedido de casamento", age:[20,70], weight:()=>{ const p = partner(); return p && p.role==="partner" && p.rel>70 && P().age - p.since >= 2 ? 2 : 0; }, cd:3,
  setup:()=>({ uid: partner().uid, name: partner().first }),
  text:c=> `${c.name} se ajoelhou e te pediu em casamento! 💍`,
  choices:c=>[
    { label:"Sim! Festa simples", run:()=>{ marry(relBy(c.uid), priceOf(2000)); return "Casamos numa cerimônia íntima." + fx({happiness:15}); } },
    { label:"Sim! Festão", run:()=>{ marry(relBy(c.uid), priceOf(25000)); return "Um casamento digno de novela!" + fx({happiness:20, fame:1}); } },
    { label:"Ainda não", run:()=>{ const p = relBy(c.uid); if (p) p.rel = clamp(p.rel-25); return `${c.name} ficou arrasado(a).` + fx({happiness:-5}); } },
  ]},
{ id:"ev_baby", emoji:"🍼", title:"Notícia inesperada", age:[18,46], weight:()=>{ const p = partner(); return p && p.age<48 && children().length<6 ? 1.2 : 0; }, cd:2,
  text:()=> `Você e ${partner().first} vão ter um bebê!`,
  choices:()=>[
    { label:"Receber o bebê com alegria", run:()=>{ addChild(false); return "A família cresceu."; } },
    { label:"Encaminhar para adoção", run:()=> "Uma família adotiva vai criar a criança." + fx({happiness:-8}) },
  ]},
{ id:"ev_parent_sick", emoji:"🏥", title:"Pai/Mãe doente", age:[25,75], weight:()=>parents().some(p=>p.age>58)?1.3:0, cd:5,
  setup:()=>{ const p = pick(parents().filter(p=>p.age>58)); return { uid:p.uid, name:p.first, cost: priceOf(rint(3000,30000)) }; },
  text:c=> `${c.name} foi internado(a) e precisa de um tratamento de ${fmt(c.cost)}.`,
  choices:c=>[
    { label:"Pagar o tratamento", run:()=>{ const p = relBy(c.uid); addMoney(-c.cost); if (p){ p.rel = clamp(p.rel+15); p.cared = (p.cared||0) + 3; } return `${c.name} se recuperou graças a mim.` + fx({happiness:6, karma:8}); } },
    { label:"Cuidar pessoalmente", run:()=>{ const p = relBy(c.uid); if (p) p.rel = clamp(p.rel+20); if (S.job) S.job.perf = clamp(S.job.perf-12); return "Fiquei ao lado no hospital." + fx({happiness:-4, health:-3, karma:8}); } },
    { label:"Deixar com os irmãos", run:()=>{ const p = relBy(c.uid); if (p) p.rel = clamp(p.rel-15); return "Senti culpa."; } },
  ]},
{ id:"ev_kid_trouble", emoji:"🧒", title:"Problema com filho(a)", age:[25,80], weight:()=>children().some(c=>c.age>=10&&c.age<=17)?1.5:0, cd:3,
  setup:()=>{ const k = pick(children().filter(c=>c.age>=10&&c.age<=17)); return { uid:k.uid, name:k.first }; },
  text:c=> `A escola ligou: ${c.name} se envolveu numa briga.`,
  choices:c=>[
    { label:"Conversar com calma", run:()=>{ const k = relBy(c.uid); if (k) k.rel = clamp(k.rel+10); return `${c.name} se abriu comigo.` + fx({happiness:3}); } },
    { label:"Deixar de castigo", run:()=>{ const k = relBy(c.uid); if (k) k.rel = clamp(k.rel-8); return "Um mês sem celular."; } },
    { label:"Não dar importância", run:()=>{ const k = relBy(c.uid); if (k) k.rel = clamp(k.rel-4); return "Coisa de criança."; } },
  ]},
{ id:"ev_grandchild", emoji:"👶", title:"Neto(a)!", age:[40,99], weight:()=>children().some(c=>c.age>=22)?0.9:0, cd:3,
  setup:()=>{ const k = pick(children().filter(c=>c.age>=22)); return { uid:k.uid, name:k.first, baby: genName(country(), chance(0.5)?"M":"F").first }; },
  text:c=> `${c.name} teve um bebê chamado ${c.baby}!`,
  choices:c=>[
    { label:"Visitar com presentes", run:()=>{ const k = relBy(c.uid); if (k) k.rel = clamp(k.rel+10); S.flags.grandkids = (S.flags.grandkids||0)+1; achieve("grandparent","Avô/Avó"); return "Que emoção segurar meu neto(a)." + fx({happiness:12, money:-priceOf(300)}); } },
    { label:"Mandar mensagem", run:()=>{ S.flags.grandkids = (S.flags.grandkids||0)+1; return "Parabenizei de longe." + fx({happiness:5}); } },
  ]},
{ id:"ev_old_friend", emoji:"📱", title:"Reencontro", age:[28,85], weight:1, cd:8,
  setup:()=>({ name: genName(country(), chance(0.5)?"M":"F").first }),
  text:c=> `${c.name}, seu amigo(a) de infância, te achou nas redes sociais.`,
  choices:c=>[
    { label:"Marcar um encontro", run:()=>{ const f = makeNPC("friend", country(), { first:c.name, age:P().age, rel:65 }); f.since = P().age; S.rels.push(f); return "Rimos como antigamente." + fx({happiness:8}); } },
    { label:"Responder educadamente", run:()=> "Trocamos algumas mensagens." + fx({happiness:2}) },
    { label:"Ignorar", run:()=> "O passado fica no passado." },
  ]}
);
