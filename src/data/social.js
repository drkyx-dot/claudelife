"use strict";
/* data/social.js — personalidades de NPC, falas, entrevistas e dicas.
   Linguagem: falas são realistas e podem conter palavrões leves/moderados.
   O filtro "linguagem leve" (menu) troca palavrões por equivalentes (SOFTEN). */
DATA.personalities = [
  { id:"loyal",     name:"Leal",           desc:"Fica do seu lado nas horas difíceis", loyalty:20 },
  { id:"greedy",    name:"Interesseiro(a)",desc:"Gosta mais do seu dinheiro do que de você", loyalty:-15, scam:0.25 },
  { id:"hothead",   name:"Explosivo(a)",   desc:"Briga fácil, faz as pazes fácil", loyalty:0, conflict:0.3 },
  { id:"generous",  name:"Generoso(a)",    desc:"Ajuda sem pedir nada em troca", loyalty:10 },
  { id:"gossip",    name:"Fofoqueiro(a)",  desc:"Seus segredos não estão seguros", loyalty:-5, snitch:0.15 },
  { id:"calm",      name:"Tranquilo(a)",   desc:"Paciência de monge", loyalty:5 },
  { id:"ambitious", name:"Ambicioso(a)",   desc:"Quer subir na vida a qualquer custo", loyalty:-5 },
  { id:"schemer",   name:"Manipulador(a)", desc:"Sempre tem uma segunda intenção", loyalty:-20, scam:0.4, snitch:0.2 },
  { id:"funny",     name:"Engraçado(a)",   desc:"Faz qualquer dia ruim ficar melhor", loyalty:5 },
  { id:"shy",       name:"Reservado(a)",   desc:"Fala pouco, observa muito", loyalty:5 },
];
DATA.wealthLevels = ["Quebrado(a)","Apertado(a)","Estável","Confortável","Rico(a)"];

/* Suavização de palavrões (modo "linguagem leve"). Ordem importa (expressões antes). */
DATA.SOFTEN = [
  [/puta que pariu/gi,"nossa senhora"],[/filho da puta/gi,"desgraçado"],[/vai se foder/gi,"vai catar coquinho"],
  [/caralho/gi,"caramba"],[/porra/gi,"poxa"],[/merda/gi,"droga"],[/fodid([oa])/gi,"ferrad$1"],[/foda/gi,"complicado"],
  [/cacete/gi,"caramba"],[/bosta/gi,"porcaria"],[/puta/gi,"baita"],
];

