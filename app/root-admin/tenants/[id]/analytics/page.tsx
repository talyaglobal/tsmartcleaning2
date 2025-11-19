import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { MetricCard } from "@/components/admin/MetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TenantAnalytics = {
	tenant: {
		id: string;
		name: string;
		status: string;
	};
	users: {
		total: number;
		newThisMonth: number;
		growth: number;
	};
	providers: {
		total: number;
		active: number;
		pendingVerifications: number;
	};
	bookings: {
		total: number;
		thisMonth: number;
		completedThisMonth: number;
		activeToday: number;
		growth: number;
	};
	revenue: {
		total: number;
		thisMonth: number;
		growth: number;
	};
	reviews: {
		total: number;
		averageRating: number;
		thisMonth: number;
	};
	usage: {
		bookingsThisMonth: number;
		messagesThisMonth: number;
	};
	performance: {
		completionRate: number;
		avgBookingsPerDay: number;
	};
	charts: {
		activity: Array<{ date: string; total: number; completed: number }>;
		revenue: Array<{ month: string; revenue: number }>;
	};
	topServices: Array<{ serviceId: string; count: number }>;
};

async function loadTenantAnalytics(tenantId: string): Promise<TenantAnalytics | null> {
	try {
		const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
			? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
			: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

		const res = await fetch(`${baseUrl}/api/tenants/${tenantId}/analytics`, {
			next: { revalidate: 60 },
			cache: "default",
		});

		if (!res.ok) {
			throw new Error(`Failed to load analytics: ${res.status}`);
		}

		const json = await res.json() as TenantAnalytics;
		return json;
	} catch (error) {
		console.error("[Tenant Analytics] Load error:", error);
		return null;
	}
}

