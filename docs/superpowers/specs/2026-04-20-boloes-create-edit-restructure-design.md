# Reestruturação do Sistema de Criar e Editar Bolões

Data: 2026-04-20
Status: Aprovado em brainstorming, aguardando revisão final do documento

## 1. Resumo

O sistema atual de criação e edição de bolões mistura decisões estruturais, detalhes visuais, regras competitivas, lógica de grupos e campos técnicos em fluxos fragmentados. Isso gera uma experiência poluída, difícil de entender e vulnerável a inconsistências entre frontend, backend e regras de segurança.

Esta spec propõe uma reestruturação completa do sistema com foco em:

- criação completa, porém guiada e didática
- edição controlada por permissões e estado do bolão
- proteção contra trapaça por meio de locks estruturais de backend
- separação clara entre dados estruturais, operacionais e de apresentação
- rollout gradual com compatibilidade para bolões legados

## 2. Problemas Atuais

### 2.1 UX

- O fluxo começa por nome e descrição antes de o usuário entender o que está criando.
- Campos de acesso, formato, pontuação, dinheiro, grupo e configurações avançadas aparecem cedo demais.
- Há decisões fora de ordem e dependências implícitas que o usuário precisa deduzir sozinho.
- A edição é espalhada por múltiplos pontos da interface, sem linguagem clara sobre o que pode ou não ser alterado.
- Termos técnicos de sistema vazam para a interface sem tradução para linguagem de produto.

### 2.2 Arquitetura

- O documento de bolão concentra responsabilidades demais sem um contrato lógico bem definido.
- O frontend hoje toma decisões que deveriam ser garantidas pelo backend.
- Existem múltiplas formas de alterar bolões, com consistência limitada entre elas.
- Edição de configuração e edição de apresentação não são tratadas como categorias diferentes.

### 2.3 Integridade e segurança

- Não existe uma fronteira suficientemente forte entre campos livres e campos sensíveis.
- O sistema não trata locks estruturais como parte central da modelagem.
- Há risco de inconsistência entre o que a UI permite e o que deveria ser permitido após entrada de membros ou início da competição.
- A camada de segurança ainda depende demais de writes diretos do cliente.

## 3. Objetivos

- Permitir criação completa de bolão de forma intuitiva, progressiva e didática.
- Permitir edição posterior sem abrir brecha para manipulação competitiva.
- Mover a fonte de verdade das permissões para o backend.
- Formalizar estados do bolão e transições válidas.
- Dar visibilidade clara ao usuário sobre o que trava, quando trava e por quê.
- Suportar bolões com e sem grupo, com comportamento coerente em ambos os casos.

## 4. Não Objetivos

- Não redesenhar toda a experiência de grupos nesta entrega.
- Não eliminar compatibilidade com bolões legados na primeira fase.
- Não criar sistema complexo de moderação social avançada nesta primeira versão.
- Não implementar novos tipos de monetização além da organização atual de bolão pago.

## 5. Princípios de Produto

- Ordem correta de decisão: contexto antes de identidade.
- Complexidade progressiva: mostrar apenas o que importa naquele momento.
- Justiça competitiva: qualquer mudança estrutural sensível deve travar cedo.
- Backend como fonte de verdade: o cliente nunca define sozinho o que pode editar.
- Duplicação como alternativa segura: mudanças profundas depois do lock geram uma nova versão, não alteram a competição original.

## 6. Modelo Estrutural do Bolão

Criar bolão e editar bolão passam a operar sobre o mesmo modelo conceitual.

O bolão deve ser tratado em três grandes categorias:

- Estruturais
  - tipo de bolão
  - formato
  - mercados ativos
  - pontuação
  - vínculo com grupo
  - política de acesso
  - modo pago ou grátis
  - valor de entrada
  - critério de rateio
- Operacionais
  - status
  - participantes
  - convites
  - entrada
  - pagamentos
  - ranking
  - atividade
- Apresentação
  - nome
  - descrição
  - emoji/avatar
  - mensagens de convite

## 7. Estados do Bolão

