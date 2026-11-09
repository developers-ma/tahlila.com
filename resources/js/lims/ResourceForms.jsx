import { t } from "./i18n";
import { Fragment, useState } from "react";
import {
    ArrowRight,
    FilePlus2,
    History as HistoryIcon,
    Pencil,
    Plus,
    ShieldCheck,
    UserPlus,
} from "lucide-react";
import { checked, p, money, date } from "./data";
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
                    {p.resource === "patients" ? (
                        <UserPlus size={18} />
                    ) : (
                        <Plus size={18} />
                    )}
                    {p.resource === "patients"
                        ? t("Ajouter un patient")
                        : t("Ajouter")}
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
    const isPatientForm = p.resource === "patients";
    const [isChild, setIsChild] = useState(
        isPatientForm && checked(p.record?.is_child),
    );
    const patientFields = isPatientForm
        ? p.fields.filter((field) =>
              isChild
                  ? field.name !== "id_card"
                  : field.name !== "parent_id_card",
          )
        : p.fields;
    const [trackInventory,setTrackInventory]=useState(p.resource !== "stocks" || p.record?.track_inventory !== false);

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
                            {patientFields.map((field) => {
                                if(field.name === "track_inventory") return null;
                                if(p.resource === "stocks" && ["quantity","quantity_used"].includes(field.name) && !trackInventory) return null;
                                const resolvedField =
                                    field.name === "is_child"
                                        ? {
                                              ...field,
                                              onChange: (event) =>
                                                  setIsChild(
                                                      event.target.checked,
                                                  ),
                                          }
                                        : field.name === "parent_id_card"
                                          ? { ...field, required: true }
                                          : field;

                                if (
                                    ["has_insurance", "is_child"].includes(
                                        field.name,
                                    )
                                ) {
                                    return (
                                        <div
                                            key={field.name}
                                            className="patient-toggle-field"
                                        >
                                            <Field
                                                field={resolvedField}
                                                record={p.record}
                                            />
                                        </div>
                                    );
                                }

                                if (field.name === "parent_id_card") {
                                    return (
                                        <div
                                            key={field.name}
                                            className="patient-parent-id-field"
                                        >
                                            <Field
                                                field={resolvedField}
                                                record={p.record}
                                            />
                                            <small className="field-help child-id-help">
                                                {t("Un identifiant comme child/1/CIN sera généré automatiquement.")}
                                            </small>
                                        </div>
                                    );
                                }

                                return (
                                    <Fragment key={field.name}>
                                        <Field
                                            field={resolvedField}
                                            record={p.record}
                                        />
                                    </Fragment>
                                );
                            })}
                            {p.resource === "stocks" && <div className="inventory-tracking"><input type="hidden" name="track_inventory" value={trackInventory?1:0}/><label className="switch-row"><span><strong>{t("Ne pas suivre le stock")}</strong><small>{t("Utilisation illimitée, sans contrôle ni déduction de stock.")}</small></span><input type="checkbox" checked={!trackInventory} onChange={e=>setTrackInventory(!e.target.checked)}/><i/></label></div>}
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
