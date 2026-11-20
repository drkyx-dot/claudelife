"use strict";
/* data/world.js */

const DATA = {};

DATA.countries = [
  { id:"BR", name:"Brasil", currency:"BRL", locale:"pt-BR", fx:5.0, col:0.55, wage:0.32, crime:1.3, opp:0.9,
    cities:["São Paulo","Rio de Janeiro","Belo Horizonte","Salvador","Recife","Curitiba","Porto Alegre","Fortaleza","Manaus","Florianópolis","Goiânia","Belém"],
    first:{ m:["Miguel","Arthur","Heitor","Davi","Gabriel","Bernardo","Lucas","Pedro","Rafael","Gustavo","João","Enzo","Matheus","Thiago","Caio","Vinícius","Felipe","Leonardo","Samuel","Otávio"],
            f:["Helena","Alice","Laura","Maria","Valentina","Sophia","Júlia","Isabela","Manuela","Lívia","Beatriz","Luana","Camila","Larissa","Yasmin","Lorena","Clara","Mariana","Giovanna","Rafaela"] },
    last:["Silva","Santos","Oliveira","Souza","Rodrigues","Ferreira","Alves","Pereira","Lima","Gomes","Costa","Ribeiro","Martins","Carvalho","Almeida","Lopes","Barbosa","Rocha","Nascimento","Moreira","Cardoso","Teixeira","Mendes","Araújo"] },
  { id:"PT", name:"Portugal", currency:"EUR", locale:"pt-PT", fx:0.92, col:0.75, wage:0.55, crime:0.6, opp:0.9,
    cities:["Lisboa","Porto","Braga","Coimbra","Faro","Aveiro","Funchal","Setúbal"],
    first:{ m:["Afonso","Duarte","Tomás","Rodrigo","Martim","Diogo","Gonçalo","Salvador","Tiago","Rui","Nuno","Bruno"],
            f:["Leonor","Matilde","Inês","Carolina","Beatriz","Mafalda","Francisca","Margarida","Rita","Joana","Catarina","Sara"] },
    last:["Fernandes","Gonçalves","Pinto","Marques","Correia","Sousa","Cunha","Moura","Antunes","Matos","Vieira","Tavares","Coelho","Faria"] },
  { id:"US", name:"Estados Unidos", currency:"USD", locale:"en-US", fx:1.0, col:1.0, wage:1.0, crime:1.0, opp:1.2,
    cities:["Nova York","Los Angeles","Chicago","Houston","Miami","Seattle","Austin","Boston","Denver","Atlanta"],
    first:{ m:["Liam","Noah","Oliver","James","Elijah","Henry","Lucas","Ethan","Mason","Logan","Jack","Wyatt"],
            f:["Olivia","Emma","Charlotte","Amelia","Ava","Sophia","Mia","Harper","Evelyn","Abigail","Ella","Grace"] },
    last:["Smith","Johnson","Williams","Brown","Jones","Miller","Davis","Wilson","Anderson","Taylor","Moore","Clark","Lewis","Walker"] },
  { id:"JP", name:"Japão", currency:"JPY", locale:"ja-JP", fx:150, col:0.85, wage:0.75, crime:0.3, opp:1.0,
    cities:["Tóquio","Osaka","Kyoto","Yokohama","Sapporo","Fukuoka","Nagoya","Kobe"],
    first:{ m:["Haruto","Sota","Yuto","Riku","Kaito","Ren","Hinata","Takumi","Daiki","Kenji"],
            f:["Himari","Yui","Aoi","Sakura","Hana","Mei","Rin","Yuna","Akari","Saki"] },
    last:["Sato","Suzuki","Takahashi","Tanaka","Watanabe","Ito","Yamamoto","Nakamura","Kobayashi","Kato"] },
  { id:"DE", name:"Alemanha", currency:"EUR", locale:"de-DE", fx:0.92, col:0.95, wage:0.9, crime:0.6, opp:1.05,
    cities:["Berlim","Munique","Hamburgo","Colônia","Frankfurt","Stuttgart","Leipzig","Dresden"],
    first:{ m:["Ben","Paul","Leon","Finn","Elias","Jonas","Noah","Felix","Lukas","Maximilian"],
            f:["Emilia","Hannah","Emma","Sofia","Mia","Lina","Lea","Marie","Clara","Anna"] },
    last:["Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann","Koch","Richter"] },
  { id:"MX", name:"México", currency:"MXN", locale:"es-MX", fx:17, col:0.5, wage:0.3, crime:1.4, opp:0.85,
    cities:["Cidade do México","Guadalajara","Monterrey","Puebla","Cancún","Tijuana","Mérida","Oaxaca"],
    first:{ m:["Santiago","Mateo","Sebastián","Leonardo","Emiliano","Diego","Daniel","Alejandro","Iker","Andrés"],
            f:["Sofía","Valentina","Regina","Camila","Ximena","Renata","Valeria","Fernanda","Daniela","Lucía"] },
    last:["Hernández","García","Martínez","López","González","Pérez","Sánchez","Ramírez","Flores","Torres","Cruz","Morales"] },
  { id:"NG", name:"Nigéria", currency:"NGN", locale:"en-NG", fx:1500, col:0.35, wage:0.15, crime:1.3, opp:0.75,
    cities:["Lagos","Abuja","Kano","Ibadan","Port Harcourt","Benin City","Enugu"],
    first:{ m:["Chinedu","Emeka","Tunde","Olumide","Ibrahim","Femi","Kelechi","Yusuf","Obinna","Seun"],
            f:["Adaeze","Chiamaka","Funmilayo","Ngozi","Aisha","Temitope","Zainab","Ifeoma","Bisi","Amara"] },
    last:["Okafor","Adeyemi","Okonkwo","Balogun","Eze","Bello","Ogunleye","Nwosu","Abubakar","Adebayo"] },
  { id:"IN", name:"Índia", currency:"INR", locale:"en-IN", fx:83, col:0.3, wage:0.18, crime:0.9, opp:0.9,
    cities:["Mumbai","Délhi","Bangalore","Chennai","Hyderabad","Calcutá","Pune","Jaipur"],
    first:{ m:["Aarav","Vihaan","Arjun","Reyansh","Aditya","Krishna","Ishaan","Rohan","Kabir","Dev"],
            f:["Aadhya","Ananya","Diya","Saanvi","Priya","Isha","Kavya","Meera","Riya","Tara"] },
    last:["Sharma","Patel","Singh","Kumar","Gupta","Reddy","Iyer","Nair","Mehta","Joshi","Das","Rao"] },
];

