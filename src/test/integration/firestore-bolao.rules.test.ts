import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (!emulatorHost) {
    throw new Error("FIRESTORE_EMULATOR_HOST is required. Run via firebase emulators:exec.");
  }

  const [host, portRaw] = emulatorHost.split(":");
  const port = Number(portRaw);

  testEnv = await initializeTestEnvironment({
    projectId: "arenacopa-rules-test",
    firestore: {
      host,
      port,
      rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
    },
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

describe("bolao firestore rules", () => {
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

    await assertSucceeds(updateDoc(doc(ownerDb, "boloes/bolao-1"), { name: "Nome novo" }));
  });

  it("blocks hard delete of a bolao member document", async () => {
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
      assertFails(deleteDoc(doc(ownerDb, "bolao_members/member-1_bolao-1"))),
    ).resolves.toBeDefined();
  });
});
