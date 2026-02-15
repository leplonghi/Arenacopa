import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Language = 'pt-BR' | 'en' | 'es';

export function useLanguage() {
    const { i18n } = useTranslation();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Sync with Supabase on login/load
    useEffect(() => {
        if (!user) return;

        const syncLanguage = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('preferred_language')
                    .eq('user_id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching language preference:', error);
                    return;
                }

                if (data?.preferred_language && data.preferred_language !== i18n.language) {
                    i18n.changeLanguage(data.preferred_language);
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

            // Persist to Supabase if logged in
            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .update({ preferred_language: lang })
                    .eq('user_id', user.id);

                if (error) throw error;
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
