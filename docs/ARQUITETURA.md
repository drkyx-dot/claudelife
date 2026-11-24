# Arquitetura do ClaudiLife

Este documento explica como o código funciona e como estendê-lo. Para a visão geral do jogo, veja o [README](../README.md).

## Princípios

- **Zero dependências e zero build para rodar.** JavaScript puro em scripts clássicos, que compartilham o escopo global. O jogo abre direto pelo `index.html`, inclusive via `file://`, sem servidor nem bundler.
- **Ordem de carregamento é a fonte da verdade.** A ordem das tags `<script>` no `index.html` define as dependências, sempre nesta sequência: `data → core → state → generators → events → systems → ui → dev → main`. O `tools/build.py` lê essa ordem para gerar o arquivo único.
- **Estado único.** Toda a vida atual está em `S`, um objeto serializável (JSON). Salvar é gravar `S`; carregar é ler `S` e normalizar.
- **Simulação separada da interface.** Os sistemas não tocam no DOM. Eles avisam o que aconteceu por um barramento de eventos (`emit`), e a interface e o áudio reagem (`on`).
- **Aleatoriedade reprodutível.** O RNG (mulberry32) guarda a semente dentro do save, então a mesma vida carregada segue a mesma sequência aleatória.

## Estrutura de pastas

```
index.html              entrada; a ordem dos <script> define o bundle
manifest.webmanifest    app instalável (PWA) · icons/ ícones PNG
tools/build.py          gera dist/claudilife.html (tudo embutido num arquivo)
vercel.json             cabeçalhos de segurança para o deploy estático
docs/                   esta documentação e as capturas de tela
src/
  data/        catálogos puros (sem lógica)
    world         países, cidades, nomes, 9 classes sociais, regras de idade por país
    education     cursos superiores e técnicos
    careers       carreiras base · careers_ext: profissões extras e esporte
    assets        imóveis, aluguéis, veículos, investimentos, negócios, presentes
    health        doenças, estágios, tratamentos, planos, vícios
    crime         crimes (inclusive digitais) e crime organizado
    combat        artes marciais, golpes, torneios, perfis de briga, penas por país
    prison        cursos da prisão e remição por tipo de crime
    pets          19 espécies (abrigo, pet shop, mercado exótico)
    gigs          trabalhos autônomos e carreiras esportivas
    collect       colecionáveis, armas, porte por país, alvos do lado sombrio
    social        personalidades, falas, pensamentos, entrevistas, dicas
  core/        utils, rng (semente no save), economy (moedas e câmbio), bus (on/emit), settings
  state/       state (S, helpers, normalização e migração) · invariants · persistence (slots, backup, hall)
  generators/  people (NPCs) · life (nova vida, genética, família)
  events/      catálogos de eventos por tema (EVENTS.push)
  systems/     regras de simulação, uma responsabilidade por arquivo (lista abaixo)
  ui/          interface: render, modais, views/ (uma por aba), hub, minigames, som, tela cheia, segurança
  styles/      tokens (tema) · layout · components · animations · game · mobile (carregado por último)
  dev/         selftest (simulação em massa e testes) · fuzz (cliques reais, saves corrompidos)
  main.js      boot e modos de teste/demonstração
```

### Sistemas (`src/systems/`)

| Arquivo | Responsabilidade |
|---|---|
| `sim.js` | Tick anual: roda cada subsistema na ordem de `YEAR_STEPS`, de forma isolada |
| `economy.js` | Ciclo econômico global (expansão, estável, recessão, crise), inflação e índice salarial |
| `aging.js` | Envelhecimento, vitalidade, estresse (com causas) e felicidade de base |
| `health.js` | Doenças por estágio, check-up, tratamento, planos, vícios, sequelas e morte |
| `education.js` · `career.js` · `politics.js` | Escola e faculdade, emprego e promoção, eleições |
| `gigs.js` · `sports.js` | Trabalho autônomo; vida de atleta (contratos, lesões, títulos, aposentadoria) |
| `finance.js` · `property.js` · `business.js` · `collect.js` | Crédito e dívidas, imóveis e veículos multi-país, negócios, coleção e armas |
| `relationships.js` · `bonds.js` · `identity.js` | Família e romance; amigos úteis, regime de bens e golpes; descoberta da orientação |
| `justice.js` · `prison.js` · `escape.js` | Crimes e prisão; remição por cursos; fuga da prisão e perseguição policial |
| `underworld.js` · `dark.js` | Organização criminosa e lavagem; o arco do lado sombrio |
| `combat.js` · `martial.js` | Motor de briga por turnos e letalidade; artes marciais e torneios |
| `looks.js` · `pets.js` | Aparência, visão e procedimentos; animais de estimação |
| `world.js` · `legacy.js` | Emigração; morte, herança, título final e hall dos legados |
| `modifiers.js` · `consequences.js` · `speech.js` | Chances explicadas; efeitos agendados no futuro; falas e gênero no texto |
| `events.js` · `activities.js` | Fila e sorteio de eventos; atividades pessoais com rendimento decrescente |

## Fluxo de um ano

