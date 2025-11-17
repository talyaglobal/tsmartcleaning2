import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
// Removed dependency on app route exports; use header role assertion only.

async function assertRootAdmin(req: NextRequest) {
	try {
		const role = req.headers.get("x-user-role");
		if (role === "root_admin") return;
	} catch {}
	throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// GET /api/root-admin/branding?tenantId=...
export async function GET(req: NextRequest) {
	await assertRootAdmin(req);
	const { searchParams } = new URL(req.url);
	const tenantId = searchParams.get("tenantId");
	if (!tenantId) return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
	const supabase = createServerSupabase(null);
	const { data, error } = await supabase.from("tenant_branding").select("*").eq("tenant_id", tenantId).maybeSingle();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ branding: data || null });
}

// POST upsert
export async function POST(req: NextRequest) {
	await assertRootAdmin(req);
	const body = await req.json().catch(() => ({}));
	const { tenant_id, logo_url, favicon_url, primary_color, secondary_color, theme, typography, styles } = body ?? {};
	if (!tenant_id) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
	const supabase = createServerSupabase(null);
	const { data, error } = await supabase
		.from("tenant_branding")
		.upsert([{ tenant_id, logo_url, favicon_url, primary_color, secondary_color, theme, typography, styles }], {
			onConflict: "tenant_id",
		})
		.select("*")
		.single();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ branding: data });
}

// PATCH partial update by tenantId in body
export async function PATCH(req: NextRequest) {
	await assertRootAdmin(req);
	const body = await req.json().catch(() => ({}));
	const { tenant_id, ...updates } = body ?? {};
	if (!tenant_id) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
	const supabase = createServerSupabase(null);
	const { data, error } = await supabase
		.from("tenant_branding")
		.update(updates)
		.eq("tenant_id", tenant_id)
		.select("*")
		.single();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ branding: data });
}


