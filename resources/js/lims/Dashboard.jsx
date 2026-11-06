import { t } from "./i18n";
import { useState } from "react";
import {
    Activity,
    ArrowDownLeft,
    ArrowRight,
    Check,
    ClipboardList,
    FileText,
    FlaskConical,
    Users,
} from "lucide-react";
import { can, p, money } from "./data";
import { Heading } from "./components";
import { OrderTable } from "./Resources";
export function Dashboard() {
    return (
        <>
            <Heading />
            <section className="overview">
                <div className="balance-card">
                    <div className="card-top">
                        <span>{t("Votre activit\xE9, en un regard")}</span>
                        <Activity size={22} />
                    </div>
                    <div className="large-number">
                        {p.stats.patients.toLocaleString("fr-FR")}
                        <span>{t("patients enregistr\xE9s")}</span>
                    </div>
                    <div className="balance-footer">
                        <span>
                            <ArrowDownLeft size={17} />
                            {t("Encaissements cumul\xE9s")}
                        </span>
                        <strong>{money(p.stats.paid)}</strong>
                    </div>
                </div>
                <div className="workflow-card">
                    <div className="section-heading">
                        <h2>{t("Le fil de votre laboratoire")}</h2>
                        <span className="muted">{t("En temps r\xE9el")}</span>
                    </div>
                    <div className="workflow-counts">
                        {[
                            ["waiting", "1", t("\xC0 pr\xE9lever")],
                            ["processing", "2", t("En traitement")],
                            ["ready", "3", t("R\xE9sultats pr\xEAts")],
                        ].map(([key, status, label]) => (
                            <a
                                key={key}
                                href={
                                    can("orders.manage")
                                        ? `/tests?status=${status}`
                                        : undefined
                                }
                            >
                                <span className={`round-icon status-${status}`}>
                                    {status === "3" ? (
                                        <Check />
                                    ) : (
                                        <FlaskConical />
                                    )}
                                </span>
                                <strong>{p.stats[key]}</strong>
                                <span>{label}</span>
                                <ArrowRight size={17} />
                            </a>
                        ))}
                    </div>
                </div>
            </section>
            <div className="quick-actions">
                {can("patients.manage") && (
                    <a href="/patients/create">
                        <Users />
                        <span>
                            <strong>{t("Accueillir un patient")}</strong>
                            <small>
                                {t("Cr\xE9er sa fiche et son dossier")}
                            </small>
                        </span>
                        <ArrowRight />
                    </a>
                )}
                {can("results.manage") && (
                    <a href="/results?status=2">
                        <ClipboardList />
                        <span>
                            <strong>{t("Saisir les r\xE9sultats")}</strong>
                            <small>
                                {t("Poursuivre les analyses en cours")}
                            </small>
                        </span>
                        <ArrowRight />
                    </a>
                )}
                {can("invoices.manage") && (
                    <a href="/invoices">
                        <FileText />
                        <span>
                            <strong>{t("Suivre les r\xE8glements")}</strong>
                            <small>{money(p.stats.balance)} à recevoir</small>
                        </span>
                        <ArrowRight />
                    </a>
                )}
            </div>
            <ActivityChart />
            <section className="panel">
                <div className="section-heading">
                    <div>
                        <h2>{t("Les derniers dossiers")}</h2>
                        <p>
                            {t(
                                "Une vue claire de l\u2019activit\xE9 r\xE9cente.",
                            )}
                        </p>
                    </div>
                    {can("orders.manage") && (
                        <a className="text-action" href="/tests">
                            {t("Tous les dossiers")}
                            <ArrowRight size={16} />
                        </a>
                    )}
                </div>
                <OrderTable mode="dashboard" />
            </section>
        </>
    );
}
function ActivityChart() {
    const [period, setPeriod] = useState("month");
    const [metric, setMetric] = useState("revenue");
    const [offset, setOffset] = useState(0);
    const all = p.analytics?.[period] || [];
    const end = Math.max(0, all.length - offset);
    const rows = all.slice(Math.max(0, end - 12), end);
    const maximum = Math.max(1, ...rows.map((row) => Number(row[metric])));
    return (
        <section className="panel">
            <div className="section-heading">
                <div>
                    <h2>{t("Votre activit\xE9 dans le temps")}</h2>
                    <p>
                        {p.stats.analyses} analyses · {p.stats.stock}{" "}
                        consommables · {money(p.stats.revenue)} de dossiers
                    </p>
                </div>
                <div className="chart-filters">
                    <select
                        aria-label="Indicateur"
                        value={metric}
                        onChange={(e) => setMetric(e.target.value)}
                    >
                        <option value="revenue">
                            {t("Montant des dossiers")}
                        </option>
                        <option value="count">{t("Nombre de dossiers")}</option>
                    </select>
                    <select
                        aria-label="Période"
                        value={period}
                        onChange={(e) => {
                            setPeriod(e.target.value);
                            setOffset(0);
                        }}
                    >
                        <option value="day">{t("Jours")}</option>
                        <option value="month">{t("Mois")}</option>
                        <option value="year">{t("Ann\xE9es")}</option>
                    </select>
                </div>
            </div>
            <div
                className="activity-chart"
                role="img"
                aria-label={`${metric === "revenue" ? t("Montant") : "Nombre"} des dossiers par période`}
            >
                {rows.length ? (
                    rows.map((row) => (
                        <div className="chart-column" key={row.label}>
                            <span>
                                {metric === "revenue"
                                    ? money(row.revenue)
                                    : row.count}
                            </span>
                            <div className="chart-track">
                                <div
                                    style={{
                                        height: `${Math.max(Number(row[metric]) ? 3 : 0, (Number(row[metric]) / maximum) * 100)}%`,
                                    }}
                                />
                            </div>
                            <small>{row.label}</small>
                        </div>
                    ))
                ) : (
                    <p>Aucune activité enregistrée.</p>
                )}
            </div>
            <div className="pagination">
                <button
                    className="icon-button"
                    disabled={end <= 12}
                    onClick={() => setOffset(offset + 12)}
                >
                    ← Périodes précédentes
                </button>
                <button
                    className="icon-button"
                    disabled={!offset}
                    onClick={() => setOffset(Math.max(0, offset - 12))}
                >
                    Périodes suivantes →
                </button>
            </div>
        </section>
    );
}
