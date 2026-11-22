# ClaudiLife — Simulador de Vida (v8)

- **Jogar / desenvolver:** abra `index.html`. O jogo abre no **hub** (menu principal): continuar, vidas salvas (até 6 slots), Hall dos Legados, ajustes e criador de personagem. Ele carrega os módulos de `src/` direto do disco, sem servidor e sem build.
- **Arquivo único para distribuir:** rode `python3 tools/build.py`. O resultado é `dist/claudilife.html`, com todos os módulos embutidos.
- **Teste de estresse:** abra `index.html?selftest`. São 60 vidas completas, verificando `NaN`, valores negativos, invariantes e exceções. O título da aba deve mostrar `SELFTEST OK`.
- **Regressões automáticas no selftest:** `emigrationTest()` (imóvel no Brasil sobrevive à emigração, continua rendendo e pode ser vendido de longe) e `heirTest()` (continuação como herdeiro).
- **Testes v7:** `?unit=identityTest`, `?unit=prisonTest`, `?unit=petTest`, `?unit=classTest` e `?unit=bondsTest`. O `?selftest` roda todos e mostra o veredito no topo da página.
- **Demo de telas:** `?demo=18&ui=hub|create|pets|prison|spouse|beauty`.
- **Testes unitários:** `index.html?unit=combatTest` mostra a tabela de letalidade e 150 lutas por contexto. `?unit=escapeTest` gera puzzles de fuga nas dificuldades 0–8 e os joga com a solução da busca em largura (BFS).
- **Demo de minigames:** `?demo=25&fight=street&art=muaythai:85` abre uma briga. `?demo=25&escape=4` abre uma fuga de segurança máxima.
- **Debug do log:** `index.html?demo=40&dump=cheque|leil` lista as entradas do log que casam com a regex.
- **Sonda de balanceamento:** abra `index.html?balance`. Compara os estilos de vida cuidadoso, negligente e imprudente e testa o antigo exploit de "spam de saúde".
- **Demo:** `index.html?demo=40&tab=health&ev=ev_mentor` pula 40 anos, abre uma aba e mostra um evento.

## Estrutura

```
index.html            entrada de dev; a ORDEM das <script> define o bundle
tools/build.py        empacota tudo em dist/claudilife.html
src/
  styles/             tokens.css (tema/movimento) · layout.css · components.css · animations.css
  data/               catálogos puros: prison (cursos e remição por tipo de crime), pets (19 espécies), classes em 9 níveis (world); world, education, careers, careers_ext (27 profissões novas), combat (artes marciais, golpes, torneios, penas),
                      assets (21 imóveis, 8 aluguéis, 19 veículos), health, crime (12 crimes + organizações),
                      social (personalidades, falas, entrevistas, dicas do loading)
  core/               utils, rng (semente no save), economy (moeda, fxConv multi-país, impostos),
                      bus (on/emit: simulação → som/UI), settings (som, volume, linguagem)
  state/              state.js (S + helpers + sanitize) · invariants.js · persistence.js (slots, Hall dos Legados, migração v3→v7)
  generators/         people.js (NPCs, parceiros) · life.js (nova vida, genética)
  events/             registry.js + catálogos por tema (EVENTS.push): childhood, teen, work,
                      money, danger, relationships, life, prison, health, consequences
  systems/            regras de simulação, uma responsabilidade por arquivo:
    economy.js        ciclo econômico global (expansão/estável/recessão/crise), inflação, índice salarial
    underworld.js     dinheiro sujo, lavagem, organização criminosa (capangas, operações, calor, rivais)
    speech.js         pensamentos e falas contextuais + filtro de linguagem leve
    martial.js        artes marciais: matrícula, treino, maestria/faixas, golpes desbloqueados, torneios
    combat.js         motor de briga por turnos, letalidade, homicídio (polícia, testemunhas, pena, vingança)
    identity.js       descoberta gradual da orientação (inclinações → rótulo escolhido pelo jogador)
    prison.js         pátio, trabalho, cursos, recurso e remição contextual
    bonds.js          amigos úteis, regime de bens, golpes conjugais, partilha no divórcio
    looks.js          estilo, guarda-roupa, skincare, procedimentos, teste de visão, óculos e laser
    pets.js           abrigo, pet shop, mercado exótico, cuidados, risco de ataque
    escape.js         fuga da prisão: gerador de puzzle verificado por BFS, foragido(a), identidade falsa
    modifiers.js      chances contextuais COM explicação (contratação, promoção, crime, cura, eleição, crédito)
    consequences.js   efeitos agendados de escolhas passadas (schedule → CONSEQ[kind])
    aging.js          envelhecimento, vitalidade, estresse (com causas), felicidade de base
    health.js         doenças por estágio, check-up, tratamento, planos, vícios, sequelas, morte
    education · career · politics · business · finance (crédito) · property · relationships
    justice · activities (retornos decrescentes) · world · legacy · events (fila) · sim (tick anual)
  ui/                 hub.js (menu principal e criador) · lifestyle.js (aparência, pets, prisão, casamento) · dom.js (componentes + animações) · sound.js (SoundManager Web Audio) ·
                      feedback.js (loading, +R$ flutuante, balões, ficha de NPC) · render.js · modals.js
                      views/{life,career,assets,rels,health,acts,death}.js · controller.js (objeto UI) ·
                      combat.js (modal de briga, painel de lutas) · escape.js (minigame de fuga)
  dev/selftest.js     selfTest() e balanceReport()
  main.js             boot
```

