import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    FileText,
    FlaskConical,
    HeartPulse,
    LockKeyhole,
    LogOut,
    Mail,
    Phone,
    Printer,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { t } from "./i18n";
import { date, money, p, statuses } from "./data";
import { Button, Field, Form, Status } from "./components";

function PatientBrand() {
    return (
        <a className="patient-brand" href="/patient/dashboard">
            <span>
                {p.laboratory?.logo ? (
                    <img
                        src={"/storage/" + p.laboratory.logo}
                        alt={p.laboratory.laboratory_name}
                    />
                ) : (
                    <FlaskConical size={24} />
                )}
            </span>
            <strong>
                {p.laboratory?.laboratory_name || "Laboratoire Tahlila"}
                <small>{t("Espace patient sécurisé")}</small>
            </strong>
        </a>
    );
}

function PatientAuth() {
    const mode = p.screen.replace("patient.", "");
    const content = {
        login: {
            eyebrow: "VOS RÉSULTATS, EN TOUTE SÉCURITÉ",
            title: "Bienvenue dans votre espace patient",
            description:
                "Consultez l’avancement de vos analyses et vos résultats validés.",
            action: "/patient/login",
        },
        "forgot-password": {
            eyebrow: "PREMIER ACCÈS OU MOT DE PASSE OUBLIÉ",
            title: "Recevez votre lien sécurisé",
            description:
                "Utilisez la même adresse e-mail que celle enregistrée au laboratoire.",
            action: "/patient/forgot-password",
        },
        "reset-password": {
            eyebrow: "PROTÉGEZ VOTRE ESPACE",
            title: "Définissez votre mot de passe",
            description:
                "Choisissez un mot de passe personnel pour accéder à vos documents.",
            action: "/patient/reset-password",
        },
    }[mode];

    return (
        <div className="patient-auth-shell">
            <section className="patient-auth-story">
                <PatientBrand />
                <div>
                    <span className="patient-auth-pill">
                        <ShieldCheck size={15} />
                        {t("Données médicales protégées")}
                    </span>
                    <h1>
                        {t("Vos analyses.")}
                        <br />
                        {t("Claires, accessibles,")}
                        <br />
                        {t("quand vous en avez besoin.")}
                    </h1>
                    <p>
                        {t(
                            "Un accès simple et confidentiel aux informations transmises par votre laboratoire.",
                        )}
                    </p>
                </div>
                <div className="patient-auth-trust">
                    <span>
                        <LockKeyhole size={16} /> Connexion sécurisée
                    </span>
                    <span>
                        <CheckCircle2 size={16} /> Résultats validés
                    </span>
                </div>
            </section>
            <main className="patient-auth-main">
                <div className="patient-auth-form">
                    {mode === "login" && (
                        <div
                            className="auth-persona-switch patient-switch"
                            aria-label={t("Choisir votre espace")}
                        >
                            <a href="/login">
                                <UserRound size={17} />
                                <span>
                                    <strong>{t("Personnel")}</strong>
                                    <small>{t("Espace laboratoire")}</small>
                                </span>
                            </a>
                            <a className="active" href="/patient/login">
                                <HeartPulse size={17} />
                                <span>
                                    <strong>{t("Patient")}</strong>
                                    <small>{t("Mes résultats")}</small>
                                </span>
                            </a>
                        </div>
                    )}
                    <span className="eyebrow">{t(content.eyebrow)}</span>
                    <h2>{t(content.title)}</h2>
                    <p>{t(content.description)}</p>
                    {p.flash && <div className="notice">{p.flash}</div>}
                    {Object.values(p.errors || {})
                        .flat()
                        .map((error, index) => (
                            <p className="error-text" role="alert" key={index}>
                                {error}
                            </p>
                        ))}
                    <Form
                        action={content.action}
                        className="patient-login-form"
                    >
                        {mode === "reset-password" && (
                            <input type="hidden" name="token" value={p.token} />
                        )}
                        <Field
                            field={{
                                name: "email",
                                label: "Adresse e-mail",
                                type: "email",
                                required: true,
                                autoComplete: "email",
                                placeholder: "votre@email.com",
                            }}
                            record={{ email: p.email }}
                        />
                        {mode !== "forgot-password" && (
                            <Field
                                field={{
                                    name: "password",
                                    label:
                                        mode === "reset-password"
                                            ? "Nouveau mot de passe"
                                            : "Mot de passe",
                                    type: "password",
                                    required: true,
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
                                    label: "Confirmer le mot de passe",
                                    type: "password",
                                    required: true,
                                    autoComplete: "new-password",
                                }}
                            />
                        )}
                        <Button className="full">
                            {mode === "login"
                                ? t("Se connecter")
                                : mode === "forgot-password"
                                  ? t("Envoyer le lien sécurisé")
                                  : t("Enregistrer et continuer")}
                            <ArrowRight size={17} />
                        </Button>
                    </Form>
                    {mode === "login" ? (
                        <a
                            className="patient-auth-link"
                            href="/patient/forgot-password"
                        >
                            {t("Premier accès ou mot de passe oublié ?")}
                        </a>
                    ) : (
                        <a className="patient-auth-link" href="/patient/login">
                            <ArrowLeft size={14} />
                            {t("Retour à la connexion")}
                        </a>
                    )}
                </div>
            </main>
        </div>
    );
}

