import React from "react";
import { MetricCard } from "@/components/admin/MetricCard";
import { Users, ClipboardCheck, CheckCircle, Award } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { QuickActionCard } from "@/components/admin/QuickActionCard";

export default function DayibasiDashboard() {
	return (
		<div className="space-y-6">
			<PageHeader title="Dayıbaşı Dashboard" subtitle="Your team's overview" />
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<MetricCard title="Team Members" value="12" icon={<Users className="w-6 h-6" />} />
				<MetricCard title="Today's Jobs" value="8" icon={<ClipboardCheck className="w-6 h-6" />} />
				<MetricCard title="Completion Rate" value="92%" change={{ value: 1.3, positive: true }} icon={<CheckCircle className="w-6 h-6" />} />
				<MetricCard title="Team Rating" value="4.7" subtitle="Out of 5" icon={<Award className="w-6 h-6" />} />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<QuickActionCard title="Mark job complete" href="/dayibasi/jobs/today" />
				<QuickActionCard title="Take attendance" href="/dayibasi/attendance" />
				<QuickActionCard title="Message team" href="/dayibasi/messages" />
				<QuickActionCard title="Report issue" href="/dayibasi/jobs/today" />
			</div>
		</div>
	);
}


