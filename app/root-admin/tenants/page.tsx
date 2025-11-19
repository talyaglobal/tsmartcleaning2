"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Copy, Settings, Palette, DollarSign, MapPin, ExternalLink, BarChart3 } from "lucide-react";
import Link from "next/link";

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
	const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
	const [editForm, setEditForm] = useState<Partial<Tenant>>({});
	const [editDialogOpen, setEditDialogOpen] = useState(false);

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

	async function updateTenant() {
		if (!editingTenant) return;
		setSaving(true);
		const res = await fetch(`/api/root-admin/tenants/${editingTenant.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(editForm),
		});
		setSaving(false);
		if (res.ok) {
			setEditDialogOpen(false);
			setEditingTenant(null);
			setEditForm({});
			load();
		} else {
			const j = await res.json().catch(() => ({}));
			alert(j.error || "Failed to update tenant");
		}
	}

	function openEditDialog(tenant: Tenant) {
		setEditingTenant(tenant);
		setEditForm({
			name: tenant.name,
			slug: tenant.slug,
			domain: tenant.domain,
			owner_user_id: tenant.owner_user_id,
			status: tenant.status,
			metadata: tenant.metadata,
		});
		setEditDialogOpen(true);
	}

	async function removeTenant(id: string) {
		if (!confirm("Delete this tenant? This action cannot be undone.")) return;
		const res = await fetch(`/api/root-admin/tenants/${id}`, { method: "DELETE" });
		if (res.ok) {
			load();
		} else {
			const j = await res.json().catch(() => ({}));
			alert(j.error || "Failed to delete tenant");
		}
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
					<h1 className="text-2xl font-semibold text-slate-900">Tenant Management</h1>
					<p className="text-sm text-slate-500">Manage companies/tenants across the platform</p>
				</div>
				<div className="flex gap-2">
					<Input 
						placeholder="Search tenants..." 
						value={q} 
						onChange={(e) => setQ(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								load();
							}
						}}
						className="w-64"
					/>
					<Button onClick={load} disabled={loading}>
						{loading ? "Loading..." : "Search"}
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Create New Tenant</CardTitle>
					<CardDescription>Add a new tenant to the platform</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" onSubmit={createTenant}>
						<div className="space-y-2">
							<Label htmlFor="name">Name *</Label>
							<Input 
								id="name"
								placeholder="Tenant name" 
								value={form.name || ""} 
								onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="slug">Slug</Label>
							<Input 
								id="slug"
								placeholder="tenant-slug" 
								value={form.slug || ""} 
								onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} 
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="domain">Domain</Label>
							<Input 
								id="domain"
								placeholder="example.com" 
								value={form.domain || ""} 
								onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))} 
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="owner_user_id">Owner User ID</Label>
							<Input
								id="owner_user_id"
								placeholder="UUID"
								value={form.owner_user_id || ""}
								onChange={(e) => setForm((f) => ({ ...f, owner_user_id: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="status">Status</Label>
							<select
								id="status"
								className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								value={form.status || "active"}
								onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Tenant["status"] }))}
							>
								<option value="active">Active</option>
								<option value="suspended">Suspended</option>
								<option value="archived">Archived</option>
							</select>
						</div>
						<div className="space-y-2 flex items-end">
							<Button type="submit" disabled={saving || !form.name} className="w-full">
								{saving ? "Creating..." : "Create Tenant"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
				{tenants.length === 0 && !loading ? (
					<div className="col-span-full text-center py-12 text-slate-500">
						No tenants found. Create your first tenant above.
					</div>
				) : (
					tenants.map((t) => (
						<Card key={t.id} className="flex flex-col">
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">{t.name}</CardTitle>
									<Badge className={statusColor[t.status]}>{t.status}</Badge>
								</div>
								<CardDescription>
									{t.slug && <div>Slug: {t.slug}</div>}
									{t.domain && <div>Domain: {t.domain}</div>}
								</CardDescription>
							</CardHeader>
							<CardContent className="flex-1 space-y-4">
								<div className="text-sm text-slate-600 space-y-1">
									<p><span className="font-medium">ID:</span> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{t.id.slice(0, 8)}...</code></p>
									{t.owner_user_id && (
										<p><span className="font-medium">Owner:</span> <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{t.owner_user_id.slice(0, 8)}...</code></p>
									)}
									<p className="text-xs text-slate-400">
										Created: {new Date(t.created_at).toLocaleDateString()}
									</p>
								</div>
								
								{/* Quick Configuration Actions */}
								<div className="pt-2 border-t border-slate-200">
									<p className="text-xs font-medium text-slate-500 mb-2">Quick Actions</p>
									<div className="grid grid-cols-2 gap-2">
										<Link href={`/root-admin/tenants/${t.id}/analytics`}>
											<Button variant="outline" size="sm" className="w-full text-xs">
												<BarChart3 className="h-3 w-3 mr-1" />
												Analytics
											</Button>
										</Link>
										<Link href={`/root-admin/branding?tenantId=${t.id}`}>
											<Button variant="outline" size="sm" className="w-full text-xs">
												<Palette className="h-3 w-3 mr-1" />
												Branding
											</Button>
										</Link>
										<Link href={`/root-admin/pricing?tenantId=${t.id}`}>
											<Button variant="outline" size="sm" className="w-full text-xs">
												<DollarSign className="h-3 w-3 mr-1" />
												Pricing
											</Button>
										</Link>
										<Link href={`/root-admin/territories?tenantId=${t.id}`}>
											<Button variant="outline" size="sm" className="w-full text-xs">
												<MapPin className="h-3 w-3 mr-1" />
												Territories
											</Button>
										</Link>
										<Button 
											variant="outline" 
											size="sm"
											onClick={() => openEditDialog(t)}
											className="w-full text-xs"
										>
											<Settings className="h-3 w-3 mr-1" />
											Settings
										</Button>
									</div>
								</div>

								<div className="flex gap-2 pt-2 border-t border-slate-200">
									<Button 
										variant="outline" 
										size="sm"
										onClick={() => {
											navigator.clipboard.writeText(t.id);
											alert("Tenant ID copied to clipboard");
										}}
										className="flex-1"
									>
										<Copy className="h-4 w-4 mr-1" />
										Copy ID
									</Button>
									<Button 
										variant="destructive" 
										size="sm"
										onClick={() => removeTenant(t.id)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>

			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Tenant</DialogTitle>
						<DialogDescription>Update tenant configuration</DialogDescription>
					</DialogHeader>
					{editingTenant && (
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="edit-name">Name *</Label>
								<Input
									id="edit-name"
									value={editForm.name || ""}
									onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-slug">Slug</Label>
								<Input
									id="edit-slug"
									value={editForm.slug || ""}
									onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-domain">Domain</Label>
								<Input
									id="edit-domain"
									value={editForm.domain || ""}
									onChange={(e) => setEditForm((f) => ({ ...f, domain: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-owner">Owner User ID</Label>
								<Input
									id="edit-owner"
									value={editForm.owner_user_id || ""}
									onChange={(e) => setEditForm((f) => ({ ...f, owner_user_id: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-status">Status</Label>
								<select
									id="edit-status"
									className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
									value={editForm.status || "active"}
									onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as Tenant["status"] }))}
								>
									<option value="active">Active</option>
									<option value="suspended">Suspended</option>
									<option value="archived">Archived</option>
								</select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-metadata">Metadata (JSON)</Label>
								<Textarea
									id="edit-metadata"
									value={editForm.metadata ? JSON.stringify(editForm.metadata, null, 2) : "{}"}
									onChange={(e) => {
										try {
											const parsed = JSON.parse(e.target.value);
											setEditForm((f) => ({ ...f, metadata: parsed }));
										} catch {
											// Invalid JSON, keep as is
										}
									}}
									className="font-mono text-xs"
									rows={6}
								/>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={updateTenant} disabled={saving || !editForm.name}>
							{saving ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}


