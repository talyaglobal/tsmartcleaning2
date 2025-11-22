import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";
import { getLeaderboard, getLeaderboardCount } from "@/lib/gamification/leaderboards";
import type { LeaderboardType, LeaderboardTimeframe, UserType } from "@/lib/gamification/types";

export const GET = withRootAdmin(async (req: NextRequest, context: { params: { id: string } }) => {
	try {
		const supabase = createServerSupabase(null);
		const { id } = context.params;
		const { searchParams } = new URL(req.url);

		const limit = parseInt(searchParams.get("limit") || "50");
		const offset = parseInt(searchParams.get("offset") || "0");

		// Get leaderboard configuration
		const { data: leaderboardConfig, error: configError } = await supabase
			.from("gamification_leaderboards")
			.select("*")
			.eq("id", id)
			.single();

		if (configError || !leaderboardConfig) {
			return NextResponse.json({ error: "Leaderboard not found" }, { status: 404 });
		}

		// Get current rankings
		const leaderboard = await getLeaderboard(supabase, {
			type: leaderboardConfig.leaderboard_type as LeaderboardType,
			timeframe: (leaderboardConfig.timeframe || "all_time") as LeaderboardTimeframe,
			userType: leaderboardConfig.user_type as UserType,
			limit,
			offset,
			tenantId: leaderboardConfig.tenant_id,
		});

		// Get total count
		const totalCount = await getLeaderboardCount(
			supabase,
			leaderboardConfig.leaderboard_type as LeaderboardType,
			leaderboardConfig.user_type as UserType,
			(leaderboardConfig.timeframe || "all_time") as LeaderboardTimeframe,
			leaderboardConfig.tenant_id
		);

		return NextResponse.json({
			leaderboard,
			config: leaderboardConfig,
			pagination: {
				total: totalCount,
				limit,
				offset,
				hasMore: offset + limit < totalCount,
			},
		});
	} catch (error: any) {
		console.error("[gamification] GET leaderboard rankings error:", error);
		return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
	}
});

