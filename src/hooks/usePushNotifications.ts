/* eslint-disable no-console */
import { useEffect, useRef } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/firebase/client';
import { doc, setDoc } from 'firebase/firestore';
import type { PluginListenerHandle } from '@capacitor/core';

export const usePushNotifications = () => {
    const { user } = useAuth();
    // Store resolved handles so the cleanup can remove them synchronously,
    // regardless of whether the effect is still resolving when unmount fires.
    const handlesRef = useRef<PluginListenerHandle[]>([]);

    useEffect(() => {
        const isDemoMode = import.meta.env.DEV && localStorage.getItem('demo_mode') === 'true';
        if (!Capacitor.isNativePlatform() || !user?.id || isDemoMode) {
            return;
        }

        let isMounted = true;

        const setup = async () => {
            // ── 1. Permission ──────────────────────────────────────────────────
            let permStatus = await PushNotifications.checkPermissions();
            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }
            if (permStatus.receive !== 'granted') {
                console.warn('User denied push notification permissions');
                return;
            }
            if (!isMounted) return; // component unmounted while awaiting permission

            await PushNotifications.register();
            if (!isMounted) return;

            // ── 2. Listeners ───────────────────────────────────────────────────
            // Resolve all 4 listener handles in parallel and stash them in the
            // ref so the cleanup can remove them even if unmount races setup.
            const handles = await Promise.all([
                PushNotifications.addListener('registration', async (token) => {
                    console.log('Push registration success, token:', token.value);
                    try {
                        const docId = `${user.id}_${token.value}`;
                        await setDoc(doc(db, 'native_push_tokens', docId), {
                            user_id: user.id,
                            token: token.value,
                            platform: Capacitor.getPlatform(),
                            updated_at: new Date().toISOString(),
                        }, { merge: true });
                    } catch (e) {
                        console.error('Could not save FCM token to Firestore', e);
                    }
                }),
                PushNotifications.addListener('registrationError', (error) => {
                    console.error('Push registration error:', JSON.stringify(error));
                }),
                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push received:', JSON.stringify(notification));
                }),
                PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    console.log('Push action performed:', JSON.stringify(notification));
                }),
            ]);

            if (!isMounted) {
                // Component unmounted while listeners were being registered — remove immediately.
                handles.forEach((h) => h.remove());
                return;
            }

            handlesRef.current = handles;
        };

        setup();

        return () => {
            isMounted = false;
            // Remove any handles that were already resolved at cleanup time.
            handlesRef.current.forEach((h) => h.remove());
            handlesRef.current = [];
        };
    }, [user?.id]);
};
