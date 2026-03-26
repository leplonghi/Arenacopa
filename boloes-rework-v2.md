# Bolões Rework v2

## Objetivos
1. **Contraste de UI**: Melhorar a legibilidade dos textos cinzas.
2. **Nova Criação de Bolão**: Fluxo mais limpo, focando em seleção de jogos com PIX do Admin.
3. **Gerenciamento de Pagamento**: Status "divertido" para inadimplentes (ex: "Caloteiro", "Dorminhoco") para gerar humor. Admin aprova pagamentos de forma direta.
4. **Terminologia Limpa**: Remover linguajar fantasioso como "A Galera", "Saga Mundial".

## Fases de Implementação
1. **Fase 1: UI & Contrastes** (index.css) - clarear os tons de "muted-foreground" e cinzas globais.
2. **Fase 2: Textos/Traduções** (public/locales ou src) - Substituir palavras lúdicas por termos padronizados: "Participantes", "Apostas", "Copa do Mundo".
3. **Fase 3: Criar Bolão** (CriarBolao.tsx) - Adicionar campo `matches` e campo de `payment_info/pix`. Adicionar texto jurídico ("O app não cobra ou recolhe taxas e nem faz split de pagamentos").
4. **Fase 4: Painel do Bolão** (BolaoDetail.tsx) - Incluir checkbox de `paid` por membro. Criar tag engraçada ("Pipoqueiro/Caloteiro") caso `!paid`.
