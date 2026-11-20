"use strict";
/* =====================================================================
   data/gigs.js — TRABALHO AUTÔNOMO e CARREIRAS ESPORTIVAS.

   Gig (autônomo): base = renda anual de referência (moeda base) no ritmo
   normal com habilidade média; drivers = atributos que multiplicam a renda
   ({ looks:0.6 } → aparência pesa 60%); audience = cresce em clientes/
   assinantes com o tempo; adult = 18+ e regras próprias de exposição e
   risco; req = requisitos. Conteúdo adulto é tratado de forma não
   explícita: só economia, estigma, saúde e segurança.
   ===================================================================== */
DATA.gigs = [
  { id:"delivery",  cat:"Mobilidade",  emoji:"🛵", name:"Entregador(a) de app",          minAge:16, base:9000,  drivers:{ health:0.6 },                         stress:4, risk:"trânsito", desc:"Renda rápida, desgaste físico e risco no trânsito." },
  { id:"rideshare", cat:"Mobilidade",  emoji:"🚗", name:"Motorista de aplicativo",       minAge:18, base:16000, drivers:{ health:0.3 },                         stress:6, risk:"assalto",  req:{ car:true }, desc:"Exige carro e carteira; assaltos acontecem." },
  { id:"photo",     cat:"Criativo",    emoji:"📸", name:"Fotógrafo(a) freelancer",       minAge:16, base:14000, drivers:{ intelligence:0.3, looks:0.2 },        stress:3, audience:true, desc:"Casamentos, eventos e ensaios. Portfólio cresce com o tempo." },
  { id:"design",    cat:"Tecnologia",  emoji:"🎨", name:"Designer freelancer",           minAge:16, base:18000, drivers:{ intelligence:0.5 },                   stress:5, audience:true, req:{ int:45 }, desc:"Clientes internacionais pagam melhor." },
  { id:"dev",       cat:"Tecnologia",  emoji:"💻", name:"Programador(a) freelancer",     minAge:16, base:30000, drivers:{ intelligence:0.8 },                   stress:7, audience:true, req:{ int:58 }, desc:"Alta renda; faculdade de computação ou curso técnico ajudam." },
  { id:"ptrainer",  cat:"Esporte",     emoji:"🏋️", name:"Personal trainer autônomo",     minAge:18, base:15000, drivers:{ health:0.5, looks:0.2 },              stress:3, audience:true, req:{ health:60 }, desc:"Clientes fiéis rendem bem; precisa estar em forma." },
  { id:"street",    cat:"Arte",        emoji:"🎸", name:"Artista de rua",                minAge:12, base:4000,  drivers:{ talent:0.8 },                         stress:2, desc:"Música ou performance na praça. Pode viralizar." },
  { id:"streamer",  cat:"Mídia",       emoji:"🎮", name:"Streamer / criador(a) de conteúdo", minAge:14, base:6000, drivers:{ looks:0.3, intelligence:0.2, fame:0.6 }, stress:5, audience:true, viral:true, desc:"Começa quase sem renda; seguidores trazem fama e dinheiro." },
  { id:"consult",   cat:"Negócios",    emoji:"📊", name:"Consultor(a) independente",     minAge:24, base:42000, drivers:{ intelligence:0.5, reputation:0.5 },   stress:7, audience:true, req:{ edu:4 }, desc:"Exige diploma; reputação traz contratos grandes." },
  { id:"adult",     cat:"Adulto (18+)",emoji:"🔞", name:"Criador(a) de conteúdo adulto (assinaturas)", minAge:18, base:12000, drivers:{ looks:0.9, fame:0.5 }, stress:6, audience:true, adult:true,
    desc:"Renda por assinantes, sem teto. Risco de exposição, estigma e impacto nas relações e em empregos formais." },
  { id:"escort",    cat:"Adulto (18+)",emoji:"🌙", name:"Acompanhante (programas)",      minAge:18, base:22000, drivers:{ looks:0.9 },                          stress:10, adult:true, danger:true,
    desc:"Renda alta e imediata. Riscos reais: ISTs, clientes violentos, polícia (onde é ilegal) e estigma." },
];
/* Ritmo de trabalho autônomo: multiplica renda, estresse e riscos. */
DATA.gigPace = [
  { id:0, name:"Leve",    income:0.55, stress:0.5, risk:0.6 },
  { id:1, name:"Normal",  income:1.0,  stress:1.0, risk:1.0 },
  { id:2, name:"Intenso", income:1.55, stress:1.8, risk:1.5 },
];
/* Legalidade da prostituição por país (simplificado): legal | tolerada | ilegal */
DATA.escortLaw = { BR:"tolerada", PT:"tolerada", DE:"legal", US:"ilegal", JP:"ilegal", MX:"tolerada", NG:"ilegal", IN:"ilegal" };

