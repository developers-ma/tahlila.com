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
    return key;
}
