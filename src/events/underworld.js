"use strict";
/* events/underworld.js — eventos do crime organizado (todos perguntam ao jogador). */
const crewMember = uid => S.org?.members.find(m => m.uid === uid);
EVENTS.push(
{ id:"ev_police_raid", emoji:"🚨", title:"Operação policial", age:[14,120], weight:0, cond:()=> !!S.org && !inPrison(),
  setup:()=>({ bribe: Math.round(priceOf(15000) * (1 + S.org.heat/40)) }),
  speech:()=> say("Polícia! Todo mundo no chão, porra!"),
  text:c=> `A polícia estourou um ponto de ${S.org.name}. Calor policial: ${Math.round(S.org.heat)}.`,
  choices:c=>[
    { label:"💵 Molhar a mão do delegado", hint:`${fmt(c.bribe)} em dinheiro sujo`, run:()=>{
        if (S.dirty < c.bribe) return "Sem dinheiro sujo suficiente. A propina não rolou." + raidOutcome(0.6);
        S.dirty -= c.bribe; if (chance(0.7)){ S.org.heat = clamp(S.org.heat - 25); return "O inquérito \"se perdeu\". Calor policial caiu."; }
        addNoto(15); return "O delegado era da Corregedoria. Tentativa de suborno virou mais um crime." + raidOutcome(0.8); } },
    { label:"🧍 Deixar um capanga assumir a culpa", hint:"lealdade de todos cai", run:()=>{
        const m = S.org.members.slice().sort((a,b)=>b.loyalty-a.loyalty)[0];
        if (!m) return "Não havia ninguém para assumir." + raidOutcome(0.7);
        S.org.members = S.org.members.filter(x=>x!==m); for (const x of S.org.members) x.loyalty = clamp(x.loyalty - 12);
        S.org.heat = clamp(S.org.heat - 15); return `${m.nick} assumiu tudo e foi preso. Os outros ficaram com medo de serem os próximos.`; } },
    { label:"✈️ Fugir do país", run:()=>{ const dest = pick(DATA.countries.filter(x=>x.id!==P().country)); emigrate(dest.id, true); addNoto(-20); return `Fugi para ${dest.name} na mesma noite.`; } },
    { label:"⚖️ Encarar o processo", run:()=> raidOutcome(0.5) },
  ]},
{ id:"ev_betrayal", emoji:"🐀", title:"Traidor na organização", age:[14,120], weight:0, cond:c=> !!S.org,
  text:c=> `Você descobriu que ${c.nick} (${c.name}) anda conversando com a polícia.`,
  speech:c=> say(`Chefe, o ${c.nick} tá abrindo o bico. Vi ele com os federais, porra.`),
  choices:c=>[
    { label:"🚪 Expulsar e mudar os esquemas", run:()=>{ S.org.members = S.org.members.filter(m=>m.uid!==c.uid); S.org.heat = clamp(S.org.heat + 10); for (const o of S.org.ops) o.years = 0; return `${c.nick} foi expulso. Mudamos rotas e pontos.`; } },
    { label:"💰 Comprar a lealdade dele", run:()=>{ const m = crewMember(c.uid), v = priceOf(8000); if (!m) return "Ele já tinha sumido."; if (S.dirty < v) return "Faltou dinheiro. Ele delatou mesmo assim." + (S.org.heat = clamp(S.org.heat+25), ""); S.dirty -= v; m.loyalty = clamp(m.loyalty + 35); return `${c.nick} recebeu o \"incentivo\" e calou a boca.`; } },
    { label:"🙏 Conversar e perdoar", run:()=>{ const m = crewMember(c.uid); if (m && chance(0.4)){ m.loyalty = clamp(m.loyalty + 25); return "Ele chorou, pediu desculpas e jurou lealdade."; } S.org.heat = clamp(S.org.heat + 30); if (m) S.org.members = S.org.members.filter(x=>x!==m); return "Perdoei… e ele delatou do mesmo jeito. A polícia sabe demais agora."; } },
  ]},
{ id:"ev_rival_war", emoji:"⚔️", title:"Guerra de facções", age:[14,120], weight:0, cond:()=> !!S.org && S.org.rank === DATA.orgRanks.length-1,
  text:c=> `${c.name} quer tomar seus territórios. Poder deles: ${c.power} · seu poder: ${Math.round(orgPower())}.`,
  speech:c=> say("Avisa teu chefe que essa área agora é nossa. Quem não sair, sai no saco."),
  choices:c=>[
    { label:"🥊 Acertar as contas pessoalmente com o chefe deles", hint:"combate mano a mano · pode terminar em morte", run:()=>{ startFight("rival", { rival:c.name }); return `Marquei um encontro sem testemunhas com o chefe de ${c.name}.`; } },
    { label:"🔫 Revidar", hint:`chance ~${Math.round(Math.min(90, orgPower()/(orgPower()+c.power)*100))}%`, run:()=>{
        const win = chance(orgPower()/(orgPower()+c.power)); S.org.heat = clamp(S.org.heat + 20);
        const lost = S.org.members.filter(()=>chance(0.25)); S.org.members = S.org.members.filter(m=>!lost.includes(m));
        const rv = S.org.rivals.find(r=>r.name===c.name);
        if (win){ if (rv){ rv.power = Math.round(rv.power*0.5); rv.hostility = 10; } S.org.territories.push(pick(DATA.territories.filter(t=>!S.org.territories.includes(t))) || "Periferia"); S.org.respect = clamp(S.org.respect+15); return `Vencemos a guerra e tomamos território.${lost.length?` Perdemos ${lost.length} homem(ns).`:""}`; }
        if (S.org.territories.length > 1) S.org.territories.pop(); S.org.ops = S.org.ops.slice(0, Math.max(0, S.org.ops.length-1));
        return `Perdemos a guerra: território e uma operação a menos.${lost.length?` ${lost.length} capanga(s) não voltaram.`:""}` + injure(rint(0,18), "A guerra entre facções", 0.4); } },
    { label:"🤝 Negociar uma trégua", hint:"cede um território", run:()=>{ const rv = S.org.rivals.find(r=>r.name===c.name); if (rv) rv.hostility = 5; if (S.org.territories.length > 1){ const t = S.org.territories.pop(); S.org.ops = S.org.ops.filter(o=>o.territory!==t); return `Cedi ${t} em troca de paz.`; } return "Trégua fechada, por enquanto."; } },
    { label:"💸 Pagar tributo", hint:"dinheiro sujo", run:()=>{ const v = Math.round(priceOf(30000)); if (S.dirty < v) return "Não tinha como pagar. Eles atacaram mesmo assim." + injure(rint(5,15), "O ataque rival", 0.3); S.dirty -= v; const rv = S.org.rivals.find(r=>r.name===c.name); if (rv) rv.hostility = 0; S.org.respect = clamp(S.org.respect - 10); return "Paguei. Os rivais recuaram, mas a rua comentou."; } },
  ]},
{ id:"ev_expansion", emoji:"🗺️", title:"Oportunidade de expansão", age:[18,120], weight:0, cond:()=> isBoss(),
  setup:()=>({ t: pick(DATA.territories.filter(t=>!S.org.territories.includes(t))) || "Zona Rural" }),
  text:c=> `O território ${c.t} ficou sem dono depois de uma operação policial.`,
  choices:c=>[
    { label:"🚩 Ocupar o território", hint:"+renda futura, +calor", run:()=>{ S.org.territories.push(c.t); S.org.heat = clamp(S.org.heat+8); return `Agora ${c.t} é nosso.`; } },
    { label:"⏸️ Não chamar atenção agora", run:()=> "Melhor esperar a poeira baixar." },
  ]},
{ id:"ev_org_task", emoji:"📦", title:"Serviço da organização", age:[14,120], weight:0, cond:()=> !!S.org && !isBoss() && !inPrison(),
  setup:()=>({ task: pick(["levar uma encomenda até o porto","cobrar uma dívida de um comerciante","vigiar um ponto à noite","guardar uma mala por uma semana"]) }),
  speech:c=> say(`O chefe mandou você ${c.task}. Não faz merda.`),
  text:c=> `${S.org.name} te deu uma tarefa: ${c.task}.`,
  choices:c=>[
    { label:"✅ Cumprir a tarefa", run:()=>{ if (chance(0.75 + S.crimeSkill/400)){ S.org.respect = clamp(S.org.respect + rint(6,12)); S.crimeSkill = clamp(S.crimeSkill+2); const g = priceOf(rint(1000,5000)); S.dirty += g; S.stats.dirtyEarned += g; return `Feito. Ganhei respeito e ${fmt(g)} sujos.`; } emit("siren"); if (chance(0.5)){ sendToPrison(rint(1,3), "tráfico de mercadoria ilegal", undefined, { chase:true }); return "Caí numa blitz com a encomenda."; } return "Deu errado e o chefe ficou puto." + (S.org.respect = clamp(S.org.respect-10), ""); } },
    { label:"✋ Recusar", hint:"respeito despenca", run:()=>{ S.org.respect = clamp(S.org.respect - 15); if (chance(0.2)) return "Recusei. Me lembraram, de um jeito nada gentil, quem manda." + injure(8, "O \"recado\" da organização", 0.2); return "Recusei. Fui ficando de escanteio."; } },
    { label:"🚪 Pedir para sair da organização", run:()=> leaveOrg().msg },
  ]},
{ id:"ev_tax_audit", emoji:"🧾", title:"Auditoria da Receita", age:[18,120], weight:0, cond:()=> !inPrison(),
  text:()=> `A Receita Federal estranhou o faturamento dos seus negócios (${fmt(S.stats.laundered)} movimentados).`,
  choices:()=>[
    { label:"🧑‍💼 Contratar tributarista", hint:"caro", run:()=>{ addMoney(-priceOf(15000)); if (chance(0.6)) return "A contabilidade criativa passou pela auditoria."; const fine = Math.round(S.money*0.3); addMoney(-fine); return `Multa pesada de ${fmt(fine)}.`; } },
    { label:"🔥 Queimar os livros e fechar uma fachada", run:()=>{ const f = S.businesses.find(b=>byId(DATA.businesses,b.id).front); if (f) S.businesses = S.businesses.filter(b=>b!==f); addNoto(10); return f ? `Fechei ${f.name} às pressas.` : "Não havia o que fechar."; } },
    { label:"⚖️ Responder ao processo", run:()=> chance(0.4) ? (sendToPrison(rint(2,6), "lavagem de dinheiro"), "Condenado(a) por lavagem de dinheiro.") : "Faltaram provas. Escapei." },
  ]},
);
/* Resultado de uma batida: chance de prisão do jogador + desmonte parcial. */
function raidOutcome(pPrison){
  S.org.ops = S.org.ops.filter(()=>chance(0.6)); S.org.members = S.org.members.filter(()=>chance(0.75)); S.dirty = Math.round(S.dirty * 0.5);
  if (P().age >= 18 && chance(pPrison * (isBoss() ? 1 : 0.6))){ sendToPrison(rint(3, isBoss() ? 15 : 6), "associação criminosa"); return " Fui preso(a)."; }
  S.org.heat = clamp(S.org.heat - 10); return " Perdi operações, capangas e metade do dinheiro sujo, mas escapei.";
}
