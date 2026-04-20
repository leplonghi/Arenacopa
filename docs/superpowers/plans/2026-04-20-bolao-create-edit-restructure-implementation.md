# Bolão Create/Edit Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the bolão creation and editing system around a backend-owned structural contract, guided creation flow, lock-aware editing UX, secure group integration, and safe legacy migration.

**Architecture:** Move structural governance out of ad-hoc page writes and into explicit backend operations that compute `editable_sections`, persist `published_snapshot`, and enforce lifecycle/integrity rules. Keep the frontend thin: it should render guided steps, read the server contract, and call service endpoints for every sensitive change while leaving presentation edits and safe reads fast. Roll out in layers: contract first, rules second, client service and UI third, then migration and telemetry.

**Tech Stack:** React 18, React Router 6, TypeScript, Firebase Firestore, Firebase Cloud Functions (Node 20, CommonJS), Vitest, React Testing Library, `node:test`, Firebase Rules Unit Testing.

---

## Scope Check

This stays as one plan because creation UX, edit UX, backend locks, group binding, telemetry, and migration all depend on the same bolão configuration contract. Splitting now would create duplicated adapter work and ambiguous ownership between backend and frontend.

## File Structure

### Backend contract and operations

- Create: `functions/bolao-config/contract.js`
  - Pure helpers for lifecycle, structural integrity, `editable_sections`, participant/public-expectation rules, payment eligibility, and member-removal policy.
- Create: `functions/bolao-config/handlers.js`
  - Operation handlers for `createDraft`, `updateConfiguration`, `publishBolao`, `duplicateBolao`, `removePoolMember`, `alterPresentation`, `finishBolao`, and `archiveBolao`.
- Create: `functions/bolao-config/repository.js`
  - Firestore reads/writes, config-version checks, snapshot persistence, and audit writes.
- Create: `functions/bolao-config/migration.js`
  - Legacy normalization and backfill helpers.
- Modify: `functions/index.js`
  - Export HTTPS operations and migration entrypoints.
- Modify: `functions/package.json`
  - Add a repeatable test command for backend contract and handler tests.
- Create: `functions/test/bolao-config.contract.test.js`
  - Pure backend contract tests.
- Create: `functions/test/bolao-config.handlers.test.js`
  - Backend operation tests.
- Create: `functions/test/bolao-config.migration.test.js`
  - Legacy migration tests.

### Client domain and transport

- Create: `src/types/bolao-config.ts`
  - Typed frontend contract for lifecycle, integrity, editable sections, snapshots, group binding, payment eligibility, and operation payloads/responses.
- Modify: `src/types/bolao.ts`
  - Extend legacy bolão shape with normalized config fields without breaking current readers.
- Create: `src/services/boloes/bolao-config.mapper.ts`
  - Map backend documents and responses into stable frontend types.
- Create: `src/services/boloes/bolao-config.service.ts`
  - Client calls for secure bolão operations plus legacy-aware reads.
- Create: `src/lib/analytics/bolao-config.telemetry.ts`
  - Frontend telemetry wrapper for funnel and edit-friction events.

### Creation and edit UX

- Create: `src/features/boloes/create/BolaoCreateWizard.tsx`
  - New structure-first creation container.
- Create: `src/features/boloes/create/useBolaoCreateFlow.ts`
  - Step state, validation, payload assembly, and draft/publish actions.
- Create: `src/features/boloes/create/CreateBolaoContextStep.tsx`
  - Group selection, binding mode, and access-context step.
- Create: `src/features/boloes/create/CreateBolaoRulesStep.tsx`
  - Type, rules, participation, and finance step.
- Create: `src/features/boloes/create/CreateBolaoReviewStep.tsx`
  - Final review, lock explanation, and publish action.
- Modify: `src/pages/CriarBolao.tsx`
  - Replace the current three-step page with the new wizard entry.
- Modify: `src/hooks/useCreateBolao.ts`
  - Convert from direct Firestore batch writer to thin compatibility wrapper or remove usage entirely in favor of the new service.
- Create: `src/features/boloes/edit/BolaoEditPanel.tsx`
  - Section-based edit UI driven by `editable_sections`.
- Create: `src/features/boloes/edit/BolaoEditSectionCard.tsx`
  - Reusable lock-aware section card with edit/duplicate affordances.
- Modify: `src/pages/BolaoDetail.tsx`
  - Remove inline structural writes, show new edit entrypoint, and wire presentation edits to the service layer.
- Modify: `src/components/copa/bolao/GrupoLinkPanel.tsx`
  - Stop direct writes, respect lock state, and reuse the new edit service.

### Group integration, sharing, rules, and tests

- Modify: `src/pages/GrupoDetail.tsx`
  - Clarify create/select bolão in group context and group-bound bolão listing.
- Modify: `src/pages/Boloes.tsx`
  - Improve create/join/share entrypoints and private/public copy.
- Modify: `src/pages/PublicInvite.tsx`
  - Render bolão/group invite context with group-binding expectations.
- Modify: `firestore.rules`
  - Block direct structural writes and hard deletes while preserving participant reads and safe member actions.
- Modify: `package.json`
  - Add rules-test dependency if missing.
