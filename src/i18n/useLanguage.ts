import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/firebase/client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export type Language = 'pt-BR' | 'en' | 'es';

export function useLanguage() {
    const { i18n } = useTranslation();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Sync with Firebase on login/load
    useEffect(() => {
        if (!user) return;

        const syncLanguage = async () => {
            try {
                const docRef = doc(db, 'profiles', user.id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data?.preferred_language && data.preferred_language !== i18n.language) {
                        i18n.changeLanguage(data.preferred_language);
                    }
                }
            } catch (err) {
                console.error('Error syncing language:', err);
            }
        };

        syncLanguage();
    }, [user, i18n]);

    const changeLanguage = async (lang: Language) => {
        setIsLoading(true);
        try {
            await i18n.changeLanguage(lang);

            // Persist to Firebase if logged in
            if (user) {
                const docRef = doc(db, 'profiles', user.id);
                await updateDoc(docRef, { preferred_language: lang });
            }

            // Helper message for demo purpose or feedback
            const messages = {
                'pt-BR': 'Idioma alterado para Português',
                'en': 'Language changed to English',
                'es': 'Idioma cambiado a Español'
            };

            toast.success(messages[lang]);
        } catch (error) {
            console.error('Error changing language:', error);
            toast.error('Erro ao alterar idioma');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        language: i18n.language as Language,
        changeLanguage,
        isLoading
    };
}
