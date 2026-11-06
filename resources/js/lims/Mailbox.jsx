import { useState } from "react";
import {
    Archive,
    ArrowLeft,
    CornerUpLeft,
    Forward,
    Inbox,
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

const folderIcons = {
    inbox: Inbox,
    sent: Send,
    drafts: PenLine,
    trash: Trash2,
    spam: ShieldCheck,
    folder: Archive,
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

export function Mailbox() {
    const mailbox = p.mailbox || {};
    const folder = mailbox.folder || "INBOX";
    const selected = mailbox.selected;
    const [compose, setCompose] = useState(false);
    const [draft, setDraft] = useState({
        to: "",
        cc: "",
        bcc: "",
        subject: "",
        message: "",
        reply_message_id: "",
    });
    const [showCopies, setShowCopies] = useState(false);

    const openComposer = (values = {}) => {
        setDraft({
            to: "",
            cc: "",
            bcc: "",
            subject: "",
            message: "",
            reply_message_id: "",
            ...values,
        });
        setShowCopies(Boolean(values.cc || values.bcc));
        setCompose(true);
    };

    if (!p.mailConfigured) {
        return (
            <>
                <Heading>
                    <Button secondary href="/setting/email">
                        <Settings size={17} />
                        {t("Configuration")}
                    </Button>
                </Heading>
                <section className="mail-setup panel">
                    <span className="mail-setup-icon">
                        <Mail size={34} />
                    </span>
                    <span className="eyebrow">
                        {t("PREMIÈRE CONFIGURATION")}
                    </span>
                    <h2>{t("Connectez la messagerie du laboratoire")}</h2>
                    <p>
                        {t(
                            "Configurez SMTP pour envoyer et IMAP pour recevoir, lire et organiser les messages depuis Tahlila.",
                        )}
                    </p>
                    <div className="mail-protocols">
                        <div>
                            <Send size={18} />
                            <strong>SMTP</strong>
                            <span>{t("Envoi sécurisé")}</span>
                        </div>
                        <div>
                            <Inbox size={18} />
                            <strong>IMAP</strong>
                            <span>{t("Réception synchronisée")}</span>
                        </div>
                        <div>
                            <Paperclip size={18} />
                            <strong>{t("Fichiers")}</strong>
                            <span>{t("Pièces jointes")}</span>
                        </div>
                    </div>
                    <Button href="/setting/email">
                        <Settings size={17} />
                        {t("Configurer la messagerie")}
                    </Button>
                </section>
            </>
        );
    }

    const reply = () =>
        openComposer({
            to: addressText(selected?.replyTo || selected?.from),
            subject: selected?.subject?.startsWith("Re:")
                ? selected.subject
                : `Re: ${selected?.subject || ""}`,
            message: `\n\n--- ${t("Message précédent")} ---\n${selected?.text || ""}`,
            reply_message_id: selected?.messageId || "",
        });
    const forward = () =>
        openComposer({
            subject: selected?.subject?.startsWith("Fwd:")
                ? selected.subject
                : `Fwd: ${selected?.subject || ""}`,
            message: `\n\n--- ${t("Message transféré")} ---\n${t("De")} : ${addressText(selected?.from)}\n${t("Objet")} : ${selected?.subject || ""}\n\n${selected?.text || ""}`,
        });

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
                                    <span>{item.name}</span>
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
                                new URLSearchParams(location.search).get("q") ||
                                ""
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
                        <div className="mail-items">
                            {mailbox.messages.data.map((message) => (
                                <a
                                    key={message.uid}
                                    href={query({ folder, uid: message.uid })}
                                    className={`${message.seen ? "" : "unread"} ${selected?.uid === message.uid ? "selected" : ""}`}
                                >
                                    <span className="mail-item-star">
                                        <Star
                                            size={15}
                                            fill={
                                                message.flagged
                                                    ? "currentColor"
                                                    : "none"
                                            }
                                        />
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
                    ) : (
                        <div className="mail-empty">
                            <MailOpen size={30} />
                            <strong>{t("Aucun message")}</strong>
                            <span>{t("Ce dossier est vide.")}</span>
                        </div>
                    )}
                </div>

                <article className="mail-reader">
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
                                        confirm={t(
                                            "Supprimer définitivement ce message ?",
                                        )}
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
                                    <div
                                        className="mail-html"
                                        dangerouslySetInnerHTML={{
                                            __html: selected.html,
                                        }}
                                    />
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
                    aria-label={t("Nouveau message")}
                >
                    <Form action="/email/send" className="compose-window">
                        <header>
                            <div>
                                <Send size={17} />
                                <strong>{t("Nouveau message")}</strong>
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
                            name="message"
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
                                />
                            </label>
                            <Button type="submit">
                                {t("Envoyer")}
                                <Send size={16} />
                            </Button>
                        </footer>
                    </Form>
                </div>
            )}
        </>
    );
}
