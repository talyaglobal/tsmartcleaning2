"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

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

	async function loadTenants() {
		const res = await fetch("/api/root-admin/tenants");
		const j = await res.json();
		setTenants(j.tenants ?? []);
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
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-semibold text-slate-900">Branding</h1>
				<p className="text-sm text-slate-500">Customize logos, colors, and theme per tenant</p>
			</div>

			<Card className="p-4 space-y-4">
				<div className="flex flex-wrap items-center gap-3">
					<Label className="text-sm text-slate-600">Tenant</Label>
					<select className="border rounded-md px-3 py-2 text-sm" value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
						{tenants.map((t) => (
							<option key={t.id} value={t.id}>
								{t.name} {t.slug ? `(${t.slug})` : ""}
							</option>
						))}
					</select>
				</div>

				{branding && (
					<form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={saveBranding}>
						<Input
							placeholder="Logo URL"
							value={branding.logo_url || ""}
							onChange={(e) => setBranding((b) => ({ ...(b || { tenant_id: tenantId }), logo_url: e.target.value }))}
						/>
						<Input
							placeholder="Favicon URL"
							value={branding.favicon_url || ""}
							onChange={(e) => setBranding((b) => ({ ...(b || { tenant_id: tenantId }), favicon_url: e.target.value }))}
						/>
						<Input
							placeholder="Primary color (e.g., #2563eb)"
							value={branding.primary_color || ""}
							onChange={(e) => setBranding((b) => ({ ...(b || { tenant_id: tenantId }), primary_color: e.target.value }))}
						/>
						<Input
							placeholder="Secondary color"
							value={branding.secondary_color || ""}
							onChange={(e) => setBranding((b) => ({ ...(b || { tenant_id: tenantId }), secondary_color: e.target.value }))}
						/>
						<select
							className="border rounded-md px-3 py-2 text-sm"
							value={branding.theme || "light"}
							onChange={(e) =>
								setBranding((b) => ({ ...(b || { tenant_id: tenantId }), theme: e.target.value as Branding["theme"] }))
							}
						>
							<option value="light">light</option>
							<option value="dark">dark</option>
							<option value="system">system</option>
						</select>
						<Button type="submit" disabled={saving}>
							Save
						</Button>
					</form>
				)}
			</Card>
		</div>
	);
}


