import { t } from "./i18n";
import {
    ArrowRight,
    FlaskConical,
    HeartPulse,
    LockKeyhole,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { p } from "./data";
import { Button, Form, Field } from "./components";
import { AuthVisual } from "./AuthVisual";
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
            <AuthVisual />
            <main>
                <div className="auth-form">
                    <a className="brand auth-form-brand" href="/login">
                        <FlaskConical size={28} />
                        <b>
                            tahlila<span>lab workspace</span>
                        </b>
                    </a>
                    {mode === "login" && p.patientPortalEnabled && (
                        <div
                            className="auth-persona-switch"
                            aria-label={t("Choisir votre espace")}
                        >
                            <a className="active" href="/login">
                                <UserRound size={17} />
                                <span>
                                    <strong>{t("Personnel")}</strong>
                                </span>
                            </a>
                            <a href="/patient/login">
                                <HeartPulse size={17} />
                                <span>
                                    <strong>{t("Patient")}</strong>
                                </span>
                            </a>
                        </div>
                    )}



                    <h1>{titles[mode]}</h1>
                    {mode !== "login" && (
                        <p>{t("Acc\xE9dez \xE0 votre espace de travail s\xE9curis\xE9.")}</p>
                    )}
                    {p.flash && (
                        <div
                            className="notice"
                            role="status"
                            aria-live="polite"
                        >
                            {p.flash}
                        </div>
                    )}
                    {Object.values(p.errors)
                        .flat()
                        .map((error, i) => (
                            <p
                                role="alert"
                                className="error-text alert-inline"
                                key={i}
                            >
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
                                            placeholder: t("Adresse e-mail"),
                                            autoComplete: "email",
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
                                            placeholder: t("Mot de passe"),
                                            autoComplete:
                                                mode === "login"
                                                    ? "current-password"
                                                    : "new-password",
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
                                        placeholder: t("Confirmer le mot de passe"),
                                        autoComplete: "new-password",
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
                    {mode !== "login" && (
                        <a className="cancel-link" href="/login">
                            {t("Retour \xE0 la connexion")}
                        </a>
                    )}
                    <span className="auth-open-source-badge">
                        &lt;/&gt; {t("Open source")} · {t("Web & Desktop")}
                    </span>
                </div>
            </main>
        </div>
    );
}
