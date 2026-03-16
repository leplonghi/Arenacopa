const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const SCORING = {
    EXACT: 5,
    WINNER: 3,
    DRAW: 2
};

/**
 * Triggered when a match is updated.
 * If the match finishes or the score changes while finished, recalculates all palpites.
 */
exports.onMatchResultUpdated = functions.firestore
    .document('matches/{matchId}')
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

        // Check if status changed to finished or home_score/away_score changed while finished
        const newStatus = newValue.status ? newValue.status.toUpperCase() : '';
        const prevStatus = previousValue ? (previousValue.status ? previousValue.status.toUpperCase() : '') : '';
        
        const statusChangedToFinished = newStatus === 'FINISHED' && prevStatus !== 'FINISHED';
        const scoreChangedWhileFinished = newStatus === 'FINISHED' && 
            (newValue.home_score !== previousValue.home_score || newValue.away_score !== previousValue.away_score);

        if (statusChangedToFinished || scoreChangedWhileFinished) {
            const matchId = context.params.matchId;
            const mh = newValue.home_score;
            const ma = newValue.away_score;

            if (mh === null || ma === null) return null;

            console.log(`Processing match ${matchId} result: ${mh} - ${ma}`);

            // Get all predictions for this match across all boloes
            const predictionsRef = admin.firestore().collection('bolao_palpites');
            const predictionsSnapshot = await predictionsRef.where('match_id', '==', matchId).get();

            if (predictionsSnapshot.empty) {
                console.log(`No predictions found for match ${matchId}`);
                return null;
            }

            const batch = admin.firestore().batch();

            for (const doc of predictionsSnapshot.docs) {
                const palpite = doc.data();
                const userId = palpite.user_id;
                const bolaoId = palpite.bolao_id;

                let points = 0;
                let type = 'miss';

                const ph = palpite.home_score;
                const pa = palpite.away_score;

                // Exact score
                if (ph === mh && pa === ma) {
                    points = SCORING.EXACT;
                    type = 'exact';
                } else {
                    const palpiteDiff = ph - pa;
                    const matchDiff = mh - ma;
                    const palpiteResult = palpiteDiff > 0 ? "home" : palpiteDiff < 0 ? "away" : "draw";
                    const matchResult = matchDiff > 0 ? "home" : matchDiff < 0 ? "away" : "draw";

                    if (palpiteResult === matchResult) {
                        if (matchResult === "draw") {
                            points = SCORING.DRAW;
                            type = 'draw';
                        } else {
                            points = SCORING.WINNER;
                            type = 'winner';
                        }
                    } else {
                        type = 'miss';
                    }
                }

                // Power Play multiplier
                if (palpite.is_power_play && points > 0) {
                    points *= 2;
                }

                // Update the prediction document
                batch.update(doc.ref, {
                    points: points,
                    type: type,
                    processed_at: admin.firestore.FieldValue.serverTimestamp()
                });

                // Update bolao_rankings doc: ${userId}_${bolaoId}
                const rankingRef = admin.firestore().collection('bolao_rankings').doc(`${userId}_${bolaoId}`);
                
                // Calculate difference if score was updated (previousValue was already finished)
                const prevPoints = palpite.points || 0;
                const diffPoints = points - prevPoints;
                const prevType = palpite.type || 'miss';
                const diffExacts = (type === 'exact' ? 1 : 0) - (prevType === 'exact' ? 1 : 0);

                batch.set(rankingRef, {
                    user_id: userId,
                    bolao_id: bolaoId,
                    total_points: admin.firestore.FieldValue.increment(diffPoints),
                    exact_matches: admin.firestore.FieldValue.increment(diffExacts),
                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }

            await batch.commit();
            console.log(`Successfully processed ${predictionsSnapshot.size} predictions for match ${matchId}`);
        }
        return null;
    });

/**
 * Triggered when a user joins a bolão.
 * Initializes their ranking entry.
 */
exports.onNewBolaoMember = functions.firestore
    .document('bolao_members/{memberId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const userId = data.user_id;
        const bolaoId = data.bolao_id;

        if (!userId || !bolaoId) return null;

        const rankingRef = admin.firestore().collection('bolao_rankings').doc(`${userId}_${bolaoId}`);
        const rankingDoc = await rankingRef.get();

        if (!rankingDoc.exists) {
            await rankingRef.set({
                user_id: userId,
                bolao_id: bolaoId,
                total_points: 0,
                exact_matches: 0,
                rank: 0,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Initialized ranking for user ${userId} in bolão ${bolaoId}`);
        }

        return null;
    });
