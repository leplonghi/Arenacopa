import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const admin = require("firebase-admin");

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "arenacopa-web-2026";
const API_KEY = "local-emulator-api-key";
const OWNER_EMAIL = "owner@arenacopa.local";
const DEV_PASSWORD = "Dev123456!";
const AUTH_BASE_URL = "http://127.0.0.1:9099";
const FUNCTIONS_BASE_URL = `http://127.0.0.1:5001/${PROJECT_ID}/us-central1`;

process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.FIREBASE_CONFIG ||= JSON.stringify({
  projectId: PROJECT_ID,
  storageBucket: `${PROJECT_ID}.appspot.com`,
});
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8280";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const db = admin.firestore();

async function signIn() {
  const response = await fetch(
    `${AUTH_BASE_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: OWNER_EMAIL,
        password: DEV_PASSWORD,
        returnSecureToken: true,
      }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`auth_sign_in_failed:${data?.error?.message || response.status}`);
  }
  return data.idToken;
}

async function postFunction(name, token, payload = {}) {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${name}_failed:${data?.error || response.status}`);
  }
  return data;
}

async function main() {
  const token = await signIn();

  const listing = await postFunction("listUserBoloes", token);
  const myBolaoIds = new Set((listing.myBoloes || []).map((bolao) => bolao.id));
  if (!myBolaoIds.has("local-editable-bolao")) {
    throw new Error("listing_missing_local_editable_bolao");
  }

  await postFunction("alterBolaoPresentation", token, {
    bolao_id: "local-editable-bolao",
    patch: {
      name: "Bolao Local Editavel Smoke",
      description: "Atualizado pelo smoke test local.",
      emoji: "SMK",
    },
  });

  const edited = await db.doc("boloes/local-editable-bolao").get();
  if (edited.data()?.presentation?.description !== "Atualizado pelo smoke test local.") {
    throw new Error("presentation_update_not_persisted");
  }

  await postFunction("deleteBolao", token, {
    bolao_id: "local-disposable-bolao",
    reason: "local_smoke_test",
  });

  const deleted = await db.doc("boloes/local-disposable-bolao").get();
  if (deleted.data()?.lifecycle?.status !== "deleted") {
    throw new Error("delete_operation_not_persisted");
  }

  console.log("[smoke:local] Auth, Functions and Firestore smoke checks passed.");
}

main().catch((error) => {
  console.error("[smoke:local] Failed:", error);
  process.exit(1);
});
