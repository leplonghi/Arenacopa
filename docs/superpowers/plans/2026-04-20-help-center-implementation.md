# Help Center and Legal Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an authenticated multilingual Help Center for ArenaCup, refresh the public legal pages, standardize support/LGPD contact copy, and keep `/privacidade`, `/termos`, and `/excluir-conta` publicly accessible.

**Architecture:** Add a dedicated `help` i18n namespace plus small typed content helpers, render a new `/ajuda` route family with shared help components, and repoint existing profile/menu/help entry points into that hub. Rebuild the public legal pages on top of richer multilingual legal copy and shared legal/article UI so internal summaries and public compliance pages stay aligned.

**Tech Stack:** React 18, React Router 6, TypeScript, Tailwind CSS, i18next namespaces loaded from `public/locales/*`, Vitest, React Testing Library.

---

### Task 1: Add The Help Content Namespace And Typed Content Helpers

**Files:**
- Create: `public/locales/pt-BR/help.json`
- Create: `public/locales/en/help.json`
- Create: `public/locales/es/help.json`
- Create: `src/lib/help/content.ts`
- Test: `src/test/integration/HelpContent.test.tsx`
- Modify: `src/i18n/config.ts`

- [ ] **Step 1: Write the failing content helper test**

```tsx
import { describe, expect, it, vi } from "vitest";
import {
  getHelpCategories,
  getFaqGroups,
  getTutorialGroups,
} from "@/lib/help/content";

const t = vi.fn((key: string) => key);

describe("help content helpers", () => {
  it("returns the approved help center category routes", () => {
    const categories = getHelpCategories(t as never);

    expect(categories.map((item) => item.href)).toEqual([
      "/ajuda/faq",
      "/ajuda/tutoriais",
      "/ajuda/termos",
      "/ajuda/privacidade",
      "/ajuda/dados",
      "/ajuda/contato",
    ]);
  });

  it("returns grouped faq and tutorial sections", () => {
    expect(getFaqGroups(t as never).length).toBeGreaterThanOrEqual(6);
    expect(getTutorialGroups(t as never).length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/test/integration/HelpContent.test.tsx`

Expected: FAIL with module-not-found for `@/lib/help/content` or missing exports.

- [ ] **Step 3: Add the namespace, register it, and implement the typed helpers**

`src/i18n/config.ts`

```ts
ns: [
  "common",
  "auth",
  "copa",
  "bolao",
  "guia",
  "ranking",
  "profile",
  "errors",
  "sedes",
  "home",
  "premium",
  "championships",
  "help",
],
```

`src/lib/help/content.ts`

