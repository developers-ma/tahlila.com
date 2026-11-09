import { t } from "./i18n";
import { ArrowUpRight, Barcode, Pencil, Plus, Printer, ReceiptText } from "lucide-react";
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
        if (mode === "sample-collection" && can("collection.manage"))
            return `/sample-collection/${row.id}`;
        if (can("results.manage")) return `/tests/${row.id}`;
        if (can("orders.manage")) return `/tests/${row.id}/edit`;
        if (can("collection.manage")) return `/sample-collection/${row.id}`;
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
                        {rows?.data.map((row) => {
                            const resultCount = Number(row.result_lines_count ?? 0);
                            const completedResultCount = Number(row.completed_result_lines_count ?? 0);
                            const isResultReady = String(row.test_status) === "3";
                            const canPrintResult =
                                mode === "results" &&
                                isResultReady &&
                                resultCount > 0 &&
                                completedResultCount === resultCount;

                            return (
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
                                <td className="right">
                                    <div className="row-actions">
                                        {recordHref(row) && (
                                            <a
                                                className="table-action table-action-primary"
                                                href={recordHref(row)}
                                            >
                                                {mode === "invoices" ? (
                                                    <ReceiptText size={15} />
                                                ) : mode === "sample-collection" ? (
                                                    <Barcode size={15} />
                                                ) : (
                                                    <ArrowUpRight size={15} />
                                                )}
                                                {mode === "invoices"
                                                    ? t("Facture")
                                                    : mode === "sample-collection"
                                                      ? t("Pr\xE9lever")
                                                      : mode === "results"
                                                        ? t("Saisir les résultats")
                                                      : t("Ouvrir")}
                                            </a>
                                        )}
                                        {mode === "results" &&
                                            can("results.manage") &&
                                            (canPrintResult ? (
                                                <a
                                                    href={`/print/result/${row.id}`}
                                                    className="table-action table-action-print"
                                                >
                                                    <Printer size={14} />
                                                    {t("Imprimer le résultat")}
                                                </a>
                                            ) : (
                                                <span
                                                    className="table-action-tooltip"
                                                    data-tooltip={t(
                                                        !isResultReady
                                                            ? "Le statut doit être Prêt avant l’impression."
                                                            : "Complétez tous les résultats avant d’imprimer.",
                                                    )}
                                                >
                                                    <button
                                                        type="button"
                                                        className="table-action table-action-print"
                                                        disabled
                                                        aria-label={t(
                                                            !isResultReady
                                                                ? "Le statut doit être Prêt avant l’impression."
                                                                : "Complétez tous les résultats avant d’imprimer.",
                                                        )}
                                                    >
                                                        <Printer size={14} />
                                                        {t("Imprimer le résultat")}
                                                    </button>
                                                </span>
                                            ))}
                                        {mode !== "results" && can("orders.manage") && (
                                            <a
                                                href={`/tests/${row.id}/edit`}
                                                className="table-action"
                                            >
                                                <Pencil size={14} />
                                                {t("Modifier")}
                                            </a>
                                        )}
                                        {mode !== "dashboard" &&
                                            can("orders.manage") && (
                                                <Delete
                                                    action={
                                                        mode === "sample-collection"
                                                            ? `/sample-collection/${row.id}`
                                                            : `/tests/${row.id}`
                                                    }
                                                    label="Supprimer ce dossier et tous ses résultats ?"
                                                />
                                            )}
                                    </div>
                                </td>
                            </tr>
                            );
                        })}
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
                {can("orders.manage") &&
                    !["sample-collection", "results", "invoices"].includes(
                        p.screen,
                    ) && (
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
