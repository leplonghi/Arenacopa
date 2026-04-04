# Firestore Schema For News Ingestion

## Collections

### `news_sources/{sourceId}`
Catálogo das fontes configuradas.

Campos:
- `name`
- `country`
- `language`
- `ingestion_type`
- `url`
- `feed_url`
- `championship_ids`
- `priority`
- `enabled`
- `notes`
- `created_at`
- `updated_at`

### `news_fetch_runs/{runId}`
Histórico de cada execução de ingestão.

Campos:
- `source_id`
- `status` = `running | success | partial | failed`
- `started_at`
- `finished_at`
- `articles_seen`
- `articles_inserted`
- `articles_updated`
- `error_message`
- `duration_ms`

### `news_raw/{rawId}`
Payload bruto retornado pela fonte.

Campos:
- `source_id`
- `fetched_at`
- `payload`
- `checksum`
- `canonical_url`

### `news_articles/{articleId}`
Versão normalizada e usada pelo app.

Campos:
- `title`
- `summary`
- `content`
- `url`
- `canonical_url`
- `image_url`
- `source_id`
- `source_name`
- `source_country`
- `language`
- `published_at`
- `captured_at`
- `championship_ids`
- `team_ids`
- `tags`
- `priority_score`
- `is_live`
- `status` = `published | hidden | duplicate`
- `dedupe_key`

### `news_links_by_championship/{championshipId}`
Documento agregado para leituras rápidas por campeonato.

Campos:
- `championship_id`
- `article_ids`
- `updated_at`

## Indexes recomendados
- `news_articles`: `championship_ids array-contains` + `published_at desc`
- `news_articles`: `source_country ==` + `published_at desc`
- `news_articles`: `language ==` + `published_at desc`
- `news_fetch_runs`: `source_id ==` + `started_at desc`

## Rules recomendadas
- `news_sources`: leitura pública, escrita só admin/server
- `news_fetch_runs`: leitura admin
- `news_raw`: leitura admin
- `news_articles`: leitura pública
- `news_links_by_championship`: leitura pública

## Compatibilidade com o app atual
- `CampeonatoHub` pode migrar de `news` para `news_articles`
- `NoticiasTab` e `NewsFeed` passam a consultar `news_articles`
- `copa_news` pode ser absorvida gradualmente, mantendo compatibilidade de leitura durante a transição