```ts
import type { TFunction } from "i18next";

export type HelpCategory = {
  href: string;
  title: string;
  summary: string;
};

export type HelpFaqItem = {
  title: string;
  summary: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type HelpFaqGroup = {
  title: string;
  items: HelpFaqItem[];
};

export type HelpTutorial = {
  title: string;
  intent: string;
  steps: string[];
  ctaLabel?: string;
  ctaHref?: string;
};

export type HelpTutorialGroup = {
  title: string;
  items: HelpTutorial[];
};

export function getHelpCategories(t: TFunction<"help">): HelpCategory[] {
  return [
    {
      href: "/ajuda/faq",
      title: t("categories.faq.title"),
      summary: t("categories.faq.summary"),
    },
    {
      href: "/ajuda/tutoriais",
      title: t("categories.tutorials.title"),
      summary: t("categories.tutorials.summary"),
    },
    {
      href: "/ajuda/termos",
      title: t("categories.terms.title"),
      summary: t("categories.terms.summary"),
    },
    {
      href: "/ajuda/privacidade",
      title: t("categories.privacy.title"),
      summary: t("categories.privacy.summary"),
    },
    {
      href: "/ajuda/dados",
      title: t("categories.data.title"),
      summary: t("categories.data.summary"),
    },
    {
      href: "/ajuda/contato",
      title: t("categories.contact.title"),
      summary: t("categories.contact.summary"),
    },
  ];
}

export function getFaqGroups(t: TFunction<"help">): HelpFaqGroup[] {
  return [
    {
      title: t("faq.getting_started.title"),
      items: [
        {
          title: t("faq.getting_started.items.favorite_team.title"),
          summary: t("faq.getting_started.items.favorite_team.summary"),
          body: t("faq.getting_started.items.favorite_team.body"),
        },
        {
          title: t("faq.getting_started.items.join_pool.title"),
          summary: t("faq.getting_started.items.join_pool.summary"),
          body: t("faq.getting_started.items.join_pool.body"),
          ctaLabel: t("faq.getting_started.items.join_pool.cta_label"),
          ctaHref: "/boloes",
        },
      ],
    },
    {
      title: t("faq.predictions.title"),
      items: [
        {
          title: t("faq.predictions.items.deadline.title"),
          summary: t("faq.predictions.items.deadline.summary"),
          body: t("faq.predictions.items.deadline.body"),
          ctaLabel: t("faq.predictions.items.deadline.cta_label"),
          ctaHref: "/regras",
        },
      ],
    },
    {
      title: t("faq.ranking.title"),
      items: [
        {
          title: t("faq.ranking.items.points.title"),
          summary: t("faq.ranking.items.points.summary"),
          body: t("faq.ranking.items.points.body"),
        },
      ],
    },
    {
      title: t("faq.account.title"),
      items: [
        {
          title: t("faq.account.items.language.title"),
          summary: t("faq.account.items.language.summary"),
          body: t("faq.account.items.language.body"),
        },
      ],
    },
    {
      title: t("faq.notifications.title"),
      items: [
        {
          title: t("faq.notifications.items.enable.title"),
          summary: t("faq.notifications.items.enable.summary"),
          body: t("faq.notifications.items.enable.body"),
        },
      ],
    },
    {
      title: t("faq.privacy.title"),
      items: [
        {
          title: t("faq.privacy.items.data_requests.title"),
          summary: t("faq.privacy.items.data_requests.summary"),
          body: t("faq.privacy.items.data_requests.body"),
          ctaLabel: t("faq.privacy.items.data_requests.cta_label"),
          ctaHref: "/ajuda/dados",
        },
      ],
    },
  ];
}

export function getTutorialGroups(t: TFunction<"help">): HelpTutorialGroup[] {
  return [
    {
      title: t("tutorials.basics.title"),
      items: [
        {
          title: t("tutorials.basics.items.create_pool.title"),
          intent: t("tutorials.basics.items.create_pool.intent"),
          steps: [
            t("tutorials.basics.items.create_pool.steps.0"),
            t("tutorials.basics.items.create_pool.steps.1"),
            t("tutorials.basics.items.create_pool.steps.2"),
          ],
          ctaLabel: t("tutorials.basics.items.create_pool.cta_label"),
          ctaHref: "/boloes/criar",
        },
        {
          title: t("tutorials.basics.items.join_pool.title"),
          intent: t("tutorials.basics.items.join_pool.intent"),
          steps: [
            t("tutorials.basics.items.join_pool.steps.0"),
            t("tutorials.basics.items.join_pool.steps.1"),
            t("tutorials.basics.items.join_pool.steps.2"),
          ],
          ctaLabel: t("tutorials.basics.items.join_pool.cta_label"),
          ctaHref: "/boloes",
        },
      ],
    },
    {
      title: t("tutorials.account.title"),
      items: [
        {
          title: t("tutorials.account.items.delete_account.title"),
          intent: t("tutorials.account.items.delete_account.intent"),
          steps: [
            t("tutorials.account.items.delete_account.steps.0"),
            t("tutorials.account.items.delete_account.steps.1"),
            t("tutorials.account.items.delete_account.steps.2"),
          ],
          ctaLabel: t("tutorials.account.items.delete_account.cta_label"),
          ctaHref: "/excluir-conta",
        },
      ],
    },
  ];
}
```

`public/locales/pt-BR/help.json`

