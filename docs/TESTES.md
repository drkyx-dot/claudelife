# Testes

Os testes rodam no próprio navegador, sem instalar nada. Basta abrir o `index.html` com um parâmetro na URL. Nos modos de teste, nada é gravado nos saves reais.

## Bateria completa

| URL | O que faz |
|---|---|
| `index.html?selftest` | Simula 60 vidas completas (cerca de 3.300 anos) com ações aleatórias e checa exceções, `NaN`, saldos negativos e invariantes. Roda também todos os testes unitários abaixo. O veredito aparece no topo da página: `SELFTEST OK` ou `FAIL` |
| `index.html?fuzz=1200&seed=1` | Simula um jogador humano: clica em botões reais da interface (modais, abas, ações, hub) e registra qualquer erro, inclusive os capturados pela rede de segurança |
| `index.html?audit` | Auditoria de layout: elementos que estouram a largura da tela, alvos de toque menores que 40px e campos que causariam zoom no iOS. Rode em várias larguras de janela |
| `index.html?balance` | Sonda de balanceamento: compara estilos de vida (cuidadoso, negligente, imprudente) com as mesmas sementes |

## Testes unitários (`index.html?unit=<nome>`)

| Nome | Verifica |
|---|---|
| `combatTest` | Tabela de letalidade e 150 lutas por contexto de briga |
| `escapeTest` | Puzzles de fuga da prisão nas dificuldades 0 a 8, jogados com a solução da BFS |
| `chaseTest` | Perseguição policial: todas as dificuldades têm saída; fugir, ser pego ou se render dão o desfecho certo |
| `emigrationTest` · `heirTest` | Imóveis sobrevivem à emigração; continuar como herdeiro(a) |
| `identityTest` · `classTest` | Descoberta da orientação; sorteio das 9 classes sociais pelos pesos |
| `prisonTest` · `bondsTest` · `petTest` | Remição por tipo de crime; regimes de bens e golpe do baú; risco de ataque de animais |
| `gigTest` · `sportsTest` · `darkTest` · `darkPathTest` | Trabalho autônomo; carreira esportiva; lado sombrio e seu caminho gradual |
| `ageTest` | Regras de idade por país; menores não pagam contas, os pais pagam |
| `corruptTest` | Corrompe saves de propósito (apaga ou estraga campos) e confirma que o jogo ainda carrega e joga |
| `safetyTest` | Um erro no meio de uma ação é desfeito, o save recusa estado quebrado e o backup recupera um save estragado |

## Modos de demonstração

| URL | Abre |
|---|---|
| `index.html?demo=18` | Uma vida simulada até os 18 anos |
| `?demo=18&ui=hub\|create\|settings\|menu\|gig\|tut\|collect\|pets\|prison\|spouse\|beauty\|hunt\|chase` | Telas específicas |
| `?demo=25&fight=street&art=muaythai:85` | Uma briga com mestre de Muay Thai |
| `?demo=25&escape=4` | Fuga de presídio de segurança máxima |
| `?demo=40&dump=cheque\|leil` | Linhas da linha do tempo que casam com a expressão regular |
| `?debug` | Mostra o painel vermelho de erros (normalmente escondido do jogador) |

## Rodando sem interface (CI)

Com o Firefox instalado, os testes rodam em modo headless e o resultado sai numa captura de tela:

```bash
firefox --headless --screenshot resultado.png "file://$PWD/index.html?selftest"
```
