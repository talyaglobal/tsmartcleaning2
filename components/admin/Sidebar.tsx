"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/auth/roles";
import Image from "next/image";
import {
	LayoutDashboard,
	Building2,
	Users,
	UsersRound,
	DollarSign,
	Settings,
	FileText,
	ScrollText,
	UserCog,
	UserCheck,
	ClipboardList,
	Calendar,
	TrendingUp,
	Receipt,
	UserPlus,
	Home,
	History,
	Award,
	ClipboardCheck,
	MessageSquare,
	Briefcase,
	Clock,
	GraduationCap,
	Wallet,
	BarChart3,
	Headphones,
	FileEdit,
	Megaphone,
	Map,
	MapPinned,
	Star,
	ShieldCheck,
	FileCheck2,
	IdCard,
	Bell,
	FileBarChart,
	Building,
	CreditCard,
	Trophy,
	Coins,
	Medal,
	Target,
	CheckSquare,
	BarChart,
	Database,
	Code,
	BookOpen,
	HelpCircle,
	MessageCircle,
	Wrench,
	Plug,
} from "lucide-react";
import React from "react";

type SidebarProps = {
	role: UserRole;
	collapsed?: boolean;
};

type NavItem = {
	name: string;
	path: string;
	icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
	title: string;
	items: NavItem[];
};

type MenuItem = NavItem | NavSection;

const isNavSection = (item: MenuItem): item is NavSection => {
	return "title" in item && "items" in item;
};

const ROOT_ADMIN_MENU: MenuItem[] = [
	{ name: "Dashboard", icon: LayoutDashboard, path: "/root-admin" },
	{
		title: "Analytics & Insights",
		items: [
			{ name: "System Analytics", icon: BarChart3, path: "/root-admin/analytics" },
		],
	},
	{ name: "Directory", icon: MapPinned, path: "/root-admin/directory" },
	{
		title: "User Management",
		items: [
			{ name: "Cleaning Companies", icon: Building2, path: "/root-admin/companies" },
			{ name: "Cleaners", icon: UserCheck, path: "/root-admin/users?type=cleaners" },
			{ name: "Admins & Roles", icon: UserCog, path: "/root-admin/users?type=admins" },
			{ name: "All Users", icon: Users, path: "/root-admin/users" },
		],
	},
	{
		title: "Business Operations",
		items: [
			{ name: "Job Management", icon: ClipboardList, path: "/root-admin/booking-requests" },
			{ name: "Payments & Billing", icon: Wallet, path: "/root-admin/payouts" },
			{ name: "Financial Overview", icon: DollarSign, path: "/root-admin/finances" },
			{ name: "Support & Tickets", icon: MessageCircle, path: "/root-admin/support" },
		],
	},
	{ name: "Reviews", icon: Star, path: "/root-admin/reviews" },
	{ name: "Notifications & Alerts", icon: Bell, path: "/root-admin/notifications" },
	{ name: "Insurance", icon: ShieldCheck, path: "/root-admin/insurance" },
	{ name: "Claims", icon: FileCheck2, path: "/root-admin/claims" },
	{ name: "Policies", icon: IdCard, path: "/root-admin/policies" },
	{ name: "Revenue Share Rules", icon: DollarSign, path: "/root-admin/revenue-share-rules" },
	{
		title: "Gamification",
		items: [
			{ name: "Gamification Dashboard", icon: Trophy, path: "/root-admin/gamification" },
			{ name: "Points System", icon: Coins, path: "/root-admin/gamification/points" },
			{ name: "Badges & Achievements", icon: Award, path: "/root-admin/gamification/badges" },
			{ name: "Levels & Progression", icon: TrendingUp, path: "/root-admin/gamification/levels" },
			{ name: "Leaderboards", icon: Medal, path: "/root-admin/gamification/leaderboards" },
			{ name: "Challenges & Quests", icon: Target, path: "/root-admin/gamification/challenges" },
		],
	},
	{
		title: "Progress Tracking",
		items: [
			{ name: "GTM Strategy Progress", icon: Map, path: "/root-admin/progress/gtm-strategy" },
			{ name: "Team TODO Progress", icon: CheckSquare, path: "/root-admin/progress/team-todo" },
			{ name: "KPI Dashboard", icon: BarChart, path: "/root-admin/progress/kpi" },
		],
	},
	{
		title: "Reports & Exports",
		items: [
			{ name: "Standard Reports", icon: FileBarChart, path: "/root-admin/reports" },
		],
	},
	{
		title: "System Configuration",
		items: [
			{ name: "Platform Settings", icon: Settings, path: "/root-admin/settings" },
			{ name: "Gamification Rules", icon: Wrench, path: "/root-admin/settings/gamification" },
			{ name: "Integrations", icon: Plug, path: "/root-admin/settings/integrations" },
		],
	},
	{
		title: "Admin Tools",
		items: [
			{ name: "Database Management", icon: Database, path: "/root-admin/tools/database" },
			{ name: "System Logs", icon: ScrollText, path: "/root-admin/logs" },
			{ name: "Developer Tools", icon: Code, path: "/root-admin/tools/developer" },
		],
	},
	{ name: "Documentation", icon: BookOpen, path: "/root-admin/docs" },
	{ name: "Tenants", icon: Building2, path: "/root-admin/tenants" },
	{ name: "Territories", icon: Map, path: "/root-admin/territories" },
	{ name: "Branding", icon: Settings, path: "/root-admin/branding" },
	{ name: "Team Management", icon: UsersRound, path: "/root-admin/team" },
	{ name: "NGO/Agencies", icon: Home, path: "/root-admin/agencies" },
];

