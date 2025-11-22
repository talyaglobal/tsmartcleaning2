import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";
import type { UserType } from "@/lib/gamification/types";

type ChallengeStatus = 'draft' | 'active' | 'completed' | 'cancelled'

export const GET = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase(null);
		const { searchParams } = new URL(req.url);

		const status = searchParams.get("status") as ChallengeStatus | null;
		const userType = searchParams.get("userType") as UserType | null;
		const limit = parseInt(searchParams.get("limit") || "50");
		const offset = parseInt(searchParams.get("offset") || "0");

		let query = supabase
			.from("gamification_challenges")
			.select("*")
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		if (status) {
			query = query.eq("status", status);
		}

		// Note: user_type is stored in criteria JSONB, so we'd need to filter differently
		// For now, we'll get all and filter in the response

		const { data: challenges, error } = await query;

		if (error) {
			console.error("[gamification] GET challenges error:", error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Filter by userType if provided (check in criteria)
		let filteredChallenges = challenges || [];
		if (userType) {
			filteredChallenges = filteredChallenges.filter((challenge) => {
				const criteria = challenge.criteria || {};
				return criteria.user_type === userType;
			});
		}

		// Get total count
		let countQuery = supabase.from("gamification_challenges").select("*", { count: "exact", head: true });
		if (status) {
			countQuery = countQuery.eq("status", status);
		}
		const { count } = await countQuery;

		return NextResponse.json({
			challenges: filteredChallenges,
			pagination: {
				total: count || 0,
				limit,
				offset,
				hasMore: (offset + limit) < (count || 0),
			},
		});
	} catch (error: any) {
		console.error("[gamification] GET challenges error:", error);
		return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
	}
});

export const POST = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase(null);
		const body = await req.json();

		const { name, description, challenge_type, start_date, end_date, criteria, rewards, status, tenant_id } = body;

		// Validation
		if (!name || !challenge_type || !start_date || !end_date) {
			return NextResponse.json(
				{ error: "Missing required fields: name, challenge_type, start_date, end_date" },
				{ status: 400 }
			);
		}

		if (new Date(end_date) <= new Date(start_date)) {
			return NextResponse.json({ error: "end_date must be after start_date" }, { status: 400 });
		}

		// Validate challenge_type
		const validTypes = ['booking_count', 'rating_target', 'streak', 'points', 'jobs', 'ratings', 'custom'];
		if (!validTypes.includes(challenge_type)) {
			return NextResponse.json(
				{ error: `Invalid challenge_type. Must be one of: ${validTypes.join(", ")}` },
				{ status: 400 }
			);
		}

		// Validate status
		const validStatuses: ChallengeStatus[] = ['draft', 'active', 'completed', 'cancelled'];
		if (status && !validStatuses.includes(status)) {
			return NextResponse.json(
				{ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
				{ status: 400 }
			);
		}

		// Create challenge
		const { data: challenge, error } = await supabase
			.from("gamification_challenges")
			.insert({
				name,
				description: description || null,
				challenge_type,
				start_date,
				end_date,
				criteria: criteria || {},
				rewards: rewards || {},
				status: status || 'draft',
				tenant_id: tenant_id || null,
			})
			.select()
			.single();

		if (error) {
			console.error("[gamification] POST challenges error:", error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ challenge }, { status: 201 });
	} catch (error: any) {
		console.error("[gamification] POST challenges error:", error);
		return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
	}
});