```json
{
  "home": {
    "title": "Central de Ajuda",
    "subtitle": "Ajuda, tutoriais, privacidade e contatos em um só lugar.",
    "quick_actions_title": "Atalhos úteis"
  },
  "categories": {
    "faq": {
      "title": "FAQ",
      "summary": "Perguntas rápidas sobre bolões, conta e notificações."
    },
    "tutorials": {
      "title": "Tutoriais",
      "summary": "Passo a passo para criar bolões, entrar em grupos e configurar a conta."
    },
    "terms": {
      "title": "Termos de Uso",
      "summary": "Resumo das regras de uso e responsabilidades na plataforma."
    },
    "privacy": {
      "title": "Privacidade e LGPD",
      "summary": "Resumo claro sobre dados, finalidades e tratamento."
    },
    "data": {
      "title": "Seus dados e direitos",
      "summary": "Como pedir acesso, correção, exclusão e outras solicitações LGPD."
    },
    "contact": {
      "title": "Contato e suporte",
      "summary": "Canal oficial para ajuda, privacidade e solicitações de conta."
    }
  },
  "faq": {
    "getting_started": {
      "title": "Primeiros passos",
      "items": {
        "favorite_team": {
          "title": "Como escolho meu time favorito?",
          "summary": "Você define isso no seu perfil.",
          "body": "Abra sua conta, entre na seção Meu Time e selecione a seleção que você quer acompanhar no app."
        },
        "join_pool": {
          "title": "Como entro em um bolão?",
          "summary": "Você pode entrar por convite ou pela área de bolões.",
          "body": "Se tiver um link de convite, abra o link e confirme a entrada. Se já estiver logado, também pode abrir a área de bolões e procurar convites disponíveis.",
          "cta_label": "Abrir bolões"
        }
      }
    },
    "predictions": {
      "title": "Palpites",
      "items": {
        "deadline": {
          "title": "Até quando posso alterar um palpite?",
          "summary": "Os palpites fecham antes do início da partida.",
          "body": "As regras do app informam que o prazo padrão fecha 30 minutos antes do jogo em horário local. Revise seus palpites com antecedência para evitar bloqueios de última hora.",
          "cta_label": "Ver regras"
        }
      }
    },
    "ranking": {
      "title": "Ranking e pontuação",
      "items": {
        "points": {
          "title": "Como meus pontos entram no ranking?",
          "summary": "Os pontos são processados ao final das partidas.",
          "body": "O ranking oficial é atualizado automaticamente depois do apito final. O detalhamento pode variar entre jogo, fase, campeonato e especiais."
        }
      }
    },
    "account": {
      "title": "Conta e perfil",
      "items": {
        "language": {
          "title": "Posso mudar o idioma?",
          "summary": "O app acompanha o idioma do aparelho.",
          "body": "Hoje o ArenaCup segue o idioma detectado no seu dispositivo. Sempre que houver alterações no app, o conteúdo deve continuar disponível em português, inglês e espanhol."
        }
      }
    },
    "notifications": {
      "title": "Notificações",
      "items": {
        "enable": {
          "title": "Como ativo alertas de gol?",
          "summary": "Ative as permissões do navegador ou do dispositivo.",
          "body": "Abra sua conta, encontre a seção Notificações e ligue os alertas desejados. Se o navegador negar a permissão, será necessário habilitar o envio nas configurações do sistema."
        }
      }
    },
    "privacy": {
      "title": "Privacidade e legal",
      "items": {
        "data_requests": {
          "title": "Como faço um pedido relacionado à LGPD?",
          "summary": "Use o canal oficial do ArenaCup e identifique seu pedido.",
          "body": "Envie sua solicitação para suporte@arenacup.net com o assunto do pedido, o e-mail da conta e uma descrição clara do que você quer exercer: acesso, correção, eliminação quando cabível ou outra solicitação.",
          "cta_label": "Ver seus direitos"
        }
      }
    }
  },
  "tutorials": {
    "basics": {
      "title": "Bolões e palpites",
      "items": {
        "create_pool": {
          "title": "Criar um bolão",
          "intent": "Crie um bolão privado e convide outras pessoas.",
          "steps": [
            "Abra a área de bolões e toque em criar.",
            "Defina nome, regras e formato do bolão.",
            "Salve e compartilhe o convite com os participantes."
          ],
          "cta_label": "Criar bolão"
        },
        "join_pool": {
          "title": "Entrar em um bolão",
          "intent": "Use um link de convite ou a área de bolões para participar.",
          "steps": [
            "Abra o convite recebido ou vá para bolões.",
            "Confirme o grupo correto antes de entrar.",
            "Depois da entrada, revise seus palpites e notificações."
          ],
          "cta_label": "Abrir bolões"
        }
      }
    },
    "account": {
      "title": "Conta e segurança",
      "items": {
        "delete_account": {
          "title": "Excluir sua conta",
          "intent": "Remova sua conta e os dados associados quando o fluxo permitir.",
          "steps": [
            "Abra a página de exclusão de conta.",
            "Confirme a identidade quando solicitado.",
            "Revise o que será excluído e confirme a ação."
          ],
          "cta_label": "Abrir exclusão de conta"
        }
      }
    }
  }
}
```

Create `public/locales/en/help.json` and `public/locales/es/help.json` with the same key structure and translated values before moving on.

- [ ] **Step 4: Run the helper test again**

Run: `npx vitest run src/test/integration/HelpContent.test.tsx`

Expected: PASS with both tests green.

- [ ] **Step 5: Commit the namespace foundation**

```bash
git add public/locales/pt-BR/help.json public/locales/en/help.json public/locales/es/help.json src/lib/help/content.ts src/i18n/config.ts src/test/integration/HelpContent.test.tsx
git commit -m "feat: add help content namespace"
```

### Task 2: Build The Shared Help Components And Home Route

**Files:**
- Create: `src/components/help/HelpPageShell.tsx`
- Create: `src/components/help/HelpCategoryCard.tsx`
- Create: `src/components/help/HelpQuickActions.tsx`
- Create: `src/pages/Ajuda.tsx`
- Test: `src/test/integration/Ajuda.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the failing home page test**

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Ajuda from "@/pages/Ajuda";

describe("Ajuda", () => {
  it("renders the help center home with the approved categories", () => {
    render(
      <MemoryRouter>
        <Ajuda />
      </MemoryRouter>,
    );

    expect(screen.getByText("help:home.title")).toBeInTheDocument();
    expect(screen.getByText("help:categories.faq.title")).toBeInTheDocument();
    expect(screen.getByText("help:categories.contact.title")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/test/integration/Ajuda.test.tsx`

Expected: FAIL because `@/pages/Ajuda` does not exist yet.

- [ ] **Step 3: Implement the shared shell, category cards, and authenticated `/ajuda` route**

`src/components/help/HelpPageShell.tsx`

```tsx
type HelpPageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function HelpPageShell({ eyebrow, title, description, children }: HelpPageShellProps) {
  return (
    <div className="space-y-6 px-4 py-4">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-black text-white">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </section>
      {children}
    </div>
  );
}
```

`src/components/help/HelpCategoryCard.tsx`

