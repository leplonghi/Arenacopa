# ArenaCup Help Center Design

**Date:** 2026-04-20

**Status:** Approved for planning review

## Goal

Create an in-app Help Center for ArenaCup that centralizes help, tutorials, legal information, privacy/LGPD guidance, account deletion, and support contact while preserving public legal/compliance pages required for stores and external access.

## Product Intent

The current experience spreads help and legal information across sparse entry points such as profile shortcuts and standalone public pages. The new Help Center should become the main in-app destination for:

- FAQ and operational guidance
- tutorials for common tasks
- terms and privacy summaries
- LGPD rights and data-subject guidance
- account deletion orientation
- support and contact instructions

The user approved a modular approach plus data-oriented content architecture:

- internal hub with dedicated subpages
- content structured for `pt-BR`, `en`, and `es`
- public legal pages retained separately

## Current State

Relevant areas already in the codebase:

- Internal profile/menu shortcuts in `src/pages/Perfil.tsx` and `src/pages/Menu.tsx`
- Public legal routes in `src/App.tsx`:
  - `/privacidade`
  - `/termos`
  - `/excluir-conta`
- Legal page wrapper in `src/components/LegalPage.tsx`
- Legal content currently rendered through locale keys and thin pages:
  - `src/pages/Privacidade.tsx`
  - `src/pages/Termos.tsx`
- Existing account deletion flow in `src/pages/ExcluirConta.tsx`
- Existing locale files in:
  - `public/locales/pt-BR`
  - `public/locales/en`
  - `public/locales/es`

Current gaps:

- No real Help Center route or information architecture
- Help content is mostly a short list of links
- Tutorials and FAQ are not centralized
- LGPD rights are not surfaced in a practical, action-oriented way inside the app
- Support email must be updated to `suporte@arenacup.net`
- Any new content must be created for all supported languages, not just Portuguese

## Non-Goals

This design does not include:

- building a backoffice CMS
- adding live chat or ticketing integrations
- implementing full-text search infrastructure
- changing the legal meaning of the app's business model beyond clarifying existing positioning
- removing public legal pages

## User Requirements Confirmed

- The Help Center must live inside the authenticated app experience
- It must include everything:
  - help
  - information
  - tutorials
  - legal
  - LGPD
  - account deletion guidance
  - support/contact
- Official support contact becomes `suporte@arenacup.net`
- Public legal pages must remain available alongside the internal hub
- Every modification must consider all supported languages:
  - `pt-BR`
  - `en`
  - `es`

## Information Architecture

### Main Internal Route

Add a new authenticated route:

- `/ajuda`

This route is the primary in-app Help Center landing page.

### Internal Subroutes

Recommended internal route map:

- `/ajuda`
- `/ajuda/faq`
- `/ajuda/tutoriais`
- `/ajuda/privacidade`
- `/ajuda/termos`
- `/ajuda/dados`
- `/ajuda/contato`

### Public Routes That Must Remain

Keep these public routes for compliance, store metadata, and external access:

- `/privacidade`
- `/termos`
- `/excluir-conta`

These public pages should remain the canonical public-facing legal endpoints, while the Help Center becomes the main in-app navigation experience.

## UX Structure

### `/ajuda` Home

The Help Center home should prioritize fast resolution, not legal density.

Recommended structure:

1. Hero section
   - clear title
   - short explanation of what the hub contains
   - quick trust-oriented copy
2. Quick actions
   - most common tasks:
     - create/join pool
     - make predictions
     - activate notifications
     - manage account
     - delete account
     - contact support
3. Category grid/list
   - FAQ
   - Tutorials
   - Terms of Use
   - Privacy and LGPD
   - Data rights and account deletion
   - Contact and support
4. Legal summary strip
   - concise text about privacy, rights, and public documents
5. Support CTA
   - `suporte@arenacup.net`

### `/ajuda/faq`

Use accordion-style sections grouped by theme:

- Getting started
- Pools and predictions
- Rankings and scoring
- Account and profile
- Notifications
- Premium and support-related purchase questions
- Privacy and legal

Each FAQ item should have:

- title
- short summary
- expanded body
- optional CTA

### `/ajuda/tutoriais`

Use structured tutorials with practical steps:

- How to create a pool
- How to join a pool
- How to submit predictions
- How to review scoring/ranking
- How to enable notifications
- How to edit profile and preferences
- How to request account deletion

Each tutorial should support:

- title
- intent
- steps
- helpful notes
- related CTA

### `/ajuda/privacidade`

This page is a human-readable privacy summary, not the full legal policy.

Recommended blocks:

- what data the app uses
- why the app uses it
- what is essential vs optional
- who may process data for infrastructure
- how to exercise rights
- CTA to the full public Privacy Policy

### `/ajuda/termos`

This page is a practical summary of usage rules and responsibilities.

Recommended blocks:

- who can use the app
- acceptable use
- private pools and organizer responsibility
- limits of platform responsibility
- account responsibilities
- CTA to full public Terms of Use

### `/ajuda/dados`

This page focuses on LGPD rights and data-subject actions.

Recommended blocks:

- rights summary
- how to request confirmation/access/correction
- how deletion requests work
- retention caveats
- escalation path
- link to `/excluir-conta`
- support email and privacy contact guidance

### `/ajuda/contato`

Recommended blocks:

- official support email: `suporte@arenacup.net`
- what to include in a support message
- which topics support can help with
- which topics belong to privacy/LGPD requests
- response expectation copy only if the product already has a real support SLA; otherwise omit response-time promises

## Content Architecture

Create a new i18n namespace dedicated to the Help Center, likely:

- `public/locales/pt-BR/help.json`
- `public/locales/en/help.json`
- `public/locales/es/help.json`

The content should be data-oriented instead of hardcoded directly into components.

### Suggested Translation Structure

High-level sections:

- `meta`
- `home`
- `categories`
- `faq`
- `tutorials`
- `privacy_summary`
- `terms_summary`
- `data_rights`
- `contact`
- `common`

### Content Shape Expectations

The UI should be able to consume repeatable content structures such as:

- hero copy
- category cards
- FAQ groups and items
- tutorial groups and steps
- legal summary cards
- support cards and contact actions

Each item should support predictable fields such as:

- `title`
- `summary`
- `body`
- `tags`
- `steps`
- `cta_label`
- `cta_href`

This allows future content expansion without rewriting component logic.

## Navigation Changes

Update the following internal entry points to converge to the new hub:

- `src/pages/Perfil.tsx`
  - replace the current sparse legal/help links with navigation to `/ajuda`
  - optionally keep deep links for specific high-traffic actions if still useful
- `src/pages/Menu.tsx`
  - update help and privacy related entries to route through `/ajuda` or relevant subroutes
- Optional supporting CTA updates:
  - `src/pages/ExcluirConta.tsx`
  - footer/legal references where internal navigation should promote the hub

The Help Center should feel like the authoritative in-app destination rather than a thin wrapper around old legal pages.

## Legal and Compliance Strategy

### Three-Layer Model

The legal experience should be split into three layers:

1. In-app practical summaries inside the Help Center
2. Public full legal pages for privacy, terms, and account deletion
3. Operational paths that let the user actually exercise their rights

### Required Legal Themes

The Help Center and public legal pages should consistently cover:

- support and privacy contact channel: `suporte@arenacup.net`
- categories of personal data used by the app
- treatment purposes
- infrastructure/processors where applicable
- essential vs optional data
- account deletion path
- LGPD rights
- retention caveats where legally or operationally necessary
- path to escalate concerns after contacting the controller

### LGPD Rights to Surface Clearly

The app should explain, in plain language, how the user may request:

- confirmation of processing
- access to data
- correction of incomplete, inaccurate, or outdated data
- anonymization, blocking, or deletion when applicable
- portability when applicable and operationally supported
- information about sharing
- revocation of consent when consent is the legal basis
- review of automated decisions only if the product actually uses decision-making automation with relevant user impact

The app should not promise absolute deletion in every circumstance. It should explain that some data may need to be retained when required by law or for legitimate defense of rights.

### External Compliance References Used

This design is informed by official sources checked on 2026-04-20:

- ANPD rights guidance:
  - https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-frequentes/6-direitos-dos-titulares-de-dados/6-1-quais-sao-os
- ANPD petition guidance:
  - https://www.gov.br/pt-br/servicos/abrir-requerimento-relacionado-a-lgpd
- Google Play User Data and account deletion requirements:
  - https://support.google.com/googleplay/android-developer/answer/16543315?hl=en

### Practical Compliance Interpretation

For ArenaCup, the practical implications are:

- the app needs a discoverable in-app path for help and privacy questions
- account deletion must remain available both inside and outside the app
- public privacy and account deletion pages remain necessary
- the privacy policy should match the real app behavior and contact details
- internal summaries should be understandable without becoming misleading simplifications

## Public Legal Page Refresh

The existing public pages should be improved, not removed.

### Privacy Policy (`/privacidade`)

Needs expansion from a short text into a fuller policy that covers:

- controller/app identification
- categories of data
- treatment purposes
- service providers/processors
- cookies or essential authentication technologies where used
- security measures in general terms
- rights and request channel
- retention caveats
- effective date and update handling

### Terms of Use (`/termos`)

Needs expansion from a short text into fuller terms that cover:

- eligibility and account use
- acceptable use
- organizer responsibility in private pools
- scoring/rules references where relevant
- service availability disclaimers
- content moderation and abuse rules for user conduct inside groups, shared links, and platform misuse
- premium/payment references where the app offers premium features, support channels, or monetized functionality
- support and update notice

### Account Deletion (`/excluir-conta`)

Should stay public and remain operational. Improve clarity around:

- deletion request paths with and without login
- what is deleted
- what may be retained if legally required
- support/privacy contact
- references to privacy policy and rights

## Technical Design

### New UI Surface

Likely new page files:

- `src/pages/Ajuda.tsx`
- `src/pages/AjudaFaq.tsx`
- `src/pages/AjudaTutoriais.tsx`
- `src/pages/AjudaPrivacidade.tsx`
- `src/pages/AjudaTermos.tsx`
- `src/pages/AjudaDados.tsx`
- `src/pages/AjudaContato.tsx`

### Reusable Components

Expected reusable components may include:

- Help page shell/header
- category card
- FAQ accordion section
- tutorial steps block
- legal summary card
- rights list block
- support contact card

Suggested component area:

- `src/components/help/`

### Content Source Layer

Prefer a small content-mapping layer so pages stay presentational.

Possible utilities:

- locale-driven selectors
- typed content mappers for FAQ/tutorial/legal cards

Suggested support area:

- `src/data/help/` or `src/lib/help/`

### Routing

Update `src/App.tsx` to add the authenticated Help Center routes.

### Internationalization

Update i18n configuration if a new namespace must be preloaded or referenced.

### Email Consistency

Replace old support references from `suporte@arenacup.com` to `suporte@arenacup.net` across:

- profile/help content
- account deletion content
- premium/support references if they represent official support
- any legal and contact copy

## Content Guidelines

### Tone

Internal Help Center tone:

- clear
- calm
- practical
- human
- less formal than the legal documents

Public legal pages tone:

- formal
- precise
- transparent
- store/compliance friendly

### Writing Rules

- avoid legal overclaiming
- explain what happens in practice
- distinguish help text from legally binding text
- do not imply features or rights workflows the product cannot operationally support
- keep multilingual parity across `pt-BR`, `en`, and `es`

## Accessibility and UX Requirements

- cards and accordions must remain keyboard accessible
- headings must preserve a clear hierarchy
- CTA labels must be explicit
- all support/legal entry points must be discoverable on mobile
- legal summaries should be scannable before the user opens dense text

## Risks

- Multilingual content drift if one locale lags behind
- Legal text becoming inconsistent with real technical behavior
- Routing duplication causing users to reach old pages instead of the new hub
- Overpromising LGPD rights implementation details without operational support
- Updating support email in some but not all locations

## Rollout Strategy

Recommended rollout order:

1. Add Help Center route architecture and navigation entry points
2. Add multilingual content namespace and structured content model
3. Ship Help Center home, FAQ, tutorials, privacy summary, terms summary, data rights, and contact pages
4. Refresh public legal pages to match the new contact and compliance wording
5. Verify account deletion links and public discoverability
6. Run multilingual UI review and copy consistency pass

## Testing Strategy

### Functional

- authenticated users can access `/ajuda` and subroutes
- profile/menu navigation reaches the new hub
- public legal routes remain accessible without login
- account deletion page remains publicly reachable

### Content

- all three locales render without missing keys
- email/contact values are consistent everywhere
- FAQ/tutorial sections render correctly from structured content

### Regression

- existing profile/menu flows still work
- legal/footer links still route correctly
- auth redirects still preserve public route access for legal pages

### Visual

- mobile-first verification for cards, accordions, and long-form legal summaries
- scanability of home page and category navigation

## Open Implementation Decisions

These are acceptable to settle during planning/implementation without changing the approved product direction:

- final component naming and folder structure
- whether each Help Center section is its own page or whether some sections share a common shell with dynamic content
- whether to ship lightweight local search in the first release or keep the UI intentionally search-ready without exposing search yet
- whether profile/menu should point to `/ajuda` only or mix hub links with a few deep links

## Recommended Outcome

ArenaCup should gain a professional, scalable, multilingual Help Center that:

- becomes the main in-app destination for user guidance
- improves legal and LGPD clarity without sacrificing usability
- preserves public compliance pages
- standardizes support references to `suporte@arenacup.net`
- gives the team a maintainable content model for future updates