/* Pensamentos do personagem (balão na tela principal), por contexto. */
DATA.thoughts = {
  baby:      ["Gu gu dá dá.","Cadê a mamadeira?","Esse mundo é enorme."],
  child:     ["Quando eu crescer vou ser astronauta.","Por que adulto vive cansado?","Amanhã tem prova… que preguiça."],
  teen:      ["Ninguém me entende nessa casa.","Preciso de um celular novo, porra.","Será que ela(e) me notou hoje?","Quero sair daqui logo."],
  broke:     ["Tô quebrado, caralho. Preciso arrumar grana.","Fim do mês chegando e a conta não fecha.","Miojo de novo… que merda de vida."],
  debt:      ["Esses juros tão me matando.","O banco liga mais que minha mãe.","Se eu não pagar essa dívida, perco tudo."],
  rich:      ["Dinheiro não traz felicidade… mas ajuda pra caramba.","Será que meus amigos gostam de mim ou da minha grana?","Preciso de um contador melhor."],
  stressed:  ["Não aguento mais essa pressão.","Minha cabeça vai explodir, porra.","Preciso de férias. Urgente."],
  sick:      ["Meu corpo não é mais o mesmo.","Esse remédio tá me derrubando.","Tenho medo do próximo exame."],
  prison:    ["Mais um dia nessa cela fedida.","Quando sair daqui, vou mudar de vida. Juro.","Aqui dentro, confiança é moeda rara."],
  wanted:    ["Toda viatura que passa, meu coração para.","Não posso confiar em ninguém. Ninguém.","Um dia vão bater na minha porta. Eu sei.","Troquei de nome, mas não de passado."],
  guilt:     ["Ainda vejo o rosto dele quando fecho os olhos.","Era pra ser só uma briga, porra…","Tem coisa que dinheiro nenhum apaga.","Às vezes acordo suando, ouvindo o barulho da queda."],
  fighter:   ["Mais um treino, mais um passo rumo ao cinturão.","Disciplina vence talento quando o talento não treina.","Meu corpo dói, mas a técnica tá afiando.","Quem treina luta não procura briga. Mas sabe terminar uma."],
  unemployed:["Mais um currículo ignorado.","Ninguém responde as entrevistas, que merda.","Preciso de qualquer trampo."],
  love:      ["Tô apaixonado(a), que coisa boa.","Chegar em casa e ter alguém esperando… vale tudo."],
  lonely:    ["Sábado à noite sozinho(a) de novo.","Às vezes queria alguém pra conversar."],
  crime:     ["Um vacilo e eu tô fodido.","A polícia tá de olho, preciso maneirar.","Dinheiro fácil, sono difícil."],
  old:       ["No meu tempo as coisas eram diferentes.","Meus joelhos preveem chuva melhor que o jornal.","Será que fiz o suficiente?"],
  happy:     ["A vida tá boa, viu.","Hoje acordei de bem com o mundo.","Gratidão, sem ironia."],
  work:      ["Segunda-feira de novo…","Meu chefe é um pé no saco.","Se eu bater a meta, essa promoção sai."],
};
/* Comentários de NPCs por papel (balão secundário). {me} = nome do jogador. */
DATA.npcLines = {
  mother:  ["Tá se alimentando direito, {me}?","Liga pra sua mãe de vez em quando, viu?","Tô orgulhosa de você."],
  father:  ["Dinheiro não nasce em árvore, {me}.","Na sua idade eu já trabalhava.","Se precisar, conta comigo."],
  partner: ["Bora jantar fora hoje?","Você anda distante… tá tudo bem?","Te amo, sabia?"],
  friend:  ["Porra, {me}, sumiu! Bora tomar uma?","Cara, tenho uma fofoca daquelas.","Tamo junto, sempre."],
  child:   ["Pai/mãe, me dá dinheiro?","Hoje na escola foi um saco.","Quero ser igual a você quando crescer."],
  boss:    ["Preciso daquele relatório pra ontem.","Bom trabalho essa semana.","Vamos conversar sobre suas metas."],
  crew:    ["Chefe, a polícia rondou o ponto hoje.","Tá tudo sob controle… por enquanto.","Os caras do outro lado tão crescendo o olho."],
};
/* Falas de abordagem (o NPC chega até você). */
DATA.approachLines = {
  date:      ["Oi… desculpa a ousadia, mas te achei interessante pra caramba. Topa sair comigo?","Você vem sempre aqui? Brincadeira… mas sério, bora tomar um café?"],
  friend:    ["Pô, a gente sempre se esbarra por aí. Bora trocar contato?","Você parece gente boa. Cola com a gente no fim de semana!"],
  crime:     ["Tenho um esquema que rende uma grana boa e rápida. Tá dentro ou vai ficar de mimimi?","Ouvi falar de você. Tá precisando de dinheiro? Tenho um trampo… diferente."],
  loan:      ["Cara, tô fodido. Me empresta uma grana? Juro que devolvo.","Que vergonha pedir isso… mas tô precisando de ajuda com as contas."],
  partner:   ["Tenho uma ideia de negócio que vai bombar. Só falta um sócio com capital.","Bora abrir um negócio juntos? Eu entro com o trabalho, você com a grana."],
  conflict:  ["Ô, você aí! Tá me encarando por quê, porra?","Seu carro tá na minha vaga de novo, caralho."],
  job:       ["Vi seu perfil e gostei. Temos uma vaga que é a sua cara.","A gente tá montando um time e pensei em você."],
};

/* Entrevista de emprego: perguntas comuns e de setor. Cada opção ajusta a chance.
   eff(c) → delta de probabilidade (pode depender de atributos/traços). */
