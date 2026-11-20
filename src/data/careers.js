"use strict";
/* data/careers.js */

/* Carreiras. edu = nível mínimo; major/tech = diploma exigido (opcional).
   levels = escada de cargos; salary em base anual. stat = atributo-chave. */
DATA.careers = [
  // Serviços / Comércio (sem diploma)
  { id:"cashier", sector:"Comércio", name:"Operador de Caixa", edu:1, minInt:0, stat:"intelligence", risk:0,
    levels:[{t:"Operador de Caixa",s:15000},{t:"Fiscal de Caixa",s:19000},{t:"Supervisor de Loja",s:26000},{t:"Gerente de Loja",s:38000}] },
  { id:"waiter", sector:"Serviços", name:"Garçom", edu:0, minInt:0, stat:"looks", risk:0,
    levels:[{t:"Ajudante de Cozinha",s:13000},{t:"Garçom",s:17000},{t:"Maître",s:25000},{t:"Gerente de Restaurante",s:40000}] },
  { id:"driver", sector:"Serviços", name:"Motorista de Aplicativo", edu:0, minInt:0, stat:"health", risk:1, needsCar:true,
    levels:[{t:"Motorista Iniciante",s:18000},{t:"Motorista Diamante",s:24000},{t:"Motorista Executivo",s:32000}] },
  { id:"builder", sector:"Engenharia", name:"Pedreiro", edu:0, minInt:0, stat:"health", risk:2,
    levels:[{t:"Servente",s:14000},{t:"Pedreiro",s:20000},{t:"Mestre de Obras",s:34000}] },
  { id:"sales", sector:"Comércio", name:"Vendas", edu:2, minInt:20, stat:"looks", risk:0,
    levels:[{t:"Vendedor Júnior",s:20000},{t:"Vendedor",s:28000},{t:"Executivo de Contas",s:48000},{t:"Gerente Comercial",s:85000},{t:"Diretor de Vendas",s:150000}] },
  { id:"admin", sector:"Serviços", name:"Assistente Administrativo", edu:2, minInt:25, stat:"intelligence", risk:0,
    levels:[{t:"Auxiliar Administrativo",s:19000},{t:"Assistente",s:25000},{t:"Analista Administrativo",s:36000},{t:"Coordenador",s:55000}] },
  // Técnicos
  { id:"electrician", sector:"Engenharia", name:"Eletricista", edu:3, tech:"t_elec", minInt:30, stat:"intelligence", risk:1,
    levels:[{t:"Eletricista Auxiliar",s:24000},{t:"Eletricista",s:34000},{t:"Eletricista Industrial",s:48000},{t:"Supervisor Técnico",s:65000}] },
  { id:"ittech", sector:"Tecnologia", name:"Suporte de TI", edu:3, tech:"t_it", minInt:35, stat:"intelligence", risk:0,
    levels:[{t:"Técnico de Suporte",s:26000},{t:"Analista de Suporte",s:36000},{t:"Administrador de Redes",s:55000},{t:"Coordenador de Infra",s:80000}] },
  { id:"nursetech", sector:"Saúde", name:"Técnico de Enfermagem", edu:3, tech:"t_nurse", minInt:30, stat:"health", risk:0,
    levels:[{t:"Técnico de Enfermagem",s:25000},{t:"Técnico Sênior",s:32000},{t:"Supervisor de Plantão",s:42000}] },
  { id:"mechanic", sector:"Engenharia", name:"Mecânico", edu:3, tech:"t_mech", minInt:28, stat:"health", risk:1,
    levels:[{t:"Aprendiz de Mecânico",s:21000},{t:"Mecânico",s:31000},{t:"Chefe de Oficina",s:46000}] },
  // Graduação
  { id:"dev", sector:"Tecnologia", name:"Desenvolvedor de Software", edu:4, major:"cs", minInt:55, stat:"intelligence", risk:0,
    levels:[{t:"Estagiário Dev",s:22000},{t:"Dev Júnior",s:55000},{t:"Dev Pleno",s:85000},{t:"Dev Sênior",s:125000},{t:"Tech Lead",s:165000},{t:"CTO",s:280000}] },
  { id:"data", sector:"Tecnologia", name:"Cientista de Dados", edu:5, major:"cs", minInt:65, stat:"intelligence", risk:0,
    levels:[{t:"Analista de Dados",s:65000},{t:"Cientista de Dados",s:105000},{t:"Cientista Sênior",s:145000},{t:"Head de Dados",s:210000}] },
  { id:"doctor", sector:"Saúde", name:"Médico", edu:4, major:"med", minInt:75, stat:"intelligence", risk:0,
    levels:[{t:"Residente",s:55000},{t:"Médico Clínico",s:140000},{t:"Especialista",s:220000},{t:"Chefe de Departamento",s:320000},{t:"Diretor Clínico",s:420000}] },
  { id:"nurse", sector:"Saúde", name:"Enfermeiro", edu:4, major:"nurse", minInt:45, stat:"health", risk:0,
    levels:[{t:"Enfermeiro",s:52000},{t:"Enfermeiro Sênior",s:68000},{t:"Coordenador de Enfermagem",s:88000}] },
  { id:"psych", sector:"Saúde", name:"Psicólogo", edu:4, major:"psy", minInt:50, stat:"intelligence", risk:0,
    levels:[{t:"Psicólogo Júnior",s:40000},{t:"Psicólogo Clínico",s:62000},{t:"Psicólogo Renomado",s:110000}] },
  { id:"engineer", sector:"Engenharia", name:"Engenheiro", edu:4, major:"eng", minInt:62, stat:"intelligence", risk:0,
    levels:[{t:"Engenheiro Trainee",s:45000},{t:"Engenheiro Júnior",s:65000},{t:"Engenheiro Pleno",s:90000},{t:"Engenheiro Sênior",s:125000},{t:"Diretor de Engenharia",s:200000}] },
  { id:"lawyer", sector:"Direito", name:"Advogado", edu:4, major:"law", minInt:60, stat:"intelligence", risk:0,
    levels:[{t:"Estagiário Jurídico",s:20000},{t:"Advogado Associado",s:70000},{t:"Advogado Sênior",s:120000},{t:"Sócio",s:260000},{t:"Sócio-Diretor",s:450000}] },
  { id:"judge", sector:"Direito", name:"Magistratura", edu:5, major:"law", minInt:75, stat:"intelligence", risk:0, exam:true,
    levels:[{t:"Juiz Substituto",s:150000},{t:"Juiz Titular",s:190000},{t:"Desembargador",s:250000}] },
  { id:"banker", sector:"Finanças", name:"Mercado Financeiro", edu:4, major:"fin", minInt:58, stat:"intelligence", risk:0,
    levels:[{t:"Analista Financeiro",s:60000},{t:"Associado de Investimentos",s:100000},{t:"Gestor de Portfólio",s:180000},{t:"Diretor de Investimentos",s:320000},{t:"Managing Director",s:600000}] },
  { id:"accountant", sector:"Finanças", name:"Contador", edu:4, major:"biz", minInt:45, stat:"intelligence", risk:0,
    levels:[{t:"Assistente Contábil",s:35000},{t:"Contador",s:55000},{t:"Controller",s:95000},{t:"CFO",s:220000}] },
  { id:"manager", sector:"Comércio", name:"Gestão Corporativa", edu:4, major:"biz", minInt:45, stat:"looks", risk:0,
    levels:[{t:"Trainee",s:40000},{t:"Analista de Negócios",s:55000},{t:"Gerente",s:90000},{t:"Diretor",s:170000},{t:"CEO",s:400000}] },
  { id:"teacher", sector:"Serviços", name:"Professor", edu:4, major:"edu", minInt:38, stat:"intelligence", risk:0,
    levels:[{t:"Professor Substituto",s:26000},{t:"Professor",s:36000},{t:"Coordenador Pedagógico",s:48000},{t:"Diretor Escolar",s:62000}] },
  { id:"professor", sector:"Serviços", name:"Professor Universitário", edu:6, minInt:72, stat:"intelligence", risk:0,
    levels:[{t:"Professor Adjunto",s:70000},{t:"Professor Associado",s:95000},{t:"Professor Titular",s:130000}] },
  { id:"journalist", sector:"Artes/Entretenimento", name:"Jornalista", edu:4, major:"arts", minInt:40, stat:"intelligence", risk:0, fame:1,
    levels:[{t:"Repórter Estagiário",s:20000},{t:"Repórter",s:38000},{t:"Editor",s:62000},{t:"Âncora de TV",s:160000}] },
  { id:"designer", sector:"Artes/Entretenimento", name:"Designer", edu:4, major:"arts", minInt:35, stat:"looks", risk:0,
    levels:[{t:"Designer Júnior",s:32000},{t:"Designer",s:48000},{t:"Diretor de Arte",s:85000},{t:"Diretor Criativo",s:150000}] },
  // Segurança / Justiça
  { id:"police", sector:"Segurança/Justiça", name:"Polícia", edu:2, minInt:30, stat:"health", risk:3, cleanRecord:true,
    levels:[{t:"Soldado",s:32000},{t:"Cabo",s:38000},{t:"Sargento",s:46000},{t:"Tenente",s:62000},{t:"Capitão",s:80000},{t:"Coronel",s:110000}] },
  { id:"firefighter", sector:"Segurança/Justiça", name:"Bombeiro", edu:2, minInt:28, stat:"health", risk:3, cleanRecord:true,
    levels:[{t:"Bombeiro Recruta",s:31000},{t:"Bombeiro",s:39000},{t:"Subtenente",s:50000},{t:"Comandante",s:78000}] },
  { id:"military", sector:"Segurança/Justiça", name:"Forças Armadas", edu:2, minInt:25, stat:"health", risk:3, cleanRecord:true,
    levels:[{t:"Recruta",s:24000},{t:"Cabo",s:30000},{t:"Sargento",s:40000},{t:"Tenente",s:58000},{t:"Major",s:85000},{t:"General",s:160000}] },
  // Artes / Entretenimento (sem diploma, guiados por talento)
  { id:"musician", sector:"Artes/Entretenimento", name:"Músico", edu:0, minInt:0, stat:"looks", risk:0, fame:3, talent:"music",
    levels:[{t:"Músico de Bar",s:9000},{t:"Músico Contratado",s:28000},{t:"Artista Revelação",s:90000},{t:"Estrela Nacional",s:600000},{t:"Lenda da Música",s:3500000}] },
  { id:"actor", sector:"Artes/Entretenimento", name:"Ator / Atriz", edu:0, minInt:0, stat:"looks", risk:0, fame:3, talent:"acting",
    levels:[{t:"Figurante",s:8000},{t:"Ator de Teatro",s:25000},{t:"Ator Coadjuvante",s:110000},{t:"Protagonista",s:700000},{t:"Estrela de Hollywood",s:5000000}] },
  { id:"athlete", sector:"Artes/Entretenimento", name:"Atleta Profissional", edu:0, minInt:0, stat:"health", risk:2, fame:3, talent:"sport", maxStartAge:24,
    levels:[{t:"Atleta de Base",s:12000},{t:"Atleta Profissional",s:60000},{t:"Titular da Seleção",s:450000},{t:"Ídolo do Esporte",s:4000000}] },
  { id:"influencer", sector:"Artes/Entretenimento", name:"Criador de Conteúdo", edu:0, minInt:0, stat:"looks", risk:0, fame:3,
    levels:[{t:"Micro-influenciador",s:4000},{t:"Influenciador",s:30000},{t:"Celebridade Digital",s:250000},{t:"Mega Influenciador",s:1500000}] },
];