```tsx
import { NavLink } from "react-router-dom";

type HelpCategoryCardProps = {
  href: string;
  title: string;
  summary: string;
};

export function HelpCategoryCard({ href, title, summary }: HelpCategoryCardProps) {
  return (
    <NavLink
      to={href}
      className="rounded-3xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
    >
      <h2 className="text-base font-black text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{summary}</p>
    </NavLink>
  );
}
```

`src/pages/Ajuda.tsx`

```tsx
import { useTranslation } from "react-i18next";
import { HelpPageShell } from "@/components/help/HelpPageShell";
import { HelpCategoryCard } from "@/components/help/HelpCategoryCard";
import { getHelpCategories } from "@/lib/help/content";

export default function Ajuda() {
  const { t } = useTranslation("help");
  const categories = getHelpCategories(t);

  return (
    <HelpPageShell
      eyebrow={t("home.title")}
      title={t("home.title")}
      description={t("home.subtitle")}
    >
      <section className="grid gap-3 md:grid-cols-2">
        {categories.map((category) => (
          <HelpCategoryCard
            key={category.href}
            href={category.href}
            title={category.title}
            summary={category.summary}
          />
        ))}
      </section>
    </HelpPageShell>
  );
}
```

`src/App.tsx`

```tsx
const Ajuda = lazy(() => import("./pages/Ajuda"));

<Route path="/ajuda" element={<ProtectedRoute><Layout><Ajuda /></Layout></ProtectedRoute>} />
```

- [ ] **Step 4: Run the test and a route smoke check**

Run: `npx vitest run src/test/integration/Ajuda.test.tsx`

Expected: PASS with the home page rendering the translated keys under the mocked i18n setup.

- [ ] **Step 5: Commit the home route**

```bash
git add src/components/help/HelpPageShell.tsx src/components/help/HelpCategoryCard.tsx src/components/help/HelpQuickActions.tsx src/pages/Ajuda.tsx src/App.tsx src/test/integration/Ajuda.test.tsx
git commit -m "feat: add help center home route"
```

### Task 3: Add FAQ, Tutorials, Privacy, Terms, Data Rights, And Contact Pages

**Files:**
- Create: `src/components/help/HelpAccordionGroup.tsx`
- Create: `src/components/help/HelpArticleSection.tsx`
- Create: `src/pages/AjudaFaq.tsx`
- Create: `src/pages/AjudaTutoriais.tsx`
- Create: `src/pages/AjudaPrivacidade.tsx`
- Create: `src/pages/AjudaTermos.tsx`
- Create: `src/pages/AjudaDados.tsx`
- Create: `src/pages/AjudaContato.tsx`
- Test: `src/test/integration/HelpSubpages.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the failing subpages test**

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AjudaFaq from "@/pages/AjudaFaq";
import AjudaDados from "@/pages/AjudaDados";

describe("Help subpages", () => {
  it("renders grouped FAQ sections", () => {
    render(
      <MemoryRouter>
        <AjudaFaq />
      </MemoryRouter>,
    );

    expect(screen.getByText("help:faq.getting_started.title")).toBeInTheDocument();
    expect(screen.getByText("help:faq.privacy.title")).toBeInTheDocument();
  });

  it("renders LGPD rights guidance", () => {
    render(
      <MemoryRouter>
        <AjudaDados />
      </MemoryRouter>,
    );

    expect(screen.getByText("help:data_rights.title")).toBeInTheDocument();
    expect(screen.getByText("suporte@arenacup.net")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/test/integration/HelpSubpages.test.tsx`

Expected: FAIL because the new page modules do not exist yet.

- [ ] **Step 3: Implement the subpages and route map**

`src/components/help/HelpAccordionGroup.tsx`

```tsx
import * as Accordion from "@radix-ui/react-accordion";
import type { HelpFaqGroup } from "@/lib/help/content";

export function HelpAccordionGroup({ group }: { group: HelpFaqGroup }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-black text-white">{group.title}</h2>
      <Accordion.Root type="multiple" className="space-y-3">
        {group.items.map((item, index) => (
          <Accordion.Item
            key={`${group.title}-${index}`}
            value={`${group.title}-${index}`}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <Accordion.Header>
              <Accordion.Trigger className="w-full text-left text-sm font-bold text-white">
                {item.title}
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="space-y-2 pt-3 text-sm leading-relaxed text-muted-foreground">
              <p>{item.summary}</p>
              <p>{item.body}</p>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
}
```

`src/pages/AjudaFaq.tsx`

```tsx
import { useTranslation } from "react-i18next";
import { HelpPageShell } from "@/components/help/HelpPageShell";
import { HelpAccordionGroup } from "@/components/help/HelpAccordionGroup";
import { getFaqGroups } from "@/lib/help/content";

export default function AjudaFaq() {
  const { t } = useTranslation("help");
  const groups = getFaqGroups(t);

  return (
    <HelpPageShell
      eyebrow={t("categories.faq.title")}
      title={t("categories.faq.title")}
      description={t("categories.faq.summary")}
    >
      <div className="space-y-6">
        {groups.map((group) => (
          <HelpAccordionGroup key={group.title} group={group} />
        ))}
      </div>
    </HelpPageShell>
  );
}
```

