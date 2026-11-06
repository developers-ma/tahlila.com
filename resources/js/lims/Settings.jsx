import { t } from "./i18n";
import { useState } from "react";
import {
    ArrowRight,
    ArrowUpRight,
    BellRing,
    Building2,
    Check,
    CheckCircle2,
    ClipboardList,
    CreditCard,
    FileText,
    Globe2,
    HeartPulse,
    KeyRound,
    Mail,
    Palette,
    RotateCcw,
    Search,
    Server,
    ShieldCheck,
    SlidersHorizontal,
    Trash2,
    UserRound,
    Wrench,
} from "lucide-react";
import { p } from "./data";
import { Button, Heading, Form, Field } from "./components";

const settingsItems = [
    {
        title: "Identité du laboratoire",
        short: "Laboratoire",
        description: "Coordonnées, identité légale et documents.",
        href: "/setting/laboratory",
        icon: Building2,
    },
    {
        title: "Paiements & devise",
        short: "Paiements",
        description: "Devise, fiscalité et modes de règlement.",
        href: "/setting/payment",
        icon: CreditCard,
    },
    {
        title: "Messagerie",
        short: "Messagerie",
        description: "Serveur SMTP, expéditeur et notifications.",
        href: "/setting/email",
        icon: Mail,
    },
    {
        title: "Langues & traductions",
        short: "Langues",
        description: "Langue active, direction et libellés.",
        href: "/languages",
        icon: Globe2,
    },
    {
        title: "Apparence",
        short: "Apparence",
        description: "Palette et couleurs fonctionnelles.",
        href: "/setting/colors",
        icon: Palette,
    },
    {
        title: "Espace patient",
        short: "Espace patient",
        description: "Connexion sécurisée et consultation des résultats.",
        href: "/setting/patient-portal",
        icon: HeartPulse,
    },
    {
        title: "Mon compte",
        short: "Mon compte",
        description: "Profil, mot de passe et sécurité.",
        href: "/profile",
        icon: UserRound,
    },
    {
        title: "Licence",
        short: "Licence",
        description: "État et gestion de l’installation.",
        href: "/setting/license",
        icon: ShieldCheck,
    },
    {
        title: "Maintenance",
        short: "Maintenance",
        description: "Version, déploiement et mises à jour.",
        href: "/update",
        icon: Wrench,
    },
];

const isSettingsItemActive = (href) =>
    p.path === href || p.path.startsWith(`${href}/`);

