/**
 * ArenaCopa — Brand Constants
 * Nomenclatura canônica de produto, copy e identidade.
 *
 * REGRAS:
 *  - NUNCA use strings brutas no código para nomes de produto.
 *  - Importe sempre deste arquivo para garantir consistência.
 *  - "ArenaCopa" é SEMPRE uma palavra, A maiúsculo, C maiúsculo.
 *  - "Copa Pass" é SEMPRE duas palavras (o plano premium).
 *  - "Bolão" tem acento; no slug é "bolao".
 *
 * @version 2.0.0
 */

/* ─── Identidade de Produto ─────────────────────────────── */

export const BRAND = {
  /** Nome oficial do app — nunca "Arena Copa", "arenacopa" ou "Arenacopa" */
  name: 'ArenaCopa',

  /** Tagline principal */
  tagline: 'Bolões e Simulações da Copa 2026',

  /** Tagline curta (notificações, badges) */
  taglineShort: 'Seu bolão na Copa',

  /** Nome do plano premium — nunca "CopaPass" ou "copa pass" */
  premiumPlan: 'Copa Pass',

  /** Subtítulo do plano premium */
  premiumTagline: 'Acesso total ao torneio',

  /** Nome da moeda virtual */
  currency: 'ArenaCoin',
  currencySymbol: 'AC',

  /** Identificador do app nas stores */
  bundleId: 'com.arenacopa.app',
  playStoreId: 'com.arenacopa.app',

  /** URL canônica */
  url: 'https://arenacopa.com.br',
  urlShort: 'arenacopa.com.br',

  /** Redes sociais */
  social: {
    instagram: '@arenacopa',
    twitter: '@arenacopa',
    tiktok: '@arenacopa',
  },

  /** Email de suporte */
  email: 'contato@arenacopa.com.br',
  emailSupport: 'suporte@arenacopa.com.br',
} as const;

/* ─── Torneio ─────────────────────────────────────────────── */

export const TOURNAMENT = {
  /** Nome oficial FIFA */
  name: 'Copa do Mundo FIFA 2026™',
  nameShort: 'Copa 2026',
  nameKey: 'world-cup-2026',

  /** Sedes */
  hostCountries: ['Estados Unidos', 'México', 'Canadá'] as const,
  hostCountriesEn: ['United States', 'Mexico', 'Canada'] as const,

  /** Datas */
  startDate: '2026-06-11',
  endDate: '2026-07-19',
  startDateLabel: '11 de junho de 2026',

  /** Formato */
  totalTeams: 48,
  groupCount: 12,
  teamsPerGroup: 4,
  groupStageMatches: 72,
  knockoutMatches: 16 + 8 + 4 + 2 + 1,   /* R32 + R16 + QF + SF + F */

  /** Fases */
  phases: {
    groups:       'Fase de Grupos',
    roundOf32:    'Rodada de 32',          /* nova fase em 2026 — 48 times */
    roundOf16:    'Oitavas de Final',
    quarterFinals:'Quartas de Final',
    semiFinals:   'Semifinais',
    final:        'Final',
  },
} as const;

/* ─── Funcionalidades — nomes canônicos ──────────────────── */

export const FEATURES = {
  /** Bolão */
  pool:              'Bolão',
  poolPlural:        'Bolões',
  poolCreate:        'Criar Bolão',
  poolJoin:          'Entrar no Bolão',
  poolShare:         'Compartilhar Bolão',

  /** Simulação */
  simulator:         'Simulador',
  simulate:          'Simular',
  simulateAll:       'Simular Torneio Completo',

  /** Palpites */
  prediction:        'Palpite',
  predictions:       'Palpites',
  submitPrediction:  'Enviar Palpite',
  editPrediction:    'Editar Palpite',

  /** Ranking */
  ranking:           'Ranking',
  leaderboard:       'Classificação',
  myPosition:        'Minha Posição',

  /** Copa / Torneio */
  bracket:           'Chaveamento',
  groups:            'Grupos',
  schedule:          'Calendário',
  matches:           'Jogos',
  results:           'Resultados',

  /** Conta */
  profile:           'Perfil',
  settings:          'Configurações',
  notifications:     'Notificações',
} as const;

/* ─── Pontuação ──────────────────────────────────────────── */

export const SCORING = {
  /** Pontos por acerto exato de placar */
  exactScore:    5,
  /** Pontos por acerto do resultado (vitória/empate) */
  resultOnly:    2,
  /** Pontos por acerto do vencedor (1x0 etc) */
  winnerOnly:    1,
  /** Multiplicador para fases eliminatórias */
  knockoutMultiplier: 2,
  /** Multiplicador semifinais */
  semifinalMultiplier: 3,
  /** Multiplicador final */
  finalMultiplier: 5,
} as const;

