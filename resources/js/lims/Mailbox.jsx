import { useEffect, useMemo, useState } from "react";
import {
    Archive,
    ArrowLeft,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CornerUpLeft,
    Forward,
    Inbox,
    Image as ImageIcon,
    LoaderCircle,
    Mail,
    MailOpen,
    Paperclip,
    PenLine,
    RefreshCw,
    Search,
    Send,
    Settings,
    ShieldCheck,
    Star,
    Trash2,
    X,
} from "lucide-react";
import { p } from "./data";
import { Button, Form, Heading } from "./components";
import { t } from "./i18n";
import "./mailbox.css";
import { EmailSetupWizard } from "./EmailSetupWizard";

const folderIcons = {
    inbox: Inbox,
    sent: Send,
    drafts: PenLine,
    archive: Archive,
    trash: Trash2,
    spam: ShieldCheck,
    folder: Archive,
};

const emptyDraft = {
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    message: "",
    quote: "",
    reply_message_id: "",
};

const query = (values) => {
    const params = new URLSearchParams(
        Object.entries(values).filter(
            ([, value]) => value !== undefined && value !== "",
        ),
    );
    return `/email?${params}`;
};

const addressText = (addresses = []) =>
    addresses
        .map(({ name, email }) => (name ? `${name} <${email}>` : email))
        .join(", ");

const folderNames = {
    inbox: "Boîte de réception",
    sent: "Messages envoyés",
    drafts: "Brouillons",
    archive: "Archives",
    trash: "Corbeille",
    spam: "Courrier indésirable",
};

const folderLabel = (item) =>
    folderNames[item.type]
        ? t(folderNames[item.type])
        : item.name
              .replace(/^INBOX[./]/i, "")
              .replace(/[._-]+/g, " ")
              .trim();

const prepareEmailHtml = (html, allowRemoteImages) => {
    if (!html || typeof DOMParser === "undefined") {
        return { html: html || "", remoteImages: 0 };
    }
    const document = new DOMParser().parseFromString(html, "text/html");
    let remoteImages = 0;
    document.querySelectorAll("img[src]").forEach((image) => {
        const source = image.getAttribute("src") || "";
        if (/^(https?:)?\/\//i.test(source)) {
            remoteImages += 1;
            if (!allowRemoteImages) {
                image.removeAttribute("src");
                image.setAttribute("data-blocked-src", source);
                image.setAttribute("aria-hidden", "true");
            }
        }
    });
    return { html: document.body.innerHTML, remoteImages };
};