1. O jogador toca em **Envelhecer 1 ano**, e `UI.ageUp()` chama `ageUp()` (`systems/sim.js`).
2. **Subsistemas em ordem fixa.** `YEAR_STEPS` roda economia, envelhecimento, escola, carreira, esporte, autônomo, lutas, negócios, ativos, coleção, finanças, organização, relações, identidade, aparência, pets, saúde, prisão, foragido, lado sombrio, consequências e marcos. Cada passo lê o que os anteriores produziram. Um erro num passo é registrado e o ano continua.
3. **Morte.** `deathCheck()` decide se o personagem morreu. A morte também pode ser forçada por um evento, como um ataque de animal ou erro médico.
4. **Eventos.** `queueEvents()` sorteia de 0 a 2 eventos, respeitando idade, condições e cooldown, e a interface os apresenta como modais de decisão.
5. **Salvamento.** O estado é salvo no slot atual, depois de validado.

## Eventos

```js
EVENTS.push({ id:"ev_meu", emoji:"🎲", title:"Título", age:[18,60],
  weight: () => S.job ? 1.5 : 0,      // 0 = nunca sorteado (só via enqueue)
  cond:   ctx => !!S.job,             // revalidado antes de exibir (evita contradições)
  cd: 4,                              // cooldown em anos (ou once:true)
  setup: () => ({ valor: priceOf(500), npc: approachNPC("acquaintance") }),
  speech: c => "Fala da pessoa (vira um balão)",
  text: c => `Texto com ${fmt(c.valor)}`,
  choices: c => [
    { label:"Opção A", hint:"dica", run: () => { schedule("meuEfeito", 3, {}, "Isso vai voltar…"); return "Resultado." + costFx(c.valor, "a conta"); } },
    investigateChoice("ev_meu"),
  ]});
```

- `costFx(valor, "o quê")` cobra uma despesa. Se o personagem é menor de idade, os pais pagam.
- `schedule()` agenda uma consequência futura. O efeito em si vai em `CONSEQ.meuEfeito = ctx => …`, em `systems/consequences.js`.
- `ctx.npc` faz o modal exibir a ficha da pessoa, e `speech` vira um balão de fala.

## Mecânicas com fórmula documentada

Cada arquivo abaixo traz a fórmula comentada no topo:

- **Letalidade dos golpes:** `systems/combat.js`. O poder cresce com força e maestria, mas a maestria também dá controle. O modo "Com tudo" anula esse controle.
- **Fuga e perseguição:** `systems/escape.js`. A grade é gerada e verificada por busca em largura (BFS) no espaço posição × tempo × chave, então nunca existe puzzle sem saída.
- **Remição de pena:** `systems/prison.js`. A redução depende do curso e da categoria do crime.
- **Renda autônoma:** `systems/gigs.js`. Combina atributos, habilidade, público e ritmo.
- **Risco de ataque de animais:** `systems/pets.js`. Sobe com fome, estresse, falta de espaço e anos de descuido.
- **Suspeita policial do lado sombrio:** `systems/dark.js`. Vem das pistas e é reduzida pelo disfarce de uma vida normal.

## Save, migração e segurança

- **Slots:** cada vida fica em `localStorage["claudilife.slot.<id>"]`, e o índice fica em `claudilife.slots` (até 6 vidas). Mortes ficam registradas em `claudilife.hall`.
- **Migração:** ao carregar, `normalizeShape()` força o tipo certo de cada campo e `ensureState()` preenche os padrões. Saves antigos e incompletos continuam abrindo.
- **Transações:** `ui/safety.js` envolve cada função de interface. Se houver erro, o estado volta ao de antes da ação.
- **Proteção do save:** o save recusa gravar estado inválido e mantém um backup do ano anterior (`.bak`), usado se o principal estiver estragado.
- **Abas:** se uma aba falhar ao desenhar, aparece um aviso no lugar dela.
- **Erros visíveis:** o painel vermelho só aparece com `?debug`.

## Como estender

| Quero adicionar | Onde |
|---|---|
| Carreira | `DATA.careers.push({...})`. Campos opcionais: `minHealth`, `minLooks`, `minAge`, `cleanRecord`, `exam`, `fame`, `talent`, `elected`, `athlete` |
| Doença | `DATA.illnesses`, com `sev`, `cure`, `cost`, `chronic`, `detect`, `symptoms`, `progress`, `risk`; use `manual:true` se ela não deve ser sorteada |
| Golpe de luta | `DATA.moves`, com `art`, `req`, `dmg`, `acc`, `ko`, `lethal`, `cost` e `type`. Aparece sozinho quando a maestria chegar lá |
| Contexto de briga | Perfil em `DATA.fightProfiles` e tratamento em `FIGHT_AFTER` (`systems/combat.js`) |
| Atividade | `ACTIVITIES` (`systems/activities.js`). Use `sc(valor, id)` para os retornos decrescentes e `ACT_RULES` para a idade por país |
| Regra de idade de um país | `DATA.ageRules` (`data/world.js`) |
| Chance explicada | `mkOdds(base).add("Fator", delta).done()` em `systems/modifiers.js` |
| Som | Função em `SFX` (`ui/sound.js`) e `Sound.play("nome")`, ou `emit("evento")` a partir da simulação |
| Formato do save | Novos campos em `ensureState()` e o tipo em `SHAPE` (`state/state.js`) |

Depois de qualquer mudança, rode a [bateria de testes](TESTES.md) e `python3 tools/build.py`.
