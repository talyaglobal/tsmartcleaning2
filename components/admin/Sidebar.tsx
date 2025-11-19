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

const ROOT_ADMIN_MENU: NavItem[] = [
	{ name: "Dashboard", icon: LayoutDashboard, path: "/root-admin" },
	{ name: "System Analytics", icon: BarChart3, path: "/root-admin/analytics" },
	{ name: "Directory", icon: MapPinned, path: "/root-admin/directory" },
	{ name: "Companies", icon: Building2, path: "/root-admin/companies" },
	{ name: "Reviews", icon: Star, path: "/root-admin/reviews" },
	{ name: "Booking Requests", icon: ClipboardList, path: "/root-admin/booking-requests" },
	{ name: "Insurance", icon: ShieldCheck, path: "/root-admin/insurance" },
	{ name: "Claims", icon: FileCheck2, path: "/root-admin/claims" },
	{ name: "Policies", icon: IdCard, path: "/root-admin/policies" },
	{ name: "Notifications", icon: Bell, path: "/root-admin/notifications" },
	{ name: "Payouts", icon: Wallet, path: "/root-admin/payouts" },
	{ name: "Revenue Share Rules", icon: DollarSign, path: "/root-admin/revenue-share-rules" },
	{ name: "Reports", icon: FileBarChart, path: "/root-admin/reports" },
	{ name: "All Users", icon: Users, path: "/root-admin/users" },
	{ name: "Tenants", icon: Building2, path: "/root-admin/tenants" },
	{ name: "Territories", icon: Map, path: "/root-admin/territories" },
	{ name: "Branding", icon: Settings, path: "/root-admin/branding" },
	{ name: "Team Management", icon: UsersRound, path: "/root-admin/team" },
	{ name: "NGO/Agencies", icon: Home, path: "/root-admin/agencies" },
	{ name: "Financial Overview", icon: DollarSign, path: "/root-admin/finances" },
	{ name: "System Settings", icon: Settings, path: "/root-admin/settings" },
	{ name: "Audit Logs", icon: ScrollText, path: "/root-admin/logs" },
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

export const roleToMenu = (role: UserRole): NavItem[] => {
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
					{items.map((item) => {
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