- Create: `src/test/unit/bolao-config-contract.test.ts`
  - Client mapper and contract assertions.
- Create: `src/test/integration/bolao-config.service.test.ts`
  - Client transport tests.
- Create: `src/test/integration/CriarBolaoWizard.test.tsx`
  - Creation flow tests.
- Create: `src/test/integration/BolaoEditFlow.test.tsx`
  - Edit flow tests.
- Create: `src/test/integration/GrupoBolaoEntryPoints.test.tsx`
  - Group/bolão navigation and share tests.
- Create: `src/test/integration/firestore-bolao.rules.test.ts`
  - Firestore rules tests.
- Create: `scripts/backfill-bolao-config.mjs`
  - Manual backfill runner for rollout and production migration.
- Modify: `public/locales/pt-BR/bolao.json`
- Modify: `public/locales/en/bolao.json`
- Modify: `public/locales/es/bolao.json`
  - New UX copy for create/edit/share/lock explanations.

### Execution order

1. Backend contract
2. Backend handlers
3. Rules hardening
4. Client service and adapter
5. Create flow
6. Edit flow
7. Group/share integration
8. Migration and telemetry

### Task 1: Encode The Backend Contract

**Files:**
- Create: `functions/bolao-config/contract.js`
- Create: `functions/test/bolao-config.contract.test.js`
- Modify: `functions/package.json`

- [ ] **Step 1: Write the failing backend contract tests**

`functions/test/bolao-config.contract.test.js`

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  computeEditableSections,
  isExternalParticipant,
  hasValidPublicExpectation,
  getCompetitiveEligibility,
  getFinancialEligibility,
  canRemoveMember,
} = require("../bolao-config/contract");

test("locks access policy when public expectation exists", () => {
  const editable = computeEditableSections({
    lifecycleStatus: "published",
    isStructureLocked: false,
    hasExternalParticipant: false,
    hasValidPublicExpectation: true,
  });

  assert.equal(editable.presentation, true);
  assert.equal(editable.access_policy, false);
  assert.equal(editable.competition_rules, false);
});

test("treats only active non-owner members as external participants", () => {
  assert.equal(
    isExternalParticipant({
      poolOwnerId: "owner-1",
      member: { user_id: "owner-1", membership_status: "active" },
    }),
    false,
  );

  assert.equal(
    isExternalParticipant({
      poolOwnerId: "owner-1",
      member: { user_id: "guest-1", membership_status: "active" },
    }),
    true,
  );
});

test("distinguishes competitive eligibility from financial eligibility", () => {
  assert.equal(
    getCompetitiveEligibility({
      membershipStatus: "active",
      lifecycleStatus: "published",
      paymentStatus: "pending",
    }),
    true,
  );

  assert.equal(getFinancialEligibility({ paymentStatus: "pending" }), false);
  assert.equal(getFinancialEligibility({ paymentStatus: "confirmed" }), true);
});

test("tightens member removal after competitive or financial activity", () => {
  assert.equal(
    canRemoveMember({
      lifecycleStatus: "published",
      memberHasPrediction: false,
      paymentStatus: "pending",
    }).allowed,
    true,
  );

  assert.equal(
    canRemoveMember({
      lifecycleStatus: "published",
      memberHasPrediction: true,
      paymentStatus: "pending",
    }).allowed,
    false,
  );
});

