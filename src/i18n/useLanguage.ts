import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getProfile, updatePreferredLanguage } from '@/services/profile/profile.service';

export type Language = 'pt-BR' | 'en' | 'es';

export function useLanguage() {
    const { i18n } = useTranslation();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!user) return;

        const syncLanguage = async () => {
            try {
                const profile = await getProfile(user.id);
                if (profile?.preferred_language && profile.preferred_language !== i18n.language) {
                    await i18n.changeLanguage(profile.preferred_language);
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

            if (user) {
                await updatePreferredLanguage(user.id, lang);
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
