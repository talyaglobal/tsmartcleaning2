import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

export const POST = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase(null);

		// Get levels configuration
		const { data: configData } = await supabase
			.from("gamification_levels_config")
			.select("*")
			.single();

		if (!configData) {
			return NextResponse.json(
				{ error: "Levels configuration not found. Please configure levels first." },
				{ status: 400 }
			);
		}

		const companyLevels = configData.company_levels || [];
		const cleanerLevels = configData.cleaner_levels || [];

		// Helper function to determine level from points
		const getLevel = (points: number, levels: any[]) => {
			for (const level of levels) {
				if (points >= level.minPoints && (level.maxPoints === null || points <= level.maxPoints)) {
					return level.id;
				}
			}
			return levels[0]?.id || null; // Default to first level
		};

		// Recalculate company levels
		const { data: companies, error: companiesError } = await supabase
			.from("companies")
			.select("id, gamification_points")
			.not("gamification_points", "is", null);

		if (companiesError) {
			console.error("Error fetching companies:", companiesError);
		}

		// Update company levels
		if (companies && companies.length > 0) {
			const updates = companies.map((company) => ({
				id: company.id,
				gamification_level: getLevel(company.gamification_points || 0, companyLevels),
			}));

			// Batch update companies (Supabase allows batch updates)
			for (const update of updates) {
				const { error } = await supabase
					.from("companies")
					.update({ gamification_level: update.gamification_level })
					.eq("id", update.id);

				if (error) {
					console.error(`Error updating company ${update.id}:`, error);
				}
			}
		}

		// Recalculate cleaner levels
		const { data: cleaners, error: cleanersError } = await supabase
			.from("cleaners")
			.select("id, gamification_points")
			.not("gamification_points", "is", null);

		if (cleanersError) {
			console.error("Error fetching cleaners:", cleanersError);
		}

		// Update cleaner levels
		if (cleaners && cleaners.length > 0) {
			const updates = cleaners.map((cleaner) => ({
				id: cleaner.id,
				gamification_level: getLevel(cleaner.gamification_points || 0, cleanerLevels),
			}));

			// Batch update cleaners
			for (const update of updates) {
				const { error } = await supabase
					.from("cleaners")
					.update({ gamification_level: update.gamification_level })
					.eq("id", update.id);

				if (error) {
					console.error(`Error updating cleaner ${update.id}:`, error);
				}
			}
		}

		return NextResponse.json({
			success: true,
			message: `Recalculated levels for ${companies?.length || 0} companies and ${cleaners?.length || 0} cleaners`,
			companiesUpdated: companies?.length || 0,
			cleanersUpdated: cleaners?.length || 0,
		});
	} catch (error: any) {
		console.error("Error in POST /api/root-admin/gamification/levels/recalculate:", error);
		return NextResponse.json(
			{ error: error?.message || "Failed to recalculate levels" },
			{ status: 500 }
		);
	}
});