`src/pages/AjudaDados.tsx`

```tsx
import { useTranslation } from "react-i18next";
import { HelpPageShell } from "@/components/help/HelpPageShell";

const SUPPORT_EMAIL = "suporte@arenacup.net";

export default function AjudaDados() {
  const { t } = useTranslation("help");

  return (
    <HelpPageShell
      eyebrow={t("categories.data.title")}
      title={t("data_rights.title")}
      description={t("data_rights.subtitle")}
    >
      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-black text-white">{t("data_rights.rights_title")}</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>{t("data_rights.items.confirmation")}</li>
          <li>{t("data_rights.items.access")}</li>
          <li>{t("data_rights.items.correction")}</li>
          <li>{t("data_rights.items.deletion")}</li>
          <li>{t("data_rights.items.portability")}</li>
        </ul>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("data_rights.contact_prefix")}{" "}
          <a className="font-semibold text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
    </HelpPageShell>
  );
}
```

`src/App.tsx`

```tsx
const AjudaFaq = lazy(() => import("./pages/AjudaFaq"));
const AjudaTutoriais = lazy(() => import("./pages/AjudaTutoriais"));
const AjudaPrivacidade = lazy(() => import("./pages/AjudaPrivacidade"));
const AjudaTermos = lazy(() => import("./pages/AjudaTermos"));
const AjudaDados = lazy(() => import("./pages/AjudaDados"));
const AjudaContato = lazy(() => import("./pages/AjudaContato"));

<Route path="/ajuda/faq" element={<ProtectedRoute><Layout><AjudaFaq /></Layout></ProtectedRoute>} />
<Route path="/ajuda/tutoriais" element={<ProtectedRoute><Layout><AjudaTutoriais /></Layout></ProtectedRoute>} />
<Route path="/ajuda/privacidade" element={<ProtectedRoute><Layout><AjudaPrivacidade /></Layout></ProtectedRoute>} />
<Route path="/ajuda/termos" element={<ProtectedRoute><Layout><AjudaTermos /></Layout></ProtectedRoute>} />
<Route path="/ajuda/dados" element={<ProtectedRoute><Layout><AjudaDados /></Layout></ProtectedRoute>} />
<Route path="/ajuda/contato" element={<ProtectedRoute><Layout><AjudaContato /></Layout></ProtectedRoute>} />
```

Expand the `help.json` locale files in this task so the new pages have the keys they need before rendering:

`public/locales/pt-BR/help.json`

```json
{
  "privacy_summary": {
    "title": "Privacidade e LGPD",
    "subtitle": "Entenda de forma simples como o ArenaCup usa dados para operar a conta, personalizar a experiência e manter a segurança.",
    "data_title": "Quais dados usamos",
    "data_body": "O ArenaCup trata dados de conta, perfil, participação em bolões, notificações e sinais técnicos de segurança para operar o serviço.",
    "rights_title": "Como exercer seus direitos",
    "rights_body": "Se você quiser pedir acesso, correção, eliminação quando cabível ou outra solicitação relacionada à LGPD, envie seu pedido para suporte@arenacup.net."
  },
  "terms_summary": {
    "title": "Resumo dos Termos",
    "subtitle": "Veja as regras principais de uso da plataforma antes de consultar o texto jurídico completo.",
    "use_title": "Uso da conta",
    "use_body": "Você é responsável pelo uso da sua conta, pela veracidade das informações fornecidas e pelo respeito às regras da plataforma.",
    "responsibility_title": "Responsabilidade em bolões privados",
    "responsibility_body": "Em grupos privados com premiação, a responsabilidade pela gestão e pela combinação financeira pertence ao organizador do grupo."
  },
  "data_rights": {
    "title": "Seus dados e direitos",
    "subtitle": "O ArenaCup oferece um canal direto para pedidos relacionados à LGPD.",
    "rights_title": "Direitos que você pode solicitar",
    "contact_prefix": "Para pedidos de dados, entre em contato por",
    "items": {
      "confirmation": "Confirmação da existência de tratamento.",
      "access": "Acesso aos dados pessoais vinculados à sua conta.",
      "correction": "Correção de dados incompletos, inexatos ou desatualizados.",
      "deletion": "Eliminação, bloqueio ou anonimização quando o pedido for cabível.",
      "portability": "Portabilidade quando aplicável e tecnicamente viável."
    }
  },
  "contact": {
    "title": "Contato e suporte",
    "subtitle": "Use o canal oficial do ArenaCup para ajuda operacional, dúvidas sobre conta e solicitações de privacidade.",
    "email_title": "Canal oficial",
    "how_to_write_title": "Como escrever para o suporte",
    "how_to_write_body": "Inclua o e-mail da conta, o assunto principal e uma descrição objetiva do problema ou da solicitação."
  }
}
```

Mirror the same keys in `public/locales/en/help.json` and `public/locales/es/help.json` with translated copy before creating the new pages.

`src/pages/AjudaTutoriais.tsx`

