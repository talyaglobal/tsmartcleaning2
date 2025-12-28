import Link from "next/link";
import {
	Target,
	Bell,
	FileText,
	Activity,
	UserPlus,
} from "lucide-react";

type QuickAction = {
	title: string;
	description: string;
	icon: React.ReactNode;
	href: string;
};

export function QuickActionsPanel() {
	const actions: QuickAction[] = [
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
		<div className="rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-6">
			<h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Actions</h3>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{actions.map((action, idx) => (
					<Link
						key={idx}
						href={action.href}
						className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
					>
						<div className="text-slate-500 dark:text-slate-400">{action.icon}</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-slate-900 dark:text-slate-100">{action.title}</p>
							<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{action.description}</p>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}

