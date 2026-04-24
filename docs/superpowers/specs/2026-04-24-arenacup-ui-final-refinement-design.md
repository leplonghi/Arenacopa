# ArenaCup UI Final Refinement Design

Data: 2026-04-24

## Objetivo

Refinar toda a UI do ArenaCup usando o lote mais recente de imagens como referencia visual principal final. A mudanca deve cobrir o app inteiro, mantendo rotas, hooks, dados dinamicos, integracoes e logica de negocio existentes.

Este refinamento nao e uma recriacao do app. E uma padronizacao visual e estrutural em cima da aplicacao atual.

## Direcao visual final

O ArenaCup deve parecer um produto esportivo premium, escuro, energetico e competitivo. A interface deve usar fundo de estadio, superficies escuras com bordas verdes/douradas, tipografia forte, CTAs quentes, badges objetivos e gamificacao integrada.

As referencias mais recentes substituem as anteriores como fonte principal de fidelidade visual. As imagens continuam sendo referencia de design, nao implementacao. Cards, botoes, badges, barras, tabs, listas, layouts e graficos devem ser recriados em codigo.

## Abordagem escolhida

A execucao sera `shell-first + rollout em ondas`.

Primeiro sera consolidada a fundacao global do app:

- header
- bottom navigation
- safe areas
- fundo
- tipografia
- tokens de cor
- cards
- botoes
- badges
- barras
- estados de loading, vazio e erro
- slots de asset

Depois essa fundacao sera aplicada aos modulos do app, evitando que cada tela crie uma variacao visual propria.

## Regras obrigatorias

- Nao recriar o app do zero.
- Nao quebrar rotas, estados, hooks ou integracoes.
- Nao alterar regras de negocio.
- Nao transformar telas em imagens.
- Nao usar screenshots como background final.
- Manter dados dinamicos renderizados por componentes reais.
- Manter responsividade mobile e desktop.
- Usar componentes e tokens compartilhados sempre que possivel.
- Onde faltar asset PNG, mostrar slot planejado com placeholder elegante.

## Fundacao global

### Shell

O app deve ter uma shell consistente em todas as rotas:

- Header com marca, voltar quando necessario, notificacoes e avatar com nivel.
- Bottom navigation fixa com foco no centro em `Palpitar`.
- Fundo escuro com atmosfera de estadio, sem depender de screenshot.
- Conteudo iniciando mais proximo do topo, sem grandes vazios desnecessarios.
- Safe areas tratadas para web e mobile wrapper.

### Tipografia

A hierarquia tipografica deve ser rigida:

- Titulos principais: fortes, altos, esportivos, sem letter spacing negativo.
- Placares, rankings e numeros hero: grandes e muito legiveis.
- Labels e badges: uppercase, compactos, com tracking moderado.
- Corpo e apoio: legivel, mais neutro, com contraste suficiente.

### Superficies

Cards e paineis devem seguir a mesma gramatica:

- Fundo escuro profundo.
- Borda sutil verde ou dourada conforme contexto.
- Radius consistente.
- Glow controlado apenas em elementos de foco.
- Nenhum card dentro de outro card quando isso criar excesso visual.

### Acoes

O dourado/laranja deve comunicar CTA principal. O verde deve comunicar progresso, selecao, sucesso e foco secundario. Vermelho deve ficar restrito a estado ao vivo ou erro real.

## Sistema de assets

Assets visuais unicos poderao ser enviados depois pelo usuario em PNG com fundo transparente. A implementacao deve deixar os lugares preparados antes mesmo de os PNGs existirem.

Os PNGs finais devem ficar em `public/assets/arena/`. Se algum asset ja existir em outro caminho do projeto, a implementacao pode reutilizar o arquivo existente, mas novos assets deste refinamento devem seguir esse diretorio para facilitar substituicao futura.

Cada slot de asset deve ter:

- nome esperado do arquivo
- proporcao visual reservada
- fallback elegante
- glow e moldura coerentes com a tela
- troca futura sem reestruturar layout
- referencia ao caminho esperado, por exemplo `public/assets/arena/wc2026-trophy.png`

### Assets esperados

`Campeonatos`:

- `wc2026-trophy.png`
- `brasileirao-logo.png`
- `libertadores-logo.png`
- `premier-league-logo.png`
- `ligue1-logo.png`
- `laliga-logo.png`
- `bundesliga-logo.png`
- `champions-league-logo.png`
- `saudi-league-logo.png`

`Detalhe da Copa`:

- `wc2026-trophy.png`
- `world-cup-badge.png` opcional

`Home`:

- `home-palpites-hero-art.png` opcional
- `center-ball-nav.png` opcional
- `daily-challenge-icon.png` opcional

`Ranking`:

- `reward-chest.png` opcional
- avatars ilustrados opcionais

`Perfil`:

- badges de conquistas premium opcionais

