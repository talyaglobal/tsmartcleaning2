import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

export const PATCH = withRootAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params;
	const updates = await req.json().catch(() => ({}));
	const supabase = createServerSupabase(null);
	const { data, error } = await supabase.from("tenants").update(updates).eq("id", id).select("*").single();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ tenant: data });
});

export const DELETE = withRootAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params;
	const supabase = createServerSupabase(null);
	const { error } = await supabase.from("tenants").delete().eq("id", id);
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ ok: true });
});


