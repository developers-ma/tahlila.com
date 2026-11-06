import { t } from "./i18n";
import { useState } from "react";
import { FileText } from "lucide-react";
import { p, statuses, money, date, name, checked } from "./data";
import { Button, Heading, Form, Field, Status } from "./components";
export function PatientSummary() {
    return (
        <div className="patient-summary">
            <div>
                <small>PATIENT</small>
                <h2>{name(p.record.patient)}</h2>
                <p>
                    {p.record.patient?.id_card} · {p.record.patient?.phone}
                </p>
            </div>
            <div>
                <small>DOSSIER #{p.record.id}</small>
                <p>{date(p.record.created_at)}</p>
                <Status value={p.record.test_status} />
            </div>
        </div>
    );
}
export function DocumentLinks() {
    return (
        <div className="tabs no-print">
            <a href={`/tests/${p.record.id}`}>{t("R\xE9sultats")}</a>
            <a href={`/test/barcodes/${p.record.id}`}>
                {t("Pr\xE9l\xE8vement")}
            </a>
            <a href={`/invoice/${p.record.id}`}>{t("Facture")}</a>
            <a href={`/tests/${p.record.id}/edit`}>
                {t("Modifier le dossier")}
            </a>
        </div>
    );
}
export function Results() {
    return (
        <>
            <Heading>
                <Button href={`/print/result/${p.record.id}`}>
                    <FileText size={18} />
                    {t("Compte rendu")}
                </Button>
            </Heading>
            <DocumentLinks />
            <PatientSummary />
            <div className="results-layout">
                <div>
                    {p.lines.map((line) => (
                        <section className="panel form-panel" key={line.id}>
                            <div className="section-heading">
                                <div>
                                    <h2>
                                        {line.test_name || "Analyse archivée"}
                                    </h2>
                                    <p>
                                        {[
                                            line.category_name,
                                            line.group_name,
                                            line.test_description,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                </div>
                                <span className="status">
                                    {line.test_result_value
                                        ? t("Renseign\xE9")
                                        : t("\xC0 renseigner")}
                                </span>
                            </div>
                            <Form action={`/results/${line.id}`} method="PUT">
                                <input
                                    type="hidden"
                                    name="_result_id"
                                    value={line.id}
                                />
                                <div className="reference">
                                    Valeurs de référence :{" "}
                                    {line.test_reference_value || "—"}{" "}
                                    {line.test_unit}
                                </div>
                                <div className="form-grid">
                                    <Field
                                        useOld={
                                            String(p.old._result_id) ===
                                            String(line.id)
                                        }
                                        field={{
                                            name: "test_result_value",
                                            label: `Résultat (${line.test_unit || "valeur"})`,
                                        }}
                                        record={line}
                                    />
                                    {line.test_unit_2 && (
                                        <Field
                                            useOld={
                                                String(p.old._result_id) ===
                                                String(line.id)
                                            }
                                            field={{
                                                name: "test_result_value_2",
                                                label: `Deuxième résultat (${line.test_unit_2})`,
                                            }}
                                            record={line}
                                        />
                                    )}
                                    {[
                                        ["age", "Âge"],
                                        ["weight", "Poids"],
                                        ["height", "Taille"],
                                    ]
                                        .filter(
                                            ([key]) =>
                                                checked(
                                                    line[
                                                        `test_required_${key}`
                                                    ],
                                                ) || line[`patient_${key}`],
                                        )
                                        .map(([key, label]) => (
                                            <Field
                                                useOld={
                                                    String(p.old._result_id) ===
                                                    String(line.id)
                                                }
                                                key={key}
                                                field={{
                                                    name: `patient_${key}`,
                                                    label,
                                                    type: "number",
                                                }}
                                                record={line}
                                            />
                                        ))}
                                    {(checked(line.test_requiring_conclusion) ||
                                        line.conclusion) && (
                                        <Field
                                            useOld={
                                                String(p.old._result_id) ===
                                                String(line.id)
                                            }
                                            field={{
                                                name: "conclusion",
                                                label: t("Conclusion"),
                                                type: "textarea",
                                            }}
                                            record={line}
                                        />
                                    )}
                                </div>
                                <div className="form-footer">
                                    <Button>
                                        {t("Enregistrer ce r\xE9sultat")}
                                    </Button>
                                </div>
                            </Form>
                        </section>
                    ))}
                </div>
                <aside>
                    <section className="panel form-panel">
                        <h2>{t("Suivi du dossier")}</h2>
                        <Form
                            action={`/all-barcodes/${p.record.id}`}
                            method="PUT"
                        >
                            <Field
                                field={{
                                    name: "test_status",
                                    label: t("Statut du dossier"),
                                    type: "select",
                                    options: statuses,
                                }}
                                record={p.record}
                            />
                            <Button className="full">
                                {t("Mettre \xE0 jour")}
                            </Button>
                        </Form>
                        <Button
                            secondary
                            className="full"
                            href={`/print/result/${p.record.id}`}
                        >
                            {t("Voir le compte rendu")}
                        </Button>
                    </section>
                </aside>
            </div>
        </>
    );
}
export function Invoice() {
    const [balance, setBalance] = useState(p.record.remaining_or_give);
    return (
        <>
            <Heading>
                <Button onClick={() => window.print()}>
                    {t("Imprimer / PDF")}
                </Button>
            </Heading>
            <DocumentLinks />
            <section className="panel document">
                <div className="document-head">
                    {p.laboratory?.logo && (
                        <img
                            className="laboratory-logo"
                            src={`/storage/${p.laboratory.logo}`}
                            alt={p.laboratory.laboratory_name}
                        />
                    )}
                    <div>
                        <h2>
                            {p.laboratory?.laboratory_name || "Laboratoire"}
                        </h2>
                        <p>
                            {p.laboratory?.address}
                            <br />
                            {p.laboratory?.phone} · {p.laboratory?.email}
                        </p>
                    </div>
                    <div>
                        <span className="eyebrow">
                            {String(p.record.test_status) === "0"
                                ? "DEVIS"
                                : "FACTURE"}
                        </span>
                        <h2>#{String(p.record.id).padStart(5, "0")}</h2>
                        <div
                            className="barcode"
                            dangerouslySetInnerHTML={{
                                __html: p.barcode,
                            }}
                        />
                    </div>
                </div>
                <PatientSummary />
                <div className="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Analyse</th>
                                <th className="right">
                                    Tarif actuel du catalogue
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {p.lines.map((line) => (
                                <tr key={line.id}>
                                    <td>
                                        {line.test_name || "Analyse archivée"}
                                    </td>
                                    <td className="right">
                                        {money(line.price)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="invoice-totals">
                    <div>
                        <span>Total enregistré du dossier</span>
                        <strong>{money(p.record.total_price)}</strong>
                    </div>
                    <div>
                        <span>Taxe indicative ({p.payment?.tax || 0} %)</span>
                        <strong>
                            {money(
                                (Number(p.record.total_price) *
                                    Number(p.payment?.tax || 0)) /
                                    100,
                            )}
                        </strong>
                    </div>
                    <div>
                        <span>{t("Montant vers\xE9")}</span>
                        <strong>{money(p.record.paid_amount)}</strong>
                    </div>
                    <div className="grand-total">
                        <span>Solde enregistré</span>
                        <strong>{money(p.record.remaining_or_give)}</strong>
                    </div>
                </div>
                <p className="document-note">
                    Les tarifs détaillés et la taxe proviennent des paramètres
                    actuels. Le total et le solde du dossier restent ceux
                    enregistrés lors de sa création.
                </p>
                <div className="document-footer">
                    {p.laboratory?.footer_title1} ·{" "}
                    {p.laboratory?.footer_title2} ·{" "}
                    {p.laboratory?.footer_title3}
                </div>
            </section>
            <section className="panel form-panel no-print">
                <h2>Règlement du dossier</h2>
                <Form action={`/invoices/${p.record.id}`} method="PUT">
                    <div className="inline-form">
                        <label className="field">
                            Nouveau solde
                            <input
                                type="number"
                                name="remaining_or_give"
                                step="0.01"
                                required
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                            />
                        </label>
                        <Button>Enregistrer le règlement</Button>
                        <Button
                            secondary
                            type="button"
                            onClick={() => setBalance(0)}
                        >
                            Solder
                        </Button>
                    </div>
                </Form>
            </section>
        </>
    );
}
export function Report() {
    return (
        <>
            <Heading>
                <Button onClick={() => window.print()}>
                    {t("Imprimer / PDF")}
                </Button>
            </Heading>
            <DocumentLinks />
            <section className="panel document">
                <div className="document-head">
                    {p.laboratory?.logo && (
                        <img
                            className="laboratory-logo"
                            src={`/storage/${p.laboratory.logo}`}
                            alt={p.laboratory.laboratory_name}
                        />
                    )}
                    <div>
                        <h2>{p.laboratory?.laboratory_name}</h2>
                        <p>
                            {p.laboratory?.address} · {p.laboratory?.phone}
                        </p>
                    </div>
                    <div>
                        <h2>{t("Compte rendu d\u2019analyses")}</h2>
                        <span>
                            {String(p.record.test_status) === "3"
                                ? t("R\xE9sultats pr\xEAts")
                                : t("Document provisoire")}
                        </span>
                    </div>
                </div>
                <PatientSummary />
                {p.lines.map((line) => (
                    <div className="report-line" key={line.id}>
                        <small>
                            {[line.category_name, line.group_name]
                                .filter(Boolean)
                                .join(" · ")}
                        </small>
                        <h3>{line.test_name || "Analyse archivée"}</h3>
                        <div className="report-values">
                            <strong>
                                {line.test_result_value ||
                                    t("Non renseign\xE9")}{" "}
                                {line.test_unit}
                            </strong>
                            <span>
                                Référence : {line.test_reference_value || "—"}
                            </span>
                        </div>
                        {line.test_unit_2 && (
                            <div className="report-values">
                                <strong>
                                    {line.test_result_value_2 ||
                                        t("Non renseign\xE9")}{" "}
                                    {line.test_unit_2}
                                </strong>
                                <span>
                                    Référence :{" "}
                                    {line.test_reference_value_2 || "—"}
                                </span>
                            </div>
                        )}
                        {(line.patient_age ||
                            line.patient_weight ||
                            line.patient_height) && (
                            <p>
                                Âge : {line.patient_age || "—"} · Poids :{" "}
                                {line.patient_weight || "—"} · Taille :{" "}
                                {line.patient_height || "—"}
                            </p>
                        )}
                        {line.conclusion && (
                            <p className="conclusion">
                                {line.conclusion.replace(/<[^>]*>/g, "")}
                            </p>
                        )}
                    </div>
                ))}
                <div className="document-footer">
                    {p.laboratory?.managing_director}
                    <br />
                    {p.laboratory?.footer_title1} ·{" "}
                    {p.laboratory?.footer_title2} ·{" "}
                    {p.laboratory?.footer_title3}
                </div>
            </section>
            <ResultNotification />
        </>
    );
}
export function ResultNotification() {
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);
    return (
        p.record.patient?.email && (
            <section className="panel form-panel no-print">
                <h2>Informer le patient</h2>
                <p>
                    Envoyer une notification de disponibilité à{" "}
                    {p.record.patient.email}.
                </p>
                <Button
                    disabled={busy || String(p.record.test_status) !== "3"}
                    onClick={async () => {
                        setBusy(true);
                        try {
                            const res = await fetch("/send-test-result-email", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Accept: "application/json",
                                    "X-CSRF-TOKEN": p.csrf,
                                },
                                body: JSON.stringify({
                                    email: p.record.patient.email,
                                }),
                            });
                            const data = await res.json();
                            setNotice(
                                data.message ||
                                    (res.ok
                                        ? "Notification envoyée."
                                        : "Envoi impossible."),
                            );
                        } catch {
                            setNotice(
                                "Envoi impossible. Vérifiez la configuration de la messagerie.",
                            );
                        } finally {
                            setBusy(false);
                        }
                    }}
                >
                    {busy ? "Envoi…" : "Envoyer la notification"}
                </Button>
                <p role="status">{notice}</p>
            </section>
        )
    );
}
export function BarcodePage() {
    const [copies, setCopies] = useState(1);
    const [tubeCopies, setTubeCopies] = useState({});
    const [labelFormat, setLabelFormat] = useState("50x25");
    const patient = p.record.patient;
    const accession = `LAB-${String(p.record.id).padStart(6, "0")}`;
    const analyses = p.lines
        .map((line) => line.test_name)
        .filter(Boolean)
        .join(" · ");
    const patientDetails = [
        patient?.date_of_birth ? `Né(e) ${date(patient.date_of_birth)}` : null,
        patient?.gender,
    ]
        .filter(Boolean)
        .join(" · ");
    const labels = [
        ...Array.from(
            {
                length: copies,
            },
            () => ({
                name: "Tube standard",
            }),
        ),
        ...p.stocks.flatMap((stock) =>
            Array.from(
                {
                    length: tubeCopies[stock.id] || 0,
                },
                () => ({
                    name: stock.product_name,
                    color: stock.product_color,
                }),
            ),
        ),
    ];
    return (
        <>
            <Heading>
                <Button onClick={() => window.print()}>
                    {t("Imprimer sur l’imprimante thermique")}
                </Button>
            </Heading>
            <DocumentLinks />
            <div className="no-print">
                <PatientSummary />
                <section className="panel form-panel">
                    <h2>{t("Pr\xE9l\xE8vement")}</h2>
                    <Form action={`/test/barcodes/${p.record.id}`} method="PUT">
                        <div className="form-grid">
                            <Field
                                field={{
                                    name: "test_status",
                                    label: t("Statut"),
                                    type: "select",
                                    options: statuses,
                                    required: true,
                                }}
                                record={p.record}
                            />
                            <Field
                                field={{
                                    name: "prelevement_date",
                                    label: t("Date du pr\xE9l\xE8vement"),
                                    type: "date",
                                }}
                                record={p.record}
                            />
                        </div>
                        <Button>{t("Enregistrer")}</Button>
                    </Form>
                    <label className="field">
                        Étiquettes · tube standard
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={copies}
                            onChange={(e) =>
                                setCopies(
                                    Math.max(
                                        0,
                                        Math.min(100, Number(e.target.value)),
                                    ),
                                )
                            }
                        />
                    </label>
                    <label className="field">
                        Format de l’étiquette thermique
                        <select
                            value={labelFormat}
                            onChange={(event) =>
                                setLabelFormat(event.target.value)
                            }
                        >
                            <option value="50x25">50 × 25 mm · tube standard</option>
                            <option value="50x30">50 × 30 mm · informations étendues</option>
                        </select>
                    </label>
                    <div className="form-grid">
                        {p.stocks.map((stock) => (
                            <label className="field" key={stock.id}>
                                <span>
                                    <span
                                        className="tube-dot"
                                        style={{
                                            backgroundColor:
                                                stock.product_color,
                                        }}
                                    />{" "}
                                    {stock.product_name}
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={tubeCopies[stock.id] || 0}
                                    onChange={(e) =>
                                        setTubeCopies({
                                            ...tubeCopies,
                                            [stock.id]: Math.max(
                                                0,
                                                Math.min(
                                                    100,
                                                    Number(e.target.value),
                                                ),
                                            ),
                                        })
                                    }
                                />
                            </label>
                        ))}
                    </div>
                    <div className="reference">
                        Analyses : {p.lines.map((l) => l.test_name).join(" · ")}
                    </div>
                    <p className="muted">
                        Consommables disponibles :{" "}
                        {p.stocks
                            .map(
                                (s) =>
                                    `${s.product_name} (${Number(s.quantity) - Number(s.quantity_used)})`,
                            )
                            .join(" · ") || "Aucun stock enregistré"}
                    </p>
                    <p className="print-hint">
                        Impression : choisissez l’imprimante thermique, une
                        échelle de 100 %, sans marge et sans en-tête ni pied de
                        page. Chaque tube sera imprimé sur une étiquette
                        séparée.
                    </p>
                </section>
            </div>
            <div className={`labels labels-${labelFormat}`}>
                {labels.map((label, i) => (
                    <div className="barcode-label" key={i}>
                        <div className="tube-label-head">
                            <strong>{accession}</strong>
                            <span>
                                <i
                                    className="tube-color"
                                    style={{
                                        backgroundColor:
                                            label.color || "#d9ded6",
                                    }}
                                />
                                {label.name}
                            </span>
                        </div>
                        <div className="tube-patient">
                            {name(patient)}
                        </div>
                        <div className="tube-meta">
                            <span>{patientDetails || "Identité à vérifier"}</span>
                            <span>
                                Prél. {date(p.record.prelevement_date)}
                            </span>
                        </div>
                        <div
                            className="tube-barcode"
                            dangerouslySetInnerHTML={{
                                __html: p.barcode,
                            }}
                        />
                        <div className="tube-code">{p.record.id}</div>
                        <div className="tube-analyses" title={analyses}>
                            {analyses || "Analyses du dossier"}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
