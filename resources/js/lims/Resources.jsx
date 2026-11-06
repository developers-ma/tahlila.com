import { t } from "./i18n";
import { ArrowUpRight, Plus } from "lucide-react";
import { p, money, date, name } from "./data";
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
                                        href={`/tests/${row.id}`}
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
                                        <a
                                            className="text-action"
                                            href={
                                                mode === "invoices"
                                                    ? `/invoice/${row.id}`
                                                    : mode === "all-barcodes"
                                                      ? `/test/barcodes/${row.id}`
                                                      : `/tests/${row.id}`
                                            }
                                        >
                                            {mode === "invoices"
                                                ? t("Facture")
                                                : mode === "all-barcodes"
                                                  ? t("Pr\xE9lever")
                                                  : t("Ouvrir")}{" "}
                                            <ArrowUpRight size={15} />
                                        </a>
                                        <a
                                            href={`/tests/${row.id}/edit`}
                                            className="subtle"
                                        >
                                            {t("Modifier")}
                                        </a>
                                        {mode !== "dashboard" && (
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
                <Button href="/new-test">
                    <Plus size={18} />
                    {t("Nouvelle analyse")}
                </Button>
            </Heading>
            <section className="panel">
                <Filters status />
                <OrderTable />
            </section>
        </>
    );
}
