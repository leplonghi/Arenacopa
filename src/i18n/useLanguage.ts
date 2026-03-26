import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getProfile, updatePreferredLanguage } from '@/services/profile/profile.service';

export type Language = 'pt-BR' | 'en' | 'es';

function normalizeLanguage(lang?: string | null): Language {
    const normalized = lang?.toLowerCase().trim() || '';

    if (normalized.startsWith('pt')) return 'pt-BR';
    if (normalized.startsWith('es')) return 'es';

    return 'en';
}

export function useLanguage() {
    const { i18n } = useTranslation();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        if (!user) return;

        const syncLanguage = async () => {
            try {
                const profile = await getProfile(user.id);
                const preferredLanguage = normalizeLanguage(profile?.preferred_language);
                if (profile?.preferred_language && preferredLanguage !== normalizeLanguage(i18n.language)) {
                    await i18n.changeLanguage(preferredLanguage);
                }
            } catch (err) {
                console.error('Error syncing language:', err);
            }
        };

        syncLanguage();
    }, [i18n, user]);

    const changeLanguage = async (lang: Language) => {
        setIsLoading(true);
        try {
            const normalizedLanguage = normalizeLanguage(lang);

            // 1. Change language in i18n immediately (UI updates right away)
            await i18n.changeLanguage(normalizedLanguage);
            localStorage.setItem("i18nextLng", normalizedLanguage);

            // 2. Show success toast right after UI update
            const messages = {
                'pt-BR': 'Idioma alterado para Português',
                'en': 'Language changed to English',
                'es': 'Idioma cambiado a Español'
            };
            toast.success(messages[normalizedLanguage]);

            // 3. Persist to Firestore silently in the background (fire-and-forget)
            // A Firestore failure must NOT affect the user experience
            if (user) {
                updatePreferredLanguage(user.id, normalizedLanguage).catch(err =>
                    console.error('Failed to persist language preference to Firestore:', err)
                );
            }
        } catch (error) {
            console.error('Error changing language:', error);
            toast.error('Erro ao alterar idioma');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        language: normalizeLanguage(i18n.language),
        changeLanguage,
        isLoading
    };
}