Os módulos são scripts clássicos que compartilham o escopo global. Por isso funcionam via `file://` e a ordem de carregamento importa: `data → core → state → generators → events → systems → ui → main`.

## Modelo multi-país (v5)
Todo imóvel, veículo, negócio e dívida guarda `country` e o valor na moeda daquele país. O caixa e os investimentos ficam na moeda do país onde você mora. Patrimônio e fluxo de caixa convertem tudo com `fxConv(valor, de, para)`. Ao emigrar, nada é vendido: só o caixa e os investimentos trocam de moeda, e os aluguéis do exterior entram convertidos, com 10% de taxa de administração remota.

## Vida, prisão e relações (v7)
- **Classe social:** é sempre sorteada pelos pesos de `DATA.classes` (9 níveis). As fórmulas antigas usam `clsBand()` (0–4).
- **Orientação:** começa em `"descobrindo"`. Cada evento chama `leanIdentity()`. Depois de 3 vivências, o jogador escolhe o rótulo. Aos 23 anos, o padrão das escolhas define.
- **Remição na prisão:** é `base × DATA.prisonCourses[i].mult[categoria do crime]`. A categoria vem de `crimeCategory()`.
- **Saves:** `saveGame()` grava no slot atual. `recordHall()` roda em `die()`. `NO_PERSIST` bloqueia a escrita em testes e demos.

## Combate e fuga (v6)
- **Toda briga** (rua, assalto, prisão, facção, contrato, vingança, torneio) chama `startFight(kind, ctx)`. A UI abre o modal, e `endFight` aplica as consequências. A letalidade está documentada no topo de `systems/combat.js`.
- **Toda fuga** chama `startEscape()`. Cada etapa só é aceita se `solveStage()` (BFS em posição × tempo × chave) encontrar solução dentro do limite de turnos.
- **Save pela metade:** `S.fight` e `S.escape` ficam no save. Ao recarregar, o modal reabre. Se o jogador avançar o ano, `autoFight` e `autoEscape` resolvem a pendência.

## Como estender

