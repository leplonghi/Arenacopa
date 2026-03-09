# i18n — Internacionalização do ArenaCup

## Goal
Adicionar suporte completo a **Inglês (en)** e **Espanhol (es)** ao ArenaCup, com tradução total (UI + conteúdo rico + nomes de seleções/estádios), detecção automática de idioma, persistência no Supabase, e URLs com prefixo de locale para SEO.

## Decisões Arquiteturais

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| **Lib** | `react-i18next` + `i18next-http-backend` + `i18next-browser-languagedetector` | Lazy loading, ICU, maduro |
| **Traduções** | JSON em `/public/locales/{lang}/` | Performance, offline (Capacitor), Git |
| **Preferência** | `profiles.preferred_language` (Supabase) | Persistência cross-device |
| **Routing** | `/:locale/` prefix (`pt-BR`, `en`, `es`) | SEO sem traduzir slugs |
| **Dados ricos** | JSON por namespace (lazy-loaded) | Não sobrecarrega bundle |
| **UGC** | Não traduzido (original) | Nomes de Bolões etc. |
| **Teams/Stadiums** | Traduzidos em JSON por locale | ~48 times + ~16 estádios |
| **Fallback** | `pt-BR → en → chave` | Nunca quebra |

## Tasks

### Fase 1: Infraestrutura
- [ ] **1.1** Instalar deps: `npm i react-i18next i18next i18next-http-backend i18next-browser-languagedetector` → Verify: `package.json` tem as deps
- [ ] **1.2** Criar `src/i18n/config.ts` — setup do i18next com backend HTTP, detector, namespaces (`common`, `copa`, `bolao`, `guia`, `auth`, `ranking`, `profile`, `errors`) → Verify: import no `main.tsx` sem erros
- [ ] **1.3** Criar estrutura `/public/locales/pt-BR/common.json` (com todas as labels do Layout: "Início", "Copa", "Bolão", "Guia", "Ranking", "Bolões", "Criar Bolão", "Perfil", "Menu") — EN e ES → Verify: 3 arquivos criados
- [ ] **1.4** Migração Supabase: `ALTER TABLE profiles ADD COLUMN preferred_language TEXT DEFAULT NULL CHECK (preferred_language IN ('pt-BR', 'en', 'es'))` → Verify: coluna existe
- [ ] **1.5** Atualizar `types.ts` para incluir `preferred_language` no tipo `profiles`
- [ ] **1.6** Criar `src/i18n/useLanguage.ts` — hook que: lê Supabase preference → synca com i18next → salva no Supabase ao trocar → Verify: hook retorna `{language, changeLanguage, isLoading}`
- [ ] **1.7** Criar `src/i18n/useLocalePath.ts` — hook que gera paths com locale: `localePath('/copa') → '/en/copa'` → Verify: retorna paths corretos
- [ ] **1.8** Envolver `App.tsx` com `I18nextProvider` (Suspense com fallback em loading) → Verify: app roda sem erros

### Fase 2: UI Strings Extraction — Common
- [ ] **2.1** Migrar `Layout.tsx` — tabs labels, getTitle(), header text → usar `t('nav.home')`, `t('nav.copa')` etc. → Verify: labels mudam ao trocar idioma
- [ ] **2.2** Migrar `NotificationsSheet.tsx` — títulos, "Marcar como lido" etc. → Verify: sheet traduzido
- [ ] **2.3** Migrar `EmptyState.tsx`, `StatusBadge.tsx`, `FilterSheet.tsx` → Verify: componentes comuns traduzidos
- [ ] **2.4** Migrar `Auth.tsx` — login/register form labels, erros, termos → criar `auth.json` por locale → Verify: auth page traduzida
- [ ] **2.5** Migrar `TermsGuard.tsx` — termos de uso text → Verify: termos traduzidos

### Fase 3: UI Strings — Pages
- [ ] **3.1** Migrar `Index.tsx` (home) — criar `public/locales/{lang}/home.json` → Verify: home traduzida
- [ ] **3.2** Migrar `Copa.tsx` + todos os ~27 componentes em `components/copa/` — criar `copa.json` com labels de tabs, fases, grupos, status → Verify: copa page traduzida
- [ ] **3.3** Migrar `Boloes.tsx`, `CriarBolao.tsx`, `BolaoDetail.tsx` — criar `bolao.json` → Verify: todas as páginas de bolão traduzidas
- [ ] **3.4** Migrar `Guia.tsx` + componentes em `components/guia/` — criar `guia.json` → Verify: guia traduzida
- [ ] **3.5** Migrar `Ranking.tsx` — criar `ranking.json` → Verify: ranking traduzido
- [ ] **3.6** Migrar `Perfil.tsx` — criar `profile.json` → Verify: perfil traduzido
- [ ] **3.7** Migrar `Menu.tsx`, `Rules.tsx`, `TeamDetails.tsx` → Verify: páginas restantes traduzidas

