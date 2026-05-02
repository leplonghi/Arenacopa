import { useEffect, useState } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { db } from '@/integrations/firebase/client';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Push notifications are only supported on native devices (iOS/Android) via Capacitor
    if (!Capacitor.isNativePlatform() || !user?.id) {
      return;
    }

    let isSubscribed = true;

    const registerPush = async () => {
      try {
        // Request permissions
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('User denied push notification permissions');
          return;
        }

        // Register with Apple / Google to receive token
        await PushNotifications.register();

        // On success, we should be able to receive notifications
        PushNotifications.addListener('registration', async (t: Token) => {
          console.log('Push registration success, token: ' + t.value);
          if (isSubscribed) {
            setToken(t.value);
            // Save the token to Firestore
            try {
              const tokenDocRef = doc(db, 'users', user.id, 'tokens', t.value);
              await setDoc(tokenDocRef, {
                token: t.value,
                platform: Capacitor.getPlatform(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isActive: true
              });
            } catch (err) {
              console.error('Failed to save push token to Firestore', err);
            }
          }
        });

        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Error on push registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
          console.log('Push received: ' + JSON.stringify(notification));
          toast({
            title: notification.title || 'Nova Notificação',
            description: notification.body || '',
          });
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
          console.log('Push action performed: ' + JSON.stringify(notification));
          // Route user depending on notification data if needed
          const data = notification.notification.data;
          if (data && data.path) {
            // Can trigger a router navigation here, or use a context pattern
            window.location.href = data.path;
          }
        });

      } catch (error) {
        console.error('Push Notifications setup failed', error);
      }
    };

    registerPush();

    return () => {
      isSubscribed = false;
      PushNotifications.removeAllListeners();
    };
  }, [user?.id, toast]);

  return { token };
}