Estados recomendados:

- `draft`
- `published`
- `live`
- `finished`
- `archived`

### 7.1 Regras de transição

- `draft -> published`
  - após validação completa da configuração e geração do snapshot publicado
- `published -> live`
  - quando a competição efetivamente estiver em andamento
- `live -> finished`
  - após encerramento oficial
- `finished -> archived`
  - para organização histórica

`locked` não deve existir como estado de lifecycle. O lock estrutural é uma propriedade de integridade, não uma fase de vida do bolão.

### 7.2 Integridade estrutural

O lifecycle responde "em que fase o bolão está".

A integridade responde "o que ainda pode ser alterado com segurança".

Campos mínimos:

- `integrity.is_structure_locked`
- `integrity.structure_locked_at`
- `integrity.structure_lock_reason`
- `integrity.lock_trigger`
- `editable_sections`

Regras:

- `editable_sections` é o contrato autoritativo de edição para backend e UI.
- `integrity.is_structure_locked` é um sinal agregado de integridade e compatibilidade, não substitui `editable_sections`.
- Um bolão pode estar `published` e ainda não estar totalmente travado.
- Um bolão pode estar `live` e estar travado ao mesmo tempo.

Decisão de modelagem para `editable_sections`:

- modelo híbrido
- o valor é persistido no documento como contrato operacional pronto para UI, legado e leitura barata
- o valor também deve ser sempre recalculável a partir de `lifecycle`, `integrity`, `context`, `access_policy`, fatos de membership e fatos financeiros
- o backend deve recalcular e persistir `editable_sections` no mesmo fluxo transacional de publicação, lock, mudança de configuração, mudança relevante de membership e mudança relevante de `payment_status`
- o cliente nunca escreve `editable_sections` diretamente
- se o valor persistido estiver ausente, antigo ou inconsistente, o backend recalcula, usa o valor recalculado como fonte de verdade e autocorrige o persistido

### 7.3 Locks por seção

- `presentation`
  - permanece editável em qualquer fase
- `competition_rules`
  - trava ao publicar
- `finance_rules`
  - trava ao publicar
- `context`
  - trava ao publicar, exceto vínculo com grupo quando a política explicitamente permitir antes da entrada de participante externo
- `access_policy`
  - pode continuar editável após publicação somente enquanto não houver participante externo nem expectativa pública válida de entrada sob a configuração atual

### 7.4 Gatilhos de lock estrutural agregado

O backend deve marcar `integrity.is_structure_locked = true` ao detectar qualquer um destes eventos:

- entrada de participante além do criador
- primeiro palpite salvo
- primeiro pagamento confirmado
- início oficial da disputa

### 7.5 Definições operacionais

Para esta spec:

- `participante_externo`
  - qualquer usuário diferente do `pool_owner` com entrada efetiva no bolão e membership ativa
  - convite emitido, link compartilhado, solicitação pendente ou simples pertencimento ao grupo não contam por si só
- `expectativa_publica_valida`
  - promessa de acesso ou permanência gerada pelo produto para terceiros sob a configuração atual e já exposta fora da esfera privada do criador
  - casos mínimos: bolão publicado com entrada pública ativa, convite aceito, solicitação aprovada ou vaga reservada/confirmada para terceiro
  - convite apenas criado e ainda não aceito não conta

O lock agregado existe para sinalizar que nenhuma mudança estrutural remanescente deve ser permitida.

## 8. Fluxo de Criação Recomendado

O fluxo principal será `criação completa em camadas`.

### 8.1 Etapas

1. Contexto
2. Tipo de disputa
3. Participação e regras
4. Identidade e publicação
5. Revisão final

### 8.2 Etapa 1: Contexto

Escolhas:

- bolão sem grupo
- bolão dentro de grupo existente
- criar bolão com novo grupo

Regras:

- o contexto define quais políticas de acesso fazem sentido
- o sistema previne combinações contraditórias
- o usuário precisa entender onde o bolão vai viver antes de configurar regras competitivas

### 8.2.1 Contrato entre grupo e bolão

