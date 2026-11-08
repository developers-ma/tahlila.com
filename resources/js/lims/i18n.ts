import { p } from "./data";
import messages from "./messages.json";
import arabicMessages from "./ar-messages.json";

export function t(value: string): string {
    if (typeof value !== "string") return value;
    const key = (messages as Record<string, string>)[value] || value;
    if (p.locale === "fr") return p.dictionary?.[key] ?? value;
    if (p.locale === "ar") {
        return (
            p.dictionary?.[key] ??
            (arabicMessages as Record<string, string>)[key] ??
            key
        );
    }
    // Every installed locale can override the canonical English key. Missing
    // entries deliberately fall back to English instead of leaking the French
    // source label into another language.
    return p.dictionary?.[key] ?? key;
}
