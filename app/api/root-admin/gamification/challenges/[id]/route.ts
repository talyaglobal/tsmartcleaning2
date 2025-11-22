import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

type ChallengeStatus = 'draft' | 'active' | 'completed' | 'cancelled'

export const PATCH = withRootAdmin(async (req: NextRequest, context: { params: { id: string } }) => {
	try {
		const supabase = createServerSupabase(null);
		const { id } = context.params;
		const body = await req.json();

		const { name, description, challenge_type, start_date, end_date, criteria, rewards, status } = body;

		// Build update object
		const updates: any = {};
		if (name !== undefined) updates.name = name;
		if (description !== undefined) updates.description = description;
		if (challenge_type !== undefined) updates.challenge_type = challenge_type;
		if (start_date !== undefined) updates.start_date = start_date;
		if (end_date !== undefined) updates.end_date = end_date;
		if (criteria !== undefined) updates.criteria = criteria;
		if (rewards !== undefined) updates.rewards = rewards;
		if (status !== undefined) {
			const validStatuses: ChallengeStatus[] = ['draft', 'active', 'completed', 'cancelled'];
			if (!validStatuses.includes(status)) {
				return NextResponse.json(
					{ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
					{ status: 400 }
				);
			}
			updates.status = status;
		}

		// Validate dates if both are being updated
		if (updates.start_date && updates.end_date) {
			if (new Date(updates.end_date) <= new Date(updates.start_date)) {
				return NextResponse.json({ error: "end_date must be after start_date" }, { status: 400 });
			}
		} else if (updates.end_date) {
			// Check against existing start_date
			const { data: existing } = await supabase
				.from("gamification_challenges")
				.select("start_date")
				.eq("id", id)
				.single();
			
			if (existing && new Date(updates.end_date) <= new Date(existing.start_date)) {
				return NextResponse.json({ error: "end_date must be after start_date" }, { status: 400 });
			}
		} else if (updates.start_date) {
			// Check against existing end_date
			const { data: existing } = await supabase
				.from("gamification_challenges")
				.select("end_date")
				.eq("id", id)
				.single();
			
			if (existing && new Date(existing.end_date) <= new Date(updates.start_date)) {
				return NextResponse.json({ error: "end_date must be after start_date" }, { status: 400 });
			}
		}

		const { data: challenge, error } = await supabase
			.from("gamification_challenges")
			.update(updates)
			.eq("id", id)
			.select()
			.single();

		if (error) {
			console.error("[gamification] PATCH challenge error:", error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		if (!challenge) {
			return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
		}

		return NextResponse.json({ challenge });
	} catch (error: any) {
		console.error("[gamification] PATCH challenge error:", error);
		return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
	}
});

export const DELETE = withRootAdmin(async (req: NextRequest, context: { params: { id: string } }) => {
	try {
		const supabase = createServerSupabase(null);
		const { id } = context.params;

		const { error } = await supabase
			.from("gamification_challenges")
			.delete()
			.eq("id", id);

		if (error) {
			console.error("[gamification] DELETE challenge error:", error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ message: "Challenge deleted successfully" });
	} catch (error: any) {
		console.error("[gamification] DELETE challenge error:", error);
		return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
	}
});