O vínculo grupo-bolão deve ser explícito:

- `group_binding_mode = none`
  - bolão sem grupo
- `group_binding_mode = linked_discovery`
  - bolão aparece no grupo, mas acesso é governado pela política do bolão
- `group_binding_mode = group_gated`
  - bolão aparece no grupo e a entrada exige membership ativo no grupo no momento da entrada

Regras:

- `group_admin` não herda administração do bolão por padrão.
- `pool_owner` continua sendo o dono do bolão mesmo que depois perca papel administrativo no grupo.
- Se o bolão estiver em `group_gated`, ele não pode ser público para fora do grupo.
- Se o grupo for privado e o bolão precisar ser público, o modo válido é `linked_discovery`, nunca `group_gated`.
- Sair do grupo não remove automaticamente o usuário do bolão depois que ele já entrou.
- Remover usuário do grupo e remover usuário do bolão são ações distintas, com auditoria distinta.
- Após publicação com participante externo ou lock estrutural, o `group_binding_mode` torna-se imutável.

### 8.3 Etapa 2: Tipo de disputa

Opções orientadas a objetivo, não à implementação:

- rápido
- temporada completa
- clássico / alta precisão

Cada opção deve explicar:

- para que serve
- esforço de configuração
- mercados e regras ativados

### 8.4 Etapa 3: Participação e regras

Blocos internos:

- quem pode entrar
- como pontua
- vai valer dinheiro ou não

Regras de UX:

- opções dependentes só aparecem após a escolha que as habilita
- jargões técnicos não devem aparecer crus
- o usuário deve entender impacto e consequência de cada regra

Exemplos de linguagem:

- em vez de `visibility_mode`, usar `mostrar palpites só depois do prazo`
- em vez de `cutoff_mode`, usar `fechar automaticamente no início de cada jogo`

### 8.5 Etapa 4: Identidade e publicação

Campos:

- nome
- emoji/avatar
- descrição
- mensagem de convite

Também deve mostrar:

- o que poderá ser editado depois
- o que será travado ao publicar

### 8.6 Etapa 5: Revisão final

O usuário revisa:

- estrutura do bolão
- política de entrada
- regras de pontuação
- configuração financeira
- itens que travam após publicação

Ações:

- `Salvar rascunho`
- `Publicar bolão`

## 9. Sistema de Edição Recomendado

A edição não deve mais ser tratada como um conjunto de alterações equivalentes.

### 9.1 Áreas de edição

- Identidade
- Participação
- Regras
- Operação

### 9.2 Matriz de edição

A matriz abaixo define "o que" pode ser alterado por categoria. A autorização final depende também do ator.

#### Identidade

Inclui:

- nome
- descrição
- emoji/avatar
- texto de convite

Regra:

- editável em qualquer fase

#### Participação

Inclui:

- vínculo com grupo
- política de entrada
- visibilidade pública/privada

Regra:

- editável apenas enquanto não houver participante externo, expectativa pública válida de entrada sob a configuração atual ou lock estrutural agregado

#### Regras

Inclui:

- formato
- mercados
- pontuação
- modo exclusivo
- modo pago/grátis
- valor de entrada
- rateio

Regra:

- editável somente em `draft`

#### Operação

Inclui:

- publicar
- encerrar
- duplicar
- arquivar

Regra:

- depende do estado do bolão

### 9.3 Matriz de permissões por ator

Atores mínimos:

- `pool_owner`
- `pool_member`
- `group_admin`
- `group_member`
- `non_member`
- `service_actor`

Regras:

- `pool_owner`
  - pode executar operações permitidas por `editable_sections` e estado
- `pool_member`
  - nunca altera estrutura, finanças, acesso ou lifecycle
- `group_admin`
  - administra o grupo, mas não ganha permissão estrutural no bolão automaticamente
- `group_member`
  - não recebe permissão administrativa no bolão por ser membro do grupo
- `non_member`
  - não pode editar bolão
- `service_actor`
  - executa migração, backfill, lock, auditoria e sincronizações internas