DATA.ethnicities = ["Branca","Parda","Preta","Amarela","Indígena","Mestiça","Árabe","Sul-asiática"];

DATA.eyes = ["castanhos","verdes","azuis","pretos","mel","cinzentos"];

DATA.hair = ["preto","castanho","loiro","ruivo","castanho-claro","cacheado escuro"];

/* Classe socioeconômica (SEMPRE sorteada ao nascer — não é escolhível).
   band 0–4 = faixa usada pelas fórmulas gerais; comfort/status da casa da
   família; uninsured = chance de ficar sem atendimento médico; eduShare =
   parte da faculdade paga pelos pais; weight = frequência ao nascer. */
DATA.classes = [
  { id:0, name:"Miséria Extrema",        band:0, weight:5,  famIncome:2500,     eduBonus:-16, home:"Barraco em área de risco",    allowance:0,     inherit:0,         comfort:0,  status:0,  uninsured:0.55, eduShare:0,   desc:"Fome, trabalho infantil e quase nenhum acesso a saúde." },
  { id:1, name:"Vulnerabilidade Social", band:0, weight:10, famIncome:9000,     eduBonus:-10, home:"Casa improvisada alugada",    allowance:40,    inherit:4000,      comfort:1,  status:0,  uninsured:0.4,  eduShare:0,   desc:"Renda instável, depende de programas sociais." },
  { id:2, name:"Classe Trabalhadora",    band:1, weight:22, famIncome:22000,    eduBonus:-4,  home:"Casa simples alugada",        allowance:200,   inherit:15000,     comfort:3,  status:1,  uninsured:0.2,  eduShare:0.2, desc:"Pais trabalham muito para pagar as contas." },
  { id:3, name:"Classe Média Baixa",     band:1, weight:20, famIncome:38000,    eduBonus:0,   home:"Apartamento financiado",      allowance:450,   inherit:60000,     comfort:4,  status:2,  uninsured:0.12, eduShare:0.4, desc:"Estabilidade frágil: uma crise derruba tudo." },
  { id:4, name:"Classe Média",           band:2, weight:20, famIncome:65000,    eduBonus:4,   home:"Apartamento próprio",         allowance:800,   inherit:150000,    comfort:5,  status:3,  uninsured:0.05, eduShare:0.7, desc:"Escola particular simples e plano de saúde básico." },
  { id:5, name:"Classe Média Alta",      band:2, weight:12, famIncome:120000,   eduBonus:7,   home:"Casa própria com quintal",    allowance:1600,  inherit:420000,    comfort:6,  status:5,  uninsured:0.02, eduShare:0.9, desc:"Viagens de férias, cursinhos e intercâmbio possível." },
  { id:6, name:"Alta Renda",             band:3, weight:7,  famIncome:260000,   eduBonus:10,  home:"Casa de condomínio",          allowance:3500,  inherit:1100000,   comfort:7,  status:6,  uninsured:0,    eduShare:1,   desc:"Melhores escolas, médicos particulares e contatos." },
  { id:7, name:"Elite Empresarial",      band:4, weight:3,  famIncome:1300000,  eduBonus:14,  home:"Mansão da família",           allowance:15000,  inherit:9000000,   comfort:9,  status:9,  uninsured:0,    eduShare:1,   desc:"Sobrenome conhecido, empresas da família e motorista." },
  { id:8, name:"Herdeiro(a) Bilionário(a)",band:4,weight:1, famIncome:12000000, eduBonus:16,  home:"Complexo de mansões e iate",  allowance:80000,  inherit:180000000, comfort:10, status:10, uninsured:0,    eduShare:1,   desc:"Fortuna de gerações. Paparazzi e golpistas te rondam." },
];
DATA.skinTones = [["","Padrão"],["🏻","Clara"],["🏼","Média-clara"],["🏽","Média"],["🏾","Média-escura"],["🏿","Escura"]];
DATA.orientations = { descobrindo:"Em descoberta", hetero:"Heterossexual", homo:"Homossexual", bi:"Bissexual", pan:"Pansexual", ace:"Assexual" };

