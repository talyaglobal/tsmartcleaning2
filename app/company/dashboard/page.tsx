import React from "react";
import { MetricCard } from "@/components/admin/MetricCard";
import { Users, UserCheck, ClipboardList, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { QuickActionCard } from "@/components/admin/QuickActionCard";

export default function CompanyDashboard() {
	return (
		<div className="space-y-6">
			<PageHeader title="Company Dashboard" subtitle="Overview of your company operations" />
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<MetricCard title="Total Teams" value="6" icon={<Users className="w-6 h-6" />} />
				<MetricCard title="Active Cleaners" value="54" icon={<UserCheck className="w-6 h-6" />} />
				<MetricCard title="Jobs This Month" value="312" change={{ value: 3.1, positive: true }} icon={<ClipboardList className="w-6 h-6" />} />
				<MetricCard title="Monthly Revenue" value="$42,780" icon={<DollarSign className="w-6 h-6" />} />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<QuickActionCard title="Schedule job" description="Create a new job" href="/company/jobs" />
				<QuickActionCard title="Add cleaner" description="Invite a cleaner" href="/company/cleaners" />
				<QuickActionCard title="View teams" description="Manage teams" href="/company/teams" />
				<QuickActionCard title="Generate payroll" description="Run payroll report" href="/company/invoices" />
			</div>
		</div>
	);
}