Permissões mínimas por operação:

- criar rascunho
  - `pool_owner`
- atualizar configuração estrutural
  - `pool_owner` e somente dentro de `editable_sections`
- alterar apresentação
  - `pool_owner`
- publicar
  - `pool_owner`
- duplicar
  - `pool_owner`
- encerrar/arquivar
  - `pool_owner`
- entrar no bolão
  - `non_member` ou `group_member`, conforme política de acesso
- remover membro do bolão
  - `pool_owner`

### 9.3.1 Política de remoção de membros por estado

- `draft`
  - `pool_owner` pode cancelar convites, rejeitar solicitações e remover membros ativos não criadores
- `published`
  - `pool_owner` pode remover membro ativo somente se esse membro ainda não tiver salvo palpite e não tiver `payment_status = confirmed`
  - a remoção exige motivo auditado
- `published` com atividade do membro
  - se o membro já tiver palpite salvo ou pagamento confirmado, a remoção comum é bloqueada
  - a saída passa a ser `withdrawn_by_member` ou `removed_for_moderation`, sempre preservando histórico
- `live`
  - `pool_owner` não remove participante ativo por fluxo comum
  - apenas `service_actor` ou moderação pode afastar participação por fraude, abuso ou exigência legal, sem apagar trilha competitiva
- `finished` e `archived`
  - não existe remoção destrutiva
  - apenas marcação administrativa compatível com auditoria e histórico
- sair do grupo nunca remove automaticamente do bolão
- remoção de membro sempre é transição de status, nunca hard delete

### 9.4 UX da edição

- Remover a edição inline como solução principal para configuração.
- Criar uma experiência dedicada de edição com seções, locks e explicações.
- Sempre mostrar o status da seção:
  - `Livre para editar`
  - `Editável com restrição`
  - `Travada para preservar a justiça`

### 9.5 Alternativa segura

Quando o usuário tentar alterar algo estrutural depois do lock:

- não alterar o bolão original
- oferecer `Duplicar bolão`
- opcionalmente oferecer `Criar nova edição`

## 10. Segurança e Integridade

### 10.1 Princípios

- O cliente nunca define permissões finais de edição.
- O backend valida papel, estado, lock e coerência da alteração.
- Campos estruturais sensíveis devem ser protegidos por regras e operações controladas.

### 10.2 Operações sensíveis recomendadas

- criar rascunho
- atualizar configuração
- publicar bolão
- duplicar bolão
- alterar apresentação
- encerrar bolão

### 10.3 Campos de proteção máxima

- tipo de bolão
- formato
- mercados
- pontuação
- modo exclusivo
- política de acesso
- vínculo com grupo
- flag de bolão pago
- valor de entrada
- rateio
- datas e regras de fechamento
- status

### 10.4 Modelo financeiro

O financeiro continua sendo organizacional e externo ao app.

Campos recomendados:

- `finance_mode = free | paid_external`
- `entry_fee_amount`
- `currency`
- `distribution_model`
- `distribution_custom_text`

Status de pagamento por membro:

- `not_required`
- `pending`
- `confirmed`
- `waived`
- `refunded`

Regras:

- `free -> paid_external` só é permitido em `draft`
- `paid_external -> free` só é permitido em `draft`
- valor de entrada e rateio travam ao publicar
- o app não executa cobrança nem reembolso, apenas registra estado
- se houver empate em posição premiada, a regra padrão é dividir igualmente a soma das faixas empatadas
- `payment_status` não controla elegibilidade competitiva nesta versão
- elegibilidade competitiva depende de membership ativa, política de entrada e lifecycle, não do estado financeiro
- elegibilidade financeira para premiação depende de regra organizacional e, por padrão, exige `payment_status in {confirmed, waived}` no fechamento financeiro definido pelo organizador
- `pending` pode participar e pontuar, mas permanece inelegível para premiação até regularização
- `refunded` perde elegibilidade financeira desde o reembolso e não entra no rateio final, preservando histórico competitivo
- qualquer futuro modelo em que pagamento bloqueie ranking, palpites ou entrada deve nascer como política explícita nova, nunca como efeito implícito de `payment_status`