function SettingsShell({ children, description }) {
    return (
        <>
            <Heading />
            <div className="settings-workspace">
                <aside className="panel settings-local-nav">
                    <div className="settings-local-head">
                        <span>Configuration</span>
                        <strong>Centre de contrôle</strong>
                    </div>
                    <nav aria-label="Sections des paramètres">
                        {settingsItems.map((item) => {
                            const Icon = item.icon;
                            const active = isSettingsItemActive(item.href);
                            return (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className={active ? "active" : ""}
                                    aria-current={active ? "page" : undefined}
                                >
                                    <Icon size={17} strokeWidth={1.8} />
                                    <span>{t(item.short)}</span>
                                </a>
                            );
                        })}
                    </nav>
                    <div className="settings-local-note">
                        <ShieldCheck size={18} />
                        <p>
                            Les changements sont validés côté serveur avant leur
                            enregistrement.
                        </p>
                    </div>
                </aside>
                <div className="settings-content">
                    {description && (
                        <div className="settings-intro">
                            <span className="status status-3">
                                <i /> Configuration sécurisée
                            </span>
                            <p>{description}</p>
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </>
    );
}

function SettingsSection({
    icon: Icon,
    title,
    description,
    children,
    tone = "",
}) {
    return (
        <section className={`panel settings-section ${tone}`}>
            <header>
                <span className="settings-section-icon">
                    <Icon size={19} />
                </span>
                <div>
                    <h2>{title}</h2>
                    <p>{description}</p>
                </div>
            </header>
            <div className="settings-section-body">{children}</div>
        </section>
    );
}

const formConfigs = {
    laboratory: {
        description:
            "Ces informations alimentent les factures, comptes rendus, e-mails et documents remis aux patients.",
        groups: [
            {
                title: "Identité publique",
                description: "Le nom affiché dans toute l’application.",
                icon: Building2,
                fields: ["laboratory_name", "managing_director"],
            },
            {
                title: "Coordonnées",
                description:
                    "Informations utilisées pour contacter le laboratoire.",
                icon: Mail,
                fields: ["phone", "fax", "email", "address"],
            },
            {
                title: "Informations légales",
                description:
                    "Références imprimées sur les documents administratifs.",
                icon: ShieldCheck,
                fields: ["company_number", "tax_id"],
            },
            {
                title: "Documents & signature",
                description: "Logo et textes affichés au bas des documents.",
                icon: FileText,
                fields: [
                    "logo",
                    "footer_title1",
                    "footer_title2",
                    "footer_title3",
                ],
            },
        ],
    },
    payment: {
        description:
            "Définissez la devise de référence, la taxe et les moyens de paiement proposés lors de l’encaissement.",
        groups: [
            {
                title: "Facturation",
                description: "Paramètres monétaires appliqués aux dossiers.",
                icon: FileText,
                fields: ["currency", "tax"],
            },
            {
                title: "Modes de règlement",
                description:
                    "Activez uniquement les moyens acceptés au laboratoire.",
                icon: CreditCard,
                fields: ["cash", "pos", "bank_transfer", "cheque"],
                layout: "settings-choice-grid",
            },
        ],
    },
    email: {
        description:
            "Connectez votre serveur de messagerie pour envoyer les résultats et notifications depuis l’adresse du laboratoire.",
        groups: [
            {
                title: "Serveur SMTP",
                description:
                    "Connexion technique fournie par votre hébergeur e-mail.",
                icon: Server,
                fields: ["mail_host", "mail_port", "mail_encryption"],
            },
            {
                title: "Authentification",
                description: "Identifiants utilisés pour l’envoi SMTP.",
                icon: KeyRound,
                fields: ["mail_username", "mail_password"],
            },
            {
                title: "Réception IMAP",
                description:
                    "Serveur utilisé pour synchroniser les dossiers et recevoir les messages.",
                icon: Mail,
                fields: [
                    "imap_host",
                    "imap_port",
                    "imap_encryption",
                    "imap_username",
                    "imap_password",
                    "imap_validate_cert",
                ],
            },
            {
                title: "Identité de l’expéditeur",
                description: "Nom et adresse visibles par les patients.",
                icon: Mail,
                fields: ["mail_from_address", "mail_from_name"],
            },
            {
                title: "Automatisation",
                description:
                    "Contrôlez les notifications envoyées aux patients.",
                icon: BellRing,
                fields: ["send_email"],
                layout: "settings-choice-grid single",
            },
        ],
    },
    colors: {
        description:
            "Construisez une palette cohérente pour l’interface, les états et les messages du laboratoire.",
        groups: [
            {
                title: "Palette de l’interface",
                description: "Couleurs de marque, surfaces et textes.",
                icon: Palette,
                fields: [
                    "primary_color",
                    "secondary_color",
                    "tertiary_color",
                    "neutral_color",
                    "background_color",
                    "font_color",
                ],
                layout: "settings-color-grid",
            },
            {
                title: "Couleurs fonctionnelles",
                description:
                    "États de succès, information, vigilance et erreur.",
                icon: SlidersHorizontal,
                fields: [
                    "success_color",
                    "info_color",
                    "warning_color",
                    "error_color",
                ],
                layout: "settings-color-grid",
            },
        ],
    },
    "patient-portal": {
        description:
            "Contrôlez l’accès en ligne des patients à leurs dossiers et résultats validés.",
        groups: [
            {
                title: "Accès patient en ligne",
                description:
                    "Les patients utilisent l’adresse e-mail enregistrée dans leur fiche et définissent leur mot de passe par e-mail.",
                icon: HeartPulse,
                fields: ["patient_portal_enabled"],
                layout: "settings-choice-grid single",
            },
        ],
    },
};

const fieldEnhancements = {
    laboratory_name: {
        placeholder: "Ex. Laboratoire Tahlila",
        autoComplete: "organization",
        help: "Nom officiel présenté aux patients.",
    },
    managing_director: {
        placeholder: "Nom du responsable",
        autoComplete: "name",
    },
    phone: {
        placeholder: "+212 …",
        autoComplete: "tel",
        inputMode: "tel",
    },
    fax: { placeholder: "+212 …", inputMode: "tel" },
    email: {
        placeholder: "contact@laboratoire.ma",
        autoComplete: "email",
    },
    address: {
        type: "textarea",
        placeholder: "Adresse complète du laboratoire",
        autoComplete: "street-address",
    },
    company_number: { placeholder: "Registre de commerce" },
    tax_id: { placeholder: "Identifiant fiscal" },
    currency: {
        type: "select",
        options: {
            MAD: "MAD — Dirham marocain",
            EUR: "EUR — Euro",
            USD: "USD — Dollar américain",
            GBP: "GBP — Livre sterling",
            CHF: "CHF — Franc suisse",
            CAD: "CAD — Dollar canadien",
        },
        help: "Utilisée dans les tarifs, factures et tableaux de bord.",
    },
    tax: {
        min: 0,
        max: 100,
        help: "Valeur comprise entre 0 et 100 %.",
    },
    mail_host: {
        placeholder: "smtp.example.com",
        autoComplete: "url",
        help: "Nom d’hôte SMTP fourni par votre messagerie.",
    },
    mail_port: {
        type: "number",
        placeholder: "587",
        inputMode: "numeric",
        min: 1,
        max: 65535,
    },
    mail_encryption: {
        type: "select",
        emptyLabel: "Aucun chiffrement",
        options: { tls: "TLS — recommandé", ssl: "SSL" },
    },
    mail_username: {
        autoComplete: "username",
        placeholder: "Compte SMTP",
    },
    mail_password: {
        autoComplete: "new-password",
        placeholder: "Laisser vide pour conserver le mot de passe",
        help: "Le mot de passe actuel n’est jamais renvoyé au navigateur.",
    },
    imap_host: {
        placeholder: "imap.example.com",
        autoComplete: "url",
        help: "Nom d’hôte IMAP fourni par votre messagerie.",
    },
    imap_port: {
        type: "number",
        placeholder: "993",
        inputMode: "numeric",
        min: 1,
        max: 65535,
    },
    imap_encryption: {
        type: "select",
        options: {
            ssl: "SSL — recommandé (port 993)",
            tls: "STARTTLS",
            none: "Aucun — déconseillé",
        },
    },
    imap_username: {
        autoComplete: "username",
        placeholder: "Compte IMAP",
    },
    imap_password: {
        autoComplete: "new-password",
        placeholder: "Laisser vide pour conserver le mot de passe",
        help: "Utilisez un mot de passe d’application si votre fournisseur l’exige.",
    },
    imap_validate_cert: {
        help: "Recommandé : refuse les serveurs dont le certificat TLS n’est pas valide.",
    },
    mail_from_address: {
        type: "email",
        autoComplete: "email",
        placeholder: "resultats@laboratoire.ma",
    },
    mail_from_name: { placeholder: "Nom affiché dans les e-mails" },
    logo: { help: "PNG, JPG ou GIF — 2 Mo maximum." },
    patient_portal_enabled: {
        help: "Lorsqu’il est désactivé, aucune page patient ni donnée médicale n’est accessible depuis le portail.",
    },
};

function enhancedField(field, record) {
    const enhancement = fieldEnhancements[field.name] || {};
    const enhanced = { ...field, ...enhancement };
    if (
        field.name === "currency" &&
        record?.currency &&
        !enhanced.options[record.currency]
    ) {
        enhanced.options = {
            [record.currency]: record.currency,
            ...enhanced.options,
        };
    }
    return enhanced;
}

function ColorField({ field, value, onChange }) {
    const inputId = `setting-${field.name}`;
    const pickerValue = /^#[0-9a-f]{6}/i.test(value || "")
        ? value.slice(0, 7)
        : "#163300";
    return (
        <div className="field color-setting-field">
            <label htmlFor={inputId}>{field.label}</label>
            <div className="color-setting-control">
                <input
                    type="color"
                    value={pickerValue}
                    aria-label={`Sélectionner ${field.label}`}
                    onChange={(event) => onChange(event.target.value)}
                />
                <input
                    id={inputId}
                    name={field.name}
                    value={value || ""}
                    required
                    spellCheck="false"
                    pattern="#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?"
                    onChange={(event) => onChange(event.target.value)}
                />
            </div>
            <small className="field-help">
                Format hexadécimal, ex. #2B7232.
            </small>
            {p.errors[field.name] && (
                <small className="error-text">
                    {p.errors[field.name].join(" ")}
                </small>
            )}
        </div>
    );
}

function PalettePreview({ colors }) {
    return (
        <div
            className="palette-preview"
            style={{
                "--preview-primary": colors.primary_color || "#163300",
                "--preview-secondary": colors.secondary_color || "#b8ed83",
                "--preview-background": colors.background_color || "#f7f8f5",
                "--preview-font": colors.font_color || "#203023",
            }}
        >
            <div className="palette-preview-top">
                <span>TAHLILA</span>
                <i />
            </div>
            <strong>Aperçu de votre interface</strong>
            <p>Une palette lisible et cohérente sur tous les écrans.</p>
            <button type="button">Action principale</button>
        </div>
    );
}

export function SettingsForm() {
    const section = p.screen.replace("setting.", "");
    const config = formConfigs[section];
    const record = p.record || {};
    const fields = Object.fromEntries(
        p.fields.map((field) => [field.name, field]),
    );
    const submitted = p.old?._submitted ? { ...record, ...p.old } : record;
    const [colors, setColors] = useState(() => ({ ...submitted }));

    if (!config) return null;

    return (
        <SettingsShell description={config.description}>
            <Form action={p.action} method={p.method} className="settings-form">
                <div className="settings-sections">
                    {config.groups.map((group) => (
                        <SettingsSection
                            key={group.title}
                            icon={group.icon}
                            title={group.title}
                            description={group.description}
                        >
                            <div
                                className={`settings-fields ${group.layout || ""}`}
                            >
                                {group.fields.map((name) => {
                                    const field = fields[name];
                                    if (!field) return null;
                                    return field.type === "color" ? (
                                        <ColorField
                                            key={name}
                                            field={field}
                                            value={colors[name]}
                                            onChange={(value) =>
                                                setColors((current) => ({
                                                    ...current,
                                                    [name]: value,
                                                }))
                                            }
                                        />
                                    ) : (
                                        <Field
                                            key={name}
                                            field={enhancedField(field, record)}
                                            record={record}
                                        />
                                    );
                                })}
                            </div>
                            {section === "laboratory" &&
                                group.fields.includes("logo") &&
                                record.logo && (
                                    <div className="current-logo">
                                        <img
                                            src={`/storage/${record.logo}`}
                                            alt="Logo actuel du laboratoire"
                                        />
                                        <div>
                                            <strong>
                                                Logo actuellement utilisé
                                            </strong>
                                            <small>
                                                Choisissez un nouveau fichier
                                                uniquement pour le remplacer.
                                            </small>
                                        </div>
                                    </div>
                                )}
                            {section === "colors" &&
                                group.title === "Palette de l’interface" && (
                                    <PalettePreview colors={colors} />
                                )}
                            {section === "patient-portal" && (
                                <div className="portal-settings-summary">
                                    <div>
                                        <span>Patients avec e-mail</span>
                                        <strong>
                                            {p.portalStats.patientsWithEmail}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Comptes synchronisés</span>
                                        <strong>
                                            {p.portalStats.accounts}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Accès initialisés</span>
                                        <strong>
                                            {p.portalStats.activated}
                                        </strong>
                                    </div>
                                    {record.patient_portal_enabled && (
                                        <a
                                            href="/patient/login"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Ouvrir l’espace patient
                                            <ArrowUpRight size={15} />
                                        </a>
                                    )}
                                </div>
                            )}
                        </SettingsSection>
                    ))}
                </div>
                <div className="settings-savebar">
                    <div>
                        <CheckCircle2 size={18} />
                        <span>
                            Vérifiez les informations avant l’enregistrement.
                        </span>
                    </div>
                    <div className="settings-save-actions">
                        {section === "colors" && (
                            <Button
                                type="submit"
                                secondary
                                formAction="/setting/colors/reset"
                                formNoValidate
                                onClick={(event) => {
                                    if (
                                        !window.confirm(
                                            t(
                                                "Restaurer toutes les couleurs par défaut ?",
                                            ),
                                        )
                                    ) {
                                        event.preventDefault();
                                    }
                                }}
                            >
                                <RotateCcw size={16} />
                                {t("Réinitialiser les couleurs")}
                            </Button>
                        )}
                        <Button type="submit">
                            {t("Enregistrer les modifications")}
                            <ArrowRight size={17} />
                        </Button>
                    </div>
                </div>
            </Form>
        </SettingsShell>
    );
}

export function SettingsPage() {
    return (
        <>
            <Heading />
            <section className="settings-overview panel">
                <div>
                    <span className="eyebrow">CENTRE DE CONTRÔLE</span>
                    <h2>Une configuration claire, une équipe plus efficace.</h2>
                    <p>
                        Centralisez l’identité, les paiements, la messagerie et
                        la sécurité de votre laboratoire.
                    </p>
                </div>
                <ShieldCheck size={54} strokeWidth={1.4} />
            </section>
            <div className="settings-grid">
                {settingsItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <a
                            className="panel setting-card"
                            key={item.href}
                            href={item.href}
                        >
                            <span className="round-icon">
                                <Icon />
                            </span>
                            <h2>{t(item.title)}</h2>
                            <p>{item.description}</p>
                            <ArrowUpRight />
                        </a>
                    );
                })}
            </div>
        </>
    );
}

