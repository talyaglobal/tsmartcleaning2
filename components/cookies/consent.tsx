"use client";

import { useEffect, useRef, useState } from "react";
import { AppLocale } from "@/components/i18n/LanguageProvider";

// ---- Types
type Consent = {
	strictly_necessary: true; // always true, immutable
	analytics: boolean;
	ads: boolean;
	functional: boolean;
};

// ---- Helpers
const getHostKey = () =>
	typeof window !== "undefined" ? `ks_consents::${location.hostname}` : "ks_consents";

const defaultConsent: Consent = {
	strictly_necessary: true,
	analytics: false,
	ads: false,
	functional: false,
};

// Consent Mode v2 map (optional)
function updateGtagConsent(consent: Consent) {
	if (typeof window === "undefined" || typeof (window as any).gtag !== "function") return;
	const { analytics, ads } = consent;
	(window as any).gtag("consent", "update", {
		analytics_storage: analytics ? "granted" : "denied",
		ad_storage: ads ? "granted" : "denied",
		ad_user_data: ads ? "granted" : "denied",
		ad_personalization: ads ? "granted" : "denied",
	});
}

// ---- Hook
export function useConsent() {
	const [consent, setConsent] = useState<Consent>(defaultConsent);
	const [isDecided, setDecided] = useState<boolean>(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const raw = localStorage.getItem(getHostKey());
			if (raw) {
				const parsed = JSON.parse(raw) as Consent;
				const merged = { ...defaultConsent, ...parsed, strictly_necessary: true } as Consent;
				setConsent(merged);
				setDecided(true);
				updateGtagConsent(merged);
			}
		} catch {
			// noop
		}
	}, []);

	const saveConsent = (c: Consent) => {
		setConsent(c);
		setDecided(true);
		try {
			localStorage.setItem(getHostKey(), JSON.stringify(c));
		} catch {
			// noop
		}
		updateGtagConsent(c);
	};

	return { consent, saveConsent, isDecided };
}