```tsx
import { useTranslation } from "react-i18next";
import { HelpPageShell } from "@/components/help/HelpPageShell";
import { getTutorialGroups } from "@/lib/help/content";

export default function AjudaTutoriais() {
  const { t } = useTranslation("help");
  const groups = getTutorialGroups(t);

  return (
    <HelpPageShell
      eyebrow={t("categories.tutorials.title")}
      title={t("categories.tutorials.title")}
      description={t("categories.tutorials.summary")}
    >
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.title} className="space-y-3">
            <h2 className="text-lg font-black text-white">{group.title}</h2>
            {group.items.map((item) => (
              <article key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-base font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.intent}</p>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {item.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </article>
            ))}
          </section>
        ))}
      </div>
    </HelpPageShell>
  );
}
```

`src/pages/AjudaPrivacidade.tsx`

```tsx
import { useTranslation } from "react-i18next";
import { HelpPageShell } from "@/components/help/HelpPageShell";

export default function AjudaPrivacidade() {
  const { t } = useTranslation("help");

  return (
    <HelpPageShell
      eyebrow={t("categories.privacy.title")}
      title={t("privacy_summary.title")}
      description={t("privacy_summary.subtitle")}
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-black text-white">{t("privacy_summary.data_title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("privacy_summary.data_body")}
        </p>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-black text-white">{t("privacy_summary.rights_title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("privacy_summary.rights_body")}
        </p>
      </section>
    </HelpPageShell>
  );
}
```

`src/pages/AjudaTermos.tsx`

```tsx
import { useTranslation } from "react-i18next";
import { HelpPageShell } from "@/components/help/HelpPageShell";

export default function AjudaTermos() {
  const { t } = useTranslation("help");

  return (
    <HelpPageShell
      eyebrow={t("categories.terms.title")}
      title={t("terms_summary.title")}
      description={t("terms_summary.subtitle")}
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-black text-white">{t("terms_summary.use_title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("terms_summary.use_body")}
        </p>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-black text-white">{t("terms_summary.responsibility_title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("terms_summary.responsibility_body")}
        </p>
      </section>
    </HelpPageShell>
  );
}
```

`src/pages/AjudaContato.tsx`

```tsx
import { useTranslation } from "react-i18next";
import { HelpPageShell } from "@/components/help/HelpPageShell";

const SUPPORT_EMAIL = "suporte@arenacup.net";

export default function AjudaContato() {
  const { t } = useTranslation("help");

  return (
    <HelpPageShell
      eyebrow={t("categories.contact.title")}
      title={t("contact.title")}
      description={t("contact.subtitle")}
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-black text-white">{t("contact.email_title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          <a className="font-semibold text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-black text-white">{t("contact.how_to_write_title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("contact.how_to_write_body")}
        </p>
      </section>
    </HelpPageShell>
  );
}
```

- [ ] **Step 4: Run the subpages test**

Run: `npx vitest run src/test/integration/HelpSubpages.test.tsx`

Expected: PASS with FAQ and data-rights page coverage green.

- [ ] **Step 5: Commit the routed help sections**

```bash
git add src/components/help/HelpAccordionGroup.tsx src/components/help/HelpArticleSection.tsx src/pages/AjudaFaq.tsx src/pages/AjudaTutoriais.tsx src/pages/AjudaPrivacidade.tsx src/pages/AjudaTermos.tsx src/pages/AjudaDados.tsx src/pages/AjudaContato.tsx src/App.tsx src/test/integration/HelpSubpages.test.tsx
git commit -m "feat: add help center sections"
```

### Task 4: Rewire Profile, Menu, Footer, And Support Email Copy

**Files:**
- Test: `src/test/integration/Menu.test.tsx`
- Modify: `src/pages/Perfil.tsx`
- Modify: `src/pages/Menu.tsx`
- Modify: `src/components/Layout.tsx`
- Modify: `src/services/monetization/stripe.service.ts`
- Modify: `src/pages/ExcluirConta.tsx`
- Modify: `public/locales/pt-BR/profile.json`
- Modify: `public/locales/en/profile.json`
- Modify: `public/locales/es/profile.json`

- [ ] **Step 1: Write the failing navigation test**

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Menu from "@/pages/Menu";

