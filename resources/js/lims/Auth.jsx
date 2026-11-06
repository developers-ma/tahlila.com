import { t } from "./i18n";
import {
    ArrowRight,
    Check,
    FlaskConical,
    HeartPulse,
    LockKeyhole,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { p } from "./data";
import { Button, Form, Field } from "./components";
export function Auth() {
    const mode = p.screen.slice(5);
    const titles = {
        login: t("Heureux de vous retrouver."),
        "forgot-password": t("Retrouvons votre acc\xE8s."),
        "reset-password": t("Un nouveau d\xE9part."),
        "confirm-password": t("Confirmez votre identit\xE9."),
        "verify-email": t("V\xE9rifiez votre adresse e-mail."),
    };
    const action =
        mode === "reset-password"
            ? "/reset-password"
            : mode === "verify-email"
              ? "/email/verification-notification"
              : `/${mode}`;
    return (
        <div className="auth">
            <div className="auth-story">
                <a className="brand" href="/login">
                    <FlaskConical size={32} />
                    <b>
                        tahlila<span>lab workspace</span>
                    </b>
                </a>
                <div>
                    <span className="eyebrow">
                        {t("LA CLART\xC9 AU SERVICE DU SOIN")}
                    </span>
                    <h1>
                        {t("Votre laboratoire.")}
                        <br />
                        {t("Une longueur")}
                        <br />
                        {t("d\u2019avance.")}
                    </h1>
                    <p>
                        Des patients aux résultats, retrouvez votre travail dans
                        un espace simple et organisé.
                    </p>
                    <div className="auth-orbit">
                        <FlaskConical size={100} strokeWidth={1} />
                        <span>
                            <Check size={18} />
                            {t("Chaque \xE9tape compte.")}
                        </span>
                    </div>
                </div>
                <small>
                    {t("Con\xE7u pour le quotidien de votre laboratoire.")}
                </small>
            </div>
            <main>
                <div className="auth-form">
                    {mode === "login" && p.patientPortalEnabled && (
                        <div
                            className="auth-persona-switch"
                            aria-label={t("Choisir votre espace")}
                        >
                            <a className="active" href="/login">
                                <UserRound size={17} />
                                <span>
                                    <strong>{t("Personnel")}</strong>
                                    <small>
                                        {t("Administration du laboratoire")}
                                    </small>
                                </span>
                            </a>
                            <a href="/patient/login">
                                <HeartPulse size={17} />
                                <span>
                                    <strong>{t("Patient")}</strong>
                                    <small>{t("Résultats et analyses")}</small>
                                </span>
                            </a>
                        </div>
                    )}
                    <span className="auth-form-icon">
                        {mode === "login" ? (
                            <LockKeyhole size={21} />
                        ) : (
                            <ShieldCheck size={21} />
                        )}
                    </span>
                    <small className="eyebrow">
                        {t("BIENVENUE CHEZ TAHLILA")}
                    </small>
                    <h1>{titles[mode]}</h1>
                    <p>
                        {t(
                            "Acc\xE9dez \xE0 votre espace de travail s\xE9curis\xE9.",
                        )}
                    </p>
                    {p.flash && <div className="notice">{p.flash}</div>}
                    {Object.values(p.errors)
                        .flat()
                        .map((error, i) => (
                            <p role="alert" className="error-text" key={i}>
                                {error}
                            </p>
                        ))}
                    <Form action={action}>
                        {mode === "reset-password" && (
                            <input type="hidden" name="token" value={p.token} />
                        )}
                        <div className="form-grid">
                            {!["verify-email", "confirm-password"].includes(
                                mode,
                            ) && (
                                <Field
                                    field={{
                                        name: "email",
                                        label: t("Adresse e-mail"),
                                        type: "email",
                                        required: true,
                                    }}
                                    record={{
                                        email: p.email,
                                    }}
                                />
                            )}
                            {!["forgot-password", "verify-email"].includes(
                                mode,
                            ) && (
                                <Field
                                    field={{
                                        name: "password",
                                        label: t("Mot de passe"),
                                        type: "password",
                                        required: true,
                                    }}
                                />
                            )}
                            {mode === "reset-password" && (
                                <Field
                                    field={{
                                        name: "password_confirmation",
                                        label: t("Confirmer le mot de passe"),
                                        type: "password",
                                        required: true,
                                    }}
                                />
                            )}
                        </div>
                        {mode === "login" && (
                            <div className="auth-options">
                                <Field
                                    field={{
                                        name: "remember",
                                        label: t("Rester connect\xE9"),
                                        type: "checkbox",
                                    }}
                                />
                                <a href="/forgot-password">
                                    {t("Mot de passe oubli\xE9 ?")}
                                </a>
                            </div>
                        )}
                        <Button className="full">
                            {mode === "login"
                                ? t("Se connecter")
                                : mode === "verify-email"
                                  ? "Renvoyer le lien"
                                  : t("Continuer")}
                            <ArrowRight size={18} />
                        </Button>
                    </Form>
                    {mode === "login" && (
                        <div className="auth-security-note">
                            <ShieldCheck size={16} />
                            <span>
                                <strong>
                                    {t("Connexion professionnelle sécurisée")}
                                </strong>
                                <small>
                                    {t(
                                        "Accès réservé au personnel autorisé du laboratoire.",
                                    )}
                                </small>
                            </span>
                        </div>
                    )}
                    {mode !== "login" && (
                        <a className="cancel-link" href="/login">
                            {t("Retour \xE0 la connexion")}
                        </a>
                    )}
                </div>
            </main>
        </div>
    );
}