`Bolões`, `Grupos` e `Menu`:

- icones ou selos premium opcionais quando fizerem sentido

## Modulos de aplicacao

### 1. Fundacao global

Consolidar tokens e componentes compartilhados antes do polimento das telas.

Arquivos provaveis:

- `src/index.css`
- `tailwind.config.ts`
- `src/components/Layout.tsx`
- `src/components/arena/ArenaPrimitives.tsx`
- novos componentes de asset slot, se necessario

### 2. Home

A Home deve seguir a referencia de tela inicial mais recente:

- Hero de palpites pendentes no topo.
- Proximo jogo com contexto claro.
- Lista de jogos de hoje mais compacta e escaneavel.
- Desafio diario com progresso.
- Resumo do usuario com nivel, XP, sequencia e rank.

Componentes envolvidos:

- `HeroPalpites`
- `HomeFeaturedMatch`
- `MatchListItem`
- `DailyChallengeCard`
- `ProfileSummary`
- primitives globais

### 3. Campeonatos

Campeonatos deve virar catalogo premium de competicoes:

- Hero da Copa com slot para trofeu.
- Cards de ligas com logo, pais, status, participantes/boloes e CTA.
- Bloco de meus campeonatos quando houver dados.
- CTA de explorar campeonatos.

Componentes envolvidos:

- hero de competicao
- cards de liga
- asset slots de logos
- badges de status
- metric rows

### 4. Detalhe da Copa

A tela da Copa deve seguir a referencia com:

- Hero forte com trofeu.
- Countdown.
- Estatisticas principais.
- Fases em linha progressiva.
- Grupos em cards horizontais.
- CTA de participar.

Componentes envolvidos:

- `CopaOverview`
- countdown grid
- stage stepper
- group cards
- asset slot de trofeu

### 5. Partida e Palpites

A tela de partida/palpites deve priorizar decisao rapida:

- Header de confronto com placar, tempo, status e eventos.
- Tabs `Palpites`, `Estatisticas`, `Escalacoes`.
- Mercados de palpite em blocos claros.
- Opcoes selecionadas com verde e borda luminosa.
- Barra inferior de palpite atual e acao de alterar/salvar.

Componentes envolvidos:

- match hero
- tab switch
- market section
- option cards
- score input
- prediction footer

### 6. Ranking

Ranking deve ter leitura competitiva:

- Podio top 3.
- Tabs geral/amigos/semanal.
- Lista com linha do usuario destacada.
- Cards de posicao, melhor rank e proxima recompensa.

Componentes envolvidos:

- `RankingPodium`
- `RankingListRow`
- `RewardProgressCard`
- primitives globais

### 7. Perfil

Perfil deve ser hub de progressao:

- Hero de usuario com avatar, nivel e XP.
- Desempenho geral em metric cards.
- Conquistas com badges.
- Historico em lista premium.
- Configuracoes e acoes secundarias no mesmo sistema visual.

Componentes envolvidos:

- `AchievementBadge`
- `AchievementRail`
- `HistoryStatList`
- profile hero
- primitives globais

### 8. Bolões, Grupos e Menu

Essas telas devem herdar a mesma linguagem sem perder clareza operacional:

- Hubs com hero curto, metricas e CTA principal.
- Cards com menos poluicao visual.
- Convites e solicitacoes com estados claros.
- Detalhes de bolao e grupo com configuracao atras de acoes explicitas.
- Menu com blocos consistentes e menos aparencia de lista antiga.

Componentes envolvidos:

- Admission inbox
- entry guidance
- pool/group cards
- shared primitives

## Estados e responsividade

Cada modulo deve cobrir:

- loading
- empty state
- erro
- usuario sem dados
- usuario com muitos itens
- mobile estreito
- desktop medio
- conteudo com textos longos

O texto nao pode estourar botoes, cards ou badges. Elementos fixos como header e bottom navigation nao podem cobrir conteudo importante.

## Verificacao

Antes de considerar a implementacao pronta:

- `npm run build` deve passar.
- O app deve ser testado no navegador em mobile e desktop.
- As telas principais devem ser comparadas visualmente contra as referencias finais.
- Devem ser listados os mismatches materiais encontrados e corrigidos.
- Fluxos basicos devem continuar funcionando: navegar, abrir campeonato, abrir Copa, abrir bolao, abrir ranking, abrir perfil.

## Fora de escopo

- Alterar regras de negocio.
- Trocar backend, Firestore rules ou Cloud Functions.
- Gerar AAB ou deploy automatico como parte desta spec.
- Inserir PNGs ainda nao enviados.
- Substituir dados reais por mock estatico.

## Decisao final

A implementacao deve seguir a opcao `shell-first + rollout em ondas`, cobrindo o app inteiro e deixando slots visiveis para PNGs futuros. O lote mais recente de imagens e a referencia visual principal final.