describe("Menu help navigation", () => {
  it("routes the help entry point through the new help center", () => {
    render(
      <MemoryRouter>
        <Menu />
      </MemoryRouter>,
    );

    expect(screen.getByText("menu.help_title")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails or provides no help-center routing yet**

Run: `npx vitest run src/test/integration/Menu.test.tsx src/test/integration/Perfil.test.tsx`

Expected: FAIL for the new menu test or reveal that profile/menu still point to `/regras` and `/privacidade` instead of the Help Center.

- [ ] **Step 3: Repoint entry points and replace every remaining support email**

`src/pages/Menu.tsx`

```tsx
<button
  onClick={() => navigate("/ajuda")}
  className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
>
  <HelpCircle className="w-5 h-5 text-muted-foreground" />
  <div className="flex-1">
    <span className="font-bold text-sm">{t("menu.help_title")}</span>
    <p className="text-[10px] text-muted-foreground mt-0.5">{t("menu.help_desc")}</p>
  </div>
</button>

<button
  onClick={() => navigate("/ajuda/privacidade")}
  className="w-full p-4 glass-card-hover text-left flex items-center gap-3"
>
  <Shield className="w-5 h-5 text-muted-foreground" />
  <div className="flex-1">
    <span className="font-bold text-sm">{t("menu.privacy_title")}</span>
    <p className="text-[10px] text-muted-foreground mt-0.5">{t("menu.privacy_desc")}</p>
  </div>
</button>
```

`src/pages/Perfil.tsx`

```tsx
<div className="glass-card divide-y divide-border/30 flex flex-col">
  <button onClick={() => navigate("/ajuda")} className="p-4 text-left text-sm font-bold hover:bg-white/5 transition-colors">
    {t("help_center")}
  </button>
  <button onClick={() => navigate("/ajuda/faq")} className="p-4 text-left text-sm font-bold hover:bg-white/5 transition-colors">
    {t("help_rules")}
  </button>
  <button onClick={() => navigate("/ajuda/termos")} className="p-4 text-left text-sm font-bold hover:bg-white/5 transition-colors">
    {t("help_terms")}
  </button>
  <button onClick={() => navigate("/ajuda/privacidade")} className="p-4 text-left text-sm font-bold hover:bg-white/5 transition-colors">
    {t("help_privacy")}
  </button>
</div>
```

`src/components/Layout.tsx`

```tsx
<div className="flex gap-6">
  <NavLink to="/termos" className="hover:text-primary transition-colors">{t("footer.terms")}</NavLink>
  <NavLink to="/privacidade" className="hover:text-primary transition-colors">{t("footer.privacy")}</NavLink>
  <a href="mailto:suporte@arenacup.net" className="hover:text-primary transition-colors">
    {t("footer.contact")}
  </a>
</div>
```

`src/services/monetization/stripe.service.ts`

```ts
export const PREMIUM_SUPPORT_EMAIL = "suporte@arenacup.net";
```

`src/pages/ExcluirConta.tsx`

```ts
const supportEmail = "suporte@arenacup.net";
```

Update the profile locale files so the section title and menu copy explicitly reference the Help Center rather than a generic legal-only area.

- [ ] **Step 4: Run the profile/menu regression tests**

Run: `npx vitest run src/test/integration/Menu.test.tsx src/test/integration/Perfil.test.tsx`

Expected: PASS with the menu/profile screens still rendering and the new help entry point available.

- [ ] **Step 5: Commit navigation and support-email rewiring**

```bash
git add src/pages/Perfil.tsx src/pages/Menu.tsx src/components/Layout.tsx src/services/monetization/stripe.service.ts src/pages/ExcluirConta.tsx public/locales/pt-BR/profile.json public/locales/en/profile.json public/locales/es/profile.json src/test/integration/Menu.test.tsx src/test/integration/Perfil.test.tsx
git commit -m "refactor: route help entry points through help center"
```

### Task 5: Refresh The Public Privacy, Terms, And Account Deletion Pages

**Files:**
- Create: `src/components/help/LegalRichTextSection.tsx`
- Test: `src/test/integration/PublicLegalPages.test.tsx`
- Modify: `src/components/LegalPage.tsx`
- Modify: `src/pages/Privacidade.tsx`
- Modify: `src/pages/Termos.tsx`
- Modify: `src/pages/ExcluirConta.tsx`
- Modify: `public/locales/pt-BR/help.json`
- Modify: `public/locales/en/help.json`
- Modify: `public/locales/es/help.json`

- [ ] **Step 1: Write the failing public legal pages test**

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Privacidade from "@/pages/Privacidade";
import Termos from "@/pages/Termos";

describe("public legal pages", () => {
  it("renders the richer privacy policy structure", () => {
    render(
      <MemoryRouter>
        <Privacidade />
      </MemoryRouter>,
    );

    expect(screen.getByText("help:public_legal.privacy.title")).toBeInTheDocument();
    expect(screen.getByText("help:public_legal.privacy.sections.data_use.title")).toBeInTheDocument();
  });

  it("renders the richer terms structure", () => {
    render(
      <MemoryRouter>
        <Termos />
      </MemoryRouter>,
    );

    expect(screen.getByText("help:public_legal.terms.title")).toBeInTheDocument();
    expect(screen.getByText("help:public_legal.terms.sections.acceptable_use.title")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/test/integration/PublicLegalPages.test.tsx`

Expected: FAIL because the current pages only render thin `common.legal.*` copy.

- [ ] **Step 3: Move the legal source of truth into the help namespace and rebuild the public pages**

`src/components/LegalPage.tsx`

```tsx
interface LegalPageProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const LegalPage = ({ title, description, children }: LegalPageProps) => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-center text-3xl font-black text-white">{title}</h1>
          {description ? (
            <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <div className="mx-auto mt-8 max-w-3xl space-y-8 text-[15px] leading-8 text-gray-300">
          {children}
        </div>
      </div>
    </Layout>
  );
};
```

`src/pages/Privacidade.tsx`

```tsx
import { LegalPage } from "@/components/LegalPage";
import { useTranslation } from "react-i18next";

export default function Privacidade() {
  const { t } = useTranslation("help");

  return (
    <LegalPage
      title={t("public_legal.privacy.title")}
      description={t("public_legal.privacy.description")}
    >
      <section>
        <h2 className="mb-4 text-xl font-bold text-white">
          {t("public_legal.privacy.sections.data_use.title")}
        </h2>
        <p>{t("public_legal.privacy.sections.data_use.body")}</p>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold text-white">
          {t("public_legal.privacy.sections.rights.title")}
        </h2>
        <p>{t("public_legal.privacy.sections.rights.body")}</p>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold text-white">
          {t("public_legal.privacy.sections.contact.title")}
        </h2>
        <p>{t("public_legal.privacy.sections.contact.body")}</p>
      </section>
      <p>{t("public_legal.privacy.effective_date")}</p>
    </LegalPage>
  );
}
```

`src/pages/Termos.tsx`

```tsx
import { LegalPage } from "@/components/LegalPage";
import { useTranslation } from "react-i18next";

export default function Termos() {
  const { t } = useTranslation("help");

  return (
    <LegalPage
      title={t("public_legal.terms.title")}
      description={t("public_legal.terms.description")}
    >
      <section>
        <h2 className="mb-4 text-xl font-bold text-white">
          {t("public_legal.terms.sections.acceptable_use.title")}
        </h2>
        <p>{t("public_legal.terms.sections.acceptable_use.body")}</p>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold text-white">
          {t("public_legal.terms.sections.private_pools.title")}
        </h2>
        <p>{t("public_legal.terms.sections.private_pools.body")}</p>
      </section>
      <section>
        <h2 className="mb-4 text-xl font-bold text-white">
          {t("public_legal.terms.sections.support.title")}
        </h2>
        <p>{t("public_legal.terms.sections.support.body")}</p>
      </section>
      <p>{t("public_legal.terms.effective_date")}</p>
    </LegalPage>
  );
}
```

Also update the `help.json` locale files with real `public_legal.privacy.*`, `public_legal.terms.*`, and `data_rights.*` content. Keep the copy aligned with the approved spec:

- identify data categories
- explain purposes
- explain essential vs optional data
- describe request channels
- mention retention caveats
- mention contact first, then ANPD escalation if unresolved

- [ ] **Step 4: Run the public legal pages test**

Run: `npx vitest run src/test/integration/PublicLegalPages.test.tsx`

Expected: PASS with both public legal pages rendering the richer sections.

- [ ] **Step 5: Commit the public legal refresh**

```bash
git add src/components/help/LegalRichTextSection.tsx src/components/LegalPage.tsx src/pages/Privacidade.tsx src/pages/Termos.tsx src/pages/ExcluirConta.tsx public/locales/pt-BR/help.json public/locales/en/help.json public/locales/es/help.json src/test/integration/PublicLegalPages.test.tsx
git commit -m "feat: refresh public legal pages"
```

### Task 6: Run Regression Verification And Ship Readiness Checks

**Files:**
- Test: `src/test/integration/HelpContent.test.tsx`
- Test: `src/test/integration/Ajuda.test.tsx`
- Test: `src/test/integration/HelpSubpages.test.tsx`
- Test: `src/test/integration/Menu.test.tsx`
- Test: `src/test/integration/Perfil.test.tsx`
- Test: `src/test/integration/PublicLegalPages.test.tsx`

- [ ] **Step 1: Run the focused integration test suite**

Run:

```bash
npx vitest run src/test/integration/HelpContent.test.tsx src/test/integration/Ajuda.test.tsx src/test/integration/HelpSubpages.test.tsx src/test/integration/Menu.test.tsx src/test/integration/Perfil.test.tsx src/test/integration/PublicLegalPages.test.tsx
```

Expected: PASS with all help/legal/profile related integration tests green.

- [ ] **Step 2: Run the locale audit**

Run: `npm run audit:i18n`

Expected: PASS with no missing key errors for the new `help` namespace across `pt-BR`, `en`, and `es`.

- [ ] **Step 3: Run the main quality gates**

Run:

```bash
npm run lint
npm run test
npm run build
```

Expected:

- `lint`: PASS with no new warnings/errors in touched files
- `test`: PASS across the repo test suite
- `build`: PASS and emit a production build without route or translation errors

- [ ] **Step 4: Do the manual smoke checklist**

Manual checklist:

- Log in and open `/ajuda`
- Open each subroute:
  - `/ajuda/faq`
  - `/ajuda/tutoriais`
  - `/ajuda/privacidade`
  - `/ajuda/termos`
  - `/ajuda/dados`
  - `/ajuda/contato`
- Open `/privacidade`, `/termos`, and `/excluir-conta` while logged out
- Confirm `suporte@arenacup.net` is the visible contact everywhere
- Confirm footer links still work
- Confirm profile/menu entry points open the Help Center

- [ ] **Step 5: Commit the verified rollout**

```bash
git add src public docs
git commit -m "feat: launch multilingual help center"
```