export default async function TenantAnalyticsPage({
	params,
}: {
	params: { id: string };
}) {
	const analytics = await loadTenantAnalytics(params.id);

	if (!analytics) {
		return (
			<>
				<PageHeader
					title="Tenant Analytics"
					subtitle="Failed to load analytics data"
					withBorder
					breadcrumb={
						<div>
							<Link href="/root-admin" className="hover:underline">Root Admin</Link>
							<span className="mx-1">/</span>
							<Link href="/root-admin/tenants" className="hover:underline">Tenants</Link>
							<span className="mx-1">/</span>
							<span>Analytics</span>
						</div>
					}
				/>
				<div className="text-center py-12 text-slate-500">
					Unable to load analytics. Please try again later.
				</div>
			</>
		);
	}

	const statusColor = {
		active: "bg-green-100 text-green-700",
		suspended: "bg-yellow-100 text-yellow-700",
		archived: "bg-slate-100 text-slate-700",
	}[analytics.tenant.status] || "bg-slate-100 text-slate-700";

	return (
		<>
			<PageHeader
				title={`Analytics: ${analytics.tenant.name}`}
				subtitle="Tenant-specific metrics and performance reports"
				withBorder
				breadcrumb={
					<div>
						<Link href="/root-admin" className="hover:underline">Root Admin</Link>
						<span className="mx-1">/</span>
						<Link href="/root-admin/tenants" className="hover:underline">Tenants</Link>
						<span className="mx-1">/</span>
						<span>Analytics</span>
					</div>
				}
				actions={
					<Badge className={statusColor}>{analytics.tenant.status}</Badge>
				}
			/>

			{/* Overview Metrics */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
				<MetricCard
					title="Total Users"
					value={analytics.users.total}
					change={{
						value: analytics.users.growth,
						positive: analytics.users.growth >= 0,
						label: `${analytics.users.growth >= 0 ? "+" : ""}${analytics.users.growth}% vs last month`,
					}}
					subtitle={`${analytics.users.newThisMonth} new this month`}
				/>
				<MetricCard
					title="Total Providers"
					value={analytics.providers.total}
					subtitle={`${analytics.providers.active} active, ${analytics.providers.pendingVerifications} pending`}
				/>
				<MetricCard
					title="Total Bookings"
					value={analytics.bookings.total}
					change={{
						value: analytics.bookings.growth,
						positive: analytics.bookings.growth >= 0,
						label: `${analytics.bookings.growth >= 0 ? "+" : ""}${analytics.bookings.growth}% vs last month`,
					}}
					subtitle={`${analytics.bookings.thisMonth} this month`}
				/>
				<MetricCard
					title="Total Revenue"
					value={`$${(analytics.revenue.total / 100).toFixed(2)}`}
					change={{
						value: analytics.revenue.growth,
						positive: analytics.revenue.growth >= 0,
						label: `${analytics.revenue.growth >= 0 ? "+" : ""}${analytics.revenue.growth}% vs last month`,
					}}
					subtitle={`$${(analytics.revenue.thisMonth / 100).toFixed(2)} this month`}
				/>
			</div>

			{/* Monthly Metrics */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
				<MetricCard
					title="Active Bookings Today"
					value={analytics.bookings.activeToday}
				/>
				<MetricCard
					title="Completed This Month"
					value={analytics.bookings.completedThisMonth}
				/>
				<MetricCard
					title="Monthly Revenue"
					value={`$${(analytics.revenue.thisMonth / 100).toFixed(2)}`}
				/>
				<MetricCard
					title="Average Rating"
					value={analytics.reviews.averageRating > 0 ? `${analytics.reviews.averageRating.toFixed(1)} ⭐` : "N/A"}
					subtitle={`${analytics.reviews.total} total reviews`}
				/>
			</div>

			{/* Usage Metrics */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
				<MetricCard
					title="Bookings (This Month)"
					value={analytics.usage.bookingsThisMonth}
					subtitle="From usage metering"
				/>
				<MetricCard
					title="Messages (This Month)"
					value={analytics.usage.messagesThisMonth}
					subtitle="From usage metering"
				/>
			</div>

			{/* Performance Metrics */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
				<Card>
					<CardHeader>
						<CardTitle>Performance Metrics</CardTitle>
						<CardDescription>Key performance indicators for this tenant</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4">
							<div className="p-3 bg-gray-50 rounded">
								<span className="block text-sm text-gray-600">Completion Rate (30d)</span>
								<span className="text-2xl font-bold">{analytics.performance.completionRate}%</span>
							</div>
							<div className="p-3 bg-gray-50 rounded">
								<span className="block text-sm text-gray-600">Avg Bookings/Day</span>
								<span className="text-2xl font-bold">{analytics.performance.avgBookingsPerDay}</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Reviews Summary</CardTitle>
						<CardDescription>Customer feedback metrics</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Total Reviews</span>
								<span className="text-lg font-semibold">{analytics.reviews.total}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Average Rating</span>
								<span className="text-lg font-semibold">
									{analytics.reviews.averageRating > 0
										? `${analytics.reviews.averageRating.toFixed(1)} ⭐`
										: "N/A"}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-gray-600">Reviews This Month</span>
								<span className="text-lg font-semibold">{analytics.reviews.thisMonth}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Charts Section */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
				<Card>
					<CardHeader>
						<CardTitle>Activity (Last 30 Days)</CardTitle>
						<CardDescription>Daily booking activity and completions</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2 max-h-64 overflow-y-auto">
							{analytics.charts.activity.map((day) => (
								<div key={day.date} className="flex items-center justify-between text-sm">
									<span className="text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
									<div className="flex gap-4">
										<span className="text-gray-800">Total: {day.total}</span>
										<span className="text-green-600">Completed: {day.completed}</span>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Revenue Trend (Last 12 Months)</CardTitle>
						<CardDescription>Monthly revenue breakdown</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2 max-h-64 overflow-y-auto">
							{analytics.charts.revenue.map((month) => (
								<div key={month.month} className="flex items-center justify-between text-sm">
									<span className="text-gray-600">{month.month}</span>
									<span className="text-lg font-semibold">
										${(month.revenue / 100).toFixed(2)}
									</span>
								</div>
							))}
							{analytics.charts.revenue.length === 0 && (
								<div className="text-center py-8 text-gray-500">
									No revenue data available
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Top Services */}
			{analytics.topServices.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Top Services (Last 30 Days)</CardTitle>
						<CardDescription>Most popular services by booking count</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{analytics.topServices.map((service, index) => (
								<div key={service.serviceId} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
									<span className="text-gray-600">
										#{index + 1} Service {service.serviceId.slice(0, 8)}...
									</span>
									<span className="font-semibold">{service.count} bookings</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</>
	);
}