**Novo evento.** Crie ou edite um arquivo em `src/events/`:
```js
EVENTS.push({ id:"ev_meu", emoji:"🎲", title:"Título", age:[18,60],
  weight: () => S.job ? 1.5 : 0,      // 0 = nunca sorteado (só via enqueue)
  cond:   () => !!S.job,              // revalidado antes de exibir (evita contradições)
  cd: 4,                              // cooldown em anos (ou once:true)
  setup: () => ({ valor: priceOf(500) }),
  text: c => `Texto com ${fmt(c.valor)}`,
  choices: c => [
    { label:"Opção A", hint:"dica", run: () => { schedule("meuEfeito", 3, {}, "Isso vai voltar…"); return "Resultado." + fx({ happiness:5, money:-c.valor }); } },
  ]});
```

**Nova consequência futura.** Adicione `CONSEQ.meuEfeito = ctx => { …; return out("texto", "good") }` em `systems/consequences.js`. Revalide o estado dentro do handler.

**Nova chance explicada.** Use `mkOdds(base).add("Fator", delta)…done()` em `systems/modifiers.js` e mostre com `explainOdds(o)`.

**Nova carreira.** Faça `DATA.careers.push({...})`. Os campos opcionais são `minHealth`, `minLooks`, `minAge`, `cleanRecord`, `exam`, `fame`, `talent` e `elected`.

**Nova doença.** Entra em `DATA.illnesses`, com `sev`, `cure`, `cost`, `chronic`, `detect`, `symptoms`, `progress` e `risk:{smoke,alcohol,stress,sedentary,age,lux}`.

**Imóveis, veículos, investimentos, negócios, planos de saúde e vícios** ficam nas listas de `src/data/`.

**Novo golpe.** Adicione em `DATA.moves` com `art`, `req`, `dmg`, `acc`, `ko`, `lethal`, `cost` e `type`. Ele aparece sozinho na briga quando a maestria chegar lá.

**Novo contexto de briga.** Crie um perfil em `DATA.fightProfiles` e um handler em `FIGHT_AFTER` (`systems/combat.js`).

**Nova atividade.** Adicione em `ACTIVITIES` (`systems/activities.js`). Use `sc(valor, id)` para respeitar os retornos decrescentes.

**Nova abordagem (alguém vem até você).** Coloque `ctx.npc` (use `approachNPC()`) e `speech: c => texto` no evento. O modal mostra a ficha e o balão automaticamente. Inclua `investigateChoice(id)` para o jogador poder investigar antes de decidir.

**Novo som.** Adicione uma função em `SFX` (`ui/sound.js`) e chame `Sound.play("nome")`, ou `emit("evento")` a partir da simulação.

**Mudar o formato do save.** Aumente `SAVE_VERSION` e preencha os novos campos em `ensureState()`. A migração roda automaticamente.

**Depois de qualquer mudança:** abra `?selftest` e `?balance`, e então rode `python3 tools/build.py`.

## Estabilidade, idade/país, lado sombrio gradual e perseguição policial
- **Save à prova de falhas:**
  - `normalizeShape()` (`state/state.js`) força o tipo certo de cada campo antes de qualquer uso.
  - `ui/safety.js` transforma cada clique numa transação: se der erro, o estado volta para antes da ação.
  - O save recusa gravar estado inválido e mantém um backup (`.bak`) por slot.
  - Se uma aba falhar ao desenhar, aparece um aviso no lugar da tela em branco.
  - O painel vermelho de erro só aparece com `?debug`.
- **Ano isolado:** cada subsistema do ano (`YEAR_STEPS` em `systems/sim.js`) roda isolado. Um erro num deles é registrado e o ano segue.
- **Idade × país:** `DATA.ageRules` define maioridade, trabalho, direção, bebida e aposta por país. `ageOf()`, `minor()` e `ageReason()` estão em `state.js`.
- **Gastos de menores:** pais pagam via `payBill()` e `costFx()`. A família pobre só tem acesso à rede pública.
- **Lado sombrio:** com 3 mortes, surge a pergunta "está gostando?". Quem diz sim e mata mais 2 vezes chega ao ponto sem volta (`darkOnKill` em `systems/dark.js`).
- **Perseguição:** `sendToPrison(..., { chase:true })` em flagrante ou mandado abre a fuga de rua (`startChase` em `systems/escape.js`). A dificuldade 0–7 vem da pena, da notoriedade, do policiamento do país e da proteção da organização.
- **Texto:** `gtx()` e `gtxPlayer()` (`systems/speech.js`) trocam "preso(a)" pela forma do gênero do personagem, só nas frases sobre ele.
- **Testes novos:**
  - `?fuzz=1200&seed=N` clica em botões reais da interface.
  - `?unit=` com `corruptTest`, `safetyTest`, `chaseTest`, `darkPathTest` e `ageTest`.
  - Demo: `?demo=20&ui=chase`.