DATA.partTime = [
  { id:"pt_babysit", name:"Babá / Cuidador", s:5000, minAge:14 },
  { id:"pt_fastfood", name:"Atendente de Fast Food", s:7000, minAge:16 },
  { id:"pt_delivery", name:"Entregador de Bike", s:6500, minAge:16 },
  { id:"pt_tutor", name:"Professor Particular", s:8000, minAge:16, minInt:60 },
];

/* ---------- Expansão: novas carreiras e subcaminhos ----------
   Campos extras lidos por systems/modifiers.js:
     minHealth / minLooks  requisito físico (checado na elegibilidade)
     minAge                idade mínima específica
     elected               cargo por eleição (systems/politics.js) */
DATA.careers.push(
  { id:"chef", sector:"Serviços", name:"Gastronomia", edu:3, tech:"t_cook", minInt:25, stat:"intelligence", risk:1, fame:1,
    levels:[{t:"Cozinheiro de Linha",s:20000},{t:"Sous-chef",s:34000},{t:"Chef de Cozinha",s:60000},{t:"Chef Estrelado",s:180000}] },
  { id:"pilot", sector:"Transporte", name:"Aviação Comercial", edu:3, tech:"t_pilot", minInt:55, minHealth:65, stat:"intelligence", risk:1,
    levels:[{t:"Copiloto",s:70000},{t:"Comandante",s:130000},{t:"Comandante Sênior",s:190000},{t:"Chefe de Frota",s:250000}] },
  { id:"model", sector:"Artes/Entretenimento", name:"Modelo", edu:0, minInt:0, minLooks:75, maxStartAge:26, stat:"looks", risk:0, fame:2,
    levels:[{t:"Modelo Iniciante",s:12000},{t:"Modelo de Catálogo",s:40000},{t:"Modelo de Passarela",s:150000},{t:"Supermodelo",s:1200000}] },
  { id:"delegado", sector:"Segurança/Justiça", name:"Polícia Civil (Delegado)", edu:4, major:"law", minInt:65, minHealth:40, stat:"intelligence", risk:2, cleanRecord:true, exam:true,
    levels:[{t:"Delegado Adjunto",s:95000},{t:"Delegado Titular",s:130000},{t:"Delegado Regional",s:170000},{t:"Chefe de Polícia",s:220000}] },
  { id:"politician", sector:"Política", name:"Carreira Política", edu:2, minInt:35, minAge:21, stat:"looks", risk:0, fame:2, cleanRecord:true, elected:true,
    levels:[{t:"Vereador(a)",s:60000},{t:"Prefeito(a)",s:110000},{t:"Deputado(a)",s:160000},{t:"Governador(a)",s:200000},{t:"Senador(a)",s:230000},{t:"Presidente",s:300000}] },
);
/* requisitos físicos em carreiras existentes */
for (const [id, h] of [["police",45],["firefighter",55],["military",50],["athlete",60],["builder",30]]){
  const c = DATA.careers.find(c => c.id === id); if (c) c.minHealth = h;
}
