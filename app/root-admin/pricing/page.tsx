"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, DollarSign } from "lucide-react";

type Tenant = { id: string; name: string; slug: string | null };
type Service = {
	id: string;
	name: string;
	description: string | null;
	category: string;
	base_price: number;
	unit: string;
	is_active: boolean;
	tenant_id: string;
};

export default function TenantPricingPage() {
	const [tenants, setTenants] = useState<Tenant[]>([]);
	const [tenantId, setTenantId] = useState<string>("");
	const [services, setServices] = useState<Service[]>([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [editingService, setEditingService] = useState<Service | null>(null);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [form, setForm] = useState<Partial<Service>>({
		category: "residential",
		unit: "per_hour",
		is_active: true,
	});

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

	async function loadServices() {
		if (!tenantId) {
			setServices([]);
			return;
		}
		setLoading(true);
		const res = await fetch(`/api/root-admin/tenant-pricing?tenantId=${tenantId}`, { cache: "no-store" });
		const j = await res.json();
		setServices(j.services ?? []);
		setLoading(false);
	}

	useEffect(() => {
		loadTenants();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		loadServices();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tenantId]);

	async function saveService() {
		if (!tenantId || !form.name || form.base_price === undefined) {
			alert("Name and base price are required");
			return;
		}

		setSaving(true);
		const res = await fetch("/api/root-admin/tenant-pricing", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				tenant_id: tenantId,
				service_id: editingService?.id,
				name: form.name,
				description: form.description,
				category: form.category,
				base_price: parseFloat(String(form.base_price)),
				unit: form.unit,
				is_active: form.is_active,
			}),
		});
		setSaving(false);

		if (res.ok) {
			setEditDialogOpen(false);
			setEditingService(null);
			setForm({ category: "residential", unit: "per_hour", is_active: true });
			loadServices();
		} else {
			const j = await res.json().catch(() => ({}));
			alert(j.error || "Failed to save service");
		}
	}

	function openEditDialog(service?: Service) {
		if (service) {
			setEditingService(service);
			setForm({
				name: service.name,
				description: service.description || "",
				category: service.category,
				base_price: service.base_price,
				unit: service.unit,
				is_active: service.is_active,
			});
		} else {
			setEditingService(null);
			setForm({
				name: "",
				description: "",
				category: "residential",
				base_price: 0,
				unit: "per_hour",
				is_active: true,
			});
		}
		setEditDialogOpen(true);
	}

	const categoryColors: Record<string, string> = {
		residential: "bg-blue-100 text-blue-700",
		commercial: "bg-purple-100 text-purple-700",
		deep: "bg-green-100 text-green-700",
		move: "bg-orange-100 text-orange-700",
		"post-construction": "bg-yellow-100 text-yellow-700",
		window: "bg-cyan-100 text-cyan-700",
		carpet: "bg-pink-100 text-pink-700",
		"eco-friendly": "bg-emerald-100 text-emerald-700",
	};

	const unitLabels: Record<string, string> = {
		per_hour: "Per Hour",
		per_sqft: "Per Sq Ft",
		flat_rate: "Flat Rate",
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold text-slate-900">Tenant Pricing Configuration</h1>
				<p className="text-sm text-slate-500">Manage service pricing for each tenant</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Select Tenant</CardTitle>
					<CardDescription>Choose a tenant to configure pricing</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Label htmlFor="tenant-select">Tenant</Label>
						<select
							id="tenant-select"
							className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							value={tenantId}
							onChange={(e) => setTenantId(e.target.value)}
						>
							<option value="">Select a tenant...</option>
							{tenants.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name} {t.slug ? `(${t.slug})` : ""}
								</option>
							))}
						</select>
					</div>
				</CardContent>
			</Card>

			{tenantId && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Services & Pricing</CardTitle>
								<CardDescription>Configure service prices for this tenant</CardDescription>
							</div>
							<Button onClick={() => openEditDialog()}>
								<Plus className="h-4 w-4 mr-2" />
								Add Service
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{loading ? (
							<div className="text-center py-8 text-slate-500">Loading services...</div>
						) : services.length === 0 ? (
							<div className="text-center py-8 text-slate-500">
								<p>No services configured for this tenant.</p>
								<Button variant="outline" className="mt-4" onClick={() => openEditDialog()}>
									<Plus className="h-4 w-4 mr-2" />
									Add First Service
								</Button>
							</div>
						) : (
							<div className="space-y-4">
								{services.map((service) => (
									<Card key={service.id} className="p-4">
										<div className="flex items-start justify-between">
											<div className="flex-1 space-y-2">
												<div className="flex items-center gap-3">
													<h3 className="font-semibold text-lg">{service.name}</h3>
													<Badge className={categoryColors[service.category] || "bg-slate-100 text-slate-700"}>
														{service.category}
													</Badge>
													{!service.is_active && (
														<Badge variant="outline" className="bg-slate-100">
															Inactive
														</Badge>
													)}
												</div>
												{service.description && (
													<p className="text-sm text-slate-600">{service.description}</p>
												)}
												<div className="flex items-center gap-4 text-sm">
													<div className="flex items-center gap-2">
														<DollarSign className="h-4 w-4 text-slate-500" />
														<span className="font-semibold text-lg">
															${Number(service.base_price).toFixed(2)}
														</span>
														<span className="text-slate-500">/{unitLabels[service.unit] || service.unit}</span>
													</div>
												</div>
											</div>
											<Button variant="outline" size="sm" onClick={() => openEditDialog(service)}>
												<Pencil className="h-4 w-4 mr-1" />
												Edit
											</Button>
										</div>
									</Card>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			)}

			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
						<DialogDescription>
							{editingService ? "Update service pricing and details" : "Create a new service for this tenant"}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="service-name">Service Name *</Label>
							<Input
								id="service-name"
								value={form.name || ""}
								onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
								placeholder="e.g., Standard House Cleaning"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="service-description">Description</Label>
							<textarea
								id="service-description"
								className="w-full min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
								value={form.description || ""}
								onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
								placeholder="Service description..."
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="service-category">Category *</Label>
								<select
									id="service-category"
									className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
									value={form.category || "residential"}
									onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
								>
									<option value="residential">Residential</option>
									<option value="commercial">Commercial</option>
									<option value="deep">Deep Cleaning</option>
									<option value="move">Move-In/Out</option>
									<option value="post-construction">Post-Construction</option>
									<option value="window">Window Cleaning</option>
									<option value="carpet">Carpet Cleaning</option>
									<option value="eco-friendly">Eco-Friendly</option>
								</select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="service-unit">Pricing Unit *</Label>
								<select
									id="service-unit"
									className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
									value={form.unit || "per_hour"}
									onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
								>
									<option value="per_hour">Per Hour</option>
									<option value="per_sqft">Per Square Foot</option>
									<option value="flat_rate">Flat Rate</option>
								</select>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="service-price">Base Price *</Label>
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
								<Input
									id="service-price"
									type="number"
									step="0.01"
									min="0"
									value={form.base_price || ""}
									onChange={(e) => setForm((f) => ({ ...f, base_price: parseFloat(e.target.value) || 0 }))}
									placeholder="0.00"
									className="pl-7"
									required
								/>
							</div>
							<p className="text-xs text-slate-500">
								Base price in USD. This will be used as the starting point for pricing calculations.
							</p>
						</div>

						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="service-active"
								checked={form.is_active !== false}
								onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
								className="h-4 w-4 rounded border-gray-300"
							/>
							<Label htmlFor="service-active" className="cursor-pointer">
								Service is active
							</Label>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={saveService} disabled={saving || !form.name || form.base_price === undefined}>
							{saving ? "Saving..." : editingService ? "Update Service" : "Create Service"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

