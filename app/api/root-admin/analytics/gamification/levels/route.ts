import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

export const GET = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase(null);

		// Get levels configuration
		const { data: configData } = await supabase
			.from("gamification_levels_config")
			.select("*")
			.single();

		const companyLevels = configData?.company_levels || [];
		const cleanerLevels = configData?.cleaner_levels || [];

		// Helper function to determine level from points
		const getLevel = (points: number, levels: any[]) => {
			for (const level of levels) {
				if (points >= level.minPoints && (level.maxPoints === null || points <= level.maxPoints)) {
					return level.name;
				}
			}
			return levels[0]?.name || "Unknown";
		};

		// Get companies with points
		const { data: companies } = await supabase
			.from("companies")
			.select("id, gamification_points, created_at, updated_at")
			.not("gamification_points", "is", null);

		// Get cleaners with points
		const { data: cleaners } = await supabase
			.from("cleaners")
			.select("id, gamification_points, created_at, updated_at")
			.not("gamification_points", "is", null);

		// Calculate user distribution by level
		const companyDistributionMap = new Map<string, number>();
		(companies || []).forEach((company) => {
			const level = getLevel(company.gamification_points || 0, companyLevels);
			companyDistributionMap.set(level, (companyDistributionMap.get(level) || 0) + 1);
		});

		const cleanerDistributionMap = new Map<string, number>();
		(cleaners || []).forEach((cleaner) => {
			const level = getLevel(cleaner.gamification_points || 0, cleanerLevels);
			cleanerDistributionMap.set(level, (cleanerDistributionMap.get(level) || 0) + 1);
		});

		const totalCompanies = (companies || []).length;
		const totalCleaners = (cleaners || []).length;

		const companyDistribution = Array.from(companyDistributionMap.entries()).map(([level, count]) => ({
			level,
			count,
			percentage: totalCompanies > 0 ? (count / totalCompanies) * 100 : 0,
		}));

		const cleanerDistribution = Array.from(cleanerDistributionMap.entries()).map(([level, count]) => ({
			level,
			count,
			percentage: totalCleaners > 0 ? (count / totalCleaners) * 100 : 0,
		}));

		// Calculate level up rates
		const calculateLevelUpRates = (users: any[], levels: any[]) => {
			const rates: Record<string, number> = {};
			const totalUsers = users.length;

			if (totalUsers === 0) return rates;

			levels.forEach((level) => {
				const usersAtOrAbove = users.filter(
					(user) => (user.gamification_points || 0) >= level.minPoints
				).length;
				rates[level.name] = (usersAtOrAbove / totalUsers) * 100;
			});

			return rates;
		};

		// Calculate average time to level up
		const calculateAverageTimeToLevelUp = (users: any[], levels: any[]) => {
			const levelTimes: Record<string, number[]> = {};

			users.forEach((user) => {
				const currentLevel = getLevel(user.gamification_points || 0, levels);
				const levelIndex = levels.findIndex((l) => l.name === currentLevel);

				if (levelIndex > 0) {
					const accountAge = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
					const avgTimePerLevel = accountAge / (levelIndex + 1);

					for (let i = 0; i < levelIndex; i++) {
						const levelName = levels[i].name;
						if (!levelTimes[levelName]) {
							levelTimes[levelName] = [];
						}
						levelTimes[levelName].push(avgTimePerLevel);
					}
				}
			});

			const averages: Record<string, number> = {};
			Object.entries(levelTimes).forEach(([level, times]) => {
				averages[level] = times.reduce((a, b) => a + b, 0) / times.length;
			});

			return averages;
		};

		const companyLevelUpRates = calculateLevelUpRates(companies || [], companyLevels);
		const cleanerLevelUpRates = calculateLevelUpRates(cleaners || [], cleanerLevels);

		const companyTimeToLevelUp = calculateAverageTimeToLevelUp(companies || [], companyLevels);
		const cleanerTimeToLevelUp = calculateAverageTimeToLevelUp(cleaners || [], cleanerLevels);

		return NextResponse.json({
			userDistribution: {
				company: companyDistribution,
				cleaner: cleanerDistribution,
			},
			levelUpRates: {
				company: companyLevelUpRates,
				cleaner: cleanerLevelUpRates,
			},
			averageTimeToLevelUp: {
				company: companyTimeToLevelUp,
				cleaner: cleanerTimeToLevelUp,
			},
		});
	} catch (error: any) {
		console.error("Error in GET /api/root-admin/analytics/gamification/levels:", error);
		return NextResponse.json(
			{ error: error?.message || "Failed to fetch level progression" },
			{ status: 500 }
		);
	}
});

