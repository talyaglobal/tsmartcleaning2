import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

export const GET = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase(null);

		// Get all achievements/badges
		const { data: achievements } = await supabase.from("achievements").select("*");

		// Get user achievements
		const { data: userAchievements } = await supabase
			.from("user_achievements")
			.select("user_id, achievement_id, created_at");

		// Get total users (companies + cleaners)
		const { count: companyCount } = await supabase
			.from("companies")
			.select("*", { count: "exact", head: true });

		const { count: cleanerCount } = await supabase
			.from("cleaners")
			.select("*", { count: "exact", head: true });

		const totalUsers = (companyCount || 0) + (cleanerCount || 0);

		// Calculate earning rates
		const earningRates = (achievements || []).map((achievement) => {
			const earnedCount = (userAchievements || []).filter(
				(ua) => ua.achievement_id === achievement.id
			).length;

			// For simplicity, assume all users are eligible
			// In production, you'd want to check eligibility criteria
			const eligibleUsers = totalUsers;
			const earningRate = eligibleUsers > 0 ? (earnedCount / eligibleUsers) * 100 : 0;

			return {
				badgeName: achievement.name,
				earnedCount,
				eligibleUsers,
				earningRate: Math.round(earningRate * 10) / 10,
			};
		});

		// Most popular badges (sorted by earned count)
		const mostPopular = (achievements || [])
			.map((achievement) => {
				const earnedCount = (userAchievements || []).filter(
					(ua) => ua.achievement_id === achievement.id
				).length;
				return {
					badgeName: achievement.name,
					earnedCount,
					percentage: totalUsers > 0 ? (earnedCount / totalUsers) * 100 : 0,
				};
			})
			.sort((a, b) => b.earnedCount - a.earnedCount)
			.map((item) => ({
				...item,
				percentage: Math.round(item.percentage * 10) / 10,
			}));

		// Calculate trends (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const { data: recentAchievements } = await supabase
			.from("user_achievements")
			.select("created_at, user_id")
			.gte("created_at", thirtyDaysAgo.toISOString())
			.order("created_at", { ascending: true });

		// Group by date
		const dailyBadgesMap = new Map<string, { badgesEarned: number; uniqueUsers: Set<string> }>();

		(recentAchievements || []).forEach((ua) => {
			const date = new Date(ua.created_at).toISOString().split("T")[0];
			const current = dailyBadgesMap.get(date) || {
				badgesEarned: 0,
				uniqueUsers: new Set<string>(),
			};

			current.badgesEarned += 1;
			current.uniqueUsers.add(ua.user_id);

			dailyBadgesMap.set(date, current);
		});

		// Fill in missing dates
		const trends = [];
		for (let i = 29; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			const dateStr = date.toISOString().split("T")[0];
			const dayData = dailyBadgesMap.get(dateStr) || {
				badgesEarned: 0,
				uniqueUsers: new Set<string>(),
			};
			trends.push({
				date: dateStr,
				badgesEarned: dayData.badgesEarned,
				uniqueUsers: dayData.uniqueUsers.size,
			});
		}

		return NextResponse.json({
			earningRates,
			mostPopular,
			trends,
		});
	} catch (error: any) {
		console.error("Error in GET /api/root-admin/analytics/gamification/badges:", error);
		return NextResponse.json(
			{ error: error?.message || "Failed to fetch badge achievements" },
			{ status: 500 }
		);
	}
});

