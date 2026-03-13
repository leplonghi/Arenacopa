import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { acceptTerms, ensureProfile, getProfile } from "@/services/profile/profile.service";

import { useTranslation } from "react-i18next";

export function TermsGuard({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { t } = useTranslation('auth');
    const [loading, setLoading] = useState(true);
    const [accepted, setAccepted] = useState(false); // Local state for checkbox
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Skip for demo user
        if (user.id === 'demo-user-id') {
            setLoading(false);
            return;
        }

        const checkTerms = async () => {
            try {
                await ensureProfile({
                    id: user.id,
                    email: user.email,
                    user_metadata: user.user_metadata,
                });

                const profile = await getProfile(user.id);
                if (!profile?.terms_accepted && !profile?.accepted_terms_at) {
                    setShowModal(true);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
            setLoading(false);
        };

        checkTerms();
    }, [user]);

    const handleAccept = async () => {
        if (!user) return;
        setSubmitting(true);

        try {
            await acceptTerms(user.id);
            setShowModal(false);
        } catch (error) {
            console.error("Error updating profile:", error);
        }
        setSubmitting(false);
    };

    // While checking, show loading
    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

    if (showModal) {
        return (
            <Dialog open={true}>
                <DialogContent className="sm:max-w-2xl text-foreground" hideCloseButton>
                    <DialogHeader>
                        <DialogTitle>{t('terms.title')}</DialogTitle>
                        <DialogDescription>
                            {t('terms.description')}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[60vh] rounded-md border p-4 bg-muted/50 text-sm">
                        <div className="space-y-4 pr-4">
                            <h3 className="font-bold text-base">{t('terms.sections.1.title')}</h3>
                            <p>{t('terms.sections.1.content_1')}</p>
                            <p className="font-bold text-destructive">{t('terms.sections.1.content_warning')}</p>
                            <p>{t('terms.sections.1.content_2')}</p>

                            <h3 className="font-bold text-base">{t('terms.sections.2.title')}</h3>
                            <p>{t('terms.sections.2.content')}</p>

                            <h3 className="font-bold text-base">{t('terms.sections.3.title')}</h3>
                            <p>{t('terms.sections.3.content')}</p>

                            <h3 className="font-bold text-base">{t('terms.sections.4.title')}</h3>
                            <p>{t('terms.sections.4.content')}</p>
                        </div>
                    </ScrollArea>

                    <div className="flex items-center space-x-2 py-4">
                        <Checkbox id="terms" checked={accepted} onCheckedChange={(c) => setAccepted(!!c)} />
                        <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                            {t('terms.read_agree')}
                        </Label>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleAccept} disabled={!accepted || submitting} className="w-full sm:w-auto font-bold">
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('terms.accept')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return <>{children}</>;
}
