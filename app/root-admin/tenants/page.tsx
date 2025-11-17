"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Tenant = {
	id: string;
	name: string;
	slug: string | null;
	domain: string | null;
	owner_user_id: string | null;
	status: "active" | "suspended" | "archived";
	metadata: Record<string, any> | null;
	created_at: string;
	updated_at: string;
};

export default function TenantsPage() {
	const [tenants, setTenants] = useState<Tenant[]>([]);
	const [loading, setLoading] = useState(false);
	const [q, setQ] = useState("");
	const [form, setForm] = useState<Partial<Tenant>>({ status: "active" } as any);
	const [saving, setSaving] = useState(false);

	async function load() {
		setLoading(true);
		const params = new URLSearchParams();
		if (q) params.set("q", q);
		const res = await fetch(`/api/root-admin/tenants?${params.toString()}`, { cache: "no-store" });
		const json = await res.json();
		setTenants(json.tenants ?? []);
		setLoading(false);
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function createTenant(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		const res = await fetch("/api/root-admin/tenants", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: form.name,
				slug: form.slug,
				domain: form.domain,
				owner_user_id: form.owner_user_id,
				status: form.status,
				metadata: form.metadata ?? {},
			}),
		});
		setSaving(false);
		if (res.ok) {
			setForm({ status: "active" } as any);
			load();
		} else {
			const j = await res.json().catch(() => ({}));
			alert(j.error || "Failed to create tenant");
		}
	}

	async function removeTenant(id: string) {
		if (!confirm("Delete this tenant?")) return;
		await fetch(`/api/root-admin/tenants/${id}`, { method: "DELETE" });
		load();
	}

	const statusColor = useMemo(
		() => ({
			active: "bg-green-100 text-green-700",
			suspended: "bg-yellow-100 text-yellow-700",
			archived: "bg-slate-100 text-slate-700",
		}),
		[]
	);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-semibold text-slate-900">Tenants</h1>
					<p className="text-sm text-slate-500">Manage companies/tenants across the platform</p>
				</div>
				<div className="flex gap-2">
					<Input placeholder="Search tenants..." value={q} onChange={(e) => setQ(e.target.value)} />
					<Button onClick={load} disabled={loading}>
						Search
					</Button>
				</div>
			</div>

			<Card className="p-4">
				<form className="grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={createTenant}>
					<Input placeholder="Name *" value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
					<Input placeholder="Slug" value={form.slug || ""} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
					<Input placeholder="Domain" value={form.domain || ""} onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))} />
					<Input
						placeholder="Owner User ID"
						value={form.owner_user_id || ""}
						onChange={(e) => setForm((f) => ({ ...f, owner_user_id: e.target.value }))}
					/>
					<select
						className="border rounded-md px-3 py-2 text-sm"
						value={form.status || "active"}
						onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Tenant["status"] }))}
					>
						<option value="active">active</option>
						<option value="suspended">suspended</option>
						<option value="archived">archived</option>
					</select>
					<Button type="submit" disabled={saving || !form.name}>
						Add Tenant
					</Button>
				</form>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{tenants.map((t) => (
					<Card key={t.id} className="p-4 space-y-2">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">{t.name}</p>
								<p className="text-xs text-slate-500">{t.slug || "—"}</p>
							</div>
							<Badge className={statusColor[t.status]}>{t.status}</Badge>
						</div>
						<div className="text-sm text-slate-600">
							<p>Domain: {t.domain || "—"}</p>
							<p>Owner: {t.owner_user_id || "—"}</p>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => navigator.clipboard.writeText(t.id)}>
								Copy ID
							</Button>
							<Button variant="destructive" onClick={() => removeTenant(t.id)}>
								Delete
							</Button>
						</div>
					</Card>
				))}
			</div>
		</div>
	);
}


