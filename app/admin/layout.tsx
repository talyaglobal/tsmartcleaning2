"use client";

import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { UserRole } from "@/lib/auth/roles";
import { useAuth } from "@/components/auth/AuthProvider";
import { RoleGate } from "@/components/auth/RoleGate";

export default function AdminSectionLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { user } = useAuth();
	const role = user?.role ?? UserRole.CLEANING_COMPANY;

	// Allow any signed-in role to view admin pages,
	// but prefer using the new role-specific sections going forward.
	return (
		<RoleGate allow={[UserRole.ROOT_ADMIN, UserRole.CLEANING_COMPANY, UserRole.AMBASSADOR, UserRole.CLEANING_LADY, UserRole.NGO_AGENCY, UserRole.TSMART_TEAM]}>
			<AdminLayout role={role}>{children}</AdminLayout>
		</RoleGate>
	);
}


