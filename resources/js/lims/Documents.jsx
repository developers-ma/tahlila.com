import { t } from "./i18n";
import { useState } from "react";
import {
    Banknote,
    Building2,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    CreditCard,
    FileText,
    Mail,
    MapPin,
    Minus,
    Phone,
    Plus,
    Printer,
    ReceiptText,
    TestTube2,
} from "lucide-react";
import { p, statuses, money, date, name, checked, can } from "./data";
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
            {can("results.manage") && (
                <a href={`/tests/${p.record.id}`}>{t("R\xE9sultats")}</a>
            )}
            {can("collection.manage") && (
                <a href={`/test/barcodes/${p.record.id}`}>
                    {t("Pr\xE9l\xE8vement")}
                </a>
            )}
            {can("invoices.manage") && (
                <a href={`/invoice/${p.record.id}`}>{t("Facture")}</a>
            )}
            {can("orders.manage") && (
                <a href={`/tests/${p.record.id}/edit`}>
                    {t("Modifier le dossier")}
                </a>
            )}
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
                    {can("collection.manage") && (
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
                    )}
                </aside>
            </div>
        </>
    );
}
export function Invoice() {
    const [balance, setBalance] = useState(p.record.remaining_or_give);
    const invoiceNumber = "FAC-" + String(p.record.id).padStart(6, "0");
    const accessionNumber = "LAB-" + String(p.record.id).padStart(6, "0");
    const isQuote = String(p.record.test_status) === "0";
    const total = Number(p.record.total_price || 0);
    const paid = Number(p.record.paid_amount || 0);
    const remaining = Number(p.record.remaining_or_give || 0);
    const taxRate = Number(p.payment?.tax || 0);
    const paymentLabels = {
        cash: "Espèces",
        pos: "Carte bancaire",
        banktransfer: "Virement bancaire",
        bank_transfer: "Virement bancaire",
        cheque: "Chèque",
    };
    const paymentLabel =
        paymentLabels[p.record.payment_method] ||
        p.record.payment_method ||
        "Non renseigné";
    const paymentState =
        remaining <= 0
            ? { label: "Payée", className: "paid" }
            : paid > 0
              ? { label: "Partiellement payée", className: "partial" }
              : { label: "À régler", className: "unpaid" };

    return (
        <>
            <Heading>
                <Button
                    className="invoice-print-button"
                    onClick={() => window.print()}
                >
                    <Printer size={18} />
                    {t("Imprimer / PDF")}
                </Button>
            </Heading>
            <DocumentLinks />

            <section className="panel document invoice-document">
                <header className="invoice-header">
                    <div className="invoice-brand">
                        <div className="invoice-brand-mark">
                            {p.laboratory?.logo ? (
                                <img
                                    className="laboratory-logo"
                                    src={"/storage/" + p.laboratory.logo}
                                    alt={p.laboratory.laboratory_name}
                                />
                            ) : (
                                <Building2 size={28} />
                            )}
                        </div>
                        <div>
                            <span className="invoice-kicker">
                                Laboratoire d’analyses médicales
                            </span>
                            <h2>
                                {p.laboratory?.laboratory_name || "Laboratoire"}
                            </h2>
                            {p.laboratory?.managing_director && (
                                <p>
                                    Direction : {p.laboratory.managing_director}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="invoice-identity">
                        <div className="invoice-title-row">
                            <span className="invoice-type">
                                {isQuote ? "DEVIS" : "FACTURE"}
                            </span>
                            {!isQuote && (
                                <span
                                    className={
                                        "invoice-status " +
                                        paymentState.className
                                    }
                                >
                                    {paymentState.label}
                                </span>
                            )}
                        </div>
                        <h2>{invoiceNumber}</h2>
                        <p>Émise le {date(p.record.created_at)}</p>
                    </div>
                </header>

                <div className="invoice-parties">
                    <section className="invoice-party invoice-lab-details">
                        <span className="invoice-section-label">Émetteur</span>
                        <h3>
                            {p.laboratory?.laboratory_name || "Laboratoire"}
                        </h3>
                        {p.laboratory?.address && (
                            <p>
                                <MapPin size={15} />
                                {p.laboratory.address}
                            </p>
                        )}
                        {p.laboratory?.phone && (
                            <p>
                                <Phone size={15} />
                                {p.laboratory.phone}
                            </p>
                        )}
                        {p.laboratory?.email && (
                            <p>
                                <Mail size={15} />
                                {p.laboratory.email}
                            </p>
                        )}
                        {(p.laboratory?.company_number ||
                            p.laboratory?.tax_id) && (
                            <div className="invoice-legal-ids">
                                {p.laboratory?.company_number && (
                                    <span>
                                        RC : {p.laboratory.company_number}
                                    </span>
                                )}
                                {p.laboratory?.tax_id && (
                                    <span>IF : {p.laboratory.tax_id}</span>
                                )}
                            </div>
                        )}
                    </section>

                    <section className="invoice-party invoice-patient-details">
                        <span className="invoice-section-label">Facturé à</span>
                        <h3>{name(p.record.patient)}</h3>
                        <dl>
                            <div>
                                <dt>Identifiant patient</dt>
                                <dd>{p.record.patient?.id_card || "—"}</dd>
                            </div>
                            <div>
                                <dt>Téléphone</dt>
                                <dd>{p.record.patient?.phone || "—"}</dd>
                            </div>
                            {p.record.patient?.email && (
                                <div>
                                    <dt>E-mail</dt>
                                    <dd>{p.record.patient.email}</dd>
                                </div>
                            )}
                        </dl>
                    </section>

                    <section className="invoice-party invoice-file-details">
                        <span className="invoice-section-label">Dossier</span>
                        <div className="invoice-accession">
                            <span>{accessionNumber}</span>
                            <div
                                className="barcode"
                                dangerouslySetInnerHTML={{
                                    __html: p.barcode,
                                }}
                            />
                        </div>
                        <dl>
                            <div>
                                <dt>Date du dossier</dt>
                                <dd>{date(p.record.created_at)}</dd>
                            </div>
                            <div>
                                <dt>Analyses</dt>
                                <dd>{p.lines.length}</dd>
                            </div>
                        </dl>
                    </section>
                </div>

                <section className="invoice-items">
                    <div className="invoice-items-heading">
                        <div>
                            <span className="invoice-section-label">
                                Détail
                            </span>
                            <h3>Analyses facturées</h3>
                        </div>
                        <span>
                            {p.lines.length} prestation
                            {p.lines.length > 1 ? "s" : ""}
                        </span>
                    </div>
                    <div className="table-scroll">
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th className="invoice-line-number">#</th>
                                    <th>Analyse / prestation</th>
                                    <th>Catégorie</th>
                                    <th className="right">Qté</th>
                                    <th className="right">Prix unitaire</th>
                                    <th className="right">Montant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {p.lines.map((line, index) => (
                                    <tr key={line.id}>
                                        <td className="invoice-line-number">
                                            {index + 1}
                                        </td>
                                        <td>
                                            <strong>
                                                {line.test_name ||
                                                    "Analyse archivée"}
                                            </strong>
                                            {line.group_name && (
                                                <small>{line.group_name}</small>
                                            )}
                                        </td>
                                        <td>{line.category_name || "—"}</td>
                                        <td className="right">1</td>
                                        <td className="right">
                                            {money(line.price)}
                                        </td>
                                        <td className="right">
                                            <strong>{money(line.price)}</strong>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="invoice-settlement">
                    <section className="invoice-payment-card">
                        <span className="invoice-section-label">Règlement</span>
                        <div className="invoice-payment-method">
                            {p.record.payment_method === "cash" ? (
                                <Banknote size={21} />
                            ) : (
                                <CreditCard size={21} />
                            )}
                            <div>
                                <small>Mode de règlement</small>
                                <strong>{paymentLabel}</strong>
                            </div>
                        </div>
                        <p>
                            Les montants affichés correspondent au dossier
                            enregistré à sa création.
                        </p>
                    </section>

                    <section
                        className="invoice-summary"
                        aria-label="Récapitulatif financier"
                    >
                        <div>
                            <span>Sous-total des analyses</span>
                            <strong>{money(total)}</strong>
                        </div>
                        <div>
                            <span>Taxe configurée</span>
                            <strong>{taxRate.toLocaleString("fr-FR")} %</strong>
                        </div>
                        <div className="invoice-summary-total">
                            <span>Total du dossier</span>
                            <strong>{money(total)}</strong>
                        </div>
                        <div>
                            <span>Montant versé</span>
                            <strong className="invoice-paid-value">
                                − {money(paid)}
                            </strong>
                        </div>
                        <div className="invoice-summary-balance">
                            <span>
                                {remaining < 0
                                    ? "Montant à rendre"
                                    : "Reste à payer"}
                            </span>
                            <strong>{money(Math.abs(remaining))}</strong>
                        </div>
                    </section>
                </div>

                <footer className="invoice-footer">
                    <div>
                        <ReceiptText size={18} />
                        <p>
                            <strong>Merci pour votre confiance.</strong>
                            <span>
                                Ce document est généré par le système de gestion
                                du laboratoire.
                            </span>
                        </p>
                    </div>
                    <p className="invoice-footer-notes">
                        {[
                            p.laboratory?.footer_title1,
                            p.laboratory?.footer_title2,
                            p.laboratory?.footer_title3,
                        ]
                            .filter(Boolean)
                            .join(" · ")}
                    </p>
                </footer>
            </section>

            <section className="panel form-panel invoice-payment-editor no-print">
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">GESTION DU PAIEMENT</span>
                        <h2>Mettre à jour le règlement</h2>
                        <p>
                            Indiquez le solde restant. Le montant versé sera
                            recalculé automatiquement.
                        </p>
                    </div>
                    <span
                        className={"invoice-status " + paymentState.className}
                    >
                        {paymentState.label}
                    </span>
                </div>
                <Form action={"/invoices/" + p.record.id} method="PUT">
                    <div className="inline-form">
                        <label className="field">
                            Nouveau solde restant
                            <input
                                type="number"
                                name="remaining_or_give"
                                min="0"
                                max={total}
                                step="0.01"
                                required
                                value={balance}
                                onChange={(event) =>
                                    setBalance(event.target.value)
                                }
                            />
                            <small className="field-help">
                                Maximum : {money(total)}
                            </small>
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
function TubeCounter({
    label,
    color,
    value,
    onChange,
    available,
    maximum = 100,
}) {
    const max = Math.max(0, Math.min(100, Number(maximum)));
    const update = (next) =>
        onChange(Math.max(0, Math.min(max, Number(next) || 0)));
    return (
        <div className={value > 0 ? "tube-counter selected" : "tube-counter"}>
            <span
                className="tube-counter-color"
                style={{ backgroundColor: color || "#d9ded6" }}
            />
            <div className="tube-counter-name">
                <strong>{label}</strong>
                <small>
                    {available === undefined
                        ? "Étiquette générique"
                        : available +
                          " disponible" +
                          (available > 1 ? "s" : "")}
                </small>
            </div>
            <div className="tube-stepper">
                <button
                    type="button"
                    aria-label={"Retirer une étiquette " + label}
                    disabled={value <= 0}
                    onClick={() => update(value - 1)}
                >
                    <Minus size={14} />
                </button>
                <input
                    type="number"
                    min="0"
                    max={max}
                    value={value}
                    aria-label={"Nombre d’étiquettes " + label}
                    onChange={(event) => update(event.target.value)}
                />
                <button
                    type="button"
                    aria-label={"Ajouter une étiquette " + label}
                    disabled={value >= max}
                    onClick={() => update(value + 1)}
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>
    );
}

export function BarcodePage() {
    const [copies, setCopies] = useState(1);
    const [tubeCopies, setTubeCopies] = useState({});
    const [labelFormat, setLabelFormat] = useState("50x25");
    const patient = p.record.patient;
    const accession = "LAB-" + String(p.record.id).padStart(6, "0");
    const analyses = p.lines
        .map((line) => line.test_name)
        .filter(Boolean)
        .join(" · ");
    const patientDetails = [
        patient?.date_of_birth ? "Né(e) " + date(patient.date_of_birth) : null,
        patient?.gender,
    ]
        .filter(Boolean)
        .join(" · ");
    const labels = [
        ...Array.from({ length: copies }, () => ({
            name: "Tube standard",
        })),
        ...p.stocks.flatMap((stock) =>
            Array.from({ length: tubeCopies[stock.id] || 0 }, () => ({
                name: stock.product_name,
                color: stock.product_color,
            })),
        ),
    ];
    const selectedTubeTypes = new Set(labels.map((label) => label.name)).size;

    return (
        <>
            <Heading>
                <Button
                    onClick={() => window.print()}
                    disabled={!labels.length}
                >
                    <Printer size={17} />
                    {t("Imprimer les étiquettes")}
                </Button>
            </Heading>
            <DocumentLinks />

            <div className="no-print">
                <PatientSummary />
                <div className="collection-workspace">
                    <div className="collection-main">
                        <section className="panel collection-card">
                            <header className="collection-card-head">
                                <span className="collection-step">1</span>
                                <span className="collection-icon">
                                    <CalendarDays size={19} />
                                </span>
                                <div>
                                    <h2>Enregistrer le prélèvement</h2>
                                    <p>
                                        Confirmez la date et faites avancer le
                                        dossier dans le workflow du laboratoire.
                                    </p>
                                </div>
                            </header>
                            <div className="collection-card-body">
                                <Form
                                    action={"/test/barcodes/" + p.record.id}
                                    method="PUT"
                                >
                                    <div className="form-grid">
                                        <Field
                                            field={{
                                                name: "test_status",
                                                label: t("Statut du dossier"),
                                                type: "select",
                                                options: statuses,
                                                required: true,
                                                help: "Choisissez En traitement après la collecte.",
                                            }}
                                            record={p.record}
                                        />
                                        <Field
                                            field={{
                                                name: "prelevement_date",
                                                label: t("Date du prélèvement"),
                                                type: "date",
                                                help: "Date utilisée dans la traçabilité et sur les étiquettes.",
                                            }}
                                            record={p.record}
                                        />
                                    </div>
                                    <div className="collection-form-footer">
                                        <span>
                                            <CheckCircle2 size={16} />
                                            Dossier {accession}
                                        </span>
                                        <Button>{t("Enregistrer")}</Button>
                                    </div>
                                </Form>
                            </div>
                        </section>

                        <section className="panel collection-card">
                            <header className="collection-card-head">
                                <span className="collection-step">2</span>
                                <span className="collection-icon">
                                    <TestTube2 size={19} />
                                </span>
                                <div>
                                    <h2>Préparer les tubes</h2>
                                    <p>
                                        Indiquez le nombre d’étiquettes à
                                        produire pour chaque type de tube.
                                    </p>
                                </div>
                            </header>
                            <div className="collection-card-body">
                                <div className="tube-counter-list">
                                    <TubeCounter
                                        label="Tube standard"
                                        value={copies}
                                        onChange={setCopies}
                                    />
                                    {p.stocks.map((stock) => {
                                        const available = Math.max(
                                            0,
                                            Number(stock.quantity) -
                                                Number(stock.quantity_used),
                                        );
                                        return (
                                            <TubeCounter
                                                key={stock.id}
                                                label={stock.product_name}
                                                color={stock.product_color}
                                                value={
                                                    tubeCopies[stock.id] || 0
                                                }
                                                available={available}
                                                maximum={available}
                                                onChange={(value) =>
                                                    setTubeCopies(
                                                        (current) => ({
                                                            ...current,
                                                            [stock.id]: value,
                                                        }),
                                                    )
                                                }
                                            />
                                        );
                                    })}
                                </div>
                                {!p.stocks.length && (
                                    <p className="collection-empty-stock">
                                        Aucun type de tube n’est enregistré dans
                                        le stock. L’étiquette standard reste
                                        disponible.
                                    </p>
                                )}
                            </div>
                        </section>

                        <section className="panel collection-card analyses-card">
                            <header className="collection-card-head">
                                <span className="collection-icon">
                                    <ClipboardList size={19} />
                                </span>
                                <div>
                                    <h2>Analyses demandées</h2>
                                    <p>
                                        {p.lines.length} analyse
                                        {p.lines.length > 1 ? "s" : ""} dans ce
                                        dossier.
                                    </p>
                                </div>
                            </header>
                            <div className="analysis-chip-list">
                                {p.lines.map((line) => (
                                    <span key={line.id}>
                                        {line.test_name || "Analyse archivée"}
                                    </span>
                                ))}
                            </div>
                        </section>
                    </div>

                    <aside className="panel print-setup-card">
                        <span className="collection-step">3</span>
                        <span className="print-setup-icon">
                            <Printer size={22} />
                        </span>
                        <h2>Contrôler & imprimer</h2>
                        <p>
                            Vérifiez la quantité et le format avant d’envoyer
                            les étiquettes à l’imprimante thermique.
                        </p>
                        <div className="print-metrics">
                            <div>
                                <strong>{labels.length}</strong>
                                <span>
                                    étiquette
                                    {labels.length > 1 ? "s" : ""}
                                </span>
                            </div>
                            <div>
                                <strong>{selectedTubeTypes}</strong>
                                <span>
                                    type
                                    {selectedTubeTypes > 1 ? "s" : ""} de tube
                                </span>
                            </div>
                        </div>
                        <label className="field print-format-field">
                            Format thermique
                            <select
                                value={labelFormat}
                                onChange={(event) =>
                                    setLabelFormat(event.target.value)
                                }
                            >
                                <option value="50x25">
                                    50 × 25 mm · tube standard
                                </option>
                                <option value="50x30">
                                    50 × 30 mm · informations étendues
                                </option>
                            </select>
                        </label>
                        <Button
                            className="full"
                            type="button"
                            disabled={!labels.length}
                            onClick={() => window.print()}
                        >
                            <Printer size={17} />
                            Imprimer {labels.length || ""} étiquette
                            {labels.length > 1 ? "s" : ""}
                        </Button>
                        <div className="thermal-checklist">
                            <span>
                                <CheckCircle2 size={14} /> Échelle 100 %
                            </span>
                            <span>
                                <CheckCircle2 size={14} /> Marges désactivées
                            </span>
                            <span>
                                <CheckCircle2 size={14} /> Une étiquette par
                                tube
                            </span>
                        </div>
                    </aside>
                </div>
            </div>

            <section className="label-preview-section">
                <header className="label-preview-head no-print">
                    <div>
                        <span className="eyebrow">APERÇU THERMIQUE</span>
                        <h2>Étiquettes prêtes à imprimer</h2>
                        <p>
                            Le rendu ci-dessous respecte le format sélectionné.
                        </p>
                    </div>
                    <span className="label-preview-count">
                        {labels.length} étiquette
                        {labels.length > 1 ? "s" : ""}
                    </span>
                </header>
                <div className={"labels labels-" + labelFormat}>
                    {labels.map((label, index) => (
                        <div
                            className="barcode-label"
                            key={label.name + "-" + index}
                        >
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
                            <div className="tube-patient">{name(patient)}</div>
                            <div className="tube-meta">
                                <span>
                                    {patientDetails || "Identité à vérifier"}
                                </span>
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
                    {!labels.length && (
                        <div className="label-preview-empty no-print">
                            <TestTube2 size={27} />
                            <strong>Aucune étiquette sélectionnée</strong>
                            <span>
                                Ajoutez au moins un tube pour préparer
                                l’impression.
                            </span>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
