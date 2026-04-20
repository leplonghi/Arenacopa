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
- `locked`
- `live`
- `finished`
- `archived`

### 7.1 Regras de transição

- `draft -> published`
  - após validação completa da configuração
- `published -> locked`
  - quando ocorrer primeiro evento crítico de integridade
- `published|locked -> live`
  - quando a competição efetivamente estiver em andamento
- `live -> finished`
  - após encerramento oficial
- `finished -> archived`
  - para organização histórica

### 7.2 Gatilhos de lock estrutural

O backend deve travar estrutura ao detectar qualquer um destes eventos:

- entrada de participante além do criador
- primeiro palpite salvo
- primeiro pagamento confirmado
- início oficial da disputa

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

- editável até publicação ou até entrada de outro participante

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

### 9.3 UX da edição

- Remover a edição inline como solução principal para configuração.
- Criar uma experiência dedicada de edição com seções, locks e explicações.
- Sempre mostrar o status da seção:
  - `Livre para editar`
  - `Editável com restrição`
  - `Travada para preservar a justiça`

### 9.4 Alternativa segura

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

### 10.4 Responsabilidades do backend

- calcular `is_structure_locked`
- calcular `editable_sections`
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
- `integrity.is_structure_locked`
- `integrity.structure_locked_at`
- `integrity.structure_lock_reason`
- `integrity.config_version`
- `integrity.published_snapshot`
- `audit_meta.last_actor_id`
- `audit_meta.last_updated_at`

### 11.2 Legado

Bolões antigos devem suportar:

- `legacy_mode: true`
- `editable_sections` compatíveis
- fallback de leitura para estruturas antigas enquanto a migração não terminar

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

## 14. Migração

### 14.1 Onda 1

- Introduzir novo contrato backend
- Implementar locks estruturais
- Manter compatibilidade com bolões existentes

### 14.2 Onda 2

- Lançar nova criação guiada
- Lançar nova edição baseada em permissões

### 14.3 Onda 3

- Migrar bolões antigos para o novo modelo
- Manter fallback para casos legados ainda não migrados

## 15. Testes Obrigatórios

### 15.1 Unitários

- cálculo de permissões de edição
- transições de estado
- regras de lock
- coerência de configuração

### 15.2 Integração

- criar rascunho
- publicar bolão
- editar antes do lock
- editar depois do lock
- entrar em bolão conforme política de acesso
- duplicar bolão travado

### 15.3 Segurança / Rules

- impedir update estrutural direto
- impedir entrada indevida
- impedir mudança de status não autorizada

### 15.4 E2E

- criar bolão sem grupo
- criar bolão em grupo
- publicar
- convidar participantes
- editar campos permitidos
- bloquear edição sensível após atividade real

## 16. Rollout Recomendado

Ordem:

1. proteger backend
2. lançar nova criação
3. lançar nova edição
4. aposentar fluxo antigo

## 17. Decisões Consolidadas

- A criação será completa, não simplificada.
- O fluxo será intuitivo e progressivo, não técnico.
- O bolão pode existir com ou sem grupo.
- Edição estrutural será permitida apenas antes do lock.
- Edição posterior ficará limitada a apresentação e operações seguras.
- Mudanças estruturais pós-lock usarão duplicação como saída oficial.
- Segurança será garantida no backend, não apenas no frontend.

## 18. Critérios de Sucesso

- redução perceptível de confusão na criação de bolão
- menor número de erros de configuração
- consistência entre UI, regras e backend
- impossibilidade prática de trapaça por edição tardia
- compatibilidade segura com bolões legados durante a transição
