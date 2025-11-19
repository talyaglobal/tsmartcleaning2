import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

export const GET = withRootAdmin(async (req: NextRequest) => {
	const supabase = createServerSupabase(null);
	const { searchParams } = new URL(req.url);
	const tenantId = searchParams.get("tenantId");
	const active = searchParams.get("active");
	if (!tenantId) return NextResponse.json({ error: "tenantId is required" }, { status: 400 });

	let query = supabase.from("territories").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
	if (active === "true") query = query.eq("active", true);
	if (active === "false") query = query.eq("active", false);
	const { data, error } = await query;
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ territories: data ?? [] });
});

export const POST = withRootAdmin(async (req: NextRequest) => {
	const body = await req.json().catch(() => ({}));
	const { tenant_id, code, name, geo, active } = body ?? {};
	if (!tenant_id || !code || !name) {
		return NextResponse.json({ error: "tenant_id, code and name are required" }, { status: 400 });
	}
	const supabase = createServerSupabase(null);
	const { data, error } = await supabase
		.from("territories")
		.insert([{ tenant_id, code, name, geo, active }])
		.select("*")
		.single();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ territory: data }, { status: 201 });
});


