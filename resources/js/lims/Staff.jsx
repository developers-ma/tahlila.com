import { useMemo, useState } from "react";
import {
    ArrowRight,
    KeyRound,
    Pencil,
    Plus,
    ShieldCheck,
    UserRound,
    Users,
} from "lucide-react";
import { t } from "./i18n";
import { p, date } from "./data";
import { Button, Delete, Empty, Field, Form, Heading } from "./components";

export function StaffPage() {
    const administrators = p.users.filter(
        (user) => user.role?.slug === "administrator",
    ).length;

    return (
        <>
            <Heading>
                <Button href="/staff/create">
                    <Plus size={18} />
                    {t("Ajouter un collaborateur")}
                </Button>
            </Heading>
            <div className="staff-overview">
                <article className="staff-metric">
                    <Users size={20} />
                    <div>
                        <strong>{p.users.length}</strong>
                        <span>{t("Comptes actifs")}</span>
                    </div>
                </article>
                <article className="staff-metric">
                    <ShieldCheck size={20} />
                    <div>
                        <strong>{administrators}</strong>
                        <span>{t("Administrateurs")}</span>
                    </div>
                </article>
            </div>
            <section className="panel staff-list">
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">{t("ACCÈS SÉCURISÉS")}</span>
                        <h2>{t("Équipe du laboratoire")}</h2>
                        <p>
                            {t(
                                "Chaque utilisateur reçoit un rôle et un accès précisément adapté à son travail.",
                            )}
                        </p>
                    </div>
                    <span className="count">{p.users.length}</span>
                </div>
                <div className="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>{t("Collaborateur")}</th>
                                <th>{t("Rôle")}</th>
                                <th>{t("Permissions actives")}</th>
                                <th>{t("Depuis le")}</th>
                                <th>{t("Actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {p.users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="staff-person">
                                            <span>
                                                {user.name
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </span>
                                            <div>
                                                <strong>{user.name}</strong>
                                                <small>{user.email}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className={
                                                "role-badge role-" +
                                                (user.role?.slug || "none")
                                            }
                                        >
                                            {user.role?.name || t("Sans rôle")}
                                        </span>
                                    </td>
                                    <td>
                                        {user.role?.slug === "administrator"
                                            ? t("Accès complet")
                                            : (user.permissions?.length || 0) +
                                              " " +
                                              t("accès")}
                                    </td>
                                    <td>{date(user.created_at)}</td>
                                    <td>
                                        <div className="row-actions">
                                            <a
                                                className="icon-button"
                                                href={
                                                    "/staff/" +
                                                    user.id +
                                                    "/edit"
                                                }
                                                aria-label={t("Modifier")}
                                                title={t("Modifier")}
                                            >
                                                <Pencil size={16} />
                                            </a>
                                            {p.user?.email !== user.email && (
                                                <Delete
                                                    action={"/staff/" + user.id}
                                                    label="Supprimer ce compte collaborateur ?"
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!p.users.length && <Empty />}
            </section>
        </>
    );
}

export function StaffForm() {
    const isEditing = Boolean(p.record?.id);
    const defaultRoleId = String(
        p.old?._submitted
            ? p.old.role_id || ""
            : p.record?.role_id || p.roles[0]?.id || "",
    );
    const defaultPermissions = p.old?._submitted
        ? Array.from(p.old.permissions || []).map(String)
        : Array.from(p.record?.permissions || []);
    const [roleId, setRoleId] = useState(defaultRoleId);
    const [selectedPermissions, setSelectedPermissions] =
        useState(defaultPermissions);
    const role = p.roles.find((item) => String(item.id) === roleId);
    const roleTemplate = useMemo(
        () => new Set(role?.permissions || []),
        [role],
    );
    const allPermissions = useMemo(
        () => p.permissionGroups.flatMap((permissions) => permissions),
        [],
    );
    const administrator = role?.slug === "administrator";

    const togglePermission = (key) => {
        setSelectedPermissions((current) =>
            current.includes(key)
                ? current.filter((permission) => permission !== key)
                : [...current, key],
        );
    };

    const selectRole = (nextRoleId) => {
        const nextRole = p.roles.find((item) => String(item.id) === nextRoleId);
        setRoleId(nextRoleId);
        setSelectedPermissions(
            nextRole?.slug === "administrator"
                ? []
                : Array.from(nextRole?.permissions || []),
        );
    };

    const resetRoleTemplate = () =>
        setSelectedPermissions(Array.from(role?.permissions || []));

    return (
        <>
            <Heading />
            <Form action={p.action} method={p.method} className="staff-form">
                <div className="staff-form-layout">
                    <div>
                        <section className="panel staff-form-section">
                            <div className="staff-section-title">
                                <span className="staff-section-icon">
                                    <UserRound size={19} />
                                </span>
                                <div>
                                    <span className="eyebrow">
                                        {t("ÉTAPE 1")}
                                    </span>
                                    <h2>{t("Informations du compte")}</h2>
                                    <p>
                                        {t(
                                            "Ces informations seront utilisées pour la connexion.",
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="form-grid">
                                <Field
                                    field={{
                                        name: "name",
                                        label: "Nom complet",
                                        required: true,
                                        autoComplete: "name",
                                    }}
                                    record={p.record}
                                />
                                <Field
                                    field={{
                                        name: "email",
                                        label: "Adresse e-mail",
                                        type: "email",
                                        required: true,
                                        autoComplete: "email",
                                    }}
                                    record={p.record}
                                />
                                <Field
                                    field={{
                                        name: "password",
                                        label: isEditing
                                            ? "Nouveau mot de passe"
                                            : "Mot de passe",
                                        type: "password",
                                        required: !isEditing,
                                        autoComplete: "new-password",
                                        help: isEditing
                                            ? "Laissez vide pour conserver le mot de passe actuel."
                                            : "Minimum 8 caractères.",
                                    }}
                                    record={{}}
                                />
                                <Field
                                    field={{
                                        name: "password_confirmation",
                                        label: "Confirmer le mot de passe",
                                        type: "password",
                                        required: !isEditing,
                                        autoComplete: "new-password",
                                    }}
                                    record={{}}
                                />
                            </div>
                        </section>

                        <section className="panel staff-form-section">
                            <div className="staff-section-title">
                                <span className="staff-section-icon">
                                    <ShieldCheck size={19} />
                                </span>
                                <div>
                                    <span className="eyebrow">
                                        {t("ÉTAPE 2")}
                                    </span>
                                    <h2>{t("Rôle principal")}</h2>
                                    <p>
                                        {t(
                                            "Le rôle propose un modèle d’accès que vous pouvez ensuite personnaliser librement.",
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="role-selector">
                                {p.roles.map((item) => (
                                    <label
                                        key={item.id}
                                        className={
                                            String(item.id) === roleId
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        <input
                                            type="radio"
                                            name="role_id"
                                            value={item.id}
                                            checked={String(item.id) === roleId}
                                            onChange={(event) =>
                                                selectRole(event.target.value)
                                            }
                                        />
                                        <span>
                                            <strong>{t(item.name)}</strong>
                                            <small>{t(item.description)}</small>
                                            <em>
                                                {item.slug === "administrator"
                                                    ? t("Accès complet")
                                                    : item.permissions.length +
                                                      " " +
                                                      t("accès suggérés")}
                                            </em>
                                        </span>
                                        <ShieldCheck size={19} />
                                    </label>
                                ))}
                            </div>
                            {p.errors.role_id && (
                                <small className="error-text">
                                    {p.errors.role_id.join(" ")}
                                </small>
                            )}
                        </section>

                        <section className="panel staff-form-section">
                            <div className="staff-section-title">
                                <span className="staff-section-icon">
                                    <KeyRound size={19} />
                                </span>
                                <div>
                                    <span className="eyebrow">
                                        {t("ÉTAPE 3")}
                                    </span>
                                    <h2>{t("Permissions du compte")}</h2>
                                    <p>
                                        {administrator
                                            ? t(
                                                  "L’administrateur possède automatiquement tous les accès.",
                                              )
                                            : t(
                                                  "Sélectionnez exactement les pages et actions accessibles à ce collaborateur.",
                                              )}
                                    </p>
                                </div>
                            </div>
                            {administrator ? (
                                <div className="permission-admin-note">
                                    <ShieldCheck size={22} />
                                    <div>
                                        <strong>
                                            {t("Accès administrateur complet")}
                                        </strong>
                                        <p>
                                            {t(
                                                "Toutes les permissions actuelles et futures sont accordées automatiquement.",
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="permission-toolbar">
                                    <div>
                                        <strong>
                                            {selectedPermissions.length} /{" "}
                                            {allPermissions.length}
                                        </strong>
                                        <span>{t("accès sélectionnés")}</span>
                                    </div>
                                    <div className="permission-actions">
                                        <button
                                            type="button"
                                            data-permission-action="select-all"
                                            onClick={() =>
                                                setSelectedPermissions(
                                                    allPermissions.map(
                                                        ({ key }) => key,
                                                    ),
                                                )
                                            }
                                        >
                                            {t("Tout sélectionner")}
                                        </button>
                                        <button
                                            type="button"
                                            data-permission-action="clear-all"
                                            onClick={() =>
                                                setSelectedPermissions([])
                                            }
                                        >
                                            {t("Tout désélectionner")}
                                        </button>
                                        <button
                                            type="button"
                                            data-permission-action="reset-role"
                                            onClick={resetRoleTemplate}
                                        >
                                            {t("Réinitialiser selon le rôle")}
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div
                                className={
                                    "permission-groups" +
                                    (administrator ? " is-disabled" : "")
                                }
                            >
                                {p.permissionGroups.map((permissions) => (
                                    <fieldset
                                        key={permissions[0].group}
                                        disabled={administrator}
                                    >
                                        <legend>
                                            {t(permissions[0].group)}
                                        </legend>
                                        <div className="permission-grid">
                                            {permissions.map((permission) => {
                                                const suggested =
                                                    roleTemplate.has(
                                                        permission.key,
                                                    );
                                                return (
                                                    <label
                                                        key={permission.key}
                                                        className={
                                                            suggested
                                                                ? "suggested"
                                                                : ""
                                                        }
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            name="permissions[]"
                                                            value={
                                                                permission.key
                                                            }
                                                            checked={
                                                                administrator ||
                                                                selectedPermissions.includes(
                                                                    permission.key,
                                                                )
                                                            }
                                                            disabled={
                                                                administrator
                                                            }
                                                            onChange={() =>
                                                                togglePermission(
                                                                    permission.key,
                                                                )
                                                            }
                                                        />
                                                        <span>
                                                            <strong>
                                                                {t(
                                                                    permission.label,
                                                                )}
                                                            </strong>
                                                            <small>
                                                                {administrator
                                                                    ? t(
                                                                          "Accordée automatiquement",
                                                                      )
                                                                    : suggested
                                                                      ? t(
                                                                            "Suggérée par le rôle",
                                                                        )
                                                                      : t(
                                                                            "Permission optionnelle",
                                                                        )}
                                                            </small>
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </fieldset>
                                ))}
                            </div>
                        </section>
                    </div>

                    <aside className="staff-access-summary panel">
                        <ShieldCheck size={30} />
                        <span className="eyebrow">{t("RÉSUMÉ DES ACCÈS")}</span>
                        <h3>{role?.name || t("Choisissez un rôle")}</h3>
                        <p>{role?.description}</p>
                        <dl>
                            <div>
                                <dt>{t("Accès du rôle")}</dt>
                                <dd>
                                    {administrator
                                        ? t("Tous")
                                        : roleTemplate.size}
                                </dd>
                            </div>
                            <div>
                                <dt>{t("Accès sélectionnés")}</dt>
                                <dd>
                                    {administrator
                                        ? t("Tous")
                                        : selectedPermissions.length}
                                </dd>
                            </div>
                        </dl>
                        <div className="staff-form-actions">
                            <Button secondary href="/staff">
                                {t("Annuler")}
                            </Button>
                            <Button type="submit">
                                {t("Enregistrer les accès")}
                                <ArrowRight size={17} />
                            </Button>
                        </div>
                    </aside>
                </div>
            </Form>
        </>
    );
}
