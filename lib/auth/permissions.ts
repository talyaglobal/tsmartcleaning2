import { UserRole } from "./roles";

export const rolePermissions: Record<UserRole, string[]> = {
	[UserRole.ROOT_ADMIN]: ["*"],
	[UserRole.PARTNER_ADMIN]: [
		"view_all_companies",
		"view_reports",
		"manage_invoices",
		"manage_teams",
		"manage_cleaners",
		"assign_jobs",
	],
	[UserRole.REGIONAL_MANAGER]: [
		"view_companies",
		"view_reports",
		"manage_teams",
		"assign_jobs",
	],
	[UserRole.CLEANING_COMPANY]: [
		"view_own_company",
		"manage_teams",
		"manage_cleaners",
		"manage_dayibasi",
		"assign_jobs",
		"view_reports",
		"manage_invoices",
	],
	[UserRole.DAYIBASI]: [
		"view_own_team",
		"manage_team_members",
		"view_jobs",
		"update_job_status",
		"mark_attendance",
		"send_messages",
	],
	[UserRole.CLEANING_LADY]: ["view_own_profile", "view_assigned_jobs", "clock_in_out", "view_earnings", "request_time_off"],
	[UserRole.NGO_AGENCY]: [
		"manage_candidates",
		"view_companies",
		"manage_placements",
		"view_job_requests",
		"manage_training",
	],
	[UserRole.TSMART_TEAM]: [
		"view_platform_stats",
		"manage_support_tickets",
		"manage_content",
		"view_all_companies",
		"create_announcements",
	],
};

export function hasPermission(role: UserRole, permission: string): boolean {
	const perms = rolePermissions[role] ?? [];
	return perms.includes("*") || perms.includes(permission);
}


