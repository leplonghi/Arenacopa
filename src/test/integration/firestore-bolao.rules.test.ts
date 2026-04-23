import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";

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

  it("blocks direct member self-join on bolao_members", async () => {
    const memberDb = testEnv.authenticatedContext("member-2").firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "boloes/bolao-2"), {
        creator_id: "owner-2",
        category: "public",
        status: "open",
        invite_code: "POOL1234",
      });
    });

    await expect(
      assertFails(
        setDoc(doc(memberDb, "bolao_members/member-2_bolao-2"), {
          bolao_id: "bolao-2",
          user_id: "member-2",
          role: "member",
          payment_status: "pending",
        }),
      ),
    ).resolves.toBeDefined();
  });

  it("blocks direct member self-join on grupo_members", async () => {
    const memberDb = testEnv.authenticatedContext("member-3").firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "grupos/grupo-1"), {
        creator_id: "owner-3",
        category: "public",
        invite_code: "GRP1234",
      });
    });

    await expect(
      assertFails(
        setDoc(doc(memberDb, "grupo_members/member-3_grupo-1"), {
          grupo_id: "grupo-1",
          user_id: "member-3",
          role: "member",
          invite_code: "GRP1234",
        }),
      ),
    ).resolves.toBeDefined();
  });

  it("allows a user to read their missing deterministic champion prediction", async () => {
    const memberDb = testEnv.authenticatedContext("member-4").firestore();

    await expect(
      assertSucceeds(getDoc(doc(memberDb, "bolao_champion_predictions/member-4_bolao-404"))),
    ).resolves.toBeDefined();
  });
});
