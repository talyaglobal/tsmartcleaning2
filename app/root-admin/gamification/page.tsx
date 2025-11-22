"use client";

import React, { useEffect, useState } from "react";
import { MetricCard } from "@/components/admin/MetricCard";
import { PageHeader } from "@/components/admin/PageHeader";
import { LoadingSpinner } from "@/components/admin/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
	Users,
	DollarSign,
	Briefcase,
	TrendingUp,
	AlertCircle,
	CheckCircle2,
	Clock,
	Target,
	Trophy,
	Bell,
	FileText,
	Activity,
	UserPlus,
	Plus,
	Calendar,
	AlertTriangle,
} from "lucide-react";

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

// GTM Strategy Progress Bar Component
function GTMProgressBar({ data }: { data: StatsData["gtmProgress"] }) {
	return (
		<div className="rounded-lg border border-slate-200 bg-white p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-slate-900">GTM Strategy Progress</h3>
				<Badge variant="outline" className="text-xs">
					{data.daysRemaining} days remaining
				</Badge>
			</div>
			<div className="space-y-3">
				<div>
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium text-slate-700">{data.currentPhase}</span>
						<span className="text-sm text-slate-500">{data.overallProgress}%</span>
					</div>
					<Progress value={data.overallProgress} className="h-2" />
				</div>
				<div className="pt-2 border-t border-slate-100">
					<p className="text-xs text-slate-500">
						Next milestone: <span className="font-medium text-slate-700">{data.nextMilestone}</span>
					</p>
				</div>
			</div>
		</div>
	);
}

// Team TODO Completion Component
function TeamTODOCompletion({ data }: { data: StatsData["teamProgress"] }) {
	return (
		<div className="rounded-lg border border-slate-200 bg-white p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-slate-900">Team TODO Progress</h3>
				{data.overdue > 0 && (
					<Badge variant="destructive" className="text-xs">
						{data.overdue} overdue
					</Badge>
				)}
			</div>
			<div className="space-y-4">
				<div>
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium text-slate-700">Volkan (CEO/Founder)</span>
						<span className="text-sm text-slate-500">{data.volkan.percentage}%</span>
					</div>
					<Progress value={data.volkan.percentage} className="h-2" />
					<p className="text-xs text-slate-500 mt-1">
						{data.volkan.completed} of {data.volkan.total} tasks completed
					</p>
				</div>
				<div>
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-medium text-slate-700">Özgün (CTO/Co-founder)</span>
						<span className="text-sm text-slate-500">{data.ozgun.percentage}%</span>
					</div>
					<Progress value={data.ozgun.percentage} className="h-2" />
					<p className="text-xs text-slate-500 mt-1">
						{data.ozgun.completed} of {data.ozgun.total} tasks completed
					</p>
				</div>
				<div className="pt-3 border-t border-slate-100">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm font-semibold text-slate-900">Overall</span>
						<span className="text-sm font-semibold text-slate-900">{data.overall.percentage}%</span>
					</div>
					<Progress value={data.overall.percentage} className="h-2" />
				</div>
			</div>
		</div>
	);
}

// Recent Activity Feed Component
function RecentActivityFeed({ activities }: { activities: StatsData["recentActivities"] }) {
	const getActivityIcon = (type: string) => {
		switch (type) {
			case "signup":
				return <UserPlus className="h-4 w-4 text-blue-500" />;
			case "certification":
				return <CheckCircle2 className="h-4 w-4 text-green-500" />;
			case "badge":
				return <Trophy className="h-4 w-4 text-yellow-500" />;
			case "job":
				return <Briefcase className="h-4 w-4 text-purple-500" />;
			case "ticket":
				return <AlertCircle className="h-4 w-4 text-red-500" />;
			default:
				return <Activity className="h-4 w-4 text-slate-500" />;
		}
	};

	const formatTimestamp = (timestamp: string) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	};

	return (
		<div className="rounded-lg border border-slate-200 bg-white p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
				<Button variant="ghost" size="sm" className="text-xs">
					View all
				</Button>
			</div>
			<div className="space-y-3 max-h-96 overflow-y-auto">
				{activities.length === 0 ? (
					<p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
				) : (
					activities.map((activity, idx) => (
						<div key={idx} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded">
							<div className="mt-0.5">{getActivityIcon(activity.type)}</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm text-slate-900">{activity.description}</p>
								<p className="text-xs text-slate-500 mt-0.5">{formatTimestamp(activity.timestamp)}</p>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

// Quick Actions Panel Component
function QuickActionsPanel() {
	const actions = [
		{
			title: "Create new challenge",
			description: "Set up a time-based challenge",
			icon: <Target className="h-5 w-5" />,
			href: "/root-admin/gamification/challenges/new",
		},
		{
			title: "Send platform notification",
			description: "Broadcast message to all users",
			icon: <Bell className="h-5 w-5" />,
			href: "/root-admin/notifications/new",
		},
		{
			title: "Export daily report",
			description: "Download today's analytics",
			icon: <FileText className="h-5 w-5" />,
			href: "/root-admin/reports?type=daily",
		},
		{
			title: "View system health",
			description: "Check platform status",
			icon: <Activity className="h-5 w-5" />,
			href: "/root-admin/metrics",
		},
		{
			title: "Add new admin user",
			description: "Grant admin access",
			icon: <UserPlus className="h-5 w-5" />,
			href: "/root-admin/users/new",
		},
	];

	return (
		<div className="rounded-lg border border-slate-200 bg-white p-6">
			<h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{actions.map((action, idx) => (
					<a
						key={idx}
						href={action.href}
						className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
					>
						<div className="text-slate-500">{action.icon}</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-slate-900">{action.title}</p>
							<p className="text-xs text-slate-500 mt-0.5">{action.description}</p>
						</div>
					</a>
				))}
			</div>
		</div>
	);
}

export default function GamificationDashboard() {
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
				<PageHeader title="Gamification Dashboard" subtitle="Monitor gamification system and platform metrics" />
				<LoadingSpinner label="Loading dashboard data..." />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="space-y-6">
				<PageHeader title="Gamification Dashboard" subtitle="Monitor gamification system and platform metrics" />
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error || "Failed to load dashboard data"}</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader title="Gamification Dashboard" subtitle="Monitor gamification system and platform metrics" />

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