export function Profile() {
    return (
        <SettingsShell description="Gérez les informations de votre compte et protégez votre accès au laboratoire.">
            <div className="settings-sections">
                <SettingsSection
                    icon={UserRound}
                    title="Informations personnelles"
                    description="Identité utilisée dans l’application et les traces d’activité."
                >
                    <Form action="/profile" method="PATCH">
                        <div className="settings-fields">
                            <Field
                                field={{
                                    name: "name",
                                    label: t("Nom"),
                                    required: true,
                                    autoComplete: "name",
                                    placeholder: "Nom complet",
                                }}
                                record={p.user}
                            />
                            <Field
                                field={{
                                    name: "email",
                                    label: t("Adresse e-mail"),
                                    type: "email",
                                    required: true,
                                    autoComplete: "email",
                                    placeholder: "nom@laboratoire.ma",
                                }}
                                record={p.user}
                            />
                        </div>
                        <Button>{t("Enregistrer")}</Button>
                    </Form>
                </SettingsSection>
                <SettingsSection
                    icon={KeyRound}
                    title="Mot de passe"
                    description="Utilisez au moins 12 caractères et évitez les mots de passe réutilisés."
                >
                    <Form action="/password" method="PUT">
                        <div className="settings-fields">
                            {[
                                [
                                    "current_password",
                                    "Mot de passe actuel",
                                    "current-password",
                                ],
                                [
                                    "password",
                                    "Nouveau mot de passe",
                                    "new-password",
                                ],
                                [
                                    "password_confirmation",
                                    "Confirmer le mot de passe",
                                    "new-password",
                                ],
                            ].map(([name, label, autoComplete]) => (
                                <Field
                                    key={name}
                                    field={{
                                        name,
                                        label: t(label),
                                        type: "password",
                                        required: true,
                                        autoComplete,
                                    }}
                                />
                            ))}
                        </div>
                        <Button>{t("Mettre à jour")}</Button>
                    </Form>
                </SettingsSection>
                <SettingsSection
                    icon={Trash2}
                    title="Zone sensible"
                    description="La suppression du compte est définitive et irréversible."
                    tone="danger-zone"
                >
                    <Form
                        action="/profile"
                        method="DELETE"
                        confirm="Supprimer définitivement votre compte ?"
                    >
                        <Field
                            field={{
                                name: "password",
                                label: t("Mot de passe de confirmation"),
                                type: "password",
                                required: true,
                                autoComplete: "current-password",
                            }}
                        />
                        <Button className="danger-button">
                            Supprimer définitivement mon compte
                        </Button>
                    </Form>
                </SettingsSection>
            </div>
        </SettingsShell>
    );
}

