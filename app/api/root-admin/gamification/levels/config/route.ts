import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

const DEFAULT_COMPANY_LEVELS = [
	{
		id: "bronze",
		name: "Bronze Partner",
		minPoints: 0,
		maxPoints: 499,
		rewards: {
			premiumFeatures: false,
			prioritySupport: false,
			exclusiveBadges: [],
			profileHighlight: false,
			leaderboardRecognition: false,
		},
	},
	{
		id: "silver",
		name: "Silver Partner",
		minPoints: 500,
		maxPoints: 1499,
		rewards: {
			premiumFeatures: true,
			prioritySupport: false,
			exclusiveBadges: ["Silver Badge"],
			profileHighlight: true,
			leaderboardRecognition: false,
		},
	},
	{
		id: "gold",
		name: "Gold Partner",
		minPoints: 1500,
		maxPoints: 3999,
		rewards: {
			premiumFeatures: true,
			prioritySupport: true,
			exclusiveBadges: ["Gold Badge"],
			profileHighlight: true,
			leaderboardRecognition: true,
		},
	},
	{
		id: "platinum",
		name: "Platinum Partner",
		minPoints: 4000,
		maxPoints: 9999,
		rewards: {
			premiumFeatures: true,
			prioritySupport: true,
			exclusiveBadges: ["Platinum Badge", "VIP Access"],
			profileHighlight: true,
			leaderboardRecognition: true,
		},
	},
	{
		id: "diamond",
		name: "Diamond Partner",
		minPoints: 10000,
		maxPoints: null,
		rewards: {
			premiumFeatures: true,
			prioritySupport: true,
			exclusiveBadges: ["Diamond Badge", "VIP Access", "Elite Status"],
			profileHighlight: true,
			leaderboardRecognition: true,
		},
	},
];

const DEFAULT_CLEANER_LEVELS = [
	{
		id: "beginner",
		name: "Beginner",
		minPoints: 0,
		maxPoints: 299,
		rewards: {
			premiumFeatures: false,
			prioritySupport: false,
			exclusiveBadges: [],
			profileHighlight: false,
			leaderboardRecognition: false,
		},
	},
	{
		id: "intermediate",
		name: "Intermediate",
		minPoints: 300,
		maxPoints: 999,
		rewards: {
			premiumFeatures: true,
			prioritySupport: false,
			exclusiveBadges: ["Intermediate Badge"],
			profileHighlight: true,
			leaderboardRecognition: false,
		},
	},
	{
		id: "advanced",
		name: "Advanced",
		minPoints: 1000,
		maxPoints: 2999,
		rewards: {
			premiumFeatures: true,
			prioritySupport: true,
			exclusiveBadges: ["Advanced Badge"],
			profileHighlight: true,
			leaderboardRecognition: true,
		},
	},
	{
		id: "expert",
		name: "Expert",
		minPoints: 3000,
		maxPoints: 7499,
		rewards: {
			premiumFeatures: true,
			prioritySupport: true,
			exclusiveBadges: ["Expert Badge", "Pro Status"],
			profileHighlight: true,
			leaderboardRecognition: true,
		},
	},
	{
		id: "master",
		name: "Master",
		minPoints: 7500,
		maxPoints: null,
		rewards: {
			premiumFeatures: true,
			prioritySupport: true,
			exclusiveBadges: ["Master Badge", "Pro Status", "Elite Cleaner"],
			profileHighlight: true,
			leaderboardRecognition: true,
		},
	},
];

export const GET = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase(null);

		// Try to fetch existing configuration
		const { data: configData, error: fetchError } = await supabase
			.from("gamification_levels_config")
			.select("*")
			.single();

		if (fetchError && fetchError.code !== "PGRST116") {
			// PGRST116 is "not found", which is fine for first time
			console.error("Error fetching levels config:", fetchError);
		}

		// If no config exists, return defaults
		if (!configData) {
			return NextResponse.json({
				companyLevels: DEFAULT_COMPANY_LEVELS,
				cleanerLevels: DEFAULT_CLEANER_LEVELS,
			});
		}

		// Parse and return stored config
		return NextResponse.json({
			companyLevels: configData.company_levels || DEFAULT_COMPANY_LEVELS,
			cleanerLevels: configData.cleaner_levels || DEFAULT_CLEANER_LEVELS,
		});
	} catch (error: any) {
		console.error("Error in GET /api/root-admin/gamification/levels/config:", error);
		return NextResponse.json(
			{ error: error?.message || "Failed to fetch levels configuration" },
			{ status: 500 }
		);
	}
});

export const PATCH = withRootAdmin(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const { companyLevels, cleanerLevels } = body;

		if (!companyLevels || !cleanerLevels) {
			return NextResponse.json(
				{ error: "companyLevels and cleanerLevels are required" },
				{ status: 400 }
			);
		}

		const supabase = createServerSupabase(null);

		// Upsert configuration
		const { data, error } = await supabase
			.from("gamification_levels_config")
			.upsert(
				{
					id: 1, // Single config record
					company_levels: companyLevels,
					cleaner_levels: cleanerLevels,
					updated_at: new Date().toISOString(),
				},
				{
					onConflict: "id",
				}
			)
			.select()
			.single();

		if (error) {
			console.error("Error saving levels config:", error);
			return NextResponse.json(
				{ error: error.message || "Failed to save levels configuration" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			companyLevels: data.company_levels,
			cleanerLevels: data.cleaner_levels,
		});
	} catch (error: any) {
		console.error("Error in PATCH /api/root-admin/gamification/levels/config:", error);
		return NextResponse.json(
			{ error: error?.message || "Failed to update levels configuration" },
			{ status: 500 }
		);
	}
});

