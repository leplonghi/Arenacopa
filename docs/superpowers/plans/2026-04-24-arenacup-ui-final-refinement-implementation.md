# ArenaCup UI Final Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the final ArenaCup visual system across the entire app, using the latest references as the primary UI direction while preserving routes, hooks, data, backend behavior, and dynamic rendering.

**Architecture:** Implement the refinement shell-first: consolidate global tokens, shell, primitives, and asset slots before polishing individual surfaces. Each screen should reuse shared primitives instead of inventing local visual rules, and every missing PNG-dependent visual should render through an explicit asset slot with a stable future path in `public/assets/arena/`.

**Tech Stack:** React 18, React Router 6, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Firebase client services, Vitest, React Testing Library, Vite.

---

## Scope Check

This remains one implementation plan because the request is a single visual system rollout across the app. Splitting by page would create drift in shell, cards, typography, asset placeholders, and navigation. The work is still executed in waves so each checkpoint is buildable and reviewable.

## Current Workspace Note

The workspace already contains uncommitted UI changes from prior refinement work. Do not revert them. Treat them as the current baseline and layer this plan on top of them. When committing, stage only files touched by the active task.

## File Structure

### Global foundation

- Modify: `src/index.css`
  - Own final tokens, app background, typography helpers, surface classes, buttons, badges, progress utilities, responsive screen spacing.
- Modify: `tailwind.config.ts`
  - Align font family aliases and arena color tokens with CSS variables.
- Modify: `src/components/Layout.tsx`
  - Final shell: header geometry, background, notification/avatar controls, bottom navigation with center `Palpitar`.
- Modify: `src/components/arena/ArenaPrimitives.tsx`
  - Shared UI primitives used by all modules.
- Create: `src/components/arena/ArenaAssetSlot.tsx`
  - Reusable PNG slot with fallback, expected filename, and stable ratio.
- Create: `public/assets/arena/README.md`
  - Human-readable list of expected PNG files and transparent-background requirements.
- Create: `src/test/unit/arenaAssetSlot.test.tsx`
  - Verifies fallback and loaded asset behavior.

### Main visual modules

- Modify: `src/pages/Index.tsx`
- Modify: `src/components/home/HeroPalpites.tsx`
- Modify: `src/components/home/HomeFeaturedMatch.tsx`
- Modify: `src/components/home/MatchListItem.tsx`
- Modify: `src/components/home/DailyChallengeCard.tsx`
- Modify: `src/components/home/ProfileSummary.tsx`
  - Home must match the latest compact action-first reference.

- Modify: `src/pages/Campeonatos.tsx`
- Modify: `src/pages/Copa.tsx`
- Modify: `src/components/copa/CopaOverview.tsx`
  - Championship catalog and World Cup detail must use asset slots and final competition card language.

- Modify: `src/components/copa/MatchDetailsModal.tsx`
- Modify: `src/components/copa/bolao/JogosTab.tsx`
  - Match and prediction surfaces must use final match hero, markets, options, and prediction footer patterns.

- Modify: `src/pages/Ranking.tsx`
- Modify: `src/components/ranking/RankingPodium.tsx`
- Modify: `src/components/ranking/RankingListRow.tsx`
- Modify: `src/components/ranking/RewardProgressCard.tsx`
- Modify: `src/pages/Perfil.tsx`
- Modify: `src/components/profile/AchievementBadge.tsx`
- Modify: `src/components/profile/AchievementRail.tsx`
- Modify: `src/components/profile/HistoryStatList.tsx`
  - Ranking and profile must share final gamification grammar.

- Modify: `src/pages/Boloes.tsx`
- Modify: `src/pages/BolaoDetail.tsx`
- Modify: `src/pages/Grupos.tsx`
- Modify: `src/pages/GrupoDetail.tsx`
- Modify: `src/pages/Menu.tsx`
- Modify: `src/features/social/AdmissionInbox.tsx`
- Modify: `src/features/boloes/shared/BolaoEntryGuidance.tsx`
  - Social and operational areas must inherit the same shell, cards, CTAs, empty states, and status styles.

