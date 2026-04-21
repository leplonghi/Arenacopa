import { LegalPage } from "@/components/LegalPage";
import { useTranslation } from "react-i18next";

export default function Privacidade() {
    const { t } = useTranslation("common");
    return (
        <LegalPage title={t("legal.privacy.title")}>
            <p>{t("legal.privacy.intro_1")}</p>

            <p>{t("legal.privacy.intro_2")}</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">{t("legal.privacy.cookies_title")}</h2>
            <p>{t("legal.privacy.cookies_desc")}</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">{t("legal.privacy.data_sharing_title")}</h2>
            <p>{t("legal.privacy.data_sharing_desc")}</p>

            <p className="mt-8">{t("legal.privacy.effective_date")}</p>
        </LegalPage>
    );
}
