import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";
import { getLeaderboard } from "@/lib/gamification/leaderboards";
import type { LeaderboardType, LeaderboardTimeframe, UserType } from "@/lib/gamification/types";

export const POST = withRootAdmin(async (req: NextRequest, context: { params: { id: string } }) => {
	try {
		const supabase = createServerSupabase(null);
		const { id } = context.params;

		// Get leaderboard configuration
		const { data: leaderboardConfig, error: configError } = await supabase
			.from("gamification_leaderboards")
			.select("*")
			.eq("id", id)
			.single();

		if (configError || !leaderboardConfig) {
			return NextResponse.json({ error: "Leaderboard not found" }, { status: 404 });
		}

		// Recalculate rankings
		const leaderboard = await getLeaderboard(supabase, {
			type: leaderboardConfig.leaderboard_type as LeaderboardType,
			timeframe: (leaderboardConfig.timeframe || "all_time") as LeaderboardTimeframe,
			userType: leaderboardConfig.user_type as UserType,
			limit: 1000, // Get all rankings for refresh
			offset: 0,
			tenantId: leaderboardConfig.tenant_id,
		});

		// Update leaderboard with new rankings
		const { data: updatedLeaderboard, error: updateError } = await supabase
			.from("gamification_leaderboards")
			.update({
				rankings: leaderboard.entries,
				updated_at: new Date().toISOString(),
			})
			.eq("id", id)
			.select()
			.single();

		if (updateError) {
			console.error("[gamification] Refresh leaderboard error:", updateError);
			return NextResponse.json({ error: updateError.message }, { status: 500 });
		}

		return NextResponse.json({
			leaderboard: updatedLeaderboard,
			message: "Leaderboard refreshed successfully",
			generatedAt: leaderboard.generated_at,
			totalParticipants: leaderboard.total_participants,
		});
	} catch (error: any) {
		console.error("[gamification] POST refresh leaderboard error:", error);
		return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
	}
});