test("recognizes valid public expectation from accepted invites or public publication", () => {
  assert.equal(
    hasValidPublicExpectation({
      lifecycleStatus: "published",
      accessPolicy: { join_mode: "public_open" },
      acceptedInviteCount: 0,
      approvedRequestCount: 0,
    }),
    true,
  );

  assert.equal(
    hasValidPublicExpectation({
      lifecycleStatus: "published",
      accessPolicy: { join_mode: "private_invite" },
      acceptedInviteCount: 1,
      approvedRequestCount: 0,
    }),
    true,
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test functions/test/bolao-config.contract.test.js`

Expected: FAIL with `Cannot find module '../bolao-config/contract'`.

- [ ] **Step 3: Implement the pure contract helpers and backend test script**

`functions/bolao-config/contract.js`

```js
function isExternalParticipant({ poolOwnerId, member }) {
  return Boolean(
    member &&
      member.user_id !== poolOwnerId &&
      member.membership_status === "active",
  );
}

function hasValidPublicExpectation({
  lifecycleStatus,
  accessPolicy,
  acceptedInviteCount,
  approvedRequestCount,
}) {
  if (lifecycleStatus !== "published" && lifecycleStatus !== "live") return false;
  if (accessPolicy?.join_mode === "public_open") return true;
  if (acceptedInviteCount > 0) return true;
  if (approvedRequestCount > 0) return true;
  return false;
}

function computeEditableSections({
  lifecycleStatus,
  isStructureLocked,
  hasExternalParticipant,
  hasValidPublicExpectation: publicExpectation,
}) {
  const draft = lifecycleStatus === "draft";
  const participationEditable =
    !isStructureLocked && !hasExternalParticipant && !publicExpectation;

  return {
    presentation: true,
    context: draft || participationEditable,
    access_policy: draft || participationEditable,
    competition_rules: draft,
    finance_rules: draft,
    operation: true,
  };
}

function getCompetitiveEligibility({
  membershipStatus,
  lifecycleStatus,
}) {
  return membershipStatus === "active" &&
    ["published", "live", "finished"].includes(lifecycleStatus);
}

function getFinancialEligibility({ paymentStatus }) {
  return paymentStatus === "confirmed" || paymentStatus === "waived";
}

function canRemoveMember({
  lifecycleStatus,
  memberHasPrediction,
  paymentStatus,
}) {
  if (lifecycleStatus === "draft") return { allowed: true, nextStatus: "removed" };
  if (lifecycleStatus === "live" || lifecycleStatus === "finished" || lifecycleStatus === "archived") {
    return { allowed: false, code: "removal_blocked" };
  }
  if (memberHasPrediction || paymentStatus === "confirmed") {
    return { allowed: false, code: "member_protected" };
  }
  return { allowed: true, nextStatus: "removed" };
}

module.exports = {
  canRemoveMember,
  computeEditableSections,
  getCompetitiveEligibility,
  getFinancialEligibility,
  hasValidPublicExpectation,
  isExternalParticipant,
};
```

`functions/package.json`

```json
{
  "scripts": {
    "serve": "firebase serve --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log",
    "test": "node --test"
  }
}
```

- [ ] **Step 4: Run the contract test suite to verify it passes**

Run: `node --test functions/test/bolao-config.contract.test.js`

Expected: PASS with five backend contract tests green.

- [ ] **Step 5: Commit**

```bash
git add functions/package.json functions/bolao-config/contract.js functions/test/bolao-config.contract.test.js
git commit -m "feat: add bolao configuration contract helpers"
```

### Task 2: Add Secure Backend Operations And Snapshot Persistence

**Files:**
- Create: `functions/bolao-config/repository.js`
- Create: `functions/bolao-config/handlers.js`
- Create: `functions/test/bolao-config.handlers.test.js`
- Modify: `functions/index.js`

- [ ] **Step 1: Write the failing handler tests**

`functions/test/bolao-config.handlers.test.js`

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildDraftBolaoDocument,
  buildPublishedSnapshot,
  assertConfigVersion,
  buildRemoveMemberDecision,
} = require("../bolao-config/handlers");

test("buildDraftBolaoDocument seeds lifecycle, integrity, and editable sections", () => {
  const draft = buildDraftBolaoDocument({
    bolaoId: "bolao-1",
    actorId: "owner-1",
    nowIso: "2026-04-20T12:00:00.000Z",
  });

  assert.equal(draft.lifecycle.status, "draft");
  assert.equal(draft.integrity.config_version, 1);
  assert.equal(draft.editable_sections.competition_rules, true);
});

test("buildPublishedSnapshot freezes structural sections but excludes presentation", () => {
  const snapshot = buildPublishedSnapshot({
    schema_version: 2,
    context: { group_binding_mode: "none" },
    competition_rules: { format: "classic" },
    access_policy: { join_mode: "private_invite" },
    finance_rules: { finance_mode: "free" },
    presentation: { name: "Ignorar" },
  });

  assert.deepEqual(snapshot.presentation, undefined);
  assert.equal(snapshot.schema_version, 2);
  assert.equal(snapshot.competition_rules.format, "classic");
});

test("assertConfigVersion throws on stale writes", () => {
  assert.throws(
    () => assertConfigVersion({ expected: 3, current: 4 }),
    /config_conflict/,
  );
});

test("buildRemoveMemberDecision requires an audit reason after publish", () => {
  assert.throws(
    () =>
      buildRemoveMemberDecision({
        lifecycleStatus: "published",
        memberHasPrediction: false,
        paymentStatus: "pending",
        reasonCode: "",
      }),
    /validation_failed/,
  );
});
```

- [ ] **Step 2: Run the handler tests to verify they fail**

Run: `node --test functions/test/bolao-config.handlers.test.js`

Expected: FAIL with missing exports from `../bolao-config/handlers`.

- [ ] **Step 3: Implement repository/handler helpers and export the HTTPS operations**

`functions/bolao-config/handlers.js`

```js
const { computeEditableSections, canRemoveMember } = require("./contract");

function assertConfigVersion({ expected, current }) {
  if (expected !== current) {
    throw new Error("config_conflict");
  }
}

function buildDraftBolaoDocument({ bolaoId, actorId, nowIso }) {
  const editableSections = computeEditableSections({
    lifecycleStatus: "draft",
    isStructureLocked: false,
    hasExternalParticipant: false,
    hasValidPublicExpectation: false,
  });

  return {
    id: bolaoId,
    schema_version: 2,
    lifecycle: {
      status: "draft",
      published_at: null,
      finished_at: null,
      archived_at: null,
    },
    integrity: {
      is_structure_locked: false,
      structure_locked_at: null,
      structure_lock_reason: null,
      lock_trigger: null,
      config_version: 1,
      published_snapshot: null,
    },
    editable_sections: editableSections,
    audit_meta: {
      last_actor_id: actorId,
      last_updated_at: nowIso,
    },
  };
}

function buildPublishedSnapshot(source) {
  return {
    schema_version: source.schema_version,
    context: source.context,
    competition_rules: source.competition_rules,
    access_policy: source.access_policy,
    finance_rules: source.finance_rules,
  };
}

function buildRemoveMemberDecision({
  lifecycleStatus,
  memberHasPrediction,
  paymentStatus,
  reasonCode,
}) {
  if (lifecycleStatus !== "draft" && !reasonCode) {
    throw new Error("validation_failed");
  }

  const decision = canRemoveMember({
    lifecycleStatus,
    memberHasPrediction,
    paymentStatus,
  });

  if (!decision.allowed) {
    throw new Error(decision.code || "removal_blocked");
  }

  return {
    membership_status: lifecycleStatus === "draft" ? "removed" : "withdrawn_by_owner",
    reason_code: reasonCode,
  };
}

module.exports = {
  assertConfigVersion,
  buildDraftBolaoDocument,
  buildPublishedSnapshot,
  buildRemoveMemberDecision,
};
```

`functions/index.js`

```js
const bolaoConfigHandlers = require("./bolao-config/handlers");

exports.createBolaoDraft = functions.region("us-central1").https.onRequest(async (req, res) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).send("");
  const auth = await verifyHttpUser(req);
  const nowIso = new Date().toISOString();
  const bolaoRef = db.collection("boloes").doc();
  const payload = bolaoConfigHandlers.buildDraftBolaoDocument({
    bolaoId: bolaoRef.id,
    actorId: auth.uid,
    nowIso,
  });
  await bolaoRef.set(payload);
  return res.status(200).json({ bolao_id: bolaoRef.id, ...payload });
});
```

`functions/bolao-config/repository.js`

```js
async function writeAuditLog({ db, bolaoId, actorId, action, before, after, reason }) {
  await db.collection("bolao_audit").add({
    bolao_id: bolaoId,
    actor_id: actorId,
    action,
    before,
    after,
    reason: reason || null,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}

module.exports = {
  writeAuditLog,
};
```

- [ ] **Step 4: Run the handler test suite**

Run: `node --test functions/test/bolao-config.handlers.test.js`

Expected: PASS with draft, snapshot, config-version, and member-removal tests green.

- [ ] **Step 5: Commit**

```bash
git add functions/index.js functions/bolao-config/repository.js functions/bolao-config/handlers.js functions/test/bolao-config.handlers.test.js
git commit -m "feat: add bolao config handlers and snapshot helpers"
```

### Task 3: Harden Firestore Rules And Add Rules Tests

**Files:**
- Modify: `package.json`
- Modify: `firestore.rules`
- Create: `src/test/integration/firestore-bolao.rules.test.ts`

- [ ] **Step 1: Write the failing Firestore rules tests**

`src/test/integration/firestore-bolao.rules.test.ts`

```ts
import { beforeAll, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc } from "firebase/firestore";

let testEnv: Awaited<ReturnType<typeof initializeTestEnvironment>>;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "arenacopa-rules-test",
    firestore: {
      rules: await fetch("/firestore.rules").then((response) => response.text()),
    },
  });
});

describe("bolao rules", () => {
  it("blocks direct structural update on published bolao", async () => {
    const ownerDb = testEnv.authenticatedContext("owner-1").firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "boloes/bolao-1"), {
        creator_id: "owner-1",
        category: "private",
        lifecycle: { status: "published" },
        editable_sections: { presentation: true, competition_rules: false },
        format_id: "classic",
        name: "Meu bolão",
      });
    });

    await expect(
      assertFails(updateDoc(doc(ownerDb, "boloes/bolao-1"), { format_id: "detailed" })),
    ).resolves.toBeDefined();
  });

  it("allows presentation-only edits for the owner", async () => {
    const ownerDb = testEnv.authenticatedContext("owner-1").firestore();

    await expect(
      assertSucceeds(updateDoc(doc(ownerDb, "boloes/bolao-1"), { name: "Nome novo" })),
    ).resolves.toBeDefined();
  });

  it("blocks hard delete of a protected bolao member", async () => {
    const ownerDb = testEnv.authenticatedContext("owner-1").firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "bolao_members/member-1_bolao-1"), {
        bolao_id: "bolao-1",
        user_id: "member-1",
        role: "member",
        membership_status: "active",
        payment_status: "confirmed",
      });
    });

    await expect(
      assertFails(updateDoc(doc(ownerDb, "bolao_members/member-1_bolao-1"), { deleted: true })),
    ).resolves.toBeDefined();
  });
});
```

- [ ] **Step 2: Run the rules test to verify it fails**

Run: `npx vitest run src/test/integration/firestore-bolao.rules.test.ts`

Expected: FAIL with missing `@firebase/rules-unit-testing` or current rules allowing direct structural writes.

- [ ] **Step 3: Add the rules-test dependency and tighten the rules**

`package.json`

```json
{
  "devDependencies": {
    "@firebase/rules-unit-testing": "^4.0.1"
  }
}
```

`firestore.rules`

```txt
function changedKeys() {
  return request.resource.data.diff(resource.data).changedKeys();
}

function isPresentationOnlyBolaoUpdate() {
  return changedKeys().hasOnly([
    "name",
    "description",
    "avatar_url",
    "invite_message",
    "updated_at",
    "audit_meta"
  ]);
}

match /boloes/{bolaoId} {
  allow update: if isSignedIn() &&
    isOwner(resource.data.creator_id) &&
    isPresentationOnlyBolaoUpdate();
}

match /bolao_members/{memberId} {
  allow delete: if false;
  allow update: if false;
}
```

- [ ] **Step 4: Run the rules test suite**

Run: `npx vitest run src/test/integration/firestore-bolao.rules.test.ts`

Expected: PASS with structural writes blocked, presentation writes allowed, and member hard-deletes denied.

- [ ] **Step 5: Commit**

```bash
git add package.json firestore.rules src/test/integration/firestore-bolao.rules.test.ts
git commit -m "feat: harden bolao firestore rules"
```

### Task 4: Build The Client Contract And Service Layer

**Files:**
- Create: `src/types/bolao-config.ts`
- Modify: `src/types/bolao.ts`
- Create: `src/services/boloes/bolao-config.mapper.ts`
- Create: `src/services/boloes/bolao-config.service.ts`
- Create: `src/test/unit/bolao-config-contract.test.ts`
- Create: `src/test/integration/bolao-config.service.test.ts`

- [ ] **Step 1: Write the failing mapper and transport tests**

`src/test/unit/bolao-config-contract.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { mapBolaoConfigDocument } from "@/services/boloes/bolao-config.mapper";

describe("mapBolaoConfigDocument", () => {
  it("normalizes lifecycle, integrity, and editable sections for legacy-safe reads", () => {
    const mapped = mapBolaoConfigDocument({
      id: "bolao-1",
      name: "Arena",
      lifecycle: { status: "published" },
      integrity: { is_structure_locked: true, config_version: 4 },
      editable_sections: { presentation: true, competition_rules: false },
    });

    expect(mapped.lifecycle.status).toBe("published");
    expect(mapped.integrity.configVersion).toBe(4);
    expect(mapped.editableSections.presentation).toBe(true);
  });
});
```

`src/test/integration/bolao-config.service.test.ts`

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDraftBolao } from "@/services/boloes/bolao-config.service";

describe("bolao-config.service", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          bolao_id: "bolao-1",
          lifecycle: { status: "draft" },
          editable_sections: { presentation: true, competition_rules: true },
        }),
      })),
    );
  });

  it("calls the draft endpoint and returns a normalized response", async () => {
    const response = await createDraftBolao({
      token: "token-1",
      payload: { context: { group_binding_mode: "none" } },
    });

    expect(response.bolaoId).toBe("bolao-1");
    expect(response.lifecycle.status).toBe("draft");
    expect(response.editableSections.competition_rules).toBe(true);
  });
});
```

- [ ] **Step 2: Run the client tests to verify they fail**

Run: `npx vitest run src/test/unit/bolao-config-contract.test.ts src/test/integration/bolao-config.service.test.ts`

Expected: FAIL with missing mapper and service modules.

- [ ] **Step 3: Implement frontend types, mapper, and service calls**

`src/types/bolao-config.ts`

```ts
export type BolaoLifecycleStatus = "draft" | "published" | "live" | "finished" | "archived";

