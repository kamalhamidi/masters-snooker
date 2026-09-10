"use client";

import { createContext, useContext, useMemo } from "react";
import { createTranslator, localeTags, type Locale } from "./index";

const I18nContext = createContext<Locale>("en");
export function I18nProvider({
  language,
  children,
}: {
  language: Locale;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={language}>{children}</I18nContext.Provider>
  );
}
export function useI18n() {
  const language = useContext(I18nContext);
  return useMemo(
    () => ({
      language,
      locale: localeTags[language],
      tr: createTranslator(language),
    }),
    [language],
  );
}
