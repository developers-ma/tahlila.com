import { t } from "./i18n";
import { ArrowUpRight, Plus } from "lucide-react";
import { can, p, money, date, name } from "./data";
import {
    Button,
    Status,
    Empty,
    Pagination,
    Delete,
    Heading,
    Filters,
} from "./components";
export function OrderTable({ rows = p.rows, mode = p.screen }) {
    const recordHref = (row) => {
        if (mode === "invoices" && can("invoices.manage"))
            return `/invoice/${row.id}`;
        if (mode === "all-barcodes" && can("collection.manage"))
            return `/test/barcodes/${row.id}`;
        if (can("results.manage")) return `/tests/${row.id}`;
        if (can("orders.manage")) return `/tests/${row.id}/edit`;
        if (can("collection.manage")) return `/test/barcodes/${row.id}`;
        if (can("invoices.manage")) return `/invoice/${row.id}`;
        return undefined;
    };
    return (
        <>
            <div className="table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th>Dossier / patient</th>
                            <th>{t("Date")}</th>
                            <th>{t("Statut")}</th>
                            <th>
                                {mode === "invoices"
                                    ? t("Solde")
                                    : t("Montant")}
                            </th>
                            <th className="right">{t("Actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows?.data.map((row) => (
                            <tr key={row.id}>
                                <td>
                                    <a
                                        className="patient-cell"
                                        href={recordHref(row)}
                                    >
                                        <span className="initial">
                                            {row.patient?.firstname?.[0]}
                                            {row.patient?.lastname?.[0]}
                                        </span>
                                        <span>
                                            <strong>{name(row.patient)}</strong>
                                            <small>
                                                Dossier #
                                                {String(row.id).padStart(
                                                    5,
                                                    "0",
                                                )}{" "}
                                                · {row.patient?.id_card}
                                            </small>
                                        </span>
                                    </a>
                                </td>
                                <td>{date(row.created_at)}</td>
                                <td>
                                    <Status value={row.test_status} />
                                </td>
                                <td className="amount">
                                    {money(
                                        mode === "invoices"
                                            ? row.remaining_or_give
                                            : row.total_price,
                                    )}
                                </td>
                                <td>
                                    <div className="row-actions">
                                        {recordHref(row) && (
                                            <a
                                                className="text-action"
                                                href={recordHref(row)}
                                            >
                                                {mode === "invoices"
                                                    ? t("Facture")
                                                    : mode === "all-barcodes"
                                                      ? t("Pr\xE9lever")
                                                      : t("Ouvrir")}{" "}
                                                <ArrowUpRight size={15} />
                                            </a>
                                        )}
                                        {can("orders.manage") && (
                                            <a
                                                href={`/tests/${row.id}/edit`}
                                                className="subtle"
                                            >
                                                {t("Modifier")}
                                            </a>
                                        )}
                                        {mode !== "dashboard" &&
                                            can("orders.manage") && (
                                                <Delete
                                                    action={`/tests/${row.id}`}
                                                    label="Supprimer ce dossier et tous ses résultats ?"
                                                />
                                            )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {!rows?.data.length && <Empty />}
            <Pagination rows={rows} />
        </>
    );
}
export function ListPage() {
    return (
        <>
            <Heading>
                {can("orders.manage") && (
                    <Button href="/new-test">
                        <Plus size={18} />
                        {t("Nouvelle analyse")}
                    </Button>
                )}
            </Heading>
            <section className="panel">
                <Filters status />
                <OrderTable />
            </section>
        </>
    );
}