### Tests and QA

- Create: `src/test/integration/ArenaVisualFoundation.test.tsx`
  - Smoke tests for shell, bottom nav, asset slots, and core route render surfaces.
- Modify: `src/test/integration/Perfil.test.tsx`
  - Keep profile render assertions compatible with refined components.
- Use existing integration tests for bolão/group flows when those screens are touched.

## Asset Slot Contract

All future PNGs go in `public/assets/arena/`. Implement slots with paths like `/assets/arena/wc2026-trophy.png`. A missing image must not break layout; it must show a designed fallback with the expected filename visible to the team.

Expected asset filenames:

- `wc2026-trophy.png`
- `brasileirao-logo.png`
- `libertadores-logo.png`
- `premier-league-logo.png`
- `ligue1-logo.png`
- `laliga-logo.png`
- `bundesliga-logo.png`
- `champions-league-logo.png`
- `saudi-league-logo.png`
- `home-palpites-hero-art.png`
- `center-ball-nav.png`
- `daily-challenge-icon.png`
- `reward-chest.png`
- `world-cup-badge.png`

### Task 1: Create Asset Slot Foundation

**Files:**
- Create: `src/components/arena/ArenaAssetSlot.tsx`
- Create: `public/assets/arena/README.md`
- Create: `src/test/unit/arenaAssetSlot.test.tsx`

- [ ] **Step 1: Write the failing asset slot test**

`src/test/unit/arenaAssetSlot.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArenaAssetSlot } from "@/components/arena/ArenaAssetSlot";

describe("ArenaAssetSlot", () => {
  it("renders the expected asset name when the slot is waiting for a PNG", () => {
    render(
      <ArenaAssetSlot
        name="wc2026-trophy.png"
        label="Troféu da Copa"
        className="h-32 w-32"
      />,
    );

    expect(screen.getByText("Troféu da Copa")).toBeInTheDocument();
    expect(screen.getByText("wc2026-trophy.png")).toBeInTheDocument();
  });

  it("renders an image when src is provided", () => {
    render(
      <ArenaAssetSlot
        name="premier-league-logo.png"
        label="Premier League"
        src="/assets/arena/premier-league-logo.png"
      />,
    );

    expect(screen.getByRole("img", { name: "Premier League" })).toHaveAttribute(
      "src",
      "/assets/arena/premier-league-logo.png",
    );
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npx vitest run src/test/unit/arenaAssetSlot.test.tsx`

Expected: FAIL because `ArenaAssetSlot` does not exist.

- [ ] **Step 3: Implement the asset slot component**

`src/components/arena/ArenaAssetSlot.tsx`

```tsx
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ArenaAssetSlotProps = {
  name: string;
  label: string;
  src?: string | null;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
};

export function ArenaAssetSlot({
  name,
  label,
  src,
  className,
  imgClassName,
  fallbackClassName,
}: ArenaAssetSlotProps) {
  return (
    <div
      className={cn(
        "relative flex aspect-square items-center justify-center overflow-hidden rounded-[22px] border border-[#7dff48]/20 bg-[radial-gradient(circle_at_50%_20%,rgba(255,200,40,0.14),transparent_36%),linear-gradient(160deg,rgba(10,45,28,0.82),rgba(2,10,8,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_38px_-28px_rgba(0,0,0,0.85)]",
        className,
      )}
      data-asset-slot={name}
    >
      {src ? (
        <img
          src={src}
          alt={label}
          className={cn("h-full w-full object-contain p-3 drop-shadow-[0_14px_24px_rgba(0,0,0,0.38)]", imgClassName)}
        />
      ) : (
        <div className={cn("flex flex-col items-center justify-center gap-2 p-3 text-center", fallbackClassName)}>
          <ImageIcon className="h-7 w-7 text-[#ffc928]" />
          <span className="font-display text-[1.05rem] font-semibold uppercase leading-none text-white">
            {label}
          </span>
          <span className="max-w-full truncate rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-semibold text-white/60">
            {name}
          </span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add the asset README**

`public/assets/arena/README.md`

```md
# ArenaCup Visual Assets

