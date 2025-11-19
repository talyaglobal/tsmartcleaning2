import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

export const PATCH = withRootAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
	const { id } = params;
	const updates = await req.json().catch(() => ({}));
	const supabase = createServerSupabase(null);
	const { data, error } = await supabase.from("territories").update(updates).eq("id", id).select("*").single();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ territory: data });
});

export const DELETE = withRootAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
	const { id } = params;
	const supabase = createServerSupabase(null);
	const { error } = await supabase.from("territories").delete().eq("id", id);
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ ok: true });
});


