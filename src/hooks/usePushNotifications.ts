import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/firebase/client';
import { doc, setDoc } from 'firebase/firestore';

export const usePushNotifications = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        const registerPush = async () => {
            let permStatus = await PushNotifications.checkPermissions();

            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                console.warn('User denied push notification permissions');
                return;
            }

            await PushNotifications.register();
        };

        registerPush();

        // Listeners for push notifications
        PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token: ' + token.value);
            if (user?.id) {
                try {
                    const docId = `${user.id}_${token.value}`;
                    await setDoc(doc(db, 'native_push_tokens', docId), {
                        user_id: user.id,
                        token: token.value,
                        platform: Capacitor.getPlatform(),
                        updated_at: new Date().toISOString(),
                    }, { merge: true });
                } catch (e) {
                    console.error("Could not save FCM token to Firestore", e);
                }
            }
        });

        PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
        });

        return () => {
            if (Capacitor.isNativePlatform()) {
                PushNotifications.removeAllListeners();
            }
        };
    }, [user?.id]);
};
