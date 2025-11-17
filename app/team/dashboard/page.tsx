import React from "react";
import { MetricCard } from "@/components/admin/MetricCard";
import { Users, Building2, Headphones, Activity } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { QuickActionCard } from "@/components/admin/QuickActionCard";

export default function TeamDashboard() {
	return (
		<div className="space-y-6">
			<PageHeader title="Platform Team Dashboard" subtitle="Platform operations overview" />
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<MetricCard title="Platform Users" value="18,430" icon={<Users className="w-6 h-6" />} />
				<MetricCard title="Active Companies" value="128" icon={<Building2 className="w-6 h-6" />} />
				<MetricCard title="Open Tickets" value="34" change={{ value: 1.1, positive: false }} icon={<Headphones className="w-6 h-6" />} />
				<MetricCard title="System Uptime" value="99.97%" subtitle="Last 30 days" icon={<Activity className="w-6 h-6" />} />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<QuickActionCard title="Create announcement" href="/team/announcements" />
				<QuickActionCard title="Respond to ticket" href="/team/support" />
				<QuickActionCard title="View analytics" href="/team/stats" />
				<QuickActionCard title="Update content" href="/team/content" />
			</div>
		</div>
	);
}


