import { useEffect, useState, type ReactNode } from "react";
import { I18nContext, translations, type Lang } from "@/lib/i18n";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem("lang") as Lang)) || "ar";
    setLang(saved === "en" ? "en" : "ar");
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("dir", translations[lang].dir);
    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem("lang", lang);
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}
