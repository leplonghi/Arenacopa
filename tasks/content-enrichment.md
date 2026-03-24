# Plano de Enriquecimento de Conteúdo: Sedes da Copa 2026

## Objetivo
Transformar a seção de sedes do ArenaCUP no guia mais completo e rico em informações disponível, unificando dados técnicos, turísticos e logísticos em um formato padronizado e multi-idioma (Globalizado).

## Estrutura de Dados (HostCity Premium)
Cada sede agora seguirá este padrão rigoroso:

1.  **Info Básica**: Nome, País, População, Altitude, Fuso Horário.
2.  **O Estádio**:
    *   Dados técnicos (Capacidade, Ano, Custo).
    *   Fatos históricos.
    *   Curiosidades do projeto.
3.  **Guia do Viajante**:
    *   **Transporte**: Aeroporto mais próximo, deslocamento urbano.
    *   **Gastronomia**: Pratos típicos, dicas de onde comer.
    *   **Turismo**: Top Atrações e Pérolas Escondidas.
4.  **Engajamento**:
    *   Curiosidades locais.
    *   Clima detalhado.
    *   Impacto econômico da Copa na cidade.

## Tarefas

### 1. Definição do Tipo
- [ ] Criar/Atualizar interface `HostCity` em `src/types/City.ts` (ou similar) para suportar todos os novos campos.

### 2. Script de Geração Automática
- [ ] Criar `scripts/enrich_host_cities.ts`.
- [ ] O script conterá o "conhecimento mestre" de todas as 16 cidades.
- [ ] O script gerará automaticamente os arquivos de dados e as traduções.

### 3. Conteúdo Viral (Os "Diferenciais")
- [ ] Gerar fatos "UAU" para cada cidade (ex: o barulho recorde em Seattle, a altitude na CDMX, o estádio mais caro em LA).
- [ ] Adicionar dicas de segurança e logística realistas.

### 4. Internacionalização (Globalização)
- [ ] Gerar chaves de tradução em `public/locales/{en,es,pt-BR}/sedes.json`.

## As 16 Sedes Catalogadas
- **EUA**: New York/New Jersey, Los Angeles, Dallas, Atlanta, Miami, Houston, Philadelphia, Seattle, San Francisco/Santa Clara, Kansas City, Boston/Foxborough.
- **México**: Cidade do México, Monterrey, Guadalajara.
- **Canadá**: Toronto, Vancouver.

---
*Este plano foca em transformar dados em experiências, garantindo que o usuário tenha valor real ao navegar pelo app.*
