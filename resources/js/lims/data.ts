import {
    LayoutDashboard,
    Users,
    FlaskConical,
    ClipboardList,
    FileText,
    SlidersHorizontal,
    Barcode,
    Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
export interface Patient {
    id: number;
    firstname: string;
    lastname: string;
    id_card?: string;
    date_of_birth?: string;
    email?: string;
    phone?: string;
    gender?: string;
}
export interface LaboratoryOrder {
    id: number;
    patient_id: number;
    patient: Patient;
    total_price: string;
    paid_amount: string;
    remaining_or_give: string;
    payment_method: string;
    test_status: string;
    prelevement_date?: string;
    created_at: string;
}
export interface PageEnvelope {
    screen: string;
    title: string;
    locale: string;
    dictionary: Record<string, string>;
    csrf: string;
    currency: string;
    errors: Record<string, string[]>;
    old: Record<string, unknown>;
    theme?: Record<string, string> | null;
    [key: string]: unknown;
}
const element = document.getElementById("lims-data");
if (!element?.textContent) throw new Error("Missing Laravel page data");
export const p: PageEnvelope = JSON.parse(element.textContent);
export function replacePage(next: PageEnvelope): void {
    for (const key of Object.keys(p)) delete p[key];
    Object.assign(p, next);
    window.dispatchEvent(new CustomEvent("lims:page", { detail: next }));
}
export const statuses = {
    0: "Devis",
    1: "À prélever",
    2: "En traitement",
    3: "Prêt",
};
export const money = (value: string | number | null | undefined) =>
    `${Number(value || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${p.currency}`;
export const date = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString("fr-FR") : "—";
export const name = (patient?: Patient | null) =>
    patient ? `${patient.firstname} ${patient.lastname}` : "Patient supprimé";
export const checked = (value: unknown) =>
    value === true || value === "true" || value === "1" || value === 1;
type NavigationItem = [string, string, LucideIcon];
export const navigationSections: {
    label: string;
    items: NavigationItem[];
}[] = [
    {
        label: "Activité",
        items: [["Vue d’ensemble", "/dashboard", LayoutDashboard]],
    },
    {
        label: "Laboratoire",
        items: [
            ["Patients", "/patients", Users],
            ["Dossiers d’analyses", "/tests", FlaskConical],
            ["Prélèvements", "/all-barcodes", Barcode],
            ["Résultats", "/results", ClipboardList],
            ["Factures", "/invoices", FileText],
        ],
    },
    {
        label: "Gestion",
        items: [
            ["Catalogue & tarifs", "/prices", SlidersHorizontal],
            ["Groupes", "/groups", ClipboardList],
            ["Catégories", "/categories", ClipboardList],
            ["Stocks", "/stocks", Package],
            ["Équipe", "/staff", Users],
        ],
    },
];
