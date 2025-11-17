"use client";

import React from "react";
import { useLanguage, AppLocale } from "./LanguageProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale, availableLocales } = useLanguage();
  const labelByLocale: Record<AppLocale, { label: string; aria: string }> = {
    en: { label: "Language", aria: "Select language" },
    es: { label: "Idioma", aria: "Seleccione el idioma" },
    uk: { label: "Мова", aria: "Виберіть мову" },
    pt: { label: "Idioma", aria: "Selecionar idioma" },
    "fr-CA": { label: "Langue", aria: "Sélectionner la langue" },
  };
  const uiText = labelByLocale[locale] ?? labelByLocale.en;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as AppLocale;
    if (newLocale === "en" || newLocale === "es" || newLocale === "uk" || newLocale === "pt" || newLocale === "fr-CA") {
      setLocale(newLocale);
    }
  };

  return (
    <div
      className="fixed top-2 right-2 sm:top-3 sm:right-3 z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg"
      style={{
        padding: "clamp(6px, 1.5vw, 10px)",
        minWidth: "fit-content",
      }}
    >
      <label 
        htmlFor="lang-select" 
        className="text-gray-600 mr-2 hidden sm:inline-block"
        style={{ 
          fontSize: "clamp(10px, 2vw, 12px)",
        }}
      >
        {uiText.label}
      </label>
      <select
        id="lang-select"
        value={locale}
        onChange={handleChange}
        className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        style={{
          fontSize: "clamp(12px, 2.5vw, 14px)",
          padding: "clamp(6px, 1.5vw, 8px) clamp(8px, 2vw, 12px)",
          borderRadius: 6,
          border: "1px solid #e5e7eb",
          background: "white",
          minHeight: "44px", // Minimum touch target size for mobile
          WebkitAppearance: "menulist",
          MozAppearance: "menulist",
          appearance: "menulist",
        }}
        aria-label={uiText.aria}
      >
        {availableLocales.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}


