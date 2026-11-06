import { t } from "./i18n";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Plus, Users } from "lucide-react";
import { p, replacePage } from "./data";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import "./style.css";
import { Layout } from "./Layout";
import { Heading, Empty } from "./components";
import { Dashboard } from "./Dashboard";
import { ResourceList, ResourceForm } from "./ResourceForms";
import { ListPage } from "./Resources";
import { OrderForm, PatientSelector } from "./Orders";
import { Results, Invoice, Report, BarcodePage } from "./Documents";
import {
    SettingsPage,
    SettingsForm,
    SettingsInfo,
    Profile,
    Languages,
    LanguageEditor,
} from "./Settings";
import { Auth } from "./Auth";
import { StaffForm, StaffPage } from "./Staff";
import { PatientPortal } from "./PatientPortal";
import { Mailbox } from "./Mailbox";
import { Chat } from "./Chat";
function applyPageAppearance() {
    document.documentElement.dir = p.dictionary?.dir === "rtl" ? "rtl" : "ltr";
    document.title = `${p.title} · Tahlila`;
    if (!p.theme) return;
    for (const [property, field] of Object.entries({
        "--green": "primary_color",
        "--lime": "secondary_color",
        "--muted": "font_color",
        "--font": "font_color",
        "--background": "background_color",
        "--tertiary": "tertiary_color",
        "--neutral": "neutral_color",
        "--success": "success_color",
        "--info": "info_color",
        "--warning": "warning_color",
        "--error": "error_color",
    })) {
        if (/^#[\da-f]{6}([\da-f]{2})?$/i.test(p.theme[field] || ""))
            document.documentElement.style.setProperty(
                property,
                p.theme[field],
            );
    }
}
applyPageAppearance();
function Content() {
    if (p.kind === "form" && p.resource === "settings") return <SettingsForm />;
    if (p.kind === "form") return <ResourceForm />;
    if (p.kind === "resource") return <ResourceList />;
    if (p.kind === "info") return <SettingsInfo />;
    switch (p.screen) {
        case "dashboard":
            return <Dashboard />;
        case "tests":
        case "results":
        case "invoices":
        case "all-barcodes":
        case "patient-history":
            return <ListPage />;
        case "order":
            return <OrderForm />;
        case "patient-select":
            return <PatientSelector />;
        case "result":
            return <Results />;
        case "invoice":
            return <Invoice />;
        case "report":
            return <Report />;
        case "barcode":
            return <BarcodePage />;
        case "settings":
            return <SettingsPage />;
        case "profile":
            return <Profile />;
        case "languages":
            return <Languages />;
        case "language":
            return <LanguageEditor />;
        case "newtest":
            return (
                <>
                    <Heading />
                    <div className="new-test-options">
                        <a
                            className="panel setting-card"
                            href="/patients/create"
                        >
                            <span className="round-icon">
                                <Plus />
                            </span>
                            <h2>{t("Nouveau patient")}</h2>
                            <p>
                                Créer sa fiche, puis sélectionner ses analyses.
                            </p>
                            <ArrowRight />
                        </a>
                        <a className="panel setting-card" href="/tests/create">
                            <span className="round-icon">
                                <Users />
                            </span>
                            <h2>{t("Patient d\xE9j\xE0 enregistr\xE9")}</h2>
                            <p>
                                Retrouver un patient et ouvrir un nouveau
                                dossier.
                            </p>
                            <ArrowRight />
                        </a>
                    </div>
                </>
            );
        case "staff":
            return <StaffPage />;
        case "chat":
            return <Chat />;
        case "email":
            return <Mailbox />;
        case "staff.create":
        case "staff.edit":
            return <StaffForm />;
        default:
            return <Empty />;
    }
}
function SpaApplication() {
    const location = useLocation();
    const navigate = useNavigate();
    const firstRender = useRef(true);
    const consumedPageStates = useRef(new Set());
    const [revision, setRevision] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        const refresh = () => setRevision((value) => value + 1);
        window.addEventListener("lims:page", refresh);
        return () => window.removeEventListener("lims:page", refresh);
    }, []);

    const handleInternalLink = (event) => {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        )
            return;
        const anchor = event.target.closest("a[href]");
        if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
        const url = new URL(anchor.href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (
            url.hash &&
            url.pathname === location.pathname &&
            url.search === location.search
        )
            return;
        event.preventDefault();
        navigate(url.pathname + url.search + url.hash);
    };

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        if (
            location.state?.page &&
            !consumedPageStates.current.has(location.key)
        ) {
            consumedPageStates.current.add(location.key);
            replacePage(location.state.page);
            applyPageAppearance();
            window.scrollTo({ top: 0, behavior: "auto" });
            return;
        }

        const abort = new AbortController();
        setLoading(true);
        setLoadError("");
        fetch(
            `/api/lims${location.pathname === "/" ? "/" : location.pathname}${location.search}`,
            {
                credentials: "same-origin",
                signal: abort.signal,
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            },
        )
            .then(async (response) => {
                if (response.status === 401) {
                    navigate(
                        location.pathname.startsWith("/patient")
                            ? "/patient/login"
                            : "/login",
                        { replace: true },
                    );
                    return null;
                }
                if (!response.ok) {
                    const body = await response.json().catch(() => ({}));
                    throw new Error(
                        body.message || "Cette page ne peut pas être chargée.",
                    );
                }
                return response.json();
            })
            .then((page) => {
                if (!page) return;
                replacePage(page);
                applyPageAppearance();
                window.scrollTo({ top: 0, behavior: "auto" });
            })
            .catch((error) => {
                if (error.name !== "AbortError") setLoadError(error.message);
            })
            .finally(() => {
                if (!abort.signal.aborted) setLoading(false);
            });
        return () => abort.abort();
    }, [location.pathname, location.search, location.state, navigate]);

    return (
        <>
            {loading && <div className="spa-progress" role="progressbar" />}
            {loadError && (
                <div className="spa-load-error" role="alert">
                    {loadError}
                    <button onClick={() => window.location.reload()}>
                        Réessayer
                    </button>
                </div>
            )}
            <div
                className={
                    loading ? "spa-content spa-content-loading" : "spa-content"
                }
                onClickCapture={handleInternalLink}
            >
                {p.screen.startsWith("patient.") ? (
                    <PatientPortal key={`${p.path}:${revision}`} />
                ) : p.screen.startsWith("auth.") ? (
                    <Auth key={`${p.path}:${revision}`} />
                ) : (
                    <Layout>
                        <Content key={p.path} />
                    </Layout>
                )}
            </div>
        </>
    );
}

createRoot(document.getElementById("lims")).render(
    <BrowserRouter>
        <SpaApplication />
    </BrowserRouter>,
);