/* IST adquirida no trabalho de acompanhante (nunca sorteada por acaso: manual). */
DATA.illnesses.push({ id:"ist", name:"Infecção sexualmente transmissível (IST)", sev:5, cure:0.85, cost:900, chronic:false, detect:0.8, symptoms:1, progress:0.25, minAge:16, manual:true, risk:{} });

/* ---------- Carreiras esportivas (athlete:true → contratos, lesões, títulos, aposentadoria) ---------- */
for (const id of ["athlete","fighter","esports"]){ const c = DATA.careers.find(x => x.id === id); if (c) c.athlete = true; }
DATA.careers.push(
  { id:"football", tier:"esportivo", sector:"Esporte", name:"Futebol profissional", edu:0, minInt:0, minHealth:65, maxStartAge:21, stat:"health", talent:"sport", risk:3, fame:3, athlete:true, volatile:true,
    levels:[{t:"Atleta da base",s:6000},{t:"Jogador(a) da Série B",s:38000},{t:"Jogador(a) da Série A",s:190000},{t:"Convocado(a) para a Seleção",s:1100000},{t:"Lenda do futebol",s:7000000}] },
  { id:"basketball", tier:"esportivo", sector:"Esporte", name:"Basquete profissional", edu:0, minInt:0, minHealth:65, maxStartAge:22, stat:"health", talent:"sport", risk:2, fame:3, athlete:true, volatile:true,
    levels:[{t:"Atleta universitário(a)",s:8000},{t:"Jogador(a) da liga nacional",s:45000},{t:"Estrela da liga",s:280000},{t:"Jogador(a) da liga norte-americana",s:3500000}] },
  { id:"coach", tier:"esportivo", sector:"Esporte", name:"Técnico(a) / Treinador(a)", edu:2, minInt:40, minAge:24, stat:"intelligence", risk:0, fame:1,
    levels:[{t:"Auxiliar técnico(a)",s:22000},{t:"Técnico(a) das categorias de base",s:38000},{t:"Técnico(a) profissional",s:160000},{t:"Técnico(a) da Seleção",s:950000}] },
  { id:"scout", tier:"esportivo", sector:"Esporte", name:"Olheiro(a) / Scout", edu:2, minInt:45, minAge:22, stat:"intelligence", risk:0,
    levels:[{t:"Olheiro(a) regional",s:18000},{t:"Olheiro(a) nacional",s:34000},{t:"Chefe de scouting",s:70000},{t:"Diretor(a) de recrutamento",s:140000}] },
  { id:"referee", tier:"esportivo", sector:"Esporte", name:"Arbitragem", edu:2, minInt:40, minHealth:55, minAge:20, stat:"health", risk:1,
    levels:[{t:"Árbitro(a) regional",s:14000},{t:"Árbitro(a) da federação",s:38000},{t:"Árbitro(a) da elite nacional",s:90000},{t:"Árbitro(a) FIFA",s:170000}] },
  { id:"commentator", tier:"esportivo", sector:"Esporte", name:"Comentarista esportivo(a)", edu:4, major:"arts", minInt:45, stat:"looks", risk:0, fame:2,
    levels:[{t:"Repórter de rádio",s:20000},{t:"Comentarista de TV fechada",s:60000},{t:"Comentarista de TV aberta",s:180000},{t:"Narrador(a) estrela",s:520000}] },
  { id:"clubgm", tier:"esportivo", sector:"Esporte", name:"Gestão de clube", edu:4, major:"biz", minInt:55, minAge:26, stat:"intelligence", risk:0, fame:1,
    levels:[{t:"Gerente de futebol",s:60000},{t:"Diretor(a) esportivo(a)",s:170000},{t:"CEO de clube",s:420000},{t:"Presidente de clube",s:900000}] },
);
DATA.clubNames = ["Atlético Central","Esporte Clube União","Real Horizonte","Sport Litoral","Grêmio da Serra","Clube Náutico do Porto","Inter Metropolitano","Juventus da Vila","FC Estrela","Dynamo do Norte","Olympique do Sul","Sporting da Capital"];
