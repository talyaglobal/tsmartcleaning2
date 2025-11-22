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

		// Get all companies with their points
		const { data: companies, error: companiesError } = await supabase
			.from("companies")
			.select("id, gamification_points")
			.not("gamification_points", "is", null);

		if (companiesError) {
			console.error("Error fetching companies:", companiesError);
		}

		// Get all cleaners with their points
		const { data: cleaners, error: cleanersError } = await supabase
			.from("cleaners")
			.select("id, gamification_points")
			.not("gamification_points", "is", null);

		if (cleanersError) {
			console.error("Error fetching cleaners:", cleanersError);
		}

		// Helper function to determine level from points
		const getLevel = (points: number, levels: any[]) => {
			for (const level of levels) {
				if (points >= level.minPoints && (level.maxPoints === null || points <= level.maxPoints)) {
					return level.name;
				}
			}
			return "Unknown";
		};

		// Calculate company distribution
		const companyDistributionMap = new Map<string, number>();
		(companies || []).forEach((company) => {
			const level = getLevel(company.gamification_points || 0, companyLevels);
			companyDistributionMap.set(level, (companyDistributionMap.get(level) || 0) + 1);
		});

		const totalCompanies = (companies || []).length;
		const companyDistribution = Array.from(companyDistributionMap.entries()).map(([level, count]) => ({
			level,
			count,
			percentage: totalCompanies > 0 ? (count / totalCompanies) * 100 : 0,
		}));

		// Calculate cleaner distribution
		const cleanerDistributionMap = new Map<string, number>();
		(cleaners || []).forEach((cleaner) => {
			const level = getLevel(cleaner.gamification_points || 0, cleanerLevels);
			cleanerDistributionMap.set(level, (cleanerDistributionMap.get(level) || 0) + 1);
		});

		const totalCleaners = (cleaners || []).length;
		const cleanerDistribution = Array.from(cleanerDistributionMap.entries()).map(([level, count]) => ({
			level,
			count,
			percentage: totalCleaners > 0 ? (count / totalCleaners) * 100 : 0,
		}));

		return NextResponse.json({
			companyDistribution,
			cleanerDistribution,
		});
	} catch (error: any) {
		console.error("Error in GET /api/root-admin/gamification/levels/distribution:", error);
		return NextResponse.json(
			{ error: error?.message || "Failed to fetch level distribution" },
			{ status: 500 }
		);
	}
});

