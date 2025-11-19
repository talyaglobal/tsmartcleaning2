"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, Save } from "lucide-react";

type Tenant = { id: string; name: string; slug: string | null };
type Branding = {
	id?: string;
	tenant_id: string;
	logo_url?: string | null;
	favicon_url?: string | null;
	primary_color?: string | null;
	secondary_color?: string | null;
	theme?: "light" | "dark" | "system";
	typography?: any;
	styles?: any;
};

export default function BrandingPage() {
	const [tenants, setTenants] = useState<Tenant[]>([]);
	const [tenantId, setTenantId] = useState<string>("");
	const [branding, setBranding] = useState<Branding | null>(null);
	const [saving, setSaving] = useState(false);
	const [showPreview, setShowPreview] = useState(false);

	async function loadTenants() {
		const res = await fetch("/api/root-admin/tenants");
		const j = await res.json();
		setTenants(j.tenants ?? []);
		// Check URL params first, then default to first tenant
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const urlTenantId = params.get('tenantId');
			if (urlTenantId && !tenantId) {
				setTenantId(urlTenantId);
				return;
			}
		}
		if (!tenantId && j.tenants?.length) setTenantId(j.tenants[0].id);
	}
	async function loadBranding() {
		if (!tenantId) return;
		const res = await fetch(`/api/root-admin/branding?tenantId=${tenantId}`, { cache: "no-store" });
		const j = await res.json();
		setBranding(j.branding ?? { tenant_id: tenantId, theme: "light" });
	}

	useEffect(() => {
		loadTenants();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	useEffect(() => {
		loadBranding();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tenantId]);

	async function saveBranding(e: React.FormEvent) {
		e.preventDefault();
		if (!tenantId || !branding) return;
		setSaving(true);
		const res = await fetch("/api/root-admin/branding", {
			method: branding?.id ? "PATCH" : "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...branding, tenant_id: tenantId }),
		});
		setSaving(false);
		if (!res.ok) {
			const j = await res.json().catch(() => ({}));
			alert(j.error || "Failed to save branding");
		} else {
			loadBranding();
			alert("Branding saved successfully!");
		}
	}

	const primaryColor = branding?.primary_color || "#556B2F";
	const secondaryColor = branding?.secondary_color || "#f5f1eb";
	const logoUrl = branding?.logo_url || "/tsmart_cleaning_orange.png";
	const faviconUrl = branding?.favicon_url || "/icon.svg";

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold text-slate-900">Tenant Branding</h1>
				<p className="text-sm text-slate-500">Customize logos, colors, and theme per tenant</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Branding Configuration</CardTitle>
						<CardDescription>Configure branding settings for the selected tenant</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="tenant-select">Select Tenant</Label>
								<select
									id="tenant-select"
									className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
									value={tenantId}
									onChange={(e) => setTenantId(e.target.value)}
								>
									{tenants.map((t) => (
										<option key={t.id} value={t.id}>
											{t.name} {t.slug ? `(${t.slug})` : ""}
										</option>
									))}
								</select>
							</div>

							{branding && (
								<form className="space-y-6" onSubmit={saveBranding}>
									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="logo_url">Logo URL</Label>
											<Input
												id="logo_url"
												placeholder="https://example.com/logo.png"
												value={branding.logo_url || ""}
												onChange={(e) => setBranding((b) => ({ ...(b || { tenant_id: tenantId }), logo_url: e.target.value }))}
											/>
											{branding.logo_url && (
												<div className="mt-2 p-2 border rounded-md bg-slate-50">
													<img src={branding.logo_url} alt="Logo preview" className="max-h-16 object-contain" onError={(e) => {
														(e.target as HTMLImageElement).style.display = 'none';
													}} />
												</div>
											)}
										</div>

										<div className="space-y-2">
											<Label htmlFor="favicon_url">Favicon URL</Label>
											<Input
												id="favicon_url"
												placeholder="https://example.com/favicon.ico"
												value={branding.favicon_url || ""}
												onChange={(e) => setBranding((b) => ({ ...(b || { tenant_id: tenantId }), favicon_url: e.target.value }))}
											/>
											{branding.favicon_url && (
												<div className="mt-2 p-2 border rounded-md bg-slate-50 inline-block">
													<img src={branding.favicon_url} alt="Favicon preview" className="w-8 h-8 object-contain" onError={(e) => {
														(e.target as HTMLImageElement).style.display = 'none';
													}} />
												</div>
											)}
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="primary_color">Primary Color</Label>
												<div className="flex gap-2">
													<Input
														id="primary_color"
														type="color"
														value={primaryColor}
														onChange={(e) => setBranding((b) => ({ ...(b || { tenant_id: tenantId }), primary_color: e.target.value }))}
														className="w-20 h-9 p-1 cursor-pointer"
													/>
													<Input
														placeholder="#2563eb"
														value={branding.primary_color || ""}
														onChange={(e) => setBranding((b) => ({ ...(b || { tenant_id: tenantId }), primary_color: e.target.value }))}
														pattern="^#[0-9A-Fa-f]{6}$"
													/>
												</div>
											</div>

											<div className="space-y-2">
												<Label htmlFor="secondary_color">Secondary Color</Label>
												<div className="flex gap-2">
													<Input
														id="secondary_color"
														type="color"
														value={secondaryColor}
														onChange={(e) => setBranding((b) => ({ ...(b || { tenant_id: tenantId }), secondary_color: e.target.value }))}
														className="w-20 h-9 p-1 cursor-pointer"
													/>
													<Input
														placeholder="#f5f1eb"
														value={branding.secondary_color || ""}
														onChange={(e) => setBranding((b) => ({ ...(b || { tenant_id: tenantId }), secondary_color: e.target.value }))}
														pattern="^#[0-9A-Fa-f]{6}$"
													/>
												</div>
											</div>
										</div>

										<div className="space-y-2">
											<Label htmlFor="theme">Theme</Label>
											<select
												id="theme"
												className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
												value={branding.theme || "light"}
												onChange={(e) =>
													setBranding((b) => ({ ...(b || { tenant_id: tenantId }), theme: e.target.value as Branding["theme"] }))
												}
											>
												<option value="light">Light</option>
												<option value="dark">Dark</option>
												<option value="system">System</option>
											</select>
										</div>
									</div>

									<div className="flex gap-2">
										<Button type="submit" disabled={saving} className="flex-1">
											<Save className="h-4 w-4 mr-2" />
											{saving ? "Saving..." : "Save Branding"}
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={() => setShowPreview(!showPreview)}
										>
											<Eye className="h-4 w-4 mr-2" />
											{showPreview ? "Hide" : "Show"} Preview
										</Button>
									</div>
								</form>
							)}
						</div>
					</CardContent>
				</Card>

				{showPreview && branding && (
					<Card>
						<CardHeader>
							<CardTitle>Live Preview</CardTitle>
							<CardDescription>Preview how the branding will look</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="p-4 rounded-lg border" style={{ backgroundColor: secondaryColor }}>
									<div className="flex items-center gap-3 mb-4">
										{logoUrl && (
											<img
												src={logoUrl}
												alt="Logo"
												className="h-8 object-contain"
												onError={(e) => {
													(e.target as HTMLImageElement).style.display = 'none';
												}}
											/>
										)}
										<span className="font-semibold">Brand Preview</span>
									</div>
									<div className="space-y-2">
										<button
											className="w-full px-4 py-2 rounded-md text-white font-medium"
											style={{ backgroundColor: primaryColor }}
										>
											Primary Button
										</button>
										<div className="p-3 rounded-md" style={{ backgroundColor: primaryColor, color: 'white' }}>
											<p className="text-sm">Primary color background</p>
										</div>
										<div className="p-3 rounded-md border-2" style={{ borderColor: primaryColor }}>
											<p className="text-sm">Primary color border</p>
										</div>
									</div>
								</div>
								<div className="text-xs text-slate-500 space-y-1">
									<p><strong>Primary:</strong> {primaryColor}</p>
									<p><strong>Secondary:</strong> {secondaryColor}</p>
									<p><strong>Theme:</strong> {branding.theme || "light"}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}


