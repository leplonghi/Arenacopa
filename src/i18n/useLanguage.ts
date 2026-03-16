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
    const isDemoMode = localStorage.getItem("demo_mode") === "true";

    useEffect(() => {
        if (!user || isDemoMode) return;

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
    }, [i18n, isDemoMode, user]);

    const changeLanguage = async (lang: Language) => {
        setIsLoading(true);
        try {
            const normalizedLanguage = normalizeLanguage(lang);
            await i18n.changeLanguage(normalizedLanguage);
            localStorage.setItem("i18nextLng", normalizedLanguage);

            if (user && !isDemoMode) {
                await updatePreferredLanguage(user.id, normalizedLanguage);
            }

            // Helper message for demo purpose or feedback
            const messages = {
                'pt-BR': 'Idioma alterado para Português',
                'en': 'Language changed to English',
                'es': 'Idioma cambiado a Español'
            };

            toast.success(messages[normalizedLanguage]);
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