const COMPANY_MENU: NavItem[] = [
	{ name: "Dashboard", icon: LayoutDashboard, path: "/company/dashboard" },
	{ name: "Properties", icon: Building, path: "/company/properties" },
	{ name: "User Management", icon: UsersRound, path: "/company/users" },
	{ name: "My Teams", icon: Users, path: "/company/teams" },
	{ name: "Ambassador Management", icon: UserCog, path: "/company/ambassadors" },
	{ name: "Cleaners", icon: UserCheck, path: "/company/cleaners" },
	{ name: "Job Assignments", icon: ClipboardList, path: "/company/jobs" },
	{ name: "Schedule", icon: Calendar, path: "/company/schedule" },
	{ name: "Performance", icon: TrendingUp, path: "/company/performance" },
	{ name: "Invoices & Payments", icon: Receipt, path: "/company/invoices" },
	{ name: "Billing", icon: CreditCard, path: "/company/billing" },
	{ name: "Recruitment", icon: UserPlus, path: "/company/recruitment" },
	{ name: "Settings", icon: Settings, path: "/company/settings" },
];

const AMBASSADOR_MENU: NavItem[] = [
	{ name: "Dashboard", icon: LayoutDashboard, path: "/ambassador/dashboard" },
	{ name: "My Team", icon: Users, path: "/ambassador/team" },
	{ name: "Today's Jobs", icon: ClipboardCheck, path: "/ambassador/jobs/today" },
	{ name: "Job History", icon: History, path: "/ambassador/jobs/history" },
	{ name: "Schedule", icon: Calendar, path: "/ambassador/schedule" },
	{ name: "Team Performance", icon: Award, path: "/ambassador/performance" },
	{ name: "Attendance", icon: ClipboardCheck, path: "/ambassador/attendance" },
	{ name: "Messages", icon: MessageSquare, path: "/ambassador/messages" },
	{ name: "Profile", icon: UsersRound, path: "/ambassador/profile" },
];

const CLEANER_MENU: NavItem[] = [
	{ name: "Dashboard", icon: Home, path: "/cleaner/dashboard" },
	{ name: "My Jobs", icon: Briefcase, path: "/cleaner/jobs" },
	{ name: "Schedule", icon: Calendar, path: "/cleaner/schedule" },
	{ name: "Timesheet", icon: Clock, path: "/cleaner/timesheet" },
	{ name: "Earnings", icon: Wallet, path: "/cleaner/earnings" },
	{ name: "Training", icon: GraduationCap, path: "/cleaner/training" },
	{ name: "Messages", icon: MessageSquare, path: "/cleaner/messages" },
	{ name: "Profile", icon: UsersRound, path: "/cleaner/profile" },
];

const AGENCY_MENU: NavItem[] = [
	{ name: "Dashboard", icon: LayoutDashboard, path: "/agency/dashboard" },
	{ name: "Candidates", icon: Users, path: "/agency/candidates" },
	{ name: "Placements", icon: UserCheck, path: "/agency/placements" },
	{ name: "Companies", icon: Building2, path: "/agency/companies" },
	{ name: "Job Requests", icon: Briefcase, path: "/agency/job-requests" },
	{ name: "Training Programs", icon: GraduationCap, path: "/agency/training" },
	{ name: "Reports", icon: FileText, path: "/agency/reports" },
	{ name: "Invoices", icon: Receipt, path: "/agency/invoices" },
	{ name: "Settings", icon: Settings, path: "/agency/settings" },
];

