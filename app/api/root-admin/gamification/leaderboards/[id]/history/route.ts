import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

export const GET = withRootAdmin(async (req: NextRequest, context: { params: { id: string } }) => {
	try {
		const supabase = createServerSupabase(null);
		const { id } = context.params;
		const { searchParams } = new URL(req.url);

		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");
		const limit = parseInt(searchParams.get("limit") || "30");

		// Get leaderboard configuration
		const { data: leaderboardConfig, error: configError } = await supabase
			.from("gamification_leaderboards")
			.select("*")
			.eq("id", id)
			.single();

		if (configError || !leaderboardConfig) {
			return NextResponse.json({ error: "Leaderboard not found" }, { status: 404 });
		}

		// Query historical snapshots
		// For now, we'll use the updated_at timestamps to show history
		// In a production system, you might want to store snapshots periodically
		let query = supabase
			.from("gamification_leaderboards")
			.select("id, rankings, updated_at, timeframe")
			.eq("leaderboard_type", leaderboardConfig.leaderboard_type)
			.eq("user_type", leaderboardConfig.user_type)
			.order("updated_at", { ascending: false })
			.limit(limit);

		if (startDate) {
			query = query.gte("updated_at", startDate);
		}
		if (endDate) {
			query = query.lte("updated_at", endDate);
		}

		const { data: history, error: historyError } = await query;

		if (historyError) {
			console.error("[gamification] GET leaderboard history error:", historyError);
			return NextResponse.json({ error: historyError.message }, { status: 500 });
		}

		// Format history entries
		const historyEntries = (history || []).map((entry) => ({
			id: entry.id,
			date: entry.updated_at,
			timeframe: entry.timeframe,
			topRankings: Array.isArray(entry.rankings) ? entry.rankings.slice(0, 10) : [],
			totalParticipants: Array.isArray(entry.rankings) ? entry.rankings.length : 0,
		}));

		return NextResponse.json({
			leaderboardId: id,
			config: leaderboardConfig,
			history: historyEntries,
		});
	} catch (error: any) {
		console.error("[gamification] GET leaderboard history error:", error);
		return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
	}
});

