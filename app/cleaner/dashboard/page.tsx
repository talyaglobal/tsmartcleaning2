import React from "react";
import { MetricCard } from "@/components/admin/MetricCard";
import { Briefcase, Clock, Wallet, Star } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { QuickActionCard } from "@/components/admin/QuickActionCard";

export default function CleanerDashboard() {
	return (
		<div className="space-y-6">
			<PageHeader title="Cleaner Dashboard" subtitle="Your work overview" />
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<MetricCard title="This Week's Jobs" value="14" icon={<Briefcase className="w-6 h-6" />} />
				<MetricCard title="Hours Worked" value="36h" icon={<Clock className="w-6 h-6" />} />
				<MetricCard title="Earnings (Month)" value="$1,240" icon={<Wallet className="w-6 h-6" />} />
                <MetricCard title="Rating" value="4.9" subtitle="Out of 5" icon={<Star className="w-6 h-6" />} />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<QuickActionCard title="Clock in/out" href="/cleaner/timesheet" />
				<QuickActionCard title="Today's schedule" href="/cleaner/schedule" />
				<QuickActionCard title="Request time off" href="/cleaner/schedule" />
				<QuickActionCard title="Contact dayıbaşı" href="/cleaner/messages" />
			</div>
		</div>
	);
}


