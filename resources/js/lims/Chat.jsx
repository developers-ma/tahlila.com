import { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowRight,
    FileText,
    MessageCircle,
    Paperclip,
    Search,
    Send,
    Users,
    X,
} from "lucide-react";
import { p } from "./data";
import { Heading } from "./components";
import { t } from "./i18n";
import "./chat.css";

function Avatar({ user, large = false }) {
    return (
        <span className={`chat-avatar ${large ? "large" : ""}`}>
            {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" />
            ) : (
                user?.name?.slice(0, 2).toUpperCase()
            )}
        </span>
    );
}

export function Chat() {
    const selected = p.chatSelectedUser;
    const [messages, setMessages] = useState(p.chatMessages || []);
    const [body, setBody] = useState("");
    const [search, setSearch] = useState("");
    const [sending, setSending] = useState(false);
    const [files, setFiles] = useState([]);
    const [error, setError] = useState("");
    const messagesEnd = useRef(null);
    const fileInput = useRef(null);
    const users = useMemo(
        () =>
            (p.chatUsers || []).filter((user) =>
                `${user.name} ${user.role || ""}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
            ),
        [search],
    );

    useEffect(() => {
        setMessages(p.chatMessages || []);
    }, [selected?.id]);

    useEffect(() => {
        messagesEnd.current?.scrollIntoView?.({ behavior: "smooth" });
    }, [messages.length]);

    useEffect(() => {
        if (!selected) return undefined;
        const refresh = async () => {
            try {
                const response = await fetch(
                    `/api/chat/conversation/${selected.id}`,
                    {
                        credentials: "same-origin",
                        headers: { Accept: "application/json" },
                    },
                );
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data.messages || []);
                }
            } catch {
                // Keep the current conversation visible and retry automatically.
            }
        };
        const interval = window.setInterval(refresh, 5000);
        return () => window.clearInterval(interval);
    }, [selected?.id]);

    const send = async (event) => {
        event.preventDefault();
        const message = body.trim();
        if ((!message && !files.length) || !selected || sending) return;
        setSending(true);
        setError("");
        try {
            const payload = new FormData();
            payload.append("recipient_id", selected.id);
            payload.append("body", message);
            files.forEach((file) => payload.append("attachments[]", file));
            const response = await fetch("/chat/messages", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": p.csrf,
                },
                body: payload,
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.message || t("Message non envoyé"));
            setMessages((current) => [...current, data.message]);
            setBody("");
            setFiles([]);
            if (fileInput.current) fileInput.current.value = "";
        } catch (exception) {
            setError(exception.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <Heading />
            <section className="chat-shell panel">
                <aside className="chat-contacts">
                    <header>
                        <div>
                            <Users size={18} />
                            <strong>{t("Collaborateurs")}</strong>
                        </div>
                        <span>{p.chatUsers?.length || 0}</span>
                    </header>
                    <label className="chat-search">
                        <Search size={16} />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={t("Rechercher un collaborateur")}
                        />
                    </label>
                    <nav>
                        {users.map((user) => (
                            <a
                                key={user.id}
                                href={`/chat?user=${user.id}`}
                                className={
                                    selected?.id === user.id ? "active" : ""
                                }
                            >
                                <Avatar user={user} />
                                <span>
                                    <strong>{user.name}</strong>
                                    <small>
                                        {user.lastMessage ||
                                            user.role ||
                                            user.email}
                                    </small>
                                </span>
                                <span className="chat-contact-meta">
                                    {user.unreadCount > 0 && (
                                        <b>{user.unreadCount}</b>
                                    )}
                                    <ArrowRight size={14} />
                                </span>
                            </a>
                        ))}
                    </nav>
                </aside>

                <div className="chat-conversation">
                    {selected ? (
                        <>
                            <header className="chat-conversation-header">
                                <Avatar user={selected} large />
                                <div>
                                    <strong>{selected.name}</strong>
                                    <span>
                                        {selected.role || selected.email}
                                    </span>
                                </div>
                                <span className="chat-private">
                                    <MessageCircle size={15} />
                                    {t("Conversation privée")}
                                </span>
                            </header>
                            <div className="chat-messages" aria-live="polite">
                                {messages.length ? (
                                    messages.map((message) => {
                                        const mine =
                                            Number(message.sender_id) ===
                                            Number(p.user.id);
                                        return (
                                            <article
                                                className={
                                                    mine ? "mine" : "theirs"
                                                }
                                                key={message.id}
                                            >
                                                <Avatar
                                                    user={
                                                        mine ? p.user : selected
                                                    }
                                                />
                                                <section>
                                                    <div className="chat-bubble">
                                                        {message.body && (
                                                            <p>
                                                                {message.body}
                                                            </p>
                                                        )}
                                                        {!!message.attachments
                                                            ?.length && (
                                                            <div className="chat-attachment-grid">
                                                                {message.attachments.map(
                                                                    (
                                                                        attachment,
                                                                    ) => (
                                                                        <a
                                                                            key={
                                                                                attachment.id
                                                                            }
                                                                            href={
                                                                                attachment.url
                                                                            }
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                        >
                                                                            {attachment.is_image ? (
                                                                                <img
                                                                                    src={`${attachment.url}?inline=1`}
                                                                                    alt={
                                                                                        attachment.original_name
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                <FileText
                                                                                    size={
                                                                                        20
                                                                                    }
                                                                                />
                                                                            )}
                                                                            <span>
                                                                                <strong>
                                                                                    {
                                                                                        attachment.original_name
                                                                                    }
                                                                                </strong>
                                                                                <small>
                                                                                    {Math.ceil(
                                                                                        attachment.size /
                                                                                            1024,
                                                                                    )}{" "}
                                                                                    Ko
                                                                                </small>
                                                                            </span>
                                                                        </a>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <time>
                                                        {message.created_at
                                                            ? new Date(
                                                                  message.created_at,
                                                              ).toLocaleTimeString(
                                                                  p.locale ||
                                                                      "fr",
                                                                  {
                                                                      hour: "2-digit",
                                                                      minute: "2-digit",
                                                                  },
                                                              )
                                                            : ""}
                                                    </time>
                                                </section>
                                            </article>
                                        );
                                    })
                                ) : (
                                    <div className="chat-empty">
                                        <MessageCircle size={36} />
                                        <strong>
                                            {t("Commencez la conversation")}
                                        </strong>
                                        <p>
                                            {t(
                                                "Échangez rapidement avec ce collaborateur sans quitter le laboratoire.",
                                            )}
                                        </p>
                                    </div>
                                )}
                                <div ref={messagesEnd} />
                            </div>
                            <form className="chat-composer" onSubmit={send}>
                                {error && (
                                    <span
                                        className="error-text alert-inline"
                                        role="alert"
                                    >
                                        {error}
                                    </span>
                                )}
                                {!!files.length && (
                                    <div className="chat-files-selected">
                                        {files.map((file, index) => (
                                            <span key={`${file.name}-${index}`}>
                                                <Paperclip size={13} />
                                                {file.name}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setFiles((current) =>
                                                            current.filter(
                                                                (
                                                                    _,
                                                                    itemIndex,
                                                                ) =>
                                                                    itemIndex !==
                                                                    index,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="chat-compose-row">
                                    <label
                                        className="chat-attach-button"
                                        title={t("Joindre des fichiers")}
                                    >
                                        <Paperclip size={18} />
                                        <input
                                            ref={fileInput}
                                            type="file"
                                            aria-label={t(
                                                "Joindre des fichiers",
                                            )}
                                            multiple
                                            accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                                            onChange={(event) =>
                                                setFiles(
                                                    Array.from(
                                                        event.target.files ||
                                                            [],
                                                    ).slice(0, 5),
                                                )
                                            }
                                        />
                                    </label>
                                    <textarea
                                        value={body}
                                        onChange={(event) =>
                                            setBody(event.target.value)
                                        }
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === "Enter" &&
                                                !event.shiftKey
                                            ) {
                                                event.preventDefault();
                                                event.currentTarget.form?.requestSubmit();
                                            }
                                        }}
                                        rows="2"
                                        maxLength="5000"
                                        placeholder={t("Écrivez un message…")}
                                    />
                                    <button
                                        disabled={
                                            sending ||
                                            (!body.trim() && !files.length)
                                        }
                                        type="submit"
                                        aria-label={t("Envoyer")}
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                                <small>
                                    {t(
                                        "Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne",
                                    )}
                                </small>
                            </form>
                        </>
                    ) : (
                        <div className="chat-no-selection">
                            <Users size={42} />
                            <h2>{t("Aucun autre collaborateur")}</h2>
                            <p>
                                {t(
                                    "Ajoutez un membre à l’équipe pour démarrer une conversation interne.",
                                )}
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
