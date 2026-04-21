import { LegalPage } from "@/components/LegalPage";
import { useTranslation } from "react-i18next";

export default function Termos() {
    const { t } = useTranslation("common");
    return (
        <LegalPage title={t("legal.terms.title")}>
            <p>{t("legal.terms.intro")}</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">{t("legal.terms.app_use_title")}</h2>
            <p>{t("legal.terms.app_use_desc")}</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">{t("legal.terms.gambling_title")}</h2>
            <p>
                <strong>{t("legal.terms.gambling_strong")}</strong>{" "}
                {t("legal.terms.gambling_desc")}
            </p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">{t("legal.terms.account_title")}</h2>
            <p>{t("legal.terms.account_desc")}</p>

            <p className="mt-8">{t("legal.terms.effective_date")}</p>
        </LegalPage>
    );
}
