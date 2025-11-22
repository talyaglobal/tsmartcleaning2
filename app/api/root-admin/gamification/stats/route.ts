import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { withRootAdmin } from "@/lib/auth/rbac";

export const GET = withRootAdmin(async (req: NextRequest) => {
	try {
		const supabase = createServerSupabase(null);

		// Get total companies count
		const { count: totalCompanies } = await supabase
			.from("companies")
			.select("id", { count: "exact", head: true })
			.eq("status", "active");

		// Get total cleaners (providers) count
		const { count: totalCleaners } = await supabase
			.from("provider_profiles")
			.select("id", { count: "exact", head: true });

		// Calculate growth rate (compare this month to last month)
		const now = new Date();
		const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

		const { count: companiesThisMonth } = await supabase
			.from("companies")
			.select("id", { count: "exact", head: true })
			.gte("created_at", thisMonthStart.toISOString())
			.eq("status", "active");

		const { count: companiesLastMonth } = await supabase
			.from("companies")
			.select("id", { count: "exact", head: true })
			.gte("created_at", lastMonthStart.toISOString())
			.lte("created_at", lastMonthEnd.toISOString())
			.eq("status", "active");

		const { count: cleanersThisMonth } = await supabase
			.from("provider_profiles")
			.select("id", { count: "exact", head: true })
			.gte("created_at", thisMonthStart.toISOString());

		const { count: cleanersLastMonth } = await supabase
			.from("provider_profiles")
			.select("id", { count: "exact", head: true })
			.gte("created_at", lastMonthStart.toISOString())
			.lte("created_at", lastMonthEnd.toISOString());

		const totalUsers = (totalCompanies ?? 0) + (totalCleaners ?? 0);
		const usersThisMonth = (companiesThisMonth ?? 0) + (cleanersThisMonth ?? 0);
		const usersLastMonth = (companiesLastMonth ?? 0) + (cleanersLastMonth ?? 0);
		const growthRate =
			usersLastMonth > 0 ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100 : 0;

		// Get active jobs (bookings)
		const { count: activeJobs } = await supabase
			.from("bookings")
			.select("id", { count: "exact", head: true })
			.in("status", ["pending", "confirmed", "in-progress"]);

		// Get completed jobs today
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayStr = today.toISOString().split("T")[0];

		const { count: completedToday } = await supabase
			.from("bookings")
			.select("id", { count: "exact", head: true })
			.eq("status", "completed")
			.gte("completed_at", todayStr);

		// Get total completed jobs for completion rate calculation
		const { count: totalCompleted } = await supabase
			.from("bookings")
			.select("id", { count: "exact", head: true })
			.eq("status", "completed");

		const { count: totalBookings } = await supabase
			.from("bookings")
			.select("id", { count: "exact", head: true });

		const completionRate =
			totalBookings && totalBookings > 0 ? ((totalCompleted ?? 0) / totalBookings) * 100 : 0;

		// Get monthly revenue (MRR)
		const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
		const { data: revenueData } = await supabase
			.from("transactions")
			.select("amount")
			.gte("created_at", monthStart)
			.eq("status", "completed")
			.in("transaction_type", ["payment", "payout"]);

		const monthlyRevenue = (revenueData ?? []).reduce((sum, t: any) => sum + Number(t.amount || 0), 0);
		const targetRevenue = 1850;
		const revenueProgress = targetRevenue > 0 ? (monthlyRevenue / targetRevenue) * 100 : 0;

		// Calculate engagement scores
		// Overall engagement: percentage of active users (logged in within last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		// Get active companies (with bookings or activity in last 30 days)
		const { count: activeCompanies } = await supabase
			.from("companies")
			.select("id", { count: "exact", head: true })
			.eq("status", "active")
			.gte("updated_at", thirtyDaysAgo.toISOString());

		// Get active cleaners (with bookings or activity in last 30 days)
		const { count: activeCleaners } = await supabase
			.from("provider_profiles")
			.select("id", { count: "exact", head: true })
			.gte("updated_at", thirtyDaysAgo.toISOString());

		const companyEngagement =
			(totalCompanies ?? 0) > 0 ? ((activeCompanies ?? 0) / (totalCompanies ?? 1)) * 100 : 0;
		const cleanerEngagement =
			(totalCleaners ?? 0) > 0 ? ((activeCleaners ?? 0) / (totalCleaners ?? 1)) * 100 : 0;
		const overallEngagement =
			totalUsers > 0 ? ((activeCompanies ?? 0) + (activeCleaners ?? 0)) / totalUsers : 0;

		// GTM Strategy Progress (mock data for now - can be enhanced with actual tracking)
		const gtmPhases = [
			{ name: "Phase 1: Foundation", startDate: "2025-01-01", endDate: "2025-02-28", progress: 100 },
			{ name: "Phase 2: Soft Launch", startDate: "2025-03-01", endDate: "2025-04-30", progress: 75 },
			{ name: "Phase 3: Growth", startDate: "2025-05-01", endDate: "2025-06-30", progress: 50 },
		];

		const currentPhase = gtmPhases.find(
			(phase) =>
				new Date(phase.startDate) <= now && new Date(phase.endDate) >= now
		) || gtmPhases[gtmPhases.length - 1];

		const phaseEnd = new Date(currentPhase.endDate);
		const daysRemaining = Math.max(0, Math.ceil((phaseEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

		// Team TODO Progress (mock data - can be enhanced with actual TODO tracking)
		const teamProgress = {
			volkan: { completed: 12, total: 20, percentage: 60 },
			ozgun: { completed: 15, total: 20, percentage: 75 },
			overall: { completed: 27, total: 40, percentage: 67.5 },
			overdue: 3,
		};

		// Recent Activity Feed (last 20 activities)
		// Get company signups
		const { data: companySignups } = await supabase
			.from("companies")
			.select("id, name, created_at")
			.order("created_at", { ascending: false })
			.limit(5);

		// Get cleaner signups (provider profiles)
		const { data: cleanerSignups } = await supabase
			.from("provider_profiles")
			.select("id, business_name, created_at")
			.order("created_at", { ascending: false })
			.limit(5);

		// Get completed jobs
		const { data: completedJobs } = await supabase
			.from("bookings")
			.select("id, completed_at")
			.eq("status", "completed")
			.not("completed_at", "is", null)
			.order("completed_at", { ascending: false })
			.limit(5);

		// Get badge awards (from user_achievements if table exists)
		const { data: badgeAwards } = await supabase
			.from("user_achievements")
			.select("id, earned_at")
			.order("earned_at", { ascending: false })
			.limit(5)
			.catch(() => ({ data: null }));

		const activities = [
			...(companySignups ?? []).map((c: any) => ({
				type: "signup" as const,
				description: `New company signup: ${c.name || "Unknown Company"}`,
				timestamp: c.created_at,
			})),
			...(cleanerSignups ?? []).map((p: any) => ({
				type: "signup" as const,
				description: `New cleaner signup: ${p.business_name || "Unknown Cleaner"}`,
				timestamp: p.created_at,
			})),
			...(completedJobs ?? []).map((j: any) => ({
				type: "job" as const,
				description: `Job completed`,
				timestamp: j.completed_at,
			})),
			...(badgeAwards ?? []).map((b: any) => ({
				type: "badge" as const,
				description: `Badge earned`,
				timestamp: b.earned_at,
			})),
		]
			.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
			.slice(0, 20);

		return NextResponse.json({
			metrics: {
				totalUsers: {
					total: totalUsers,
					companies: totalCompanies ?? 0,
					cleaners: totalCleaners ?? 0,
					growthRate: Math.round(growthRate * 10) / 10,
				},
				activeJobs: {
					active: activeJobs ?? 0,
					completedToday: completedToday ?? 0,
					completionRate: Math.round(completionRate * 10) / 10,
				},
				monthlyRevenue: {
					mrr: monthlyRevenue,
					target: targetRevenue,
					progress: Math.round(revenueProgress * 10) / 10,
				},
				engagementScore: {
					overall: Math.round(overallEngagement * 100 * 10) / 10,
					company: Math.round(companyEngagement * 10) / 10,
					cleaner: Math.round(cleanerEngagement * 10) / 10,
				},
			},
			gtmProgress: {
				currentPhase: currentPhase.name,
				overallProgress: currentPhase.progress,
				nextMilestone: gtmPhases.find((p) => p.progress < 100)?.name || "All phases complete",
				daysRemaining,
			},
			teamProgress,
			recentActivities: activities,
		});
	} catch (error: any) {
		console.error("[gamification] stats error:", error);
		return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
	}
});

