import { t } from "./i18n";
import { useState } from "react";
import { ArrowRight, Plus, Search, X } from "lucide-react";
import { p, statuses, money, name, checked } from "./data";
import { Button, Heading, Form, Field, Empty } from "./components";
let selectionSequence = 0;
export function OrderForm() {
    const initial = p.old._submitted
        ? p.lines.filter((l) =>
              (p.old.modifieds || []).map(String).includes(String(l.id)),
          )
        : p.lines;
    const [lines, setLines] = useState([
        ...initial.map((l) => ({
            ...l,
            keep: l.id,
            key: `old-${l.id}`,
        })),
        ...(p.old.tests || []).map((s, i) => {
            const [id, g, c] = s.split("*");
            return {
                ...p.catalogue.find((t) => String(t.id) === id),
                group_id: g,
                category_id: c,
                key: `new-${i}`,
            };
        }),
    ]);
    const [search, setSearch] = useState("");
    const [group, setGroup] = useState("");
    const [category, setCategory] = useState("");
    const [paid, setPaid] = useState(
        p.old.paid_amount ?? p.record?.paid_amount ?? 0,
    );
    const catalogue = p.catalogue.filter(
        (t) =>
            t.test_name.toLowerCase().includes(search.toLowerCase()) &&
            (!group || t.groups.some((g) => String(g.id) === group)) &&
            (!category || t.categories.some((c) => String(c.id) === category)),
    );
    const unchanged =
        p.record &&
        lines.length === p.lines.length &&
        lines.every((l) => l.keep);
    const total = unchanged
        ? Number(p.record.total_price)
        : lines.reduce((sum, l) => sum + Math.round(Number(l.price) * 100), 0) /
          100;
    const add = (test) =>
        setLines((current) =>
            current.some(
                (l) =>
                    String(l.price_id || l.id) === String(test.id) &&
                    String(l.group_id || "") === group &&
                    String(l.category_id || "") === category,
            )
                ? current
                : [
                      ...current,
                      {
                          ...test,
                          price_id: test.id,
                          group_id: group,
                          category_id: category,
                          key: `selection-${++selectionSequence}`,
                      },
                  ],
        );
    const options = Object.fromEntries(
        Object.entries({
            cash: t("Esp\xE8ces"),
            pos: t("Carte bancaire"),
            banktransfer: t("Virement"),
            cheque: t("Ch\xE8que"),
        }).filter(
            ([key]) =>
                checked(
                    p.payment?.[key === "banktransfer" ? "bank_transfer" : key],
                ) || p.record?.payment_method === key,
        ),
    );
    return (
        <>
            <Heading />
            <Form
                action={
                    p.record ? `/tests/${p.record.id}/edit` : "/tests/create"
                }
                method={p.record ? "PUT" : "POST"}
            >
                <div className="order-layout">
                    <div>
                        <section className="panel form-panel">
                            <div className="section-heading">
                                <h2>
                                    <span className="step">1</span>
                                    {t("Le patient")}
                                </h2>
                                <a href="/patients/create">Nouveau patient ↗</a>
                            </div>
                            <Field
                                field={{
                                    name: "patient_id",
                                    label: t("Patient"),
                                    type: "select",
                                    required: true,
                                    options: Object.fromEntries(
                                        p.patients.map((pt) => [
                                            pt.id,
                                            `${name(pt)} · ${pt.id_card}`,
                                        ]),
                                    ),
                                }}
                                record={{
                                    patient_id: p.selectedPatient,
                                }}
                            />
                        </section>
                        <section className="panel form-panel">
                            <h2>
                                <span className="step">2</span>
                                {t("Les analyses")}
                            </h2>
                            <div className="catalogue-filters">
                                <div className="search">
                                    <Search size={18} />
                                    <input
                                        aria-label="Rechercher une analyse"
                                        placeholder="Rechercher une analyse…"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                    />
                                </div>
                                <select
                                    aria-label="Groupe"
                                    value={group}
                                    onChange={(e) => setGroup(e.target.value)}
                                >
                                    <option value="">
                                        {t("Tous les groupes")}
                                    </option>
                                    {p.groups.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.group_name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    aria-label="Catégorie"
                                    value={category}
                                    onChange={(e) =>
                                        setCategory(e.target.value)
                                    }
                                >
                                    <option value="">
                                        {t("Toutes les cat\xE9gories")}
                                    </option>
                                    {p.categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {(group || category) && (
                                <Button
                                    secondary
                                    type="button"
                                    onClick={() => catalogue.forEach(add)}
                                >
                                    Ajouter cette sélection
                                </Button>
                            )}
                            <div className="catalogue">
                                {catalogue.map((test) => (
                                    <button
                                        key={test.id}
                                        type="button"
                                        onClick={() => add(test)}
                                    >
                                        <span>
                                            <strong>{test.test_name}</strong>
                                            <small>
                                                {test.test_description}
                                            </small>
                                        </span>
                                        <span>
                                            {money(test.price)}{" "}
                                            <Plus size={17} />
                                        </span>
                                    </button>
                                ))}
                                {!catalogue.length && (
                                    <Empty title="Aucune analyse trouvée." />
                                )}
                            </div>
                        </section>
                    </div>
                    <section className="panel summary-card">
                        <div className="section-heading">
                            <h2>{t("Votre dossier")}</h2>
                            <span className="count">{lines.length}</span>
                        </div>
                        {lines.map((line) => (
                            <div className="selected-line" key={line.key}>
                                <input
                                    type="hidden"
                                    name={line.keep ? "modifieds[]" : "tests[]"}
                                    value={
                                        line.keep ||
                                        `${line.price_id || line.id}*${line.group_id || "null"}*${line.category_id || "null"}`
                                    }
                                />
                                <div>
                                    <strong>
                                        {line.test_name || "Analyse archivée"}
                                    </strong>
                                    <small>{money(line.price)}</small>
                                </div>
                                <button
                                    type="button"
                                    className="icon-button"
                                    aria-label={`Retirer ${line.test_name}`}
                                    onClick={() =>
                                        setLines(
                                            lines.filter(
                                                (l) => l.key !== line.key,
                                            ),
                                        )
                                    }
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        {!lines.length && (
                            <p className="muted">
                                Ajoutez les analyses depuis le catalogue.
                            </p>
                        )}
                        <div className="total-line">
                            <span>{t("Total des analyses")}</span>
                            <strong>{money(total)}</strong>
                        </div>
                        <input
                            type="hidden"
                            name="total_price"
                            value={total.toFixed(2)}
                        />
                        <input
                            type="hidden"
                            name="remaining_or_give"
                            value={(total - Number(paid)).toFixed(2)}
                        />
                        <Field
                            field={{
                                name: "payment_method",
                                label: t("Mode de r\xE8glement"),
                                type: "select",
                                required: true,
                                options,
                            }}
                            record={p.record || {}}
                        />
                        <label className="field">
                            {t("Montant vers\xE9")}
                            <input
                                name="paid_amount"
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={paid}
                                onChange={(e) => setPaid(e.target.value)}
                            />
                        </label>
                        <div className="total-line">
                            <span>
                                {total - Number(paid) < 0
                                    ? t("\xC0 rendre")
                                    : t("Reste \xE0 payer")}
                            </span>
                            <strong>
                                {money(Math.abs(total - Number(paid)))}
                            </strong>
                        </div>
                        <Field
                            field={{
                                name: "test_status",
                                label: t("Statut"),
                                type: "select",
                                required: true,
                                options: statuses,
                            }}
                            record={
                                p.record || {
                                    test_status: "1",
                                }
                            }
                        />
                        <Button
                            type="submit"
                            disabled={!lines.length}
                            className="full"
                        >
                            {t("Enregistrer le dossier")}
                            <ArrowRight size={17} />
                        </Button>
                        <a className="cancel-link" href="/tests">
                            {t("Annuler")}
                        </a>
                    </section>
                </div>
            </Form>
        </>
    );
}
