"use strict";
/* =====================================================================
   data/prison.js — cursos, oficinas e atividades da penitenciária.
   mult[cat] = multiplicador de REMIÇÃO conforme o tipo de crime da pena
   (financial, violent, property, drugs, other). perk = o que o curso
   concluído destrava fora (ou dentro) da cadeia.
   ===================================================================== */
DATA.crimeCats = {
  financial:{ name:"crime financeiro/processual", re:/fraude|golpe|estelionat|lavagem|phishing|ransomware|pirâmide|cart[ãa]o|clonag|invas[ãa]o|suborno|desvio|falsidade|ciber|digital|financeir/i },
  violent:  { name:"crime violento",              re:/homic|les[ãa]o|agress|briga|morte|vingan|execu|tentativa de homic/i },
  property: { name:"crime patrimonial",           re:/furt|roub|assalt|carga|carro|resid|celular|carteira|desmanche|contraband|extors/i },
  drugs:    { name:"crime ligado a drogas",       re:/tr[aá]fic|drog|entorpec/i },
  other:    { name:"outros crimes",               re:/./ },
};
DATA.prisonCourses = [
  { id:"law",      emoji:"⚖️", name:"Direito Penal Básico",       minInt:35, mult:{ financial:2.2, other:1.4, property:1.0, drugs:1.0, violent:0.9 }, perk:"Libera o recurso da sentença (revisão criminal)." },
  { id:"therapy",  emoji:"🧠", name:"Terapia e Reabilitação",     minInt:0,  mult:{ violent:2.3, drugs:1.9, property:1.1, other:1.0, financial:0.8 }, perk:"Reduz estresse e vícios; juízes veem mudança real." },
  { id:"workshop", emoji:"🔧", name:"Marcenaria e Mecânica",      minInt:0,  mult:{ property:2.1, drugs:1.3, other:1.1, violent:1.0, financial:0.8 }, perk:"+chance em vagas operacionais depois de solto(a)." },
  { id:"it",       emoji:"💻", name:"Informática e Programação",  minInt:40, mult:{ financial:1.3, other:1.1, property:1.0, drugs:1.0, violent:0.9 }, perk:"+15 de habilidade técnica (cibercrime) e +chance em vagas de tecnologia." },
  { id:"literacy", emoji:"📖", name:"Leitura e Redação",          minInt:0,  mult:{ financial:1.0, other:1.2, property:1.1, drugs:1.1, violent:1.1 }, perk:"+inteligência; remição pela leitura." },
  { id:"finance",  emoji:"📊", name:"Gestão Financeira",          minInt:30, mult:{ financial:1.5, other:1.1, property:1.0, drugs:1.0, violent:0.9 }, perk:"+30 de score de crédito ao sair; administra melhor o dinheiro." },
];
/* Remição base (anos) por sessão. Trabalho: base 0,06 · estudo: 0,07. */
DATA.prisonRemit = { study:0.07, work:0.06 };
/* Chance de êxito de um recurso (com Direito Penal concluído) por tipo de crime. */
DATA.appealOdds = { financial:0.55, other:0.42, property:0.3, drugs:0.28, violent:0.2 };