export function Mailbox() {
    const mailbox = p.mailbox || {};
    const folder = mailbox.folder || "INBOX";
    const currentSearch = new URLSearchParams(location.search).get("q") || "";
    const currentPage = mailbox.messages?.page || 1;
    const lastPage = mailbox.messages?.lastPage || 1;
    const [selected, setSelected] = useState(mailbox.selected || null);
    const [loadingUid, setLoadingUid] = useState(null);
    const [readerError, setReaderError] = useState("");
    const [showRemoteImages, setShowRemoteImages] = useState(false);
    const [compose, setCompose] = useState(false);
    const [draft, setDraft] = useState(emptyDraft);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [showCopies, setShowCopies] = useState(false);
    const [setupOpen, setSetupOpen] = useState(false);
    const [composeMode, setComposeMode] = useState("new");
    const [sentToast, setSentToast] = useState(false);
    const draftStorageKey = `tahlila:mail-draft:${p.mailAccount?.email || "default"}`;

    useEffect(() => {
        setSelected(mailbox.selected || null);
    }, [mailbox.selected?.uid, folder]);

    useEffect(() => {
        if (!compose || composeMode !== "new") return;
        const timer = window.setTimeout(() => {
            const savedDraft = {
                to: draft.to,
                cc: draft.cc,
                bcc: draft.bcc,
                subject: draft.subject,
                message: draft.message,
            };
            const hasContent = Object.values(savedDraft).some((value) => value.trim());
            if (hasContent) localStorage.setItem(draftStorageKey, JSON.stringify(savedDraft));
            else localStorage.removeItem(draftStorageKey);
        }, 350);
        return () => window.clearTimeout(timer);
    }, [compose, composeMode, draft, draftStorageKey]);

    useEffect(() => {
        if (p.flash?.toLowerCase?.().includes("message envoyé")) {
            localStorage.removeItem(draftStorageKey);
            setCompose(false);
            setSentToast(true);
        }
    }, [p.flash, draftStorageKey]);

    useEffect(() => {
        if (!sentToast) return;
        const timer = window.setTimeout(() => setSentToast(false), 4200);
        return () => window.clearTimeout(timer);
    }, [sentToast]);

    const preparedHtml = useMemo(
        () => prepareEmailHtml(selected?.html, showRemoteImages),
        [selected?.html, showRemoteImages],
    );

    const openComposer = (values = {}, mode = "new") => {
        let restored = {};
        if (mode === "new") {
            try {
                restored = JSON.parse(localStorage.getItem(draftStorageKey)) || {};
            } catch {
                localStorage.removeItem(draftStorageKey);
            }
        }
        const nextDraft = { ...emptyDraft, ...restored, ...values };
        setDraft(nextDraft);
        setAttachedFiles([]);
        setShowCopies(Boolean(nextDraft.cc || nextDraft.bcc));
        setComposeMode(mode);
        setCompose(true);
    };

    const discardDraft = () => {
        if (composeMode === "new") localStorage.removeItem(draftStorageKey);
        setDraft(emptyDraft);
        setAttachedFiles([]);
        setCompose(false);
    };

    const messageSent = () => {
        localStorage.removeItem(draftStorageKey);
        setDraft(emptyDraft);
        setAttachedFiles([]);
        setCompose(false);
        setSentToast(true);
    };

    const openMessage = async (event, message) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (loadingUid || selected?.uid === message.uid) return;
        setLoadingUid(message.uid);
        setReaderError("");
        setShowRemoteImages(false);
        try {
            const response = await fetch(
                `/email/messages/${message.uid}?${new URLSearchParams({ folder })}`,
                { headers: { Accept: "application/json" } },
            );
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.message);
            setSelected(payload.message);
            window.history.replaceState(
                {},
                "",
                query({ folder, uid: message.uid }),
            );
        } catch (error) {
            setReaderError(error.message || t("Lecture du message impossible."));
        } finally {
            setLoadingUid(null);
        }
    };

    if (!p.mailConfigured) {
        return (
            <>
                <Heading>
                    <Button secondary type="button" onClick={() => setSetupOpen(true)}>
                        <Settings size={17} />
                        {t("Configuration")}
                    </Button>
                </Heading>
                <section className="mail-setup panel">
                    <div className="mail-setup-copy">
                        <span className="mail-setup-icon">
                            <Mail size={34} />
                        </span>
                        <span className="eyebrow">
                            {t("PREMIÈRE CONFIGURATION")}
                        </span>
                        <h2>{t("Connecter la messagerie")}</h2>
                        <p>
                            {t(
                                "Configurez SMTP pour envoyer et IMAP pour recevoir, lire et organiser les messages depuis Tahlila.",
                            )}
                        </p>
                        <Button type="button" onClick={() => setSetupOpen(true)}>
                            <Settings size={17} />
                            {t("Configurer la messagerie")}
                        </Button>
                    </div>
                    <div className="mail-protocols">
                        <div>
                            <span className="mail-protocol-icon">
                                <Send size={20} />
                            </span>
                            <div>
                                <strong>SMTP</strong>
                                <span>{t("Envoi sécurisé")}</span>
                            </div>
                        </div>
                        <div>
                            <span className="mail-protocol-icon">
                                <Inbox size={20} />
                            </span>
                            <div>
                                <strong>IMAP</strong>
                                <span>{t("Réception synchronisée")}</span>
                            </div>
                        </div>
                        <div>
                            <span className="mail-protocol-icon">
                                <Paperclip size={20} />
                            </span>
                            <div>
                                <strong>{t("Fichiers")}</strong>
                                <span>{t("Pièces jointes")}</span>
                            </div>
                        </div>
                    </div>
                </section>
                {setupOpen && (
                    <EmailSetupWizard
                        modal
                        onClose={() => setSetupOpen(false)}
                        onManual={() => {
                            setSetupOpen(false);
                            window.location.href = "/setting/email?manual=1";
                        }}
                    />
                )}
            </>
        );
    }

    const reply = () =>
        openComposer({
            to: addressText(selected?.replyTo || selected?.from),
            subject: selected?.subject?.startsWith("Re:")
                ? selected.subject
                : `Re: ${selected?.subject || ""}`,
            quote: selected?.text || "",
            reply_message_id: selected?.messageId || "",
        }, "reply");
    const forward = () =>
        openComposer({
            subject: selected?.subject?.startsWith("Fwd:")
                ? selected.subject
                : `Fwd: ${selected?.subject || ""}`,
            quote: `${t("De")} : ${addressText(selected?.from)}\n${t("Objet")} : ${selected?.subject || ""}\n\n${selected?.text || ""}`,
        }, "forward");

    return (
        <>
            <Heading>
                <div className="mail-heading-actions">
                    <Button
                        secondary
                        href={query({ folder })}
                        title={t("Actualiser")}
                    >
                        <RefreshCw size={17} />
                    </Button>
                    <Button
                        secondary
                        href="/setting/email"
                        title={t("Configuration")}
                    >
                        <Settings size={17} />
                    </Button>
                </div>
            </Heading>
            <section className="mailbox-shell panel">
                <aside className="mail-folders">
                    <Button type="button" onClick={() => openComposer()}>
                        <PenLine size={17} />
                        {t("Nouveau message")}
                    </Button>
                    <div className="mail-account">
                        <span>
                            {(p.mailAccount?.name || "LA")
                                .slice(0, 2)
                                .toUpperCase()}
                        </span>
                        <div>
                            <strong>{p.mailAccount?.name}</strong>
                            <small>{p.mailAccount?.email}</small>
                        </div>
                    </div>
                    <nav>
                        {(mailbox.folders || []).map((item) => {
                            const Icon = folderIcons[item.type] || Archive;
                            return (
                                <a
                                    key={item.id}
                                    href={query({ folder: item.id })}
                                    className={
                                        item.id === folder ? "active" : ""
                                    }
                                >
                                    <Icon size={17} />
                                    <span>{folderLabel(item)}</span>
                                </a>
                            );
                        })}
                    </nav>
                </aside>

                <div className="mail-list">
                    <form className="mail-search" action="/email" method="get">
                        <Search size={17} />
                        <input
                            type="search"
                            name="q"
                            defaultValue={
                                currentSearch
                            }
                            placeholder={t("Rechercher dans les messages")}
                        />
                        <input type="hidden" name="folder" value={folder} />
                    </form>
                    <div className="mail-list-meta">
                        <strong>{t("Messages")}</strong>
                        <span>{mailbox.messages?.total || 0}</span>
                    </div>
                    {p.mailboxError ? (
                        <div className="mail-error">
                            <strong>{t("Synchronisation impossible")}</strong>
                            <p>{p.mailboxError}</p>
                            <Button secondary href="/setting/email">
                                <Settings size={16} />
                                {t("Vérifier la configuration")}
                            </Button>
                        </div>
                    ) : (mailbox.messages?.data || []).length ? (
                        <>
                            <div className="mail-items">
                                {mailbox.messages.data.map((message) => (
                                <a
                                    key={message.uid}
                                    href={query({ folder, uid: message.uid })}
                                    onClick={(event) => openMessage(event, message)}
                                    className={`${message.seen ? "" : "unread"} ${selected?.uid === message.uid ? "selected" : ""} ${loadingUid === message.uid ? "loading" : ""}`}
                                >
                                    <span className="mail-item-star">
                                        {loadingUid === message.uid ? <LoaderCircle className="mail-spin" size={15} /> : <Star
                                            size={15}
                                            fill={
                                                message.flagged
                                                    ? "currentColor"
                                                    : "none"
                                            }
                                        />}
                                    </span>
                                    <div>
                                        <strong>
                                            {message.from || message.to}
                                        </strong>
                                        <b>{message.subject}</b>
                                    </div>
                                    <time>
                                        {message.date
                                            ? new Date(
                                                  message.date,
                                              ).toLocaleDateString(
                                                  p.locale || "fr",
                                                  {
                                                      day: "2-digit",
                                                      month: "short",
                                                  },
                                              )
                                            : ""}
                                    </time>
                                </a>
                                ))}
                            </div>
                            {lastPage > 1 && (
                                <nav className="mail-pagination" aria-label={t("Pagination des messages")}>
                                    {currentPage > 1 ? (
                                        <a href={query({ folder, q: currentSearch, page: currentPage - 1 })} aria-label={t("Page précédente")}>
                                            <ChevronLeft size={16} />
                                            <span>{t("Précédent")}</span>
                                        </a>
                                    ) : <span className="disabled"><ChevronLeft size={16} />{t("Précédent")}</span>}
                                    <strong>{t("Page {current} sur {total}").replace("{current}", currentPage).replace("{total}", lastPage)}</strong>
                                    {currentPage < lastPage ? (
                                        <a href={query({ folder, q: currentSearch, page: currentPage + 1 })} aria-label={t("Page suivante")}>
                                            <span>{t("Suivant")}</span>
                                            <ChevronRight size={16} />
                                        </a>
                                    ) : <span className="disabled">{t("Suivant")}<ChevronRight size={16} /></span>}
                                </nav>
                            )}
                        </>
                    ) : (
                        <div className="mail-empty">
                            <MailOpen size={30} />
                            <strong>{t("Aucun message")}</strong>
                            <span>{t("Ce dossier est vide.")}</span>
                        </div>
                    )}
                </div>

                <article className="mail-reader">
                    {readerError && <div className="mail-reader-error">{readerError}</div>}
                    {selected ? (
                        <>
                            <header>
                                <a
                                    className="mail-back"
                                    href={query({ folder })}
                                >
                                    <ArrowLeft size={18} />
                                </a>
                                <div className="mail-reader-actions">
                                    <Form
                                        action={`/email/messages/${selected.uid}/flag`}
                                    >
                                        <input type="hidden" name="folder" value={folder} />
                                        <input type="hidden" name="action" value="archive" />
                                        <button title={t("Archiver")}>
                                            <Archive size={17} />
                                        </button>
                                    </Form>
                                    <Form
                                        action={`/email/messages/${selected.uid}/flag`}
                                    >
                                        <input
                                            type="hidden"
                                            name="folder"
                                            value={folder}
                                        />
                                        <input
                                            type="hidden"
                                            name="action"
                                            value={
                                                selected.flagged
                                                    ? "unstar"
                                                    : "star"
                                            }
                                        />
                                        <button
                                            title={
                                                selected.flagged
                                                    ? t("Retirer des favoris")
                                                    : t("Ajouter aux favoris")
                                            }
                                        >
                                            <Star
                                                size={17}
                                                fill={
                                                    selected.flagged
                                                        ? "currentColor"
                                                        : "none"
                                                }
                                            />
                                        </button>
                                    </Form>
                                    <Form
                                        action={`/email/messages/${selected.uid}/flag`}
                                    >
                                        <input
                                            type="hidden"
                                            name="folder"
                                            value={folder}
                                        />
                                        <input
                                            type="hidden"
                                            name="action"
                                            value="unread"
                                        />
                                        <button
                                            title={t("Marquer comme non lu")}
                                        >
                                            <Mail size={17} />
                                        </button>
                                    </Form>
                                    <Form
                                        action={`/email/messages/${selected.uid}/flag`}
                                        confirm={folderNames.trash && folder.toLowerCase().includes("trash")
                                            ? t("Supprimer définitivement ce message ?")
                                            : t("Déplacer ce message vers la corbeille ?")}
                                    >
                                        <input
                                            type="hidden"
                                            name="folder"
                                            value={folder}
                                        />
                                        <input
                                            type="hidden"
                                            name="action"
                                            value="delete"
                                        />
                                        <button title={t("Supprimer")}>
                                            <Trash2 size={17} />
                                        </button>
                                    </Form>
                                </div>
                            </header>
                            <div className="mail-reader-title">
                                <h2>{selected.subject}</h2>
                                <time>
                                    {selected.date
                                        ? new Date(
                                              selected.date,
                                          ).toLocaleString(p.locale || "fr")
                                        : ""}
                                </time>
                            </div>
                            <div className="mail-sender">
                                <span>
                                    {(
                                        selected.from?.[0]?.name ||
                                        selected.from?.[0]?.email ||
                                        "?"
                                    )
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </span>
                                <div>
                                    <strong>
                                        {selected.from?.[0]?.name ||
                                            selected.from?.[0]?.email}
                                    </strong>
                                    <small>
                                        {addressText(selected.from)} · {t("à")}{" "}
                                        {addressText(selected.to)}
                                    </small>
                                </div>
                            </div>
                            <div className="mail-content">
                                {selected.html ? (
                                    <>
                                        {preparedHtml.remoteImages > 0 && !showRemoteImages && (
                                            <div className="mail-images-notice">
                                                <ImageIcon size={18} />
                                                <div>
                                                    <strong>{t("Images externes bloquées")}</strong>
                                                    <span>{t("Chargez-les uniquement si vous faites confiance à l’expéditeur.")}</span>
                                                </div>
                                                <Button type="button" secondary onClick={() => setShowRemoteImages(true)}>
                                                    {t("Afficher les images")}
                                                </Button>
                                            </div>
                                        )}
                                        <div className="mail-html" dangerouslySetInnerHTML={{ __html: preparedHtml.html }} />
                                    </>
                                ) : (
                                    <pre>{selected.text}</pre>
                                )}
                            </div>
                            {!!selected.attachments?.length && (
                                <div className="mail-attachments">
                                    <strong>
                                        <Paperclip size={16} />
                                        {selected.attachments.length}{" "}
                                        {t("pièce(s) jointe(s)")}
                                    </strong>
                                    <div>
                                        {selected.attachments.map(
                                            (attachment) => (
                                                <a
                                                    key={attachment.part}
                                                    href={`/email/messages/${selected.uid}/attachments/${attachment.part}?${new URLSearchParams({ folder })}`}
                                                >
                                                    <Paperclip size={14} />
                                                    <span>
                                                        {attachment.filename}
                                                    </span>
                                                    <small>
                                                        {Math.ceil(
                                                            attachment.size /
                                                                1024,
                                                        )}{" "}
                                                        Ko
                                                    </small>
                                                </a>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                            <footer>
                                <Button type="button" secondary onClick={reply}>
                                    <CornerUpLeft size={16} />
                                    {t("Répondre")}
                                </Button>
                                <Button
                                    type="button"
                                    secondary
                                    onClick={forward}
                                >
                                    <Forward size={16} />
                                    {t("Transférer")}
                                </Button>
                            </footer>
                        </>
                    ) : (
                        <div className="mail-reader-empty">
                            <MailOpen size={42} />
                            <h2>{t("Sélectionnez un message")}</h2>
                            <p>
                                {t(
                                    "Lisez, répondez ou transférez vos e-mails sans quitter Tahlila.",
                                )}
                            </p>
                        </div>
                    )}
                </article>
            </section>

            {compose && (
                <div
                    className="compose-layer"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t(composeMode === "reply" ? "Répondre" : composeMode === "forward" ? "Transférer" : "Nouveau message")}
                >
                    <Form action="/email/send" className="compose-window" onSuccess={messageSent}>
                        <header>
                            <div>
                                <Send size={17} />
                                <div className="compose-heading-copy">
                                    <strong>{t(composeMode === "reply" ? "Répondre" : composeMode === "forward" ? "Transférer" : "Nouveau message")}</strong>
                                    <small>{t("Rédigez votre message en toute sécurité")}</small>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCompose(false)}
                                aria-label={t("Fermer")}
                            >
                                <X size={18} />
                            </button>
                        </header>
                        <div className="compose-address">
                            <label>{t("À")}</label>
                            <input
                                name="to"
                                type="text"
                                required
                                value={draft.to}
                                onChange={(event) =>
                                    setDraft({
                                        ...draft,
                                        to: event.target.value,
                                    })
                                }
                            />
                            <button
                                type="button"
                                onClick={() => setShowCopies(!showCopies)}
                            >
                                Cc Cci
                            </button>
                        </div>
                        {showCopies && (
                            <>
                                <div className="compose-address">
                                    <label>Cc</label>
                                    <input
                                        name="cc"
                                        value={draft.cc}
                                        onChange={(event) =>
                                            setDraft({
                                                ...draft,
                                                cc: event.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="compose-address">
                                    <label>Cci</label>
                                    <input
                                        name="bcc"
                                        value={draft.bcc}
                                        onChange={(event) =>
                                            setDraft({
                                                ...draft,
                                                bcc: event.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </>
                        )}
                        <input
                            className="compose-subject"
                            name="subject"
                            required
                            placeholder={t("Objet")}
                            value={draft.subject}
                            onChange={(event) =>
                                setDraft({
                                    ...draft,
                                    subject: event.target.value,
                                })
                            }
                        />
                        <textarea
                            required
                            placeholder={t("Écrivez votre message…")}
                            value={draft.message}
                            onChange={(event) =>
                                setDraft({
                                    ...draft,
                                    message: event.target.value,
                                })
                            }
                        />
                        {draft.quote && (
                            <details className="compose-quote">
                                <summary>
                                    {t(composeMode === "forward" ? "Message transféré" : "Message précédent")}
                                </summary>
                                <pre>{draft.quote}</pre>
                            </details>
                        )}
                        <input
                            type="hidden"
                            name="message"
                            value={`${draft.message}${draft.quote ? `\n\n--- ${t(composeMode === "forward" ? "Message transféré" : "Message précédent")} ---\n${draft.quote}` : ""}`}
                        />
                        <input
                            type="hidden"
                            name="reply_message_id"
                            value={draft.reply_message_id}
                        />
                        <footer>
                            <label className="compose-files">
                                <Paperclip size={17} />
                                <span>{t("Joindre des fichiers")}</span>
                                <input
                                    type="file"
                                    name="attachments[]"
                                    multiple
                                    onChange={(event) => setAttachedFiles(Array.from(event.target.files || []))}
                                />
                            </label>
                            {!!attachedFiles.length && (
                                <div className="compose-file-list" title={attachedFiles.map((file) => file.name).join(", ")}>
                                    <Paperclip size={14} />
                                    <span>{attachedFiles.length === 1 ? attachedFiles[0].name : t("{count} fichiers joints").replace("{count}", attachedFiles.length)}</span>
                                </div>
                            )}
                            <div className="compose-footer-actions">
                                <Button type="button" secondary className="compose-discard" onClick={discardDraft}>
                                    <Trash2 size={15} />
                                    {t("Abandonner")}
                                </Button>
                                <Button type="submit">
                                    {t("Envoyer")}
                                    <Send size={16} />
                                </Button>
                            </div>
                        </footer>
                    </Form>
                </div>
            )}
            {sentToast && (
                <div className="mail-success-toast" role="status" aria-live="polite">
                    <CheckCircle2 size={20} />
                    <div>
                        <strong>{t("Message envoyé")}</strong>
                        <span>{t("Votre e-mail a été envoyé avec succès.")}</span>
                    </div>
                    <button type="button" onClick={() => setSentToast(false)} aria-label={t("Fermer")}>
                        <X size={16} />
                    </button>
                </div>
            )}
        </>
    );
}