### 10.5 Responsabilidades do backend

- calcular `is_structure_locked`
- recalcular e persistir `editable_sections`
- rejeitar edição estrutural após lock
- registrar motivo do lock
- salvar snapshot estrutural na publicação

## 11. Modelo de Dados Recomendado

Mesmo que o armazenamento continue em um documento principal por bolão, o backend deve tratar estes blocos como contratos separados:

- `presentation`
- `context`
- `competition_rules`
- `access_policy`
- `finance_rules`
- `lifecycle`
- `integrity`
- `audit_meta`

### 11.1 Campos importantes

- `lifecycle.status`
- `lifecycle.published_at`
- `lifecycle.finished_at`
- `integrity.is_structure_locked`
- `integrity.structure_locked_at`
- `integrity.structure_lock_reason`
- `integrity.lock_trigger`
- `integrity.config_version`
- `integrity.published_snapshot`
- `audit_meta.last_actor_id`
- `audit_meta.last_updated_at`

### 11.1.1 Semântica de `published_snapshot`

`published_snapshot` não é apenas auditoria.

Ele é a fotografia canônica da configuração sensível publicada:

- `context`
- `competition_rules`
- `access_policy`
- `finance_rules`
- `schema_version`

Regras:

- ranking, validação de elegibilidade e regras competitivas devem ler a configuração congelada publicada, não a configuração viva mutável
- `presentation` não faz parte do snapshot
- duplicação deve usar `published_snapshot` por padrão quando a origem já tiver sido publicada
- para rascunhos ainda não publicados, duplicação pode usar a configuração viva
- o snapshot também serve para auditoria e comparação de mudanças proibidas

### 11.1.2 Semântica de `editable_sections`

`editable_sections` segue modelo híbrido.

Regras:

- é persistido para servir como contrato barato e imediato para UI, adapter legado e operações simples
- continua sendo totalmente derivável a partir do estado canônico do bolão
- o cliente nunca é autor do campo
- leituras críticas e operações sensíveis podem recalcular o valor e corrigir drift automaticamente
- o campo persistido deve ser atualizado de forma atômica com mudanças que afetem permissão de edição

### 11.2 Legado

Bolões antigos devem suportar:

- `legacy_mode: true`
- `schema_version`
- `editable_sections` compatíveis
- fallback de leitura para estruturas antigas enquanto a migração não terminar

Regras operacionais para legados:

- leitura sempre passa por um adapter que normaliza o documento para o contrato novo
- bolões legados publicados ou em andamento devem entrar em modo conservador:
  - apresentação editável
  - estrutura não editável
  - duplicação permitida
- migração deve ser idempotente
- background backfill deve preencher `schema_version`, `published_snapshot` quando aplicável e `editable_sections`

## 12. Firestore Rules e Functions

### 12.1 Firestore Rules devem impedir

- update estrutural direto em bolão publicado/travado
- alteração de campos administrativos por cliente comum
- entrada em bolão sem cumprir política de acesso
- alteração indevida de status e integridade

### 12.2 Cloud Functions ou camada de serviço devem controlar

- publicação
- duplicação
- transições de estado
- aplicação de lock
- logging de auditoria
- validação de entrada

### 12.3 Contratos mínimos das operações sensíveis

As operações sensíveis não devem ser apenas nomes de intent. Elas precisam ter contratos estáveis para UI e backend.

#### `createDraft`

Entrada:

- contexto inicial
- tipo de disputa
- apresentação mínima opcional

Saída:

- `bolao_id`
- `lifecycle.status`
- `integrity.config_version`
- `editable_sections`

#### `updateConfiguration`

Entrada:

- `bolao_id`
- `expected_config_version`
- patch por seção permitida

Validações:

- ator autorizado
- seção permitida por `editable_sections`
- estado compatível
- patch coerente

Erros esperados:

- `permission_denied`
- `invalid_state`
- `structure_locked`
- `validation_failed`
- `config_conflict`

