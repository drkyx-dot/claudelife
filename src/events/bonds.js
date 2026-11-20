"use strict";
/* =====================================================================
   events/bonds.js — fraudes conjugais (suas e contra você), processos,
   vingança de ex e amigos pedindo ajuda (a utilidade é de mão dupla).
   ===================================================================== */
EVENTS.push(
{ id:"ev_fraud_discovered", emoji:"🧾", title:"Descoberto(a)", age:[18,120], weight:0, cond:c=> !!relBy(c.uid)?.alive,
  speech:c=> say(pick(["Você me roubou?! Depois de tudo que eu fiz por você, seu(sua) desgraçado(a)?","Eu vi o extrato. Nem tenta mentir.","Como você teve coragem, porra?"])),
  text:c=> `${relBy(c.uid).first} descobriu seu ${c.kind} de ${fmt(c.amt)}.`,
  choices:c=>[
    { label:"💸 Devolver tudo e implorar perdão", hint:`${fmt(Math.round(c.amt*1.1))}`, run:()=>{ const r = relBy(c.uid), v = Math.round(c.amt*1.1); if (S.money < v) return "Nem tinha mais o dinheiro para devolver." + fraudEscalate(c); addMoney(-v); r.money = num(r.money) + v; if (chance(0.35 + r.rel/300)){ r.rel = clamp(r.rel + 15); return "Devolvi com juros. Fiquei no sofá por meses, mas o casamento sobreviveu."; } return "Devolvi, mas a confiança não volta." + fraudEscalate(c); } },
    { label:"🤥 Negar e culpar o banco", hint:"inteligência ajuda", run:()=>{ if (chance(0.15 + P().stats.intelligence/400)){ relBy(c.uid).rel = clamp(relBy(c.uid).rel + 25); return "Inventei um erro do banco. Colou… por enquanto."; } return "A mentira piorou tudo." + fraudEscalate(c, true); } },
    { label:"🚪 Assumir e pedir o divórcio", run:()=>{ const r = relBy(c.uid); if (r.role === "spouse") divorce(r, false, c.amt); return "Acabou. Cada um para um lado — e os advogados ficaram ricos."; } },
  ]},
{ id:"ev_scam_lawsuit", emoji:"⚖️", title:"Processo por estelionato", age:[18,120], weight:0, cond:()=>!inPrison(),
  speech:()=> say("O(a) senhor(a) está sendo processado(a) por estelionato sentimental."),
  text:c=> `${c.name} te processa para reaver ${fmt(c.amt)}.`,
  choices:c=>[
    { label:"🤝 Fazer acordo (devolver 120%)", run:()=>{ const v = Math.round(c.amt*1.2); const paid = Math.min(Math.max(0,S.money), v); addMoney(-paid); addRep(-6); if (paid < v){ sendToPrison(rint(1,3), "estelionato (acordo descumprido)"); return "Não consegui pagar o acordo inteiro. O juiz não perdoou."; } return `Paguei ${fmt(paid)}. Processo encerrado.`; } },
    { label:"⚖️ Enfrentar no tribunal", hint:"advogado " + fmt(priceOf(8000)), run:()=>{ addMoney(-Math.min(Math.max(0,S.money), priceOf(8000))); if (chance(0.45 - P().stats.intelligence/500)){ sendToPrison(rint(1,5), "estelionato sentimental"); addRep(-15); return "Condenado(a). A história virou reportagem."; } addRep(-5); return "Absolvido(a) por falta de provas."; } },
    { label:"✈️ Sumir do país", run:()=>{ const d = pick(DATA.countries.filter(x=>x.id!==P().country)); const from = P().country; emigrate(d.id, true); S.wanted = S.wanted || { since:P().age, remaining:rint(2,4), crime:"estelionato", fakeId:false, country:from, years:0, security:"média" }; return `Fugi para ${d.name}. Tenho mandado de prisão no meu país.`; } },
  ]},
{ id:"ev_scam_revenge", emoji:"😈", title:"A vingança do(a) ex", age:[18,120], weight:0, cond:()=>!inPrison(),
  speech:c=> say(`Você achou que eu ia deixar barato? Agora todo mundo vai saber quem você é.`),
  text:c=> `${c.name}, a vítima do seu golpe, voltou para acertar as contas.`,
  choices:c=>[
    { label:"📰 Deixar que fale — negar tudo", run:()=>{ addRep(-12); addFame(5); for (const r of S.rels.filter(x=>["friend","partner","spouse","fiance"].includes(x.role))) r.rel = clamp(r.rel - 8); return "Expôs tudo nas redes. Virei o(a) golpista do momento."; } },
    { label:"💵 Pagar pelo silêncio", hint:fmt(priceOf(20000)), run:()=>{ const v = priceOf(20000); if (!canAfford(v)) return "Sem dinheiro. A exposição veio mesmo assim." + fx({happiness:-6}) + (addRep(-12), ""); addMoney(-v); return "Pagou-se o silêncio."; } },
    { label:"🥊 Ir tirar satisfação", hint:"abre o combate", run:()=>{ startFight("provoke", { npc:{ first:c.name, last:"", age:P().age + rint(-5,5), personality:"hothead" } }); return "Fui até a casa dele(a)."; } },
  ]},
{ id:"ev_spouse_drain", emoji:"🕳️", title:"Rombo na conta", age:[20,120], cd:5,
  weight:()=>{ const r = spouse(); if (!r || regime() === "separacao" || S.money < priceOf(15000)) return 0; const per = byId(DATA.personalities, r.personality); return per?.scam ? 0.5 + (r.rel < 50 ? 0.5 : 0) : 0.05; },
  cond:()=>!!spouse() && !inPrison(),
  setup:()=>({ uid: spouse().uid, pct: rfloat(0.2, 0.45) }),
  text:c=> `Sua conta conjunta está com um buraco de ${fmt(Math.round(Math.max(0,S.money)*c.pct))}. Só ${relBy(c.uid).first} tinha acesso.`,
  choices:c=>[
    { label:"🔍 Contratar um detetive", hint:fmt(priceOf(3000)), run:()=>{ const r = relBy(c.uid), loss = Math.round(Math.max(0,S.money)*c.pct); addMoney(-loss - priceOf(3000)); const per = byId(DATA.personalities, r.personality); if (per?.scam){ r.rel = clamp(r.rel - 40); remember_npc(r, "Foi pego(a) desviando meu dinheiro"); divorce(r, false); return `Era ${r.first}: tinha uma conta secreta. Pedi o divórcio na hora.`; } return "O detetive achou um erro do banco. O dinheiro voltou em parte." + fx({money: Math.round(loss*0.6)}); } },
    { label:"🗣️ Confrontar", run:()=>{ const r = relBy(c.uid), loss = Math.round(Math.max(0,S.money)*c.pct); addMoney(-loss); r.rel = clamp(r.rel - 20); return `${r.first} jurou que foi para "despesas da casa". Não sei se acredito.`; } },
    { label:"🙈 Deixar pra lá", run:()=>{ const loss = Math.round(Math.max(0,S.money)*c.pct); addMoney(-loss); addStress(8); return "Engoli o prejuízo para não brigar."; } },
  ]},
{ id:"ev_friend_needs", emoji:"🆘", title:"Um amigo precisa de você", age:[14,90], cd:3,
  weight:()=> S.rels.some(r=>r.role==="friend"&&r.alive&&r.rel>=50) && S.money > priceOf(2000) ? 0.8 : 0, cond:()=>!inPrison(),
  setup:()=>{ const f = pick(S.rels.filter(r=>r.role==="friend"&&r.alive&&r.rel>=50)); return { uid:f.uid, amt: Math.round(priceOf(rint(500, 4000))) }; },
  speech:c=> say("Cara, tô numa merda… você pode me ajudar com uma grana? Te pago, juro."),
  text:c=> `${relBy(c.uid).first} pede ${fmt(c.amt)} emprestado.`,
  choices:c=>[
    { label:"💸 Emprestar", run:()=>{ if (!canAfford(c.amt)) return "Não tinha esse dinheiro."; const f = relBy(c.uid); addMoney(-c.amt); f.rel = clamp(f.rel + 12); f.respect = clamp(num(f.respect) + 10); remember_npc(f, "Emprestei dinheiro numa emergência"); schedule("friendRepay", rint(1,4), { uid:f.uid, amt:c.amt, name:f.first }); return `${f.first} ficou emocionado(a).`; } },
    { label:"🙅 Negar", run:()=>{ const f = relBy(c.uid); f.rel = clamp(f.rel - 10); return `${f.first} entendeu… mas ficou chateado(a).`; } },
  ]},
);
/* Fraude descoberta que não foi perdoada: divórcio litigioso e, às vezes, processo criminal. */
function fraudEscalate(c, lied){
  const r = relBy(c.uid); if (!r) return "";
  if (r.role === "spouse") divorce(r, true, c.amt);
  if (chance(lied ? 0.45 : 0.3) && c.amt > priceOf(20000)){ schedule("loveScamCase", 1, { uid:r.uid, name:`${r.first} ${r.last}`, amt:c.amt, p:0.7 }); return ` ${r.first} pediu o divórcio e ainda vai me processar.`; }
  return ` ${r.first} pediu o divórcio.`;
}
