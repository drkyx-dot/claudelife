"use strict";
/* data/careers_ext.js — expansão do mercado de trabalho (v5).
   Novos campos:
     tier        operacional | técnico | corporativo | público | artístico | esportivo | autônomo | executivo
     stable      true = cargo público estável (imune a layoffs de crise)
     volatile    renda varia ±30%/ano (autônomos/comissionados)
     needsLicense exige carteira de motorista */
DATA.majors.push(
  { id:"arch",  name:"Arquitetura e Urbanismo", minInt:55, years:5, cost:11000 },
  { id:"pharm", name:"Farmácia",                minInt:55, years:5, cost:10000 },
  { id:"dent",  name:"Odontologia",             minInt:65, years:5, cost:16000 },
  { id:"vet",   name:"Medicina Veterinária",    minInt:60, years:5, cost:13000 },
);
DATA.techCourses.push({ id:"t_lab", name:"Técnico em Análises Clínicas", cost:2800 });

const TIER_OF = { cashier:"operacional", waiter:"operacional", driver:"autônomo", builder:"operacional", sales:"corporativo", admin:"corporativo",
  electrician:"técnico", ittech:"técnico", nursetech:"técnico", mechanic:"técnico", dev:"corporativo", data:"corporativo", doctor:"corporativo",
  nurse:"técnico", psych:"autônomo", engineer:"corporativo", lawyer:"corporativo", judge:"público", banker:"executivo", accountant:"corporativo",
  manager:"executivo", teacher:"público", professor:"público", journalist:"artístico", designer:"artístico", police:"público", firefighter:"público",
  military:"público", musician:"artístico", actor:"artístico", athlete:"esportivo", influencer:"artístico", chef:"técnico", pilot:"técnico",
  model:"artístico", delegado:"público", politician:"público" };
for (const c of DATA.careers) c.tier = TIER_OF[c.id] || "corporativo";
for (const id of ["teacher","professor","police","firefighter","military","judge","delegado"]) DATA.careers.find(c=>c.id===id).stable = true;
for (const id of ["driver","psych","musician","actor","influencer"]) DATA.careers.find(c=>c.id===id).volatile = true;
DATA.careers.find(c=>c.id==="driver").needsLicense = true;