export type EditableSections = {
  presentation: boolean;
  context: boolean;
  access_policy: boolean;
  competition_rules: boolean;
  finance_rules: boolean;
  operation?: boolean;
};

export type BolaoConfigState = {
  bolaoId: string;
  lifecycle: { status: BolaoLifecycleStatus };
  integrity: {
    isStructureLocked: boolean;
    configVersion: number;
  };
  editableSections: EditableSections;
};
```

`src/services/boloes/bolao-config.mapper.ts`

```ts
import type { BolaoConfigState } from "@/types/bolao-config";

export function mapBolaoConfigDocument(input: any): BolaoConfigState {
  return {
    bolaoId: input.id ?? input.bolao_id,
    lifecycle: {
      status: input.lifecycle?.status ?? "draft",
    },
    integrity: {
      isStructureLocked: Boolean(input.integrity?.is_structure_locked),
      configVersion: Number(input.integrity?.config_version ?? 1),
    },
    editableSections: {
      presentation: Boolean(input.editable_sections?.presentation),
      context: Boolean(input.editable_sections?.context),
      access_policy: Boolean(input.editable_sections?.access_policy),
      competition_rules: Boolean(input.editable_sections?.competition_rules),
      finance_rules: Boolean(input.editable_sections?.finance_rules),
      operation: Boolean(input.editable_sections?.operation),
    },
  };
}
```

`src/services/boloes/bolao-config.service.ts`

```ts
import { mapBolaoConfigDocument } from "@/services/boloes/bolao-config.mapper";