// ---- i18n strings
const dict: Record<AppLocale, {
	title: string;
	desc: string;
	accept: string;
	reject: string;
	customize: string;
	save: string;
	close: string;
	categories: {
		strictly_necessary: string;
		analytics: string;
		ads: string;
		functional: string;
	};
	info: {
		strictly_necessary: string;
		analytics: string;
		ads: string;
		functional: string;
	};
	more: string;
}> = {
	en: {
		title: "Cookie Preferences",
		desc:
			"We use cookies to improve your experience. Strictly necessary cookies are always on. Others require your consent.",
		accept: "Accept All",
		reject: "Reject Non-Essential",
		customize: "Customize",
		save: "Save Choices",
		close: "Close",
		categories: {
			strictly_necessary: "Strictly Necessary",
			analytics: "Analytics",
			ads: "Ads/Personalization",
			functional: "Functional",
		},
		info: {
			strictly_necessary: "Required for core site functionality and cannot be disabled.",
			analytics: "Traffic & performance measurement.",
			ads: "Advertising and personalization.",
			functional: "Language, preferences and enhanced features.",
		},
		more: "See our Cookie Policy for details.",
	},
	es: {
		title: "Preferencias de Cookies",
		desc:
			"Usamos cookies para mejorar su experiencia. Las cookies estrictamente necesarias siempre están activas. Las demás requieren su consentimiento.",
		accept: "Aceptar todas",
		reject: "Rechazar no esenciales",
		customize: "Personalizar",
		save: "Guardar opciones",
		close: "Cerrar",
		categories: {
			strictly_necessary: "Estrictamente necesarias",
			analytics: "Analíticas",
			ads: "Anuncios/Personalización",
			functional: "Funcionales",
		},
		info: {
			strictly_necessary: "Necesarias para el funcionamiento básico del sitio y no se pueden desactivar.",
			analytics: "Medición de tráfico y rendimiento.",
			ads: "Publicidad y personalización.",
			functional: "Idioma, preferencias y funciones mejoradas.",
		},
		more: "Consulte nuestra Política de Cookies para más detalles.",
	},
	uk: {
		title: "Налаштування файлів cookie",
		desc:
			"Ми використовуємо файли cookie, щоб покращити ваш досвід. Необхідні файли cookie завжди увімкнені. Інші потребують вашої згоди.",
		accept: "Прийняти всі",
		reject: "Відхилити необов’язкові",
		customize: "Налаштувати",
		save: "Зберегти вибір",
		close: "Закрити",
		categories: {
			strictly_necessary: "Суворо необхідні",
			analytics: "Аналітика",
			ads: "Реклама/Персоналізація",
			functional: "Функціональні",
		},
		info: {
			strictly_necessary: "Потрібні для базової роботи сайту і не можуть бути вимкнені.",
			analytics: "Вимірювання трафіку та продуктивності.",
			ads: "Реклама та персоналізація.",
			functional: "Мова, налаштування та розширені можливості.",
		},
		more: "Детальніше дивіться у нашій Політиці файлів cookie.",
	},
	pt: {
		title: "Preferências de Cookies",
		desc:
			"Utilizamos cookies para melhorar a sua experiência. Os cookies estritamente necessários estão sempre ativos. Os demais requerem o seu consentimento.",
		accept: "Aceitar todos",
		reject: "Rejeitar não essenciais",
		customize: "Personalizar",
		save: "Guardar escolhas",
		close: "Fechar",
		categories: {
			strictly_necessary: "Estritamente necessários",
			analytics: "Analítica",
			ads: "Anúncios/Personalização",
			functional: "Funcionais",
		},
		info: {
			strictly_necessary: "Necessários para o funcionamento essencial do site e não podem ser desativados.",
			analytics: "Medição de tráfego e desempenho.",
			ads: "Publicidade e personalização.",
			functional: "Idioma, preferências e funcionalidades avançadas.",
		},
		more: "Consulte a nossa Política de Cookies para mais detalhes.",
	},
	"fr-CA": {
		title: "Préférences relatives aux témoins",
		desc:
			"Nous utilisons des témoins pour améliorer votre expérience. Les témoins strictement nécessaires sont toujours activés. Les autres requièrent votre consentement.",
		accept: "Tout accepter",
		reject: "Refuser les non essentiels",
		customize: "Personnaliser",
		save: "Enregistrer les choix",
		close: "Fermer",
		categories: {
			strictly_necessary: "Strictement nécessaires",
			analytics: "Analytique",
			ads: "Annonces/Personnalisation",
			functional: "Fonctionnels",
		},
		info: {
			strictly_necessary: "Nécessaires au fonctionnement essentiel du site et ne peuvent pas être désactivés.",
			analytics: "Mesure du trafic et des performances.",
			ads: "Publicité et personnalisation.",
			functional: "Langue, préférences et fonctionnalités avancées.",
		},
		more: "Consultez notre Politique relative aux témoins pour plus de détails.",
	},
};

// Utility to get focusable elements inside a container
function getFocusable(container: HTMLElement): HTMLElement[] {
	const selectors = [
		'a[href]',
		'button:not([disabled])',
		'textarea:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'[tabindex]:not([tabindex="-1"])',
	];
	return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(','))).filter(
		(el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
	);
}

