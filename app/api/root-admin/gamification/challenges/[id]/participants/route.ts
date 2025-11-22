import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

export const GET = withRootAdmin(async (req: NextRequest, context: { params: { id: string } }) => {
	try {
		const supabase = createServerSupabase(null);
		const { id } = context.params;
		const { searchParams } = new URL(req.url);

		const limit = parseInt(searchParams.get("limit") || "50");
		const offset = parseInt(searchParams.get("offset") || "0");
		const completed = searchParams.get("completed") === "true" ? true : searchParams.get("completed") === "false" ? false : null;

		// Get challenge
		const { data: challenge, error: challengeError } = await supabase
			.from("gamification_challenges")
			.select("*")
			.eq("id", id)
			.single();

		if (challengeError || !challenge) {
			return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
		}

		// Get participants
		let query = supabase
			.from("challenge_participants")
			.select("*")
			.eq("challenge_id", id)
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		if (completed === true) {
			query = query.not("completed_at", "is", null);
		} else if (completed === false) {
			query = query.is("completed_at", null);
		}

		const { data: participants, error: participantsError } = await query;

		if (participantsError) {
			console.error("[gamification] GET challenge participants error:", participantsError);
			return NextResponse.json({ error: participantsError.message }, { status: 500 });
		}

		// Get total count
		let countQuery = supabase
			.from("challenge_participants")
			.select("*", { count: "exact", head: true })
			.eq("challenge_id", id);

		if (completed === true) {
			countQuery = countQuery.not("completed_at", "is", null);
		} else if (completed === false) {
			countQuery = countQuery.is("completed_at", null);
		}

		const { count } = await countQuery;

		// Get user names
		const participantsWithNames = await Promise.all(
			(participants || []).map(async (participant) => {
				const { data: user } = await supabase
					.from("users")
					.select("full_name, email")
					.eq("id", participant.user_id)
					.single();

				const progress = participant.progress || {};
				const criteria = challenge.criteria || {};
				const target = criteria.target || 0;
				const current = (progress as any)?.current || 0;
				const progressPercentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;

				return {
					id: participant.id,
					user_id: participant.user_id,
					user_name: user?.full_name || user?.email || "Unknown",
					user_type: participant.user_type,
					progress: current,
					target,
					progressPercentage: Math.round(progressPercentage * 100) / 100,
					completed: participant.completed_at !== null,
					completed_at: participant.completed_at,
					started_at: participant.created_at,
				};
			})
		);

		return NextResponse.json({
			participants: participantsWithNames,
			pagination: {
				total: count || 0,
				limit,
				offset,
				hasMore: (offset + limit) < (count || 0),
			},
		});
	} catch (error: any) {
		console.error("[gamification] GET challenge participants error:", error);
		return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
	}
});

