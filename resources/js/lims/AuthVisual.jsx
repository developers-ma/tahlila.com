import {
    FileCheck2,
    FlaskConical,
    ShieldCheck,
    TestTubes,
    UsersRound,
} from "lucide-react";
import { t } from "./i18n";

export function AuthVisual({ patient = false }) {
    return (
        <section className="auth-visual" aria-label={t("Présentation Tahlila")}>
            <a
                className="brand auth-visual-brand"
                href={patient ? "/patient/login" : "/login"}
            >
                <FlaskConical size={28} />
                <b>
                    tahlila<span>lab workspace</span>
                </b>
            </a>

            <div className="auth-visual-copy">
                <span className="auth-visual-pill">
                    {t("Système de laboratoire open source")}
                </span>
                <h2>
                    {patient ? (
                        <>
                            {t("Vos analyses.")}
                            <br />
                            {t("Claires, accessibles,")}
                        </>
                    ) : (
                        <>
                            {t("Votre laboratoire.")}
                            <br />
                            {t("Une longueur")} {t("d’avance.")}
                        </>
                    )}
                </h2>
            </div>

            <div className="auth-visual-art" aria-hidden="true">
                <span className="auth-blob auth-blob-one" />
                <span className="auth-blob auth-blob-two" />
                <img src="/images/auth/laboratory-still-life.png" alt="" />
            </div>
            <div className="auth-visual-features">
                <span>
                    <UsersRound />
                    <b>{t("Patients")}</b>
                    <small>{t("Dossiers")}</small>
                </span>
                <span>
                    <TestTubes />
                    <b>{t("Analyses")}</b>
                    <small>{t("Suivi")}</small>
                </span>
                <span>
                    <FileCheck2 />
                    <b>{t("Résultats")}</b>
                    <small>{t("Rapports")}</small>
                </span>
                <span>
                    <ShieldCheck />
                    <b>{t("Sécurisé")}</b>
                    <small>{t("Fiable")}</small>
                </span>
            </div>
        </section>
    );
}
