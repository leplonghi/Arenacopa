const admin = require("firebase-admin");
admin.initializeApp({ projectId: "arenacopa-web-2026" });
const db = admin.firestore();

const repo = require("./functions/bolao-listing/repository");

async function run() {
    try {
        console.log("Starting test...");
        // use a fake actor id or a known one, e.g. "teste-user"
        const result = await repo.listUserBoloes({ db, actorId: "test-actor-123" });
        console.log("Success:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Failed:", e);
    }
}
run().then(() => process.exit(0));