Place final PNG assets for the ArenaCup UI refinement in this folder.

Requirements:

- PNG format
- transparent background
- one asset per file
- no UI card, button, text, badge, border, or screenshot fragment baked into the image
- enough resolution for mobile and desktop

Expected filenames:

- wc2026-trophy.png
- brasileirao-logo.png
- libertadores-logo.png
- premier-league-logo.png
- ligue1-logo.png
- laliga-logo.png
- bundesliga-logo.png
- champions-league-logo.png
- saudi-league-logo.png
- home-palpites-hero-art.png
- center-ball-nav.png
- daily-challenge-icon.png
- reward-chest.png
- world-cup-badge.png
```

- [ ] **Step 5: Run the asset slot test**

Run: `npx vitest run src/test/unit/arenaAssetSlot.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/components/arena/ArenaAssetSlot.tsx src/test/unit/arenaAssetSlot.test.tsx public/assets/arena/README.md
git commit -m "feat: add ArenaCup asset slot foundation"
```

### Task 2: Lock The Global Visual Foundation

**Files:**
- Modify: `src/index.css`
- Modify: `tailwind.config.ts`
- Modify: `src/components/arena/ArenaPrimitives.tsx`
- Modify: `src/components/Layout.tsx`
- Create: `src/test/integration/ArenaVisualFoundation.test.tsx`

- [ ] **Step 1: Write the foundation smoke test**

`src/test/integration/ArenaVisualFoundation.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "teste@arenacup.app" } }),
}));

