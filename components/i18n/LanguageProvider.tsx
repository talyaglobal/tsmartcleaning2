"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLocale = "en" | "es" | "uk" | "pt" | "fr-CA" | "tr";

type LanguageContextValue = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  availableLocales: Array<{ code: AppLocale; label: string }>;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "app_locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AppLocale | null;
      if (saved === "en" || saved === "es" || saved === "uk" || saved === "pt" || saved === "fr-CA" || saved === "tr") {
        setLocaleState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", locale);
    }
  }, [locale]);

  const setLocale = (next: AppLocale) => {
    setLocaleState(next);
  };

  const availableLocales = useMemo(
    () => [
      { code: "en" as const, label: "English" },
      { code: "es" as const, label: "Español" },
      { code: "uk" as const, label: "Українська" },
      { code: "pt" as const, label: "Português" },
      { code: "fr-CA" as const, label: "Français (Canada)" },
      { code: "tr" as const, label: "Türkçe" },
    ],
    []
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, setLocale, availableLocales }),
    [locale, availableLocales]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}


