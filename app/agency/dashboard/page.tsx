import React from "react";
import { MetricCard } from "@/components/admin/MetricCard";
import { Users, UserCheck, Building2, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { QuickActionCard } from "@/components/admin/QuickActionCard";

export default function AgencyDashboard() {
	return (
		<div className="space-y-6">
			<PageHeader title="Agency Dashboard" subtitle="Recruitment and placements overview" />
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<MetricCard title="Active Candidates" value="233" icon={<Users className="w-6 h-6" />} />
				<MetricCard title="Placements" value="48" change={{ value: 4.2, positive: true }} icon={<UserCheck className="w-6 h-6" />} />
				<MetricCard title="Partner Companies" value="27" icon={<Building2 className="w-6 h-6" />} />
				<MetricCard title="Revenue (Month)" value="$18,420" icon={<DollarSign className="w-6 h-6" />} />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<QuickActionCard title="Add candidate" href="/agency/candidates" />
				<QuickActionCard title="Match to job" href="/agency/placements" />
				<QuickActionCard title="Schedule training" href="/agency/training" />
				<QuickActionCard title="Contact company" href="/agency/companies" />
			</div>
		</div>
	);
}


