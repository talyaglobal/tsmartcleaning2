import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";
import { getLeaderboard, getLeaderboardCount } from "@/lib/gamification/leaderboards";
import type { UserType, LeaderboardType, LeaderboardTimeframe } from "@/lib/gamification/types";

export const GET = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase(null);
		const { searchParams } = new URL(req.url);

		const type = (searchParams.get("type") || "points") as LeaderboardType;
		const timeframe = (searchParams.get("timeframe") || "all_time") as LeaderboardTimeframe;
		const userType = (searchParams.get("userType") || "company") as UserType;
		const limit = parseInt(searchParams.get("limit") || "50");
		const offset = parseInt(searchParams.get("offset") || "0");
		const tenantId = searchParams.get("tenantId") || null;

		// Get leaderboard entries
		const leaderboard = await getLeaderboard(supabase, {
			type,
			timeframe,
			userType,
			limit,
			offset,
			tenantId,
		});

		// Get total count for pagination
		const totalCount = await getLeaderboardCount(supabase, type, userType, timeframe, tenantId);

		return NextResponse.json({
			leaderboard,
			pagination: {
				total: totalCount,
				limit,
				offset,
				hasMore: offset + limit < totalCount,
			},
		});
	} catch (error: any) {
		console.error("[gamification] GET leaderboards error:", error);
		return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
	}
});

export const POST = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase(null);
		const body = await req.json();

		const { type, timeframe, userType, name, description, tenantId } = body;

		if (!type || !timeframe || !userType) {
			return NextResponse.json({ error: "Missing required fields: type, timeframe, userType" }, { status: 400 });
		}

		// Validate types
		const validTypes: LeaderboardType[] = ["points", "jobs", "ratings", "referrals"];
		const validTimeframes: LeaderboardTimeframe[] = ["daily", "weekly", "monthly", "all_time"];
		const validUserTypes: UserType[] = ["company", "cleaner"];

		if (!validTypes.includes(type)) {
			return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(", ")}` }, { status: 400 });
		}
		if (!validTimeframes.includes(timeframe)) {
			return NextResponse.json({ error: `Invalid timeframe. Must be one of: ${validTimeframes.join(", ")}` }, { status: 400 });
		}
		if (!validUserTypes.includes(userType)) {
			return NextResponse.json({ error: `Invalid userType. Must be one of: ${validUserTypes.join(", ")}` }, { status: 400 });
		}

		// Create custom leaderboard configuration
		// Store in gamification_leaderboards table
		const { data: leaderboard, error } = await supabase
			.from("gamification_leaderboards")
			.insert({
				leaderboard_type: type,
				user_type: userType,
				timeframe: timeframe,
				tenant_id: tenantId || null,
				rankings: [],
			})
			.select()
			.single();

		if (error) {
			console.error("[gamification] POST leaderboards error:", error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Refresh the leaderboard to calculate initial rankings
		const rankings = await getLeaderboard(supabase, {
			type,
			timeframe,
			userType,
			limit: 100,
			offset: 0,
			tenantId,
		});

		// Update with calculated rankings
		const { data: updatedLeaderboard, error: updateError } = await supabase
			.from("gamification_leaderboards")
			.update({
				rankings: rankings.entries,
				updated_at: new Date().toISOString(),
			})
			.eq("id", leaderboard.id)
			.select()
			.single();

		if (updateError) {
			console.error("[gamification] Update leaderboard rankings error:", updateError);
		}

		return NextResponse.json({
			leaderboard: updatedLeaderboard || leaderboard,
			message: "Leaderboard created and refreshed successfully",
		});
	} catch (error: any) {
		console.error("[gamification] POST leaderboards error:", error);
		return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
	}
});

