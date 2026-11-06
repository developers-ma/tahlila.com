import { t } from "./i18n";
import { useState } from "react";
import {
    ChevronRight,
    FlaskConical,
    LogOut,
    Mail,
    Menu,
    Plus,
    Settings,
    ShieldCheck,
    X,
} from "lucide-react";
import { can, p, navigationSections } from "./data";
import { Form } from "./components";
export function Layout({ children }) {
    const [open, setOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});
    const visibleSections = navigationSections
        .map((section) => ({
            ...section,
            items: section.items
                .filter((item) => can(item.permission))
                .map((item) => ({
                    ...item,
                    children: item.children?.filter((child) =>
                        can(child.permission),
                    ),
                })),
        }))
        .filter((section) => section.items.length);
    const isActive = (href) =>
        p.path === href ||
        p.path.startsWith(`${href}/`) ||
        (href === "/dashboard" && p.path === "/");
    const isBranchActive = (item) =>
        isActive(item.href) ||
        item.children?.some((child) => isActive(child.href));
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
                {can("orders.manage") && (
                    <a className="new-order-link" href="/new-test">
                        <span className="new-order-icon">
                            <Plus size={17} />
                        </span>
                        <span>{t("Nouvelle analyse")}</span>
                    </a>
                )}
                <nav aria-label="Navigation principale">
                    {visibleSections.map((section) => (
                        <div className="nav-section" key={section.label}>
                            <span className="nav-section-label">
                                {t(section.label)}
                            </span>
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                if (!item.children) {
                                    return (
                                        <a
                                            key={item.href}
                                            href={item.href}
                                            aria-current={
                                                isActive(item.href)
                                                    ? "page"
                                                    : undefined
                                            }
                                            className={
                                                isActive(item.href)
                                                    ? "active"
                                                    : ""
                                            }
                                        >
                                            <Icon size={18} strokeWidth={1.8} />
                                            <span>{t(item.label)}</span>
                                        </a>
                                    );
                                }
                                const branchActive = isBranchActive(item);
                                const groupOpen =
                                    branchActive ||
                                    expandedGroups[item.href] === true;
                                return (
                                    <div className="nav-group" key={item.href}>
                                        <button
                                            type="button"
                                            className={`nav-parent ${branchActive ? "branch-active" : ""} ${groupOpen ? "open" : ""}`.trim()}
                                            aria-expanded={groupOpen}
                                            aria-controls={`nav-sublist-${item.href.replace(/\W/g, "")}`}
                                            onClick={() =>
                                                setExpandedGroups(
                                                    (current) => ({
                                                        ...current,
                                                        [item.href]: !groupOpen,
                                                    }),
                                                )
                                            }
                                        >
                                            <Icon size={18} strokeWidth={1.8} />
                                            <span>{t(item.label)}</span>
                                            <ChevronRight
                                                className="nav-chevron"
                                                size={15}
                                                strokeWidth={2}
                                            />
                                        </button>
                                        {groupOpen && (
                                            <div
                                                className="nav-sublist"
                                                id={`nav-sublist-${item.href.replace(/\W/g, "")}`}
                                            >
                                                {item.children.map((child) => {
                                                    const ChildIcon =
                                                        child.icon;
                                                    return (
                                                        <a
                                                            key={child.href}
                                                            href={child.href}
                                                            aria-current={
                                                                isActive(
                                                                    child.href,
                                                                )
                                                                    ? "page"
                                                                    : undefined
                                                            }
                                                            className={
                                                                isActive(
                                                                    child.href,
                                                                )
                                                                    ? "active"
                                                                    : ""
                                                            }
                                                        >
                                                            <ChildIcon
                                                                size={15}
                                                                strokeWidth={
                                                                    1.8
                                                                }
                                                            />
                                                            <span>
                                                                {t(child.label)}
                                                            </span>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </nav>
                <div className="sidebar-bottom">
                    {can("email.send") && (
                        <a
                            href="/email"
                            className={isActive("/email") ? "active" : ""}
                        >
                            <Mail size={18} strokeWidth={1.8} />
                            {t("Messagerie")}
                        </a>
                    )}
                    {can("settings.manage") && (
                        <a href="/settings">
                            <Settings size={18} strokeWidth={1.8} />
                            {t("Param\xE8tres")}
                        </a>
                    )}
                    <a href="/profile" className="sidebar-user">
                        <span className="sidebar-avatar">
                            {p.user?.name?.slice(0, 2).toUpperCase()}
                        </span>
                        <span>
                            <strong>{p.user?.name}</strong>
                            <small>{p.user?.role || p.user?.email}</small>
                        </span>
                    </a>
                    <Form action="/logout" reload className="logout-form">
                        <button type="submit">
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