describe("Arena visual foundation", () => {
  it("renders shared panels and section headers with semantic content", () => {
    render(
      <MemoryRouter>
        <ArenaPanel>
          <ArenaSectionHeader eyebrow="ArenaCopa" title="Campeonatos" />
        </ArenaPanel>
      </MemoryRouter>,
    );

    expect(screen.getByText("ArenaCopa")).toBeInTheDocument();
    expect(screen.getByText("Campeonatos")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the smoke test**

Run: `npx vitest run src/test/integration/ArenaVisualFoundation.test.tsx`

Expected: PASS or FAIL only for missing exports that this task will add.

- [ ] **Step 3: Update global CSS tokens**

Modify `src/index.css` so the final UI uses:

```css
:root {
  --arena-bg: #010705;
  --arena-surface: #06140f;
  --arena-surface-2: #092018;
  --arena-lime: #7dff48;
  --arena-lime-soft: rgba(125, 255, 72, 0.16);
  --arena-gold: #ffc928;
  --arena-orange: #ff8200;
  --arena-red: #d71920;
  --arena-border: rgba(125, 255, 72, 0.18);
  --arena-border-gold: rgba(255, 201, 40, 0.34);
}
```

Keep existing CSS variables that other components already reference, but alias them to the final palette where practical.

- [ ] **Step 4: Add final utility classes**

In `src/index.css`, keep existing utilities and add/refine:

```css
.arena-page-bg {
  background:
    linear-gradient(180deg, rgba(1, 7, 5, 0.86) 0%, rgba(1, 7, 5, 0.96) 42%, #010705 100%),
    radial-gradient(circle at 50% 0%, rgba(125, 255, 72, 0.13), transparent 34%);
}

.arena-stadium-sheen {
  background:
    radial-gradient(circle at 72% 12%, rgba(255, 201, 40, 0.16), transparent 24%),
    linear-gradient(135deg, rgba(10, 42, 26, 0.96), rgba(2, 10, 8, 0.98));
}

.arena-pill-live {
  border-color: rgba(125, 255, 72, 0.38);
  background: rgba(20, 60, 24, 0.86);
  color: #ffffff;
}

.arena-text-display {
  font-family: Teko, Manrope, sans-serif;
  letter-spacing: 0;
}
```

- [ ] **Step 5: Normalize shell spacing**

In `src/components/Layout.tsx`, keep the existing data and navigation logic but ensure:

```tsx
<header className={cn("arena-header-shell fixed inset-x-0 top-0 z-30 safe-top", className)}>
```

and bottom navigation labels include center action `Palpitar` through the existing `FabWithPending` path. Do not change route paths.

- [ ] **Step 6: Run build**

Run: `npm run build`

Expected: PASS. The known Browserslist warning may appear.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/index.css tailwind.config.ts src/components/arena/ArenaPrimitives.tsx src/components/Layout.tsx src/test/integration/ArenaVisualFoundation.test.tsx
git commit -m "feat: lock ArenaCup visual foundation"
```

### Task 3: Refine Home To Final Reference

**Files:**
- Modify: `src/pages/Index.tsx`
- Modify: `src/components/home/HeroPalpites.tsx`
- Modify: `src/components/home/HomeFeaturedMatch.tsx`
- Modify: `src/components/home/MatchListItem.tsx`
- Modify: `src/components/home/DailyChallengeCard.tsx`
- Modify: `src/components/home/ProfileSummary.tsx`

- [ ] **Step 1: Add or update a Home render smoke assertion**

Use the existing test location `src/test/integration` and create `src/test/integration/HomeFinalUi.test.tsx` if no Home test exists.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Index from "@/pages/Index";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "teste@arenacup.app" } }),
}));

vi.mock("@/contexts/MonetizationContext", () => ({
  useMonetization: () => ({ isPremium: false }),
}));

describe("Home final UI", () => {
  it("keeps the primary prediction action visible", async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/palpitar agora/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the Home test**

Run: `npx vitest run src/test/integration/HomeFinalUi.test.tsx`

Expected: FAIL only if current async mocks need the same service mocks used by existing page tests. Add mocks for dashboard/news hooks without changing component logic.

- [ ] **Step 3: Refine `HeroPalpites`**

Make the hero match the final reference:

- left icon/asset slot
- big `20` style count
- orange/gold CTA
- compact responsive layout
- optional `home-palpites-hero-art.png` slot

Use:

```tsx
<ArenaAssetSlot
  name="home-palpites-hero-art.png"
  label="Palpites pendentes"
  src="/assets/arena/home-palpites-hero-art.png"
  className="hidden h-24 w-24 shrink-0 border-[#ff8200]/35 bg-[radial-gradient(circle,rgba(255,130,0,0.22),transparent_62%)] sm:flex"
/>
```

- [ ] **Step 4: Refine match cards and list rows**

In `HomeFeaturedMatch` and `MatchListItem`, keep match props and click behavior, but align layout with:

- status/time pill at top right
- team logos fixed size
- quick `1 X 2` controls with stable dimensions
- participant count pill when data exists
- no text overlap on `430px` wide viewport

- [ ] **Step 5: Refine challenge and profile cards**

In `DailyChallengeCard` and `ProfileSummary`, use final progress styles:

```tsx
<div className="h-2 overflow-hidden rounded-full bg-white/10">
  <div className="h-full rounded-full bg-[linear-gradient(90deg,#69e83a,#ffc928)]" style={{ width: `${progress}%` }} />
</div>
```

- [ ] **Step 6: Run Home test and build**

Run:

```bash
npx vitest run src/test/integration/HomeFinalUi.test.tsx
npm run build
```

Expected: PASS. Known Browserslist warning may appear.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/pages/Index.tsx src/components/home/HeroPalpites.tsx src/components/home/HomeFeaturedMatch.tsx src/components/home/MatchListItem.tsx src/components/home/DailyChallengeCard.tsx src/components/home/ProfileSummary.tsx src/test/integration/HomeFinalUi.test.tsx
git commit -m "feat: refine ArenaCup home final UI"
```

### Task 4: Refine Campeonatos And Copa Detail

**Files:**
- Modify: `src/pages/Campeonatos.tsx`
- Modify: `src/pages/Copa.tsx`
- Modify: `src/components/copa/CopaOverview.tsx`

- [ ] **Step 1: Add championship UI smoke test**

Create `src/test/integration/CampeonatosFinalUi.test.tsx`.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Campeonatos from "@/pages/Campeonatos";

describe("Campeonatos final UI", () => {
  it("shows the World Cup hero and league catalog", async () => {
    render(
      <MemoryRouter>
        <Campeonatos />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/campeonatos/i)).toBeInTheDocument();
    expect(screen.getByText(/copa do mundo/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the championship test**

Run: `npx vitest run src/test/integration/CampeonatosFinalUi.test.tsx`

Expected: FAIL if context providers are missing. Wrap with the same providers used by existing integration tests or mock `useChampionship`.

- [ ] **Step 3: Add asset slots to the World Cup hero**

Use `ArenaAssetSlot` for `wc2026-trophy.png` in `Campeonatos.tsx` and `CopaOverview.tsx`. The slot must reserve the trophy area even before the PNG exists.

```tsx
<ArenaAssetSlot
  name="wc2026-trophy.png"
  label="Troféu Copa do Mundo 2026"
  src="/assets/arena/wc2026-trophy.png"
  className="h-52 w-40 border-[#ffc928]/30 md:h-64 md:w-48"
  imgClassName="p-0"
/>
```

- [ ] **Step 4: Map league assets**

In `Campeonatos.tsx`, add a local mapping:

```ts
const LEAGUE_ASSET_BY_ID: Record<string, string> = {
  brasileirao2026: "/assets/arena/brasileirao-logo.png",
  libertadores2026: "/assets/arena/libertadores-logo.png",
  premier2526: "/assets/arena/premier-league-logo.png",
  ligue12526: "/assets/arena/ligue1-logo.png",
  laliga2526: "/assets/arena/laliga-logo.png",
  bundesliga2526: "/assets/arena/bundesliga-logo.png",
  saudipro2526: "/assets/arena/saudi-league-logo.png",
  ucl2526: "/assets/arena/champions-league-logo.png",
};
```

Pass each path to `ArenaAssetSlot`. Missing files should show the expected filename fallback.

- [ ] **Step 5: Refine Copa detail sections**

In `CopaOverview.tsx`, align:

- hero at top with trophy slot
- countdown card
- phase stepper
- horizontal group cards
- CTA card with gold button

Do not change Copa data sources.

- [ ] **Step 6: Run tests and build**

Run:

```bash
npx vitest run src/test/integration/CampeonatosFinalUi.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/pages/Campeonatos.tsx src/pages/Copa.tsx src/components/copa/CopaOverview.tsx src/test/integration/CampeonatosFinalUi.test.tsx
git commit -m "feat: refine championships and Copa final UI"
```

### Task 5: Refine Match And Prediction Surfaces

**Files:**
- Modify: `src/components/copa/MatchDetailsModal.tsx`
- Modify: `src/components/copa/bolao/JogosTab.tsx`
- Modify: existing bolão prediction tests if text queries need updating.

- [ ] **Step 1: Run existing bolão prediction tests**

Run:

```bash
npx vitest run src/test/integration/BolaoEditFlow.test.tsx src/test/integration/CriarBolaoWizard.test.tsx
```

Expected: PASS before changes or known warnings only.

- [ ] **Step 2: Refine match hero**

In `MatchDetailsModal.tsx`, preserve open/close, routing, tabs, and team data. Update presentation to:

- large score/confrontation panel
- status pill
- event timeline/momentum bar if data exists
- no screenshot background
- fixed team logo sizes

- [ ] **Step 3: Refine prediction markets**

In `JogosTab.tsx`, keep saving, sharing, and prediction state intact. Update market UI:

```tsx
<button
  type="button"
  className={cn(
    "min-h-[76px] rounded-[18px] border px-4 py-3 text-center transition",
    selected
      ? "border-[#7dff48] bg-[#143f18] shadow-[0_0_24px_-12px_rgba(125,255,72,0.9)]"
      : "border-white/12 bg-white/[0.04] hover:border-[#7dff48]/35",
  )}
>
  <span className="block font-display text-[2rem] font-semibold leading-none text-white">{label}</span>
  <span className="mt-1 block text-sm font-bold text-white/70">{percentage}%</span>
</button>
```

- [ ] **Step 4: Verify prediction actions still work**

Run:

```bash
npx vitest run src/test/integration/BolaoEditFlow.test.tsx src/test/integration/bolao-config.service.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/components/copa/MatchDetailsModal.tsx src/components/copa/bolao/JogosTab.tsx src/test/integration/BolaoEditFlow.test.tsx
git commit -m "feat: refine match and prediction final UI"
```

### Task 6: Refine Ranking And Perfil

**Files:**
- Modify: `src/pages/Ranking.tsx`
- Modify: `src/components/ranking/RankingPodium.tsx`
- Modify: `src/components/ranking/RankingListRow.tsx`
- Modify: `src/components/ranking/RewardProgressCard.tsx`
- Modify: `src/pages/Perfil.tsx`
- Modify: `src/components/profile/AchievementBadge.tsx`
- Modify: `src/components/profile/AchievementRail.tsx`
- Modify: `src/components/profile/HistoryStatList.tsx`
- Modify: `src/test/integration/Perfil.test.tsx`

- [ ] **Step 1: Run current profile test**

Run: `npx vitest run src/test/integration/Perfil.test.tsx`

Expected: PASS before visual changes or fail only for existing unrelated setup.

- [ ] **Step 2: Refine ranking podium**

In `RankingPodium.tsx`, preserve ranking data shape. Update the top 3 layout to:

- center first place higher and gold accented
- second and third lower
- user avatars clipped in circles
- cards with stable min-height
- no text overlap at mobile width

- [ ] **Step 3: Add reward asset slot**

In `RewardProgressCard.tsx`, use:

```tsx
<ArenaAssetSlot
  name="reward-chest.png"
  label="Próxima recompensa"
  src="/assets/arena/reward-chest.png"
  className="h-20 w-20 rounded-[18px]"
/>
```

- [ ] **Step 4: Refine profile progress**

In `Perfil.tsx`, keep profile data and actions. Align hero, metrics, achievements, history, settings, support, help, and logout blocks to final primitives.

- [ ] **Step 5: Keep profile test stable**

Update `src/test/integration/Perfil.test.tsx` only if queries rely on old visual-only text. Prefer user-visible stable text such as profile name, logout label, or settings label.

- [ ] **Step 6: Run tests and build**

Run:

```bash
npx vitest run src/test/integration/Perfil.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/pages/Ranking.tsx src/components/ranking/RankingPodium.tsx src/components/ranking/RankingListRow.tsx src/components/ranking/RewardProgressCard.tsx src/pages/Perfil.tsx src/components/profile/AchievementBadge.tsx src/components/profile/AchievementRail.tsx src/components/profile/HistoryStatList.tsx src/test/integration/Perfil.test.tsx
git commit -m "feat: refine ranking and profile final UI"
```

### Task 7: Refine Bolões, Grupos, Details, And Menu

**Files:**
- Modify: `src/pages/Boloes.tsx`
- Modify: `src/pages/BolaoDetail.tsx`
- Modify: `src/pages/Grupos.tsx`
- Modify: `src/pages/GrupoDetail.tsx`
- Modify: `src/pages/Menu.tsx`
- Modify: `src/features/social/AdmissionInbox.tsx`
- Modify: `src/features/boloes/shared/BolaoEntryGuidance.tsx`

- [ ] **Step 1: Run existing social flow tests**

Run:

```bash
npx vitest run src/test/integration/GrupoBolaoEntryPoints.test.tsx src/test/integration/group-access.service.test.ts src/test/integration/bolao-config.service.test.ts
```

Expected: PASS before visual changes.

- [ ] **Step 2: Refine hub pages**

In `Boloes.tsx` and `Grupos.tsx`, keep data fetching and navigation logic. Update:

- hero metric panel
- main CTA
- cards
- invite/request sections
- empty states
- loading cards

- [ ] **Step 3: Refine detail pages**

In `BolaoDetail.tsx` and `GrupoDetail.tsx`, keep all membership, join, approval, edit, and share logic intact. Move configuration/secondary actions into consistent panels and keep participation content visually first.

- [ ] **Step 4: Refine Menu**

In `Menu.tsx`, replace older list styling with final surface rows:

```tsx
<button className="flex w-full items-center justify-between rounded-[22px] border border-[#7dff48]/14 bg-white/[0.045] px-4 py-4 text-left transition hover:border-[#7dff48]/32 hover:bg-white/[0.07]">
  <span className="flex items-center gap-3">
    <Icon className="h-5 w-5 text-[#ffc928]" />
    <span className="font-semibold text-white">{label}</span>
  </span>
  <ChevronRight className="h-5 w-5 text-white/45" />
</button>
```

- [ ] **Step 5: Run tests and build**

Run:

```bash
npx vitest run src/test/integration/GrupoBolaoEntryPoints.test.tsx src/test/integration/group-access.service.test.ts src/test/integration/bolao-config.service.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/pages/Boloes.tsx src/pages/BolaoDetail.tsx src/pages/Grupos.tsx src/pages/GrupoDetail.tsx src/pages/Menu.tsx src/features/social/AdmissionInbox.tsx src/features/boloes/shared/BolaoEntryGuidance.tsx
git commit -m "feat: refine social and menu final UI"
```

### Task 8: Browser QA, Fidelity Pass, And Final Fixes

**Files:**
- Modify only files needed to fix mismatches discovered in QA.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Expected: Vite starts on an available local port.

- [ ] **Step 2: Open the app in the browser**

Use the Browser plugin / in-app browser for the local Vite URL. Check mobile-sized viewport first because the references are mobile-first.

- [ ] **Step 3: Inspect required routes**

Open and inspect:

- `/`
- `/campeonatos`
- `/copa`
- `/ranking`
- `/perfil`
- `/boloes`
- `/grupos`
- `/menu`

Also open one available bolão detail and one available group detail from the UI.

- [ ] **Step 4: Record material mismatches**

Use this checklist:

```md
## Fidelity Mismatches

- Header geometry:
- Bottom nav center action:
- Typography scale:
- Card density:
- Asset slots:
- CTA contrast:
- Mobile text overflow:
- Loading/empty states:
- Bolões/Grupos consistency:
```

Do not commit this checklist as a file unless the user asks for a QA report. Use it to drive fixes.

- [ ] **Step 5: Fix the mismatches**

Apply focused patches. Do not change backend logic, Firestore rules, route paths, service payloads, or business behavior.

- [ ] **Step 6: Run final verification**

Run:

```bash
npx vitest run src/test/unit/arenaAssetSlot.test.tsx src/test/integration/ArenaVisualFoundation.test.tsx src/test/integration/HomeFinalUi.test.tsx src/test/integration/CampeonatosFinalUi.test.tsx src/test/integration/Perfil.test.tsx
npm run build
```

Expected: PASS. Known Browserslist warning may appear.

- [ ] **Step 7: Commit final QA fixes**

Run:

```bash
git add src public/assets/arena docs/superpowers/plans/2026-04-24-arenacup-ui-final-refinement-implementation.md
git commit -m "fix: polish ArenaCup final UI fidelity"
```

## Execution Notes

- Do not insert screenshots from the reference images into the app.
- Do not bake labels, numbers, CTAs, cards, badges, or controls into PNGs.
- Do not block implementation waiting for PNGs. Use `ArenaAssetSlot` placeholders.
- When the user later provides PNGs, place them in `public/assets/arena/` with the exact expected filenames and verify layout without restructuring.
- Keep commits small. Each task should be independently buildable.

## Final Acceptance

The refinement is ready when:

- `npm run build` passes.
- New/updated Vitest checks pass.
- Browser QA confirms the final reference language across app-wide shell and required routes.
- Missing assets show clean placeholders with expected filenames.
- No route, hook, service, backend operation, or business rule is changed for visual reasons.
