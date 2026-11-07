import { t } from "./i18n";
import { useEffect, useRef, useState } from "react";
import {
    AlertTriangle,
    Banknote,
    Building2,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    CreditCard,
    Download,
    FileText,
    Mail,
    MapPin,
    Minus,
    Phone,
    Plus,
    Printer,
    ReceiptText,
    Send,
    X,
    TestTube2,
} from "lucide-react";
import { csrfFetch, p, statuses, money, date, name, checked, can } from "./data";
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
                <a href={`/sample-collection/${p.record.id}`}>
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

function AutoSaveResultForm({ action, children, onValuesChange }) {
    const formRef = useRef(null);
    const timerRef = useRef(null);
    const requestRef = useRef(0);
    const [status, setStatus] = useState("");

    useEffect(
        () => () => {
            window.clearTimeout(timerRef.current);
        },
        [],
    );

    const save = async () => {
        if (!formRef.current) return;

        const requestId = ++requestRef.current;
        setStatus("saving");
        try {
            const response = await csrfFetch(action, {
                method: "POST",
                body: new FormData(formRef.current),
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            });
            if (!response.ok) throw new Error("Auto-save failed");
            if (requestId === requestRef.current) setStatus("saved");
        } catch {
            if (requestId === requestRef.current) setStatus("error");
        }
    };

    const scheduleSave = (event) => {
        if (!event.target.matches("input, textarea, select")) return;
        onValuesChange?.();
        window.clearTimeout(timerRef.current);
        setStatus("waiting");
        timerRef.current = window.setTimeout(save, 700);
    };

    return (
        <Form
            action={action}
            method="PUT"
            formRef={formRef}
            data-result-form="true"
            onInput={scheduleSave}
            onSubmitCapture={() => window.clearTimeout(timerRef.current)}
        >
            {children}
            <span
                className={`result-autosave-status ${status}`}
                role="status"
                aria-live="polite"
            >
                {status === "waiting" || status === "saving"
                    ? t("Enregistrement automatique…")
                    : status === "saved"
                      ? t("Enregistré automatiquement")
                      : status === "error"
                        ? t("Échec de l’enregistrement automatique. Utilisez le bouton Enregistrer.")
                        : ""}
            </span>
        </Form>
    );
}