function PatientLayout({ children }) {
    return (
        <div className="patient-portal">
            <header className="patient-portal-header">
                <PatientBrand />
                <nav aria-label="Navigation de l’espace patient">
                    <a href="/patient/dashboard">
                        <ClipboardList size={17} />
                        {t("Mes analyses")}
                    </a>
                    <span className="patient-header-user">
                        <UserRound size={17} />
                        {p.patient.firstname} {p.patient.lastname}
                    </span>
                    <Form action="/patient/logout" reload>
                        <button type="submit" aria-label={t("Se déconnecter")}>
                            <LogOut size={17} />
                        </button>
                    </Form>
                </nav>
            </header>
            <main className="patient-portal-main">
                {p.flash && <div className="notice">{p.flash}</div>}
                {children}
            </main>
            <footer className="patient-portal-footer">
                <ShieldCheck size={15} />
                <span>
                    {t(
                        "Vos informations sont accessibles uniquement depuis votre compte sécurisé.",
                    )}
                </span>
                <strong>{p.laboratory?.phone}</strong>
            </footer>
        </div>
    );
}

function PatientDashboard() {
    return (
        <PatientLayout>
            <section className="patient-welcome">
                <div>
                    <span className="eyebrow">{t("VOTRE ESPACE SANTÉ")}</span>
                    <h1>
                        {t("Bonjour")}, {p.patient.firstname}
                    </h1>
                    <p>
                        {t(
                            "Suivez vos analyses et consultez vos résultats dès leur validation par le laboratoire.",
                        )}
                    </p>
                </div>
                <HeartPulse size={70} strokeWidth={1.25} />
            </section>

            <section className="patient-stat-grid">
                <article>
                    <FileText size={20} />
                    <div>
                        <strong>{p.stats.orders}</strong>
                        <span>{t("Dossiers d’analyses")}</span>
                    </div>
                </article>
                <article>
                    <CheckCircle2 size={20} />
                    <div>
                        <strong>{p.stats.ready}</strong>
                        <span>{t("Résultats disponibles")}</span>
                    </div>
                </article>
                <article>
                    <Clock3 size={20} />
                    <div>
                        <strong>{p.stats.processing}</strong>
                        <span>{t("Dossiers en cours")}</span>
                    </div>
                </article>
            </section>

            <div className="patient-dashboard-grid">
                <section className="panel patient-orders-card">
                    <div className="patient-card-heading">
                        <div>
                            <span className="eyebrow">{t("SUIVI")}</span>
                            <h2>{t("Mes analyses")}</h2>
                        </div>
                        <span>{p.orders.length}</span>
                    </div>
                    <div className="patient-order-list">
                        {p.orders.map((order) => {
                            const ready = String(order.test_status) === "3";
                            return (
                                <article key={order.id}>
                                    <div className="patient-order-icon">
                                        {ready ? (
                                            <CheckCircle2 size={21} />
                                        ) : (
                                            <Clock3 size={21} />
                                        )}
                                    </div>
                                    <div className="patient-order-main">
                                        <strong>
                                            Dossier LAB-
                                            {String(order.id).padStart(6, "0")}
                                        </strong>
                                        <small>
                                            <CalendarDays size={13} />
                                            {date(
                                                order.prelevement_date ||
                                                    order.created_at,
                                            )}
                                        </small>
                                    </div>
                                    <Status value={order.test_status} />
                                    <div className="patient-order-finance">
                                        <span>{t("Total")}</span>
                                        <strong>
                                            {money(order.total_price)}
                                        </strong>
                                    </div>
                                    {ready ? (
                                        <a
                                            className="button secondary"
                                            href={
                                                "/patient/results/" + order.id
                                            }
                                        >
                                            {t("Voir mes résultats")}
                                            <ArrowRight size={15} />
                                        </a>
                                    ) : (
                                        <span className="patient-order-waiting">
                                            {t("Résultats en préparation")}
                                        </span>
                                    )}
                                </article>
                            );
                        })}
                        {!p.orders.length && (
                            <div className="patient-empty">
                                <FlaskConical size={30} />
                                <h3>{t("Aucune analyse pour le moment")}</h3>
                                <p>
                                    {t(
                                        "Vos prochains dossiers apparaîtront automatiquement ici.",
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <aside className="panel patient-profile-card">
                    <div className="patient-profile-avatar">
                        {p.patient.firstname?.[0]}
                        {p.patient.lastname?.[0]}
                    </div>
                    <span className="eyebrow">{t("MON PROFIL")}</span>
                    <h3>
                        {p.patient.firstname} {p.patient.lastname}
                    </h3>
                    <dl>
                        <div>
                            <dt>{t("Identifiant patient")}</dt>
                            <dd>{p.patient.id_card || "—"}</dd>
                        </div>
                        <div>
                            <dt>{t("Date de naissance")}</dt>
                            <dd>{date(p.patient.date_of_birth)}</dd>
                        </div>
                        <div>
                            <dt>
                                <Mail size={14} /> {t("E-mail")}
                            </dt>
                            <dd>{p.patient.email}</dd>
                        </div>
                        <div>
                            <dt>
                                <Phone size={14} /> {t("Téléphone")}
                            </dt>
                            <dd>{p.patient.phone || "—"}</dd>
                        </div>
                    </dl>
                    <p>
                        {t(
                            "Pour corriger vos coordonnées, contactez directement le laboratoire.",
                        )}
                    </p>
                </aside>
            </div>
        </PatientLayout>
    );
}

function PatientResult() {
    return (
        <PatientLayout>
            <div className="patient-result-toolbar no-print">
                <a href="/patient/dashboard">
                    <ArrowLeft size={16} /> {t("Mes analyses")}
                </a>
                <Button onClick={() => window.print()}>
                    <Printer size={17} /> {t("Imprimer / PDF")}
                </Button>
            </div>
            <article className="panel patient-result-document">
                <header>
                    <div>
                        <span className="eyebrow">
                            {t("RÉSULTATS VALIDÉS")}
                        </span>
                        <h1>
                            Dossier LAB-{String(p.record.id).padStart(6, "0")}
                        </h1>
                        <p>
                            {p.patient.firstname} {p.patient.lastname} ·{" "}
                            {date(p.record.created_at)}
                        </p>
                    </div>
                    <span className="patient-validated-badge">
                        <CheckCircle2 size={17} />
                        {t("Disponible")}
                    </span>
                </header>
                <div className="patient-result-list">
                    {p.lines.map((line, index) => (
                        <section key={index}>
                            <div>
                                <span>
                                    {line.category_name || line.group_name}
                                </span>
                                <h2>{line.test_name || t("Analyse")}</h2>
                                <small>
                                    {t("Valeurs de référence")} :{" "}
                                    {line.test_reference_value || "—"}{" "}
                                    {line.test_unit}
                                </small>
                            </div>
                            <div className="patient-result-value">
                                <strong>{line.test_result_value || "—"}</strong>
                                <span>{line.test_unit}</span>
                            </div>
                            {line.test_result_value_2 && (
                                <div className="patient-result-value secondary">
                                    <strong>{line.test_result_value_2}</strong>
                                    <span>{line.test_unit_2}</span>
                                </div>
                            )}
                            {line.conclusion && (
                                <p className="patient-result-conclusion">
                                    <strong>{t("Conclusion")}</strong>
                                    {line.conclusion}
                                </p>
                            )}
                        </section>
                    ))}
                </div>
                <footer>
                    <ShieldCheck size={17} />
                    {t(
                        "Ces résultats ont été validés par votre laboratoire. Ils ne remplacent pas l’avis de votre professionnel de santé.",
                    )}
                </footer>
            </article>
        </PatientLayout>
    );
}

export function PatientPortal() {
    if (
        [
            "patient.login",
            "patient.forgot-password",
            "patient.reset-password",
        ].includes(p.screen)
    )
        return <PatientAuth />;
    if (p.screen === "patient.dashboard") return <PatientDashboard />;
    if (p.screen === "patient.result") return <PatientResult />;
    return null;
}
