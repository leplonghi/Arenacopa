const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

/**
 * Automatically updates member_count in the bolao document
 * whenever a new member is added or removed.
 */
exports.onBolaoMemberWrite = functions.firestore
    .document("bolao_members/{memberId}")
    .onWrite(async (change, context) => {
        const db = admin.firestore();
        const dataBefore = change.before.exists ? change.before.data() : null;
        const dataAfter = change.after.exists ? change.after.data() : null;

        const bolaoId = dataAfter?.bolao_id || dataBefore?.bolao_id;
        if (!bolaoId) return null;

        // Determine if we need to update the count
        const wasActive = dataBefore?.membership_status === "active";
        const isActive = dataAfter?.membership_status === "active";

        if (wasActive === isActive) return null;

        const increment = isActive ? 1 : -1;

        try {
            await db.collection("boloes").doc(bolaoId).update({
                member_count: FieldValue.increment(increment),
                "integrity.last_updated_at": FieldValue.serverTimestamp(),
            });
            console.log(`Updated member_count for bolao ${bolaoId} by ${increment}`);
        } catch (error) {
            console.error(`Failed to update member_count for bolao ${bolaoId}:`, error.message);
        }

        return null;
    });

/**
 * Cleans up related data when a bolao is deleted (hard delete).
 * Note: Most bolões are archived/soft-deleted, but this handles the cleanup if hard-deleted.
 */
exports.onBolaoDelete = functions.firestore
    .document("boloes/{bolaoId}")
    .onDelete(async (snapshot, context) => {
        const db = admin.firestore();
        const bolaoId = context.params.bolaoId;

        const collectionsToCleanup = [
            "bolao_members",
            "bolao_markets",
            "bolao_onboarding_state",
            "bolao_activity",
            "bolao_audit",
            "bolao_rankings"
        ];

        const batch = db.batch();
        
        for (const collectionName of collectionsToCleanup) {
            const docs = await db.collection(collectionName).where("bolao_id", "==", bolaoId).limit(500).get();
            docs.forEach(doc => batch.delete(doc.ref));
        }

        await batch.commit();
        console.log(`Cleaned up data for deleted bolao ${bolaoId}`);
        return null;
    });
