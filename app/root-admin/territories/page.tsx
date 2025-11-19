"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Tenant = { id: string; name: string; slug: string | null };
type Territory = {
	id: string;
	tenant_id: string;
	code: string;
	name: string;
	active: boolean;
	created_at: string;
	updated_at: string;
};

export default function TerritoriesPage() {
	const [tenants, setTenants] = useState<Tenant[]>([]);
	const [selectedTenantId, setSelectedTenantId] = useState<string>("");
	const [territories, setTerritories] = useState<Territory[]>([]);
	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState<Partial<Territory>>({ active: true });
	const [saving, setSaving] = useState(false);

	async function loadTenants() {
		const res = await fetch("/api/root-admin/tenants");
		const j = await res.json();
		setTenants(j.tenants ?? []);
		// Check URL params first, then default to first tenant
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const urlTenantId = params.get('tenantId');
			if (urlTenantId && !selectedTenantId) {
				setSelectedTenantId(urlTenantId);
				return;
			}
		}
		if (!selectedTenantId && j.tenants?.length) {
			setSelectedTenantId(j.tenants[0].id);
		}
	}

	async function loadTerritories() {
		if (!selectedTenantId) return;
		setLoading(true);
		const res = await fetch(`/api/root-admin/territories?tenantId=${selectedTenantId}`, { cache: "no-store" });
		const j = await res.json();
		setTerritories(j.territories ?? []);
		setLoading(false);
	}

	useEffect(() => {
		loadTenants();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	useEffect(() => {
		loadTerritories();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedTenantId]);

	async function addTerritory(e: React.FormEvent) {
		e.preventDefault();
		if (!selectedTenantId) return;
		setSaving(true);
		const res = await fetch("/api/root-admin/territories", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				tenant_id: selectedTenantId,
				code: form.code,
				name: form.name,
				active: form.active,
				geo: null,
			}),
		});
		setSaving(false);
		if (res.ok) {
			setForm({ active: true });
			loadTerritories();
		} else {
			const j = await res.json().catch(() => ({}));
			alert(j.error || "Failed to add territory");
		}
	}

	async function toggleActive(t: Territory) {
		await fetch(`/api/root-admin/territories/${t.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ active: !t.active }),
		});
		loadTerritories();
	}
	async function removeTerritory(id: string) {
		if (!confirm("Delete this territory?")) return;
		await fetch(`/api/root-admin/territories/${id}`, { method: "DELETE" });
		loadTerritories();
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-semibold text-slate-900">Territories</h1>
				<p className="text-sm text-slate-500">Define markets/geographies per tenant</p>
			</div>

			<Card className="p-4 space-y-3">
				<div className="flex flex-wrap gap-3 items-center">
					<label className="text-sm text-slate-600">Tenant</label>
					<select
						className="border rounded-md px-3 py-2 text-sm"
						value={selectedTenantId}
						onChange={(e) => setSelectedTenantId(e.target.value)}
					>
						{tenants.map((t) => (
							<option key={t.id} value={t.id}>
								{t.name} {t.slug ? `(${t.slug})` : ""}
							</option>
						))}
					</select>
				</div>

				<form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={addTerritory}>
					<Input placeholder="Code * (e.g., US-CA-SF)" value={form.code || ""} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
					<Input placeholder="Name *" value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
					<select
						className="border rounded-md px-3 py-2 text-sm"
						value={String(form.active) === "false" ? "false" : "true"}
						onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === "true" }))}
					>
						<option value="true">active</option>
						<option value="false">inactive</option>
					</select>
					<Button type="submit" disabled={saving || !form.code || !form.name || !selectedTenantId}>
						Add Territory
					</Button>
				</form>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{territories.map((t) => (
					<Card key={t.id} className="p-4 space-y-2">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">{t.name}</p>
								<p className="text-xs text-slate-500">{t.code}</p>
							</div>
							<Badge className={t.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}>
								{t.active ? "active" : "inactive"}
							</Badge>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => toggleActive(t)}>
								Toggle Active
							</Button>
							<Button variant="destructive" onClick={() => removeTerritory(t.id)}>
								Delete
							</Button>
						</div>
					</Card>
				))}
			</div>
		</div>
	);
}


