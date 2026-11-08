import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronRight, Eye, EyeOff, Mail, Settings2, Sparkles, X } from "lucide-react";
import { csrfFetch } from "./data";
import { Button } from "./components";
import { t } from "./i18n";
import "./email-setup.css";

export function EmailSetupWizard({ modal = false, configured = false, successRedirect = "/email", onClose, onManual }) {
    const [form, setForm] = useState({ email: "", password: "", from_name: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");
    const timer = useRef(null);

    useEffect(() => () => window.clearInterval(timer.current), []);

    const submit = async (event) => {
        event.preventDefault();
        setStatus("working");
        setMessage("");
        setProgress(12);
        timer.current = window.setInterval(() => setProgress((value) => Math.min(value + (value < 55 ? 11 : 4), 88)), 260);
        try {
            const response = await csrfFetch("/setting/email/automatic", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ ...form, redirect: successRedirect }),
            });
            const body = await response.json();
            if (!response.ok) throw new Error(Object.values(body.errors || {}).flat()[0] || body.message || t("Configuration impossible."));
            window.clearInterval(timer.current);
            setProgress(100);
            setStatus("done");
            setMessage(`${body.provider} · SMTP ${body.smtp} · IMAP ${body.imap}`);
            window.setTimeout(() => { window.location.href = body.redirect || "/email"; }, 900);
        } catch (error) {
            window.clearInterval(timer.current);
            setProgress(0);
            setStatus("error");
            setMessage(error.message);
        }
    };

    const content = <section className={`email-setup-wizard ${modal ? "email-setup-dialog" : "panel"}`} role={modal ? "dialog" : undefined} aria-modal={modal || undefined} aria-labelledby="email-setup-title">
        <header>
            <span className="email-setup-icon"><Sparkles size={21}/></span>
            <div><span className="eyebrow">{t("CONFIGURATION AUTOMATIQUE")}</span><h2 id="email-setup-title">{configured ? t("Reconfigurer la messagerie") : t("Connecter votre messagerie")}</h2><p>{t("Saisissez uniquement votre adresse e-mail et votre mot de passe. Tahlila détecte automatiquement les serveurs et les ports.")}</p></div>
            {modal && <button type="button" className="icon-button" aria-label={t("Fermer")} onClick={onClose}><X size={18}/></button>}
        </header>
        <form onSubmit={submit}>
            <label><span>{t("Adresse e-mail")}</span><div className="email-setup-input"><Mail size={17}/><input type="email" required autoComplete="username" placeholder="nom@laboratoire.com" value={form.email} onChange={(event)=>setForm({...form,email:event.target.value})}/></div></label>
            <label><span>{t("Mot de passe de votre e-mail")}</span><div className="email-setup-input"><input type={showPassword?"text":"password"} required autoComplete="current-password" value={form.password} onChange={(event)=>setForm({...form,password:event.target.value})}/><button type="button" aria-label={showPassword?t("Masquer"):t("Afficher")} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
            <label><span>{t("Nom de l’expéditeur")} <small>{t("optionnel")}</small></span><input value={form.from_name} placeholder={t("Nom du laboratoire")} onChange={(event)=>setForm({...form,from_name:event.target.value})}/></label>
            {status !== "idle" && <div className={`email-install-progress ${status}`} role="status" aria-live="polite"><div><span style={{width:`${progress}%`}}/></div><p>{status === "working" ? t("Détection du fournisseur et installation…") : status === "done" ? <><CheckCircle2 size={16}/>{t("Configuration terminée")}</> : message}</p>{status === "done" && <small>{message}</small>}</div>}
            <div className="email-setup-actions"><Button type="button" secondary onClick={onManual}><Settings2 size={16}/>{t("Configuration manuelle")}</Button><Button type="submit" disabled={status === "working" || status === "done"}>{status === "working" ? t("Installation…") : t("Détecter et configurer")}<ChevronRight size={16}/></Button></div>
            <p className="email-provider-hint">{t("Compatible avec Gmail, Microsoft 365, Outlook, Yahoo, iCloud, Zoho, AOL et les domaines professionnels.")}</p>
        </form>
    </section>;

    return modal ? <div className="email-setup-backdrop" onMouseDown={(event)=>event.target===event.currentTarget&&onClose?.()}>{content}</div> : content;
}
