import { t } from "./i18n";
import { useEffect, useId, useRef, useState } from "react";
import {
    AlertTriangle,
    Eye,
    EyeOff,
    FlaskConical,
    Search,
    Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    csrfFetch,
    p,
    refreshCsrfToken,
    replacePage,
    statuses,
    checked,
} from "./data";
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
    formRef,
    ...props
}) {
    const [busy, setBusy] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const internalFormRef = useRef(null);
    const confirmationPending = useRef(false);
    const confirmTitleId = useId();
    const resolvedFormRef = formRef || internalFormRef;
    const navigate = useNavigate();
    const submit = async (event) => {
        event.preventDefault();
        if (confirm && !confirmationPending.current) {
            setConfirmOpen(true);
            return;
        }
        confirmationPending.current = false;
        if (busy) return;

        setBusy(true);
        const form = event.currentTarget;
        const submitter = event.nativeEvent.submitter;
        // `formAction` is browser-resolved and can point to the current page
        // even when the button has no explicit `formaction`. Only honor an
        // actual override; otherwise keep the action supplied by Laravel.
        const submitAction = submitter?.getAttribute("formaction") || action;

        // Let the browser submit multipart forms natively. This preserves the
        // selected File object through Laravel's upload parser and avoids
        // browser-specific fetch/FormData handling for file inputs.
        const hasSelectedFile = Array.from(
            form.querySelectorAll('input[type="file"]'),
        ).some((input) => input.files?.length);
        if (hasSelectedFile) {
            await refreshCsrfToken();
            form.action = submitAction;
            window.HTMLFormElement.prototype.submit.call(form);
            return;
        }

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
            const response = await csrfFetch(submitAction, {
                method: "POST",
                body: formData,
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            });
            if (reload && response.ok) {
                window.location.assign(response.url);
                return;
            }
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
                let redirectedPage = null;
                if (
                    response.headers.get("content-type")?.includes("text/html")
                ) {
                    const html = await response.text();
                    const document = new DOMParser().parseFromString(
                        html,
                        "text/html",
                    );
                    const dataElement = document.getElementById("lims-data");
                    if (dataElement?.textContent) {
                        try {
                            redirectedPage = JSON.parse(
                                dataElement.textContent,
                            );
                        } catch {
                            redirectedPage = null;
                        }
                    }
                }
                navigate(target.pathname + target.search, {
                    state: redirectedPage ? { page: redirectedPage } : null,
                });
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
            ref={resolvedFormRef}
            className={className}
            onSubmit={submit}
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
            {confirm && confirmOpen && (
                <ConfirmDialog
                    title={t("Confirmer cette suppression")}
                    message={confirm}
                    titleId={confirmTitleId}
                    onCancel={() => setConfirmOpen(false)}
                    onConfirm={() => {
                        confirmationPending.current = true;
                        setConfirmOpen(false);
                        resolvedFormRef.current?.requestSubmit();
                    }}
                />
            )}
        </form>
    );
}

function ConfirmDialog({ title, message, titleId, onCancel, onConfirm }) {
    return (
        <div className="confirm-backdrop" role="presentation">
            <section
                className="confirm-dialog confirm-dialog-danger"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <div className="confirm-dialog-icon">
                    <AlertTriangle size={22} />
                </div>
                <div>
                    <h2 id={titleId}>{title}</h2>
                    <p>{message}</p>
                </div>
                <div className="confirm-dialog-actions">
                    <Button type="button" secondary onClick={onCancel}>
                        {t("Annuler")}
                    </Button>
                    <Button
                        type="button"
                        className="danger-button"
                        onClick={onConfirm}
                    >
                        <Trash2 size={16} />
                        {t("Supprimer")}
                    </Button>
                </div>
            </section>
        </div>
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
        onChange,
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
        onChange,
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
            {type !== "checkbox" && type !== "file" && (
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
                <FileField common={common} record={record} />
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

function FileField({ common, record }) {
    const inputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const currentLogoUrl =
        record?.logo_url || (record?.logo ? `/storage/${record.logo}` : null);

    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl(null);
            return undefined;
        }

        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [selectedFile]);

    const clearSelection = () => {
        setSelectedFile(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className="file-field">
            <input
                {...common}
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif"
                className="file-field-input"
                onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] || null)
                }
            />
            <label className="file-dropzone" htmlFor={common.id}>
                <span className="file-preview">
                    {(previewUrl || currentLogoUrl) && (
                        <img
                            src={previewUrl || currentLogoUrl}
                            alt={
                                selectedFile?.name ||
                                record?.laboratory_name ||
                                "Logo du laboratoire"
                            }
                        />
                    )}
                </span>
                <span className="file-dropzone-copy">
                    <strong>
                        {selectedFile
                            ? "Nouveau logo sélectionné"
                            : currentLogoUrl
                              ? "Remplacer le logo actuel"
                              : "Ajouter le logo du laboratoire"}
                    </strong>
                    <small>
                        {selectedFile?.name ||
                            "PNG, JPG ou GIF · 2 Mo maximum · format carré recommandé"}
                    </small>
                </span>
                <span className="file-dropzone-action">Parcourir</span>
            </label>
            {selectedFile && (
                <button
                    type="button"
                    className="file-clear-button"
                    onClick={clearSelection}
                >
                    Retirer la sélection
                </button>
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
