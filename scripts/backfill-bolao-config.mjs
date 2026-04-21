import admin from "firebase-admin";
import migrationModule from "../functions/bolao-config/migration.js";

const { normalizeLegacyBolao } = migrationModule;

admin.initializeApp();

const db = admin.firestore();
const snapshot = await db.collection("boloes").get();

for (const bolaoDoc of snapshot.docs) {
  const data = bolaoDoc.data();
  if (data.schema_version) {
    continue;
  }

  const normalized = normalizeLegacyBolao({ id: bolaoDoc.id, ...data });
  await bolaoDoc.ref.set(normalized, { merge: true });
}
