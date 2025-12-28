import { Button } from "@/components/ui/button";
import {
	AlertCircle,
	CheckCircle2,
	Briefcase,
	Trophy,
	Activity,
	UserPlus,
} from "lucide-react";
import Link from "next/link";

export type ActivityItem = {
	type: string;
	description: string;
	timestamp: string;
};

export function RecentActivityFeed({ activities }: { activities: ActivityItem[] }) {
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
		<div className="rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h3>
				<Link href="/root-admin/logs">
					<Button variant="ghost" size="sm" className="text-xs">
						View all
					</Button>
				</Link>
			</div>
			<div className="space-y-3 max-h-96 overflow-y-auto">
				{activities.length === 0 ? (
					<p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No recent activity</p>
				) : (
					activities.map((activity, idx) => (
						<div key={idx} className="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded transition-colors">
							<div className="mt-0.5">{getActivityIcon(activity.type)}</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm text-slate-900 dark:text-slate-100">{activity.description}</p>
								<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatTimestamp(activity.timestamp)}</p>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

