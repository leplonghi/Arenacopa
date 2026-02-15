# Redesign "Copa" Page UX

## Objective
Revamp the "Copa" page UX/UI to create a hybrid "Broadcast/Tactical" experience. The goal is to mix high-energy visuals (excitement) with dense information (smart).

## User Preferences
1.  **Vibe:** Mix of "Excited" (Broadcast) and "Informed" (Tactical).
2.  **Hierarchy:** 
    1.  World Cup Bracket (Current Stage/Visual)
    2.  Next Match (Dynamic Colors)
    3.  Bolão Status (Personal Rank)
3.  **Visuals:** Dynamic team themes, Soccer Field background preserved.

## Plan

### Phase 1: visual-assets & Components
- [ ] **Dynamic Background Manager:** Update background overlay based on active match/team colors.
- [ ] **Hero Component (The Bracket):** Create a `TournamentStageTracker` component.
    -   *Concept:* Instead of a full giant tree, show the current "Stage" (e.g., Round of 16) with active timeline nodes.
    -   *Interaction:* Swipe to see previous/next stages.
- [ ] **Match Feature Card:** Redesign `MatchCard` to be a "Broadcast Banner".
    -   Size: Large.
    -   Background: Split gradient of Home vs Away team colors.
    -   Content: Big typography for score/time.
- [ ] **Bolão Widget:** A compact "Live Ticker" style status bar or floating card.

### Phase 2: Page Layout (`CopaOverview.tsx`)
- [ ] **Layout Structure:** Vertical scroll "Feed".
    -   **Top:** Tournament Tracker (Bracket Hero).
    -   **Middle:** Featured Match (Broadcast Style).
    -   **Bottom:** Bolão Stats & News Feed.
- [ ] **Glassmorphism 2.0:** Ensure "Field" background is visible but content is legible using "Frosted Glass" with noise texture, not just blur.

### Phase 3: Navigation & Transitions
- [ ] Refine Top Tabs to be less intrusive (maybe "Pill" style).
- [ ] Add smooth layout transitions (Framer Motion `layoutId`).

## Technical details
-   **File:** `src/components/copa/CopaOverview.tsx` (Major Refactor)
-   **File:** `src/components/MatchCard.tsx` (New Variant or Prop)
-   **Context:** `SimulacaoContext` needed for bracket logic?
