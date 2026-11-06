import { t } from "./i18n";
import { useEffect, useId, useRef, useState } from "react";
import { Eye, EyeOff, FlaskConical, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { p, replacePage, statuses, checked } from "./data";
export function Button({
    children,
    href,
    secondary = false,
    className = "",
    ...props
}) {
    const Tag = href ? "a" : "button";
    return (
        <Tag
            className={`button ${secondary ? "secondary" : ""} ${className}`}
            href={href}
            {...props}
        >
            {children}
        </Tag>
    );
}
export function Form({
    action,
    method = "POST",
    children,
    className = "",
    confirm,
    reload = false,
    ...props
}) {
    const [busy, setBusy] = useState(false);
    const navigate = useNavigate();
    const submit = async (event) => {
        event.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        if (busy) return;

        setBusy(true);
        const form = event.currentTarget;
        const submitter = event.nativeEvent.submitter;
        const submitAction = submitter?.formAction || action;
        const formData = new FormData(form);
        const old = { _submitted: "1" };
        for (const [rawKey, value] of formData.entries()) {
            if (
                rawKey.startsWith("_") ||
                value instanceof File ||
                rawKey === "password" ||
                rawKey === "password_confirmation" ||
                rawKey === "current_password" ||
                rawKey === "mail_password"
            )
                continue;
            const key = rawKey.endsWith("[]") ? rawKey.slice(0, -2) : rawKey;
            if (rawKey.endsWith("[]")) {
                old[key] = [...(old[key] || []), value];
            } else {
                old[key] = value;
            }
        }

        try {
            const response = await fetch(submitAction, {
                method: "POST",
                body: formData,
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            });
            const isJson = response.headers
                .get("content-type")
                ?.includes("application/json");
            const data = isJson ? await response.json() : null;

            if (response.status === 422) {
                replacePage({
                    ...p,
                    errors: data?.errors || {},
                    old,
                    flash: null,
                });
                return;
            }
            if (response.status === 401) {
                navigate("/login", { replace: true });
                return;
            }
            if (!response.ok) {
                replacePage({
                    ...p,
                    flash:
                        data?.message ||
                        "Une erreur est survenue. Veuillez réessayer.",
                });
                return;
            }

            const target = new URL(response.url, window.location.origin);
            if (data?.screen) {
                replacePage(data);
                navigate(target.pathname + target.search, {
                    state: { page: data },
                });
            } else if (response.redirected) {
                navigate(target.pathname + target.search);
            }
        } catch {
            replacePage({
                ...p,
                flash: "Le serveur est momentanément inaccessible.",
            });
        } finally {
            setBusy(false);
        }
    };
    return (
        <form
            action={action}
            method="POST"
            encType="multipart/form-data"
            className={className}
            onSubmit={reload ? undefined : submit}
            {...props}
        >
            <input type="hidden" name="_token" value={p.csrf} />
            <input type="hidden" name="_submitted" value="1" />
            {method !== "POST" && (
                <input type="hidden" name="_method" value={method} />
            )}
            <fieldset aria-busy={busy}>{children}</fieldset>
            {busy && (
                <span role="status" className="saving">
                    Enregistrement…
                </span>
            )}
        </form>
    );
}
export function Field({ field, record = {}, useOld = true }) {
    const fieldId = useId();
    const [showPassword, setShowPassword] = useState(false);
    const {
        name,
        label,
        type = "text",
        required,
        options = {},
        emptyLabel = "S\xE9lectionner\u2026",
        placeholder,
        help,
        autoComplete,
        inputMode,
        min,
        max,
    } = field;
    const value =
        useOld && p.old?._submitted
            ? (p.old[name] ?? "")
            : (record?.[name] ?? "");
    const common = {
        id: fieldId,
        name,
        required,
        placeholder,
        autoComplete,
        inputMode,
        min,
        max,
        "aria-invalid": !!p.errors[name],
        "aria-describedby":
            [help && `${fieldId}-help`, p.errors[name] && `${fieldId}-error`]
                .filter(Boolean)
                .join(" ") || undefined,
    };
    return (
        <div
            className={`field ${type === "textarea" || type === "multiple" ? "wide" : ""}`}
        >
            {type !== "checkbox" && (
                <label htmlFor={common.id}>
                    {t(label)}
                    {required && <span className="required"> *</span>}
                </label>
            )}
            {type === "textarea" ? (
                <textarea {...common} rows="4" defaultValue={value} />
            ) : type === "select" ? (
                <select {...common} defaultValue={value}>
                    <option value="">{t(emptyLabel)}</option>
                    {Object.entries(options).map(([key, label]) => (
                        <option key={key} value={key}>
                            {t(label)}
                        </option>
                    ))}
                </select>
            ) : type === "multiple" ? (
                <div className="choices">
                    {Object.entries(options).map(([key, label]) => (
                        <label key={key}>
                            <input
                                type="checkbox"
                                name={`${name}[]`}
                                value={key}
                                defaultChecked={Array.from(value || [])
                                    .map(String)
                                    .includes(key)}
                            />
                            {t(label)}
                        </label>
                    ))}
                    {!Object.keys(options).length && (
                        <small>Aucun élément dans le catalogue.</small>
                    )}
                </div>
            ) : type === "checkbox" ? (
                <label className="check">
                    <input type="hidden" name={name} value="0" />
                    <input
                        type="checkbox"
                        {...common}
                        value="1"
                        defaultChecked={checked(value)}
                    />
                    {t(label)}
                </label>
            ) : type === "file" ? (
                <input
                    {...common}
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                />
            ) : type === "password" ? (
                <div className="password-input">
                    <input
                        {...common}
                        type={showPassword ? "text" : "password"}
                        defaultValue=""
                    />
                    <button
                        type="button"
                        aria-label={
                            showPassword
                                ? "Masquer le mot de passe"
                                : "Afficher le mot de passe"
                        }
                        title={
                            showPassword
                                ? "Masquer le mot de passe"
                                : "Afficher le mot de passe"
                        }
                        onClick={() => setShowPassword((visible) => !visible)}
                    >
                        {showPassword ? (
                            <EyeOff size={17} />
                        ) : (
                            <Eye size={17} />
                        )}
                    </button>
                </div>
            ) : (
                <input
                    {...common}
                    type={type === "color" ? "text" : type}
                    pattern={
                        type === "color"
                            ? "#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?"
                            : undefined
                    }
                    step={type === "number" ? "any" : undefined}
                    defaultValue={
                        type === "password"
                            ? ""
                            : type === "date"
                              ? String(value).slice(0, 10)
                              : type === "color"
                                ? value || "#163300"
                                : value
                    }
                />
            )}
            {help && (
                <small id={`${fieldId}-help`} className="field-help">
                    {help}
                </small>
            )}
            {p.errors[name] && (
                <small id={`${fieldId}-error`} className="error-text">
                    {p.errors[name].join(" ")}
                </small>
            )}
        </div>
    );
}
export function Status({ value }) {
    return (
        <span className={`status status-${value}`}>
            <i />
            {t(statuses[value] || value)}
        </span>
    );
}
export function Empty({ title = "Aucun élément pour le moment.", children }) {
    return (
        <div className="empty">
            <FlaskConical size={32} />
            <h3>{title}</h3>
            <p>{children || "Les éléments enregistrés apparaîtront ici."}</p>
        </div>
    );
}
export function Pagination({ rows }) {
    return (
        rows?.last_page > 1 && (
            <div className="pagination">
                <span>
                    {rows.from}–{rows.to} sur {rows.total}
                </span>
                <div>
                    {rows.prev_page_url && (
                        <a href={rows.prev_page_url}>← Précédent</a>
                    )}
                    <span>
                        {rows.current_page} / {rows.last_page}
                    </span>
                    {rows.next_page_url && (
                        <a href={rows.next_page_url}>Suivant →</a>
                    )}
                </div>
            </div>
        )
    );
}
export function Filters({ status = false }) {
    const navigate = useNavigate();
    const params = new URLSearchParams(window.location.search);
    const [query, setQuery] = useState(params.get("q") || "");
    const [statusValue, setStatusValue] = useState(params.get("status") || "");
    const firstRender = useRef(true);
    const destination = () => {
        const next = new URLSearchParams();
        if (query.trim()) next.set("q", query.trim());
        if (status && statusValue) next.set("status", statusValue);
        return (
            window.location.pathname + (next.size ? `?${next.toString()}` : "")
        );
    };

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const timer = window.setTimeout(() => {
            const target = destination();
            const current = window.location.pathname + window.location.search;
            if (target !== current) navigate(target, { replace: true });
        }, 350);
        return () => window.clearTimeout(timer);
    }, [query, statusValue, status, navigate]);

    return (
        <form
            method="GET"
            className="filters"
            onSubmit={(event) => {
                event.preventDefault();
                navigate(destination());
            }}
        >
            <div className="search">
                <Search size={18} />
                <input
                    aria-label={t("Rechercher")}
                    name="q"
                    type="search"
                    placeholder="Rechercher un nom, une référence…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />
            </div>
            {status && (
                <select
                    aria-label={t("Statut")}
                    name="status"
                    value={statusValue}
                    onChange={(event) => setStatusValue(event.target.value)}
                >
                    <option value="">{t("Tous les statuts")}</option>
                    {Object.entries(statuses).map(([key, value]) => (
                        <option value={key} key={key}>
                            {value}
                        </option>
                    ))}
                </select>
            )}
            <Button secondary type="submit">
                {t("Rechercher")}
            </Button>
            {window.location.search && (
                <a href={window.location.pathname}>{t("R\xE9initialiser")}</a>
            )}
        </form>
    );
}
export function Delete({
    action,
    label = "Supprimer cet élément ? Cette action est définitive.",
}) {
    return (
        <Form action={action} method="DELETE" confirm={t(label)}>
            <button
                className="icon-button danger"
                aria-label={t("Supprimer")}
                title={t("Supprimer")}
            >
                <Trash2 size={16} />
            </button>
        </Form>
    );
}
export function Heading({ children }) {
    return (
        <div className="heading">
            <div>
                <h1>{t(p.title)}</h1>
                <p>
                    {t(
                        "Tout ce qu\u2019il faut pour avancer, en toute clart\xE9.",
                    )}
                </p>
            </div>
            {children}
        </div>
    );
}
