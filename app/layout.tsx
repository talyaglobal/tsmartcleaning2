import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import CookieConsent from "@/components/cookies/consent";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { ClientLocaleConsumer } from "@/components/i18n/ClientLocaleConsumer";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { getTenantIdFromHeaders } from "@/lib/tenant-server";
import { loadBranding } from "@/lib/tenant";
import { ThemeProvider } from "@/components/theme-provider";
import { WebflowNavbar } from "@/components/marketing/WebflowNavbar";
import { WebflowScripts } from "@/components/WebflowScripts";
import { WhatsAppFloatButton } from "@/components/WhatsAppFloatButton";
import { KeyboardNavigation } from "@/components/marketing/KeyboardNavigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { generateOrganizationSchema, generateWebsiteSchema } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { WebVitals } from "@/components/analytics/WebVitals";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";

export async function generateMetadata(): Promise<Metadata> {
  const tenantId = await getTenantIdFromHeaders();
  const branding = await loadBranding(tenantId);
  const siteName = "tSmartCleaning";
  const title = "Professional Cleaning Services Made Simple";
  const metadataBase = new URL("https://tsmartcleaning.com");
  
  // Use PNG favicons for better WhatsApp compatibility
  // WhatsApp specifically looks for 32x32 and 196x196 sizes
  const faviconUrl = branding.faviconUrl.includes('.svg') 
    ? '/icon-32.png' 
    : branding.faviconUrl;
  
  // Use logo as OG image if available, otherwise use a default
  // WhatsApp requires absolute URLs for Open Graph images
  const ogImageUrl = branding.logoUrl 
    ? (branding.logoUrl.startsWith('http') ? branding.logoUrl : `${metadataBase}${branding.logoUrl}`)
    : `${metadataBase}/tsmart_cleaning_512.png`;
  
  return {
    title: {
      default: siteName,
      template: `%s — ${siteName}`,
    },
    description: "Connect with verified cleaning professionals in minutes. Book, manage, and pay for residential, commercial, and specialized cleaning services all in one place.",
    generator: "v0.app",
    metadataBase,
    // Avoid setting a blanket canonical so nested routes can use correct canonical URLs
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { url: faviconUrl, sizes: 'any' },
      ],
      apple: [
        { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
        { url: '/images/webclip.png', sizes: '180x180', type: 'image/png' },
      ],
      other: [
        { rel: 'mask-icon', url: '/icon.svg', color: branding.primaryColor },
      ],
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${title}`,
      description: "Connect with verified cleaning professionals in minutes for homes and businesses.",
      url: "https://tsmartcleaning.com",
      siteName,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${siteName} - ${title}`,
        },
        {
          url: `${metadataBase}/tsmart_cleaning_512.png`,
          width: 512,
          height: 512,
          alt: `${siteName} Logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title}`,
      description: "Connect with verified cleaning professionals in minutes.",
      images: [ogImageUrl],
      creator: "@tsmartcleaning",
    },
  };
}

export async function generateViewport() {
  const tenantId = await getTenantIdFromHeaders();
  const branding = await loadBranding(tenantId);
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: branding.primaryColor,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenantId = await getTenantIdFromHeaders();
  const branding = await loadBranding(tenantId);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/css/normalize.css" />
        <link rel="stylesheet" href="/css/webflow.css" />
        <link rel="stylesheet" href="/css/tsmartcleaning-ff34e6.webflow.css" />
        {/* Primary favicon for browsers */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* PNG favicons for better WhatsApp compatibility */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        {/* Android Chrome icon (WhatsApp uses this) */}
        <link rel="icon" type="image/png" sizes="196x196" href="/icon-192.png" />
        {/* Apple touch icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <link rel="apple-touch-icon" href="/images/webclip.png" />
        {/* Manifest for PWA support */}
        <link rel="manifest" href="/manifest.json" />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link href="https://fonts.gstatic.com" rel="preconnect" crossOrigin="anonymous" />
        <script src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js" type="text/javascript"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof WebFont !== 'undefined') {
                  WebFont.load({ google: { families: ["Figtree:regular","Bricolage Grotesque:regular"] } });
                } else {
                  window.addEventListener('load', function() {
                    if (typeof WebFont !== 'undefined') {
                      WebFont.load({ google: { families: ["Figtree:regular","Bricolage Grotesque:regular"] } });
                    }
                  });
                }
                !function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-white text-gray-900 antialiased"
        style={{
          // surface-level CSS variables to reflect tenant branding
          ['--color-primary' as any]: branding.primaryColor,
          ['--color-accent' as any]: branding.primaryColor,
          ['--color-secondary' as any]: branding.secondaryColor,
        }}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] rounded bg-gray-900 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">Skip to content</a>
        <LanguageProvider>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              <AnalyticsProvider>
                <JsonLd data={[generateOrganizationSchema(), generateWebsiteSchema('/find-cleaners?q={search_term_string}')]} />
                <GoogleAnalytics />
                <WebVitals />
                <WebflowScripts />
                <KeyboardNavigation />
                <header role="banner">
                  <WebflowNavbar />
                  <LanguageSwitcher />
                </header>
                <main id="main" role="main" className="focus:outline-none" tabIndex={-1}>
                  {children}
                </main>
                {/* Announcements for screen readers */}
                <div id="live-region" aria-live="polite" aria-atomic="true" className="sr-only"></div>
                <div id="live-region-assertive" aria-live="assertive" aria-atomic="true" className="sr-only"></div>
              </AnalyticsProvider>
              <Analytics />
              <SpeedInsights />
              {/* Global tSmartCard floating CTA */}
              <aside aria-labelledby="floating-cta-label">
                <a
                  href="/tsmartcard"
                  id="floating-cta-label"
                  className="fixed bottom-5 left-5 z-[60] inline-flex items-center gap-3 rounded-full px-8 py-4 text-white shadow-lg transition-all hover:shadow-xl focus:shadow-xl bg-gradient-to-tr from-indigo-500 to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                  aria-label="Get tSmartCard membership - Save 10% on all services"
                >
                  <span className="text-base font-bold text-white">tSmartCard</span>
                  <span className="text-sm rounded-full bg-white/15 px-3 py-1 text-white font-semibold">Save 10%</span>
                </a>
              </aside>
              {/* WhatsApp floating button */}
              <WhatsAppFloatButton phoneNumber="+1 (561) 975-0455" />
              <ClientLocaleConsumer />
              <footer role="contentinfo" className="bg-gray-50 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      © {new Date().getFullYear()} tSmartCleaning. All rights reserved.
                    </p>
                    <a
                      href="/root-admin/login"
                      className="text-xs text-gray-400 hover:text-gray-600 focus:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 rounded"
                      title="System Administration"
                      aria-label="System Administration Login"
                    >
                      •
                    </a>
                  </div>
                </div>
              </footer>
            </ThemeProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