// ---- Component
export default function CookieConsent({ locale = "en" as AppLocale }: { locale?: AppLocale }) {
	const { consent, saveConsent, isDecided } = useConsent();
	const [open, setOpen] = useState(false);
	const t = dict[locale] || dict.en;
	const [temp, setTemp] = useState<Consent>(consent);
	const dialogRef = useRef<HTMLDivElement>(null);
	const firstFocusRef = useRef<HTMLInputElement>(null);

	// Keep temp in sync when consent changes
	useEffect(() => setTemp(consent), [consent]);

	// Focus trap for modal (Tab cycle + Escape)
	useEffect(() => {
		if (!open) return;
		const dialogEl = dialogRef.current;
		if (!dialogEl) return;

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				setOpen(false);
				return;
			}
			if (e.key === "Tab") {
				const focusables = getFocusable(dialogEl);
				if (focusables.length === 0) return;
				const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);
				let nextIndex = currentIndex;
				if (e.shiftKey) {
					nextIndex = currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1;
				} else {
					nextIndex = currentIndex === focusables.length - 1 ? 0 : currentIndex + 1;
				}
				e.preventDefault();
				focusables[nextIndex].focus();
			}
		};
		document.addEventListener("keydown", onKey);
		setTimeout(() => {
			(firstFocusRef.current || dialogEl).focus();
		}, 0);
		return () => document.removeEventListener("keydown", onKey);
	}, [open]);

	const acceptAll = () =>
		saveConsent({ strictly_necessary: true, analytics: true, ads: true, functional: true });

	const rejectAll = () =>
		saveConsent({ strictly_necessary: true, analytics: false, ads: false, functional: false });

	const saveCustomized = () => {
		saveConsent({ ...temp, strictly_necessary: true });
		setOpen(false);
	};

	// Banner hidden if already decided
	if (isDecided) return null;

	return (
		<>
			<div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full md:max-w-3xl md:bottom-6 md:right-6 md:left-auto">
				<div className="mx-3 mb-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
					<div className="md:flex md:items-start md:justify-between gap-4">
						<div className="md:max-w-[70%]">
							<h3 className="text-base font-semibold">{t.title}</h3>
							<p className="mt-1 text-sm text-gray-600">{t.desc}</p>
						</div>
						<div className="mt-3 flex flex-col gap-2 md:mt-0 md:w-56">
							<button
								onClick={acceptAll}
								className="w-button w-full"
							>
								{t.accept}
							</button>
							<button
								onClick={rejectAll}
								className="w-button w-full"
							>
								{t.reject}
							</button>
							<button
								onClick={() => setOpen(true)}
								className="w-button w-full"
							>
								{t.customize}
							</button>
						</div>
					</div>
					<p className="mt-2 text-xs text-gray-500">{t.more}</p>
				</div>
			</div>

			{open && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
					aria-modal="true"
					role="dialog"
					aria-labelledby="cookie-modal-title"
				>
					<div
						ref={dialogRef}
						className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl outline-none"
						tabIndex={-1}
					>
						<h2 id="cookie-modal-title" className="text-lg font-semibold">
							{t.title}
						</h2>

						<div className="mt-4 space-y-4">
							<fieldset className="rounded-lg border p-3">
								<legend className="text-sm font-medium">{t.categories.strictly_necessary}</legend>
								<p className="mt-1 text-sm text-gray-600">{t.info.strictly_necessary}</p>
								<label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-500">
									<input type="checkbox" checked disabled /> {t.categories.strictly_necessary}
								</label>
							</fieldset>

							<fieldset className="rounded-lg border p-3">
								<legend className="text-sm font-medium">{t.categories.analytics}</legend>
								<p className="mt-1 text-sm text-gray-600">{t.info.analytics}</p>
								<label className="mt-2 inline-flex items-center gap-2">
									<input
										ref={firstFocusRef}
										type="checkbox"
										checked={temp.analytics}
										onChange={(e) => setTemp({ ...temp, analytics: e.target.checked })}
									/>
									{t.categories.analytics}
								</label>
							</fieldset>

							<fieldset className="rounded-lg border p-3">
								<legend className="text-sm font-medium">{t.categories.ads}</legend>
								<p className="mt-1 text-sm text-gray-600">{t.info.ads}</p>
								<label className="mt-2 inline-flex items-center gap-2">
									<input
										type="checkbox"
										checked={temp.ads}
										onChange={(e) => setTemp({ ...temp, ads: e.target.checked })}
									/>
									{t.categories.ads}
								</label>
							</fieldset>

							<fieldset className="rounded-lg border p-3">
								<legend className="text-sm font-medium">{t.categories.functional}</legend>
								<p className="mt-1 text-sm text-gray-600">{t.info.functional}</p>
								<label className="mt-2 inline-flex items-center gap-2">
									<input
										type="checkbox"
										checked={temp.functional}
										onChange={(e) => setTemp({ ...temp, functional: e.target.checked })}
									/>
									{t.categories.functional}
								</label>
							</fieldset>
						</div>

						<div className="mt-6 flex items-center justify-end gap-2">
							<button
								onClick={() => setOpen(false)}
								className="w-button"
							>
								{t.close}
							</button>
							<button
								onClick={saveCustomized}
								className="w-button"
							>
								{t.save}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}