const TSMART_TEAM_MENU: NavItem[] = [
	{ name: "Dashboard", icon: LayoutDashboard, path: "/team/dashboard" },
	{ name: "Platform Stats", icon: BarChart3, path: "/team/stats" },
	{ name: "Support Tickets", icon: Headphones, path: "/team/support" },
	{ name: "Companies", icon: Building2, path: "/team/companies" },
	{ name: "Content Management", icon: FileEdit, path: "/team/content" },
	{ name: "Announcements", icon: Megaphone, path: "/team/announcements" },
	{ name: "Reports", icon: FileText, path: "/team/reports" },
	{ name: "Settings", icon: Settings, path: "/team/settings" },
];

const PARTNER_MENU: NavItem[] = [
	{ name: "Dashboard", icon: LayoutDashboard, path: "/partner/dashboard" },
	{ name: "Reports", icon: FileText, path: "/partner/reports" },
	{ name: "Financials", icon: DollarSign, path: "/partner/finances" },
	{ name: "Settings", icon: Settings, path: "/partner/settings" },
];

export const roleToMenu = (role: UserRole): MenuItem[] => {
	switch (role) {
		case UserRole.ROOT_ADMIN:
			return ROOT_ADMIN_MENU;
		case UserRole.CLEANING_COMPANY:
			return COMPANY_MENU;
		case UserRole.AMBASSADOR:
			return AMBASSADOR_MENU;
		case UserRole.CLEANING_LADY:
			return CLEANER_MENU;
		case UserRole.NGO_AGENCY:
			return AGENCY_MENU;
		case UserRole.TSMART_TEAM:
			return TSMART_TEAM_MENU;
		case UserRole.PARTNER_ADMIN:
			return PARTNER_MENU;
		default:
			return [];
	}
};

export function Sidebar({ role, collapsed }: SidebarProps) {
	const pathname = usePathname();
	const items = roleToMenu(role);

	return (
		<aside
			className={cn(
				"bg-slate-800 text-slate-200 h-screen sticky top-0",
				collapsed ? "w-16" : "w-64",
				"shrink-0"
			)}
		>
			<div className="h-16 flex items-center px-4 border-b border-slate-700">
				{collapsed ? (
					<Link href="/" className="flex items-center">
						<Image src="/tsmart_cleaning_orange.png" alt="Logo" width={28} height={28} />
					</Link>
				) : (
					<Link href="/" className="flex items-center">
						<Image src="/tsmart_cleaning_orange.png" alt="Logo" width={160} height={28} />
					</Link>
				)}
			</div>
			<nav className="py-3">
				<ul className="space-y-1">
					{items.map((item, index) => {
						if (isNavSection(item)) {
							return (
								<li key={`section-${index}`} className={collapsed ? "" : "mt-4 first:mt-0"}>
									{!collapsed && (
										<div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
											{item.title}
										</div>
									)}
									<ul className={collapsed ? "" : "space-y-1"}>
										{item.items.map((navItem) => {
											const Icon = navItem.icon;
											const active = pathname?.startsWith(navItem.path);
											return (
												<li key={navItem.path}>
													<Link
														href={navItem.path}
														className={cn(
															"flex items-center gap-3 px-4 py-2 transition-colors",
															active
																? "bg-slate-700 text-white"
																: "text-slate-300 hover:text-white hover:bg-slate-700"
														)}
														aria-current={active ? "page" : undefined}
													>
														<Icon className="w-5 h-5" />
														{!collapsed && <span>{navItem.name}</span>}
													</Link>
												</li>
											);
										})}
									</ul>
								</li>
							);
						} else {
						const Icon = item.icon;
						const active = pathname?.startsWith(item.path);
						return (
							<li key={item.path}>
								<Link
									href={item.path}
									className={cn(
										"flex items-center gap-3 px-4 py-2 transition-colors",
										active
											? "bg-slate-700 text-white"
											: "text-slate-300 hover:text-white hover:bg-slate-700"
									)}
									aria-current={active ? "page" : undefined}
								>
									<Icon className="w-5 h-5" />
									{!collapsed && <span>{item.name}</span>}
								</Link>
							</li>
						);
						}
					})}
				</ul>
			</nav>
			<div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-4">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-full bg-slate-600" />
					{!collapsed && (
						<div className="text-sm">
							<p className="font-medium">Signed in</p>
							<p className="text-slate-400 capitalize">{role.replaceAll("_", " ")}</p>
						</div>
					)}
				</div>
			</div>
		</aside>
	);
}