#### `publishBolao`

Entrada:

- `bolao_id`
- `expected_config_version`

Validações:

- configuração obrigatória completa
- integridade do contexto
- coerência de acesso
- coerência financeira

Saída:

- novo `lifecycle.status`
- `published_at`
- `published_snapshot`
- `editable_sections`

#### `duplicateBolao`

Entrada:

- `source_bolao_id`
- origem desejada: `published_snapshot` ou `live_draft`
- overrides permitidos de apresentação e contexto inicial

Saída:

- novo `bolao_id`
- novo `config_version`
- `draft`

#### `removePoolMember`

Entrada:

- `bolao_id`
- `member_id`
- `reason_code`
- `reason_text` opcional

Validações:

- ator autorizado
- alvo não é `pool_owner`
- estado do bolão permite remoção
- estado do membro permite remoção
- motivo auditado obrigatório quando já publicado

Erros esperados:

- `permission_denied`
- `invalid_state`
- `member_protected`
- `removal_blocked`

Saída:

- novo `membership.status`
- `audit_meta`

#### `alterPresentation`

Entrada:

- `bolao_id`
- patch de apresentação

Saída:

- bloco `presentation` atualizado
- `audit_meta`

#### `finishBolao` / `archiveBolao`

Entrada:

- `bolao_id`
- motivo opcional

Saída:

- novo `lifecycle.status`
- timestamps

### 12.4 Concorrência e idempotência

- Toda operação de configuração deve usar `expected_config_version`
- Se a versão enviada estiver desatualizada, a operação falha com `config_conflict`
- Publicação não deve correr em paralelo com atualização estrutural
- Migração e backfill precisam ser idempotentes
- Duplicação deve ser segura para repetição quando receber o mesmo `request_id`, caso essa proteção seja adotada

## 13. Auditoria e Observabilidade

Toda alteração relevante deve gerar trilha de auditoria.

Campos recomendados:

- `actor_id`
- `action`
- `target_id`
- `before`
- `after`
- `reason`
- `created_at`

Eventos importantes:

- tentativa de editar campo travado
- tentativa de entrar sem permissão
- tentativa de alterar configuração depois do início
- publicação
- lock aplicado
- duplicação

### 13.1 Telemetria de produto

Além da auditoria de segurança, o sistema deve registrar eventos de experiência:

- `draft_created`
- `creation_step_completed`
- `creation_abandoned`
- `pool_published`
- `time_to_publish`
- `edit_blocked`
- `field_repeatedly_blocked`
- `pool_duplicated_after_lock`
- `join_denied_policy`
- `join_denied_group_requirement`
- `member_removal_blocked`
- `editable_sections_recomputed`

Objetivo:

- medir abandono por etapa
- detectar pontos de atrito
- entender se locks estão claros ou apenas frustrando
- monitorar se duplicação está virando workaround frequente demais

Gates que devem consumir essa telemetria:

- Gate de backend protegido
  - revisar `editable_sections_recomputed`, `edit_blocked` e conflitos de configuração para garantir que o contrato híbrido não esteja gerando drift ou falso bloqueio
- Gate de nova criação
  - comparar `draft_created`, `creation_step_completed`, `creation_abandoned` e `time_to_publish` contra baseline do fluxo antigo antes de ampliar rollout
- Gate de nova edição
  - revisar `edit_blocked`, `field_repeatedly_blocked`, `member_removal_blocked` e `pool_duplicated_after_lock` para confirmar que o novo modelo está claro e não está empurrando o usuário para workarounds
- Gate de aposentadoria do legado
  - revisar `join_denied_policy`, `join_denied_group_requirement` e volume de recomputação/correção de `editable_sections` antes de desligar o fluxo antigo

## 14. Migração

### 14.1 Onda 1

- Introduzir novo contrato backend
- Implementar locks estruturais
- Manter compatibilidade com bolões existentes
- Introduzir `schema_version`
- Introduzir adapter de leitura

### 14.2 Onda 2