## v8: tela cheia, trabalho autônomo, esporte, coleção, armas e lado sombrio
- **Tela cheia (`ui/fullscreen.js`):** usa a Fullscreen API nativa (inclusive o prefixo do Safari) com fallback para o "modo app" (`html.app-mode`). Nesse modo quem rola é o `<body>`, com overscroll travado: sem puxar para atualizar e sem zoom de pinça. Botão no cabeçalho, no hub e no menu; a tecla **F** também alterna.
- **Trabalho autônomo (`systems/gigs.js`):** 11 atividades, incluindo duas adultas (18+) tratadas sem conteúdo explícito. A renda depende de atributos, habilidade, público e ritmo. O trabalho adulto tem riscos próprios: exposição, IST, cliente violento e polícia.
- **Esporte (`systems/sports.js`):** contratos, transferências, lesões, títulos e aposentadoria, com transição para técnico(a), comentarista ou olheiro(a). Há 7 carreiras esportivas novas.
- **Coleção e armas (`systems/collect.js`):** 15 peças de museu (leilão, antiquário ou mercado negro) e 10 armas. As armas viram golpes no combate, exigem porte, deixam rastros e somam pena quando são ilegais.
- **Lado sombrio (`systems/dark.js`):** impulso, suspeita, pistas e disfarce, com caçada em etapas. É uma mecânica abstrata, sem instruções reais.
- **Sons:** `jail` (sirene e grade) e `hospital` (ambulância e bipe), com limite contra sobreposição.
- **Carregamento e tutorial:** o carregamento não pode ser pulado. Depois de cada vida nova vem o tutorial de 5 passos (`ui/tutorial.js`); o guia fica no menu e no hub.
- **Testes:** `?unit=gigTest`, `?unit=sportsTest` e `?unit=darkTest`. Demos: `?demo=18&ui=gig|dark|hunt|tut|collect`.

## Celular, tablet e desktop
- **`src/styles/mobile.css`** (carregado por último):
  - áreas seguras (`env(safe-area-inset-*)`) e altura `100dvh` com fallback;
  - alvos de toque ≥ 44px em `(pointer:coarse)`;
  - modais em folha inferior no celular, com rolagem interna;
  - breakpoints de celular, tablet, paisagem baixa e desktop.
- **`:hover`:** fica todo em `@media (hover:hover)`.
- **`src/ui/device.js`:**
  - `--app-h` para navegadores sem `dvh`;
  - áudio liberado no primeiro toque;
  - save ao ir para o segundo plano;
  - proteção contra toque duplo (`Device.guard`).
- **Fuga:** tocar numa casa vizinha, deslizar o dedo na grade ou usar o direcional.
- **Auditoria:** `?audit` lista estouros de largura, alvos pequenos e campos que causariam zoom no iOS. Rode em várias larguras.
- **App instalável:** `manifest.webmanifest` e `icons/` (ícones gerados em PNG).

## Deploy na Vercel
- **Site estático, sem build:** a Vercel serve `index.html` e `src/` direto. O `vercel.json` só define cabeçalhos de segurança e `cleanUrls`.
- **Ignorados no deploy:** `tools/` e o README (via `.vercelignore`). O arquivo único fica disponível em `/dist/claudilife`.
- **Saves:** ficam no `localStorage` do navegador de cada jogador, por domínio. Mudar de domínio significa começar do zero, a menos que o jogador exporte e importe o save.