### Fase 4: Conteúdo Rico
- [ ] **4.1** Criar `public/locales/{lang}/content-teams.json` — nomes traduzidos dos 48 times (ex: "Brasil"→"Brazil"→"Brasil"), demographics, qualifiers, bestResult → Verify: 3 arquivos com ~48 entradas
- [ ] **4.2** Criar `public/locales/{lang}/content-stadiums.json` — nomes, descrições, climaHint traduzidos → Verify: 3 arquivos com ~16 entradas
- [ ] **4.3** Criar `public/locales/{lang}/content-historia.json` — todo o conteúdo de `historiaData.ts` traduzido → Verify: 3 arquivos
- [ ] **4.4** Criar `public/locales/{lang}/content-guia.json` — todo o conteúdo de `guiaData.ts` traduzido → Verify: 3 arquivos
- [ ] **4.5** Refatorar `mockData.ts` para buscar nomes/labels do i18n em vez de hardcoded — criar helper `useTranslatedTeams()` e `useTranslatedStadiums()` → Verify: times mostram nomes no idioma ativo
- [ ] **4.6** Adaptar `formatMatchDate()` e `formatMatchTime()` para usar locale ativo (`Intl.DateTimeFormat` + `date-fns` locale) → Verify: datas formatadas por idioma

### Fase 5: Routing + SEO (⚠️ RISCO ALTO)
- [ ] **5.1** Criar `src/i18n/LanguageRedirect.tsx` — componente que detecta locale → redireciona (Supabase pref → browser detect → default pt-BR) → Verify: `/` redireciona para `/pt-BR/`
- [ ] **5.2** Modificar `App.tsx` routing: adicionar `/:locale` prefix a TODAS as rotas. Manter rotas sem prefix como redirect para `/:detectedLocale/...` → Verify: `/en/copa` funciona, `/copa` redireciona
- [ ] **5.3** Atualizar TODAS as referências de `<NavLink to="/path">` e `navigate("/path")` para usar `localePath()` — CUIDADO: ~50+ referências no código → Verify: navegação funciona em todos os idiomas sem 404
- [ ] **5.4** Adicionar `<html lang={locale}>` dinâmico + `<link rel="alternate" hreflang="...">` meta tags → Verify: source HTML tem hreflang correto
- [ ] **5.5** Adicionar Open Graph locale tags (`og:locale`, `og:locale:alternate`) → Verify: share links mostram idioma correto

### Fase 6: Language Selector + UX
- [ ] **6.1** Criar `src/i18n/LanguageSelector.tsx` — componente com ícone de globo 🌐 + dropdown (bandeiras 🇧🇷🇺🇸🇪🇸). Ao selecionar: muda idioma + URL + salva no Supabase → Verify: troca de idioma funciona end-to-end
- [ ] **6.2** Integrar selector no Header (mobile + desktop) e no Menu page → Verify: acessível em todas as views
- [ ] **6.3** Adicionar opção de idioma no `Perfil.tsx` → Verify: configuração de idioma no perfil

### Fase 7: Verificação Final
- [ ] **7.1** Testar navegação completa em EN, ES, PT-BR → Verify: nenhum 404, nenhum texto não traduzido
- [ ] **7.2** Testar fluxo: novo usuário → auto-detect → troca idioma → logout → login → idioma persistido
- [ ] **7.3** Testar date/number formatting em todos os locales
- [ ] **7.4** Verificar SEO: hreflang, og:locale, canonical URLs
- [ ] **7.5** Build de produção sem erros: `npm run build`

## Notes

- **Volume estimado**: ~400+ translation keys (UI) + ~120KB conteúdo rico = ~1800 strings totais
- **Ordem crítica**: Fases 1→2→3→4 são seguras. Fase 5 (routing) é a mais arriscada — fazer por último
- **Backward compatibility**: Rotas antigas (`/copa`) devem redirecionar para `/:locale/copa`
- **UGC**: Bolões criados pelo usuário, mensagens, bios ficam no idioma original
- **Capacitor**: JSON locale files funcionam offline — importante para app mobile
- **Futuro**: Se precisar de mais idiomas, basta criar nova pasta em `/public/locales/` + traduções