/* ─── Preços / Planos B2C ─────────────────────────────────── */

export const PRICING = {
  /** Plano gratuito — sempre grátis */
  free: {
    name: 'Gratuito',
    price: 0,
    currency: 'BRL',
    maxPools: 2,
    maxMembersPerPool: 20,
    hasSimulator: false,
    hasLiveNotifications: false,
    hasAdvancedStats: false,
    hasCampeonatos: false,
  },

  /**
   * Copa Pass 2026 — pagamento único, produto temporal.
   * Mais barato que PRO mensal porque tem limites reais e expira em 19/jul/2026.
   * Usuário que quer tudo (ilimitado + Campeonatos) assina PRO.
   */
  copaPass: {
    name: BRAND.premiumPlan,
    price: 1990,            /* centavos = R$ 19,90 */
    priceFmt: 'R$ 19,90',
    currency: 'BRL',
    type: 'one_time' as const,
    expiresAt: '2026-07-19T23:59:59Z',
    maxPools: 5,
    maxMembersPerPool: 100,
    hasSimulator: true,     /* básico — Copa only */
    hasLiveNotifications: true,
    hasAdvancedStats: false,
    hasCampeonatos: false,
    stripePriceId: 'price_copa_pass_2026', /* set via STRIPE_PRICE_COPA_PASS secret */
  },

  /** Arena PRO Mensal — recorrente. Custa mais que Copa Pass pela flexibilidade. */
  proMonthly: {
    name: 'Arena PRO',
    price: 2490,            /* centavos = R$ 24,90 */
    priceFmt: 'R$ 24,90',
    priceSuffix: '/mês',
    currency: 'BRL',
    type: 'recurring' as const,
    interval: 'month' as const,
    maxPools: -1,           /* ilimitado */
    maxMembersPerPool: -1,
    hasSimulator: true,     /* completo — todos os campeonatos */
    hasLiveNotifications: true,
    hasAdvancedStats: true,
    hasCampeonatos: true,
    includesCopaPass: true, /* Copa Pass é subconjunto do PRO */
    stripePriceId: 'price_pro_monthly',
  },

  /** Arena PRO Anual — melhor custo-benefício (67% off vs mensal). */
  proAnnual: {
    name: 'Arena PRO',
    price: 9990,            /* centavos = R$ 99,90 */
    priceFmt: 'R$ 99,90',
    pricePerMonth: 833,     /* centavos = R$ 8,33/mês */
    pricePerMonthFmt: 'R$ 8,33/mês',
    priceSuffix: '/ano',
    currency: 'BRL',
    type: 'recurring' as const,
    interval: 'year' as const,
    maxPools: -1,
    maxMembersPerPool: -1,
    hasSimulator: true,
    hasLiveNotifications: true,
    hasAdvancedStats: true,
    hasCampeonatos: true,
    includesCopaPass: true,
    stripePriceId: 'price_pro_annual',
  },
} as const;

/* ─── Preços / Planos B2B ─────────────────────────────────── */

/** Campanhas por Alcance — publicidade avulsa, pagamento único */
export const B2B_CAMPAIGNS = {
  porJogo: {
    name: 'Por Jogo',
    price: 5990,            /* centavos = R$ 59,90 */
    priceFmt: 'R$ 59,90',
    currency: 'BRL',
    type: 'one_time' as const,
    reachEstimate: 200,     /* participantes alcançados */
    games: 1,
    stripePriceId: 'price_b2b_por_jogo',
  },
  faseGrupos: {
    name: 'Fase de Grupos',
    price: 19990,           /* centavos = R$ 199,90 */
    priceFmt: 'R$ 199,90',
    currency: 'BRL',
    type: 'one_time' as const,
    reachEstimate: 600,
    games: 8,
    stripePriceId: 'price_b2b_fase_grupos',
  },
  copaCompleta: {
    name: 'Copa Completa',
    price: 44990,           /* centavos = R$ 449,90 */
    priceFmt: 'R$ 449,90',
    currency: 'BRL',
    type: 'one_time' as const,
    reachEstimate: 1500,
    games: 32,
    stripePriceId: 'price_b2b_copa_completa',
  },
} as const;

