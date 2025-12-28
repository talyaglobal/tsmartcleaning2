"use client";

import React, { useEffect, useState } from "react";
import { MetricCard } from "@/components/admin/MetricCard";
import { Users, DollarSign, Briefcase, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/admin/LoadingSpinner";
import { AlertCircle } from "lucide-react";
import { GTMProgressBar } from "@/components/admin/dashboard/GTMProgressBar";
import { TeamTODOCompletion } from "@/components/admin/dashboard/TeamTODOCompletion";
import { RecentActivityFeed } from "@/components/admin/dashboard/RecentActivityFeed";
import { QuickActionsPanel } from "@/components/admin/dashboard/QuickActionsPanel";

type StatsData = {
	metrics: {
		totalUsers: {
			total: number;
			companies: number;
			cleaners: number;
			growthRate: number;
		};
		activeJobs: {
			active: number;
			completedToday: number;
			completionRate: number;
		};
		monthlyRevenue: {
			mrr: number;
			target: number;
			progress: number;
		};
		engagementScore: {
			overall: number;
			company: number;
			cleaner: number;
		};
	};
	gtmProgress: {
		currentPhase: string;
		overallProgress: number;
		nextMilestone: string;
		daysRemaining: number;
	};
	teamProgress: {
		volkan: { completed: number; total: number; percentage: number };
		ozgun: { completed: number; total: number; percentage: number };
		overall: { completed: number; total: number; percentage: number };
		overdue: number;
	};
	recentActivities: Array<{
		type: string;
		description: string;
		timestamp: string;
	}>;
};

export default function RootAdminDashboard() {
	const [data, setData] = useState<StatsData | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchStats = async () => {
			setLoading(true);
			setError(null);
			try {
				const response = await fetch("/api/root-admin/gamification/stats", { cache: "no-store" });
				if (!response.ok) {
					throw new Error(`Failed to load stats: ${response.status}`);
				}
				const statsData = await response.json();
				setData(statsData);
			} catch (err: any) {
				console.error("Error loading gamification stats:", err);
				setError(err?.message || "Failed to load dashboard statistics");
			} finally {
				setLoading(false);
			}
		};

		fetchStats();
		// Set up polling every 30 seconds for real-time updates
		const interval = setInterval(fetchStats, 30000);
		return () => clearInterval(interval);
	}, []);

	if (loading) {
		return (
			<div className="space-y-6">
				<PageHeader title="Gamification Root Admin Dashboard" subtitle="Monitor gamification system and platform metrics" />
				<LoadingSpinner label="Loading dashboard data..." />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="space-y-6">
				<PageHeader title="Gamification Root Admin Dashboard" subtitle="Monitor gamification system and platform metrics" />
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error || "Failed to load dashboard data"}</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader title="Gamification Root Admin Dashboard" subtitle="Monitor gamification system and platform metrics" />

			{/* Key Metrics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<MetricCard
					title="Total Users"
					value={data.metrics.totalUsers.total.toLocaleString()}
					change={{
						value: data.metrics.totalUsers.growthRate,
						positive: data.metrics.totalUsers.growthRate >= 0,
						label: `${data.metrics.totalUsers.growthRate >= 0 ? "+" : ""}${data.metrics.totalUsers.growthRate}% growth`,
					}}
					icon={<Users className="w-6 h-6" />}
					subtitle={`${data.metrics.totalUsers.companies} companies + ${data.metrics.totalUsers.cleaners} cleaners`}
				/>
				<MetricCard
					title="Active Jobs"
					value={data.metrics.activeJobs.active.toLocaleString()}
					change={{
						value: data.metrics.activeJobs.completionRate,
						positive: true,
						label: `${data.metrics.activeJobs.completionRate}% completion rate`,
					}}
					icon={<Briefcase className="w-6 h-6" />}
					subtitle={`${data.metrics.activeJobs.completedToday} completed today`}
				/>
				<MetricCard
					title="Monthly Revenue"
					value={`$${data.metrics.monthlyRevenue.mrr.toLocaleString()}`}
					change={{
						value: data.metrics.monthlyRevenue.progress,
						positive: data.metrics.monthlyRevenue.progress >= 0,
						label: `${data.metrics.monthlyRevenue.progress}% of target`,
					}}
					icon={<DollarSign className="w-6 h-6" />}
					subtitle={`Target: $${data.metrics.monthlyRevenue.target.toLocaleString()}`}
				/>
				<MetricCard
					title="Engagement Score"
					value={`${data.metrics.engagementScore.overall}%`}
					change={{
						value: 0,
						positive: true,
						label: "Overall engagement",
					}}
					icon={<TrendingUp className="w-6 h-6" />}
					subtitle={`Company: ${data.metrics.engagementScore.company}% | Cleaner: ${data.metrics.engagementScore.cleaner}%`}
				/>
			</div>

			{/* Progress Tracking Section */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<GTMProgressBar data={data.gtmProgress} />
				<TeamTODOCompletion data={data.teamProgress} />
			</div>

			{/* Activity Feed & Quick Actions */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<RecentActivityFeed activities={data.recentActivities} />
				<QuickActionsPanel />
			</div>
		</div>
	);
}


