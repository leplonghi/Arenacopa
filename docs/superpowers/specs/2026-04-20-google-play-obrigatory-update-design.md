# Google Play Mandatory Update Gate

## Context

Arena Cup is a Capacitor app with an Android shell and a React web app. The Android project already includes Google Play In-App Updates and a `MainActivity` flow that checks for updates on app start and resume.

The remaining gap is user experience and enforcement when the Google Play immediate update flow does not complete. In that case the app should still present a clear, unavoidable update gate inside the React app so the user cannot continue using an outdated binary after returning to the app.

## Goal

Whenever Google Play marks a newly published version as required for the installed binary, the Android app must enforce the update and the React UI must show a full-screen blocking state until the user updates.

## Non-Goals

- No iOS forced-update flow in this change.
- No backend-driven version policy or Remote Config version gate in this change.
- No custom version comparison logic in the React app.
- No changes to release automation or Play Console configuration.

## Recommended Approach

Use a hybrid architecture:

1. Keep Google Play In-App Updates as the source of truth for Android update availability and update type.
2. Emit a native-to-web signal when Android determines the update is mandatory and the app must stop normal usage.
3. Add a global React update gate that listens for that signal and renders a full-screen blocking overlay above the router.

This keeps update policy authoritative in Google Play while adding a resilient UI lock inside the app.

## Architecture

### Android Native Layer

The existing `MainActivity` remains responsible for:

- Checking update availability in `onCreate` and `onResume`
- Starting the `AppUpdateType.IMMEDIATE` flow when allowed
- Falling back to the Play Store listing when the immediate flow cannot proceed

The activity will be extended to also notify the web layer when the update becomes blocking. The notification should be emitted before redirecting the user away from the app and also when the app resumes into a still-blocked state.

Preferred mechanism:

- Use Capacitor bridge JavaScript event dispatch from `MainActivity`
- Emit a window-level event with a stable event name and a minimal payload

Suggested event contract:

- Event name: `arenaMandatoryUpdateRequired`
- Payload fields:
  - `source`: `"google-play"`
  - `reason`: `"immediate_update_required"` or `"play_store_fallback"`

### React Layer

Add a global update gate near the top of `src/App.tsx`, outside route-specific auth logic, so it applies to:

- logged-in flows
- logged-out flows
- public legal pages
- deep links

The React gate will:

- listen for the native mandatory-update event
- store a local `isUpdateRequired` boolean state
- render a full-screen overlay when true
- expose a single CTA button labeled to update now
- attempt to open the Play Store URL for the current package when pressed

The gate should not depend on server state, auth state, or route state.

## User Flow

1. User opens the Android app.
2. `MainActivity` requests update info from Google Play.
3. If Google Play reports `DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS`, resume the immediate update flow.
4. If Google Play reports `UPDATE_AVAILABLE` and `IMMEDIATE` is allowed, start the immediate update flow.
5. If the flow is canceled, fails, or cannot start, dispatch the mandatory-update event and open the Play Store listing.
6. If the user returns to the app without updating, Android checks again and the React gate remains or becomes active immediately.
7. While the gate is active, the user cannot access app content.

## UI Behavior

The blocking screen should:

- cover the whole viewport
- sit above the router and background visuals
- explain that a new required version is available
- include one primary action: `Atualizar agora`
- avoid secondary dismissal actions

The copy can be short and explicit:

- Title: `Atualização obrigatória disponível`
- Body: `Para continuar usando o Arena Cup, atualize o app na Google Play.`

The CTA should reopen the Play Store target using:

- `market://details?id=<package>` when available
- `https://play.google.com/store/apps/details?id=<package>` as fallback

## Error Handling

- If `getAppUpdateInfo()` fails, log the failure and do not block the app based on guesswork.
- If `IMMEDIATE` is not allowed for an available update, treat it as blocking for this feature and redirect to the Play Store fallback.
- If the Play Store app is unavailable, use the browser listing URL.
- If the web layer never receives the event, native flow still enforces update via Play redirect and app finish.

## Testing Strategy

Follow TDD for the React portion.

### React Test

Add an integration test that:

- renders the app shell or the update-gate component
- dispatches the `arenaMandatoryUpdateRequired` window event
- verifies the blocking copy becomes visible
- verifies the update CTA is visible

### Native Validation

Manual Android validation is acceptable for this change because the behavior depends on Google Play services and app distribution state. Validate:

- app opens normally when no update is available
- immediate flow starts when an update is available from Play
- fallback path opens Play Store when immediate flow is canceled or unavailable
- returning to the app without updating shows the blocking gate

## Scope Boundaries

This spec intentionally limits the change to Android and the current app binary. If the team later wants platform-wide forced updates or admin-controlled rollouts, that should be designed as a separate backend-driven policy system.

## Files Expected To Change

- `android/app/src/main/java/app/lovable/a569c8b887414e408fa66bdf2e5c3992/MainActivity.java`
- `src/App.tsx`
- one new React component or hook for the blocking gate
- one or more tests under `src/test/`

## Open Decisions Resolved

- Source of truth: Google Play native update status
- Enforcement surface: native redirect plus React full-screen gate
- Routing behavior: global overlay, not route-specific redirects
- Platform scope: Android only
