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

		// Get level progression history (if table exists)
		// For now, we'll calculate from current state and timestamps
		const { data: companies } = await supabase
			.from("companies")
			.select("id, gamification_points, created_at, updated_at")
			.not("gamification_points", "is", null);

		const { data: cleaners } = await supabase
			.from("cleaners")
			.select("id, gamification_points, created_at, updated_at")
			.not("gamification_points", "is", null);

		// Helper function to determine level from points
		const getLevel = (points: number, levels: any[]) => {
			for (const level of levels) {
				if (points >= level.minPoints && (level.maxPoints === null || points <= level.maxPoints)) {
					return level.name;
				}
			}
			return "Unknown";
		};

		// Calculate average time to level up (simplified - using account age / level)
		const calculateAverageTimeToLevelUp = (users: any[], levels: any[]) => {
			const levelTimes: Record<string, number[]> = {};

			users.forEach((user) => {
				const currentLevel = getLevel(user.gamification_points || 0, levels);
				const levelIndex = levels.findIndex((l) => l.name === currentLevel);

				if (levelIndex > 0) {
					// User has progressed beyond first level
					const accountAge = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24); // days
					const avgTimePerLevel = accountAge / (levelIndex + 1);

					// Estimate time for each level transition
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

		// Calculate level up rates (percentage of users who reached each level)
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

		// Calculate bottlenecks (levels where users are stuck)
		const calculateBottlenecks = (
			users: any[],
			levels: any[],
			userType: "company" | "cleaner"
		) => {
			const bottlenecks: Array<{
				level: string;
				userType: "company" | "cleaner";
				avgDaysStuck: number;
				usersAffected: number;
			}> = [];

			levels.forEach((level, index) => {
				if (index === 0) return; // Skip first level

				const usersInLevel = users.filter((user) => {
					const points = user.gamification_points || 0;
					return points >= level.minPoints && (level.maxPoints === null || points <= level.maxPoints);
				});

				if (usersInLevel.length === 0) return;

				// Calculate average days stuck (simplified - using last update time)
				const now = Date.now();
				const avgDaysStuck = usersInLevel.reduce((sum, user) => {
					const lastUpdate = new Date(user.updated_at || user.created_at).getTime();
					return sum + (now - lastUpdate) / (1000 * 60 * 60 * 24);
				}, 0) / usersInLevel.length;

				// Consider it a bottleneck if average days stuck > 14 days
				if (avgDaysStuck > 14) {
					bottlenecks.push({
						level: level.name,
						userType,
						avgDaysStuck,
						usersAffected: usersInLevel.length,
					});
				}
			});

			return bottlenecks.sort((a, b) => b.avgDaysStuck - a.avgDaysStuck);
		};

		const companyTimeToLevelUp = calculateAverageTimeToLevelUp(companies || [], companyLevels);
		const cleanerTimeToLevelUp = calculateAverageTimeToLevelUp(cleaners || [], cleanerLevels);

		const companyLevelUpRates = calculateLevelUpRates(companies || [], companyLevels);
		const cleanerLevelUpRates = calculateLevelUpRates(cleaners || [], cleanerLevels);

		const companyBottlenecks = calculateBottlenecks(companies || [], companyLevels, "company");
		const cleanerBottlenecks = calculateBottlenecks(cleaners || [], cleanerLevels, "cleaner");

		return NextResponse.json({
			averageTimeToLevelUp: {
				company: companyTimeToLevelUp,
				cleaner: cleanerTimeToLevelUp,
			},
			levelUpRates: {
				company: companyLevelUpRates,
				cleaner: cleanerLevelUpRates,
			},
			bottlenecks: [...companyBottlenecks, ...cleanerBottlenecks],
		});
	} catch (error: any) {
		console.error("Error in GET /api/root-admin/gamification/levels/analytics:", error);
		return NextResponse.json(
			{ error: error?.message || "Failed to fetch progression analytics" },
			{ status: 500 }
		);
	}
});

