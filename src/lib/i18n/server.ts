import { cookies } from "next/headers";
import { cache } from "react";
import {
  createTranslator,
  localeCookie,
  localeTags,
  resolveLocale,
} from "./index";

export const getI18n = cache(async () => {
  const language = resolveLocale((await cookies()).get(localeCookie)?.value);
  return {
    language,
    locale: localeTags[language],
    tr: createTranslator(language),
  };
});
