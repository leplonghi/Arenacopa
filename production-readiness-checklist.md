# ArenaCopa Production Readiness Checklist

## 1. Quality Gates
- [ ] Run `npm run lint`
- [ ] Run `npm run test`
- [ ] Run `npm run build`
- [ ] Run `node -c functions/index.js`
- [ ] Smoke test the app in `pt-BR`, `en` and `es`

## 2. Firebase
- [ ] Confirm the selected Firebase project is the production project
- [ ] Deploy Firestore rules with `firebase deploy --only firestore:rules`
- [ ] Deploy Cloud Functions with `firebase deploy --only functions`
- [ ] Verify the functions `onMatchResultUpdated`, `onBolaoPalpiteWrite`, `onBolaoPredictionWrite`, `onBolaoMarketWrite` and `onNewBolaoMember`
- [ ] Check required Firestore composite indexes in the Firebase console

## 3. Data Integrity
- [ ] Confirm `matches` has real data loaded
- [ ] Confirm `copa_news` has real-time news items
- [ ] Confirm `bolao_markets` is created for newly created pools
- [ ] Confirm `bolao_predictions` is written for match, phase, tournament and special markets
- [ ] Confirm `bolao_activity` is receiving events
- [ ] Confirm `bolao_rankings` is recalculated after new predictions and result resolution

## 4. UX Flows
- [ ] Login with e-mail and password
- [ ] Login with Google
- [ ] Onboarding opens only for real authenticated users and not in demo mode
- [ ] Changing language works without breaking layout
- [ ] Bottom navigation works on mobile
- [ ] Profile/avatar entry opens `Conta`
- [ ] Copa shortcuts open the correct destinations
- [ ] Public invite `/b/:inviteCode` works both logged in and logged out

## 5. Bolões
- [ ] Create a new pool
- [ ] Verify `format_id` and active markets are saved
- [ ] Save score predictions in `Jogos`
- [ ] Save phase markets
- [ ] Save tournament markets
- [ ] Save special markets
- [ ] Resolve a market as the creator
- [ ] Confirm ranking breakdown updates after resolution
- [ ] Confirm invite sharing works

## 6. Championships and Copa
- [ ] Open `/campeonatos`
- [ ] Open at least one championship hub
- [ ] Verify calendar data exists for the selected championship
- [ ] Verify standings data exists for the selected championship
- [ ] Verify `Copa` loads overview, calendar, groups, bracket and simulator
- [ ] Verify `/copa/noticias`, `/copa/sedes` and `/copa/historia` redirect correctly

## 7. Notifications and Premium
- [ ] Notifications sheet loads and marks read items correctly
- [ ] Web notification permission flow works
- [ ] Premium screen loads without blocking the rest of the app
- [ ] If premium checkout stays disabled, the UI must communicate that clearly

## 8. Release Hygiene
- [ ] Confirm app name, logo and favicon are correct
- [ ] Confirm Terms, Privacy and Delete Account pages are public
- [ ] Confirm support email and legal links are correct
- [ ] Update changelog or release notes
- [ ] Tag the release commit in Git if needed

## 9. Nice-to-Have Before Store Release
- [ ] Reduce Firebase chunk size further if bundle budget is strict
- [ ] Remove remaining hardcoded strings in secondary screens
- [ ] Expand integration coverage for championships and modern markets
- [ ] Add monitoring for failed functions and Firestore rule denials
