"use client";

import React from "react";
import { MetricCard } from "@/components/admin/MetricCard";
import { LineChart as RLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Building2, Users, DollarSign, Activity } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { QuickActionCard } from "@/components/admin/QuickActionCard";
import { DataTable, Column } from "@/components/admin/DataTable";
import { useEffect, useState } from "react";

const revenueData: Array<{ month: string; value: number }> = [];

type CompanyRow = { name: string; city: string; createdAt: string };

export default function RootAdminDashboard() {
	const [bookingsCount, setBookingsCount] = useState<number>(0);
	const [activeToday, setActiveToday] = useState<number>(0);
	const [totalCompanies, setTotalCompanies] = useState<number>(0);
	const [activeCleaners, setActiveCleaners] = useState<number>(0);
	const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
	const [recentCompanies, setRecentCompanies] = useState<CompanyRow[]>([]);

	useEffect(() => {
		(async () => {
			try {
				const r = await fetch("/api/admin/stats", { cache: "no-store" });
				const s = await r.json();
				setBookingsCount(s?.bookingsCount ?? s?.stats?.totalBookings ?? 0);
				setActiveToday(s?.activeToday ?? s?.stats?.activeBookings ?? 0);
				setTotalCompanies(s?.companiesCount ?? 0);
				setActiveCleaners(s?.providersCount ?? s?.stats?.totalProviders ?? 0);
				setMonthlyRevenue(s?.monthlyRevenue ?? s?.stats?.monthlyRevenue ?? 0);
			} catch {
				// ignore
			}
			try {
				const rc = await fetch("/api/companies/search?limit=5&sort=featured", { cache: "no-store" });
				const data = await rc.json();
				const rows = Array.isArray(data?.results) ? data.results : [];
				setRecentCompanies(
					rows.map((c: any) => ({
						name: c?.name ?? "Unknown",
						city: c?.city ?? "",
						createdAt: new Date().toISOString(), // If created_at not selected by API
					}))
				);
			} catch {
				// ignore
			}
		})();
	}, []);

	return (
		<div className="space-y-6">
			<PageHeader title="Root Admin Dashboard" subtitle="Overview of platform-wide metrics" />
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<MetricCard
					title="Total Companies"
					value={String(totalCompanies)}
					change={{ value: 6.2, positive: true }}
					icon={<Building2 className="w-6 h-6" />}
				/>
				<MetricCard title="Active Cleaners" value={String(activeCleaners)} change={{ value: 2.1, positive: true }} icon={<Users className="w-6 h-6" />} />
				<MetricCard title="Monthly Revenue" value={`$${monthlyRevenue.toLocaleString()}`} change={{ value: 0, positive: true }} icon={<DollarSign className="w-6 h-6" />} />
				<MetricCard title="System Uptime" value="99.97%" subtitle="Last 30 days" icon={<Activity className="w-6 h-6" />} />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<QuickActionCard title="Add new company" description="Create and onboard a company" href="/root-admin/companies/new" />
				<QuickActionCard title="Generate report" description="Export platform analytics" href="/root-admin/reports" />
				<QuickActionCard title="View analytics" description="Explore detailed charts" href="/root-admin/analytics" />
				<QuickActionCard title="System settings" description="Manage platform configuration" href="/root-admin/settings" />
			</div>
			<div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
				<div className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-4">
					<p className="text-sm font-medium text-slate-700 mb-3">Revenue trend (last 6 months)</p>
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<RLineChart data={revenueData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis />
								<Tooltip />
								<Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
							</RLineChart>
						</ResponsiveContainer>
					</div>
				</div>
				<div className="rounded-lg border border-slate-200 bg-white p-4">
					<p className="text-sm font-medium text-slate-700 mb-3">Recent company registrations</p>
					<DataTable<CompanyRow>
						columns={[
							{ key: "name", header: "Company" },
							{ key: "city", header: "City" },
							{ key: "createdAt", header: "Created" },
						]}
						data={recentCompanies}
					/>
				</div>
			</div>
		</div>
	);
}


