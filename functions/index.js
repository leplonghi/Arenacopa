const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Gamification Logic: Distribute points when a match finishes
exports.onMatchResultUpdated = functions.firestore
    .document('matches/{matchId}')
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

        // Check if the match status changed to finished
        if (newValue.status === 'FINISHED' && previousValue.status !== 'FINISHED') {
            const matchId = context.params.matchId;
            const actualScoreHome = newValue.homeScore;
            const actualScoreAway = newValue.awayScore;

            // Get all predictions for this match
            const predictionsRef = admin.firestore().collection('predictions');
            const predictionsSnapshot = await predictionsRef.where('matchId', '==', matchId).get();

            const batch = admin.firestore().batch();

            for (const doc of predictionsSnapshot.docs) {
                const userPrediction = doc.data();
                const userId = userPrediction.userId;

                let pointsEarned = 0;

                // Exact Match Score Rule
                if (userPrediction.homeScore === actualScoreHome && userPrediction.awayScore === actualScoreAway) {
                    pointsEarned = 10; // "Na Mosca"
                }
                // Correct Winner/Draw Rule
                else if (
                    (userPrediction.homeScore > userPrediction.awayScore && actualScoreHome > actualScoreAway) ||
                    (userPrediction.homeScore < userPrediction.awayScore && actualScoreHome < actualScoreAway) ||
                    (userPrediction.homeScore === userPrediction.awayScore && actualScoreHome === actualScoreAway)
                ) {
                    pointsEarned = 5; // "Vencedor Seco"
                }

                if (pointsEarned > 0) {
                    const userRef = admin.firestore().collection('users').doc(userId);

                    // Update User Score
                    batch.update(userRef, {
                        totalScore: admin.firestore.FieldValue.increment(pointsEarned),
                        correctPredictions: admin.firestore.FieldValue.increment(1),
                        exactMatches: pointsEarned === 10 ? admin.firestore.FieldValue.increment(1) : admin.firestore.FieldValue.increment(0)
                    });

                    // Update the prediction itself with points
                    batch.update(doc.ref, {
                        pointsAwarded: pointsEarned,
                        processed: true
                    });

                    // Achievement logic can be added here
                }
            }

            // Commit the batch update
            await batch.commit();
            console.log(`Processed ${predictionsSnapshot.size} predictions for match ${matchId}`);
        }
        return null;
    });

// Push Notification Logic: Notify when a new Bolão invite happens
exports.onNewBolaoInvite = functions.firestore
    .document('bolaos/{bolaoId}/members/{userId}')
    .onCreate(async (snap, context) => {
        const bolaoId = context.params.bolaoId;
        const userId = context.params.userId;
        const snapData = snap.data();

        // Don't notify the admin themselves
        if (snapData.role === 'admin') return null;

        const userRef = admin.firestore().collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) return null;

        const fcmToken = userDoc.data()?.fcmToken;
        if (!fcmToken) return null;

        const bolaoDoc = await admin.firestore().collection('bolaos').doc(bolaoId).get();
        const bolaoName = bolaoDoc.data()?.name || "um novo bolão";

        const message = {
            notification: {
                title: 'Convite para Bolão!',
                body: `Você foi convidado para participar de ${bolaoName}! Dá uma olhada e faça seus palpites.`
            },
            data: {
                route: `/boloes/${bolaoId}`
            },
            token: fcmToken
        };

        try {
            await admin.messaging().send(message);
        } catch (error) {
            console.error('Error sending push notification', error);
        }
        return null;
    });
