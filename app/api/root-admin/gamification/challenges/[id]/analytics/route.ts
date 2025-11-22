import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

export const GET = withRootAdmin(async (req: NextRequest, context: { params: { id: string } }) => {
	try {
		const supabase = createServerSupabase(null);
		const { id } = context.params;

		// Get challenge
		const { data: challenge, error: challengeError } = await supabase
			.from("gamification_challenges")
			.select("*")
			.eq("id", id)
			.single();

		if (challengeError || !challenge) {
			return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
		}

		// Get all participants
		const { data: participants, error: participantsError } = await supabase
			.from("challenge_participants")
			.select("*")
			.eq("challenge_id", id);

		if (participantsError) {
			console.error("[gamification] GET challenge analytics error:", participantsError);
			return NextResponse.json({ error: participantsError.message }, { status: 500 });
		}

		const totalParticipants = participants?.length || 0;
		const completedParticipants = participants?.filter((p) => p.completed_at !== null).length || 0;
		const completionRate = totalParticipants > 0 ? (completedParticipants / totalParticipants) * 100 : 0;

		// Calculate average progress
		let totalProgress = 0;
		const criteria = challenge.criteria || {};
		const target = criteria.target || 0;

		for (const participant of participants || []) {
			const progress = participant.progress || {};
			const currentProgress = progress.current || 0;
			totalProgress += currentProgress;
		}

		const averageProgress = totalParticipants > 0 ? totalProgress / totalParticipants : 0;
		const averageProgressPercentage = target > 0 ? (averageProgress / target) * 100 : 0;

		// Get top participants
		const topParticipants = (participants || [])
			.map((p) => ({
				user_id: p.user_id,
				user_type: p.user_type,
				progress: (p.progress as any)?.current || 0,
				completed: p.completed_at !== null,
				completed_at: p.completed_at,
			}))
			.sort((a, b) => b.progress - a.progress)
			.slice(0, 10);

		// Get user names for top participants
		const topParticipantsWithNames = await Promise.all(
			topParticipants.map(async (p) => {
				const { data: user } = await supabase
					.from("users")
					.select("full_name, email")
					.eq("id", p.user_id)
					.single();

				return {
					...p,
					user_name: user?.full_name || user?.email || "Unknown",
				};
			})
		);

		// Calculate reward distribution
		const rewards = challenge.rewards || {};
		const rewardType = rewards.type || "points";
		const rewardValue = rewards.value || 0;

		// Get participation over time (daily breakdown)
		const participationByDate: Record<string, number> = {};
		for (const participant of participants || []) {
			const date = new Date(participant.created_at).toISOString().split("T")[0];
			participationByDate[date] = (participationByDate[date] || 0) + 1;
		}

		// Get completion over time
		const completionByDate: Record<string, number> = {};
		for (const participant of participants || []) {
			if (participant.completed_at) {
				const date = new Date(participant.completed_at).toISOString().split("T")[0];
				completionByDate[date] = (completionByDate[date] || 0) + 1;
			}
		}

		return NextResponse.json({
			challenge: {
				id: challenge.id,
				name: challenge.name,
				status: challenge.status,
				start_date: challenge.start_date,
				end_date: challenge.end_date,
			},
			metrics: {
				totalParticipants,
				completedParticipants,
				completionRate: Math.round(completionRate * 100) / 100,
				averageProgress: Math.round(averageProgress * 100) / 100,
				averageProgressPercentage: Math.round(averageProgressPercentage * 100) / 100,
				target,
			},
			topParticipants: topParticipantsWithNames,
			rewards: {
				type: rewardType,
				value: rewardValue,
				totalDistributed: completedParticipants * (typeof rewardValue === "number" ? rewardValue : 0),
			},
			participationByDate,
			completionByDate,
		});
	} catch (error: any) {
		console.error("[gamification] GET challenge analytics error:", error);
		return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
	}
});