DATA.interview = [
  { q:"Fale um pouco sobre você.", opts:[
    { t:"Resumo objetivo da minha trajetória.", eff:()=> 0.04 + (P().stats.intelligence-50)/500 },
    { t:"Conto minha história de vida inteira.", eff:()=> hasTrait("charismatic") ? 0.03 : -0.06 },
    { t:"\"Sou um cara/uma mina foda, pode confiar.\"", eff:()=> hasTrait("charismatic") ? 0.02 : -0.1 } ] },
  { q:"Qual é o seu maior defeito?", opts:[
    { t:"Sou perfeccionista demais.", eff:()=> -0.03 },
    { t:"Admito um defeito real e como lido com ele.", eff:()=> 0.07 },
    { t:"Não tenho defeitos.", eff:()=> -0.09 } ] },
  { q:"Por que deveríamos contratar você?", opts:[
    { t:"Mostro resultados concretos da minha experiência.", eff:c=> S.jobHistory.length || S.job ? 0.08 : -0.02 },
    { t:"Falo da minha formação.", eff:c=> S.edu.level >= c.edu + 1 ? 0.06 : 0.01 },
    { t:"Digo que preciso muito do emprego.", eff:()=> -0.04 } ] },
  { q:"Qual sua pretensão salarial?", opts:[
    { t:"Peço a média de mercado.", eff:()=> 0.03 },
    { t:"Peço 30% acima — me valorizo.", eff:()=> P().reputation > 60 ? 0.02 : -0.08, raise:0.15 },
    { t:"Aceito o que vocês oferecerem.", eff:()=> 0.05, raise:-0.1 } ] },
  { q:"Onde você se vê daqui a 5 anos?", opts:[
    { t:"Crescendo dentro da empresa.", eff:()=> 0.05 },
    { t:"Com meu próprio negócio.", eff:()=> -0.05 },
    { t:"Sinceramente? Não faço ideia.", eff:()=> hasTrait("honest") ? 0.01 : -0.06 } ] },
  { q:"Conte sobre um conflito com um colega.", opts:[
    { t:"Explico como resolvi conversando.", eff:()=> 0.06 },
    { t:"Culpo o colega — ele era um babaca.", eff:()=> -0.08 },
    { t:"Digo que nunca tive conflitos.", eff:()=> -0.02 } ] },
];

DATA.tips = [
  "Na briga, o modo 🎯 Controlado usa sua maestria para DOSAR a força: faixa-preta quase nunca mata sem querer.",
  "💢 Com tudo anula o controle: o dano sobe, e a chance de matar alguém triplica.",
  "Golpes especiais (Mata-Leão, Chute Alto na Têmpora…) aparecem conforme você treina na Academia de Lutas.",
  "Treino intenso rende quase o dobro de maestria, mas lesiona bem mais, ainda mais depois dos 50.",
  "Na fuga da prisão, nunca pise em casas vermelhas (vigiadas agora) nem laranjas (vigiadas no próximo turno).",
  "Câmeras giram a cada 2 turnos. Às vezes, esperar ⏸ é o melhor movimento.",
  "Foragido(a)? Identidade falsa e morar em outro país derrubam muito a chance de recaptura.",
  "Matar alguém sempre deixa rastros: testemunhas, investigação e família querendo vingança.",
  "Check-up anual detecta doenças cedo — e cedo é muito mais barato.",
  "Cheque especial derruba seu score de crédito. Juros de banco não perdoam.",
  "Imóveis no exterior continuam rendendo aluguel mesmo depois que você emigra.",
  "Inquilino inadimplente acontece. Reserve dinheiro para vacância e reformas.",
  "Em recessão, demissões triplicam. Ter reserva de emergência salva vidas.",
  "Dinheiro sujo precisa ser lavado por um negócio de fachada antes de ser gasto.",
  "Capangas com lealdade baixa são os primeiros a delatar.",
  "Repetir a mesma atividade no ano rende cada vez menos.",
  "Reputação profissional pesa em entrevistas e eleições.",
  "Antecedentes criminais fecham portas de concursos públicos.",
  "Toda proposta que chega até você pode ser investigada antes de aceitar.",
  "Estresse alto desgasta saúde, relacionamentos e desempenho.",
];