DATA.careers.push(
  // ---------- operacional ----------
  { id:"cleaner", tier:"operacional", sector:"Serviços", name:"Limpeza e Conservação", edu:0, minInt:0, stat:"health", risk:1,
    levels:[{t:"Auxiliar de Limpeza",s:11500},{t:"Encarregado(a) de Limpeza",s:15500},{t:"Supervisor(a) de Facilities",s:24000}] },
  { id:"security", tier:"operacional", sector:"Segurança/Justiça", name:"Segurança Privada", edu:1, minInt:15, minHealth:45, stat:"health", risk:2, cleanRecord:true,
    levels:[{t:"Vigilante",s:16500},{t:"Vigilante Líder",s:20500},{t:"Supervisor(a) de Segurança",s:30000},{t:"Gerente de Segurança Patrimonial",s:50000}] },
  { id:"warehouse", tier:"operacional", sector:"Logística", name:"Logística e Estoque", edu:1, minInt:15, stat:"health", risk:1,
    levels:[{t:"Auxiliar de Estoque",s:13500},{t:"Conferente",s:17500},{t:"Líder de Estoque",s:25000},{t:"Gerente de Centro de Distribuição",s:55000}] },
  { id:"trucker", tier:"operacional", sector:"Transporte", name:"Caminhoneiro(a)", edu:1, minInt:15, minHealth:40, stat:"health", risk:2, needsLicense:true, volatile:true,
    levels:[{t:"Motorista de Caminhão",s:24000},{t:"Carreteiro(a)",s:32000},{t:"Motorista de Cargas Especiais",s:42000}] },
  { id:"callcenter", tier:"operacional", sector:"Serviços", name:"Telemarketing", edu:2, minInt:20, stat:"intelligence", risk:0,
    levels:[{t:"Operador(a) de Telemarketing",s:12500},{t:"Supervisor(a) de Atendimento",s:19500},{t:"Coordenador(a) de Call Center",s:31000}] },
  { id:"farmhand", tier:"operacional", sector:"Agronegócio", name:"Trabalho Rural", edu:0, minInt:0, minHealth:40, stat:"health", risk:2,
    levels:[{t:"Trabalhador(a) Rural",s:10500},{t:"Capataz",s:17500},{t:"Gerente de Fazenda",s:40000}] },
  // ---------- técnico / autônomo ----------
  { id:"labtech", tier:"técnico", sector:"Saúde", name:"Análises Clínicas", edu:3, tech:"t_lab", minInt:30, stat:"intelligence", risk:0,
    levels:[{t:"Técnico(a) de Laboratório",s:23000},{t:"Técnico(a) Sênior",s:30000},{t:"Supervisor(a) de Laboratório",s:42000}] },
  { id:"barber", tier:"autônomo", sector:"Serviços", name:"Beleza (Barbeiro/Cabeleireiro)", edu:0, minInt:0, stat:"looks", risk:0, volatile:true,
    levels:[{t:"Auxiliar de Salão",s:11000},{t:"Barbeiro(a)/Cabeleireiro(a)",s:21000},{t:"Dono(a) de Salão",s:42000}] },
  { id:"webdesign", tier:"autônomo", sector:"Tecnologia", name:"Web Design Freelancer", edu:2, minInt:45, stat:"intelligence", risk:0, volatile:true,
    levels:[{t:"Freelancer Iniciante",s:15000},{t:"Freelancer com Carteira",s:30000},{t:"Designer Freelancer Sênior",s:55000},{t:"Dono(a) de Estúdio",s:95000}] },
  { id:"realtor", tier:"autônomo", sector:"Comércio", name:"Corretor(a) de Imóveis", edu:2, minInt:30, stat:"looks", risk:0, volatile:true,
    levels:[{t:"Corretor(a) Iniciante",s:14000},{t:"Corretor(a)",s:30000},{t:"Corretor(a) de Alto Padrão",s:65000},{t:"Dono(a) de Imobiliária",s:130000}] },
  { id:"photographer", tier:"autônomo", sector:"Artes/Entretenimento", name:"Fotografia", edu:0, minInt:20, stat:"looks", risk:0, volatile:true,
    levels:[{t:"Fotógrafo(a) de Eventos",s:12000},{t:"Fotógrafo(a) Profissional",s:30000},{t:"Fotógrafo(a) de Moda",s:75000}] },
  { id:"trader", tier:"autônomo", sector:"Finanças", name:"Trader Independente", edu:2, minInt:62, stat:"intelligence", risk:0, volatile:true,
    levels:[{t:"Trader Iniciante",s:9000},{t:"Trader Consistente",s:45000},{t:"Gestor(a) Independente",s:160000}] },
  // ---------- corporativo ----------
  { id:"hr", tier:"corporativo", sector:"Corporativo", name:"Recursos Humanos", edu:4, major:"psy", minInt:45, stat:"looks", risk:0,
    levels:[{t:"Analista de RH",s:36000},{t:"Generalista de RH",s:50000},{t:"Gerente de RH",s:85000},{t:"Diretor(a) de Pessoas",s:165000}] },
  { id:"marketing", tier:"corporativo", sector:"Corporativo", name:"Marketing", edu:4, major:"biz", minInt:45, stat:"looks", risk:0,
    levels:[{t:"Assistente de Marketing",s:28000},{t:"Analista de Marketing",s:44000},{t:"Gerente de Marketing",s:85000},{t:"CMO",s:230000}] },
  { id:"auditor", tier:"corporativo", sector:"Finanças", name:"Auditoria", edu:4, major:"fin", minInt:58, stat:"intelligence", risk:0,
    levels:[{t:"Auditor(a) Trainee",s:42000},{t:"Auditor(a) Sênior",s:72000},{t:"Gerente de Auditoria",s:120000},{t:"Sócio(a) de Auditoria",s:270000}] },
  { id:"architect", tier:"corporativo", sector:"Engenharia", name:"Arquitetura", edu:4, major:"arch", minInt:55, stat:"intelligence", risk:0,
    levels:[{t:"Arquiteto(a) Júnior",s:38000},{t:"Arquiteto(a)",s:58000},{t:"Arquiteto(a) Sênior",s:95000},{t:"Dono(a) de Escritório",s:185000}] },
  { id:"pharmacist", tier:"corporativo", sector:"Saúde", name:"Farmácia", edu:4, major:"pharm", minInt:55, stat:"intelligence", risk:0,
    levels:[{t:"Farmacêutico(a)",s:42000},{t:"Farmacêutico(a) Responsável",s:55000},{t:"Gerente de Rede",s:75000},{t:"Diretor(a) Técnico(a)",s:115000}] },
  { id:"dentist", tier:"corporativo", sector:"Saúde", name:"Odontologia", edu:4, major:"dent", minInt:65, stat:"intelligence", risk:0,
    levels:[{t:"Dentista Clínico(a)",s:48000},{t:"Dentista Especialista",s:95000},{t:"Ortodontista Renomado(a)",s:160000},{t:"Dono(a) de Rede de Clínicas",s:280000}] },
  { id:"vet", tier:"corporativo", sector:"Saúde", name:"Veterinária", edu:4, major:"vet", minInt:60, stat:"intelligence", risk:1,
    levels:[{t:"Veterinário(a)",s:38000},{t:"Veterinário(a) Especialista",s:58000},{t:"Cirurgião(ã) Veterinário(a)",s:88000},{t:"Dono(a) de Hospital Veterinário",s:150000}] },
  // ---------- executivo ----------
  { id:"consultant", tier:"executivo", sector:"Corporativo", name:"Consultoria de Estratégia", edu:5, major:"biz", minInt:68, stat:"intelligence", risk:0,
    levels:[{t:"Consultor(a)",s:85000},{t:"Consultor(a) Sênior",s:135000},{t:"Gerente de Projetos",s:200000},{t:"Sócio(a)",s:480000}] },
  { id:"economist", tier:"executivo", sector:"Finanças", name:"Economia", edu:5, major:"fin", minInt:70, stat:"intelligence", risk:0,
    levels:[{t:"Economista",s:68000},{t:"Economista Sênior",s:110000},{t:"Economista-chefe",s:230000}] },
  // ---------- público (concurso) ----------
  { id:"civil", tier:"público", sector:"Serviço Público", name:"Servidor(a) Administrativo(a)", edu:2, minInt:45, stat:"intelligence", risk:0, exam:true, stable:true, cleanRecord:true,
    levels:[{t:"Técnico(a) Administrativo(a)",s:30000},{t:"Analista Administrativo(a)",s:44000},{t:"Coordenador(a)",s:58000},{t:"Diretor(a) de Departamento",s:82000}] },
  { id:"taxauditor", tier:"público", sector:"Serviço Público", name:"Auditoria Fiscal", edu:4, minInt:70, stat:"intelligence", risk:0, exam:true, stable:true, cleanRecord:true,
    levels:[{t:"Auditor(a) Fiscal",s:115000},{t:"Auditor(a) Fiscal Sênior",s:150000},{t:"Superintendente da Receita",s:195000}] },
  { id:"diplomat", tier:"público", sector:"Serviço Público", name:"Diplomacia", edu:4, minInt:78, stat:"intelligence", risk:0, exam:true, stable:true, cleanRecord:true,
    levels:[{t:"Terceiro(a)-Secretário(a)",s:85000},{t:"Conselheiro(a)",s:135000},{t:"Embaixador(a)",s:220000}] },
  { id:"prosecutor", tier:"público", sector:"Segurança/Justiça", name:"Ministério Público", edu:5, major:"law", minInt:74, stat:"intelligence", risk:0, exam:true, stable:true, cleanRecord:true,
    levels:[{t:"Promotor(a) Substituto(a)",s:150000},{t:"Promotor(a) de Justiça",s:195000},{t:"Procurador(a)-Geral",s:260000}] },
  // ---------- artístico ----------
  { id:"writer", tier:"artístico", sector:"Artes/Entretenimento", name:"Escritor(a)", edu:0, minInt:50, stat:"intelligence", risk:0, fame:2, volatile:true,
    levels:[{t:"Escritor(a) Independente",s:5000},{t:"Autor(a) Publicado(a)",s:24000},{t:"Autor(a) Best-seller",s:210000},{t:"Autor(a) Consagrado(a)",s:900000}] },
  { id:"dj", tier:"artístico", sector:"Artes/Entretenimento", name:"DJ", edu:0, minInt:0, stat:"looks", talent:"music", risk:0, fame:2, volatile:true,
    levels:[{t:"DJ de Festas",s:7000},{t:"DJ Residente",s:30000},{t:"DJ de Festivais",s:180000},{t:"DJ Internacional",s:900000}] },
  { id:"comedian", tier:"artístico", sector:"Artes/Entretenimento", name:"Stand-up Comedy", edu:0, minInt:30, stat:"looks", talent:"acting", risk:0, fame:3, volatile:true,
    levels:[{t:"Comediante de Open Mic",s:5000},{t:"Comediante de Turnê",s:26000},{t:"Especial de Streaming",s:320000},{t:"Lenda do Stand-up",s:1600000}] },
  // ---------- esportivo ----------
  { id:"trainer", tier:"esportivo", sector:"Esporte", name:"Preparação Física", edu:2, minInt:25, minHealth:60, stat:"health", talent:"sport", risk:1,
    levels:[{t:"Personal Trainer",s:16000},{t:"Preparador(a) Físico(a)",s:30000},{t:"Treinador(a) de Atletas",s:65000},{t:"Técnico(a) da Seleção",s:320000}] },
  { id:"fighter", tier:"esportivo", sector:"Esporte", name:"Lutador(a) de MMA", edu:0, minInt:0, minHealth:70, maxStartAge:27, stat:"health", talent:"sport", risk:4, fame:3,
    levels:[{t:"Lutador(a) Amador(a)",s:7000},{t:"Lutador(a) Profissional",s:40000},{t:"Campeão(ã) Nacional",s:260000},{t:"Campeão(ã) Mundial",s:2600000}] },
  { id:"esports", tier:"esportivo", sector:"Esporte", name:"Pro Player de eSports", edu:0, minInt:45, maxStartAge:22, stat:"intelligence", risk:0, fame:2, volatile:true,
    levels:[{t:"Jogador(a) Amador(a)",s:5000},{t:"Pro Player",s:32000},{t:"Estrela do Cenário",s:210000},{t:"Lenda dos eSports",s:1300000}] },
);