export function Languages() {
    const [notice, setNotice] = useState("");
    const [active, setActive] = useState(p.activeLanguage);
    const [query, setQuery] = useState("");
    const languages = p.languages.filter((language) =>
        language.toLowerCase().includes(query.toLowerCase()),
    );
    return (
        <SettingsShell description="Choisissez la langue de travail du laboratoire et adaptez chaque libellé à votre organisation.">
            {notice && (
                <div className="notice" role="status">
                    {notice}
                </div>
            )}
            <SettingsSection
                icon={Globe2}
                title="Langues disponibles"
                description={`${p.languages.length} langues installées · ${active.toUpperCase()} active`}
            >
                <div className="language-toolbar">
                    <div className="search">
                        <Search size={17} />
                        <input
                            type="search"
                            aria-label="Rechercher une langue"
                            placeholder="Rechercher une langue…"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </div>
                </div>
                <div className="language-grid">
                    {languages.map((lang) => (
                        <article
                            className={
                                active === lang
                                    ? "language-card active"
                                    : "language-card"
                            }
                            key={lang}
                        >
                            <span className="language-code">
                                {lang.toUpperCase()}
                            </span>
                            <div>
                                <strong>{lang.toUpperCase()}</strong>
                                <small>
                                    {active === lang
                                        ? "Langue active"
                                        : "Disponible"}
                                </small>
                            </div>
                            {active === lang ? (
                                <span className="language-active">
                                    <Check size={14} /> Active
                                </span>
                            ) : (
                                <button
                                    type="button"
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
                                            setNotice(
                                                `Langue ${lang.toUpperCase()} activée.`,
                                            );
                                        } catch {
                                            setNotice(
                                                "Impossible d’activer cette langue.",
                                            );
                                        }
                                    }}
                                >
                                    Activer
                                </button>
                            )}
                            <a href={`/languages/${lang}/edit`}>
                                {t("Traductions")} <ArrowUpRight size={14} />
                            </a>
                        </article>
                    ))}
                </div>
            </SettingsSection>
        </SettingsShell>
    );
}

