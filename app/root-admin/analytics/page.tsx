import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { MetricCard } from "@/components/admin/MetricCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GamificationAnalytics } from "./components/GamificationAnalytics";
import { RevenueInsights } from "./components/RevenueInsights";
import { BarChart3, TrendingUp, Trophy, DollarSign } from "lucide-react";

type StatsResponse = {
	stats: {
		totalUsers: number;
		totalProviders: number;
		totalBookings: number;
		totalRevenue: number;
		activeBookings: number;
		pendingVerifications: number;
		monthlyRevenue: number;
		monthlyGrowth: number;
		monthBookings: number;
		monthMessages: number;
	};
};

async function loadStats(): Promise<StatsResponse["stats"]> {
	try {
		const res = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL ? "https://" + process.env.NEXT_PUBLIC_VERCEL_URL : ""}/api/admin/stats`, {
			// Revalidate periodically; analytics can be slightly stale
			next: { revalidate: 60 },
			// In dev, relative fetch is fine; in prod, ensure absolute URL
			cache: "default",
		});
		if (!res.ok) {
			throw new Error(`Failed to load stats: ${res.status}`);
		}
		const json = (await res.json()) as StatsResponse;
		return json.stats;
	} catch {
		// Fallback to zeros to avoid breaking the page
		return {
			totalUsers: 0,
			totalProviders: 0,
			totalBookings: 0,
			totalRevenue: 0,
			activeBookings: 0,
			pendingVerifications: 0,
			monthlyRevenue: 0,
			monthlyGrowth: 0,
			monthBookings: 0,
			monthMessages: 0,
		};
	}
}

export default async function Page() {
	const stats = await loadStats();
	return (
		<>
			<PageHeader
				title="Analytics & Insights"
				subtitle="Platform metrics, gamification performance, and revenue insights"
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<span>Analytics & Insights</span>
					</div>
				}
			/>
			
			{/* Overview Metrics */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
				<MetricCard title="Total Users" value={stats.totalUsers} />
				<MetricCard title="Providers" value={stats.totalProviders} />
				<MetricCard title="Bookings (All-time)" value={stats.totalBookings} />
				<MetricCard title="Revenue (All-time)" value={`$${(stats.totalRevenue / 100).toFixed(2)}`} />
			</div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
				<MetricCard title="Active Bookings Today" value={stats.activeBookings} />
				<MetricCard title="Pending Verifications" value={stats.pendingVerifications} />
				<MetricCard title="Revenue (This Month)" value={`$${(stats.monthlyRevenue / 100).toFixed(2)}`} />
				<MetricCard title="Monthly Growth" value={`${stats.monthlyGrowth}%`} />
			</div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
				<MetricCard title="Metered Bookings (This Month)" value={stats.monthBookings} subtitle="From usage metering" />
				<MetricCard title="Messages (This Month)" value={stats.monthMessages} subtitle="From usage metering" />
			</div>

			{/* Detailed Analytics Tabs */}
			<Tabs defaultValue="gamification" className="mt-6">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="gamification">
						<Trophy className="h-4 w-4 mr-2" />
						Gamification Analytics
					</TabsTrigger>
					<TabsTrigger value="revenue">
						<DollarSign className="h-4 w-4 mr-2" />
						Revenue Insights
					</TabsTrigger>
				</TabsList>

				<TabsContent value="gamification" className="mt-6">
					<GamificationAnalytics />
				</TabsContent>

				<TabsContent value="revenue" className="mt-6">
					<RevenueInsights />
				</TabsContent>
			</Tabs>
		</>
	);
}