/* Traços: modificadores aplicados pelo motor via hasTrait(). */
DATA.traits = [
  { id:"ambitious",  name:"Ambicioso",       desc:"+promoções, +estresse",       opp:"lazy" },
  { id:"lazy",       name:"Preguiçoso",      desc:"−desempenho, +felicidade",     opp:"ambitious" },
  { id:"impulsive",  name:"Impulsivo",       desc:"+risco, decisões rápidas",     opp:"cautious" },
  { id:"cautious",   name:"Avesso a Risco",  desc:"−acidentes, −crime",           opp:"impulsive" },
  { id:"resilient",  name:"Resiliente",      desc:"perde menos felicidade",       opp:"anxious" },
  { id:"anxious",    name:"Ansioso",         desc:"+estresse, −entrevistas",      opp:"resilient" },
  { id:"creative",   name:"Criativo",        desc:"+artes, +negócios",            opp:null },
  { id:"charismatic",name:"Carismático",     desc:"+relacionamentos, +fama",      opp:"shy" },
  { id:"shy",        name:"Tímido",          desc:"−namoro, −entrevistas",        opp:"charismatic" },
  { id:"athletic",   name:"Atlético",        desc:"+saúde, +esportes",            opp:null },
  { id:"genius",     name:"Mente Brilhante", desc:"+inteligência ao estudar",     opp:null },
  { id:"frugal",     name:"Econômico",       desc:"−gastos com estilo de vida",   opp:"spendthrift" },
  { id:"spendthrift",name:"Gastador",        desc:"+felicidade, +gastos",         opp:"frugal" },
  { id:"honest",     name:"Íntegro",         desc:"+reputação, crimes pesam mais",opp:null },
];
