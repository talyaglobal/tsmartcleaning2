import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

// GET /api/root-admin/tenant-pricing?tenantId=...
export const GET = withRootAdmin(async (req: NextRequest) => {
	const { searchParams } = new URL(req.url);
	const tenantId = searchParams.get("tenantId");
	if (!tenantId) {
		return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
	}

	const supabase = createServerSupabase(null);
	const { data, error } = await supabase
		.from("services")
		.select("*")
		.eq("tenant_id", tenantId)
		.order("name", { ascending: true });

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ services: data ?? [] });
});

// POST /api/root-admin/tenant-pricing - Create or update service pricing
export const POST = withRootAdmin(async (req: NextRequest) => {
	const body = await req.json().catch(() => ({}));
	const { tenant_id, service_id, base_price, name, description, category, unit, is_active } = body;

	if (!tenant_id || !service_id) {
		return NextResponse.json({ error: "tenant_id and service_id are required" }, { status: 400 });
	}

	const supabase = createServerSupabase(null);

	// Check if service exists for this tenant
	const { data: existing } = await supabase
		.from("services")
		.select("id")
		.eq("id", service_id)
		.eq("tenant_id", tenant_id)
		.single();

	if (existing) {
		// Update existing service
		const updates: any = {};
		if (base_price !== undefined) updates.base_price = base_price;
		if (name !== undefined) updates.name = name;
		if (description !== undefined) updates.description = description;
		if (category !== undefined) updates.category = category;
		if (unit !== undefined) updates.unit = unit;
		if (is_active !== undefined) updates.is_active = is_active;

		const { data, error } = await supabase
			.from("services")
			.update(updates)
			.eq("id", service_id)
			.eq("tenant_id", tenant_id)
			.select("*")
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}
		return NextResponse.json({ service: data });
	} else {
		// Create new service for tenant
		if (!name || base_price === undefined) {
			return NextResponse.json({ error: "name and base_price are required for new services" }, { status: 400 });
		}

		const { data, error } = await supabase
			.from("services")
			.insert([{
				tenant_id,
				name,
				description: description || null,
				category: category || "residential",
				base_price,
				unit: unit || "per_hour",
				is_active: is_active !== undefined ? is_active : true,
			}])
			.select("*")
			.single();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}
		return NextResponse.json({ service: data }, { status: 201 });
	}
});