async function postBolaoOperation<T>(path: string, token: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`bolao_operation_failed:${path}`);
  }

  return response.json() as Promise<T>;
}

export async function createDraftBolao(input: { token: string; payload: unknown }) {
  const raw = await postBolaoOperation<any>("/createBolaoDraft", input.token, input.payload);
  return mapBolaoConfigDocument(raw);
}
```

- [ ] **Step 4: Run the client tests**

Run: `npx vitest run src/test/unit/bolao-config-contract.test.ts src/test/integration/bolao-config.service.test.ts`

Expected: PASS with mapper normalization and service transport green.

- [ ] **Step 5: Commit**

```bash
git add src/types/bolao.ts src/types/bolao-config.ts src/services/boloes/bolao-config.mapper.ts src/services/boloes/bolao-config.service.ts src/test/unit/bolao-config-contract.test.ts src/test/integration/bolao-config.service.test.ts
git commit -m "feat: add bolao config client types and service"
```

### Task 5: Replace The Create Page With The Guided Wizard

**Files:**
- Create: `src/features/boloes/create/useBolaoCreateFlow.ts`
- Create: `src/features/boloes/create/BolaoCreateWizard.tsx`
- Create: `src/features/boloes/create/CreateBolaoContextStep.tsx`
- Create: `src/features/boloes/create/CreateBolaoRulesStep.tsx`
- Create: `src/features/boloes/create/CreateBolaoReviewStep.tsx`
- Modify: `src/pages/CriarBolao.tsx`
- Modify: `public/locales/pt-BR/bolao.json`
- Modify: `public/locales/en/bolao.json`
- Modify: `public/locales/es/bolao.json`
- Create: `src/test/integration/CriarBolaoWizard.test.tsx`

- [ ] **Step 1: Write the failing creation-flow test**

`src/test/integration/CriarBolaoWizard.test.tsx`

```tsx
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import CriarBolao from "@/pages/CriarBolao";