export function Results() {
    const isReady = String(p.record.test_status) === "3";
    const initialResultsComplete =
        p.lines.length > 0 &&
        p.lines.every(
            (line) =>
                String(line.test_result_value ?? "").trim() !== "" &&
                (!line.test_unit_2 ||
                    String(line.test_result_value_2 ?? "").trim() !== ""),
        );
    const [allResultsTyped, setAllResultsTyped] = useState(
        initialResultsComplete,
    );
    const [selectedStatus, setSelectedStatus] = useState(
        String(p.record.test_status),
    );
    const refreshResultsCompletion = () => {
        const forms = Array.from(
            document.querySelectorAll('[data-result-form="true"]'),
        );
        setAllResultsTyped(
            forms.length > 0 &&
                forms.every((form) => {
                    const primary = form.querySelector(
                        '[name="test_result_value"]',
                    );
                    const secondary = form.querySelector(
                        '[name="test_result_value_2"]',
                    );
                    return (
                        String(primary?.value ?? "").trim() !== "" &&
                        (!secondary ||
                            String(secondary.value ?? "").trim() !== "")
                    );
                }),
        );
    };
    const shouldPromptReadyStatus =
        allResultsTyped && selectedStatus !== "3";

    return (
        <>
            <Heading>
                <Button
                    href={isReady ? `/print/result/${p.record.id}` : undefined}
                    disabled={!isReady}
                    title={!isReady ? t("Le statut doit être Prêt pour consulter le rapport.") : undefined}
                >
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
                            <AutoSaveResultForm
                                action={`/results/${line.id}`}
                                onValuesChange={refreshResultsCompletion}
                            >
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
                            </AutoSaveResultForm>
                        </section>
                    ))}
                </div>
                <aside>
                    {can("collection.manage") && (
                        <section className="panel form-panel">
                            <h2>{t("Statut des analyses")}</h2>
                            <Form
                                action={`/sample-collection/${p.record.id}/status`}
                                method="PUT"
                            >
                                <input
                                    type="hidden"
                                    name="return_to"
                                    value="results"
                                />
                                <div
                                    className={
                                        shouldPromptReadyStatus
                                            ? "status-ready-control status-ready-prompt"
                                            : "status-ready-control"
                                    }
                                >
                                    <Field
                                        field={{
                                            name: "test_status",
                                            label: t("Statut du dossier"),
                                            type: "select",
                                            options: statuses,
                                            onChange: (event) =>
                                                setSelectedStatus(
                                                    event.target.value,
                                                ),
                                        }}
                                        record={p.record}
                                    />
                                </div>
                                <Button className="full">
                                    {t("Mettre \xE0 jour")}
                                </Button>
                            </Form>
                            <Button
                                secondary
                                className="full"
                                href={isReady ? `/print/result/${p.record.id}` : undefined}
                                disabled={!isReady}
                                title={!isReady ? t("Le statut doit être Prêt pour consulter le rapport.") : undefined}
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
    const printInvoice = (mode) => {
        const root = document.documentElement;
        const previousPrintStyle = document.getElementById(
            "invoice-print-page-size",
        );
        previousPrintStyle?.remove();

        const printStyle = document.createElement("style");
        printStyle.id = "invoice-print-page-size";
        const thermalPageHeight = Math.max(
            150,
            Math.min(1000, 145 + p.lines.length * 10),
        );
        printStyle.textContent =
            mode === "thermal"
                ? `@page { size: 80mm ${thermalPageHeight}mm; margin: 3mm; }`
                : "@page { size: A4 portrait; margin: 12mm; }";
        document.head.appendChild(printStyle);
        root.dataset.invoicePrint = mode;
        window.addEventListener(
            "afterprint",
            () => {
                delete root.dataset.invoicePrint;
                printStyle.remove();
            },
            { once: true },
        );
        window.print();
    };

    return (
        <>
            <Heading>
                <div className="invoice-print-actions">
                    <Button
                        secondary
                        className="invoice-thermal-print-button"
                        onClick={() => printInvoice("thermal")}
                    >
                        <ReceiptText size={17} />
                        {t("Impression thermique")}
                    </Button>
                    <Button
                        className="invoice-print-button"
                        onClick={() => printInvoice("a4")}
                    >
                        <Printer size={18} />
                        {t("Imprimer / PDF")}
                    </Button>
                </div>
            </Heading>
            <DocumentLinks />

            <section className="panel document invoice-document print-document">
                <header className="invoice-header">
                    <div className="invoice-brand">
                        <div className="invoice-brand-mark">
                            {p.laboratory?.logo_url ? (
                                <img
                                    className="laboratory-logo"
                                    src={p.laboratory.logo_url}
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

            <section className="thermal-receipt" aria-label={t("Reçu thermique")}>
                <header className="thermal-receipt-header">
                    {p.laboratory?.logo_url && (
                        <img
                            src={p.laboratory.logo_url}
                            alt={p.laboratory.laboratory_name || "Laboratoire"}
                        />
                    )}
                    <strong>{p.laboratory?.laboratory_name || "Laboratoire"}</strong>
                    {p.laboratory?.address && <span>{p.laboratory.address}</span>}
                    {p.laboratory?.phone && <span>{p.laboratory.phone}</span>}
                </header>
                <div className="thermal-receipt-title">
                    <strong>{isQuote ? "DEVIS" : "FACTURE"}</strong>
                    <span>{invoiceNumber}</span>
                    <small>{date(p.record.created_at)}</small>
                </div>
                <dl className="thermal-receipt-meta">
                    <div><dt>Patient</dt><dd>{name(p.record.patient)}</dd></div>
                    <div><dt>Dossier</dt><dd>{accessionNumber}</dd></div>
                    <div><dt>Règlement</dt><dd>{paymentLabel}</dd></div>
                </dl>
                <div className="thermal-receipt-lines">
                    {p.lines.map((line) => (
                        <div key={line.id}>
                            <span>{line.test_name || "Analyse archivée"}</span>
                            <strong>{money(line.price)}</strong>
                        </div>
                    ))}
                </div>
                <div className="thermal-receipt-totals">
                    <div><span>Total</span><strong>{money(total)}</strong></div>
                    <div><span>Versé</span><strong>{money(paid)}</strong></div>
                    <div className="thermal-receipt-balance">
                        <span>{remaining < 0 ? "À rendre" : "Reste"}</span>
                        <strong>{money(Math.abs(remaining))}</strong>
                    </div>
                </div>
                <div
                    className="thermal-receipt-barcode"
                    dangerouslySetInnerHTML={{ __html: p.barcode }}
                />
                <footer>
                    <strong>Merci pour votre confiance.</strong>
                    <span>{invoiceNumber}</span>
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
    const [emailOpen, setEmailOpen] = useState(false);
    const [emailBusy, setEmailBusy] = useState(false);
    const [emailNotice, setEmailNotice] = useState("");
    const [email, setEmail] = useState(p.record.patient?.email || "");
    const [subject, setSubject] = useState(`Rapport d’analyses · Dossier #${p.record.id}`);
    const [message, setMessage] = useState(
        `Bonjour ${name(p.record.patient)},\n\nVeuillez trouver votre rapport d’analyses en pièce jointe.\n\nCordialement,\n${p.laboratory?.laboratory_name || "Le laboratoire"}`,
    );
    const isReady = String(p.record.test_status) === "3";
    const hasAllResults =
        p.lines.length > 0 &&
        p.lines.every(
            (line) =>
                String(line.test_result_value ?? "").trim() !== "" &&
                (!line.test_unit_2 ||
                    String(line.test_result_value_2 ?? "").trim() !== ""),
        );
    const reportLocked = !isReady || !hasAllResults;
    const sendReportEmail = async (event) => {
        event.preventDefault();
        setEmailBusy(true);
        setEmailNotice("");
        try {
            const response = await csrfFetch(`/reports/${p.record.id}/email`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ to: email, subject, message }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || "Envoi impossible.");
            setEmailNotice(data.message || "Rapport envoyé avec succès.");
            setTimeout(() => setEmailOpen(false), 1200);
        } catch (error) {
            setEmailNotice(error.message || "Envoi impossible.");
        } finally {
            setEmailBusy(false);
        }
    };

    return (
        <>
            <Heading>
                <div className="report-actions">
                    {can("email.send") && (
                        <Button secondary disabled={reportLocked} onClick={() => setEmailOpen(true)}>
                            <Send size={16} /> {t("Envoyer par e-mail")}
                        </Button>
                    )}
                    <Button
                        secondary
                        href={reportLocked ? undefined : `/reports/${p.record.id}/pdf`}
                        download={`rapport-${p.record.id}.pdf`}
                        disabled={reportLocked}
                    >
                        <Download size={16} /> {t("Télécharger")}
                    </Button>
                    <Button disabled={reportLocked} onClick={() => window.print()}>{t("Imprimer / PDF")}</Button>
                </div>
            </Heading>
            <DocumentLinks />
            <section className={`panel document report-document print-document${reportLocked ? " report-content-locked" : ""}`}>
                <div className="document-head">
                    {p.laboratory?.logo_url && (
                        <img
                            className="laboratory-logo"
                            src={p.laboratory.logo_url}
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
            {!reportLocked && <ResultNotification />}
            {reportLocked && (
                <div className="confirm-backdrop report-lock-backdrop" role="presentation">
                    <section
                        className="confirm-dialog report-lock-dialog"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="report-lock-title"
                    >
                        <span className="confirm-dialog-icon">
                            <AlertTriangle size={20} />
                        </span>
                        <div>
                            <h2 id="report-lock-title">{t("Rapport indisponible")}</h2>
                            {!hasAllResults && (
                                <p>{t("Saisissez tous les résultats avant de consulter le rapport.")}</p>
                            )}
                            {!isReady && (
                                <p>{t("Le statut du dossier doit être Prêt.")}</p>
                            )}
                        </div>
                        <div className="confirm-dialog-actions">
                            <Button href={`/tests/${p.record.id}`}>
                                {t("Retour aux résultats")}
                            </Button>
                        </div>
                    </section>
                </div>
            )}
            {emailOpen && (
                <div className="confirm-backdrop report-email-backdrop" role="presentation">
                    <section className="panel report-email-modal" role="dialog" aria-modal="true" aria-labelledby="report-email-title">
                        <header>
                            <div>
                                <span className="eyebrow">{t("PARTAGER LE RAPPORT")}</span>
                                <h2 id="report-email-title">{t("Envoyer le rapport par e-mail")}</h2>
                            </div>
                            <button type="button" className="icon-button" aria-label={t("Fermer")} onClick={() => setEmailOpen(false)}><X size={17} /></button>
                        </header>
                        <form onSubmit={sendReportEmail}>
                            <label className="field">
                                {t("Adresse e-mail")}
                                <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="patient@example.com" />
                                <small className="field-help">{p.record.patient?.email ? t("L’adresse du patient est préremplie.") : t("Vous pouvez saisir une autre adresse.")}</small>
                            </label>
                            <label className="field">{t("Objet")}<input required value={subject} onChange={(event) => setSubject(event.target.value)} /></label>
                            <label className="field">{t("Message")}<textarea required rows="6" value={message} onChange={(event) => setMessage(event.target.value)} /></label>
                            <p className="report-email-attachment"><FileText size={16} /> {t("Le rapport PDF sera joint automatiquement.")}</p>
                            {emailNotice && <p className="alert-inline success" role="status">{emailNotice}</p>}
                            <div className="confirm-dialog-actions">
                                <Button type="button" secondary onClick={() => setEmailOpen(false)}>{t("Annuler")}</Button>
                                <Button disabled={emailBusy}><Send size={15} /> {emailBusy ? t("Envoi…") : t("Envoyer")}</Button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
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
                            const res = await csrfFetch("/send-test-result-email", {
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
                {notice && (
                    <p className="alert-inline success" role="status">
                        {notice}
                    </p>
                )}
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
    const savedTubeCopies = p.record.tube_copies || {};
    const [copies, setCopies] = useState(Number(savedTubeCopies.standard || 1));
    const [tubeCopies, setTubeCopies] = useState(() =>
        Object.fromEntries(
            Object.entries(savedTubeCopies)
                .filter(([key]) => key !== "standard")
                .map(([key, value]) => [key, Number(value) || 0]),
        ),
    );
    const [labelFormat, setLabelFormat] = useState(
        p.record.tube_label_format || "50x25",
    );
    const [collectionDate, setCollectionDate] = useState(
        p.record.prelevement_date
            ? String(p.record.prelevement_date).slice(0, 10)
            : "",
    );
    const collectionDateLocked = Boolean(p.record.prelevement_date);
    const [printSaving, setPrintSaving] = useState(false);
    const [printError, setPrintError] = useState("");
    const [saveState, setSaveState] = useState("idle");
    const formRef = useRef(null);
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

    const savePrintSettingsAndPrint = async () => {
        setPrintSaving(true);
        setPrintError("");
        try {
            const response = await csrfFetch(
                `/sample-collection/${p.record.id}/print-settings`,
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": p.csrf,
                    },
                    body: JSON.stringify({
                        tube_copies: {
                            standard: copies,
                            ...tubeCopies,
                        },
                        tube_label_format: labelFormat,
                        prelevement_date: collectionDate || null,
                    }),
                },
            );
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(
                    data.message || "Paramètres d’impression non enregistrés.",
                );
            }
            const data = await response.json();
            const printedCollectionDate = data.prelevement_date || collectionDate;
            p.record.prelevement_date = printedCollectionDate;
            setCollectionDate(printedCollectionDate);
            await new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
            );
            window.print();
        } catch (error) {
            setPrintError(error.message || "Enregistrement impossible.");
        } finally {
            setPrintSaving(false);
        }
    };

    const saveCollection = async (event) => {
        event.preventDefault();
        if (saveState === "saving") return;
        setSaveState("saving");
        try {
            const form = event.currentTarget;
            const response = await csrfFetch(form.action, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": p.csrf,
                },
                body: new FormData(form),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || "Enregistrement impossible.");
            }
            if (data.test?.prelevement_date) {
                const savedDate = String(data.test.prelevement_date).slice(0, 10);
                p.record.prelevement_date = savedDate;
                setCollectionDate(savedDate);
            }
            setSaveState("saved");
        } catch (error) {
            setSaveState(error.message || "Enregistrement impossible.");
        }
    };

    return (
        <>
            <Heading>
                <Button
                    onClick={savePrintSettingsAndPrint}
                    disabled={!labels.length || printSaving}
                >
                    <Printer size={17} />
                    {t("Imprimer les étiquettes")}
                </Button>
            </Heading>
            <DocumentLinks />

            <div className="no-print">
                <div className="collection-patient-row">
                    <PatientSummary />
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
                                    action={"/sample-collection/" + p.record.id}
                                    method="PUT"
                                    formRef={formRef}
                                    onSubmit={saveCollection}
                                >
                                    <div className="form-grid">
                                        <Field
                                            field={{
                                                name: "test_status",
                                                label: t("Statut du dossier"),
                                                type: "select",
                                                options: statuses,
                                                required: true,
                                                onChange: (event) =>
                                                    event.currentTarget.form?.requestSubmit(),
                                                help: "Choisissez En traitement après la collecte.",
                                            }}
                                            record={p.record}
                                        />
                                        <Field
                                            key={collectionDate || "empty-collection-date"}
                                            field={{
                                                name: "prelevement_date",
                                                label: t("Date du prélèvement"),
                                                type: "date",
                                                disabled: collectionDateLocked,
                                                readOnly: collectionDateLocked,
                                                onChange: (event) =>
                                                    setCollectionDate(
                                                        event.currentTarget.value,
                                                    ),
                                                help: collectionDateLocked
                                                    ? "Date enregistrée et verrouillée pour garantir la traçabilité."
                                                    : "Date utilisée dans la traçabilité et sur les étiquettes.",
                                            }}
                                            record={{
                                                ...p.record,
                                                prelevement_date: collectionDate,
                                            }}
                                        />
                                    </div>
                                    <div className="collection-form-footer">
                                        <span>
                                            <CheckCircle2 size={16} />
                                            Dossier {accession}
                                        </span>
                                        <span
                                            className="collection-save-status"
                                            role="status"
                                        >
                                            {saveState === "saving"
                                                ? "Enregistrement…"
                                                : saveState === "saved"
                                                  ? "Enregistré"
                                                  : saveState !== "idle"
                                                    ? saveState
                                                    : ""}
                                        </span>
                                        <Button
                                            disabled={saveState === "saving"}
                                        >
                                            {t("Enregistrer")}
                                        </Button>
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
                    </div>

                    <aside className="panel print-setup-card">
                        <span className="collection-step">3</span>
                        <div className="print-setup-heading">
                            <span className="print-setup-icon">
                                <Printer size={22} />
                            </span>
                            <div>
                                <h2>Contrôler & imprimer</h2>
                                <p>
                                    Vérifiez la quantité et le format avant
                                    d’envoyer les étiquettes à l’imprimante
                                    thermique.
                                </p>
                            </div>
                        </div>
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
                        {printError && (
                            <div className="alert-inline" role="alert">
                                {printError}
                            </div>
                        )}
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
                            onClick={savePrintSettingsAndPrint}
                        >
                            <Printer size={17} />
                            Imprimer {labels.length || ""} étiquette
                            {labels.length > 1 ? "s" : ""}
                        </Button>
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
                                    Prél. {date(collectionDate)}
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