/** Parceiro ArenaCopa — presença anual recorrente */
export const B2B_PARCEIRO = {
  local: {
    name: 'Parceiro Local',
    price: 29990,           /* centavos = R$ 299,90 */
    priceFmt: 'R$ 299,90',
    priceSuffix: '/ano',
    currency: 'BRL',
    type: 'recurring' as const,
    interval: 'year' as const,
    campaignsPerMonth: 1,   /* 1 campanha/mês inclusa */
    campaignDiscount: 0.30, /* 30% off campanhas avulsas */
    includesProPersonal: true,
    stripePriceId: 'price_b2b_parceiro_local',
  },
  nacional: {
    name: 'Parceiro Nacional',
    price: 69990,           /* centavos = R$ 699,90 */
    priceFmt: 'R$ 699,90',
    priceSuffix: '/ano',
    currency: 'BRL',
    type: 'recurring' as const,
    interval: 'year' as const,
    includedCampaigns: { faseGrupos: 1, porJogo: 2 },
    campaignDiscount: 0.30,
    includesProPersonal: true,
    stripePriceId: 'price_b2b_parceiro_nacional',
  },
} as const;

/* ─── Limites de plano (use em usePlanLimits) ────────────────── */

export type PlanKey = 'free' | 'copa_pass' | 'pro_monthly' | 'pro_annual';

export const PLAN_LIMITS: Record<PlanKey, {
  maxPools: number;           /* -1 = ilimitado */
  maxMembersPerPool: number;
  canCreateBolao: boolean;
  hasSimulator: boolean;
  hasAdvancedStats: boolean;
  hasCampeonatos: boolean;
  hasLiveNotifications: boolean;
}> = {
  free: {
    maxPools: 2,
    maxMembersPerPool: 20,
    canCreateBolao: true,   /* pode criar até o limite */
    hasSimulator: false,
    hasAdvancedStats: false,
    hasCampeonatos: false,
    hasLiveNotifications: false,
  },
  copa_pass: {
    maxPools: 5,
    maxMembersPerPool: 100,
    canCreateBolao: true,
    hasSimulator: true,
    hasAdvancedStats: false,
    hasCampeonatos: false,
    hasLiveNotifications: true,
  },
  pro_monthly: {
    maxPools: -1,
    maxMembersPerPool: -1,
    canCreateBolao: true,
    hasSimulator: true,
    hasAdvancedStats: true,
    hasCampeonatos: true,
    hasLiveNotifications: true,
  },
  pro_annual: {
    maxPools: -1,
    maxMembersPerPool: -1,
    canCreateBolao: true,
    hasSimulator: true,
    hasAdvancedStats: true,
    hasCampeonatos: true,
    hasLiveNotifications: true,
  },
};

/* ─── Paleta de cores (referência JS — espelho do CSS) ─────── */

export const COLORS = {
  brand: {
    primary:       '#22c55e',
    primaryDark:   '#16a34a',
    primaryLight:  '#4ade80',
    accent:        '#f59e0b',
    accentDark:    '#d97706',
  },
  bg: {
    base:          '#082016',
    raised:        '#0a2a1c',
    overlay:       '#041009',
  },
  text: {
    primary:       '#fafafa',
    secondary:     '#a7d8b8',
    tertiary:      '#7aad90',
    disabled:      '#616161',
    brand:         '#22c55e',
    accent:        '#f59e0b',
  },
  premium: {
    base:          '#f59e0b',
    dark:          '#d97706',
    glow:          '#fbbf24',
    text:          '#fcd34d',
  },
} as const;

/* ─── Tipografia — classes Tailwind canônicas ─────────────── */

export const TYPOGRAPHY = {
  /** Títulos de tela */
  screenTitle:    'text-xl font-bold tracking-tight text-white',
  /** Título de seção */
  sectionTitle:   'text-lg font-semibold text-white',
  /** Label de item */
  itemLabel:      'text-sm font-medium text-white',
  /** Texto secundário */
  secondary:      'text-sm text-green-300/70',
  /** Caption */
  caption:        'text-xs text-green-400/60',
  /** Placar/número */
  score:          'text-2xl font-black tabular-nums text-white',
  /** Badge */
  badge:          'text-xs font-semibold tracking-wide',
  /** Botão */
  button:         'text-sm font-semibold',
  /** Botão grande */
  buttonLarge:    'text-base font-semibold',
} as const;

/* ─── Animações — variantes Framer Motion canônicas ─────── */

