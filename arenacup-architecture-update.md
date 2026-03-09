# ArenaCup: Feature Updates & Architecture Shift (Firebase + Native)

## Execution Plan

### Immediate Action Items (Based on Socratic Answers)

1. **Database & Auth Migration (Supabase ➔ Firebase)**
   - **Goal:** Completely rip out `@supabase/supabase-js` and migrate database and authentication rules to Google Firebase.
   - **Approach:** 
     - Initialize `firebase/app`, `firebase/firestore`, and `firebase/auth` in `src/integrations/firebase/client.ts`.
     - Replace `AuthContext.tsx` logic to point to Firebase Authentication.
     - Refactor queries in components (e.g. `Boloes.tsx`, `CriarBolao.tsx`, `Perfil.tsx`) over to Firestore syntax.
     - Replace Supabase schema dependencies with Firestore NoSQL collections:
       - `boloes`
       - `bolao_members`
       - `users`
       - `news_cache`
       - `predictions`
     - Remove Supabase environment variables and code paths.

2. **Native Monetization Strategy**
   - **Goal:** Rip out any Stripe/Web billing placeholders (`MonetizationContext.tsx`) and prep for `@capacitor-community/in-app-purchases` or `Purchases` (RevenueCat).
   - **Product:** ArenaCup PRO 2026 (non-consumable).

3. **Hybrid Bolões Join System**
   - **Goal:** Allow "magic link" deep linking and short code invites.
   - **Feature:** "Invite 5 users" progress indicator post-creation. Deep link handling using Capacitor's App plugin.

4. **News Aggregation Layer**
   - **Goal:** Redirect news directly to source web views for now instead of complex API processing, ensuring zero client-side scraping.
   - **Task:** Refactor `NewsFeed.tsx` and `NoticiasTab.tsx` to just open external web layers.

5. **Gamification & Shareable Social Cards**
   - **Goal:** Let users explicitly "Share" dynamic images. Supported locally via `html-to-image` and output to Capacitor's Share/Save Gallery native APIs.

---

### Step-by-Step Execution

**Phase 1: Firebase Overhaul (CRITICAL PATH)**
1. Install `firebase` and `@capacitor/share`. 
2. Create `firebase/config.ts` context. 
3. Replace `AuthContext.tsx` backend.
4. Convert `Boloes`, `CriarBolao`, `BolaoDetail` queries to Firestore.
5. Drop Supabase modules entirely.

**Phase 2: Hybrid Boloes & News Redirection**
1. Add invite progress to Create Bolão flow. 
2. Refactor News Tab.

**Phase 3: Shareable Cards & Native Monetization Stub**
1. Build `SocialCardGenerator.tsx`.
2. Integrate `@capacitor/share`.

Will begin Phase 1 immediately.
