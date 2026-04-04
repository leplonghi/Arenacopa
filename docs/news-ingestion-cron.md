# News Ingestion Cron

## Objetivo
Atualizar notícias em tempo real sem exceder limites de feed/API e sem sobrecarregar scraping.

## Janela recomendada

### RSS / API
- frequência: a cada 15 minutos
- fontes alvo:
  - ge
  - Marca
  - AS
  - Guardian

### Scraping leve
- frequência: a cada 30 minutos
- fontes alvo:
  - ESPN Brasil
  - UOL
  - Gazeta
  - LANCE!
  - Mundo Deportivo
  - SPORT
  - ElDesmarque
  - BBC
  - Sky
  - Telegraph
  - Independent
  - UEFA

### Rebuild de links por campeonato
- frequência: a cada 10 minutos
- tarefa:
  - recalcular `news_links_by_championship`
  - recalcular artigos por país/idioma

## Sequência sugerida
1. Buscar fontes RSS/API.
2. Normalizar artigos.
3. Deduplicar.
4. Persistir `news_articles`.
5. Atualizar agregados por campeonato.
6. Rodar fontes scrapeadas.

## RRULEs sugeridos
- RSS/API:
  - `FREQ=HOURLY;INTERVAL=1`
  - orquestrar internamente execuções nos minutos `00,15,30,45`
- Scraping:
  - `FREQ=HOURLY;INTERVAL=1`
  - orquestrar internamente execuções nos minutos `10,40`

## Tolerância e fallback
- Se uma fonte falhar 3 vezes seguidas, marcar `degraded`
- Se uma fonte HTML mudar e o parser falhar, não quebrar o pipeline inteiro
- Se uma fonte produzir artigo duplicado, só atualizar `captured_at` e `priority_score`
