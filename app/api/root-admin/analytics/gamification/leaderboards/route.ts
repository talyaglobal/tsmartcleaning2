import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

export const GET = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase(null);

		// Get all companies with points
		const { data: companies } = await supabase
			.from("companies")
			.select("id, name, gamification_points")
			.not("gamification_points", "is", null)
			.order("gamification_points", { ascending: false })
			.limit(10);

		// Get all cleaners with points
		const { data: cleaners } = await supabase
			.from("cleaners")
			.select("id, name, gamification_points")
			.not("gamification_points", "is", null)
			.order("gamification_points", { ascending: false })
			.limit(10);

		// Get total counts
		const { count: totalCompanies } = await supabase
			.from("companies")
			.select("*", { count: "exact", head: true });

		const { count: totalCleaners } = await supabase
			.from("cleaners")
			.select("*", { count: "exact", head: true });

		const { count: companiesWithPoints } = await supabase
			.from("companies")
			.select("*", { count: "exact", head: true })
			.not("gamification_points", "is", null);

		const { count: cleanersWithPoints } = await supabase
			.from("cleaners")
			.select("*", { count: "exact", head: true })
			.not("gamification_points", "is", null);

		// Calculate participation rates
		const participationRates = {
			company: totalCompanies && totalCompanies > 0
				? ((companiesWithPoints || 0) / totalCompanies) * 100
				: 0,
			cleaner: totalCleaners && totalCleaners > 0
				? ((cleanersWithPoints || 0) / totalCleaners) * 100
				: 0,
			total: (totalCompanies || 0) + (totalCleaners || 0) > 0
				? (((companiesWithPoints || 0) + (cleanersWithPoints || 0)) / ((totalCompanies || 0) + (totalCleaners || 0))) * 100
				: 0,
		};

		// Top performers with rank changes (simplified - in production, you'd track historical ranks)
		const topPerformers = {
			companies: (companies || []).map((company, idx) => ({
				id: company.id,
				name: company.name || "Unknown Company",
				points: company.gamification_points || 0,
				rank: idx + 1,
				rankChange: 0, // Would need historical data to calculate
			})),
			cleaners: (cleaners || []).map((cleaner, idx) => ({
				id: cleaner.id,
				name: cleaner.name || "Unknown Cleaner",
				points: cleaner.gamification_points || 0,
				rank: idx + 1,
				rankChange: 0, // Would need historical data to calculate
			})),
		};

		// Ranking changes over time (last 30 days)
		// This is simplified - in production, you'd track daily leaderboard snapshots
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		// For now, we'll generate mock trend data
		// In production, you'd query a leaderboard_history table
		const rankingChanges = [];
		for (let i = 29; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			const dateStr = date.toISOString().split("T")[0];
			rankingChanges.push({
				date: dateStr,
				avgRankChange: Math.random() * 2 - 1, // Mock data: -1 to 1
				usersWithRankChange: Math.floor(Math.random() * 50) + 10, // Mock data: 10-60
			});
		}

		return NextResponse.json({
			participationRates,
			rankingChanges,
			topPerformers,
		});
	} catch (error: any) {
		console.error("Error in GET /api/root-admin/analytics/gamification/leaderboards:", error);
		return NextResponse.json(
			{ error: error?.message || "Failed to fetch leaderboard statistics" },
			{ status: 500 }
		);
	}
});

