"use client";

import React from "react";
import { useLanguage } from "./LanguageProvider";
import CookieConsent from "@/components/cookies/consent";

export function ClientLocaleConsumer() {
  const { locale } = useLanguage();
  return <CookieConsent locale={locale} />;
}


