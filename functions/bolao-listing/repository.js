const admin = require("firebase-admin");
const { buildUserBolaoListing } = require("./mapper");

function chunkValues(values, size = 30) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function loadBoloesById({ db, bolaoIds }) {
  const uniqueIds = Array.from(new Set((bolaoIds || []).filter(Boolean)));
  if (!uniqueIds.length) {
    return {};
  }

  const snapshots = await Promise.all(
    chunkValues(uniqueIds).map((ids) =>
      db
        .collection("boloes")
        .where(admin.firestore.FieldPath.documentId(), "in", ids)
        .get(),
    ),
  );

  const result = {};
  snapshots.flatMap((snapshot) => snapshot.docs).forEach((doc) => {
    result[doc.id] = { id: doc.id, ...doc.data() };
  });
  return result;
}

async function listUserBoloes({ db, actorId }) {
  const [membershipsSnapshot, requestsSnapshot] = await Promise.all([
    db.collection("bolao_members").where("user_id", "==", actorId).get(),
    db.collection("bolao_join_requests").where("user_id", "==", actorId).get(),
  ]);

  const memberships = membershipsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const requests = requestsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const bolaoIds = [
    ...memberships.map((membership) => String(membership.bolao_id || "")),
    ...requests.map((request) => String(request.bolao_id || "")),
  ];
  const boloesById = await loadBoloesById({ db, bolaoIds });

  try {
    const publicSnapshot = await db
      .collection("boloes")
      .where("category", "==", "public")
      .orderBy("created_at", "desc")
      .limit(30)
      .get();
    publicBoloes = publicSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.warn("Could not load public bolao discovery list", error);
    publicBoloes = [];
  }

  return buildUserBolaoListing({
    memberships,
    requests,
    boloesById,
    publicBoloes,
  });
}

module.exports = {
  listUserBoloes,
  loadBoloesById,
};
