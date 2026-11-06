import { t } from "./i18n";
import { useState } from "react";
import {
    ArrowUpRight,
    ClipboardList,
    FileText,
    FlaskConical,
    Mail,
    Package,
    ShieldCheck,
    SlidersHorizontal,
} from "lucide-react";
import { p } from "./data";
import { Button, Heading, Form, Field } from "./components";
const settings = [
    [
        "Identité du laboratoire",
        "Nom, coordonnées et documents.",
        "/setting/laboratory",
        FlaskConical,
    ],
    [
        "Paiements & devise",
        "Modes de règlement et taxe.",
        "/setting/payment",
        FileText,
    ],
    [t("Messagerie"), "Serveur SMTP et notifications.", "/setting/email", Mail],
    ["Langues", "Langue active et traductions.", "/languages", ClipboardList],
    [
        "Couleurs",
        "Palette enregistrée du laboratoire.",
        "/setting/colors",
        SlidersHorizontal,
    ],
    [
        t("Mon compte"),
        "Profil, mot de passe et sécurité.",
        "/profile",
        ShieldCheck,
    ],
    [
        "Licence",
        "Informations sur votre installation.",
        "/setting/license",
        FileText,
    ],
    ["Mises à jour", "Maintenance de l’application.", "/update", Package],
];
export function SettingsPage() {
    return (
        <>
            <Heading />
            <div className="settings-grid">
                {settings.map(([title, description, href, Icon]) => (
                    <a className="panel setting-card" key={href} href={href}>
                        <span className="round-icon">
                            <Icon />
                        </span>
                        <h2>{title}</h2>
                        <p>{description}</p>
                        <ArrowUpRight />
                    </a>
                ))}
            </div>
        </>
    );
}
export function Profile() {
    return (
        <>
            <Heading />
            <section className="panel form-panel">
                <h2>Informations personnelles</h2>
                <Form action="/profile" method="PATCH">
                    <div className="form-grid">
                        <Field
                            field={{
                                name: "name",
                                label: t("Nom"),
                                required: true,
                            }}
                            record={p.user}
                        />
                        <Field
                            field={{
                                name: "email",
                                label: t("Adresse e-mail"),
                                type: "email",
                                required: true,
                            }}
                            record={p.user}
                        />
                    </div>
                    <Button>{t("Enregistrer")}</Button>
                </Form>
            </section>
            <section className="panel form-panel">
                <h2>Changer de mot de passe</h2>
                <Form action="/password" method="PUT">
                    <div className="form-grid">
                        {[
                            ["current_password", t("Mot de passe actuel")],
                            ["password", t("Nouveau mot de passe")],
                            [
                                "password_confirmation",
                                t("Confirmer le mot de passe"),
                            ],
                        ].map(([name, label]) => (
                            <Field
                                key={name}
                                field={{
                                    name,
                                    label,
                                    type: "password",
                                    required: true,
                                }}
                            />
                        ))}
                    </div>
                    <Button>{t("Mettre \xE0 jour")}</Button>
                </Form>
            </section>
            <section className="panel form-panel">
                <h2>Supprimer mon compte</h2>
                <p>
                    Cette action est définitive. Saisissez votre mot de passe
                    pour confirmer.
                </p>
                <Form
                    action="/profile"
                    method="DELETE"
                    confirm="Supprimer définitivement votre compte ?"
                >
                    <Field
                        field={{
                            name: "password",
                            label: t("Mot de passe"),
                            type: "password",
                            required: true,
                        }}
                    />
                    <Button className="danger-button">
                        Supprimer mon compte
                    </Button>
                </Form>
            </section>
        </>
    );
}
export function Languages() {
    const [notice, setNotice] = useState("");
    const [active, setActive] = useState(p.activeLanguage);
    return (
        <>
            <Heading />
            <div className="notice" role="status">
                {notice || `Langue active : ${active}`}
            </div>
            <div className="settings-grid">
                {p.languages.map((lang) => (
                    <section className="panel form-panel" key={lang}>
                        <h2>{lang.toUpperCase()}</h2>
                        <div className="row-actions">
                            <a href={`/languages/${lang}/edit`}>
                                {t("Traductions")}
                            </a>
                            <Button
                                secondary
                                disabled={active === lang}
                                onClick={async () => {
                                    try {
                                        const response = await fetch(
                                            `/languages/${lang}/activate`,
                                            {
                                                method: "POST",
                                                headers: {
                                                    "X-CSRF-TOKEN": p.csrf,
                                                    Accept: "application/json",
                                                },
                                            },
                                        );
                                        if (!response.ok) throw Error();
                                        setActive(lang);
                                        setNotice("Langue enregistrée.");
                                    } catch {
                                        setNotice(
                                            "Impossible d’activer cette langue.",
                                        );
                                    }
                                }}
                            >
                                {active === lang ? t("Active") : t("Activer")}
                            </Button>
                        </div>
                    </section>
                ))}
            </div>
        </>
    );
}
export function LanguageEditor() {
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);
    return (
        <>
            <Heading />
            <section className="panel form-panel">
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setBusy(true);
                        try {
                            const response = await fetch(
                                `/languages/${p.language}/update`,
                                {
                                    method: "POST",
                                    headers: {
                                        "X-CSRF-TOKEN": p.csrf,
                                        Accept: "application/json",
                                    },
                                    body: new FormData(e.currentTarget),
                                },
                            );
                            if (!response.ok) throw Error();
                            setNotice("Traductions enregistrées.");
                        } catch {
                            setNotice("Enregistrement impossible.");
                        } finally {
                            setBusy(false);
                        }
                    }}
                >
                    <Field
                        field={{
                            name: "dir",
                            label: t("Direction"),
                            type: "select",
                            options: {
                                ltr: t("Gauche \xE0 droite"),
                                rtl: t("Droite \xE0 gauche"),
                            },
                        }}
                        record={p.translations}
                    />
                    <div className="form-grid">
                        {Object.entries(p.translations)
                            .filter(([key]) => key !== "dir")
                            .map(([key, value]) => (
                                <label className="field" key={key}>
                                    {key}
                                    <input
                                        name={`translations[${key}]`}
                                        defaultValue={value}
                                    />
                                </label>
                            ))}
                    </div>
                    <Button disabled={busy}>
                        {busy
                            ? "Enregistrement…"
                            : t("Enregistrer les traductions")}
                    </Button>
                    <p role="status">{notice}</p>
                </form>
            </section>
        </>
    );
}
