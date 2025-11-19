import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, resolveTenantFromRequest } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

export const GET = withRootAdmin(async (req: NextRequest) => {
	const supabase = createServerSupabase(null);
	const { searchParams } = new URL(req.url);
	const q = searchParams.get("q");
	const status = searchParams.get("status");

	let query = supabase.from("tenants").select("*").order("created_at", { ascending: false });
	if (q) {
		// basic ILIKE filter on name or slug
		query = query.ilike("name", `%${q}%`);
	}
	if (status) {
		query = query.eq("status", status);
	}
	const { data, error } = await query;
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ tenants: data ?? [] });
});

export const POST = withRootAdmin(async (req: NextRequest) => {
	const body = await req.json().catch(() => ({}));
	const { name, slug, domain, owner_user_id, status, metadata } = body ?? {};
	if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

	const supabase = createServerSupabase(null);
	const { data, error } = await supabase
		.from("tenants")
		.insert([{ name, slug, domain, owner_user_id, status, metadata }])
		.select("*")
		.single();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ tenant: data }, { status: 201 });
});


