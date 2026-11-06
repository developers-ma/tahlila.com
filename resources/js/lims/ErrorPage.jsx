import { ArrowLeft, FlaskConical, Home, RotateCcw } from "lucide-react";
import { t } from "./i18n";

const messages = {
    403: ["Accès refusé", "Vous n’avez pas l’autorisation d’afficher cette page."],
    404: ["Page introuvable", "Cette page n’existe pas ou a été déplacée."],
    405: ["Action non autorisée", "Cette action n’est pas disponible pour cette page."],
    419: ["Session expirée", "Actualisez la page puis réessayez."],
    429: ["Trop de demandes", "Patientez un instant avant de réessayer."],
    500: ["Une erreur est survenue", "La page ne peut pas être chargée pour le moment."],
};

export function ErrorPage({ status = 500 }) {
    const code = Number(status) || 500;
    const copy = messages[code] || messages[code >= 500 ? 500 : 404];
    return (
        <main className="app-error-page" role="alert">
            <section className="app-error-card">
                <a className="brand" href="/">
                    <FlaskConical size={28} />
                    <b>tahlila<span>lab workspace</span></b>
                </a>
                <strong className="app-error-code">{code}</strong>
                <h1>{t(copy[0])}</h1>
                <p>{t(copy[1])}</p>
                <div className="app-error-actions">
                    <button type="button" onClick={() => window.history.back()}>
                        <ArrowLeft size={17} /> {t("Retour")}
                    </button>
                    <a href="/" className="button">
                        <Home size={17} /> {t("Accueil")}
                    </a>
                    <button type="button" onClick={() => window.location.reload()}>
                        <RotateCcw size={17} /> {t("Réessayer")}
                    </button>
                </div>
            </section>
        </main>
    );
}
