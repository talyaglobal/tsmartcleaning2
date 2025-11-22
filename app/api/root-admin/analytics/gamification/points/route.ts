import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

export const GET = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase(null);

		// Get companies with points
		const { data: companies } = await supabase
			.from("companies")
			.select("id, gamification_points")
			.not("gamification_points", "is", null);

		// Get cleaners with points
		const { data: cleaners } = await supabase
			.from("cleaners")
			.select("id, gamification_points")
			.not("gamification_points", "is", null);

		// Calculate distribution by user type
		const companyTotalPoints = (companies || []).reduce((sum, c) => sum + (c.gamification_points || 0), 0);
		const cleanerTotalPoints = (cleaners || []).reduce((sum, c) => sum + (c.gamification_points || 0), 0);
		const companyAvgPoints = (companies || []).length > 0 ? companyTotalPoints / (companies || []).length : 0;
		const cleanerAvgPoints = (cleaners || []).length > 0 ? cleanerTotalPoints / (cleaners || []).length : 0;

		const distributionByUserType = [
			{
				userType: "company",
				count: (companies || []).length,
				averagePoints: Math.round(companyAvgPoints),
				totalPoints: companyTotalPoints,
			},
			{
				userType: "cleaner",
				count: (cleaners || []).length,
				averagePoints: Math.round(cleanerAvgPoints),
				totalPoints: cleanerTotalPoints,
			},
		];

		// Get points by action type from loyalty_transactions
		const { data: transactions } = await supabase
			.from("loyalty_transactions")
			.select("delta_points, source_type")
			.gt("delta_points", 0); // Only positive (earned) points

		const pointsByActionTypeMap = new Map<string, { points: number; count: number }>();
		(transactions || []).forEach((tx) => {
			const actionType = tx.source_type || "unknown";
			const current = pointsByActionTypeMap.get(actionType) || { points: 0, count: 0 };
			pointsByActionTypeMap.set(actionType, {
				points: current.points + tx.delta_points,
				count: current.count + 1,
			});
		});

		const pointsByActionType = Array.from(pointsByActionTypeMap.entries()).map(([actionType, data]) => ({
			actionType,
			points: data.points,
			count: data.count,
		}));

		// Calculate time-based trends (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const { data: recentTransactions } = await supabase
			.from("loyalty_transactions")
			.select("delta_points, source_type, created_at, user_id")
			.gt("delta_points", 0)
			.gte("created_at", thirtyDaysAgo.toISOString())
			.order("created_at", { ascending: true });

		// Group by date and user type
		const dailyPointsMap = new Map<string, { companies: number; cleaners: number; total: number }>();

		// We need to determine user type - for simplicity, we'll check if user_id exists in companies or cleaners
		// This is a simplified approach - in production, you'd want a more efficient query
		const companyIds = new Set((companies || []).map((c) => c.id));
		const cleanerIds = new Set((cleaners || []).map((c) => c.id));

		(recentTransactions || []).forEach((tx) => {
			const date = new Date(tx.created_at).toISOString().split("T")[0];
			const current = dailyPointsMap.get(date) || { companies: 0, cleaners: 0, total: 0 };

			if (companyIds.has(tx.user_id)) {
				current.companies += tx.delta_points;
			} else if (cleanerIds.has(tx.user_id)) {
				current.cleaners += tx.delta_points;
			}
			current.total += tx.delta_points;

			dailyPointsMap.set(date, current);
		});

		// Fill in missing dates with zeros
		const timeBasedTrends = [];
		for (let i = 29; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			const dateStr = date.toISOString().split("T")[0];
			const dayData = dailyPointsMap.get(dateStr) || { companies: 0, cleaners: 0, total: 0 };
			timeBasedTrends.push({
				date: dateStr,
				...dayData,
			});
		}

		return NextResponse.json({
			distributionByUserType,
			pointsByActionType,
			timeBasedTrends,
		});
	} catch (error: any) {
		console.error("Error in GET /api/root-admin/analytics/gamification/points:", error);
		return NextResponse.json(
			{ error: error?.message || "Failed to fetch points distribution" },
			{ status: 500 }
		);
	}
});

