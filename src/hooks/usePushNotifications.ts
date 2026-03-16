import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/firebase/client';
import { doc, setDoc } from 'firebase/firestore';
import type { PluginListenerHandle } from '@capacitor/core';

export const usePushNotifications = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!Capacitor.isNativePlatform() || !user?.id || localStorage.getItem('demo_mode') === 'true') {
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
        const listenerPromises: Array<Promise<PluginListenerHandle>> = [];

        listenerPromises.push(PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token: ' + token.value);
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
        }));

        listenerPromises.push(PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
        }));

        listenerPromises.push(PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
        }));

        listenerPromises.push(PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
        }));

        return () => {
            void Promise.all(listenerPromises).then((handles) => {
                handles.forEach((handle) => handle.remove());
            });
        };
    }, [user?.id]);
};
