import { t } from "./i18n";
import { useEffect, useState } from "react";
import {
    ChevronRight,
    Bell,
    FlaskConical,
    LogOut,
    Menu,
    Plus,
    Settings,
    X,
} from "lucide-react";
import { can, p, navigationSections } from "./data";
import { Form } from "./components";
export function Layout({ children }) {
    const [open, setOpen] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [unreadChatCount, setUnreadChatCount] = useState(
        p.unreadChatCount || 0,
    );
    useEffect(() => {
        if (!can("chat.use")) return undefined;
        const refresh = async () => {
            try {
                const response = await fetch("/api/chat/unread", {
                    credentials: "same-origin",
                    headers: { Accept: "application/json" },
                });
                if (response.ok) {
                    const data = await response.json();
                    setUnreadChatCount(data.count || 0);
                }
            } catch {
                // The next polling cycle retries silently.
            }
        };
        const interval = window.setInterval(refresh, 15000);
        return () => window.clearInterval(interval);
    }, []);
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
                <nav aria-label="Navigation principale">
                    {visibleSections.map((section) => (
                        <div
                            className={`nav-section ${section.hideLabel ? "nav-section-no-label" : ""}`}
                            key={section.label}
                        >
                            {!section.hideLabel && (
                                <span className="nav-section-label">
                                    {t(section.label)}
                                </span>
                            )}
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
                    {can("settings.manage") && (
                        <a href="/settings">
                            <Settings size={18} strokeWidth={1.8} />
                            {t("Param\xE8tres")}
                        </a>
                    )}
                    <a href="/profile" className="sidebar-user">
                        <span className="sidebar-avatar">
                            {p.user?.avatarUrl ? (
                                <img src={p.user.avatarUrl} alt="" />
                            ) : (
                                p.user?.name?.slice(0, 2).toUpperCase()
                            )}
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
                    <a className="mobile-topbar-brand" href="/dashboard" aria-label="Tahlila">
                        <FlaskConical size={22} />
                        <strong>tahlila</strong>
                    </a>
                    <div className="header-right">
                        {can("orders.manage") && (
                            <a className="topbar-new-order" href="/new-test">
                                <span className="topbar-new-order-icon">
                                    <Plus size={16} />
                                </span>
                                <span>{t("Nouvelle analyse")}</span>
                            </a>
                        )}
                        {can("chat.use") && (
                            <a
                                className="notification-button"
                                href="/chat"
                                title={t("Notifications")}
                                aria-label={`${t("Notifications")} : ${unreadChatCount}`}
                            >
                                <Bell size={19} />
                                {unreadChatCount > 0 && (
                                    <span>{Math.min(unreadChatCount, 99)}</span>
                                )}
                            </a>
                        )}
                        <a
                            className="avatar"
                            href="/profile"
                            title={t("Mon compte")}
                        >
                            {p.user?.avatarUrl ? (
                                <img src={p.user.avatarUrl} alt="" />
                            ) : (
                                p.user?.name?.slice(0, 2).toUpperCase()
                            )}
                        </a>
                    </div>
                </header>
                <main id="content">
                    <div className="messages">
                        {p.flash && (
                            <div
                                className="notice"
                                role="status"
                                aria-live="polite"
                            >
                                {p.flash}
                            </div>
                        )}
                        {Object.keys(p.errors).length > 0 && (
                            <div
                                className="notice error"
                                role="alert"
                                aria-live="assertive"
                            >
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
                        <span className="footer-product">
                            TAHLILA{" "}
                            <span>
                                {t(
                                    "Un laboratoire organis\xE9. Des soins qui avancent.",
                                )}
                            </span>
                        </span>
                        <span className="footer-copyright">
                            Copyright © Tahlila By{" "}
                            <a
                                href="https://developer.ma"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Developer.ma"
                            >
                                <img
                                    src="/images/developer-community.svg"
                                    alt="Developer.ma"
                                />
                            </a>
                        </span>
                    </footer>
                </main>
            </div>
        </div>
    );
}
