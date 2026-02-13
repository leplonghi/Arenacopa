
## Interatividade no Bracket: Modal de Edicao de Placar

### Objetivo
Permitir que o usuario clique em qualquer jogo no chaveamento visual (BracketView) e edite o placar diretamente em um modal/dialog, sem precisar sair da visualizacao de arvore.

### Mudancas Planejadas

**1. Novo componente: `src/components/copa/BracketScoreModal.tsx`**
- Dialog (Radix) que recebe o match selecionado (round, index, dados do jogo)
- Exibe bandeiras e nomes das duas selecoes
- Inputs numericos (+/-) para gols de cada time (mesmo padrao do KnockoutPhase)
- Se houver empate, exibe campos de penaltis automaticamente
- Botao "Salvar" que chama `updateKnockoutScore` do SimulacaoContext
- Jogos com times "TBD" (null) nao sao editaveis - o modal nao abre

**2. Alteracoes em `src/components/copa/BracketView.tsx`**
- `BracketView` recebe `onMatchClick` como prop opcional (callback com round, index, match)
- `BracketMatch` ganha `onClick` e cursor pointer quando ambos os times estao definidos
- Efeito hover sutil para indicar que o card e clicavel
- Estado local no `BracketView` para controlar qual match esta selecionado e abrir o modal
- O mesmo tratamento para o jogo de 3o lugar

**3. Alteracoes em `src/components/copa/ChavesTab.tsx`**
- Passa as props necessarias para o BracketView conectar o modal ao contexto
- O `updateKnockoutScore` ja existe no SimulacaoContext e sera reutilizado

### Detalhes Tecnicos

- Reutiliza o componente `Dialog` de `@/components/ui/dialog` ja existente
- O modal usa inputs com botoes +/- (0 a 20) para cada time
- Logica de penaltis: se `homeScore === awayScore` e ambos preenchidos, exibe campos de penalti
- Ao salvar, chama `updateKnockoutScore` para cada campo alterado (homeScore, awayScore, homePenalty, awayPenalty)
- O round e identificado pelo indice da coluna no bracket (r32=0, r16=1, quarter=2, semi=3, final=4) mapeado para o KnockoutRound type
- Nenhuma mudanca no banco de dados - a persistencia ja funciona via auto-save do contexto

### Arquivos Afetados
| Arquivo | Acao |
|---|---|
| `src/components/copa/BracketScoreModal.tsx` | Criar |
| `src/components/copa/BracketView.tsx` | Editar |
| `src/components/copa/ChavesTab.tsx` | Editar |
