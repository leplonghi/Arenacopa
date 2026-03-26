# Bolões Rework Plan

## Goal
Refatorar a lógica de Bolões focando em extrema simplicidade inicial, templates pré-definidos (com opção "Customizável" disponível), gestão fácil de pagantes e ferramentas "virais" de compartilhamento (Grid interativo e Cards).

## Tasks
- [ ] **Firestore Models**: Atualizar esquema separando `Bolao` de `Grupo`. Adicionar propriedade `hasPaid` no array detalhado de participantes. → **Verify:** Dados salvos corretamente no Firebase Emulator / Database.
- [ ] **Wizard de Criação (UX Ráptida)**: Criar fluxo de 3 passos: Escolher Evento > Definir Moldes (Custom ou Templates) > Compartilhar. → **Verify:** Flow completo em menos de 30 segundos.
- [ ] **Templates & Motor de Rateio**: Criar regras automáticas de premiação ("Winner takes all", "70/20/10") + "Montar meu próprio". → **Verify:** Função de cálculo distribui prêmio total corretamente entre recebedores.
- [ ] **Assentos de Cinema (Gamificação)**: Implementar a UI do "Grid de Placares Exclusivos", onde placares pegos ficam impossibilitados. → **Verify:** Tratamento de concorrência (2 usuários tentando o mesmo placar no milissegundo).
- [ ] **Dashboard do Admin**: Criar tela de gerenciamento de participantes, focada no toggle de "✅ Pagou". → **Verify:** Alterar toggle recalcula imediatamente o pote total de prêmios se houver cota.
- [ ] **Vincular Grupo**: Lógica no dashboard para "Adicionar a um Grupo" (inserir código ou selecionar da lista). → **Verify:** Bolão passa a aparecer no feed do Grupo respectivo.
- [ ] **Viralização (Tickets)**: Implementação de um gerador de Card/Resumo do Bolão e Resultados via Web Share API ou HTML-to-Image para soltar no WhatsApp. → **Verify:** Link e layout de convite formatados corretamente.
- [ ] **Homologação e Scripts**: Executar testes pontuais no fluxo de criação e de regras de Firestore (`security_scan.py` e `ux_audit.py`). → **Verify:** Zero bloqueios e regras de leitura/escrita blindadas.

## Done When
- [ ] O usuário consegue criar o bolão sem atrito e com o nível de personalização que desejar.
- [ ] O grid de placares funciona em tempo real (concorrência).
- [ ] O card de compartilhamento é gerado com os resultados ou link de entrada para WhatsApp.
