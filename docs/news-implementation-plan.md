# News Implementation Plan

## Fase 1
Criar o catálogo inicial de fontes.

Arquivos:
- `src/types/news-ingestion.ts`
- `src/data/newsSources.ts`

Entregas:
- matriz por país
- prioridade por campeonato
- base para personalização por idioma e país do usuário

## Fase 2
Criar collections e rules do Firestore.

Arquivos:
- `firestore.rules`
- `firestore.indexes.json`

Entregas:
- `news_sources`
- `news_fetch_runs`
- `news_raw`
- `news_articles`
- `news_links_by_championship`

## Fase 3
Criar ingestão server-side.

Arquivos:
- `functions/index.js`
- opcional: `functions/news/*.js`

Entregas:
- parser RSS
- parser HTML controlado
- deduplicação
- classificação por campeonato
- update incremental

## Fase 4
Ligar o app à coleção nova.

Arquivos:
- `src/hooks/useRealtimeNews.ts`
- `src/components/copa/NoticiasTab.tsx`
- `src/components/copa/NewsFeed.tsx`
- `src/pages/CampeonatoHub.tsx`
- `src/pages/Index.tsx`

Entregas:
- notícias por campeonato
- notícias priorizadas por país do usuário
- fallback por idioma

## Fase 5
Personalização.

Arquivos:
- `src/pages/Perfil.tsx`
- `src/services/profile/profile.service.ts`

Entregas:
- país editorial preferido
- idioma editorial preferido
- campeonato favorito

## Fase 6
Observabilidade.

Entregas:
- dashboard de fontes que falham
- last fetch por fonte
- quantidade de artigos por campeonato
- taxa de duplicação

## Critério de pronto
- 5 fontes por país catalogadas
- ao menos 1 fonte RSS/API ativa por país
- notícias visíveis em `Home`, `Copa` e `CampeonatoHub`
- ordenação por campeonato + país do usuário + idioma
- sem duplicatas aparentes no feed