- Lançar nova criação guiada
- Lançar nova edição baseada em permissões
- Expor `editable_sections` para a UI
- Instrumentar telemetria de funil
- Definir baseline comparável do fluxo antigo para abandono, publicação e tempo até publicar

### 14.3 Onda 3

- Migrar bolões antigos para o novo modelo
- Manter fallback para casos legados ainda não migrados
- Avançar apenas se os gates de telemetria estiverem saudáveis

### 14.4 Estratégia operacional de migração

- Bolões legados são lidos via adapter desde o primeiro dia
- Backfill migra dados em lote sem exigir parada do sistema
- Enquanto `legacy_mode = true`, a UI deve assumir permissões conservadoras
- Structural edits em bolões legados publicados devem ser bloqueadas
- A saída oficial para legado incompatível é duplicação
- rollout não avança de onda sem revisão explícita das métricas definidas em `13.1`

## 15. Testes Obrigatórios

### 15.1 Unitários

- cálculo de permissões de edição
- transições de estado
- regras de lock
- coerência de configuração
- separação entre elegibilidade competitiva e elegibilidade financeira

### 15.2 Integração

- criar rascunho
- publicar bolão
- editar antes do lock
- editar depois do lock
- entrar em bolão conforme política de acesso
- duplicar bolão travado
- atualizar configuração com `config_version` desatualizada
- validar grupo `linked_discovery` vs `group_gated`
- validar regras financeiras em publicação
- validar remoção de membro por estado do bolão e atividade do membro

### 15.3 Segurança / Rules

- impedir update estrutural direto
- impedir entrada indevida
- impedir mudança de status não autorizada
- impedir actor de grupo editar bolão sem papel explícito
- impedir mudança financeira após publicação
- impedir hard delete de membro com histórico competitivo

### 15.4 E2E

- criar bolão sem grupo
- criar bolão em grupo
- publicar
- convidar participantes
- editar campos permitidos
- bloquear edição sensível após atividade real
- sair do grupo sem remover participação do bolão
- duplicar bolão publicado e travado
- tentar remover membro após palpite ou pagamento confirmado e receber bloqueio correto

## 16. Rollout Recomendado

Ordem:

1. proteger backend
   Gate: drift de `editable_sections` sob controle e sem falso bloqueio estrutural relevante.
2. lançar nova criação
   Gate: abandono e `time_to_publish` dentro da meta comparativa definida na onda 2.
3. lançar nova edição
   Gate: taxa de `field_repeatedly_blocked`, `member_removal_blocked` e duplicação por lock aceitável.
4. aposentar fluxo antigo
   Gate: adapter legado estável, entradas negadas revisadas e telemetria sem regressão estrutural.

## 17. Decisões Consolidadas

- A criação será completa, não simplificada.
- O fluxo será intuitivo e progressivo, não técnico.
- O bolão pode existir com ou sem grupo.
- `locked` não será estado de lifecycle; será tratado como integridade.
- Edição estrutural será permitida apenas antes do lock.
- Edição posterior ficará limitada a apresentação e operações seguras.
- Mudanças estruturais pós-lock usarão duplicação como saída oficial.
- `group_admin` não recebe governança automática no bolão.
- `published_snapshot` será a fonte congelada da configuração competitiva publicada.
- `editable_sections` seguirá modelo híbrido: persistido para consumo rápido, recalculável pelo backend e nunca editável pelo cliente.
- `payment_status` não definirá elegibilidade competitiva nesta versão; definirá apenas elegibilidade financeira por padrão.
- Remoção de membro será sempre transição auditada de status e ficará muito mais restrita após atividade competitiva ou financeira.
- Rollout só avançará com gate explícito baseado em telemetria de experiência e integridade.
- Segurança será garantida no backend, não apenas no frontend.

## 18. Critérios de Sucesso

- redução perceptível de confusão na criação de bolão
- menor número de erros de configuração
- consistência entre UI, regras e backend
- impossibilidade prática de trapaça por edição tardia
- compatibilidade segura com bolões legados durante a transição
