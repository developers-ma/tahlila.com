import { t } from "./i18n";
import {
    ArrowRight,
    FilePlus2,
    History as HistoryIcon,
    Pencil,
    Plus,
    ShieldCheck,
} from "lucide-react";
import { p, money, date } from "./data";
import {
    Button,
    Heading,
    Filters,
    Delete,
    Empty,
    Pagination,
    Form,
    Field,
} from "./components";
export function ResourceList() {
    const fields = p.fields
        .filter((f) =>
            ["text", "date", "email", "tel", "number"].includes(f.type),
        )
        .slice(0, 5);
    return (
        <>
            <Heading>
                <Button href={`/${p.base}/create`}>
                    <Plus size={18} />
                    {t("Ajouter")}
                </Button>
            </Heading>
            {p.resource === "prices" && (
                <div className="tabs">
                    <a className="selected" href="/prices">
                        Analyses
                    </a>
                    <a href="/groups">{t("Groupes")}</a>
                    <a href="/categories">{t("Cat\xE9gories")}</a>
                </div>
            )}
            <section className="panel">
                <Filters />
                <div className="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                {fields.map((f) => (
                                    <th key={f.name}>{f.label}</th>
                                ))}
                                <th className="right">{t("Actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {p.rows.data.map((row) => (
                                <tr key={row.id}>
                                    {fields.map((f, i) => (
                                        <td
                                            key={f.name}
                                            className={i === 0 ? "strong" : ""}
                                        >
                                            {f.name === "product_color" && row[f.name] ? (
                                                <span className="stock-color-value">
                                                    <i style={{ backgroundColor: row[f.name] }} />
                                                    {row[f.name]}
                                                </span>
                                            ) : f.type === "date"
                                                ? date(row[f.name])
                                                : f.name === "price"
                                                    ? money(row[f.name])
                                                    : row[f.name] || "—"}
                                        </td>
                                    ))}
                                    <td className="right">
                                        <div className="row-actions">
                                            <a
                                                className="table-action table-action-primary"
                                                href={`/${p.base}/${row.id}/edit`}
                                            >
                                                <Pencil size={14} />
                                                {t("Modifier")}
                                            </a>
                                            {p.resource === "patients" && (
                                                <a
                                                    className="table-action"
                                                    href={`/tests/create?patient=${row.id}`}
                                                >
                                                    <FilePlus2 size={15} />
                                                    Créer un dossier
                                                </a>
                                            )}
                                            {p.resource === "patients" && (
                                                <a
                                                    className="table-action"
                                                    href={`/history/patient/${row.id}`}
                                                >
                                                    <HistoryIcon size={15} />
                                                    Historique
                                                </a>
                                            )}
                                            <Delete
                                                action={`/${p.base}/${row.id}`}
                                                label={
                                                    p.resource === "patients"
                                                        ? "Supprimer ce patient et tous ses dossiers ?"
                                                        : undefined
                                                }
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!p.rows.data.length && <Empty />}
                <Pagination rows={p.rows} />
            </section>
        </>
    );
}
export function ResourceForm() {
    return (
        <>
            <Heading />
            <div className="form-layout">
                <section className="panel form-panel">
                    <div className="section-heading">
                        <h2>{t("Informations")}</h2>
                        <span className="muted">
                            {t("* Champs obligatoires")}
                        </span>
                    </div>
                    <Form action={p.action} method={p.method}>
                        <div className="form-grid">
                            {p.fields.map((field) => (
                                <Field
                                    key={field.name}
                                    field={field}
                                    record={p.record}
                                />
                            ))}
                        </div>
                        <div className="form-footer">
                            <Button secondary href={`/${p.resource}`}>
                                {t("Annuler")}
                            </Button>
                            <Button type="submit">
                                {t("Enregistrer")}
                                <ArrowRight size={17} />
                            </Button>
                        </div>
                    </Form>
                </section>

            </div>
        </>
    );
}