export const MOTION = {
  /** Entrada padrão de página */
  pageIn: {
    initial:   { opacity: 0, y: 16 },
    animate:   { opacity: 1, y: 0 },
    exit:      { opacity: 0, y: -8 },
    transition:{ duration: 0.25, ease: [0, 0, 0.2, 1] },
  },

  /** Entrada de card em lista (usar com staggerChildren) */
  cardIn: {
    initial:   { opacity: 0, y: 12, scale: 0.97 },
    animate:   { opacity: 1, y: 0, scale: 1 },
    transition:{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
  },

  /** Container com stagger */
  listContainer: {
    animate: { transition: { staggerChildren: 0.06 } },
  },

  /** Fade simples */
  fadeIn: {
    initial:   { opacity: 0 },
    animate:   { opacity: 1 },
    exit:      { opacity: 0 },
    transition:{ duration: 0.15 },
  },

  /** Spring para elementos interativos */
  spring: { type: 'spring', stiffness: 400, damping: 30 } as const,
  springGentle: { type: 'spring', stiffness: 200, damping: 25 } as const,
} as const;

/* ─── Ícones — mapeamento canônico ──────────────────────── */

export const ICONS = {
  home:         'Home',
  pools:        'Users',
  copa:         'Trophy',
  simulator:    'Shuffle',
  rankings:     'BarChart2',
  news:         'Newspaper',
  calendar:     'Calendar',
  notifications:'Bell',
  settings:     'Settings',
  profile:      'User',
  premium:      'Star',
  share:        'Share2',
  create:       'Plus',
  edit:         'Pencil',
  delete:       'Trash2',
  search:       'Search',
  back:         'ChevronLeft',
  close:        'X',
  check:        'Check',
  info:         'Info',
  warning:      'AlertTriangle',
  error:        'XCircle',
  success:      'CheckCircle2',
  lock:         'Lock',
  unlock:       'Unlock',
  copy:         'Copy',
  externalLink: 'ExternalLink',
  flag:         'Flag',
  ball:         'Circle',           /* fallback — use svg customizado */
  goal:         'Target',
  team:         'Shield',
  match:        'Zap',
} as const;

/* ─── Rotas canônicas ────────────────────────────────────── */

export const ROUTES = {
  home:             '/',
  pools:            '/boloes',
  poolCreate:       '/boloes/criar',
  poolDetail:       (id: string) => `/boloes/${id}`,
  poolJoin:         (code: string) => `/boloes/entrar/${code}`,
  copa:             '/copa',
  copaGroups:       '/copa/grupos',
  copaSchedule:     '/copa/calendario',
  copaBracket:      '/copa/chaveamento',
  simulator:        '/simulador',
  rankings:         '/ranking',
  news:             '/noticias',
  profile:          '/perfil',
  settings:         '/configuracoes',
  premium:          '/copa-pass',
  notifications:    '/notificacoes',
  auth: {
    login:          '/entrar',
    register:       '/cadastro',
    forgotPassword: '/esqueci-senha',
  },
} as const;

/* ─── Limites e validações ──────────────────────────────── */

export const LIMITS = {
  poolNameMin:      3,
  poolNameMax:      50,
  poolDescMax:      200,
  poolCodeLength:   6,        /* ex: "ABC123" */
  poolMembersFree:  20,
  poolMembersPro:   200,
  usernameMin:      3,
  usernameMax:      20,
  scoreMax:         20,       /* máx de gols aceito no palpite */
  predictionDeadline: 15,     /* minutos antes da partida */
} as const;

/* ─── Mensagens canônicas (copy) ────────────────────────── */

export const COPY = {
  appDescription:
    'Crie bolões com seus amigos, simule o torneio inteiro e acompanhe a Copa do Mundo 2026 em tempo real.',

  premiumCta:       'Ativar Copa Pass',
  premiumBenefit1:  'Bolões ilimitados com até 200 participantes',
  premiumBenefit2:  'Simulador completo do torneio',
  premiumBenefit3:  'Notificações em tempo real de gols e resultados',
  premiumBenefit4:  'Estatísticas avançadas e histórico detalhado',
  premiumBenefit5:  'Sem anúncios — experiência limpa',

  sharePool: (poolName: string) =>
    `Participe do meu bolão "${poolName}" no ArenaCopa! 🏆`,

  emptyPool:        'Nenhum bolão criado ainda. Que tal começar o seu?',
  emptyRanking:     'Ainda sem palpites. Aposte agora para entrar no ranking!',
  emptyNews:        'Sem notícias no momento. Volte mais tarde.',
  emptyCalendar:    'Nenhum jogo agendado neste período.',
  emptyGroups:      'Os grupos serão definidos antes da Copa.',

  errorGeneric:     'Algo deu errado. Tente novamente.',
  errorNetwork:     'Sem conexão. Verifique sua internet.',
  errorAuth:        'Sessão expirada. Faça login novamente.',
  errorPermission:  'Você não tem permissão para esta ação.',
} as const;
