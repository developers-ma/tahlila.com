import { p } from "./data";
import messages from "./messages.json";

export function t(value: string): string {
    if (typeof value !== "string") return value;
    const key = (messages as Record<string, string>)[value] || value;
    return p.dictionary?.[key] ?? (p.locale === "en" ? key : value);
}
