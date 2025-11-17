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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
	await assertRootAdmin(req);
	const { id } = params;
	const updates = await req.json().catch(() => ({}));
	const supabase = createServerSupabase(null);
	const { data, error } = await supabase.from("territories").update(updates).eq("id", id).select("*").single();
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ territory: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
	await assertRootAdmin(req);
	const { id } = params;
	const supabase = createServerSupabase(null);
	const { error } = await supabase.from("territories").delete().eq("id", id);
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ ok: true });
}


