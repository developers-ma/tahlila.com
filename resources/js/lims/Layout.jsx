import { t } from "./i18n";
import { useState } from "react";
import {
    FlaskConical,
    LogOut,
    Mail,
    Menu,
    Plus,
    Settings,
    ShieldCheck,
    X,
} from "lucide-react";
import { p, navigationSections } from "./data";
import { Form } from "./components";
export function Layout({ children }) {
    const [open, setOpen] = useState(false);
    const isActive = (href) =>
        p.path === href ||
        p.path.startsWith(`${href}/`) ||
        (href === "/dashboard" && p.path === "/");
    return (
        <div className="app">
            <a className="skip" href="#content">
                Aller au contenu
            </a>
            {open && (
                <button
                    className="scrim"
                    aria-label="Fermer le menu"
                    onClick={() => setOpen(false)}
                />
            )}
            <aside className={open ? "sidebar open" : "sidebar"}>
                <a href="/dashboard" className="brand">
                    <FlaskConical size={28} />
                    <b>
                        tahlila<span>lab workspace</span>
                    </b>
                </a>
                <button
                    className="mobile-close icon-button"
                    onClick={() => setOpen(false)}
                    aria-label="Fermer le menu"
                >
                    <X />
                </button>
                <a className="new-order-link" href="/new-test">
                    <span className="new-order-icon">
                        <Plus size={17} />
                    </span>
                    <span>{t("Nouvelle analyse")}</span>
                </a>
                <nav aria-label="Navigation principale">
                    {navigationSections.map((section) => (
                        <div className="nav-section" key={section.label}>
                            <span className="nav-section-label">
                                {t(section.label)}
                            </span>
                            {section.items.map(([label, href, Icon]) => (
                                <a
                                    key={href}
                                    href={href}
                                    aria-current={
                                        isActive(href) ? "page" : undefined
                                    }
                                    className={isActive(href) ? "active" : ""}
                                >
                                    <Icon size={18} strokeWidth={1.8} />
                                    <span>{t(label)}</span>
                                </a>
                            ))}
                        </div>
                    ))}
                </nav>
                <div className="sidebar-bottom">
                    <a
                        href="/email"
                        className={isActive("/email") ? "active" : ""}
                    >
                        <Mail size={18} strokeWidth={1.8} />
                        {t("Messagerie")}
                    </a>
                    <a href="/settings">
                        <Settings size={18} strokeWidth={1.8} />
                        {t("Param\xE8tres")}
                    </a>
                    <a href="/profile" className="sidebar-user">
                        <span className="sidebar-avatar">
                            {p.user?.name?.slice(0, 2).toUpperCase()}
                        </span>
                        <span>
                            <strong>{p.user?.name}</strong>
                            <small>{p.user?.email}</small>
                        </span>
                    </a>
                    <Form action="/logout">
                        <button>
                            <LogOut size={18} />
                            {t("D\xE9connexion")}
                        </button>
                    </Form>
                </div>
            </aside>
            <div className="workspace-main">
                <header className="topbar">
                    <button
                        className="mobile-menu icon-button"
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                        aria-label="Ouvrir le menu"
                    >
                        <Menu />
                    </button>
                    <span className="breadcrumb">
                        {t("Espace laboratoire")}
                        <span>/</span> <b>{t(p.title)}</b>
                    </span>
                    <div className="header-right">
                        <span className="secure">
                            <ShieldCheck size={16} />
                            {t("Espace s\xE9curis\xE9")}
                        </span>
                        <a
                            className="avatar"
                            href="/profile"
                            title={t("Mon compte")}
                        >
                            {p.user?.name?.slice(0, 2).toUpperCase()}
                        </a>
                    </div>
                </header>
                <main id="content">
                    <div className="messages">
                        {p.flash && (
                            <div className="notice" role="status">
                                {p.flash}
                            </div>
                        )}
                        {Object.keys(p.errors).length > 0 && (
                            <div className="notice error" role="alert">
                                <strong>
                                    Vérifiez les informations saisies.
                                </strong>
                                {Object.entries(p.errors).map(
                                    ([key, errors]) => (
                                        <div key={key}>{errors.join(" ")}</div>
                                    ),
                                )}
                            </div>
                        )}
                    </div>
                    {children}
                    <footer>
                        TAHLILA{" "}
                        <span>
                            {t(
                                "Un laboratoire organis\xE9. Des soins qui avancent.",
                            )}
                        </span>
                    </footer>
                </main>
            </div>
        </div>
    );
}
