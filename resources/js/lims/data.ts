import {
    LayoutDashboard,
    Users,
    FlaskConical,
    ClipboardList,
    FileText,
    SlidersHorizontal,
    Package,
    MessageCircle,
    Mail,
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

let csrfRefresh: Promise<string> | null = null;

export function refreshCsrfToken(): Promise<string> {
    if (csrfRefresh) return csrfRefresh;

    csrfRefresh = fetch("/csrf-token", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store",
    })
        .then(async (response) => {
            if (!response.ok) throw new Error("Unable to refresh CSRF token");
            const data = await response.json();
            if (!data.token) throw new Error("Missing CSRF token");
            p.csrf = data.token;
            document
                .querySelector('meta[name="csrf-token"]')
                ?.setAttribute("content", data.token);
            document
                .querySelectorAll('input[name="_token"]')
                .forEach((input) => {
                    (input as HTMLInputElement).value = data.token;
                });
            return data.token as string;
        })
        .finally(() => {
            csrfRefresh = null;
        });

    return csrfRefresh;
}

export async function csrfFetch(
    input: RequestInfo | URL,
    init: RequestInit = {},
): Promise<Response> {
    const request = (token: string) => {
        const headers = new Headers(init.headers);
        headers.set("X-CSRF-TOKEN", token);
        if (init.body instanceof FormData && init.body.has("_token")) {
            init.body.set("_token", token);
        }
        return fetch(input, {
            ...init,
            headers,
            credentials: init.credentials || "same-origin",
        });
    };

    let response = await request(p.csrf);
    if (response.status === 419) {
        response = await request(await refreshCsrfToken());
    }
    return response;
}
export const statuses = {
    0: "Devis",
    1: "À prélever",
    2: "En traitement",
    3: "Prêt",
};
export const currencyLabel = (currency?: string | null) => {
    const code = String(currency || "MAD").trim().toUpperCase();
    return code === "MAD" ? "DH" : code;
};
export const money = (value: string | number | null | undefined) =>
    `${Number(value || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencyLabel(p.currency)}`;
export const date = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString("fr-FR") : "—";
export const name = (patient?: Patient | null) =>
    patient ? `${patient.firstname} ${patient.lastname}` : "Patient supprimé";
export const checked = (value: unknown) =>
    value === true || value === "true" || value === "1" || value === 1;
export const can = (permission?: string) =>
    !permission ||
    (p.permissions as string[] | undefined)?.includes(permission);
type NavigationItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    permission?: string;
    children?: NavigationItem[];
};
export const navigationSections: {
    label: string;
    hideLabel?: boolean;
    items: NavigationItem[];
}[] = [
    {
        label: "Activité",
        hideLabel: true,
        items: [
            {
                label: "Vue d’ensemble",
                href: "/dashboard",
                icon: LayoutDashboard,
                permission: "dashboard.view",
            },
        ],
    },
    {
        label: "Laboratoire",
        items: [
            {
                label: "Patients",
                href: "/patients",
                icon: Users,
                permission: "patients.manage",
            },
            {
                label: "Sample",
                href: "/sample-collection",
                icon: FlaskConical,
                permission: "collection.manage",
            },
            {
                label: "Résultats",
                href: "/results",
                icon: ClipboardList,
                permission: "results.manage",
            },
            {
                label: "Factures",
                href: "/invoices",
                icon: FileText,
                permission: "invoices.manage",
            },
        ],
    },
    {
        label: "Gestion",
        items: [
            {
                label: "Tests",
                href: "/prices",
                icon: SlidersHorizontal,
                permission: "catalog.manage",
                children: [
                    {
                        label: "Catalogue & tarifs",
                        href: "/prices",
                        icon: SlidersHorizontal,
                        permission: "catalog.manage",
                    },
                    {
                        label: "Groupes",
                        href: "/groups",
                        icon: ClipboardList,
                        permission: "catalog.manage",
                    },
                    {
                        label: "Catégories",
                        href: "/categories",
                        icon: ClipboardList,
                        permission: "catalog.manage",
                    },
                ],
            },
            {
                label: "Stocks",
                href: "/stocks",
                icon: Package,
                permission: "inventory.manage",
            },
            {
                label: "Chat interne",
                href: "/chat",
                icon: MessageCircle,
                permission: "chat.use",
            },
            {
                label: "Messagerie",
                href: "/email",
                icon: Mail,
                permission: "email.send",
            },
            {
                label: "Équipe",
                href: "/staff",
                icon: Users,
                permission: "staff.manage",
            },
        ],
    },
];
