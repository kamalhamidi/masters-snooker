import messages from "./messages.json";

export const locales = ["en", "fr", "ar"] as const;
export type Locale = (typeof locales)[number];
export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};
export const localeTags: Record<Locale, string> = {
  en: "en-US",
  fr: "fr-FR",
  ar: "ar-MA",
};
export const localeCookie = "cuehub-locale";
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}
export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : "en";
}
const dictionary: Record<string, { fr: string; ar: string }> = messages;

// Pre-compute dictionary Map for O(1) lookups
const dictMap = new Map(Object.entries(dictionary));

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Existing notification records contain rendered English messages. Match only
// known templates, preserving stored records and interpolated member content.
const legacyTemplates = Object.keys(dictionary)
  .filter((key) => /\{\w+\}/.test(key))
  .map((key) => {
    const names: string[] = [];
    const parts = key.split(/(\{\w+\})/);
    const pattern = parts
      .map((part) => {
        if (/^\{\w+\}$/.test(part)) {
          names.push(part.slice(1, -1));
          return "(.+?)";
        }
        return escapeRegex(part);
      })
      .join("");
    return { key, names, pattern: new RegExp(`^${pattern}$`, "u") };
  });

const interpolate = (
  text: string,
  params?: Record<string, string | number>,
): string => {
  if (!params) return text;
  return text.replace(
    /\{(\w+)\}/g,
    (placeholder, name: string) => String(params[name] ?? placeholder),
  );
};

export function createTranslator(locale: Locale) {
  // English: just interpolate, no dictionary lookup needed
  if (locale === "en") {
    return (text: string, values?: Record<string, string | number>): string =>
      interpolate(text, values);
  }

  return (text: string, values?: Record<string, string | number>): string => {
    const key = text.replace(/\s+/g, " ").trim();
    let translated = dictMap.get(key)?.[locale];
    let parameters = values;
    if (translated === undefined) {
      for (const template of legacyTemplates) {
        const match = template.pattern.exec(key);
        if (match) {
          translated = dictMap.get(template.key)?.[locale];
          parameters = Object.fromEntries(
            template.names.map((name, i) => [name, match[i + 1]]),
          );
          break;
        }
      }
    }
    if (translated === undefined) return interpolate(text, values);
    translated =
      (text.match(/^\s*/)?.[0] ?? "") +
      translated +
      (text.match(/\s*$/)?.[0] ?? "");
    return interpolate(translated, parameters);
  };
}

