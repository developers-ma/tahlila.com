import { t } from "./i18n";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, ClipboardList, Coins, FileCheck2, FlaskConical, Printer, TrendingUp, UserPlus, Users, Zap } from "lucide-react";
import { can, money, p } from "./data";
import { OrderTable } from "./Resources";

const compact = (value) => Number(value || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 });

export function Dashboard() {
    return (
        <div className="dashboard-v2">
            <header className="dashboard-heading">
                <div><h1>{t("Tableau de bord")}</h1><p>{t("Votre laboratoire, en un regard.")}</p></div>
                <select aria-label={t("Période du tableau de bord")} defaultValue="30">
                    <option value="30">{t("30 derniers jours")}</option>
                    <option value="90">{t("90 derniers jours")}</option>
                    <option value="365">{t("Cette année")}</option>
                </select>
            </header>
            <section className="dashboard-kpis" aria-label={t("Indicateurs clés")}>
                <Kpi icon={Users} tone="green" label="Patients" value={p.stats.patients} />
                <Kpi icon={FlaskConical} tone="blue" label="Analyses" value={p.stats.analyses} />
                <Kpi icon={FileCheck2} tone="purple" label="Résultats" value={p.stats.ready} />
                <Kpi icon={Coins} tone="amber" label="Chiffre d’affaires" value={money(p.stats.revenue)} wide />
            </section>
            <section className="dashboard-primary-grid"><ActivityChart /><QuickActions /></section>
            <section className="dashboard-secondary-grid">
                <section className="panel dashboard-recent">
                    <div className="dashboard-card-heading">
                        <h2>{t("Derniers dossiers")}</h2>
                        {can("collection.manage") && <a href="/sample-collection">{t("Voir tout")} <ArrowRight size={16} /></a>}
                    </div>
                    <OrderTable mode="dashboard" />
                </section>
                <a className="dashboard-performance" href="/results">
                    <span><strong>{t("Performance du laboratoire")}</strong><small>{t("Suivre les résultats")}</small></span>
                    <i><ArrowRight /></i>
                </a>
            </section>
        </div>
    );
}

function Kpi({ icon: Icon, tone, label, value, wide = false }) {
    return (
        <article className={`dashboard-kpi dashboard-kpi-${tone}`}>
            <span className="dashboard-kpi-icon"><Icon /></span>
            <span className="dashboard-kpi-copy"><small>{t(label)}</small><strong className={wide ? "dashboard-kpi-wide" : ""}>{typeof value === "number" ? compact(value) : value}</strong></span>
            <span className="dashboard-kpi-trend"><TrendingUp size={13} /> {t("Activité")}</span>
        </article>
    );
}

function QuickActions() {
    const actions = [
        can("patients.manage") && [UserPlus, "Nouveau patient", "/patients/create", "green"],
        can("orders.manage") && [FlaskConical, "Nouvelle analyse", "/new-test", "blue"],
        can("results.manage") && [ClipboardList, "Saisir les résultats", "/results?status=2", "purple"],
        can("results.manage") && [Printer, "Imprimer un rapport", "/results", "slate"],
    ].filter(Boolean);
    return (
        <section className="panel dashboard-actions">
            <div className="dashboard-card-heading"><h2><Zap size={20} /> {t("Actions rapides")}</h2></div>
            <div>{actions.map(([Icon, label, href, tone]) => <a href={href} key={label}><span className={`dashboard-action-icon ${tone}`}><Icon /></span><strong>{t(label)}</strong><ChevronRight size={18} /></a>)}</div>
        </section>
    );
}

function ActivityChart() {
    const [metric, setMetric] = useState("count");
    const rows = (p.analytics?.day?.length ? p.analytics.day : p.analytics?.month || []).slice(-10);
    const values = rows.map((row) => Number(row[metric] || 0));
    const max = Math.max(1, ...values);
    const points = useMemo(() => values.map((value, index) => [rows.length <= 1 ? 50 : (index / (rows.length - 1)) * 100, 92 - (value / max) * 76]), [metric, rows.length, max, values.join(",")]);
    const line = points.map(([x, y]) => `${x},${y}`).join(" ");
    const area = points.length ? `0,100 ${line} 100,100` : "";
    const latest = values.at(-1) || 0;
    const formatValue = (value) => metric === "revenue" ? money(value) : compact(value);
    return (
        <section className="panel dashboard-chart-card">
            <div className="dashboard-card-heading">
                <h2>{metric === "count" ? t("Analyses dans le temps") : t("Revenus dans le temps")}</h2>
                <div className="dashboard-chart-tabs"><button type="button" aria-pressed={metric === "count"} className={metric === "count" ? "active" : ""} onClick={() => setMetric("count")}>{t("Analyses")}</button><button type="button" aria-pressed={metric === "revenue"} className={metric === "revenue" ? "active" : ""} onClick={() => setMetric("revenue")}>{t("Revenus")}</button></div>
            </div>
            {rows.length ? <div className="dashboard-line-chart" role="img" aria-label={t("Graphique d’activité")}>
                <div className="dashboard-chart-scale" aria-hidden="true"><span>{formatValue(max)}</span><span>{formatValue(max / 2)}</span><span>0</span></div>
                <div className="dashboard-chart-canvas">
                    <span className="dashboard-chart-current">{formatValue(latest)}</span>
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="dashboardArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#91d95e" stopOpacity=".42" /><stop offset="1" stopColor="#91d95e" stopOpacity=".04" /></linearGradient></defs><polygon points={area} fill="url(#dashboardArea)" /><polyline points={line} fill="none" stroke="#247414" strokeWidth="2" vectorEffect="non-scaling-stroke" />{points.map(([x, y], index) => <circle key={rows[index].label} cx={x} cy={y} r="1.8" fill="#247414" stroke="#fff" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}</svg>
                    <div className="dashboard-chart-labels" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>{rows.map((row) => <small key={row.label}>{row.label}</small>)}</div>
                </div>
            </div> : <div className="dashboard-chart-empty">{t("Aucune activité enregistrée.")}</div>}
        </section>
    );
}