export function LanguageEditor() {
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);
    const [query, setQuery] = useState("");
    const entries = Object.entries(p.translations).filter(
        ([key]) => key !== "dir",
    );
    const matches = ([key, value]) =>
        `${key} ${value}`.toLowerCase().includes(query.toLowerCase());
    return (
        <SettingsShell
            description={`Modifiez les textes de l’interface ${p.language.toUpperCase()} sans toucher au code de l’application.`}
        >
            <form
                className="translation-form"
                onSubmit={async (event) => {
                    event.preventDefault();
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
                                body: new FormData(event.currentTarget),
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
                {notice && (
                    <div className="notice" role="status">
                        {notice}
                    </div>
                )}
                <SettingsSection
                    icon={Globe2}
                    title="Comportement de la langue"
                    description="Définissez le sens de lecture de l’interface."
                >
                    <Field
                        field={{
                            name: "dir",
                            label: t("Direction"),
                            type: "select",
                            options: {
                                ltr: t("Gauche à droite"),
                                rtl: t("Droite à gauche"),
                            },
                        }}
                        record={p.translations}
                    />
                </SettingsSection>
                <SettingsSection
                    icon={ClipboardList}
                    title="Dictionnaire de l’interface"
                    description={`${entries.filter(matches).length} résultat(s) sur ${entries.length}`}
                >
                    <div className="language-toolbar">
                        <div className="search">
                            <Search size={17} />
                            <input
                                type="search"
                                aria-label="Rechercher une traduction"
                                placeholder="Rechercher une clé ou une traduction…"
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                            />
                        </div>
                    </div>
                    <div className="translation-list">
                        {entries.map(([key, value]) => (
                            <label
                                className={
                                    matches([key, value])
                                        ? "translation-row"
                                        : "translation-row is-hidden"
                                }
                                key={key}
                            >
                                <span>{key}</span>
                                <input
                                    name={`translations[${key}]`}
                                    defaultValue={value}
                                />
                            </label>
                        ))}
                    </div>
                </SettingsSection>
                <div className="settings-savebar">
                    <a href="/languages" className="button secondary">
                        Retour aux langues
                    </a>
                    <Button disabled={busy}>
                        {busy
                            ? "Enregistrement…"
                            : t("Enregistrer les traductions")}
                    </Button>
                </div>
            </form>
        </SettingsShell>
    );
}

export function SettingsInfo() {
    const update = p.screen === "update";
    return (
        <SettingsShell
            description={
                update
                    ? "Suivez le mode de déploiement et l’entretien de votre installation."
                    : "Consultez les informations relatives à la gestion de votre licence."
            }
        >
            <SettingsSection
                icon={update ? Wrench : ShieldCheck}
                title={
                    update ? "Maintenance administrée" : "Licence administrée"
                }
                description="Ce service est contrôlé par l’administrateur de l’installation."
            >
                <div className="settings-status-card">
                    <span className="settings-status-icon">
                        <CheckCircle2 />
                    </span>
                    <div>
                        <span className="status status-3">
                            <i /> Installation opérationnelle
                        </span>
                        <h3>
                            {update
                                ? "Déploiement manuel sécurisé"
                                : "Gestion centralisée"}
                        </h3>
                        <p>{p.message}</p>
                    </div>
                </div>
                <div className="settings-info-actions">
                    <Button secondary href="/settings">
                        Retour aux paramètres
                    </Button>
                    <a
                        href="mailto:support@tahlila.com"
                        className="text-action"
                    >
                        Contacter l’administrateur <ArrowUpRight size={15} />
                    </a>
                </div>
            </SettingsSection>
        </SettingsShell>
    );
}