describe("CriarBolao wizard", () => {
  it("starts with structural choices before naming the bolao", () => {
    render(
      <MemoryRouter initialEntries={["/boloes/criar"]}>
        <CriarBolao />
      </MemoryRouter>,
    );

    expect(screen.getByText("wizard.context_step.title")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("wizard.name_step.name_placeholder")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the wizard test to verify it fails**

Run: `npx vitest run src/test/integration/CriarBolaoWizard.test.tsx`

Expected: FAIL because the current page still starts with name/emoji/description.

- [ ] **Step 3: Implement the wizard shell, step state, and service-driven actions**

`src/features/boloes/create/useBolaoCreateFlow.ts`

```ts
import { useMemo, useState } from "react";

export function useBolaoCreateFlow() {
  const [step, setStep] = useState<"context" | "rules" | "review">("context");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [form, setForm] = useState({
    groupBindingMode: "none",
    selectedGrupoId: null as string | null,
    joinMode: "private_invite",
    financeMode: "free",
    name: "",
    description: "",
  });

  const canAdvance = useMemo(() => {
    if (step === "context") return true;
    if (step === "rules") return form.name.trim().length >= 3;
    return true;
  }, [form.name, step]);

  return {
    canAdvance,
    draftId,
    form,
    setDraftId,
    setForm,
    setStep,
    step,
  };
}
```

`src/pages/CriarBolao.tsx`

```tsx
import { BolaoCreateWizard } from "@/features/boloes/create/BolaoCreateWizard";

export default function CriarBolao() {
  return <BolaoCreateWizard />;
}
```

`src/features/boloes/create/BolaoCreateWizard.tsx`

```tsx
import { CreateBolaoContextStep } from "@/features/boloes/create/CreateBolaoContextStep";
import { CreateBolaoRulesStep } from "@/features/boloes/create/CreateBolaoRulesStep";
import { CreateBolaoReviewStep } from "@/features/boloes/create/CreateBolaoReviewStep";
import { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";

export function BolaoCreateWizard() {
  const flow = useBolaoCreateFlow();

  if (flow.step === "context") return <CreateBolaoContextStep flow={flow} />;
  if (flow.step === "rules") return <CreateBolaoRulesStep flow={flow} />;
  return <CreateBolaoReviewStep flow={flow} />;
}
```

- [ ] **Step 4: Run the wizard test**

Run: `npx vitest run src/test/integration/CriarBolaoWizard.test.tsx`

Expected: PASS with the context-first step rendered before any naming field.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CriarBolao.tsx src/features/boloes/create src/test/integration/CriarBolaoWizard.test.tsx public/locales/pt-BR/bolao.json public/locales/en/bolao.json public/locales/es/bolao.json
git commit -m "feat: replace bolao creation with guided wizard"
```

### Task 6: Replace Inline Edits With A Section-Based Edit Experience

**Files:**
- Create: `src/features/boloes/edit/BolaoEditPanel.tsx`
- Create: `src/features/boloes/edit/BolaoEditSectionCard.tsx`
- Modify: `src/pages/BolaoDetail.tsx`
- Modify: `src/components/copa/bolao/GrupoLinkPanel.tsx`
- Create: `src/test/integration/BolaoEditFlow.test.tsx`

- [ ] **Step 1: Write the failing edit-flow test**

`src/test/integration/BolaoEditFlow.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BolaoDetail from "@/pages/BolaoDetail";

describe("BolaoDetail edit flow", () => {
  it("does not expose inline title editing when the bolao uses lock-aware editing", () => {
    render(
      <MemoryRouter initialEntries={["/boloes/bolao-1"]}>
        <Routes>
          <Route path="/boloes/:id" element={<BolaoDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Salvo com sucesso!")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the edit-flow test to verify it fails**

Run: `npx vitest run src/test/integration/BolaoEditFlow.test.tsx`

Expected: FAIL because `BolaoDetail` still owns inline title/description edit state and direct `setDoc` writes.

- [ ] **Step 3: Implement the lock-aware edit panel and remove direct structural writes**

`src/features/boloes/edit/BolaoEditSectionCard.tsx`

```tsx
type Props = {
  title: string;
  description: string;
  editable: boolean;
  onEdit?: () => void;
  onDuplicate?: () => void;
};

export function BolaoEditSectionCard({ title, description, editable, onEdit, onDuplicate }: Props) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-black text-white">{title}</h3>
      <p className="mt-1 text-xs text-zinc-400">{description}</p>
      {editable ? (
        <button className="mt-4 rounded-2xl bg-primary px-4 py-2 text-xs font-black text-black" onClick={onEdit}>
          Editar seção
        </button>
      ) : (
        <button className="mt-4 rounded-2xl bg-white/10 px-4 py-2 text-xs font-black text-white" onClick={onDuplicate}>
          Duplicar para mudar
        </button>
      )}
    </section>
  );
}
```

`src/pages/BolaoDetail.tsx`

```tsx
import { BolaoEditPanel } from "@/features/boloes/edit/BolaoEditPanel";

const [showEditPanel, setShowEditPanel] = useState(false);

const isCreator = bolao?.creator_id === user?.id;

{isCreator && bolao && (
  <button
    className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white"
    onClick={() => setShowEditPanel(true)}
  >
    Editar bolão
  </button>
)}

<BolaoEditPanel
  bolao={bolao}
  open={showEditPanel}
  onOpenChange={setShowEditPanel}
/>
```

- [ ] **Step 4: Run the edit-flow test**

Run: `npx vitest run src/test/integration/BolaoEditFlow.test.tsx`

Expected: PASS with inline structural editors removed and edit entry routed through the new panel.

- [ ] **Step 5: Commit**

```bash
git add src/pages/BolaoDetail.tsx src/components/copa/bolao/GrupoLinkPanel.tsx src/features/boloes/edit src/test/integration/BolaoEditFlow.test.tsx
git commit -m "feat: add lock-aware bolao edit panel"
```

### Task 7: Connect Groups, Sharing, And Entry Points To The New Model

**Files:**
- Modify: `src/pages/GrupoDetail.tsx`
- Modify: `src/pages/Boloes.tsx`
- Modify: `src/pages/PublicInvite.tsx`
- Create: `src/test/integration/GrupoBolaoEntryPoints.test.tsx`

- [ ] **Step 1: Write the failing group/entrypoint test**

`src/test/integration/GrupoBolaoEntryPoints.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GrupoDetail from "@/pages/GrupoDetail";

describe("GrupoDetail bolao entrypoints", () => {
  it("keeps create-bolao available inside a group and explains the group relation", () => {
    render(
      <MemoryRouter initialEntries={["/grupos/grupo-1"]}>
        <Routes>
          <Route path="/grupos/:grupoId" element={<GrupoDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("bolao:grupos.create_pool_action")).toBeInTheDocument();
    expect(screen.getByText("bolao:grupos.group_label")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the entrypoint test to verify it fails or is too weak**

Run: `npx vitest run src/test/integration/GrupoBolaoEntryPoints.test.tsx`

Expected: FAIL or expose that the current page has the button but not the new explanatory copy, share intent, or group-binding context.

- [ ] **Step 3: Implement the group-aware CTA copy and invite/share affordances**

`src/pages/GrupoDetail.tsx`

```tsx
<div className="surface-card-soft rounded-[24px] p-4 text-sm text-zinc-300">
  <p className="font-black text-white">Este grupo pode ter bolões próprios ou apenas servir como descoberta.</p>
  <p className="mt-1 text-xs text-zinc-400">
    Ao criar um bolão aqui, você escolhe se ele nasce sem grupo, vinculado para descoberta ou com entrada limitada ao grupo.
  </p>
</div>

<Link
  to={`/boloes/criar?grupoId=${grupo.id}`}
  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-widest text-black"
>
  Criar bolão neste grupo
</Link>
```

`src/pages/Boloes.tsx`

```tsx
<button
  onClick={() => navigate("/boloes/criar")}
  className="rounded-2xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-widest text-black"
>
  Criar bolão sem grupo
</button>
```

- [ ] **Step 4: Run the entrypoint test**

Run: `npx vitest run src/test/integration/GrupoBolaoEntryPoints.test.tsx`

Expected: PASS with clear create-in-group and create-without-group entrypoints rendered.

- [ ] **Step 5: Commit**

```bash
git add src/pages/GrupoDetail.tsx src/pages/Boloes.tsx src/pages/PublicInvite.tsx src/test/integration/GrupoBolaoEntryPoints.test.tsx
git commit -m "feat: improve group and bolao entrypoints"
```

### Task 8: Add Migration, Telemetry, And Rollout Safeguards

**Files:**
- Create: `functions/bolao-config/migration.js`
- Create: `functions/test/bolao-config.migration.test.js`
- Create: `scripts/backfill-bolao-config.mjs`
- Create: `src/lib/analytics/bolao-config.telemetry.ts`
- Create: `src/test/integration/bolao-telemetry.test.ts`
- Modify: `functions/index.js`

- [ ] **Step 1: Write the failing migration and telemetry tests**

`functions/test/bolao-config.migration.test.js`

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeLegacyBolao } = require("../bolao-config/migration");

test("normalizeLegacyBolao produces conservative editability for legacy published pools", () => {
  const normalized = normalizeLegacyBolao({
    id: "legacy-1",
    status: "active",
    name: "Legado",
    format_id: "classic",
  });

  assert.equal(normalized.legacy_mode, true);
  assert.equal(normalized.editable_sections.presentation, true);
  assert.equal(normalized.editable_sections.competition_rules, false);
});
```

`src/test/integration/bolao-telemetry.test.ts`

```ts
import { describe, expect, it, vi } from "vitest";
import { trackBolaoConfigEvent } from "@/lib/analytics/bolao-config.telemetry";

describe("trackBolaoConfigEvent", () => {
  it("forwards approved rollout metrics to plausible", () => {
    const plausible = vi.fn();
    (window as any).plausible = plausible;

    trackBolaoConfigEvent("member_removal_blocked", { source: "edit_panel" });

    expect(plausible).toHaveBeenCalledWith("member_removal_blocked", {
      props: { source: "edit_panel" },
    });
  });
});
```

- [ ] **Step 2: Run the migration and telemetry tests to verify they fail**

Run: `node --test functions/test/bolao-config.migration.test.js`

Run: `npx vitest run src/test/integration/bolao-telemetry.test.ts`

Expected: FAIL with missing migration helper and missing telemetry wrapper.

- [ ] **Step 3: Implement the legacy adapter, telemetry wrapper, and backfill script**

`functions/bolao-config/migration.js`

```js
function normalizeLegacyBolao(legacy) {
  return {
    ...legacy,
    legacy_mode: true,
    schema_version: 1,
    editable_sections: {
      presentation: true,
      context: false,
      access_policy: false,
      competition_rules: false,
      finance_rules: false,
      operation: true,
    },
  };
}

module.exports = {
  normalizeLegacyBolao,
};
```

`src/lib/analytics/bolao-config.telemetry.ts`

```ts
type BolaoConfigEvent =
  | "draft_created"
  | "creation_step_completed"
  | "creation_abandoned"
  | "pool_published"
  | "time_to_publish"
  | "edit_blocked"
  | "field_repeatedly_blocked"
  | "pool_duplicated_after_lock"
  | "join_denied_policy"
  | "join_denied_group_requirement"
  | "member_removal_blocked"
  | "editable_sections_recomputed";

export function trackBolaoConfigEvent(event: BolaoConfigEvent, props: Record<string, unknown> = {}) {
  if (typeof window !== "undefined" && typeof window.plausible === "function") {
    window.plausible(event, { props });
  }
}
```

`scripts/backfill-bolao-config.mjs`

```js
import admin from "firebase-admin";
import { normalizeLegacyBolao } from "../functions/bolao-config/migration.js";

admin.initializeApp();

const db = admin.firestore();
const snapshot = await db.collection("boloes").get();

for (const doc of snapshot.docs) {
  const data = doc.data();
  if (data.schema_version) continue;
  const normalized = normalizeLegacyBolao({ id: doc.id, ...data });
  await doc.ref.set(normalized, { merge: true });
}
```

- [ ] **Step 4: Run the migration and telemetry tests**

Run: `node --test functions/test/bolao-config.migration.test.js`

Run: `npx vitest run src/test/integration/bolao-telemetry.test.ts`

Expected: PASS with legacy normalization and approved telemetry events green.

- [ ] **Step 5: Commit**

```bash
git add functions/bolao-config/migration.js functions/test/bolao-config.migration.test.js scripts/backfill-bolao-config.mjs src/lib/analytics/bolao-config.telemetry.ts src/test/integration/bolao-telemetry.test.ts functions/index.js
git commit -m "feat: add bolao migration and rollout telemetry"
```

## Self-Review

### Spec coverage

- Lifecycle vs integrity, `editable_sections`, public expectation, payment semantics, and member removal are covered in Tasks 1 and 2.
- Backend source of truth, `published_snapshot`, config versioning, and audited operations are covered in Task 2.
- Direct-write hardening and destructive-action blocking are covered in Task 3.
- Legacy compatibility and adapter reads are covered in Tasks 4 and 8.
- Guided create UX is covered in Task 5.
- Section-based edit UX and duplicate-for-change flows are covered in Task 6.
- Group/bolão relationship and sharing entrypoints are covered in Task 7.
- Telemetry gates and migration rollout are covered in Task 8.

### Placeholder scan

- No `TODO`, `TBD`, or “similar to above” placeholders remain.
- Every task includes explicit file paths, concrete commands, and code blocks.
- Every task ends with a commit step.

### Type consistency

- Backend contract uses `editable_sections`, `config_version`, `published_snapshot`, `payment_status`, and `membership_status` consistently.
- Frontend types mirror those names in camelCase only at the mapping boundary.
- Operations remain aligned with the spec names: `createDraft`, `updateConfiguration`, `publishBolao`, `duplicateBolao`, `removePoolMember`, `alterPresentation`, `finishBolao`, `archiveBolao`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-bolao-create-edit-restructure-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
